/**
 * Variant B — Blended convex/concave/length fold weights.
 *
 * Per Export-Paper-Model (`docs/references/takahashi.md`), score
 * every dual-graph edge with a linear sum of three terms:
 *
 *   weight = CONVEX  · max(+θ, 0) / π
 *          + CONCAVE · max(−θ, 0) / π
 *          + LENGTH  · length / avg_length
 *
 * where θ is the *signed* dihedral angle in [−π, π] (positive =
 * convex ridge, negative = concave valley). The weight is the
 * cost of keeping this edge as a fold; the MST minimises it, so
 * low-weight edges become folds and high-weight edges become cuts.
 *
 * v2's `computeDihedralWeights` only exposes the unsigned angle in
 * [0, π], so the signed value is computed locally here. The mesh's
 * face winding is consistent (verified for the v2 corpus, per ADR
 * 0004) — sign is determined by which side of the shared edge each
 * face's apex sits, relative to the face normals.
 *
 * Chosen coefficients (documented in the findings doc):
 *
 *   CONVEX  = 0.5   (mild preference to cut convex ridges)
 *   CONCAVE = 1.0   (stronger preference to cut concave valleys —
 *                    concave cuts hide in the assembled fold)
 *   LENGTH  = -0.1  (long edges prefer to fold; reduces total
 *                    cut length, which is the v3 metric we care
 *                    about most directly)
 *
 * Spike code: kept self-contained — no edits to src/core/.
 */

import type { Adjacency, DualGraph } from "../../../src/core/adjacency.js";
import type { Mesh3D, Vec3 } from "../../../src/core/mesh.js";

export interface BlendCoeffs {
  convex: number;
  concave: number;
  length: number;
}

export const DEFAULT_BLEND: BlendCoeffs = {
  convex: 0.5,
  concave: 1.0,
  length: -0.1,
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): number => Math.sqrt(dot(a, a));
const normalize = (a: Vec3): Vec3 => {
  const m = norm(a);
  return [a[0] / m, a[1] / m, a[2] / m];
};
const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

const faceNormal = (mesh: Mesh3D, f: number): Vec3 => {
  const [i0, i1, i2] = mesh.faces[f];
  return normalize(
    cross(
      sub(mesh.vertices[i1], mesh.vertices[i0]),
      sub(mesh.vertices[i2], mesh.vertices[i0]),
    ),
  );
};

const edgeLength = (mesh: Mesh3D, adj: Adjacency): number => {
  const [a, b] = adj.edge;
  const va = mesh.vertices[a];
  const vb = mesh.vertices[b];
  return norm(sub(vb, va));
};

/**
 * Signed dihedral in [−π, π]. Positive = convex (faces bend
 * outward at this edge); negative = concave. The convention:
 * project face B's normal onto face A's tangent plane around
 * the shared edge; signed angle from A's normal to B's normal
 * is the dihedral.
 */
const signedDihedral = (
  mesh: Mesh3D,
  adj: Adjacency,
  normals: Vec3[],
): number => {
  const nA = normals[adj.faceA];
  const nB = normals[adj.faceB];
  const cosA = clamp(dot(nA, nB), -1, 1);
  const unsigned = Math.acos(cosA);

  // Sign: positive (convex) when the edge connecting the apex of
  // face A to the apex of face B points "outward" — i.e., the
  // midpoint-to-apex vector of B has a positive component along nA.
  const sharedSet = new Set([adj.edge[0], adj.edge[1]]);
  const apexB = mesh.faces[adj.faceB].find((v) => !sharedSet.has(v));
  if (apexB === undefined) return unsigned; // degenerate; treat as convex

  // Edge midpoint:
  const e0 = mesh.vertices[adj.edge[0]];
  const e1 = mesh.vertices[adj.edge[1]];
  const mid: Vec3 = [
    (e0[0] + e1[0]) / 2,
    (e0[1] + e1[1]) / 2,
    (e0[2] + e1[2]) / 2,
  ];
  const apexPos = mesh.vertices[apexB];
  const toApex = sub(apexPos, mid);
  // If face B's apex sits "below" face A's plane (dot with nA < 0),
  // the edge is convex (nB rotated outward from nA). If above, concave.
  // Equivalent: standard signed-dihedral formulation, oriented so
  // convex == positive.
  const sign = dot(toApex, nA) < 0 ? 1 : -1;
  return sign * unsigned;
};

/**
 * Blended fold-weight per adjacency, parallel-indexed to
 * `dual.adjacencies`. Matches the signature contract of v2's
 * `computeDihedralWeights` so it slots into `buildSpanningTree`
 * unchanged.
 */
export function computeBlendedWeights(
  mesh: Mesh3D,
  dual: DualGraph,
  coeffs: BlendCoeffs = DEFAULT_BLEND,
): number[] {
  const faceCount = mesh.faces.length;
  const normals: Vec3[] = new Array(faceCount);
  for (let i = 0; i < faceCount; i++) normals[i] = faceNormal(mesh, i);

  const lengths = dual.adjacencies.map((a) => edgeLength(mesh, a));
  const avgLength =
    lengths.length === 0
      ? 1
      : lengths.reduce((s, l) => s + l, 0) / lengths.length;

  const weights = new Array<number>(dual.adjacencies.length);
  for (let i = 0; i < dual.adjacencies.length; i++) {
    const adj = dual.adjacencies[i];
    const theta = signedDihedral(mesh, adj, normals);
    const convexTerm = (theta > 0 ? theta : 0) / Math.PI;
    const concaveTerm = (theta < 0 ? -theta : 0) / Math.PI;
    const lengthTerm = lengths[i] / avgLength;
    weights[i] =
      coeffs.convex * convexTerm +
      coeffs.concave * concaveTerm +
      coeffs.length * lengthTerm;
  }
  return weights;
}
