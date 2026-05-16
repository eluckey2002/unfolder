/**
 * Spanning tree over the face adjacency graph.
 *
 * Per ADR 0004, v2 builds a dihedral-weighted minimum spanning
 * tree. Weights (one per adjacency, parallel-indexed) come from
 * `computeDihedralWeights`: flat edges weigh near 0 and prefer to
 * fold; sharp creases weigh near π and prefer to cut. The MST
 * minimizes total fold-weight. The result is rooted at `root`
 * and `parent[]` derived by traversing fold edges.
 *
 * Implementation: Kruskal with union-find. Output shape is the
 * v1 `SpanningTree` contract (root, parent, folds, cuts); only
 * the input signature changed — `weights` is now required.
 */

import type { Adjacency, DualGraph } from "./adjacency.js";
import { makeUnionFind } from "./union-find.js";

/**
 * Spanning tree over the face adjacency graph. Folds are the tree
 * edges (faces "stay connected" along these when unfolded); cuts
 * are the non-tree edges (faces "separate" along these).
 */
export interface SpanningTree {
  /** Root face index. `parent[root] === -1`. */
  root: number;
  /**
   * Parent face for each face, by face index. For non-root faces,
   * `parent[i]` is the face that discovered `i` while traversing
   * the rooted MST. For the root, `parent[root] === -1`.
   */
  parent: number[];
  /** Adjacencies selected into the MST (tree edges). */
  folds: Adjacency[];
  /** Adjacencies not selected (non-tree edges). */
  cuts: Adjacency[];
}

export function buildSpanningTree(
  dual: DualGraph,
  weights: number[],
  root: number = 0,
): SpanningTree {
  const faceCount = dual.byFace.length;

  if (root < 0 || root >= faceCount) {
    throw new Error(
      `Root face ${root} out of range; valid range is [0, ${faceCount}).`,
    );
  }
  if (weights.length !== dual.adjacencies.length) {
    throw new Error(
      `weights.length (${weights.length}) must equal dual.adjacencies.length (${dual.adjacencies.length}).`,
    );
  }

  const order = new Array<number>(dual.adjacencies.length);
  for (let i = 0; i < order.length; i++) order[i] = i;
  order.sort((a, b) => weights[a] - weights[b]);

  const uf = makeUnionFind(faceCount);
  const isFold = new Array<boolean>(dual.adjacencies.length).fill(false);
  for (const idx of order) {
    const { faceA, faceB } = dual.adjacencies[idx];
    if (uf.union(faceA, faceB)) {
      isFold[idx] = true;
    }
  }

  const folds: Adjacency[] = [];
  const cuts: Adjacency[] = [];
  for (let i = 0; i < dual.adjacencies.length; i++) {
    if (isFold[i]) {
      folds.push(dual.adjacencies[i]);
    } else {
      cuts.push(dual.adjacencies[i]);
    }
  }

  const foldNeighbors: number[][] = Array.from(
    { length: faceCount },
    () => [],
  );
  for (let i = 0; i < dual.adjacencies.length; i++) {
    if (isFold[i]) {
      const adj = dual.adjacencies[i];
      foldNeighbors[adj.faceA].push(adj.faceB);
      foldNeighbors[adj.faceB].push(adj.faceA);
    }
  }

  const parent = new Array<number>(faceCount).fill(-1);
  const visited = new Array<boolean>(faceCount).fill(false);
  visited[root] = true;
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const face = queue[head++];
    for (const neighbor of foldNeighbors[face]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        parent[neighbor] = face;
        queue.push(neighbor);
      }
    }
  }

  let unreached = 0;
  for (let i = 0; i < faceCount; i++) {
    if (!visited[i]) unreached++;
  }
  if (unreached > 0) {
    throw new Error(
      `buildSpanningTree requires a connected dual graph (single mesh component); ${unreached} of ${faceCount} faces were unreachable from root ${root}.`,
    );
  }

  return { root, parent, folds, cuts };
}
