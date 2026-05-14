import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { emitSvg } from "../../src/core/emit-svg.js";
import { buildLayout } from "../../src/core/flatten.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { LETTER, paginate } from "../../src/core/paginate.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import { buildRenderablePieces } from "../../src/core/tabs.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const models = readdirSync(corpusDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((n) => {
    const ext = extname(n).toLowerCase();
    return ext === ".stl" || ext === ".obj";
  })
  .sort();

const EPS = 1e-6;

describe("v2 ship-state — corpus coverage", () => {
  it("discovers at least one model and includes anchor models", () => {
    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain("tetrahedron.stl");
    expect(models).toContain("deer.obj");
  });
});

describe("v2 ship-state — end-to-end pipeline", () => {
  it.each(models)(
    "%s: completes the pipeline and satisfies v2 invariants",
    (model) => {
      const ext = extname(model).toLowerCase();
      const contents = readFileSync(join(corpusDir, model), "utf-8");
      const mesh = ext === ".stl" ? parseStl(contents) : parseObj(contents);

      const dual = buildAdjacency(mesh);
      const weights = computeDihedralWeights(mesh, dual);
      const tree = buildSpanningTree(dual, weights);
      const layout = buildLayout(mesh, tree);
      const overlaps = detectOverlaps(layout);
      const result = recut(tree, layout, overlaps);

      expect(result.pieces.length).toBeGreaterThan(0);

      for (const piece of result.pieces) {
        expect(detectOverlaps(piece.layout)).toEqual([]);

        expect(piece.layout).toBeDefined();
        expect(Array.isArray(piece.faces)).toBe(true);
        expect(Array.isArray(piece.folds)).toBe(true);
        expect(piece.faces.length).toBe(piece.layout.faces.length);
        for (const f of piece.faces) {
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThan(mesh.faces.length);
        }
      }

      const renderable = buildRenderablePieces(result);
      const pages = paginate(renderable, LETTER);
      expect(pages.length).toBeGreaterThan(0);

      for (const page of pages) {
        const xMin = LETTER.marginMm - EPS;
        const xMax = page.widthMm - LETTER.marginMm + EPS;
        const yMin = LETTER.marginMm - EPS;
        const yMax = page.heightMm - LETTER.marginMm + EPS;

        for (const placed of page.pieces) {
          for (const edge of placed.piece.edges) {
            const pts: [number, number][] = [edge.from, edge.to];
            if (edge.kind === "cut" && edge.tab) {
              for (const tp of edge.tab) pts.push(tp);
            }
            for (const [x, y] of pts) {
              expect(x).toBeGreaterThanOrEqual(xMin);
              expect(x).toBeLessThanOrEqual(xMax);
              expect(y).toBeGreaterThanOrEqual(yMin);
              expect(y).toBeLessThanOrEqual(yMax);
            }
          }
        }

        const svg = emitSvg(page);
        expect(typeof svg).toBe("string");
        expect(svg.length).toBeGreaterThan(0);
        expect(svg.startsWith("<svg")).toBe(true);
      }
    },
  );
});
