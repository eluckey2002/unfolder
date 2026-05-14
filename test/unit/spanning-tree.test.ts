import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import type { SpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const treeFromCorpus = (name: string): SpanningTree => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  return buildSpanningTree(buildAdjacency(parseStl(stl)));
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
    const dual = buildAdjacency(parseStl(stl));
    expect(() => buildSpanningTree(dual, -1)).toThrow();
    expect(() => buildSpanningTree(dual, 999)).toThrow();
  });
});
