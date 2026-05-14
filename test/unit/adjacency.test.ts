import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import type { DualGraph } from "../../src/core/adjacency.js";
import { parseStl } from "../../src/core/parse-stl.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const buildFromCorpus = (name: string): DualGraph => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  return buildAdjacency(parseStl(stl));
};

describe("buildAdjacency — platonic solids", () => {
  it("tetrahedron: 6 adjacencies, each face has 3 neighbors", () => {
    const dual = buildFromCorpus("tetrahedron");
    expect(dual.adjacencies.length).toBe(6);
    expect(dual.byFace.every((list) => list.length === 3)).toBe(true);
  });

  it("cube: 18 adjacencies, each face has 3 neighbors", () => {
    const dual = buildFromCorpus("cube");
    expect(dual.adjacencies.length).toBe(18);
    expect(dual.byFace.every((list) => list.length === 3)).toBe(true);
  });

  it("octahedron: 12 adjacencies, each face has 3 neighbors", () => {
    const dual = buildFromCorpus("octahedron");
    expect(dual.adjacencies.length).toBe(12);
    expect(dual.byFace.every((list) => list.length === 3)).toBe(true);
  });
});
