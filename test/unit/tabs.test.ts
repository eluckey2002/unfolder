import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { Adjacency } from "../../src/core/adjacency.js";
import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import type { FlatFace, Vec2 } from "../../src/core/flatten.js";
import { buildLayout } from "../../src/core/flatten.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { parseObj } from "../../src/core/parse-obj.js";
import type { RecutResult } from "../../src/core/recut.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import {
  buildRenderablePieces,
  buildTab,
  scoreTabPlacement,
  tabOverlapsOwnPieceInterior,
} from "../../src/core/tabs.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const face = (
  vertices: [number, number, number],
  positions: [Vec2, Vec2, Vec2],
): FlatFace => ({ vertices, positions });

const cut = (
  faceA: number,
  faceB: number,
  edge: [number, number],
): Adjacency => ({ faceA, faceB, edge });

const sideOfEdge = (p0: Vec2, p1: Vec2, p: Vec2): number => {
  const ux = p1[0] - p0[0];
  const uy = p1[1] - p0[1];
  const vx = p[0] - p0[0];
  const vy = p[1] - p0[1];
  return ux * vy - uy * vx;
};

/**
 * Two triangles sharing edge (0,1), placed in two separate pieces.
 * The shared edge is a real cut between pieces; the four boundary
 * edges are cuts to a phantom face so every face-edge in the input
 * has a known classification.
 */
const makeTwoPieceFixture = (): RecutResult => {
  const face0 = face([0, 1, 2], [[0, 0], [1, 0], [0, 1]]);
  const face1 = face([0, 1, 3], [[0, 0], [1, 0], [0, -1]]);
  return {
    pieces: [
      { layout: { faces: [face0] }, faces: [0], folds: [] },
      { layout: { faces: [face1] }, faces: [1], folds: [] },
    ],
    cuts: [
      cut(0, 1, [0, 1]),
      cut(0, 99, [1, 2]),
      cut(0, 99, [0, 2]),
      cut(1, 99, [1, 3]),
      cut(1, 99, [0, 3]),
    ],
  };
};

/**
 * Two triangles sharing edge (0,1), folded into a single piece.
 * Boundary edges are cuts to a phantom face.
 */
const makeFoldedPieceFixture = (): RecutResult => {
  const face0 = face([0, 1, 2], [[0, 0], [1, 0], [0, 1]]);
  const face1 = face([0, 1, 3], [[0, 0], [1, 0], [0, -1]]);
  return {
    pieces: [
      {
        layout: { faces: [face0, face1] },
        faces: [0, 1],
        folds: [{ faceA: 0, faceB: 1, edge: [0, 1] }],
      },
    ],
    cuts: [
      cut(0, 99, [1, 2]),
      cut(0, 99, [0, 2]),
      cut(1, 99, [1, 3]),
      cut(1, 99, [0, 3]),
    ],
  };
};

describe("buildRenderablePieces", () => {
  it("gives the shared cut edge the same label on both pieces", () => {
    const pieces = buildRenderablePieces(makeTwoPieceFixture());

    const labelOnPiece = (i: number): number => {
      const edge = pieces[i].edges.find(
        (e) =>
          e.kind === "cut" &&
          ((e.from[0] === 0 && e.from[1] === 0 && e.to[0] === 1 && e.to[1] === 0) ||
            (e.from[0] === 1 && e.from[1] === 0 && e.to[0] === 0 && e.to[1] === 0)),
      );
      if (!edge || edge.kind !== "cut") {
        throw new Error(`piece ${i} has no shared-edge cut`);
      }
      return edge.label;
    };

    expect(labelOnPiece(0)).toBe(labelOnPiece(1));
  });

  it("puts exactly one tab on the shared cut edge (faceA wins by tie-break on the symmetric fixture)", () => {
    const pieces = buildRenderablePieces(makeTwoPieceFixture());

    const sharedOnPiece = (i: number) =>
      pieces[i].edges.find(
        (e) =>
          e.kind === "cut" &&
          ((e.from[0] === 0 && e.from[1] === 0 && e.to[0] === 1 && e.to[1] === 0) ||
            (e.from[0] === 1 && e.from[1] === 0 && e.to[0] === 0 && e.to[1] === 0)),
      );

    const e0 = sharedOnPiece(0);
    const e1 = sharedOnPiece(1);
    expect(e0?.kind).toBe("cut");
    expect(e1?.kind).toBe("cut");
    if (e0?.kind === "cut") expect(e0.tab).not.toBeNull();
    if (e1?.kind === "cut") expect(e1.tab).toBeNull();
  });

  it("places the tab on the opposite side of the edge from the apex", () => {
    const pieces = buildRenderablePieces(makeTwoPieceFixture());
    const e0 = pieces[0].edges.find(
      (e) =>
        e.kind === "cut" &&
        e.from[0] === 0 &&
        e.from[1] === 0 &&
        e.to[0] === 1 &&
        e.to[1] === 0,
    );
    expect(e0?.kind).toBe("cut");
    if (e0?.kind !== "cut" || !e0.tab) throw new Error("missing tab");

    const apex: Vec2 = [0, 1];
    const apexSign = Math.sign(sideOfEdge(e0.from, e0.to, apex));
    expect(apexSign).not.toBe(0);

    for (let k = 2; k < e0.tab.length; k++) {
      const s = Math.sign(sideOfEdge(e0.from, e0.to, e0.tab[k]));
      expect(s).toBe(-apexSign);
    }
  });

  it("emits fold edges with kind:'fold' and no label or tab field", () => {
    const pieces = buildRenderablePieces(makeFoldedPieceFixture());
    const folds = pieces[0].edges.filter((e) => e.kind === "fold");
    expect(folds.length).toBe(2);
    for (const e of folds) {
      expect(e.kind).toBe("fold");
      expect((e as { label?: unknown }).label).toBeUndefined();
      expect((e as { tab?: unknown }).tab).toBeUndefined();
    }
    const cuts = pieces[0].edges.filter((e) => e.kind === "cut");
    expect(cuts.length).toBe(4);
    for (const e of cuts) {
      expect(e.kind).toBe("cut");
      if (e.kind === "cut") expect(typeof e.label).toBe("number");
    }
  });

  it("scoreTabPlacement: returns higher score for longer shared edges (clean candidates)", () => {
    const short = scoreTabPlacement({
      edgeLengthMm: 5,
      tabOverlapsOwnPieceInterior: false,
    });
    const long = scoreTabPlacement({
      edgeLengthMm: 50,
      tabOverlapsOwnPieceInterior: false,
    });
    expect(long).toBeGreaterThan(short);
  });

  it("scoreTabPlacement: overlap penalty swamps edge-length bonus", () => {
    const clean = scoreTabPlacement({
      edgeLengthMm: 100,
      tabOverlapsOwnPieceInterior: false,
    });
    const dirty = scoreTabPlacement({
      edgeLengthMm: 100,
      tabOverlapsOwnPieceInterior: true,
    });
    expect(clean).toBeGreaterThan(dirty);
    expect(dirty).toBeLessThan(0);
  });

  it("score-driven placement: tab lands on the side whose candidate is clear of own-piece interior", () => {
    // P_0 has face 0 + face 2; face 2 sits in face 0's candidate-tab area.
    // P_1 has face 1 + face 3; face 3 sits AWAY from face 1's tab area.
    // Cut edge is (0,1) at positions (0,0)→(1,0).
    // face 0 tab extends into y∈[-0.4, 0]; face 2 (positions span y<0) clips it.
    // face 1 tab extends into y∈[0, 0.4]; face 3 (positions y<0) is clear.
    const face0 = face([0, 1, 2], [[0, 0], [1, 0], [0, 1]]);
    const face2 = face([1, 2, 4], [[1, 0], [0, 1], [0.5, -0.5]]);
    const face1 = face([0, 1, 3], [[0, 0], [1, 0], [0, -1]]);
    const face3 = face([1, 3, 5], [[1, 0], [0, -1], [1.5, -1.5]]);
    const fixture: RecutResult = {
      pieces: [
        {
          layout: { faces: [face0, face2] },
          faces: [0, 2],
          folds: [{ faceA: 0, faceB: 2, edge: [1, 2] }],
        },
        {
          layout: { faces: [face1, face3] },
          faces: [1, 3],
          folds: [{ faceA: 1, faceB: 3, edge: [1, 3] }],
        },
      ],
      cuts: [
        cut(0, 1, [0, 1]),
        cut(0, 99, [0, 2]),
        cut(2, 99, [2, 4]),
        cut(2, 99, [1, 4]),
        cut(1, 99, [0, 3]),
        cut(3, 99, [3, 5]),
        cut(3, 99, [1, 5]),
      ],
    };
    const pieces = buildRenderablePieces(fixture);
    const sharedOnPiece = (i: number) =>
      pieces[i].edges.find(
        (e) =>
          e.kind === "cut" &&
          ((e.from[0] === 0 && e.from[1] === 0 && e.to[0] === 1 && e.to[1] === 0) ||
            (e.from[0] === 1 && e.from[1] === 0 && e.to[0] === 0 && e.to[1] === 0)),
      );
    const e0 = sharedOnPiece(0);
    const e1 = sharedOnPiece(1);
    expect(e0?.kind).toBe("cut");
    expect(e1?.kind).toBe("cut");
    if (e0?.kind === "cut") expect(e0.tab).toBeNull();
    if (e1?.kind === "cut") expect(e1.tab).not.toBeNull();
  });

  it("tabOverlapsOwnPieceInterior: true when tab clips another face in the piece", () => {
    const f0 = face([0, 1, 2], [[0, 0], [1, 0], [0, 1]]);
    // face1 sits in the tab's y-range [-0.4, 0]: tab extends down to y=-0.4
    // (TAB_HEIGHT_RATIO=0.4 on a unit edge). Triangle here spans y=[-1, -0.1].
    const f1 = face([3, 4, 5], [[0, -0.1], [1, -0.1], [0.5, -1]]);
    const tab = buildTab(f0.positions[0], f0.positions[1], f0.positions[2]);
    expect(tabOverlapsOwnPieceInterior(tab, [f0, f1], 0)).toBe(true);
  });

  it("tabOverlapsOwnPieceInterior: false when other faces are out of the tab's path", () => {
    const f0 = face([0, 1, 2], [[0, 0], [1, 0], [0, 1]]);
    const f1 = face([3, 4, 5], [[5, 0], [6, 0], [5.5, 1]]);
    const tab = buildTab(f0.positions[0], f0.positions[1], f0.positions[2]);
    expect(tabOverlapsOwnPieceInterior(tab, [f0, f1], 0)).toBe(false);
  });

  it("ginger-bread.obj: every cut label appears exactly twice across all pieces", () => {
    const obj = readFileSync(join(corpusDir, "ginger-bread.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);
    const weights = computeDihedralWeights(mesh, dual);
    const tree = buildSpanningTree(dual, weights);
    const layout = buildLayout(mesh, tree);
    const overlaps = detectOverlaps(layout);
    const result = recut(tree, layout, overlaps);
    const pieces = buildRenderablePieces(result);

    expect(result.cuts.length).toBeGreaterThan(0);

    const labelCounts = new Map<number, number>();
    for (const piece of pieces) {
      for (const edge of piece.edges) {
        if (edge.kind !== "cut") continue;
        labelCounts.set(edge.label, (labelCounts.get(edge.label) ?? 0) + 1);
      }
    }

    expect(labelCounts.size).toBe(result.cuts.length);
    for (const [, count] of labelCounts) expect(count).toBe(2);
  });
});
