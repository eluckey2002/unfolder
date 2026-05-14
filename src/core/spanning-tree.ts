/**
 * Spanning tree over the face adjacency graph.
 *
 * Per ADR 0003, v1 uses plain iterative DFS rooted at face 0
 * (configurable). The output classifies each adjacency as fold
 * (tree edge) or cut (non-tree edge); downstream stages walk the
 * tree via the parent-pointer array.
 */

import type { Adjacency, DualGraph } from "./adjacency.js";

/**
 * Spanning tree over the face adjacency graph. Folds are the tree
 * edges (faces "stay connected" along these when unfolded); cuts
 * are the non-tree edges (faces "separate" along these).
 */
export interface SpanningTree {
  /** Root face index. The traversal starts here; `parent[root] === -1`. */
  root: number;
  /**
   * Parent face for each face, by face index. For non-root faces,
   * `parent[i]` is the face that discovered `i` during DFS. For
   * the root, `parent[root] === -1`.
   */
  parent: number[];
  /** Adjacencies classified as fold (tree edges). */
  folds: Adjacency[];
  /** Adjacencies classified as cut (non-tree edges). */
  cuts: Adjacency[];
}

export function buildSpanningTree(
  dual: DualGraph,
  root: number = 0,
): SpanningTree {
  const faceCount = dual.byFace.length;

  if (root < 0 || root >= faceCount) {
    throw new Error(
      `Root face ${root} out of range; valid range is [0, ${faceCount}).`,
    );
  }

  const visited: boolean[] = new Array(faceCount).fill(false);
  const parent: number[] = new Array(faceCount).fill(-1);
  const stack: number[] = [root];
  visited[root] = true;

  while (stack.length > 0) {
    const face = stack.pop() as number;
    for (const adjacencyIndex of dual.byFace[face]) {
      const adj = dual.adjacencies[adjacencyIndex];
      const neighbor = adj.faceA === face ? adj.faceB : adj.faceA;
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        parent[neighbor] = face;
        stack.push(neighbor);
      }
    }
  }

  const folds: Adjacency[] = [];
  const cuts: Adjacency[] = [];

  for (const adj of dual.adjacencies) {
    if (parent[adj.faceA] === adj.faceB || parent[adj.faceB] === adj.faceA) {
      folds.push(adj);
    } else {
      cuts.push(adj);
    }
  }

  return { root, parent, folds, cuts };
}
