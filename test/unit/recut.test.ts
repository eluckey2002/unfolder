import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { Adjacency } from "../../src/core/adjacency.js";
import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import type { FlatFace, Layout2D, Vec2 } from "../../src/core/flatten.js";
import { buildLayout } from "../../src/core/flatten.js";
import type { FaceOverlap } from "../../src/core/overlap.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { recut } from "../../src/core/recut.js";
import type { SpanningTree } from "../../src/core/spanning-tree.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const face = (
  vertices: [number, number, number],
  positions: [Vec2, Vec2, Vec2],
): FlatFace => ({ vertices, positions });

const adj = (faceA: number, faceB: number): Adjacency => ({
  faceA,
  faceB,
  edge: [0, 1],
});

const tri = (offset: number): [Vec2, Vec2, Vec2] => [
  [offset, 0],
  [offset + 1, 0],
  [offset, 1],
];

describe("recut", () => {
  it("returns one piece when there are no overlaps", () => {
    const tree: SpanningTree = {
      root: 0,
      parent: [-1, 0, 1],
      folds: [adj(0, 1), adj(1, 2)],
      cuts: [],
    };
    const layout: Layout2D = {
      faces: [
        face([0, 1, 2], tri(0)),
        face([3, 4, 5], tri(2)),
        face([6, 7, 8], tri(4)),
      ],
    };

    const { pieces, cuts } = recut(tree, layout, []);

    expect(pieces.length).toBe(1);
    expect(pieces[0].layout.faces.length).toBe(3);
    expect(pieces[0].faces).toEqual([0, 1, 2]);
    expect(pieces[0].folds.length).toBe(2);
    expect(cuts.length).toBe(0);
  });

  it("cuts the overlap path into two pieces when there is a single overlap", () => {
    const tree: SpanningTree = {
      root: 0,
      parent: [-1, 0, 1],
      folds: [adj(0, 1), adj(1, 2)],
      cuts: [],
    };
    const layout: Layout2D = {
      faces: [
        face([0, 1, 2], tri(0)),
        face([3, 4, 5], tri(2)),
        face([6, 7, 8], tri(4)),
      ],
    };
    const overlaps: FaceOverlap[] = [{ faceA: 0, faceB: 2 }];

    const { pieces, cuts } = recut(tree, layout, overlaps);

    expect(pieces.length).toBe(2);
    expect(pieces[0].layout.faces.length).toBe(1);
    expect(pieces[1].layout.faces.length).toBe(2);
    expect(pieces[0].faces).toEqual([0]);
    expect(pieces[1].faces).toEqual([1, 2]);
    expect(pieces[0].folds.length).toBe(0);
    expect(pieces[1].folds.length).toBe(1);
    expect(pieces[0].layout.faces).toContainEqual(layout.faces[0]);
    expect(pieces[1].layout.faces).toContainEqual(layout.faces[2]);
    expect(cuts.length).toBe(1);
  });

  it("covers multiple overlap paths with a single shared edge", () => {
    const tree: SpanningTree = {
      root: 0,
      parent: [-1, 0, 0, 0, 0],
      folds: [adj(0, 1), adj(0, 2), adj(0, 3), adj(0, 4)],
      cuts: [],
    };
    const layout: Layout2D = {
      faces: [
        face([0, 1, 2], tri(0)),
        face([3, 4, 5], tri(2)),
        face([6, 7, 8], tri(4)),
        face([9, 10, 11], tri(6)),
        face([12, 13, 14], tri(8)),
      ],
    };
    const overlaps: FaceOverlap[] = [
      { faceA: 1, faceB: 2 },
      { faceA: 1, faceB: 3 },
      { faceA: 1, faceB: 4 },
    ];

    const { pieces, cuts } = recut(tree, layout, overlaps);

    expect(pieces.length).toBe(2);
    expect(pieces[0].layout.faces.length).toBe(4);
    expect(pieces[1].layout.faces.length).toBe(1);
    expect(pieces[0].faces).toEqual([0, 2, 3, 4]);
    expect(pieces[1].faces).toEqual([1]);
    expect(pieces[0].folds.length).toBe(3);
    expect(pieces[1].folds.length).toBe(0);
    expect(cuts.length).toBe(1);
  });

  it("produces internally overlap-free pieces for ginger-bread.obj end-to-end", () => {
    const obj = readFileSync(join(corpusDir, "ginger-bread.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);
    const weights = computeDihedralWeights(mesh, dual);
    const tree = buildSpanningTree(dual, weights);
    const layout = buildLayout(mesh, tree);
    const overlaps = detectOverlaps(layout);

    expect(overlaps.length).toBeGreaterThan(0);

    const { pieces } = recut(tree, layout, overlaps);

    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) {
      expect(piece.faces.length).toBe(piece.layout.faces.length);
      expect(detectOverlaps(piece.layout)).toEqual([]);
    }
  });
});
