/**
 * Core mesh types for the unfolder pipeline.
 *
 * Per ADR 0001, the Parse stage's output is "a 3D mesh — a list of
 * vertices and a list of triangular faces indexing into the vertex
 * list." This file defines that contract.
 */

export type Vec3 = [number, number, number];

/** A triangular face, expressed as three vertex indices into Mesh3D.vertices. */
export type Triangle = [number, number, number];

export interface Mesh3D {
  /** Deduplicated vertex positions. */
  vertices: Vec3[];
  /** Faces, each referencing three vertex indices. */
  faces: Triangle[];
}
