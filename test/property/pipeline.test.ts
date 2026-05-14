/**
 * Property-based tests for the v1 unfolding pipeline.
 *
 * Generalizes the example-based unit tests in test/unit/ to many generated
 * inputs. See docs/insights-implementation-plan.md WI-9 for the invariant
 * set and the rationale for each property.
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import { buildLayout } from "../../src/core/flatten.js";
import type { Mesh3D, Vec3 } from "../../src/core/mesh.js";
import { emitSvg } from "../../src/core/emit-svg.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { LETTER, paginate } from "../../src/core/paginate.js";
import { recut } from "../../src/core/recut.js";
import { buildSpanningTree } from "../../src/core/spanning-tree.js";
import { buildRenderablePieces } from "../../src/core/tabs.js";
import { closedMeshArb } from "./arbitraries.js";
import {
  nonManifoldFixture,
  octahedron,
  openMeshFixture,
  tetrahedron,
} from "./meshes.js";

const EDGE_EPS = 1e-9;
const AREA_EPS = 1e-9;

const dist3D = (vertices: Vec3[], a: number, b: number): number => {
  const [ax, ay, az] = vertices[a];
  const [bx, by, bz] = vertices[b];
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const dist2D = (p: [number, number], q: [number, number]): number => {
  const dx = p[0] - q[0];
  const dy = p[1] - q[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const triangleArea3D = (
  vertices: Vec3[],
  a: number,
  b: number,
  c: number,
): number => {
  const [ax, ay, az] = vertices[a];
  const [bx, by, bz] = vertices[b];
  const [cx, cy, cz] = vertices[c];
  const ux = bx - ax;
  const uy = by - ay;
  const uz = bz - az;
  const vx = cx - ax;
  const vy = cy - ay;
  const vz = cz - az;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  return 0.5 * Math.sqrt(nx * nx + ny * ny + nz * nz);
};

const triangleArea2D = (
  p: [number, number],
  q: [number, number],
  r: [number, number],
): number => {
  const ux = q[0] - p[0];
  const uy = q[1] - p[1];
  const vx = r[0] - p[0];
  const vy = r[1] - p[1];
  return 0.5 * Math.abs(ux * vy - uy * vx);
};

const pipeline = (mesh: Mesh3D) => {
  const dual = buildAdjacency(mesh);
  const weights = computeDihedralWeights(mesh, dual);
  const tree = buildSpanningTree(dual, weights);
  const layout = buildLayout(mesh, tree);
  return { dual, tree, layout };
};

describe("Adjacency canonical ordering (property)", () => {
  it("every Adjacency has faceA < faceB and a sorted edge", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const dual = buildAdjacency(mesh);
        for (const adj of dual.adjacencies) {
          expect(adj.faceA).toBeLessThan(adj.faceB);
          expect(adj.edge[0]).toBeLessThan(adj.edge[1]);
        }
      }),
    );
  });

  it("byFace is consistent with adjacencies (each adjacency referenced from both endpoints)", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const dual = buildAdjacency(mesh);
        for (let adjIdx = 0; adjIdx < dual.adjacencies.length; adjIdx++) {
          const adj = dual.adjacencies[adjIdx];
          expect(dual.byFace[adj.faceA]).toContain(adjIdx);
          expect(dual.byFace[adj.faceB]).toContain(adjIdx);
        }
      }),
    );
  });
});

describe("Spanning tree well-formedness (property)", () => {
  it("parent[root] === -1; folds.length === faceCount - 1; folds + cuts === adjacencies", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const { dual, tree } = pipeline(mesh);
        const faceCount = mesh.faces.length;
        expect(tree.parent[tree.root]).toBe(-1);
        expect(tree.folds.length).toBe(faceCount - 1);
        expect(tree.folds.length + tree.cuts.length).toBe(
          dual.adjacencies.length,
        );
      }),
    );
  });

  it("parent encodes an acyclic tree reachable from root", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const { tree } = pipeline(mesh);
        const faceCount = mesh.faces.length;
        // Each non-root face reaches root by walking parents in ≤ faceCount steps.
        for (let f = 0; f < faceCount; f++) {
          if (f === tree.root) continue;
          let cur = f;
          let steps = 0;
          while (cur !== tree.root && steps <= faceCount) {
            cur = tree.parent[cur];
            steps++;
          }
          expect(cur).toBe(tree.root);
        }
      }),
    );
  });
});

describe("Flatten congruence (property)", () => {
  it("every shared 3D edge keeps its length in the 2D layout", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const { layout } = pipeline(mesh);
        for (let f = 0; f < mesh.faces.length; f++) {
          const flat = layout.faces[f];
          for (let i = 0; i < 3; i++) {
            const j = (i + 1) % 3;
            const v0 = flat.vertices[i];
            const v1 = flat.vertices[j];
            const len3 = dist3D(mesh.vertices, v0, v1);
            const len2 = dist2D(flat.positions[i], flat.positions[j]);
            expect(Math.abs(len3 - len2)).toBeLessThan(
              EDGE_EPS + EDGE_EPS * len3,
            );
          }
        }
      }),
    );
  });

  it("sum of 2D face areas ≈ sum of 3D face areas", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const { layout } = pipeline(mesh);
        let total3D = 0;
        let total2D = 0;
        for (let f = 0; f < mesh.faces.length; f++) {
          const [va, vb, vc] = mesh.faces[f];
          total3D += triangleArea3D(mesh.vertices, va, vb, vc);
          const [pa, pb, pc] = layout.faces[f].positions;
          total2D += triangleArea2D(pa, pb, pc);
        }
        expect(Math.abs(total3D - total2D)).toBeLessThan(
          AREA_EPS + AREA_EPS * total3D,
        );
      }),
    );
  });
});

describe("Layout connectivity (property)", () => {
  it("every face is placed in Layout2D", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const { layout } = pipeline(mesh);
        expect(layout.faces.length).toBe(mesh.faces.length);
        for (const flat of layout.faces) {
          expect(flat).toBeDefined();
          expect(flat.positions).toHaveLength(3);
        }
      }),
    );
  });
});

describe("SVG output (property)", () => {
  it("has 3 line elements per face across all pages and well-formed viewBoxes", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const { tree, layout } = pipeline(mesh);
        const overlaps = detectOverlaps(layout);
        const result = recut(tree, layout, overlaps);
        const renderable = buildRenderablePieces(result);
        const pages = paginate(renderable, LETTER);
        let totalLines = 0;
        for (const page of pages) {
          const svg = emitSvg(page);
          expect(svg.startsWith("<svg")).toBe(true);
          expect(svg.includes('viewBox="')).toBe(true);
          totalLines += (svg.match(/<line /g) ?? []).length;
        }
        expect(totalLines).toBe(3 * mesh.faces.length);
      }),
    );
  });
});

describe("buildAdjacency rejects non-manifolds", () => {
  it("throws on a single open triangle (boundary edges)", () => {
    expect(() => buildAdjacency(openMeshFixture)).toThrow();
  });

  it("throws when three faces share an edge", () => {
    expect(() => buildAdjacency(nonManifoldFixture)).toThrow();
  });
});

describe("Smoke tests on fixed polyhedra", () => {
  it("regular tetrahedron pipeline produces 4 faces and 4 - 1 = 3 folds", () => {
    const { tree, layout } = pipeline(tetrahedron());
    expect(layout.faces.length).toBe(4);
    expect(tree.folds.length).toBe(3);
  });

  it("regular octahedron pipeline produces 8 faces and 8 - 1 = 7 folds", () => {
    const { tree, layout } = pipeline(octahedron());
    expect(layout.faces.length).toBe(8);
    expect(tree.folds.length).toBe(7);
  });
});

describe("v2 target — no overlap in layout", () => {
  // Overlap detection and automatic recut are explicit v2 work
  // (sessions 0015 and 0016). The property is intentionally a todo so it shows
  // up in the report. Promote to a real test once polygon-clipping lands.
  it.todo(
    "no two non-adjacent FlatFace polygons overlap (requires v2 overlap detection)",
  );
});
