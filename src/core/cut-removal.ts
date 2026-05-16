/**
 * Variant C — Greedy cut-removal recut.
 *
 * Per PolyZamboni (`docs/references/takahashi.md`), invert the
 * standard MST-plus-recut control flow:
 *
 *   1. Start by marking every dual-graph edge as a cut. Every
 *      face is its own piece, laid out in its canonical local
 *      frame.
 *   2. Sort the cuts by some heuristic (we use 3D edge length
 *      descending — long edges have the highest cutting cost, so
 *      try them first; documented in the findings doc).
 *   3. Walk the sorted list. For each cut, try to fold it back:
 *      apply the rigid 2D transform that aligns the two adjacent
 *      faces across the shared edge, and check whether the
 *      resulting merged component is overlap-free. If yes, commit
 *      (turn the cut into a fold; union the two components). If
 *      no, leave it as a cut. Skip cycles (faces already in the
 *      same component).
 *
 * Opposite inductive bias from v2: "start fragmented, merge what's
 * safe" instead of "start connected, cut what overlaps." Output
 * shape mirrors v2's `RecutResult` so the downstream chain (tabs
 * → paginate → emit) consumes it unchanged.
 */

import polygonClipping from "polygon-clipping";
import type { Polygon } from "polygon-clipping";

import type { Adjacency, DualGraph } from "./adjacency.js";
import type { FlatFace, Layout2D, Vec2 } from "./flatten.js";
import type { Mesh3D, Vec3 } from "./mesh.js";
import type { Piece, RecutResult } from "./recut.js";
import { makeUnionFind } from "./union-find.js";

/* ---------- 3D helpers ---------- */

const sub3 = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const dot3 = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a: Vec3): number => Math.sqrt(dot3(a, a));

const edgeLengthMesh = (mesh: Mesh3D, adj: Adjacency): number =>
  norm3(sub3(mesh.vertices[adj.edge[0]], mesh.vertices[adj.edge[1]]));

/* ---------- Canonical layout for a single face ---------- */

/**
 * Place a single face in its own canonical 2D frame:
 *   v0 at (0, 0)
 *   v1 on the +x axis at distance |v0-v1|
 *   v2 in the upper half-plane (y > 0)
 *
 * Same convention `buildLayout` uses for its root face.
 */
const canonicalLayout = (mesh: Mesh3D, face: number): FlatFace => {
  const [i0, i1, i2] = mesh.faces[face];
  const p0 = mesh.vertices[i0];
  const p1 = mesh.vertices[i1];
  const p2 = mesh.vertices[i2];
  const d01 = norm3(sub3(p1, p0));
  const d02 = norm3(sub3(p2, p0));
  const d12 = norm3(sub3(p2, p1));
  const Pa: Vec2 = [0, 0];
  const Pb: Vec2 = [d01, 0];
  const x = (d01 * d01 + d02 * d02 - d12 * d12) / (2 * d01);
  const y2 = d02 * d02 - x * x;
  const y = Math.sqrt(Math.max(0, y2));
  const Pc: Vec2 = [x, y];
  return {
    vertices: [i0, i1, i2],
    positions: [Pa, Pb, Pc],
  };
};

/* ---------- 2D rigid transform ---------- */

interface Rigid {
  apply: (face: FlatFace) => FlatFace;
}

const signed = (p0: Vec2, p1: Vec2, p: Vec2): number =>
  (p1[0] - p0[0]) * (p[1] - p0[1]) - (p1[1] - p0[1]) * (p[0] - p0[0]);

/**
 * Build the rigid 2D transform that aligns face B (in its
 * component-B frame) so that its shared edge with face A coincides
 * with face A's shared edge (in A's frame), and the two apexes
 * sit on opposite sides of the shared edge.
 */
const buildTransform = (
  faceA: FlatFace,
  faceB: FlatFace,
  sharedEdge: [number, number],
): Rigid => {
  const [v0, v1] = sharedEdge;
  let pA0: Vec2 | null = null;
  let pA1: Vec2 | null = null;
  let pAApex: Vec2 | null = null;
  for (let i = 0; i < 3; i++) {
    const v = faceA.vertices[i];
    if (v === v0) pA0 = faceA.positions[i];
    else if (v === v1) pA1 = faceA.positions[i];
    else pAApex = faceA.positions[i];
  }
  let pB0: Vec2 | null = null;
  let pB1: Vec2 | null = null;
  let pBApex: Vec2 | null = null;
  for (let i = 0; i < 3; i++) {
    const v = faceB.vertices[i];
    if (v === v0) pB0 = faceB.positions[i];
    else if (v === v1) pB1 = faceB.positions[i];
    else pBApex = faceB.positions[i];
  }
  if (!pA0 || !pA1 || !pAApex || !pB0 || !pB1 || !pBApex) {
    throw new Error("buildTransform: shared edge not found in both faces.");
  }

  const ux = pB1[0] - pB0[0];
  const uy = pB1[1] - pB0[1];
  const vx = pA1[0] - pA0[0];
  const vy = pA1[1] - pA0[1];
  const uLen = Math.sqrt(ux * ux + uy * uy);
  const vLen = Math.sqrt(vx * vx + vy * vy);
  const cosT = (ux * vx + uy * vy) / (uLen * vLen);
  const sinT = (ux * vy - uy * vx) / (uLen * vLen);

  const apply1 = (p: Vec2): Vec2 => {
    const dx = p[0] - pB0![0];
    const dy = p[1] - pB0![1];
    const rx = cosT * dx - sinT * dy;
    const ry = sinT * dx + cosT * dy;
    return [rx + pA0![0], ry + pA0![1]];
  };

  const tApexB = apply1(pBApex);
  const sideA = signed(pA0, pA1, pAApex);
  const sideB = signed(pA0, pA1, tApexB);
  const needReflect = sideA * sideB > 0;

  let apply2: (p: Vec2) => Vec2;
  if (!needReflect) {
    apply2 = apply1;
  } else {
    const dx = pA1[0] - pA0[0];
    const dy = pA1[1] - pA0[1];
    const dLen = Math.sqrt(dx * dx + dy * dy);
    const ex = dx / dLen;
    const ey = dy / dLen;
    apply2 = (p: Vec2): Vec2 => {
      const r = apply1(p);
      const qx = r[0] - pA0![0];
      const qy = r[1] - pA0![1];
      const pp = qx * ex + qy * ey;
      const ppx = pp * ex;
      const ppy = pp * ey;
      const perpX = qx - ppx;
      const perpY = qy - ppy;
      return [pA0![0] + ppx - perpX, pA0![1] + ppy - perpY];
    };
  }

  return {
    apply: (face: FlatFace): FlatFace => ({
      vertices: face.vertices,
      positions: [
        apply2(face.positions[0]),
        apply2(face.positions[1]),
        apply2(face.positions[2]),
      ],
    }),
  };
};

/* ---------- Bbox cache for cheap overlap prefilter ---------- */

interface Bbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const faceBbox = (face: FlatFace): Bbox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of face.positions) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
};

const bboxesOverlap = (a: Bbox, b: Bbox): boolean =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;

const faceToGeom = (face: FlatFace): Polygon => [
  [face.positions[0], face.positions[1], face.positions[2]],
];

/**
 * True if `transformedB` faces overlap any of `existingA` faces. If
 * the underlying polygon-clipping operation throws (numerical edge
 * cases when two triangles share an edge with floating-point near-
 * coincidence, which is unavoidable in the cut-removal merge: every
 * accepted fold places two triangles edge-coincident by
 * construction), treat it as a conservative "overlap" and reject
 * the merge. The spike then continues with the next edge instead of
 * aborting the whole variant.
 */
const anyOverlap = (
  existingA: FlatFace[],
  transformedB: FlatFace[],
): boolean => {
  const bboxA = existingA.map(faceBbox);
  const bboxB = transformedB.map(faceBbox);
  for (let i = 0; i < transformedB.length; i++) {
    const geomB = faceToGeom(transformedB[i]);
    for (let j = 0; j < existingA.length; j++) {
      if (!bboxesOverlap(bboxA[j], bboxB[i])) continue;
      try {
        const result = polygonClipping.intersection(
          geomB,
          faceToGeom(existingA[j]),
        );
        if (result.length > 0) return true;
      } catch {
        return true;
      }
    }
  }
  return false;
};

/* ---------- Main entry point ---------- */

export interface CutRemovalOptions {
  /**
   * Optional cap on total wall time per model in milliseconds.
   * When elapsed exceeds this, the variant stops accepting folds
   * and finalises with whatever has been merged so far. 0 = no
   * cap. Default 0.
   */
  timeBudgetMs?: number;
}

export interface CutRemovalResult extends RecutResult {
  /** Adjacencies that were tested but rejected by the overlap check. */
  rejected: number;
  /** Adjacencies skipped because the two faces were already in the same component. */
  cyclesSkipped: number;
  /** Adjacencies accepted (turned from cut into fold). */
  accepted: number;
  /** Whether the time budget cut the run short. */
  timedOut: boolean;
}

export function runCutRemoval(
  mesh: Mesh3D,
  dual: DualGraph,
  options: CutRemovalOptions = {},
): CutRemovalResult {
  const start = Date.now();
  const budget = options.timeBudgetMs ?? 0;
  const faceCount = mesh.faces.length;

  const positions: FlatFace[] = new Array(faceCount);
  for (let f = 0; f < faceCount; f++) positions[f] = canonicalLayout(mesh, f);

  const componentFaces = new Map<number, number[]>();
  const componentFolds = new Map<number, Adjacency[]>();
  for (let f = 0; f < faceCount; f++) {
    componentFaces.set(f, [f]);
    componentFolds.set(f, []);
  }

  const uf = makeUnionFind(faceCount);

  const order = dual.adjacencies.map((_, i) => i);
  const lengths = dual.adjacencies.map((a) => edgeLengthMesh(mesh, a));
  order.sort((a, b) => lengths[b] - lengths[a]);

  let accepted = 0;
  let rejected = 0;
  let cyclesSkipped = 0;
  const isFold = new Array<boolean>(dual.adjacencies.length).fill(false);
  let timedOut = false;

  for (const idx of order) {
    if (budget > 0 && Date.now() - start > budget) {
      timedOut = true;
      break;
    }
    const adj = dual.adjacencies[idx];
    const rA = uf.find(adj.faceA);
    const rB = uf.find(adj.faceB);
    if (rA === rB) {
      cyclesSkipped++;
      continue;
    }

    const facesA = componentFaces.get(rA)!;
    const facesB = componentFaces.get(rB)!;
    let anchor = rA;
    let mover = rB;
    let anchorFaces = facesA;
    let moverFaces = facesB;
    if (facesB.length > facesA.length) {
      anchor = rB;
      mover = rA;
      anchorFaces = facesB;
      moverFaces = facesA;
    }

    const anchorRoot = uf.find(anchor);
    const faceInAnchor = uf.find(adj.faceA) === anchorRoot ? adj.faceA : adj.faceB;
    const faceInMover = faceInAnchor === adj.faceA ? adj.faceB : adj.faceA;

    let T: Rigid;
    try {
      T = buildTransform(
        positions[faceInAnchor],
        positions[faceInMover],
        adj.edge,
      );
    } catch {
      rejected++;
      continue;
    }

    const transformedMover = moverFaces.map((f) => T.apply(positions[f]));
    const anchorLayout = anchorFaces.map((f) => positions[f]);

    if (anyOverlap(anchorLayout, transformedMover)) {
      rejected++;
      continue;
    }

    for (let i = 0; i < moverFaces.length; i++) {
      positions[moverFaces[i]] = transformedMover[i];
    }
    isFold[idx] = true;
    uf.union(anchor, mover);
    const newRoot = uf.find(anchor);
    const otherRoot = newRoot === anchor ? mover : anchor;
    const mergedFaces = anchorFaces.concat(moverFaces);
    mergedFaces.sort((a, b) => a - b);
    componentFaces.set(newRoot, mergedFaces);
    componentFaces.delete(otherRoot);
    const mergedFolds = (componentFolds.get(anchor) ?? []).concat(
      componentFolds.get(mover) ?? [],
    );
    mergedFolds.push(adj);
    componentFolds.set(newRoot, mergedFolds);
    if (otherRoot !== newRoot) componentFolds.delete(otherRoot);
    accepted++;
  }

  const pieces: Piece[] = [];
  const seenRoots = new Set<number>();
  for (let f = 0; f < faceCount; f++) {
    const r = uf.find(f);
    if (seenRoots.has(r)) continue;
    seenRoots.add(r);
    const faces = componentFaces.get(r)!.slice().sort((a, b) => a - b);
    const layout: Layout2D = { faces: faces.map((mf) => positions[mf]) };
    const folds = componentFolds.get(r) ?? [];
    pieces.push({ layout, faces, folds });
  }
  pieces.sort((a, b) => a.faces[0] - b.faces[0]);

  const cuts: Adjacency[] = [];
  for (let i = 0; i < dual.adjacencies.length; i++) {
    if (!isFold[i]) cuts.push(dual.adjacencies[i]);
  }

  return { pieces, cuts, rejected, accepted, cyclesSkipped, timedOut };
}
