# Session 0018 — Multi-page layout

## What was attempted

Give the multi-piece net a real-world scale and a printable form.
After 0017, every `RenderablePiece` rendered into its own SVG with
its own auto-fit `viewBox`, so a 4-face piece and a 320-face piece
both looked the same size on screen — relative scale was lost and
there was no notion of a page. 0018 adds a `paginate` stage that
bin-packs every piece onto US-Letter pages at one uniform scale,
then refactors `emitSvg` to serialize a page in physical
millimetres.

## What shipped

- `src/core/paginate.ts` (new) — a pure stage taking
  `RenderablePiece[]` and a `PageSpec`, returning `Page[]`. Computes
  per-piece AABBs, picks one uniform scale so the most-constrained
  piece fits one page's printable area, sorts pieces by scaled
  height descending (with explicit `sourceIndex` tie-break), then
  shelf-packs them onto pages. Exports `LETTER` (215.9 × 279.4 mm,
  margin 10, gutter 5) and `A4` (210 × 297 mm, margin 10, gutter 5).
- `src/core/emit-svg.ts` — refactored to `emitSvg(page: Page)`.
  Coordinates arrive in page-space millimetres; the per-piece bbox /
  size / bump computation is gone. SVG root carries
  `width="{widthMm}mm"`, `height="{heightMm}mm"`, and
  `viewBox="0 0 widthMm heightMm"` so the file prints at physical
  size. Stroke widths, dash pattern, and font size are now
  mm-absolute module constants. A thin light-grey page-border rect
  is emitted first (behind everything) so the page extent is
  visible.
- `src/app/main.ts` and `index.html` — call `paginate(renderable, LETTER)`,
  iterate pages, render each into a `.page-card` with an
  `<h3>Page N</h3>` caption. CSS classes renamed
  `.piece-card` → `.page-card`, `.piece-svg` → `.page-svg`. Closing
  console log reports both piece count and page count.
- `scripts/baseline-pipeline.ts` — runs `paginate` per model and
  adds a `pages` column. The `overlaps` and `pieces` columns are
  byte-identical to the 0016/0017 baseline (verified by diff); only
  the `pages` column is new. Summary line gained a total-pages
  count.
- `test/unit/paginate.test.ts` (new) — corpus-driven assertions for
  within-bounds, no-box-overlap, determinism, uniform scale, single
  piece → single page, empty input, throws on zero-extent piece and
  on a PageSpec with non-positive printable area.
- `test/unit/emit-svg.test.ts` — helper updated to pass a `Page`;
  added a check that the SVG carries `viewBox="0 0 215.9 279.4"`
  and `mm`-suffixed `width` / `height`.
- `test/property/pipeline.test.ts` — SVG property test paginates
  first then iterates pages; the `3 * faces` line-count invariant
  still holds.

## What's next

Session 0019. With multi-page printable output landed, the v2
core pipeline (parse → adjacency → spanning tree → flatten →
overlap detect → recut → tabs → paginate → emit) is feature-complete
for one-page-or-many printable papercraft. Strategist call.

## Decisions made or deferred

- **Default page US Letter, A4 alongside.** Both are mm-described
  `PageSpec` constants; switching is a one-argument change.
- **Uniform scale, scale-to-fit.** One factor `s = min over i of
  min(printableW/w_i, printableH/h_i)` for every piece. Pieces
  physically mate only at a shared scale; per-piece scaling or
  piece-tiling would be a real correctness departure and is flagged
  as a candidate future ADR if a later session needs it.
- **Naive shelf packing, axis-aligned only.** Sort by scaled height
  desc, tie-break by `sourceIndex` asc (explicit comparator — not
  relying on JS sort stability). Strict `>` in shelf/page fit
  checks (at equality the piece still fits; `>=` would loop).
  Smarter packers (guillotine, maxrects, best-fit) deferred.
- **Final mm-absolute drawing constants:** cut/fold stroke 0.3 mm,
  tab outline 0.2 mm, fold dash 2 mm with 1.5 mm gap, label font
  3 mm, label inward offset 0.6 × font size (≈1.8 mm), page border
  `#ccc` solid 0.15 mm. The label-offset risk on tiny scaled edges
  (raised in planning) is benign at the current corpus's scale —
  tunable later without API change.
- **Baseline mislabel kept.** `paginate` lives inside the existing
  `try` block in `scripts/baseline-pipeline.ts`, so a paginate
  throw would surface as `"failed at recut"`. Acceptable trade-off
  given paginate is reliable on the corpus (verified — all 11
  models pack cleanly).
- **`PlacedPiece` carries `sourceIndex`.** Lets downstream consumers
  correlate placed pieces back to the input order; the rendering
  loop in `main.ts` and the deterministic comparator both rely on
  it.

## Handoff

- **Branch / worktree:** `claude/great-chatelet-f087ba` at
  `.claude/worktrees/great-chatelet-f087ba/`.
- **Commits:** `<short-sha>` `feat: multi-page layout — shelf bin-packing onto printable pages`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 78
  passing + 1 todo (79 total — 17 new in `paginate.test.ts`);
  `pnpm build` clean; `pnpm baseline` re-ran with the new pipeline
  path (`buildRenderablePieces → paginate → emitSvg`); the
  `docs/baseline-pipeline.md` `overlaps` and `pieces` columns are
  byte-identical to the prior baseline (diff verified). Visual
  smoke via `pnpm dev`: tetrahedron renders as one piece on one
  Letter-sized page; SVG carries `viewBox="0 0 215.9 279.4"` and
  mm-suffixed dimensions.
- **Decisions made or deferred:** uniform scale-to-fit (candidate
  future ADR); naive shelf packing; mm-absolute drawing constants;
  baseline mislabel kept; `PlacedPiece.sourceIndex` for downstream
  correlation. No ADR — all session-log decisions, per spec.
- **Queue / roadmap deltas:** Roadmap — 0018 → ✅, 0019 → ⏭,
  "Where we are now" advanced. `project-state.md` — 0018 added to
  Sessions completed; Sessions planned advanced. `docs/queue.md`
  — unchanged.
- **Open questions for the strategist:** None blocking. The
  uniform-scale contract is the one thing worth a future-ADR call
  if v4's interactive editor or v5's print-tiling lands.
