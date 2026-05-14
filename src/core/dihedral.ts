/**
 * Dihedral edge weights for the spanning-tree stage.
 *
 * Per ADR 0004, v2's spanning tree is a dihedral-weighted MST.
 * This pure stage produces one weight per adjacency: the angle
 * between the two faces' outward unit normals, in [0, π]. A
 * near-coplanar edge weighs ~0 (cheap to fold); a sharp crease
 * weighs toward π (expensive — the MST prefers to cut it).
 *
 * Assumes consistent face winding (the v2 corpus is verified
 * consistent) and non-degenerate faces. A zero-area face throws.
 */

import type { DualGraph } from "./adjacency.js";
import type { Mesh3D, Vec3 } from "./mesh.js";

/** Minimum cross-product magnitude for a face to have a defined normal. */
const DEGENERATE_NORMAL_EPS = 1e-12;

const subtract = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

/**
 * Outward unit normal of a triangular face: normalized cross
 * product of two edge vectors. Throws when the face is degenerate
 * (near-zero area), naming the face index, rather than returning
 * a NaN-bearing vector.
 */
const faceNormal = (mesh: Mesh3D, faceIndex: number): Vec3 => {
  const [i0, i1, i2] = mesh.faces[faceIndex];
  const p0 = mesh.vertices[i0];
  const p1 = mesh.vertices[i1];
  const p2 = mesh.vertices[i2];
  const e1 = subtract(p1, p0);
  const e2 = subtract(p2, p0);
  const n = cross(e1, e2);
  const m = Math.sqrt(dot(n, n));
  if (m < DEGENERATE_NORMAL_EPS) {
    throw new Error(
      `Face ${faceIndex} is degenerate (cross-product magnitude ${m}); cannot compute normal.`,
    );
  }
  return [n[0] / m, n[1] / m, n[2] / m];
};

/**
 * Dihedral fold-weight per adjacency, parallel-indexed to
 * `dual.adjacencies`. For each adjacency the weight is
 * `arccos(clamp(dot(nA, nB), -1, 1))` — the angle between the two
 * faces' outward unit normals, in [0, π].
 */
export function computeDihedralWeights(
  mesh: Mesh3D,
  dual: DualGraph,
): number[] {
  const faceCount = mesh.faces.length;
  const normals: Vec3[] = new Array(faceCount);
  for (let i = 0; i < faceCount; i++) {
    normals[i] = faceNormal(mesh, i);
  }

  const weights: number[] = new Array(dual.adjacencies.length);
  for (let i = 0; i < dual.adjacencies.length; i++) {
    const { faceA, faceB } = dual.adjacencies[i];
    const d = clamp(dot(normals[faceA], normals[faceB]), -1, 1);
    weights[i] = Math.acos(d);
  }
  return weights;
}
