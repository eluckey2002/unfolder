/**
 * Parametric mesh generators for property-based tests.
 *
 * Every generator here produces a *closed manifold* — buildAdjacency requires
 * every edge to be shared by exactly two faces. The malformed fixtures at the
 * bottom of the file are deliberate violations of that, used to drive the
 * rejection properties.
 */

import type { Mesh3D, Vec3 } from "../../src/core/mesh.js";

const translate = (v: Vec3, t: Vec3): Vec3 => [v[0] + t[0], v[1] + t[1], v[2] + t[2]];
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];

const transform = (vertices: Vec3[], s: number, t: Vec3): Vec3[] =>
  vertices.map((v) => translate(scale(v, s), t));

/** Regular tetrahedron — 4 vertices, 4 faces. */
export function tetrahedron(s = 1, t: Vec3 = [0, 0, 0]): Mesh3D {
  const vertices: Vec3[] = transform(
    [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ],
    s,
    t,
  );
  return {
    vertices,
    faces: [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 1],
      [1, 3, 2],
    ],
  };
}

/**
 * Unit cube triangulated — 8 vertices, 12 faces. Each face split along a
 * diagonal; the diagonal becomes a shared internal adjacency.
 */
export function cube(s = 1, t: Vec3 = [0, 0, 0]): Mesh3D {
  const vertices: Vec3[] = transform(
    [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    s,
    t,
  );
  return {
    vertices,
    faces: [
      // bottom (z=0), normal -z
      [0, 2, 1],
      [0, 3, 2],
      // top (z=1), normal +z
      [4, 5, 6],
      [4, 6, 7],
      // front (y=0), normal -y
      [0, 1, 5],
      [0, 5, 4],
      // back (y=1), normal +y
      [3, 7, 6],
      [3, 6, 2],
      // left (x=0), normal -x
      [0, 4, 7],
      [0, 7, 3],
      // right (x=1), normal +x
      [1, 2, 6],
      [1, 6, 5],
    ],
  };
}

/** Regular octahedron — 6 vertices, 8 faces. */
export function octahedron(s = 1, t: Vec3 = [0, 0, 0]): Mesh3D {
  const vertices: Vec3[] = transform(
    [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ],
    s,
    t,
  );
  return {
    vertices,
    faces: [
      [0, 2, 4],
      [2, 1, 4],
      [1, 3, 4],
      [3, 0, 4],
      [2, 0, 5],
      [1, 2, 5],
      [3, 1, 5],
      [0, 3, 5],
    ],
  };
}

/**
 * Triangular prism — 6 vertices, 8 faces (2 triangular caps + 3 quad sides
 * each split into 2 triangles). Parametric by edge length and height.
 */
export function triangularPrism(
  edge = 1,
  height = 1,
  t: Vec3 = [0, 0, 0],
): Mesh3D {
  const tri = (Math.sqrt(3) / 2) * edge;
  const vertices: Vec3[] = [
    [0, 0, height],
    [edge, 0, height],
    [edge / 2, tri, height],
    [0, 0, 0],
    [edge, 0, 0],
    [edge / 2, tri, 0],
  ].map((v) => [v[0] + t[0], v[1] + t[1], v[2] + t[2]] as Vec3);
  return {
    vertices,
    faces: [
      // top cap (z=height), normal +z
      [0, 1, 2],
      // bottom cap (z=0), normal -z
      [3, 5, 4],
      // side 0 (between 0-1 and 3-4)
      [0, 4, 1],
      [0, 3, 4],
      // side 1 (between 1-2 and 4-5)
      [1, 5, 2],
      [1, 4, 5],
      // side 2 (between 2-0 and 5-3)
      [2, 3, 0],
      [2, 5, 3],
    ],
  };
}

/** A single triangle — boundary edges everywhere, buildAdjacency must reject. */
export const openMeshFixture: Mesh3D = {
  vertices: [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ],
  faces: [[0, 1, 2]],
};

/**
 * Three faces sharing an edge (0, 1) — non-manifold; buildAdjacency must
 * reject because edge (0, 1) is shared by 3 faces, not 2.
 */
export const nonManifoldFixture: Mesh3D = {
  vertices: [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
  ],
  faces: [
    [0, 1, 2],
    [0, 1, 3],
    [0, 1, 4],
  ],
};
