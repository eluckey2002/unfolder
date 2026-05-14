/**
 * Flatten stage: walk the spanning tree from its root, placing each
 * face on the 2D plane via rigid unfolding. Every triangle keeps its
 * original size and shape; only dihedral angles flatten to 180°.
 *
 * Per ADR 0001's pipeline architecture, this is a pure function from
 * (Mesh3D, SpanningTree) to Layout2D.
 */

import type { Adjacency } from "./adjacency.js";
import type { Mesh3D, Vec3 } from "./mesh.js";
import type { SpanningTree } from "./spanning-tree.js";

export type Vec2 = [number, number];

export interface FlatFace {
  vertices: [number, number, number];
  positions: [Vec2, Vec2, Vec2];
}

export interface Layout2D {
  faces: FlatFace[];
}

const COINCIDENT_EPS = 1e-12;
const SIDE_EPS = 1e-9;

const len3D = (vertices: Vec3[], a: number, b: number): number => {
  const [ax, ay, az] = vertices[a];
  const [bx, by, bz] = vertices[b];
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const canonicalPairKey = (a: number, b: number): string =>
  a < b ? `${a},${b}` : `${b},${a}`;

/** Signed area test: which side of the directed line p0->p1 does p sit on? */
const side = (p0: Vec2, p1: Vec2, p: Vec2): number => {
  const ux = p1[0] - p0[0];
  const uy = p1[1] - p0[1];
  const vx = p[0] - p0[0];
  const vy = p[1] - p0[1];
  return ux * vy - uy * vx;
};

/**
 * Circle-circle intersection: the two possible positions of a point
 * at distance d0 from p0 and d1 from p1. Returns both solutions; they
 * are exact reflections across the line through p0 and p1.
 */
export function getThirdPoint(
  p0: Vec2,
  p1: Vec2,
  d0: number,
  d1: number,
): [Vec2, Vec2] {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.sqrt(dx * dx + dy * dy);
  if (L === 0) {
    throw new Error("getThirdPoint: coincident points p0 === p1.");
  }
  const a = (d0 * d0 - d1 * d1 + L * L) / (2 * L);
  let h_sq = d0 * d0 - a * a;
  if (h_sq < 0) {
    if (-h_sq < COINCIDENT_EPS) {
      h_sq = 0;
    } else {
      throw new Error(
        `getThirdPoint: circles do not intersect (h² = ${h_sq}).`,
      );
    }
  }
  const h = Math.sqrt(h_sq);
  const pmx = p0[0] + (a / L) * dx;
  const pmy = p0[1] + (a / L) * dy;
  const perpX = -dy / L;
  const perpY = dx / L;
  return [
    [pmx + h * perpX, pmy + h * perpY],
    [pmx - h * perpX, pmy - h * perpY],
  ];
}

export function buildLayout(mesh: Mesh3D, tree: SpanningTree): Layout2D {
  const faceCount = mesh.faces.length;

  const foldByPair = new Map<string, Adjacency>();
  for (const fold of tree.folds) {
    foldByPair.set(canonicalPairKey(fold.faceA, fold.faceB), fold);
  }

  const children: number[][] = Array.from({ length: faceCount }, () => []);
  for (let i = 0; i < faceCount; i++) {
    const p = tree.parent[i];
    if (p !== -1) children[p].push(i);
  }

  const faces: FlatFace[] = new Array(faceCount);

  const [ra, rb, rc] = mesh.faces[tree.root];
  const Pa: Vec2 = [0, 0];
  const Pb: Vec2 = [len3D(mesh.vertices, ra, rb), 0];
  const [rootCand1, rootCand2] = getThirdPoint(
    Pa,
    Pb,
    len3D(mesh.vertices, ra, rc),
    len3D(mesh.vertices, rb, rc),
  );
  const Pc: Vec2 = rootCand1[1] >= rootCand2[1] ? rootCand1 : rootCand2;
  faces[tree.root] = {
    vertices: [ra, rb, rc],
    positions: [Pa, Pb, Pc],
  };

  const queue: number[] = [tree.root];
  while (queue.length > 0) {
    const p = queue.shift() as number;
    for (const f of children[p]) {
      const fold = foldByPair.get(canonicalPairKey(f, p));
      if (!fold) {
        throw new Error(
          `buildLayout: no fold adjacency for face pair (${f}, ${p}).`,
        );
      }
      const [s0, s1] = fold.edge;

      const parentFace = faces[p];
      let P_s0: Vec2 | null = null;
      let P_s1: Vec2 | null = null;
      let P_parentApex: Vec2 | null = null;
      for (let i = 0; i < 3; i++) {
        const v = parentFace.vertices[i];
        if (v === s0) P_s0 = parentFace.positions[i];
        else if (v === s1) P_s1 = parentFace.positions[i];
        else P_parentApex = parentFace.positions[i];
      }
      if (!P_s0 || !P_s1 || !P_parentApex) {
        throw new Error(
          `buildLayout: shared edge (${s0}, ${s1}) not found in parent face ${p}.`,
        );
      }

      const childVerts = mesh.faces[f];
      const apexV = childVerts.find((v) => v !== s0 && v !== s1);
      if (apexV === undefined) {
        throw new Error(
          `buildLayout: child face ${f} has no apex distinct from shared edge.`,
        );
      }

      const [candA, candB] = getThirdPoint(
        P_s0,
        P_s1,
        len3D(mesh.vertices, apexV, s0),
        len3D(mesh.vertices, apexV, s1),
      );

      const sideParent = side(P_s0, P_s1, P_parentApex);
      const sideA = side(P_s0, P_s1, candA);
      const sideB = side(P_s0, P_s1, candB);

      let chosen: Vec2;
      if (Math.abs(sideA) < SIDE_EPS) {
        chosen = candB;
      } else if (Math.abs(sideB) < SIDE_EPS) {
        chosen = candA;
      } else {
        chosen = Math.sign(sideA) !== Math.sign(sideParent) ? candA : candB;
      }

      const positions: [Vec2, Vec2, Vec2] = [
        [0, 0],
        [0, 0],
        [0, 0],
      ];
      for (let i = 0; i < 3; i++) {
        const v = childVerts[i];
        if (v === s0) positions[i] = P_s0;
        else if (v === s1) positions[i] = P_s1;
        else positions[i] = chosen;
      }

      faces[f] = { vertices: childVerts, positions };
      queue.push(f);
    }
  }

  return { faces };
}
