# Session 0009 — Spanning tree

## What was attempted

Build the Spanning Tree stage of the v1 pipeline per ADR 0001 —
taking the `DualGraph` from Session 0008 and producing a
`SpanningTree` that classifies each adjacency as fold or cut,
plus a parent-pointer structure for downstream stages to walk in
order. Also write ADR 0003 — the spanning-tree algorithm choice
deferred from ADR 0001 — committing to plain DFS for v1 with
weighted MST deferred to v2.

## What shipped

- `docs/decisions/0003-spanning-tree-algorithm.md` — ADR 0003.
- `src/core/spanning-tree.ts` — `SpanningTree` type and
  `buildSpanningTree(dual, root?)`. Iterative DFS from root,
  followed by two-pass adjacency classification (an adjacency
  is fold iff it connects a face to its parent in the tree).
  Pure function; rejects invalid root.
- `test/unit/spanning-tree.test.ts` — four tests: per-platonic-solid
  fold/cut counts (3/3, 11/7, 7/5) and tree-structure invariants,
  plus a rejection test for out-of-range root.

All four verification commands green. Test suite reports 12
passing tests (1 sanity + 4 parser + 3 adjacency + 4 spanning-tree).

## What's next

Session 0010 — Flatten. Walk the spanning tree from root, placing
each face on the 2D plane: vertex 0 at the origin, vertex 1 along
the positive x-axis, vertex 2 forced by the original edge lengths.
For each subsequent face, two of its three vertices are already
placed (the endpoints of the shared edge with its parent); the
third vertex is positioned opposite the parent face. Produces a
2D layout consumed by Session 0011 (SVG export).

## Decisions made or deferred

- **ADR 0003 committed:** plain DFS spanning tree for v1, weighted
  MST deferred to v2. Defers the weighting-heuristic decision to
  v2's session.
- **Iterative DFS, not recursive.** Robust for deeper meshes
  beyond v1's corpus; same complexity, no recursion-depth risk.
- **Two-pass classification.** Phase 1 populates `parent[]`;
  Phase 2 iterates adjacencies. Cleaner than classifying during
  traversal — no "already classified" guard needed.
- **Root face is 0 by default,** with an optional override for
  test flexibility. Determinism makes tests reliable.
- **`parent[root] === -1` as the sentinel.** Common convention,
  type-system-friendly via numeric comparison.

## Queue updates

No items closed. No items added.
