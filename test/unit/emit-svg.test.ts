import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { emitSvg, reconstructOutline } from "../../src/core/emit-svg.js";
import type { Vec2 } from "../../src/core/flatten.js";
import { buildLayout } from "../../src/core/flatten.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { LETTER, paginate } from "../../src/core/paginate.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { runPipeline } from "../../src/core/pipeline.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import type { Page } from "../../src/core/paginate.js";
import type { RenderEdge, RenderablePiece } from "../../src/core/tabs.js";
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

const cutEdge = (from: Vec2, to: Vec2, label: number): RenderEdge => ({
  kind: "cut",
  from,
  to,
  label,
  tab: null,
});

const foldEdge = (from: Vec2, to: Vec2): RenderEdge => ({
  kind: "fold",
  from,
  to,
});

describe("reconstructOutline", () => {
  it("returns an empty array when the piece has no edges", () => {
    expect(reconstructOutline([])).toEqual([]);
  });

  it("returns the 3 vertices of a single all-cut triangle", () => {
    const a: Vec2 = [0, 0];
    const b: Vec2 = [10, 0];
    const c: Vec2 = [5, 8];
    const outline = reconstructOutline([
      cutEdge(a, b, 1),
      cutEdge(b, c, 2),
      cutEdge(c, a, 3),
    ]);
    expect(outline).toHaveLength(3);
    const keys = outline.map((v) => `${v[0]},${v[1]}`);
    expect(new Set(keys)).toEqual(new Set(["0,0", "10,0", "5,8"]));
  });

  it("walks two triangles sharing one fold edge into a 4-vertex outline of cuts only", () => {
    // Face0 = A,B,C with A→B fold; Face1 = A,B,D with A→B fold (shared).
    const a: Vec2 = [0, 0];
    const b: Vec2 = [1, 0];
    const c: Vec2 = [0.5, 1];
    const d: Vec2 = [0.5, -1];
    const edges: RenderEdge[] = [
      foldEdge(a, b),
      cutEdge(b, c, 1),
      cutEdge(c, a, 2),
      foldEdge(a, b),
      cutEdge(b, d, 3),
      cutEdge(d, a, 4),
    ];
    const outline = reconstructOutline(edges);
    expect(outline).toHaveLength(4);
    const keys = outline.map((v) => `${v[0]},${v[1]}`);
    expect(new Set(keys)).toEqual(
      new Set(["0,0", "1,0", "0.5,1", "0.5,-1"]),
    );
  });
});

const trianglePiece = (
  side: number,
  foldability: "clean" | "caution" | "warn",
): RenderablePiece => {
  const h = (side * Math.sqrt(3)) / 2;
  const a: Vec2 = [0, 0];
  const b: Vec2 = [side, 0];
  const c: Vec2 = [side / 2, h];
  return {
    foldability,
    edges: [
      cutEdge(a, b, 1),
      cutEdge(b, c, 2),
      cutEdge(c, a, 3),
    ],
  };
};

const pageWith = (pieces: RenderablePiece[]): Page => ({
  widthMm: 100,
  heightMm: 100,
  pieces: pieces.map((piece, sourceIndex) => ({ sourceIndex, piece })),
});

describe("emitSvg — foldability tint", () => {
  it("emits one tinted polygon per piece, each before any <line> element", () => {
    const svg = emitSvg(
      pageWith([
        trianglePiece(10, "clean"),
        trianglePiece(10, "warn"),
      ]),
    );
    const tintMatches = svg.match(/<polygon[^>]*fill="hsla\(/g) ?? [];
    expect(tintMatches.length).toBe(2);
    const firstLine = svg.indexOf("<line");
    const lastTint = svg.lastIndexOf('<polygon class="foldability-tint"');
    expect(lastTint).toBeGreaterThanOrEqual(0);
    expect(lastTint).toBeLessThan(firstLine);
  });

  it("colors tints by class: clean=green, caution=amber, warn=red", () => {
    const svg = emitSvg(
      pageWith([
        trianglePiece(10, "clean"),
        trianglePiece(10, "caution"),
        trianglePiece(10, "warn"),
      ]),
    );
    expect(svg).toContain('fill="hsla(120, 50%, 70%, 0.18)"');
    expect(svg).toContain('fill="hsla(48, 90%, 65%, 0.22)"');
    expect(svg).toContain('fill="hsla(0, 70%, 65%, 0.25)"');
  });

  it("skips the tint for a piece with no foldability set (defensive)", () => {
    const piece: RenderablePiece = {
      edges: [
        cutEdge([0, 0], [10, 0], 1),
        cutEdge([10, 0], [5, 8], 2),
        cutEdge([5, 8], [0, 0], 3),
      ],
    };
    const svg = emitSvg(pageWith([piece]));
    expect(svg).not.toContain("foldability-tint");
  });

  it("emits one outline polygon per piece on ginger-bread (real corpus, shared-vertex FP drift)", () => {
    const objText = readFileSync(join(corpusDir, "ginger-bread.obj"), "utf-8");
    const mesh = parseObj(objText);
    const { pages } = runPipeline(mesh);
    const svg = emitSvg(pages[0]);
    const tintMatches = svg.match(/<polygon class="foldability-tint"/g) ?? [];
    // ginger-bread is 2 pieces on 1 page per baseline — should be 2 tints.
    expect(tintMatches.length).toBe(pages[0].pieces.length);
  });
});
