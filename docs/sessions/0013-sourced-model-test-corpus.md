# Session 0013 — Sourced model test corpus

## What was attempted

Land the v2 test corpus and capture the v1-pipeline baseline against
it. The seven corpus models — four CC0 Kenney models, a low-poly
deer, two procedurally-generated convex baselines — were built and
topology-verified by the strategist beforehand; this session commits
them, documents provenance, and runs the full v1 pipeline over every
corpus model to record which unfold cleanly and which overlap.

## What shipped

- Seven v2 corpus models in `test/corpus/` — `deer.obj`, `egg.obj`,
  `ginger-bread.obj`, `croissant.obj`, `meat-sausage.obj`,
  `cylinder.obj`, `uv-sphere.obj` — all verified closed two-manifold,
  single component, genus 0, consistent winding.
- `scripts/prepare-corpus.py` — the reproducible record of how the
  sourced models were cleaned (Kenney doubled-face removal, deer
  largest-component extraction) and the baselines generated.
- `scripts/baseline-pipeline.ts` — a measurement harness that runs
  the full v1 pipeline over every corpus mesh and records pipeline
  completion plus a naive overlap count. Run via `pnpm baseline`.
- `test/corpus/PROVENANCE.md` — per-model source, license, and
  transformation.
- `docs/baseline-v1-pipeline.md` — the generated baseline: the
  failure corpus that v2's algorithm sessions measure against.

## What's next

Session 0014 — Dihedral-weighted spanning tree. Replace v1's plain
DFS with a dihedral-weighted MST over the dual graph; ADR 0004
commits the weighting heuristic. The 0013 baseline is the
before-picture: 0014 re-runs `pnpm baseline` to show the overlap
count change.

## Decisions made or deferred

- **The baseline overlap check is a measurement tool, not a pipeline
  stage.** It lives in `scripts/`, is naive O(n²), and is explicitly
  distinct from the proper `polygon-clipping`-based overlap detection
  that session 0015 builds in `src/core/`.
- **The raw source downloads are not vendored.** The Kenney Food Kit
  pack and the original deer model stay untracked; only the seven
  derived corpus models are committed. `scripts/prepare-corpus.py`
  records the method.
- **The deer corpus model is the largest component of the original**
  — the original was three disconnected shells; the two antlers were
  dropped. Recorded in `PROVENANCE.md`.
- **The Sutherland–Hodgman polygon clip is the triangle-pair
  intersection test in the harness.** Standard, easy to reason about,
  correct on the boundary cases that matter (faces sharing a fold
  edge produce a degenerate intersection with zero area). An
  `AREA_EPS = 1e-10` threshold discriminates the shared-edge boundary
  from a genuine overlap.
- **STL vs. OBJ dispatch is by file extension** in the harness — a
  simple ad-hoc router; no general parser registry is introduced.
- **Per-stage errors are caught in the harness** so a single failing
  model does not abort the run. Each stage records "failed at
  `<stage>`" and the table continues.

## Handoff

- **Branch / worktree:** `claude/priceless-cannon-4c6828` at
  `.claude/worktrees/priceless-cannon-4c6828/`.
- **Commits:** `<short-sha>` `feat: v2 test corpus and v1-pipeline baseline`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 42
  passing + 1 todo (43 total — unchanged from pre-session); `pnpm
  baseline` ran, `docs/baseline-v1-pipeline.md` generated. The
  baseline shows 5 of 11 corpus models produce overlap-free nets
  under v1's plain DFS: all four platonic solids (the harness
  self-validates) plus `uv-sphere.obj`. The six remaining models
  overlap, ranging from 1 pair (`cylinder.obj`) to 795 pairs
  (`deer.obj`).
- **Decisions made or deferred:** baseline overlap check is a
  measurement tool not a pipeline stage; raw downloads not vendored;
  deer model is the largest component of the original; SH polygon
  clip with 1e-10 area epsilon; ext-based parser dispatch; per-stage
  error catching in the harness. No ADR.
- **Queue / roadmap deltas:** Roadmap — 0013 → ✅, 0014 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0013 added to Sessions
  completed; Sessions planned advanced (0013 entry removed, 0014
  marked next). `docs/queue.md` — unchanged; the open `parseStl`
  negative-path tests item is unrelated to this session.
- **Open questions for the strategist:** One discovery — `deer.obj`
  initially appeared "missing" from the corpus inputs because macOS
  is case-insensitive: the raw `Deer.obj` (capital D) and the derived
  `deer.obj` (lowercase) collide on the filesystem, so the strategist's
  earlier run of `prepare-corpus.py` produced a single file appearing
  as `Deer.obj` (its prior case was preserved) but containing the
  derived single-component content. Re-running the script and copying
  by lowercase name into the worktree resolved it cleanly. Worth
  noting for future contributors on case-insensitive filesystems; no
  change to the script's correctness on case-sensitive systems.
