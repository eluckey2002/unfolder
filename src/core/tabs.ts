/**
 * Tabs stage: turn a `RecutResult` into a renderable model — every
 * piece's edges classified fold/cut, every cut carrying a label
 * shared with its mating side, and one trapezoidal glue tab per cut
 * on a deterministic side. Pure function; serialization lives in
 * `emit-svg.ts`.
 */

import type { Adjacency } from "./adjacency.js";
import type { Vec2 } from "./flatten.js";
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

/**
 * Trapezoidal flap on the outside of edge `(p0, p1)` — opposite
 * side from `pApex`. Height and inset scale with edge length.
 */
const buildTab = (p0: Vec2, p1: Vec2, pApex: Vec2): Vec2[] => {
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
          meshFace === entry.adj.faceA
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
