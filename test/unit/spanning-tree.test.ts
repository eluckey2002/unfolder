import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import type { DualGraph } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import type { SpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const treeFromCorpus = (name: string): SpanningTree => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  const mesh = parseStl(stl);
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  return buildSpanningTree(dual, weights);
};

describe("buildSpanningTree — platonic solids", () => {
  it("tetrahedron: 3 folds, 3 cuts; tree spans all faces", () => {
    const tree = treeFromCorpus("tetrahedron");
    expect(tree.folds.length).toBe(3);
    expect(tree.cuts.length).toBe(3);
    expect(tree.folds.length).toBe(4 - 1);
    expect(tree.parent[0]).toBe(-1);
    for (let i = 1; i < 4; i++) {
      expect(tree.parent[i]).toBeGreaterThanOrEqual(0);
      expect(tree.parent[i]).toBeLessThan(4);
    }
  });

  it("cube: 11 folds, 7 cuts", () => {
    const tree = treeFromCorpus("cube");
    expect(tree.folds.length).toBe(11);
    expect(tree.cuts.length).toBe(7);
    expect(tree.folds.length + tree.cuts.length).toBe(18);
    expect(tree.parent[0]).toBe(-1);
  });

  it("octahedron: 7 folds, 5 cuts", () => {
    const tree = treeFromCorpus("octahedron");
    expect(tree.folds.length).toBe(7);
    expect(tree.cuts.length).toBe(5);
    expect(tree.folds.length + tree.cuts.length).toBe(12);
    expect(tree.parent[0]).toBe(-1);
  });

  it("rejects invalid root", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);
    const weights = computeDihedralWeights(mesh, dual);
    expect(() => buildSpanningTree(dual, weights, -1)).toThrow();
    expect(() => buildSpanningTree(dual, weights, 999)).toThrow();
  });

  it("rejects weights-length mismatch", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const dual = buildAdjacency(parseStl(stl));
    // Tetrahedron has 6 adjacencies; too few and too many both reject.
    expect(() => buildSpanningTree(dual, [0, 0, 0])).toThrow();
    expect(() => buildSpanningTree(dual, new Array(7).fill(0))).toThrow();
  });
});

describe("buildSpanningTree — MST behavior", () => {
  it("selects the minimum-weight fold set on a cycle-plus-extras dual graph", () => {
    // 4 faces. Three cheap edges (weight 1) form a valid spanning tree;
    // two expensive edges (weight 100) close cycles. A plain DFS could
    // include either group; the MST must select only the cheap edges.
    const dual: DualGraph = {
      adjacencies: [
        { faceA: 0, faceB: 1, edge: [0, 1] }, // expensive
        { faceA: 0, faceB: 2, edge: [0, 2] }, // expensive
        { faceA: 0, faceB: 3, edge: [0, 3] }, // cheap
        { faceA: 1, faceB: 2, edge: [1, 2] }, // cheap
        { faceA: 2, faceB: 3, edge: [2, 3] }, // cheap
      ],
      byFace: [[0, 1, 2], [0, 3], [1, 3, 4], [2, 4]],
    };
    const weights = [100, 100, 1, 1, 1];

    const tree = buildSpanningTree(dual, weights);

    expect(tree.folds.length).toBe(3);
    expect(tree.cuts.length).toBe(2);

    const foldEdges = new Set(tree.folds.map((f) => `${f.faceA}-${f.faceB}`));
    expect(foldEdges).toEqual(new Set(["0-3", "1-2", "2-3"]));

    const cutEdges = new Set(tree.cuts.map((c) => `${c.faceA}-${c.faceB}`));
    expect(cutEdges).toEqual(new Set(["0-1", "0-2"]));

    // The tree must reach every face from the root via parent pointers.
    expect(tree.parent[tree.root]).toBe(-1);
    for (let f = 0; f < 4; f++) {
      if (f === tree.root) continue;
      let cur = f;
      let steps = 0;
      while (cur !== tree.root && steps <= 4) {
        cur = tree.parent[cur];
        steps++;
      }
      expect(cur).toBe(tree.root);
    }
  });
});
