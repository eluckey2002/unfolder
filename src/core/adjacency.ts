/**
 * Face adjacency graph (dual graph) construction.
 *
 * Per ADR 0002, adjacency is a separate output stage consuming
 * `Mesh3D` and producing a `DualGraph`. This is the Adjacency stage
 * in ADR 0001's pipeline.
 */

import type { Mesh3D } from "./mesh.js";
import { canonicalPairKey } from "./pair-key.js";

/**
 * One adjacency relationship: two faces meeting at a shared edge.
 */
export interface Adjacency {
  /** The smaller face index (canonical ordering). */
  faceA: number;
  /** The larger face index. */
  faceB: number;
  /** The shared 3D edge as two vertex indices, sorted ascending. */
  edge: [number, number];
}

/**
 * Face adjacency graph (the dual graph). One node per face, one
 * edge per shared 3D edge between adjacent faces.
 */
export interface DualGraph {
  /** All adjacencies, one entry per shared edge in the mesh. */
  adjacencies: Adjacency[];
  /**
   * Indexed by face index. `byFace[i]` is the list of indices into
   * `adjacencies` that involve face `i`. Equivalent to "for each
   * face, which adjacencies touch it" — used by downstream stages
   * for O(1) neighbor lookup.
   */
  byFace: number[][];
}

export function buildAdjacency(mesh: Mesh3D): DualGraph {
  const edgeToFaces = new Map<string, number[]>();

  for (let faceIndex = 0; faceIndex < mesh.faces.length; faceIndex++) {
    const [v0, v1, v2] = mesh.faces[faceIndex];
    const edges: Array<[number, number]> = [
      [v0, v1],
      [v1, v2],
      [v2, v0],
    ];
    for (const [a, b] of edges) {
      const key = canonicalPairKey(a, b);
      const list = edgeToFaces.get(key);
      if (list) {
        list.push(faceIndex);
      } else {
        edgeToFaces.set(key, [faceIndex]);
      }
    }
  }

  const adjacencies: Adjacency[] = [];
  const byFace: number[][] = Array.from(
    { length: mesh.faces.length },
    () => [],
  );

  for (const [key, faces] of edgeToFaces) {
    const [minVertex, maxVertex] = key.split(",").map(Number) as [
      number,
      number,
    ];
    if (faces.length !== 2) {
      throw new Error(
        `Edge (${minVertex}, ${maxVertex}) is shared by ${faces.length} face(s); v1 supports closed manifolds only.`,
      );
    }
    const [f0, f1] = faces;
    const faceA = Math.min(f0, f1);
    const faceB = Math.max(f0, f1);
    const adjacencyIndex = adjacencies.length;
    adjacencies.push({ faceA, faceB, edge: [minVertex, maxVertex] });
    byFace[faceA].push(adjacencyIndex);
    byFace[faceB].push(adjacencyIndex);
  }

  return { adjacencies, byFace };
}
