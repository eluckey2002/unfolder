/**
 * Greedy set-cover recut: split an overlapping unfolding into
 * connected, internally overlap-free pieces. Per ADR 0005.
 *
 * For each overlap pair, the fold-edge path between the two faces
 * in the spanning tree is the set of edges whose removal would
 * separate them. We greedily pick a small set of edges that
 * covers every overlap path, remove them, and each connected
 * component of the surviving fold forest is one `Piece`.
 *
 * No re-flattening: rigid unfolding is local, so the original
 * layout's positions restricted to a component are already a
 * valid overlap-free layout of that piece. `recut` selects faces
 * from the existing layout rather than recomputing geometry.
 */

import type { Adjacency } from "./adjacency.js";
import type { Layout2D } from "./flatten.js";
import type { FaceOverlap } from "./overlap.js";
import type { SpanningTree } from "./spanning-tree.js";
import { makeUnionFind } from "./union-find.js";

/**
 * One connected piece: a layout of the piece's faces (selected
 * from the original layout — positions are not recomputed) and
 * the fold edges internal to it.
 *
 * `layout.faces` is a dense array of the piece's faces in
 * ascending mesh-face-index order. It is NOT face-index-aligned
 * like `buildLayout`'s output. `faces[k]` is the mesh face index
 * of `layout.faces[k]`. `folds` carries original mesh face
 * indices.
 */
export interface Piece {
  layout: Layout2D;
  faces: number[];
  folds: Adjacency[];
}

/**
 * The recut output: the connected pieces plus every cut edge in
 * the final unfolding — both the spanning tree's original cuts
 * and the fold edges promoted to cuts by the set-cover step.
 * These are the edges a builder glues together.
 */
export interface RecutResult {
  pieces: Piece[];
  cuts: Adjacency[];
}

/**
 * Map each non-root face to its parent fold edge. Each non-root
 * face has exactly one parent edge; we use the child face index
 * to identify the fold for set-cover purposes.
 */
const buildParentFoldMap = (
  tree: SpanningTree,
): Map<number, Adjacency> => {
  const map = new Map<number, Adjacency>();
  for (const fold of tree.folds) {
    const { faceA, faceB } = fold;
    if (tree.parent[faceA] === faceB) {
      map.set(faceA, fold);
    } else if (tree.parent[faceB] === faceA) {
      map.set(faceB, fold);
    }
  }
  return map;
};

const computeDepths = (
  parent: readonly number[],
  root: number,
): number[] => {
  const depth = new Array<number>(parent.length).fill(-1);
  depth[root] = 0;
  for (let i = 0; i < parent.length; i++) {
    if (depth[i] !== -1) continue;
    const path: number[] = [];
    let cur = i;
    while (cur !== -1 && depth[cur] === -1) {
      path.push(cur);
      cur = parent[cur];
    }
    let d = cur === -1 ? 0 : depth[cur];
    for (let j = path.length - 1; j >= 0; j--) {
      d++;
      depth[path[j]] = d;
    }
  }
  return depth;
};

/**
 * Set of child-face indices identifying the fold edges on the
 * tree path from `a` to `b`. Each step contributes the face
 * being walked up from (its parent edge).
 */
const treePathChildren = (
  a: number,
  b: number,
  parent: readonly number[],
  depth: readonly number[],
): Set<number> => {
  const result = new Set<number>();
  let x = a;
  let y = b;
  while (depth[x] > depth[y]) {
    result.add(x);
    x = parent[x];
  }
  while (depth[y] > depth[x]) {
    result.add(y);
    y = parent[y];
  }
  while (x !== y) {
    result.add(x);
    result.add(y);
    x = parent[x];
    y = parent[y];
  }
  return result;
};

/**
 * Greedy set cover. Repeatedly pick the child-face appearing in
 * the most still-uncovered paths; tie-break by smallest child-face
 * index. Returns the set of cut child-face indices.
 */
const greedySetCover = (paths: Set<number>[]): Set<number> => {
  const cuts = new Set<number>();
  if (paths.length === 0) return cuts;

  const coverage = new Map<number, Set<number>>();
  for (let i = 0; i < paths.length; i++) {
    for (const f of paths[i]) {
      let s = coverage.get(f);
      if (!s) {
        s = new Set<number>();
        coverage.set(f, s);
      }
      s.add(i);
    }
  }

  let remaining = paths.length;
  while (remaining > 0) {
    let bestFace = -1;
    let bestCount = 0;
    for (const [f, set] of coverage) {
      if (
        set.size > bestCount ||
        (set.size === bestCount && (bestFace === -1 || f < bestFace))
      ) {
        bestFace = f;
        bestCount = set.size;
      }
    }
    if (bestFace === -1 || bestCount === 0) break;

    cuts.add(bestFace);
    const newlyCovered = coverage.get(bestFace)!;
    for (const pIdx of newlyCovered) {
      remaining--;
      for (const f of paths[pIdx]) {
        if (f === bestFace) continue;
        const set = coverage.get(f);
        if (set) {
          set.delete(pIdx);
          if (set.size === 0) coverage.delete(f);
        }
      }
    }
    coverage.delete(bestFace);
  }
  return cuts;
};

const connectedComponents = (
  faceCount: number,
  cuts: ReadonlySet<number>,
  parentFold: ReadonlyMap<number, Adjacency>,
): number[][] => {
  const uf = makeUnionFind(faceCount);

  for (const [childFace, fold] of parentFold) {
    if (cuts.has(childFace)) continue;
    uf.union(fold.faceA, fold.faceB);
  }

  const byRoot = new Map<number, number[]>();
  for (let i = 0; i < faceCount; i++) {
    const r = uf.find(i);
    let list = byRoot.get(r);
    if (!list) {
      list = [];
      byRoot.set(r, list);
    }
    list.push(i);
  }

  const components = Array.from(byRoot.values());
  for (const c of components) c.sort((a, b) => a - b);
  components.sort((a, b) => a[0] - b[0]);
  return components;
};

/**
 * Split an overlapping unfolding into connected, internally
 * overlap-free pieces by greedy set-cover over the overlap tree
 * paths. See ADR 0005.
 *
 * Empty `overlaps` yields a single piece containing every face.
 */
export function recut(
  tree: SpanningTree,
  layout: Layout2D,
  overlaps: FaceOverlap[],
): RecutResult {
  const faceCount = layout.faces.length;
  const parentFold = buildParentFoldMap(tree);
  const depth = computeDepths(tree.parent, tree.root);

  const paths: Set<number>[] = overlaps.map((o) =>
    treePathChildren(o.faceA, o.faceB, tree.parent, depth),
  );
  const cuts = greedySetCover(paths);
  const components = connectedComponents(faceCount, cuts, parentFold);

  const inComponent = new Array<number>(faceCount).fill(-1);
  for (let ci = 0; ci < components.length; ci++) {
    for (const f of components[ci]) inComponent[f] = ci;
  }

  const pieceFolds: Adjacency[][] = components.map(() => []);
  for (const [childFace, fold] of parentFold) {
    if (cuts.has(childFace)) continue;
    const ci = inComponent[fold.faceA];
    if (ci !== -1 && ci === inComponent[fold.faceB]) {
      pieceFolds[ci].push(fold);
    }
  }

  const promoted: Adjacency[] = [];
  for (const childFace of cuts) {
    const fold = parentFold.get(childFace);
    if (fold) promoted.push(fold);
  }

  const pieces: Piece[] = components.map((faces, ci) => ({
    layout: { faces: faces.map((i) => layout.faces[i]) },
    faces,
    folds: pieceFolds[ci],
  }));

  return {
    pieces,
    cuts: [...tree.cuts, ...promoted],
  };
}
