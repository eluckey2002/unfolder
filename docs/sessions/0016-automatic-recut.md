# Session 0016 — Automatic recut

## What was attempted

The consequential v2 algorithm session: cut the overlapping net
into multiple internally-overlap-free pieces, per ADR 0005. Add
`src/core/recut.ts` — greedy set-cover over the overlap paths,
splitting the fold forest into connected components. The key
simplification: no re-flattening — rigid unfolding is local, so the
original layout's positions restricted to a component are already a
valid overlap-free layout of that piece.

## What shipped

- `docs/decisions/0005-greedy-set-cover-recut.md` — ADR 0005,
  committing greedy set-cover recut and the one-shot-sufficiency
  argument.
- `src/core/recut.ts` — `recut(tree, layout, overlaps)`, a pure
  function. For each overlap pair it finds the fold-edge tree path,
  greedily covers all paths with a small set of cuts, splits the
  surviving folds into connected components, and selects each
  component's faces from the original layout into a `Piece`. Needs
  no `Mesh3D`.
- `scripts/baseline-pipeline.ts` — now runs recut, reports per-model
  piece counts alongside the pre-recut overlap count, and verifies
  every piece is internally overlap-free.
- `test/unit/recut.test.ts` — hand-built no-overlap, single-overlap,
  and shared-edge-cover cases, plus `ginger-bread.obj` end to end:
  every resulting piece is internally overlap-free.

## Recut results

The first buildable v2 output. Per-model, pre-recut overlap count →
piece count:

| model            | overlaps (pre-recut) | pieces |
| ---------------- | -------------------- | ------ |
| croissant.obj    | 388                  | 15     |
| cube.obj         | 0                    | 1      |
| cube.stl         | 0                    | 1      |
| cylinder.obj     | 0                    | 1      |
| deer.obj         | 857                  | 28     |
| egg.obj          | 0                    | 1      |
| ginger-bread.obj | 48                   | 5      |
| meat-sausage.obj | 184                  | 3      |
| octahedron.stl   | 0                    | 1      |
| tetrahedron.stl  | 0                    | 1      |
| uv-sphere.obj    | 0                    | 1      |

Convex models (cube, cube-stl, cylinder, egg, octahedron,
tetrahedron, uv-sphere) had zero pre-recut overlaps and recut to a
single piece. Concave models split into several — croissant 15,
deer 28, ginger-bread 5, meat-sausage 3. **Every piece across all
11 models is internally overlap-free**, verified by re-running
`detectOverlaps` on each piece. 58 pieces total across the corpus.

## What's next

Session 0017 — Glue tabs with edge labels. The first consumer of
`Piece[]` for rendering: tab geometry on the cut edges between
pieces, and matching edge labels so a builder knows which cut edge
mates to which. This is where `emitSvg` and the app pipeline get
their multi-piece rendering.

## Decisions made or deferred

- **Greedy set-cover, applied once** — ADR 0005. Optimal set-cover
  is NP-hard; greedy is the standard log-factor approximation.
  One pass is provably sufficient.
- **No re-flattening** — rigid unfolding is local, so `recut`
  selects faces from the existing layout rather than recomputing
  positions. ADR 0005.
- **Pieces are not packed** — they keep their original layout
  positions and still overlap each other on the plane; packing is
  session 0018.
- **`emitSvg` and the app are untouched** — multi-piece rendering
  is deferred to 0017, which needs it for glue tabs anyway.

## Handoff

- **Branch / worktree:** `claude/jolly-jones-2abf2f` at
  `.claude/worktrees/jolly-jones-2abf2f/`.
- **Commits:** `<short-sha>` `feat: automatic recut — greedy set-cover (ADR 0005)`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 56
  passing + 1 todo (57 total); `pnpm build` clean; `pnpm baseline`
  regenerated `docs/baseline-pipeline.md` with the new
  `overlaps (pre-recut)` and `pieces` columns; every piece across
  the 11-model corpus is internally overlap-free.
- **Decisions made or deferred:** greedy set-cover, one pass —
  ADR 0005; no re-flattening (rigid unfolding is local); pieces
  not packed (0018); emitSvg/app untouched (0017).
- **Queue / roadmap deltas:** Roadmap — 0016 → ✅, 0017 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0016 added to Sessions
  completed; Sessions planned advanced; ADR 0005 added to the
  "Where to look" inventory. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** None. The recut produced
  the expected v2 payoff cleanly across the whole corpus; the
  deer pre-recut overlap count (857) differs slightly from the
  841 quoted in the session prompt (different baseline snapshot),
  but the algorithm handled the larger count without issue.
