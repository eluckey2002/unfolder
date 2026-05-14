import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { emitSvg } from "../../src/core/emit-svg.js";
import { buildLayout } from "../../src/core/flatten.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

interface SvgPipeline {
  svg: string;
  faceCount: number;
  foldCount: number;
}

const pipelineFromCorpus = (name: string): SvgPipeline => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  const mesh = parseStl(stl);
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
  const layout = buildLayout(mesh, tree);
  return {
    svg: emitSvg(layout, tree),
    faceCount: mesh.faces.length,
    foldCount: tree.folds.length,
  };
};

const countLines = (svg: string): number =>
  (svg.match(/<line/g) ?? []).length;

const countDashed = (svg: string): number =>
  (svg.match(/stroke-dasharray="/g) ?? []).length;

describe("emitSvg", () => {
  it("produces a well-formed SVG document", () => {
    const { svg } = pipelineFromCorpus("tetrahedron");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain("viewBox=");
  });

  it("tetrahedron: one line per face-edge (12 total)", () => {
    expect(countLines(pipelineFromCorpus("tetrahedron").svg)).toBe(12);
  });

  it("cube and octahedron: line counts match face-edge totals", () => {
    expect(countLines(pipelineFromCorpus("cube").svg)).toBe(36);
    expect(countLines(pipelineFromCorpus("octahedron").svg)).toBe(24);
  });

  // Fold edges render dashed, cut edges solid. Each fold and each cut is
  // shared by two faces and drawn once from each, so dashed = 2 * folds
  // and the remainder (= 3*F - 2*folds) is solid.
  it.each([
    ["tetrahedron"],
    ["cube"],
    ["octahedron"],
  ])("%s: dashed lines == 2 * folds, solid lines == 3*F - 2*folds", (name) => {
    const { svg, faceCount, foldCount } = pipelineFromCorpus(name);
    const dashed = countDashed(svg);
    const total = countLines(svg);
    expect(dashed).toBe(2 * foldCount);
    expect(total - dashed).toBe(3 * faceCount - 2 * foldCount);
  });
});
