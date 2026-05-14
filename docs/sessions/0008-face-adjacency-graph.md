# Session 0008 — Face adjacency graph

## What was attempted

Build the Adjacency stage of the v1 pipeline per ADR 0001 — taking
`Mesh3D` (from Session 0007's parser) and producing a `DualGraph`
where each node is a face and each edge connects two faces sharing
a 3D edge. This is the input that Sessions 0009, 0010, and 0011
all consume. Also write ADR 0002 — the mesh representation
decision deferred from ADR 0001 — committing to "adjacency as a
separate output stage, not a half-edge mesh."

## What shipped

- `docs/decisions/0002-adjacency-as-separate-stage.md` — ADR 0002.
- `src/core/adjacency.ts` — `Adjacency` and `DualGraph` types plus
  `buildAdjacency(mesh: Mesh3D): DualGraph`. Pure function; emits
  one adjacency per shared 3D edge; rejects boundary or
  non-manifold meshes with a clear error.
- `test/unit/adjacency.test.ts` — three tests asserting expected
  adjacency counts and per-face neighbor counts for the platonic
  corpus: tetrahedron 6/3, cube 18/3, octahedron 12/3.

All three verification commands green. Test suite reports 8
passing tests total (1 sanity + 4 parser + 3 adjacency).

## What's next

Session 0009 — Spanning tree. DFS over the `DualGraph` to
classify each adjacency as fold or cut, producing a spanning tree
of the adjacency graph. The deferred algorithm decision (MST with
weights vs. plain DFS tree) becomes acute and warrants its own
ADR 0003.

## Decisions made or deferred

- **ADR 0002 committed:** adjacency as a separate output stage,
  not a half-edge mesh. Defers the `HalfEdgeMesh` introduction
  until v3+ if needed.
- **`DualGraph` shape:** `adjacencies: Adjacency[]` plus a
  face-indexed `byFace: number[][]` lookup. Trades a small amount
  of memory for O(1) neighbor lookup, which Session 0009 needs.
- **Edge canonicalization:** sort vertex-index pairs ascending,
  use string concatenation as the Map key. Simple and readable.
- **Boundary/non-manifold rejection:** throws with a clear error.
  v1 corpus is closed manifold by construction; v2+ may need a
  different policy.
- **No renderer changes.** `src/app/` stays as it is — visualizing
  the adjacency graph is cosmetic and deferred.

## Queue updates

No items closed. No items added.
