# Session 0025 — Optimized Recut

## Goal

Promote the three spike variants from `spikes/2026-05-15-topological-surgery/` into `src/core/`, with **Variant C (greedy cut-removal) as the v3 default unfolder**, Variant B (blended weights) shipping as an opt-in alternate weight function, and Variant A (curvature) wired as a post-condition assertion. Land ADR 0007 (cut-removal as v3 default, supersedes ADR 0005). Fold in two cross-cutting work items: a `runPipeline()` orchestrator (closes Pathfinder queue item U4) and a shared `src/core/eps.ts` precision-constants module (closes audit finding P1/C1).

## Context

- **Spike findings** (the authoritative input): `docs/spikes/2026-05-15-topological-surgery.md`. Variant C dominates on every concave corpus model; A is no-op on output but useful as a diagnostic; B's deer regression disqualifies it as a default. Cut-removal becomes the v3 default per the strategist call 2026-05-16.
- **Audit findings:** `docs/audits/core-review-2026-05-16.md`. Most P2 hygiene items closed by PR #7 (Pathfinder U1-U3 consolidations). P1/C1 (parse/flatten precision contract) folded into this session as Task 25.1.
- **Queue item U4** (Pathfinder `runPipeline()` orchestrator) — Variant C collapses two pipeline stages anyway, so the call-site refactor is unavoidable; doing it as a single orchestrator is the same edit done cleanly.
- **Prior session 0024 — Strategist skills** (`docs/sessions/0024-strategist-skills.md`) — `/begin-session` and `/wrap-session` ceremony shipped. This session uses both.
- **Implementation plan** with atomic 5-step TDD detail for every task: `docs/superpowers/plans/2026-05-16-v3-implementation-plan.md` — Session 0025 portion. This prompt is the narrative direction; the plan is the gritty execution detail (concrete code blocks, exact commands, exact commit messages).
- **PDF export is OUT of v3 scope** as of 2026-05-16 (strategist call) — SVG was deemed good enough. No PDF work in this session or any subsequent v3 session.

## Tasks

The full atomic step detail is in the implementation plan. Tasks below are the cross-references with one-line summaries:

1. **Task 25.0 — Begin session.** `/begin-session session/0025-optimized-recut`. Validates branch, creates worktree, copies prompt, runs `pnpm install`.
2. **Task 25.1 — Shared `EPS` module.** Create `src/core/eps.ts` with `PARSE_DECIMALS`, `COINCIDENT_EPS`, `SIDE_EPS`. Closes audit finding C1.
3. **Task 25.2 — Migrate consumers.** `flatten.ts` and `intern-vertex.ts` import from `eps.ts` instead of defining local constants.
4. **Task 25.3 — Promote Variant A.** Copy `spikes/.../variant-a-curvature/curvature.ts` to `src/core/curvature.ts`, adjusting imports.
5. **Task 25.4 — Promote Variant B.** Copy `spikes/.../variant-b-blended/blended.ts` to `src/core/blended-weights.ts`, adjusting imports.
6. **Task 25.5 — Promote Variant C.** Copy `spikes/.../variant-c-cut-removal/cut-removal.ts` to `src/core/cut-removal.ts`. **Important:** replace the spike's inline `UF` factory with `makeUnionFind` from `src/core/union-find.ts` (Pathfinder U2 consolidation); adjust the post-union call to recompute the new root via `uf.find()` since the shared UF returns `boolean` from `union`, not the new root.
7. **Task 25.6 — `runPipeline()` orchestrator.** Create `src/core/pipeline.ts` wiring `buildAdjacency → runCutRemoval → buildRenderablePieces → paginate` plus `reportCurvature` as post-condition. Resolves U4.
8. **Task 25.7 — Switch `src/app/main.ts`.** Replace 8-stage inline assembly with `runPipeline`. Eight imports collapse to two.
9. **Task 25.8 — Switch `scripts/baseline-pipeline.ts`.** Same refactor. Stage-by-stage error labels collapse to `failed: <message>`.
10. **Task 25.9 — Regenerate baselines.** `pnpm baseline` produces new `docs/baseline-pipeline.md`; update `docs/baseline-v3.md` companion with the v3-trajectory section.
11. **Task 25.10 — ADR 0007.** Write `docs/decisions/0007-cut-removal-as-v3-default.md`; mark ADR 0005 superseded; update decisions README.
12. **Task 25.11 — Extend integration test.** Add v3 invariants (overlap-free, zero curvature violations, per-model piece-count regression bounds).
13. **Task 25.12 — Doc updates.** Roadmap (0025 ✅, 0026 ⏭, PDF removed from sketched-sessions list); queue (U4 closed); decisions-log (PDF removal + U4 disposition entries).
14. **Task 25.13 — Wrap session.** `/wrap-session`. PR with `baseline-change` label per ADR 0006; CI green; squash-merge.

## Specs

### `src/core/curvature.ts`

Pure module exporting `reportCurvature(mesh: Mesh3D, cuts: readonly Adjacency[]): CurvatureReport` plus supporting types `CurvatureClass` (union: `"hyperbolic" | "elliptic" | "parabolic"`), `VertexCurvature`, `VertexViolation`. Classifies each vertex by sign of `2π − Σ corner_angles`. For each vertex, count incident edges in the post-recut cut set; report any vertex where `incidentCuts < requiredCuts` (hyperbolic=2, elliptic=1, parabolic=0). On the v2 corpus, zero violations is the expected result (spike-validated).

### `src/core/blended-weights.ts`

Pure module exporting `computeBlendedWeights(mesh: Mesh3D, dual: DualGraph, coeffs?: BlendCoeffs): number[]` plus the `BlendCoeffs` interface (fields: `convex`, `concave`, `length`) and the `DEFAULT_BLEND` constant. **Signature-compatible** with `computeDihedralWeights` so it slots into `buildSpanningTree` unchanged. Computes signed dihedral angle (v2's `dihedral.ts` exposes unsigned only), splits into convex/concave terms, adds an edge-length term, returns one weight per adjacency parallel-indexed to `dual.adjacencies`. Default coefficients: `{ convex: 0.5, concave: 1.0, length: -0.1 }` (from spike findings).

### `src/core/cut-removal.ts`

Pure module exporting `runCutRemoval(mesh: Mesh3D, dual: DualGraph, options?: CutRemovalOptions): CutRemovalResult` with options containing `timeBudgetMs?` and result type `CutRemovalResult extends RecutResult` (adds `rejected`, `accepted`, `cyclesSkipped`, `timedOut` counters). Replaces v2's MST + recut sequence with a single greedy pass: start fragmented (every face its own component in canonical local frame), sort adjacencies by 3D edge length descending, for each try the rigid 2D transform aligning across the shared edge and accept if no overlap with existing component faces. Numerical-robustness fallback: `polygon-clipping.intersection` exceptions on near-coincident edges treated as conservative overlap rejections. Output shape mirrors `RecutResult` so downstream `tabs → paginate → emit` consumes it unchanged.

The promotion from spike code replaces the inline UF factory with the shared `makeUnionFind` from `src/core/union-find.ts`. The shared factory returns `boolean` from `union` (true iff merge happened), not the new root, so the post-union call site re-derives the new root via `uf.find(anchor)`.

### `src/core/pipeline.ts`

Pure module exporting `runPipeline(mesh: Mesh3D, page?: PageSpec): PipelineResult`. Single entry point wiring `buildAdjacency → runCutRemoval → buildRenderablePieces → paginate`, plus `reportCurvature` as post-condition. Returns the `PipelineResult` containing every intermediate stage (`dual`, `recut`, `renderable`, `pages`, `curvature`) so callers pick a slice. Default page spec: `LETTER`.

Post-condition behavior: when `curvature.violations.length > 0`, log a `console.warn`. Production code does NOT throw — the post-condition is diagnostic, not gate. Tests assert violations is empty across the corpus.

Replaces inline 8-import 8-call sequences in `src/app/main.ts` and `scripts/baseline-pipeline.ts`. Resolves queue item U4 (Pathfinder analysis 2026-05-15).

### `src/core/eps.ts`

Tiny module exporting three constants: `PARSE_DECIMALS = 6`, `COINCIDENT_EPS = 1e-6`, `SIDE_EPS = 1e-5`. `flatten.ts` imports `COINCIDENT_EPS`/`SIDE_EPS` instead of defining local constants; `intern-vertex.ts` uses `PARSE_DECIMALS` for its quantization key. Closes audit finding C1 (parse/flatten precision contract mismatch).

### Baseline regeneration expectations

After cut-removal becomes the default, the corpus baseline shifts:

- **Convex models:** piece count, cut count unchanged from v2 (same algorithm result topologically). Cut-length-mm may shift slightly because the unfolded layout shape changes, which changes the paper-fit scale.
- **Concave models:** piece count drops dramatically. Spike upper bounds (with tolerance):
  - croissant.obj: 15→3 (tolerance ≤6)
  - deer.obj: 28→17 (tolerance ≤21)
  - meat-sausage.obj: 3→1 (tolerance ≤2)
  - ginger-bread.obj: 5→2 (tolerance ≤3)
- **`overlaps` column reads 0 on every row** — cut-removal doesn't produce overlap pairs by construction; the column was meaningful in v2's MST-then-recut flow.

If any concave model regresses past spike tolerance, STOP and investigate cut-removal's `rejected` counter — the numerical-robustness fallback may be more aggressive in production than during the spike.

CI `baseline-change` label is required on the PR per ADR 0006.

### Test coverage targets

- `test/unit/eps.test.ts` — module exports + consumer-import structural assertions.
- `test/unit/curvature.test.ts` — classification correctness + violation detection.
- `test/unit/blended-weights.test.ts` — DEFAULT_BLEND, parallel-indexing, coefficient-effect detection.
- `test/unit/cut-removal.test.ts` — convex-tie behavior, overlap-free pieces, deer regression bound, counter fields, RecutResult-compatible shape.
- `test/unit/pipeline.test.ts` — intermediate stages exposed, default unfolder is cut-removal, LETTER default, curvature post-condition clean on tetrahedron.
- `test/integration/pipeline.test.ts` — every corpus model overlap-free + curvature-clean; per-model piece-count regression bound (v3 invariants).

Expected total post-session: ~136 passing tests across 18-19 files (current 97 + ~39 new).

## Appendix — ADR 0007 draft

(Verbatim content for `docs/decisions/0007-cut-removal-as-v3-default.md`. The implementation plan Task 25.10 carries the same text in a code block for direct copy.)

```markdown
# ADR 0007 — Cut-removal as v3 default unfolder

**Status:** Accepted, 2026-05-16
**Supersedes:** ADR 0005 (greedy set-cover recut as default)

## Context

v2's pipeline runs `buildAdjacency → computeDihedralWeights →
buildSpanningTree → buildLayout → detectOverlaps → recut`. The MST
phase selects the lowest-total-fold-weight spanning tree; the recut
phase greedily cuts edges to split overlapping pieces (ADR 0005).
On the v2 corpus, this produces buildable output on every model
but heavily fragments concave shapes (croissant 15 pieces, deer 28,
meat-sausage 3, ginger-bread 5).

Session 0023's spike measured three alternatives from Takahashi
2011, Export-Paper-Model, and PolyZamboni:

- **Variant A** (curvature pre-flatten guard) — diagnostic only;
  zero violations on the entire corpus.
- **Variant B** (blended convex/concave/length weights) — mixed:
  croissant 15→6 (win), meat-sausage 3→2 (win), deer 28→36 (loss).
- **Variant C** (greedy cut-removal, inverted control flow) —
  dominates v2 on every concave model: croissant 15→3, deer 28→17,
  meat-sausage 3→1, ginger-bread 5→2.

The findings doc recommends Variant C as the v3 default, Variant B
as opt-in, Variant A as post-condition.

## Decision

Adopt cut-removal (Variant C) as the v3 default unfolder, replacing
the v2 MST+recut sequence as the default code path in
`runPipeline`. Variant B (`computeBlendedWeights`) is available as
an alternate weight function for `buildSpanningTree` but is not
wired into the default pipeline. Variant A (`reportCurvature`) runs
as a post-condition check after every default-path unfold.

The v2 MST+recut path remains in the codebase (`spanning-tree.ts`,
`recut.ts`, `dihedral.ts`) — unchanged, fully tested — for use by
the opt-in path and for future spikes that need v2 as a baseline.

## Status

Accepted and shipped in session 0025.

## Consequences

**Better:**
- Concave models fragment dramatically less. Per the 0023 spike:
  croissant 15→3, deer 28→17, meat-sausage 3→1, ginger-bread 5→2.
- Cut length drops 14–42% on concave models.
- Paper efficiency more than doubles on deer and ginger-bread.
- Convex models unchanged on piece count.
- Wall-clock runs faster (deer 72ms vs v2's ~400+ms).

**Cost:**
- Algorithm semantics inverted ("start fragmented, merge what's
  safe" vs "start connected, cut what overlaps").
- Numerical-robustness fallback: `polygon-clipping.intersection`
  exceptions on near-coincident edges treated as conservative
  overlap rejections. ~5–25% of merges rejected this way; piece
  counts are an upper bound.
- Variant C's iteration order (long edges first) is a fixed
  heuristic. v4 can expose it as tunable.

**Reversibility:** the MST+recut path is preserved. Switch the
default back by editing two lines in `src/core/pipeline.ts`.

## Alternatives considered

- **Variant B (blended weights) as default.** Rejected: deer
  regression (28→36) disqualifying as default.
- **Variant A as gate during spanning-tree construction.**
  Rejected: zero violations across corpus means gate would change
  nothing. Wired as post-condition instead.
- **No change (keep v2 default).** Rejected: v3 quality bar
  ("visibly competitive with Pepakura") not met by v2's
  per-concave fragmentation.
- **Force-directed unfolding.** Carried to queue as `[research]` —
  v4 candidate if Variant C underdelivers, which it doesn't.
```
