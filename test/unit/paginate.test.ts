import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { buildLayout } from "../../src/core/flatten.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import type { Page, PlacedPiece } from "../../src/core/paginate.js";
import { LETTER, paginate } from "../../src/core/paginate.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import type { RenderEdge, RenderablePiece } from "../../src/core/tabs.js";
import { buildRenderablePieces } from "../../src/core/tabs.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

interface PaginatePipeline {
  pieces: RenderablePiece[];
  pages: Page[];
}

const pipelineFromCorpus = (name: string, ext: string): PaginatePipeline => {
  const raw = readFileSync(join(corpusDir, `${name}.${ext}`), "utf-8");
  const mesh = ext === "stl" ? parseStl(raw) : parseObj(raw);
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
  const layout = buildLayout(mesh, tree);
  const overlaps = detectOverlaps(layout);
  const result = recut(tree, layout, overlaps);
  const pieces = buildRenderablePieces(result);
  const pages = paginate(pieces, LETTER);
  return { pieces, pages };
};

const TOL = 1e-9;

const placedBbox = (
  placed: PlacedPiece,
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const bump = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const edge of placed.piece.edges) {
    bump(edge.from[0], edge.from[1]);
    bump(edge.to[0], edge.to[1]);
    if (edge.kind === "cut" && edge.tab) {
      for (const [tx, ty] of edge.tab) bump(tx, ty);
    }
  }
  return { minX, minY, maxX, maxY };
};

const edgeLength = (e: RenderEdge): number => {
  const dx = e.to[0] - e.from[0];
  const dy = e.to[1] - e.from[1];
  return Math.sqrt(dx * dx + dy * dy);
};

describe("paginate", () => {
  it("empty input yields no pages", () => {
    expect(paginate([], LETTER)).toEqual([]);
  });

  it("tetrahedron (single convex piece) → one page with one placement", () => {
    const { pieces, pages } = pipelineFromCorpus("tetrahedron", "stl");
    expect(pieces.length).toBe(1);
    expect(pages.length).toBe(1);
    expect(pages[0].pieces.length).toBe(1);
    expect(pages[0].pieces[0].sourceIndex).toBe(0);
    expect(pages[0].widthMm).toBe(LETTER.widthMm);
    expect(pages[0].heightMm).toBe(LETTER.heightMm);
  });

  it.each([
    ["tetrahedron", "stl"],
    ["cube", "stl"],
    ["octahedron", "stl"],
    ["deer", "obj"],
    ["ginger-bread", "obj"],
  ])("%s: every placed coordinate is inside the printable area", (name, ext) => {
    const { pages } = pipelineFromCorpus(name, ext);
    const minBound = LETTER.marginMm - TOL;
    const maxBoundX = LETTER.widthMm - LETTER.marginMm + TOL;
    const maxBoundY = LETTER.heightMm - LETTER.marginMm + TOL;
    for (const page of pages) {
      for (const placed of page.pieces) {
        const bb = placedBbox(placed);
        expect(bb.minX).toBeGreaterThanOrEqual(minBound);
        expect(bb.minY).toBeGreaterThanOrEqual(minBound);
        expect(bb.maxX).toBeLessThanOrEqual(maxBoundX);
        expect(bb.maxY).toBeLessThanOrEqual(maxBoundY);
      }
    }
  });

  it.each([
    ["tetrahedron", "stl"],
    ["deer", "obj"],
    ["ginger-bread", "obj"],
  ])("%s: no two placed pieces on the same page have overlapping bboxes", (name, ext) => {
    const { pages } = pipelineFromCorpus(name, ext);
    for (const page of pages) {
      const boxes = page.pieces.map(placedBbox);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const separated =
            a.maxX <= b.minX + TOL ||
            b.maxX <= a.minX + TOL ||
            a.maxY <= b.minY + TOL ||
            b.maxY <= a.minY + TOL;
          expect(separated).toBe(true);
        }
      }
    }
  });

  it("deer: determinism — two runs produce deep-equal output", () => {
    const a = pipelineFromCorpus("deer", "obj");
    const b = pipelineFromCorpus("deer", "obj");
    expect(b.pages).toEqual(a.pages);
  });

  it.each([
    ["tetrahedron", "stl"],
    ["deer", "obj"],
    ["ginger-bread", "obj"],
  ])("%s: every placed edge shares one uniform scale relative to source", (name, ext) => {
    const { pieces, pages } = pipelineFromCorpus(name, ext);
    let ratio: number | null = null;
    for (const page of pages) {
      for (const placed of page.pieces) {
        const source = pieces[placed.sourceIndex];
        for (let i = 0; i < placed.piece.edges.length; i++) {
          const srcLen = edgeLength(source.edges[i]);
          if (srcLen < TOL) continue;
          const placedLen = edgeLength(placed.piece.edges[i]);
          const r = placedLen / srcLen;
          if (ratio === null) {
            ratio = r;
          } else {
            expect(Math.abs(r - ratio)).toBeLessThan(1e-9 * Math.max(1, ratio));
          }
        }
      }
    }
    expect(ratio).not.toBeNull();
  });

  it("deer: the largest source piece, scaled, fits within one page", () => {
    const { pieces, pages } = pipelineFromCorpus("deer", "obj");
    let firstRatio: number | null = null;
    for (const page of pages) {
      for (const placed of page.pieces) {
        const source = pieces[placed.sourceIndex];
        for (let i = 0; i < placed.piece.edges.length; i++) {
          const srcLen = edgeLength(source.edges[i]);
          if (srcLen < TOL) continue;
          firstRatio = edgeLength(placed.piece.edges[i]) / srcLen;
          break;
        }
        if (firstRatio !== null) break;
      }
      if (firstRatio !== null) break;
    }
    expect(firstRatio).not.toBeNull();
    const s = firstRatio as number;
    const printableW = LETTER.widthMm - 2 * LETTER.marginMm;
    const printableH = LETTER.heightMm - 2 * LETTER.marginMm;
    for (const piece of pieces) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const edge of piece.edges) {
        for (const [x, y] of [edge.from, edge.to]) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
        if (edge.kind === "cut" && edge.tab) {
          for (const [x, y] of edge.tab) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      const w = (maxX - minX) * s;
      const h = (maxY - minY) * s;
      expect(w).toBeLessThanOrEqual(printableW + TOL);
      expect(h).toBeLessThanOrEqual(printableH + TOL);
    }
  });

  it("throws on a zero-extent piece", () => {
    const degenerate: RenderablePiece = {
      edges: [
        { kind: "fold", from: [0, 0], to: [0, 0] },
        { kind: "fold", from: [0, 0], to: [0, 0] },
      ],
    };
    expect(() => paginate([degenerate], LETTER)).toThrow();
  });

  it("throws on a PageSpec with non-positive printable area", () => {
    const bad = { widthMm: 10, heightMm: 10, marginMm: 5, gutterMm: 1 };
    const piece: RenderablePiece = {
      edges: [
        { kind: "fold", from: [0, 0], to: [1, 0] },
        { kind: "fold", from: [1, 0], to: [0, 1] },
        { kind: "fold", from: [0, 1], to: [0, 0] },
      ],
    };
    expect(() => paginate([piece], bad)).toThrow();
  });
});
