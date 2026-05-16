# Session 0027 — Audit Visualization

**Work type:** numbered session.
**Branch:** `session/0027-audit-visualization`.
**Land via:** worktree → PR → CI green → squash-merge per ADR 0006. PR
requires the `baseline-change` label — *any* change to
`docs/baseline-pipeline.md` triggers it, including adding a column.

## Goal

Ship per-piece foldability classification and a color-tint overlay in
the 2D SVG output. Closes the "audit visualization (color-coded regions
by foldability)" surface from the README v3 phase commitment. Pure
downstream pass over the existing v3 pipeline output — no upstream
algorithm changes; the visualization layers onto `emit-svg.ts`.

## Context

- The classifier this session ships is also v4's foundation. Per
  `docs/spikes/2026-05-16-v4-user-research/findings.md`, v4's headline
  UX is feedback-driven iterative unfolding — buildability badges as
  entry points to region re-unfold. The static SVG tint shipping here
  becomes v4's interactive badge engine with no algorithm rework. Pick
  metrics and thresholds that survive into v4 (explainable to a user,
  cheap to compute, mappable to a one-line fix suggestion).
- `src/core/curvature.ts` (per-vertex 3D Gaussian curvature) is *not*
  the audit-visualization engine — it ships as a Takahashi
  post-condition and is caught upstream. Foldability is a 2D-output
  property, computed from post-paginate flatten data, separate
  concern. Do not extend `curvature.ts`.
- `src/core/emit-svg.ts:emitSvg` currently renders page border, edges
  (cut/fold), tabs, and labels. Tint goes on a per-piece interior
  polygon emitted *earlier* in document order than the existing
  elements (SVG painter's algorithm — earlier in document = behind in
  the final render), with low alpha so labels stay legible.
- Browser app (`src/app/main.ts`) consumes `emitSvg` output directly,
  so tinting the SVG is enough — no separate app-side rendering. The
  app currently hardcodes `tetrahedronStl` (a 1-piece model that
  wouldn't exercise the classifier); swap it to a multi-piece corpus
  model so the visual gate is satisfiable.
- `scripts/baseline-pipeline.ts` is the corpus-wide measurement
  surface; add a `foldability` column there.
- **Integration seam (classifier runs post-paginate).** The classifier
  needs post-paginate vertex positions in printed-mm so the threshold
  values (mm, degrees) are meaningful for the user. `runPipeline`
  (`src/core/pipeline.ts`) is the right host: after `paginate`
  returns, run the classifier over each piece's post-paginate face
  vertices and attach the resulting label to the piece. `emitSvg`
  reads the attached label when emitting the tint. Implementer picks
  the data-flow choice in plan mode (field on `RenderablePiece` vs a
  parallel `FoldabilityClass[]` array indexed by piece) — the
  invariants are post-paginate input and `emitSvg` consumption.
- Naive-first per the README phase plan ("Naive before optimized" —
  `README.md:78`). Seed thresholds from intuition, then inspect the
  baseline corpus and tune. Don't ship a learned model or expensive
  geometric analysis.

## Files

Modified:

- `src/core/emit-svg.ts` — emit per-piece tinted polygon earlier in
  document order than the existing page-border / edges / tabs /
  labels (= behind in the final render).
- `src/core/pipeline.ts` — run classifier post-paginate; thread the
  result so `emitSvg` can read it. (Plan picks the seam.)
- `src/core/tabs.ts` — if the chosen seam adds a field to
  `RenderablePiece`, the type lives here.
- `src/app/main.ts` — swap hardcoded `tetrahedronStl` to a multi-piece
  corpus model (recommend `deer.obj` — see Verification gate 5).
- `scripts/baseline-pipeline.ts` — add `foldability` column + summary.
- `docs/baseline-pipeline.md` — regenerated.
- `docs/baseline-v3.md` — one-line trajectory note appended.
- `docs/decisions-log.md` — one entry on the chosen metric set and
  threshold seed values.

Created:

- `src/core/foldability.ts` — exports the classifier.
- `test/unit/foldability.test.ts` — unit tests for the classifier.
- `docs/sessions/0027-audit-visualization.md` — session log.

## Tasks

Implementer drafts the atomic 5-step TDD plan in plan mode before code,
per `CLAUDE.md` §1 ("Plan first for multi-file sessions"). Roughly:

1. Add `src/core/foldability.ts` with `classifyFoldability` over a
   piece's post-paginate 2D face vertices + edges. Pure function.
   Returns `"clean" | "caution" | "warn"`.
2. Thread the classifier output through the pipeline so `emitSvg`
   can read it. Plan picks the seam (field on `RenderablePiece` vs
   parallel-array lookup).
3. Extend `emit-svg.ts` to emit a tinted polygon per piece, earlier
   in document order than the existing line work. The tint fills the
   closed outline polygon — outline reconstruction from the
   unordered edge list is its own atomic TDD task (see the
   data-flow note in Specs).
4. Wire the classifier into `runPipeline` as a post-paginate stage.
5. Swap `src/app/main.ts:tetrahedronStl` to a multi-piece corpus
   model so the visual gate has something to look at.
6. Add `foldability` column to `baseline-pipeline.ts`. Regenerate
   `docs/baseline-pipeline.md`.
7. Inspect baseline result; tune seed thresholds if any model
   produces an obviously-wrong classification (e.g. a clean-looking
   platonic solid lighting up as warn). Document in decisions-log.
8. Visual verification: screenshot the dev server. Confirm tint is
   visible without obscuring line work.
9. Session log + decisions-log entry.

## Specs

- **`classifyFoldability` (pure function)** — given a piece's
  post-paginate 2D face vertices and edges, return one of three
  labels: `"clean"`, `"caution"`, `"warn"`. Signal set is small and
  explainable:

  - **Smallest face-corner angle** across all faces in the piece.
    Acute corner angles are hard to glue (if on the outline) and
    hard to fold (if at an interior fold vertex) — both are real
    foldability concerns; the metric conservatively flags either.
  - **Smallest edge length** on the piece (any edge — fold or cut).
    Tiny edges produce tabs that can't be cut or folded by hand.

  Aggregation rule: each metric maps to two thresholds — a *caution*
  level and a *warn* level. Take the worst trip per metric, then
  aggregate:

  - 0 trips → `clean`
  - 1 caution-level trip → `caution`
  - 1 warn-level trip → `warn`
  - 2 caution-level trips → `warn`
  - 1 caution + 1 warn → `warn`

  Seed thresholds (tunable per Task 7, document in decisions-log):

  - Smallest face-corner angle: caution < 30°, warn < 15°
  - Smallest edge length: caution < 5 mm, warn < 2 mm

  All thresholds apply to post-paginate measurements (printed mm and
  degrees — what the user sees on paper).

  *(Diameter / oversized-piece signal was considered and dropped:
  paginate rescales globally to fit, so an oversized piece manifests
  indirectly through tiny post-rescale edges, already captured by
  the edge-length signal. A future revision can add it back if real
  data shows the indirect path misses cases.)*

- **SVG tint** — emit per piece, earlier in document order than the
  existing page border / edges / tabs / labels. Use HSL fills with
  low alpha for legibility (seed colors, tune in Task 7 if any tint
  obscures labels under print preview):

  - `clean` → `hsla(120, 50%, 70%, 0.18)` (light green)
  - `caution` → `hsla(48, 90%, 65%, 0.22)` (light amber)
  - `warn` → `hsla(0, 70%, 65%, 0.25)` (light red)

  Tint fills the closed polygon formed by the piece's outline
  (boundary cut edges, walked in order). Outline reconstruction from
  the unordered per-face edge list is part of this task — see the
  data-flow note below.

  *(Data-flow note: `RenderablePiece` carries an unordered per-face
  edge list, not a reconstructed outline polygon. The classifier's
  metrics — smallest face-corner angle, smallest edge length — don't
  need outline ordering; they iterate over faces and edges directly.
  The SVG tint **does** need an outline polygon. Plan in atomic
  steps: classifier first (no outline), then SVG tint with outline
  reconstruction as its own TDD task.)*

- **`baseline-pipeline.ts` column** — `foldability` column shows
  per-class counts per row. Format suggestion: `13/2/0` reading
  `clean/caution/warn`, but any clear three-number form is fine
  provided the markdown table renders cleanly within the existing
  column-width discipline. Summary line at the bottom reports
  per-class totals across the corpus (illustrative: "Foldability:
  121 clean / 22 caution / 7 warn pieces across the corpus.") — the
  wording is suggested, not verbatim; what matters is that all three
  counts appear and the format is consistent run-to-run.

- **Invariants under the refactor:**

  - Piece count, page count, tab count, cut length **must not
    change**. The classifier is downstream-only.
  - `git diff docs/baseline-pipeline.md` after the foldability
    column lands should show *only* the new `foldability` column
    plus the new summary line. Any other column shift means the
    classifier accidentally affected geometry — stop and
    investigate.

## Verification

Standard gates; **report the test count, do not predict it**:

1. `pnpm test:run` — all passing
2. `pnpm type-check` — clean
3. `pnpm build` — clean
4. **Hard gate after the foldability column lands:**
   `git diff docs/baseline-pipeline.md` shows only the new column +
   summary line; piece / page / tab / cut length columns are
   byte-identical to the pre-0027 baseline.
5. **Visual gate per `CLAUDE.md` §1** ("Verify UI/CSS against real
   renders"): dev-server screenshot at a viewport showing the
   multi-piece model swapped into `src/app/main.ts` at Task 5.
   Recommend `deer.obj` — corpus's most topologically complex (28
   pieces pre-cut-removal, 17 after, with several tiny faces from
   the cut-removal output) and likely to exercise warn-class tints;
   `croissant.obj` is a good fallback with visible caution-band
   pieces. The tint must be visible from arm's length on a normal
   screen, and cut/fold lines + edge labels must remain legible
   over every tint band.

## Appendix

None.
