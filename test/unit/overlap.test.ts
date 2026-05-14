import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { buildLayout } from "../../src/core/flatten.js";
import type { FlatFace, Layout2D, Vec2 } from "../../src/core/flatten.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const face = (
  vertices: [number, number, number],
  positions: [Vec2, Vec2, Vec2],
): FlatFace => ({ vertices, positions });

const layoutFromCorpus = (name: string): Layout2D => {
  const stl = readFileSync(join(corpusDir, `${name}.stl`), "utf-8");
  const mesh = parseStl(stl);
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
  return buildLayout(mesh, tree);
};

describe("detectOverlaps", () => {
  it("detects two triangles sharing positive interior area", () => {
    const layout: Layout2D = {
      faces: [
        face(
          [0, 1, 2],
          [
            [0, 0],
            [4, 0],
            [2, 3],
          ],
        ),
        face(
          [3, 4, 5],
          [
            [1, 1],
            [5, 1],
            [3, 4],
          ],
        ),
      ],
    };
    expect(detectOverlaps(layout)).toEqual([{ faceA: 0, faceB: 1 }]);
  });

  it("ignores triangles that are far apart", () => {
    const layout: Layout2D = {
      faces: [
        face(
          [0, 1, 2],
          [
            [0, 0],
            [1, 0],
            [0, 1],
          ],
        ),
        face(
          [3, 4, 5],
          [
            [10, 10],
            [11, 10],
            [10, 11],
          ],
        ),
      ],
    };
    expect(detectOverlaps(layout)).toEqual([]);
  });

  it("ignores triangles sharing exactly one edge (fold-adjacent geometry)", () => {
    // Two triangles meeting at the edge (0,0)-(4,0), one above and one
    // below the x-axis — the exact geometry flatten produces for
    // fold-adjacent faces. Shared vertex IDs mirror the real case.
    const layout: Layout2D = {
      faces: [
        face(
          [0, 1, 2],
          [
            [0, 0],
            [4, 0],
            [2, 3],
          ],
        ),
        face(
          [0, 1, 3],
          [
            [0, 0],
            [4, 0],
            [2, -3],
          ],
        ),
      ],
    };
    expect(detectOverlaps(layout)).toEqual([]);
  });

  it("finds no overlaps for the platonic solids through the real pipeline", () => {
    for (const name of ["tetrahedron", "cube", "octahedron"]) {
      const layout = layoutFromCorpus(name);
      expect(detectOverlaps(layout)).toEqual([]);
    }
  });
});
