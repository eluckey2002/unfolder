import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import type { DualGraph } from "../../src/core/adjacency.js";
import { computeDihedralWeights } from "../../src/core/dihedral.js";
import type { Mesh3D } from "../../src/core/mesh.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { closedMeshArb } from "../property/arbitraries.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../corpus");

const EPS = 1e-9;

// Hand-built fixtures: a face pair alone is non-manifold, so buildAdjacency
// would reject it. Constructing DualGraph directly is the cleanest way to
// exercise computeDihedralWeights on known angles.

// Two coplanar triangles sharing edge (vertex 1, vertex 2). Both lie in
// z = 0, wound CCW from +z; both normals point +z.
const coplanarPair = (): { mesh: Mesh3D; dual: DualGraph } => {
  const mesh: Mesh3D = {
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    faces: [
      [0, 1, 2],
      [1, 3, 2],
    ],
  };
  const dual: DualGraph = {
    adjacencies: [{ faceA: 0, faceB: 1, edge: [1, 2] }],
    byFace: [[0], [0]],
  };
  return { mesh, dual };
};

// Two triangles sharing edge (vertex 0, vertex 1) along the x-axis. Face 0
// lies in z = 0 (normal +z); face 1 lies in y = 0 (normal +y). Winding is
// consistent — the shared edge is traversed in opposite directions.
const rightAnglePair = (): { mesh: Mesh3D; dual: DualGraph } => {
  const mesh: Mesh3D = {
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    faces: [
      [0, 1, 2],
      [1, 0, 3],
    ],
  };
  const dual: DualGraph = {
    adjacencies: [{ faceA: 0, faceB: 1, edge: [0, 1] }],
    byFace: [[0], [0]],
  };
  return { mesh, dual };
};

// Face 1 has two vertex indices pointing at the same 3D position, so its
// edge vectors are parallel and the cross product vanishes — a degenerate
// zero-area face.
const degeneratePair = (): { mesh: Mesh3D; dual: DualGraph } => {
  const mesh: Mesh3D = {
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    faces: [
      [0, 1, 2],
      [0, 1, 3],
    ],
  };
  const dual: DualGraph = {
    adjacencies: [{ faceA: 0, faceB: 1, edge: [0, 1] }],
    byFace: [[0], [0]],
  };
  return { mesh, dual };
};

describe("computeDihedralWeights", () => {
  it("coplanar pair → weight ≈ 0", () => {
    const { mesh, dual } = coplanarPair();
    const weights = computeDihedralWeights(mesh, dual);
    expect(weights).toHaveLength(1);
    expect(weights[0]).toBeLessThan(EPS);
  });

  it("right-angle fold → weight ≈ π/2", () => {
    const { mesh, dual } = rightAnglePair();
    const weights = computeDihedralWeights(mesh, dual);
    expect(weights).toHaveLength(1);
    expect(Math.abs(weights[0] - Math.PI / 2)).toBeLessThan(EPS);
  });

  it("cube corpus: 12 cube-edge adjacencies ≈ π/2, 6 within-face diagonals ≈ 0", () => {
    // A triangulated cube has 12 triangles and 18 adjacencies: 12 across
    // cube edges (faces meeting at 90°) plus 6 within each cube face (the
    // two triangles share the square's diagonal — coplanar).
    const obj = readFileSync(join(corpusDir, "cube.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);
    const weights = computeDihedralWeights(mesh, dual);
    expect(weights).toHaveLength(18);
    const sharp = weights.filter((w) => Math.abs(w - Math.PI / 2) < 1e-6);
    const flat = weights.filter((w) => w < 1e-6);
    expect(sharp.length).toBe(12);
    expect(flat.length).toBe(6);
    expect(sharp.length + flat.length).toBe(weights.length);
  });

  it("throws on a degenerate face, naming the face index", () => {
    const { mesh, dual } = degeneratePair();
    expect(() => computeDihedralWeights(mesh, dual)).toThrow(/Face 1/);
  });
});

describe("computeDihedralWeights (property)", () => {
  it("every weight lands in [0, π]", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const dual = buildAdjacency(mesh);
        const weights = computeDihedralWeights(mesh, dual);
        for (const w of weights) {
          expect(Number.isFinite(w)).toBe(true);
          expect(w).toBeGreaterThanOrEqual(0);
          expect(w).toBeLessThanOrEqual(Math.PI);
        }
      }),
    );
  });

  it("is deterministic — same input yields identical weights", () => {
    fc.assert(
      fc.property(closedMeshArb, (mesh) => {
        const dual = buildAdjacency(mesh);
        const a = computeDihedralWeights(mesh, dual);
        const b = computeDihedralWeights(mesh, dual);
        expect(b).toEqual(a);
      }),
    );
  });
});
