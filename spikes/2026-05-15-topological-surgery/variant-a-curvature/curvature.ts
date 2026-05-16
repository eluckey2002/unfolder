/**
 * Variant A — Vertex-curvature pre-flatten guard (diagnostic).
 *
 * Per Takahashi 2011 §3.3, classify each mesh vertex by Gaussian
 * curvature (sign of 2π − Σ corner angles at the vertex):
 *
 *   hyperbolic  (>2π)  — needs ≥ 2 incident cut edges
 *   elliptic    (<2π)  — needs ≥ 1 incident cut edge
 *   parabolic   (=2π)  — needs 0
 *
 * This pass is purely diagnostic on top of v2's MST + recut output.
 * It does not alter the pipeline; it reports whether v2's final
 * cut set (spanning-tree cuts + promoted recut cuts) already
 * satisfies the necessary condition at every vertex.
 *
 * Spike code: kept self-contained — no edits to src/core/.
 */

import type { Adjacency } from "../../../src/core/adjacency.js";
import type { Mesh3D, Vec3 } from "../../../src/core/mesh.js";

export type CurvatureClass = "hyperbolic" | "elliptic" | "parabolic";

export interface VertexCurvature {
  /** Vertex index in the mesh. */
  vertex: number;
  /** Sum of corner angles around the vertex, in radians. */
  angleSum: number;
  /** Gaussian-curvature class. */
  class: CurvatureClass;
}

export interface VertexViolation {
  vertex: number;
  class: CurvatureClass;
  required: number;
  incidentCuts: number;
}

export interface CurvatureReport {
  /** Per-vertex curvature classification. */
  vertices: VertexCurvature[];
  /** Vertices that violate the Takahashi necessary condition. */
  violations: VertexViolation[];
  /** Counts by class — convenience for the summary table. */
  counts: { hyperbolic: number; elliptic: number; parabolic: number };
}

/** Threshold around 2π for classifying a vertex as parabolic. Radians. */
const PARABOLIC_EPS = 1e-6;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): number => Math.sqrt(dot(a, a));
const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

/**
 * Per-vertex corner-angle sum across all incident faces. For a
 * closed manifold, the sum equals 2π for a "flat" (developable)
 * vertex; > 2π is hyperbolic (saddle); < 2π is elliptic (peak).
 */
const computeAngleSums = (mesh: Mesh3D): Float64Array => {
  const sums = new Float64Array(mesh.vertices.length);
  for (const face of mesh.faces) {
    const [i0, i1, i2] = face;
    const p0 = mesh.vertices[i0];
    const p1 = mesh.vertices[i1];
    const p2 = mesh.vertices[i2];
    // Corner at i0: between edges (i0,i1) and (i0,i2).
    const a01 = sub(p1, p0);
    const a02 = sub(p2, p0);
    const a10 = sub(p0, p1);
    const a12 = sub(p2, p1);
    const a20 = sub(p0, p2);
    const a21 = sub(p1, p2);
    const corner = (u: Vec3, v: Vec3): number => {
      const denom = norm(u) * norm(v);
      if (denom === 0) return 0;
      return Math.acos(clamp(dot(u, v) / denom, -1, 1));
    };
    sums[i0] += corner(a01, a02);
    sums[i1] += corner(a10, a12);
    sums[i2] += corner(a20, a21);
  }
  return sums;
};

const classify = (angleSum: number): CurvatureClass => {
  const delta = angleSum - 2 * Math.PI;
  if (delta > PARABOLIC_EPS) return "hyperbolic";
  if (delta < -PARABOLIC_EPS) return "elliptic";
  return "parabolic";
};

/**
 * Build the per-vertex incident-cut count from the post-recut
 * cut set. `cuts` mirrors `RecutResult.cuts` — the union of the
 * spanning tree's original cut edges plus the fold edges promoted
 * by the recut set-cover.
 */
const countIncidentCuts = (
  vertexCount: number,
  cuts: readonly Adjacency[],
): Int32Array => {
  const counts = new Int32Array(vertexCount);
  for (const adj of cuts) {
    counts[adj.edge[0]]++;
    counts[adj.edge[1]]++;
  }
  return counts;
};

const requiredCutsForClass = (cls: CurvatureClass): number => {
  if (cls === "hyperbolic") return 2;
  if (cls === "elliptic") return 1;
  return 0;
};

/**
 * Diagnostic pass: classify every vertex, count incident cuts,
 * flag every violation of the Takahashi necessary condition.
 *
 * Returning the full per-vertex list (not just violations) so the
 * findings doc can quote class distributions per model.
 */
export function reportCurvature(
  mesh: Mesh3D,
  cuts: readonly Adjacency[],
): CurvatureReport {
  const sums = computeAngleSums(mesh);
  const incident = countIncidentCuts(mesh.vertices.length, cuts);

  const vertices: VertexCurvature[] = [];
  const violations: VertexViolation[] = [];
  const counts = { hyperbolic: 0, elliptic: 0, parabolic: 0 };

  for (let v = 0; v < mesh.vertices.length; v++) {
    const cls = classify(sums[v]);
    counts[cls]++;
    vertices.push({ vertex: v, angleSum: sums[v], class: cls });
    const need = requiredCutsForClass(cls);
    if (incident[v] < need) {
      violations.push({
        vertex: v,
        class: cls,
        required: need,
        incidentCuts: incident[v],
      });
    }
  }

  return { vertices, violations, counts };
}
