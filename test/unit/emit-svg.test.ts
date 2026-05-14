import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { emitSvg } from "../../src/core/emit-svg.js";
import { buildLayout } from "../../src/core/flatten.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const svgFromCorpus = (name: string): string => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  const mesh = parseStl(stl);
  const tree = buildSpanningTree(buildAdjacency(mesh));
  const layout = buildLayout(mesh, tree);
  return emitSvg(layout, tree);
};

const countLines = (svg: string): number =>
  (svg.match(/<line/g) ?? []).length;

describe("emitSvg", () => {
  it("produces a well-formed SVG document", () => {
    const svg = svgFromCorpus("tetrahedron");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain("viewBox=");
  });

  it("tetrahedron: one line per face-edge (12 total)", () => {
    expect(countLines(svgFromCorpus("tetrahedron"))).toBe(12);
  });

  it("cube and octahedron: line counts match face-edge totals", () => {
    expect(countLines(svgFromCorpus("cube"))).toBe(36);
    expect(countLines(svgFromCorpus("octahedron"))).toBe(24);
  });
});
