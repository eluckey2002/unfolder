# Session 0023 — Topological-surgery spike

Date: 2026-05-15. Branch: `spike/topological-surgery`.

The first spike in the project. Implements three cut-strategy
alternatives recommended by `docs/references/takahashi.md`
(curvature guard, blended weights, cut-removal recut) at
proof-of-concept polish, measures each against the 11-model corpus
and the v3 baseline metric set, produces SVGs plus a side-by-side
comparison page, and writes a findings document recommending v3
adoption paths and v4 user-facing parameters.

## What was attempted

* Establish `spikes/<date>-<slug>/` (repo-root, committed but
  outside `src/`) and `docs/spikes/` (mirrors `docs/audits/`) as
  the conventions for future spikes.
* Implement Variant A — vertex-curvature pre-flatten guard
  (diagnostic on top of v2).
* Implement Variant B — blended convex / concave / length
  weights, signature-compatible with
  `computeDihedralWeights` so it slots into `buildSpanningTree`.
* Implement Variant C — greedy cut-removal recut, replacing v2's
  MST + recut with a single greedy pass over edges sorted by 3D
  length descending.
* Build a single spike runner (`run.ts`) that exercises each
  variant on every corpus model, emits SVGs per variant per
  model, and writes `results.md` with v2-baseline side-by-side
  columns.
* Build `comparison.html` — a static side-by-side page for visual
  judgement.
* Write `docs/spikes/2026-05-15-topological-surgery.md` — the
  findings doc.
* Doc coherence: advance `docs/roadmap.md`, append entries to
  `docs/queue.md` and `docs/decisions-log.md`.

## What shipped

All of the above. End-to-end run via `pnpm spike` completes in
under three seconds across the entire corpus, producing
`results.md`, 33 (variant × model) SVG bundles, and the
comparison HTML.

Headline numbers (v2 baseline → Variant C, on the four concave models):

* **croissant.obj** — 15 → 3 pieces, cut length 2889 → 2093 mm.
* **deer.obj** — 28 → 17 pieces, cut length 6039 → 5074 mm.
* **ginger-bread.obj** — 5 → 2 pieces, cut length 2215 → 1296 mm.
* **meat-sausage.obj** — 3 → 1 piece (single-piece unfolding),
  cut length 2334 → 1748 mm.

Convex models tie with v2 on cut-set in every variant. Variant A
reports zero condition-violations on every model — v2's recut
implicitly already satisfies the Takahashi necessary condition by
feasibility.

## What's next

Session 0024 — Optimized recut. Promote Variant C from `spikes/`
to `src/core/` as the v3 default unfolder; promote Variant B as
an opt-in alternate weight function; wire Variant A's check in
as a post-condition assertion. Refresh `docs/baseline-v3.md`'s
companion (live `docs/baseline-pipeline.md`) when v3's default
algorithm changes.

The deer regression under Variant B is a candidate for a
follow-up parameter-tuning spike if the v3 cut-quality session
needs to recover specific deer numbers — but the spike's
recommendation is to *ship Variant C as default* and treat
Variant B as the tunable opt-in path.

## Decisions made or deferred

* **Spikes live under `spikes/<date>-<slug>/`** at the repo root,
  committed but outside `src/`, with the date in the directory
  name so chronological order is the filesystem default order.
  `docs/spikes/` mirrors `docs/audits/` for findings docs.
  Decided this session; first use is the present spike.
  `[surfaced-and-proceeded]`
* **`tsconfig.json` includes `spikes`** so spike code type-checks
  with `pnpm type-check`. The production build (Vite) doesn't
  follow tsconfig include paths, and nothing in `src/` imports
  spike code, so spikes naturally stay out of the production
  bundle. `[flowed-silently]`
* **Variant B coefficients** — `convex = 0.5`, `concave = 1.0`,
  `length = -0.1`. Picked by intent, not tuning; documented in
  the findings doc. `[surfaced-and-proceeded]`
* **Variant C iteration order** — long edges first (descending
  3D edge length). Documented in the findings doc as a knob worth
  exposing in v4 but fixed for the spike. `[surfaced-and-proceeded]`
* **Variant C numerical-robustness fallback** — `polygon-clipping`
  exceptions are caught and treated as conservative overlap
  rejections, so the variant produces output instead of aborting.
  Without this, four of eleven models failed to complete. The
  fallback rejected some merges that strict overlap testing
  could not adjudicate; this puts Variant C's published piece
  counts at an upper bound. `[surfaced-and-proceeded]`
* **No ADR written.** Spike findings are exploratory; the
  ADR-worthy decision (whether v3 adopts Variant C as the default
  recut algorithm) belongs to session 0024. Decisions-log entry
  in this commit covers the v4-precursor file-loader scope
  (per Appendix C). `[flowed-silently]`

## Queue / roadmap deltas

* Queue: appended one `[research]` entry — force-directed
  unfolding spike — surfaced 2026-05-15 (Appendix B).
* Roadmap: advanced "Where we are now," flipped 0023 from `⏭`
  to `✅` with a one-line summary, added an `⏭` entry for 0024,
  added a new sketched 0029 entry for the file-loader UI
  (Appendix A).
* Decisions log: appended one entry — late-v3 file-loader UI
  scope (Appendix C).

## Open questions for the strategist

* **Confirm Variant C as v3's default**, given that this spike's
  recommendation is the structural choice for the next session.
  The piece-count wins are strong; the cut-length wins are
  consistent on every concave model; the numerical-robustness
  fallback is documented and tightenable. Worth a strategist
  read of the findings doc before 0024's prompt is written.
* **Variant B coefficients on deer.** Deer is the one model
  where Variant B's coefficients regress (28 → 36 pieces). If
  v3's success criterion is "no per-model regressions vs. v2,"
  Variant B needs a parameter-tuning spike before promotion;
  if the success criterion is "ship the better default," the
  deer regression doesn't matter because Variant C handles
  deer better than v2 anyway. Strategist call.
* **Should `pnpm spike` re-run during baseline regeneration?**
  The spike harness is self-contained and doesn't touch the
  live baseline. The findings numbers are baked into the
  findings doc, but `results.md` is regenerated on every run
  and is not CI-guarded. Probably fine; flagging in case the
  strategist wants a guard.

## Handoff

- **Branch / worktree:** `spike/topological-surgery` at
  `.claude/worktrees/spike+topological-surgery/`. (The
  EnterWorktree tooling renamed the slash to a `+` in the
  directory name; the branch itself is `spike/topological-surgery`.)
- **Commits:** `feat: topological-surgery spike — curvature guard, blended weights, cut-removal`
- **Verification:** `pnpm type-check` clean; `pnpm test:run` —
  total reported in the PR's Verification section; `pnpm build`
  clean; `pnpm baseline` produces a `docs/baseline-pipeline.md`
  identical to the live baseline (modulo the date line),
  `docs/baseline-v3.md` untouched; `pnpm spike` runs cleanly
  end-to-end.
- **Decisions made or deferred:** five `[surfaced-and-proceeded]`
  / `[flowed-silently]` calls (see "Decisions made or deferred"
  above); no ADR; one decisions-log entry committed
  (file-loader UI scope, Appendix C).
- **Queue / roadmap deltas:** one queue entry added (force-directed
  research, Appendix B); roadmap advanced and 0029 sketched
  (Appendix A); decisions-log entry committed (Appendix C).
- **Open questions for the strategist:** three (above) — Variant C
  as v3 default, Variant B deer-regression criterion, spike
  re-run guard.
