import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { emitSvg } from "../../src/core/emit-svg.js";
import { buildLayout } from "../../src/core/flatten.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { LETTER, paginate } from "../../src/core/paginate.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import { buildRenderablePieces } from "../../src/core/tabs.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

interface SvgPipeline {
  svg: string;
  faceCount: number;
  foldCount: number;
  cutCount: number;
  pieceCount: number;
}

const pipelineFromCorpus = (name: string): SvgPipeline => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  const mesh = parseStl(stl);
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
  const layout = buildLayout(mesh, tree);
  const overlaps = detectOverlaps(layout);
  const result = recut(tree, layout, overlaps);
  const renderable = buildRenderablePieces(result);
  const pages = paginate(renderable, LETTER);
  return {
    svg: emitSvg(pages[0]),
    faceCount: mesh.faces.length,
    foldCount: tree.folds.length,
    cutCount: result.cuts.length,
    pieceCount: renderable.length,
  };
};

const countLines = (svg: string): number =>
  (svg.match(/<line/g) ?? []).length;

const countDashed = (svg: string): number =>
  (svg.match(/stroke-dasharray="/g) ?? []).length;

const countPolygons = (svg: string): number =>
  (svg.match(/<polygon/g) ?? []).length;

const countTexts = (svg: string): number =>
  (svg.match(/<text/g) ?? []).length;

describe("emitSvg", () => {
  it("produces a well-formed SVG document with mm-sized viewBox", () => {
    const { svg } = pipelineFromCorpus("tetrahedron");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${LETTER.widthMm} ${LETTER.heightMm}"`);
    expect(svg).toContain(`width="${LETTER.widthMm}mm"`);
    expect(svg).toContain(`height="${LETTER.heightMm}mm"`);
  });

  it("tetrahedron: one line per face-edge (12 total)", () => {
    expect(countLines(pipelineFromCorpus("tetrahedron").svg)).toBe(12);
  });

  it("cube and octahedron: line counts match face-edge totals", () => {
    expect(countLines(pipelineFromCorpus("cube").svg)).toBe(36);
    expect(countLines(pipelineFromCorpus("octahedron").svg)).toBe(24);
  });

  // Single-piece (convex) platonic solids: each fold edge is drawn
  // twice (once per adjacent face) as a dashed line; each cut edge is
  // drawn twice as a solid line, gets one <polygon> tab on the
  // lower-face-index side, and one <text> label per side.
  it.each([
    ["tetrahedron"],
    ["cube"],
    ["octahedron"],
  ])("%s: dashed == 2*folds, solid == 3F - 2*folds, polygons == cuts, texts == 2*cuts", (name) => {
    const { svg, faceCount, foldCount, cutCount, pieceCount } =
      pipelineFromCorpus(name);
    expect(pieceCount).toBe(1);
    const dashed = countDashed(svg);
    const total = countLines(svg);
    expect(dashed).toBe(2 * foldCount);
    expect(total - dashed).toBe(3 * faceCount - 2 * foldCount);
    expect(countPolygons(svg)).toBe(cutCount);
    expect(countTexts(svg)).toBe(2 * cutCount);
  });
});
