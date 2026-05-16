/**
 * Tabs stage: turn a `RecutResult` into a renderable model — every
 * piece's edges classified fold/cut, every cut carrying a label
 * shared with its mating side, and one trapezoidal glue tab per cut
 * on a deterministic side. Pure function; serialization lives in
 * `emit-svg.ts`.
 */

import polygonClipping from "polygon-clipping";
import type { Polygon } from "polygon-clipping";

import type { Adjacency } from "./adjacency.js";
import type { FlatFace, Vec2 } from "./flatten.js";
import { canonicalPairKey } from "./pair-key.js";
import type { RecutResult } from "./recut.js";

export type RenderEdge =
  | { kind: "fold"; from: Vec2; to: Vec2 }
  | {
      kind: "cut";
      from: Vec2;
      to: Vec2;
      label: number;
      tab: Vec2[] | null;
    };

export interface RenderablePiece {
  edges: RenderEdge[];
}

const TAB_HEIGHT_RATIO = 0.4;
const TAB_INSET_RATIO = 0.25;

export interface PlacementSignal {
  edgeLengthMm: number;
  tabOverlapsOwnPieceInterior: boolean;
}

const W_LENGTH = 1.0;
const W_OVERLAP = 1000;

export function scoreTabPlacement(s: PlacementSignal): number {
  return (
    W_LENGTH * s.edgeLengthMm -
    (s.tabOverlapsOwnPieceInterior ? W_OVERLAP : 0)
  );
}

const faceToGeom = (positions: readonly [Vec2, Vec2, Vec2]): Polygon => [
  [positions[0], positions[1], positions[2]],
];

const tabToGeom = (tab: Vec2[]): Polygon => [tab];

/**
 * True iff the candidate tab polygon shares positive interior area with
 * any face in `pieceFaces` other than `originatingFaceIdx`. Mirrors
 * `detectOverlaps`'s try/catch — `polygon-clipping.intersection` throws
 * on near-coincident shared edges; treat as non-overlap for the same
 * shared-edge reasons documented in `overlap.ts`.
 */
export function tabOverlapsOwnPieceInterior(
  tab: Vec2[],
  pieceFaces: readonly FlatFace[],
  originatingFaceIdx: number,
): boolean {
  const tabGeom = tabToGeom(tab);
  for (let i = 0; i < pieceFaces.length; i++) {
    if (i === originatingFaceIdx) continue;
    try {
      const result = polygonClipping.intersection(
        tabGeom,
        faceToGeom(pieceFaces[i].positions),
      );
      if (result.length > 0) return true;
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Trapezoidal flap on the outside of edge `(p0, p1)` — opposite
 * side from `pApex`. Height and inset scale with edge length.
 */
export const buildTab = (p0: Vec2, p1: Vec2, pApex: Vec2): Vec2[] => {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.sqrt(dx * dx + dy * dy);
  const alongX = dx / L;
  const alongY = dy / L;
  let outX = -dy / L;
  let outY = dx / L;
  const apexX = pApex[0] - p0[0];
  const apexY = pApex[1] - p0[1];
  if (outX * apexX + outY * apexY > 0) {
    outX = -outX;
    outY = -outY;
  }
  const h = TAB_HEIGHT_RATIO * L;
  const inset = TAB_INSET_RATIO * L;
  return [
    [p0[0], p0[1]],
    [p1[0], p1[1]],
    [p1[0] + h * outX - inset * alongX, p1[1] + h * outY - inset * alongY],
    [p0[0] + h * outX + inset * alongX, p0[1] + h * outY + inset * alongY],
  ];
};

/**
 * For a cut on `meshFace` along `edge`, locate the face within its piece
 * and build the candidate tab + edge length. Returns null if the face
 * isn't in this piece, or if `edge`'s vertices don't both appear on the
 * face (defensive — shouldn't happen on valid input).
 */
const candidateTabForFace = (
  piece: RecutResult["pieces"][number],
  meshFace: number,
  edge: readonly [number, number],
): { tab: Vec2[]; faceIdxInPiece: number; edgeLenMm: number } | null => {
  const faceIdxInPiece = piece.faces.indexOf(meshFace);
  if (faceIdxInPiece === -1) return null;
  const flatFace = piece.layout.faces[faceIdxInPiece];

  let i = -1;
  let j = -1;
  let apexIdx = -1;
  for (let k = 0; k < 3; k++) {
    const v = flatFace.vertices[k];
    if (v === edge[0] || v === edge[1]) {
      if (i === -1) i = k;
      else j = k;
    } else {
      apexIdx = k;
    }
  }
  if (i === -1 || j === -1 || apexIdx === -1) return null;

  const pa = flatFace.positions[i];
  const pb = flatFace.positions[j];
  const tab = buildTab(pa, pb, flatFace.positions[apexIdx]);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  return { tab, faceIdxInPiece, edgeLenMm: Math.sqrt(dx * dx + dy * dy) };
};

export function buildRenderablePieces(
  recut: RecutResult,
): RenderablePiece[] {
  const cutByKey = new Map<string, { label: number; adj: Adjacency }>();
  for (let k = 0; k < recut.cuts.length; k++) {
    const adj = recut.cuts[k];
    cutByKey.set(canonicalPairKey(adj.edge[0], adj.edge[1]), {
      label: k + 1,
      adj,
    });
  }

  const faceToPieceIdx = new Map<number, number>();
  for (let p = 0; p < recut.pieces.length; p++) {
    for (const f of recut.pieces[p].faces) faceToPieceIdx.set(f, p);
  }

  // Pre-pass: per cut, score each candidate side and record the winner.
  // Tie-break to adj.faceA — preserves symmetric-fixture behavior.
  const winningSideMap = new Map<string, number>();
  for (const adj of recut.cuts) {
    const key = canonicalPairKey(adj.edge[0], adj.edge[1]);
    const pieceIdxA = faceToPieceIdx.get(adj.faceA);
    const pieceIdxB = faceToPieceIdx.get(adj.faceB);

    // Boundary cuts in test fixtures (faceB = phantom) have only one
    // real side; that side gets the tab.
    if (pieceIdxA === undefined && pieceIdxB === undefined) continue;
    if (pieceIdxA === undefined) {
      winningSideMap.set(key, adj.faceB);
      continue;
    }
    if (pieceIdxB === undefined) {
      winningSideMap.set(key, adj.faceA);
      continue;
    }

    const candA = candidateTabForFace(
      recut.pieces[pieceIdxA],
      adj.faceA,
      adj.edge,
    );
    const candB = candidateTabForFace(
      recut.pieces[pieceIdxB],
      adj.faceB,
      adj.edge,
    );
    if (candA === null && candB === null) continue;
    if (candA === null) {
      winningSideMap.set(key, adj.faceB);
      continue;
    }
    if (candB === null) {
      winningSideMap.set(key, adj.faceA);
      continue;
    }

    const scoreA = scoreTabPlacement({
      edgeLengthMm: candA.edgeLenMm,
      tabOverlapsOwnPieceInterior: tabOverlapsOwnPieceInterior(
        candA.tab,
        recut.pieces[pieceIdxA].layout.faces,
        candA.faceIdxInPiece,
      ),
    });
    const scoreB = scoreTabPlacement({
      edgeLengthMm: candB.edgeLenMm,
      tabOverlapsOwnPieceInterior: tabOverlapsOwnPieceInterior(
        candB.tab,
        recut.pieces[pieceIdxB].layout.faces,
        candB.faceIdxInPiece,
      ),
    });
    winningSideMap.set(key, scoreB > scoreA ? adj.faceB : adj.faceA);
  }

  return recut.pieces.map((piece) => {
    const foldKeys = new Set<string>();
    for (const fold of piece.folds) {
      foldKeys.add(canonicalPairKey(fold.edge[0], fold.edge[1]));
    }

    const edges: RenderEdge[] = [];
    for (let k = 0; k < piece.layout.faces.length; k++) {
      const face = piece.layout.faces[k];
      const meshFace = piece.faces[k];
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        const apexIdx = 3 - i - j;
        const va = face.vertices[i];
        const vb = face.vertices[j];
        const pa = face.positions[i];
        const pb = face.positions[j];
        const key = canonicalPairKey(va, vb);
        if (foldKeys.has(key)) {
          edges.push({ kind: "fold", from: pa, to: pb });
          continue;
        }
        const entry = cutByKey.get(key);
        if (!entry) {
          throw new Error(
            `buildRenderablePieces: edge (${va},${vb}) on face ${meshFace} is neither a fold nor a known cut.`,
          );
        }
        const tab =
          meshFace === winningSideMap.get(key)
            ? buildTab(pa, pb, face.positions[apexIdx])
            : null;
        edges.push({
          kind: "cut",
          from: pa,
          to: pb,
          label: entry.label,
          tab,
        });
      }
    }

    return { edges };
  });
}
