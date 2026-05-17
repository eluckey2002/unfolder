# Session 0029 — v3 Close

**Work type:** numbered session.
**Branch:** `session/0029-v3-close`.
**Land via:** worktree → PR → CI green → squash-merge per ADR 0006.

## Goal

Produce `docs/retrospectives/v3-complete.md` — the "what v3 shipped"
phase-summary artifact following the v2 pattern. Run the corpus-wide
visual sweep (resolved Q-0026-2 — the sweep IS the v3 quality-bar
verification). Tidy any v3 punchlist items. Flip v3 to ✅ wherever
status is recorded in-repo. **Closes v3.**

This session does NOT produce `v3-retrospective.md` — that's a
separate ceremony invoked via `/retrospect v3` after the merge,
following the v2 split (`v2-complete.md` was authored; the
retrospective was a joint pass after).

## Context

- **v3 named surfaces shipped** (per `README.md` v3 phase plan and the
  decisions-log scope edits):
  - Takahashi topological surgery → 0025 (cut-removal as default, ADR 0007)
  - Smart tab placement → 0026
  - Audit visualization → 0027 (foldability classifier + SVG tint)
  - Color/texture passthrough → 0028 (color; texture deferred to v5
    per the 2026-05-16 decisions-log entry)
  - ~~Real PDF export~~ → removed from v3 (decisions-log 2026-05-16)
  - File-loader UI → moved to v4.0 per the v4 design spec §3 (see
    `docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md`)
- **v3 quality metric trajectory** lives in `docs/baseline-v3.md` —
  the frozen 0021 snapshot plus per-session trajectory notes through
  0028. v3-complete.md should summarize the deltas, not duplicate them.
- **v2 pattern (template):** `docs/retrospectives/v2-complete.md`. The
  v3 complete doc follows its structure: phase pitch, what shipped,
  metric trajectory, what's left for v4, lessons learned. Read v2's
  doc before drafting — pattern adherence matters more than novelty
  here.
- **Visual sweep** (resolved Q-0026-2 per
  `docs/open-questions.md`): "the v3-close session already exists to
  verify the phase shipped its quality bar, and the visual sweep IS
  that verification." All 11 corpus models, one observation per
  model.
- **Baseline harness** (`scripts/baseline-pipeline.ts`) already runs
  the pipeline corpus-wide and emits metrics, but does NOT save SVG
  output. A small transient sweep harness is needed (one SVG per
  page per model, written to a scratch location). It can be deleted
  after the gate per the precedent of 0027's `scripts/probe-visual.ts`
  and 0028's `scripts/probe-svg-invariant.ts`.

## Files

Modified:

- `docs/baseline-v3.md` — final "v3 close" trailer line if
  appropriate (the per-session trajectory notes through 0028 stand
  as-is).
- `docs/decisions-log.md` — one closure entry on v3-close (the
  visual-sweep verdict in one or two sentences; the v3→v4 phase
  hand-off note).
- `README.md` — if status text mentions v3 as the current phase,
  flip it to ✅ / shipped and v4 to the current phase. Check
  carefully — README may not have explicit per-phase status flags
  (the deleted `docs/roadmap.md` was the prior status home).
- `docs/open-questions.md` — no edits expected; ledger is clean.

Created:

- `docs/retrospectives/v3-complete.md` — the headline artifact.
- `docs/sessions/0029-v3-close.md` — session log.
- (Transient, NOT committed) `scripts/probe-v3-sweep.ts` — one-off
  harness that walks the corpus, runs `runPipeline` + `emitSvg` per
  model + page, writes SVGs to a scratch location. Delete after the
  visual gate is met, same as 0027/0028's probe scripts.

## Tasks

Implementer drafts the atomic plan in plan mode before code, per
`CLAUDE.md` §1 ("Plan first for multi-file sessions"). For this
session most "tasks" are inspection / drafting, not TDD — substitute
read → write → verify-by-reread → commit per CLAUDE.md's doc-only
plan guidance.

1. **Audit v3 named surfaces.** For each of (cut-removal, smart tabs,
   audit viz, color), confirm via session-log presence + grep for the
   key exported function names in `src/core/`. Flag anything the
   README named for v3 that didn't ship and isn't explicitly deferred
   in the decisions-log.
2. **Audit the queue and open-questions ledger.** Confirm zero v3
   blockers remain. The `[enhancement]` area-based tab placement and
   the `[research]` items are not v3 blockers — they're v3-or-later
   improvements. Note them in v3-complete.md as "shipped without."
3. **Generate the visual sweep.** Write the transient probe harness;
   render all 11 corpus models' SVGs to a scratch dir (recommend
   `/tmp/v3-sweep/` or `scripts/.v3-sweep-output/` — anywhere
   gitignored). Open each in a browser. Capture one
   observation-per-model in the implementer's notes.
4. **Read `v2-complete.md`** before drafting v3-complete.md. Match
   its structure and tone. Pattern adherence > novelty.
5. **Draft `docs/retrospectives/v3-complete.md`** — see Specs below
   for the structural skeleton.
6. **Tidy:** update `README.md` if v3 phase status is named (the
   "Status" section near the end mentions v2 as complete; update to
   v3 complete). Decisions-log closure entry.
7. **Delete the transient sweep harness** + scratch SVG output;
   verify via `git status --short` that no scratch artifacts are
   staged.
8. Session log.

## Specs

- **`v3-complete.md` structural skeleton** (mirroring
  `v2-complete.md`):
  - **Phase pitch** — one paragraph: what v3 was supposed to
    deliver per the README, and the abstract version of "did it."
  - **What shipped, session by session** — one short paragraph per
    session 0021 through 0028 (skipping the 0024 strategist-skills
    process session if it doesn't belong to the v3 product arc).
    Link the session log; do not recap it.
  - **Metric trajectory** — pull from `docs/baseline-v3.md`. One
    table showing the 0021 snapshot vs the post-0028 numbers for
    each frozen metric. Honest assessment — call out where the
    metric improved, held, or moved sideways.
  - **Visual-sweep verdict** — one-paragraph "did v3 hit its
    'visibly competitive with Pepakura' bar." If yes, say so with
    the specific corpus models that support the verdict. If no or
    mixed, name the gaps and link to v4 work that addresses them.
  - **What's left, deferred to v4 or later** — scoped list: the
    file-loader UI absorbed into v4.0; texture / UV / STL color
    deferred to v5; PDF export deferred to v5; etc. Link to the
    decisions-log entries that record the deferrals.
  - **Lessons learned (light)** — 3–5 things, observational. Save
    the deep retrospective for `/retrospect v3`.

- **Visual sweep verdict criteria** — for each of the 11 corpus
  models:
  - Does the rendered SVG look "obviously right" — pieces present,
    edge labels readable, tabs visible, no glaring rendering
    artifacts?
  - Does the foldability tint compose correctly with the color fill
    (only relevant for `ginger-bread.obj` since it's the only
    model with `.mtl`)?
  - Are the warn pieces (per 0027's classifier) genuinely the ones
    a human would call "hard to build"?
  - Aggregate: clean / minor-quibble / fail-the-bar. Aggregate
    rolls into the visual-sweep verdict paragraph above.

- **Probe harness skeleton (illustrative, not verbatim):** a
  `vite-node` script that imports `runPipeline` and `emitSvg`,
  walks the corpus directory, parses each model (with MTL when
  present), runs the pipeline, writes per-page SVGs to a chosen
  scratch path. ~50 lines. The exact shape is implementer's
  discretion; the spec is "output one SVG per page per model in a
  location browsable from a local browser."

- **Invariants under the refactor:**

  - No production code changes. This session is doc + sweep only.
    If a sweep reveals a real bug, file it as a follow-up — don't
    fix in 0029.
  - No baseline regen needed. Existing baseline reflects the v3
    end-state.
  - Test suite, type-check, build all continue to pass.

## Verification

Standard gates; **report the test count, do not predict it**:

1. `pnpm test:run` — all passing (unchanged from post-0028).
2. `pnpm type-check` — clean.
3. `pnpm build` — clean.
4. **Sweep coverage gate:** `v3-complete.md` Visual-sweep verdict
   paragraph names each of the 11 corpus models — either
   individually or with explicit grouping (e.g. "all five Platonic
   / parametric models classify clean and render cleanly; the
   organic models X, Y, Z…"). No model is silently absent from
   the verdict.
5. **No-scratch-artifacts gate:** `git status --short` after Task 7
   shows no `scripts/probe-*.ts` or scratch SVG paths staged or
   untracked.

## Appendix

None.
