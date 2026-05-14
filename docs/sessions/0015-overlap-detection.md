# Session 0015 — Overlap detection

## What was attempted

Add a canonical overlap-detection stage to `src/core/` — a pure
predicate over the 2D layout that finds every pair of faces whose
unfolded triangles overlap — and point the baseline harness at it,
replacing the hand-rolled check from session 0013. Detection only:
no cutting, no re-layout, not wired into the app pipeline. 0016's
recut is the first real consumer.

## What shipped

- `src/core/overlap.ts` — `detectOverlaps(layout)`, a pure stage
  built on `polygon-clipping`. For every face pair it tests
  triangle-triangle intersection; a non-empty intersection is an
  overlap. Needs no spanning-tree input — fold-adjacent faces share
  an exact edge and produce an empty intersection on their own.
  O(F²); a spatial index is the deferred scaling path.
- `polygon-clipping` added as a runtime dependency.
- `scripts/baseline-pipeline.ts` — now counts overlaps via the
  canonical `detectOverlaps` stage; the hand-rolled triangle check
  is removed.
- `test/unit/overlap.test.ts` — overlapping, disjoint, and
  edge-touching hand-built cases, plus the platonic solids through
  the real pipeline (zero overlaps each).
- `docs/references/unfolding-algorithm-survey.md` — the strategist's
  algorithm-landscape survey, committed alongside this session.

## Baseline shift

The canonical detector replaces the harness's hand-rolled check —
a measurement-method change, not an algorithm change (the spanning
tree is untouched this session). Per-model counts, 0014 → 0015:

| model            | 0014 (SH-clip) | 0015 (polygon-clipping) | Δ    |
| ---------------- | -------------- | ----------------------- | ---- |
| croissant.obj    | 388            | 388                     | 0    |
| deer.obj         | 841            | 857                     | +16  |
| ginger-bread.obj | 45             | 48                      | +3   |
| meat-sausage.obj | 172            | 184                     | +12  |

The platonic solids, the two convex baselines (uv-sphere, cylinder),
egg, and both cube formats stay at 0 — no false positives on clean
nets. The 7-of-11 overlap-free summary is unchanged. The four
concave models drift uniformly upward by small amounts (+3 to +16
pairs) as `polygon-clipping`'s snap-rounded boolean catches sliver
overlaps the old `AREA_EPS = 1e-10` cutoff was discarding.

## What's next

Session 0016 — Automatic recut. The first consumer of
`detectOverlaps`: for each overlapping pair, find the path between
the two faces in the spanning tree and cut a fold edge on it,
splitting the net into multiple non-overlapping pieces. Likely
ADR 0005 on the recut strategy.

## Decisions made or deferred

- **Detection needs no spanning-tree input.** `polygon-clipping`
  returns an empty intersection for the exact-shared-edge geometry
  that fold-adjacent faces produce, so the "non-empty intersection"
  predicate excludes them without fold-edge bookkeeping.
- **O(F²) all-pairs.** Fine for the v2 corpus; a spatial index is
  the known scaling path, deferred.
- **`polygon-clipping` over a hand-rolled clip.** The committed
  stack decision (project-state); the library is robust on
  degenerate and collinear cases a hand-rolled clip gets wrong, and
  it is the 2D-geometry foundation later v2 sessions build on.
- **Default import, not named imports.** `polygon-clipping`'s
  `.d.ts` declares named exports but the CJS module ships as an
  object — under `vite-node`'s CJS-to-ESM interop the named imports
  resolve to `undefined` at runtime. The default-import form
  (`import polygonClipping from "polygon-clipping"`, then
  `polygonClipping.intersection(...)`) is the only form that
  type-checks AND runs in every code path (tests, build,
  vite-node). Worth knowing for the next session that touches the
  library.

## Handoff

- **Branch / worktree:** `claude/jolly-hopper-f1aedc` at
  `.claude/worktrees/jolly-hopper-f1aedc/`.
- **Commits:** `<short-sha>` `feat: overlap detection stage (polygon-clipping)`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 52
  passing + 1 todo (53 total); `pnpm build` clean; `pnpm baseline`
  regenerated `docs/baseline-pipeline.md`.
- **Decisions made or deferred:** detection needs no tree input;
  O(F²) with a spatial index deferred; `polygon-clipping` over a
  hand-rolled clip; default-import form is the one that works
  under vite-node's CJS interop. No ADR.
- **Queue / roadmap deltas:** Roadmap — 0015 → ✅, 0016 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0015 added to Sessions
  completed; Sessions planned advanced. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** None.
