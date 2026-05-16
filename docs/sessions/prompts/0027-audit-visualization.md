# Session 0027 — Audit Visualization

**Work type:** numbered session.
**Branch:** `session/0027-audit-visualization`.
**Land via:** worktree → PR → CI green → squash-merge per ADR 0006. PR requires the `baseline-change` label.

## Goal

Ship per-piece foldability classification and a color-tint overlay in
the 2D SVG output. Closes the "audit visualization (color-coded regions
by foldability)" surface from the README v3 phase commitment. Pure
downstream pass over the existing v3 cut-removal output — no upstream
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
  the audit-viz engine — it ships as a Takahashi post-condition and is
  caught upstream. Foldability is a 2D-output property, computed from
  the flatten output, separate concern. Do not extend `curvature.ts`.
- `src/core/emit-svg.ts:emitSvg` currently renders edges (cut/fold),
  tabs, and labels. Tint goes on a per-piece interior polygon, behind
  the existing line work, with low alpha so labels stay legible.
- Browser app (`src/app/main.ts`) consumes `emitSvg` output directly,
  so tinting the SVG is enough — no separate app-side rendering.
- `scripts/baseline-pipeline.ts` is the corpus-wide measurement surface;
  add a `foldability` column there.
- Naive-first per v3 phase stance. Seed thresholds from intuition, then
  inspect the baseline corpus and tune. Don't ship a learned model or
  expensive geometric analysis.

## Files

Modified:

- `src/core/emit-svg.ts` — emit per-piece tinted fill polygon before
  the existing edge/tab/label elements.
- `src/core/tabs.ts` or `src/core/pipeline.ts` — thread foldability
  through `RenderablePiece` (implementer's plan picks the seam).
- `src/core/pipeline.ts` — `runPipeline` calls the classifier as part
  of the standard v3 emit path; no opt-in.
- `scripts/baseline-pipeline.ts` — add `foldability` column + summary.
- `docs/baseline-pipeline.md` — regenerated.
- `docs/baseline-v3.md` — one-line trajectory note appended.
- `docs/decisions-log.md` — one entry on the chosen metric set and
  threshold seeds.

Created:

- `src/core/foldability.ts` — exports the classifier.
- `test/unit/foldability.test.ts` — unit tests for the classifier.
- `docs/sessions/0027-audit-visualization.md` — session log.

## Tasks

Implementer drafts the atomic 5-step TDD plan in plan mode per CLAUDE.md
before code (see [[atomic_plan_steps]]). Roughly:

1. Add `src/core/foldability.ts` with `classifyFoldability(piece)`
   returning `"clean" | "caution" | "warn"`. Pure function over
   per-piece 2D vertices + edges.
2. Thread `foldability` through `RenderablePiece` (or via a parallel
   field — design choice in the plan).
3. Extend `emit-svg.ts` to emit a tinted interior polygon per piece.
4. Wire `runPipeline` to populate foldability before SVG emission.
5. Add `foldability` column to `baseline-pipeline.ts`. Regenerate
   `docs/baseline-pipeline.md`.
6. Inspect baseline result; tune seed thresholds if any model produces
   an obviously-wrong classification (e.g. a clean-looking platonic
   solid lighting up as warn). Document in decisions-log.
7. Visual verification: screenshot the dev server at a representative
   viewport. Confirm tint is visible without obscuring line work.
8. Session log + decisions-log entry.

## Specs

- **`classifyFoldability` (pure function)** — given a piece's flat 2D
  vertices and edges, return one of three labels: `"clean"`,
  `"caution"`, `"warn"`. Signal set is small and explainable:

  - **Smallest interior angle** at any vertex of the piece outline.
    Acute angles are hard to glue cleanly.
  - **Smallest edge length** on the piece (any edge — fold or cut).
    Tiny edges produce tabs that can't be cut or folded by hand.
  - **Piece diameter** (longest pairwise distance between any two
    vertices in the piece). Oversized pieces are a layout problem the
    user should see before printing.

  Aggregation rule: each metric maps to two thresholds — a *caution*
  level and a *warn* level. Count tripped thresholds; aggregate:
  zero tripped → `clean`; one *caution*-level trip → `caution`; any
  *warn*-level trip OR ≥2 *caution*-level trips → `warn`.

  Seed thresholds (tunable per Task 6, document in decisions-log):

  - Smallest interior angle: caution < 30°, warn < 15°
  - Smallest edge length: caution < 5 mm, warn < 2 mm
  - Piece diameter: caution > 200 mm, warn > 250 mm (US Letter
    landscape long edge is 279 mm; warn threshold leaves margin for
    paginate's fit-to-page scaling).

- **SVG tint** — emit per piece, *before* the existing edges and tabs
  so line work overlays it cleanly. Use HSL fills with low alpha for
  legibility:

  - `clean` → `hsla(120, 50%, 70%, 0.18)` (light green)
  - `caution` → `hsla(48, 90%, 65%, 0.22)` (light amber)
  - `warn` → `hsla(0, 70%, 65%, 0.25)` (light red)

  Exact color values are seed; tune in Task 6 if any tint obscures
  labels under print preview. Tint fills the closed polygon formed by
  the piece's outline (cut edges) — not the per-face triangles
  individually.

- **`baseline-pipeline.ts` column** — `foldability` column reads
  `<clean>/<caution>/<warn>` per row (e.g. `13/2/0`). Summary line
  reports the worst-class total across the corpus, format:
  `Foldability: N clean / M caution / K warn pieces across the corpus.`

- **Invariants under the refactor (verification gates 4–5):**

  - Piece count, page count, tab count, edge count, cut length **must
    not change**. The classifier is downstream-only.
  - `git diff docs/baseline-pipeline.md` after Task 5 lands should show
    *only* the new `foldability` column plus the new summary line.
    Any other column shift means the classifier accidentally affected
    geometry — stop and investigate.

## Verification

Standard gates; **report the test count, do not predict it**:

1. `pnpm test:run` — all passing
2. `pnpm type-check` — clean
3. `pnpm build` — clean
4. **Hard gate after Task 5 lands:** `git diff docs/baseline-pipeline.md`
   shows only the new column + summary line; piece / page / tab / cut
   length columns are byte-identical to the pre-0027 baseline.
5. **Visual gate per CLAUDE.md:** dev-server screenshot at a viewport
   showing a multi-piece model (recommend `deer.obj` or
   `croissant.obj` — corpus's most topologically complex). The tint
   must be visible from arm's length on a normal screen, and cut/fold
   lines + edge labels must remain legible over every tint band.
   `(deer has 91 self-clipping tabs, so it will exercise warn cases;
   croissant has visible caution-band pieces. Pick whichever surfaces
   the most variety.)`

## Appendix

None.
