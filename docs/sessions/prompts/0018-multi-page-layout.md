# Session 0018 — Multi-page layout

## Goal

Pack the multi-piece net onto printable pages at one consistent
real-world scale. After 0017, each piece is emitted as its own SVG
with its own auto-fit `viewBox` — so a 4-face piece and a 320-face
piece render at the *same display size* and relative scale is lost.
There is no notion of a page. This session adds a `paginate` stage
that bin-packs the pieces onto US-Letter pages at a single uniform
scale, refactors `emitSvg` to serialize a page, and updates the app
and baseline harness to match.

This is a **numbered session** — new functionality, multiple files,
new pure stage. Worktree per the worktree-by-default rule. Session
log `docs/sessions/0018-multi-page-layout.md` with a handoff block;
implementation report at session-end.

**No ADR.** Naive shelf bin-packing and the uniform-scale-to-fit rule
are session-log decisions — the same call made for 0015 (overlap
detection) and 0017 (tabs): a stage with an obvious naive approach
and a deferred refinement path. The one thing to flag in the session
log as a *candidate* future ADR: the uniform-scale contract (every
piece scaled by one factor) is a real correctness property —
papercraft pieces must physically mate. If a later session wants
per-piece scaling or piece-tiling, that is an ADR moment. For 0018 it
is a documented session-log decision.

## Where this sits in the pipeline

Current: `… → recut → buildRenderablePieces → emitSvg(piece)` once per
piece.

After 0018: `… → recut → buildRenderablePieces → paginate → emitSvg(page)`
once per page.

Import DAG change: today `tabs → emit-svg`. After this session
`tabs → paginate → emit-svg` — still acyclic. `paginate.ts` imports
`RenderablePiece` from `tabs.ts`; `emit-svg.ts` imports `Page` from
`paginate.ts` (and may still import `RenderEdge` from `tabs.ts` for
edge iteration).

## Decisions already taken (Evan, this session's planning)

- **Default page: US Letter** — 215.9 × 279.4 mm. A4 ships as a second
  ready-made constant; switching is a one-argument change.
- **Physical units.** The page is described in millimetres; SVG user
  units in the emit output are millimetres, so page dimensions map
  1:1 to the `viewBox`. This introduces a physical-units notion to
  the codebase — deliberate, since the whole point of pagination is
  printability.
- **Uniform scale, scale-to-fit.** One scale factor for *every* piece,
  chosen so the most constrained piece fits within a single page's
  printable area. No piece is ever split across pages.

## Task 1 — `src/core/paginate.ts` (new pure stage)

A pure function `paginate(pieces, page)` that scales every piece by
one uniform factor and shelf-packs them onto pages. Type contract in
**Appendix A**, copied verbatim — it is the stage's interface and the
wording is the deliverable.

Behaviour spec:

1. **Empty input** (`pieces.length === 0`) → return `[]`.

2. **Bounding box per piece.** For each `RenderablePiece`, compute the
   axis-aligned bounding box over *all* edge endpoints (`from`, `to`)
   and, for `cut` edges with a non-null `tab`, all tab vertices —
   exactly the set of points the old `emitSvg` ran its `bump` over.
   Yields `{ minX, minY, w, h }` in model units. If any piece has
   `w <= 0` or `h <= 0`, **throw** — a zero-extent piece signals an
   upstream degeneracy, and the pipeline's meshes are verified
   non-degenerate.

3. **Uniform scale `s`.** Let `printableW = page.widthMm - 2·page.marginMm`
   and `printableH = page.heightMm - 2·page.marginMm`. If either is
   `<= 0`, **throw** (malformed `PageSpec`). For each piece the
   largest scale that still fits the printable area is
   `min(printableW / w, printableH / h)` (axis-aligned — no rotation).
   `s` is the **minimum** of that quantity across every piece: the
   most constrained piece sets the scale, and every piece is then
   guaranteed to fit within one page's printable area.

4. **Shelf packing.** Sort piece indices by scaled height (`h·s`)
   descending; tie-break by `sourceIndex` ascending (determinism).
   Walk the sorted list with a cursor `(pageIndex, shelfTop,
   shelfHeight, x)` all starting at 0. For each piece, its scaled box
   is `(w·s, h·s)`:

   - **a. Shelf fit.** If the scaled width does not fit the shelf's
     remaining width (`x + w·s > printableW`), close the current
     shelf: `shelfTop += shelfHeight + page.gutterMm`, `x = 0`,
     `shelfHeight = 0`. (A fresh shelf always fits the piece, since
     `w·s ≤ printableW` by construction.)
   - **b. Page fit.** If the scaled box does not fit the page's
     remaining height (`shelfTop + h·s > printableH`), open a new
     page: `pageIndex += 1`, `shelfTop = 0`, `x = 0`,
     `shelfHeight = 0`. (A fresh page always fits the piece, since
     `h·s ≤ printableH` by construction — so this terminates.)
   - **c. Place.** Page-space placement origin is
     `(page.marginMm + x, page.marginMm + shelfTop)`. Then advance:
     `x += w·s + page.gutterMm`; `shelfHeight = max(shelfHeight, h·s)`.

5. **Transform.** For a piece with bounding box origin `(minX, minY)`
   and placement origin `(ox, oy)`, a model-space point `p` maps to
   page space as `(ox + (p[0] − minX)·s, oy + (p[1] − minY)·s)` —
   millimetres, origin at the page's top-left. Apply this to every
   `Vec2` in the piece: edge `from`, edge `to`, and every `tab`
   vertex. Produce a **new** `RenderablePiece` — the input pieces are
   not mutated. `kind` and `label` carry through unchanged.

6. **Output.** One `Page` per used page index, in ascending order,
   with `widthMm` / `heightMm` echoed from the `PageSpec` and `pieces`
   in placement order. (No empty pages are produced — a page only
   opens when a piece needs it.)

## Task 2 — `src/core/emit-svg.ts` refactor

`emitSvg` changes from `emitSvg(piece: RenderablePiece): string` to
`emitSvg(page: Page): string`.

- The `<svg>` element gets `width="{widthMm}mm" height="{heightMm}mm"`
  and `viewBox="0 0 {widthMm} {heightMm}"` so it prints at physical
  size.
- **Drop** the per-piece bounding-box / `size` / `bump` computation
  entirely — coordinates arriving from `paginate` are already final
  page-space millimetres.
- Stroke widths, dash pattern, and font size become **mm-absolute
  module constants** instead of being derived from a piece's extent.
  Reasonable papercraft starting values (the implementer may tune;
  record final values in the session log): cut/fold stroke ≈ 0.3 mm,
  tab outline stroke ≈ 0.2 mm, dash ≈ 2 mm, gap ≈ 1.5 mm, label font
  ≈ 3 mm, label inward offset ≈ 0.6 × font size.
- Emit a thin page-border rectangle (`0 0 widthMm heightMm`, no fill,
  light-grey stroke) so the page extent is visible on screen. A
  margin guide is optional — implementer's call.
- Iterate `page.pieces` → `placed.piece.edges`, then render with the
  **same** logic as today: fold edges dashed, cut edges solid, tab
  polygons, label text. The label-placement logic (offset along the
  tab's outward normal) is unchanged — it is piece-local geometry and
  survives a uniform scale-and-translate; just use the mm-absolute
  label offset constant.

## Task 3 — `src/app/main.ts` and `index.html`

- `main.ts`: after `buildRenderablePieces(result)`, call
  `paginate(renderable, LETTER)`; loop over the returned pages and
  `emitSvg(page)` each; render each page's SVG into a `.page-card`
  div with an `<h3>Page {n}</h3>` caption. Update the closing
  `console.log` to report the page count alongside pieces.
- `index.html`: rename the `.piece-card` / `.piece-svg` CSS rules to
  `.page-card` / `.page-svg` (the `.page-svg svg { width: 100% }`
  rule still applies). Caption text becomes "Page N".

## Task 4 — `scripts/baseline-pipeline.ts`

- Import `paginate` and `LETTER`. Replace the
  `for (const piece of renderable) emitSvg(piece);` exercise line with
  `const pages = paginate(renderable, LETTER);` followed by
  `for (const page of pages) emitSvg(page);` — keep it inside the
  existing `try` so a pagination throw is caught.
- Add a **`pages`** column to the `Result` type and the output table,
  carrying the per-model page count.
- Update the summary line to also report total pages across the
  corpus.
- The `overlaps` and `pieces` columns are **unchanged** — `paginate`
  does not touch the algorithm. Regenerating `docs/baseline-pipeline.md`
  via `pnpm baseline` should leave those columns byte-identical to
  the 0016/0017 baseline; only the new `pages` column is added.

## Task 5 — Tests

**`test/unit/paginate.test.ts`** (new). Use a corpus-driven helper in
the style of `emit-svg.test.ts`'s `pipelineFromCorpus` — run the
pipeline through `paginate`. Assert:

- **Within bounds.** Every coordinate of every placed piece lies
  within the page's printable area —
  `[marginMm, widthMm − marginMm] × [marginMm, heightMm − marginMm]`
  — within a small floating-point tolerance.
- **No box overlap.** No two placed pieces on the *same* page have
  overlapping bounding boxes.
- **Determinism.** `paginate` called twice on the same input is
  deep-equal.
- **Uniform scale.** Across all placed pieces in a run, the ratio of
  a placed edge's length to its source edge's length is the same
  constant (one scale factor for everything), and the largest source
  piece, scaled, fits within one page's printable area.
- **Single piece** (e.g. tetrahedron → 1 piece) → exactly one page
  with one placed piece.
- **Empty input** → `[]`.

**`test/unit/emit-svg.test.ts`** (update). The helper now builds a
`Page` (pipeline through `paginate`) rather than a bare
`RenderablePiece`. Keep the fold-dashed / cut-solid count invariants —
they still hold; the edge counts come from the pieces on the page.
Add an assertion that the emitted `<svg>` carries
`viewBox="0 0 215.9 279.4"` and `mm`-suffixed `width` / `height` for a
Letter page.

`recut.test.ts` and `tabs.test.ts` are unaffected — `paginate` is
downstream of both.

## Out of scope (explicit — do not build)

- **Piece rotation** for tighter packing. Naive packing is
  axis-aligned only.
- **Splitting / tiling a piece across pages.** The uniform
  scale-to-fit rule guarantees no piece ever needs it. Print tiling
  for large pieces is a v5 roadmap item.
- **A user-facing "set assembled model size" control.** That is the
  v4 interactive editor. v2's scale is "as large as fits one page."
- **Smarter bin-packing** (guillotine, maxrects, best-fit). Naive
  shelf packing only — roadmap says "naive bin-packing first."
- **Page furniture** — page numbers, registration marks, cut-line
  legends printed on the sheet. v3+ polish.

## Verification

- `pnpm type-check` — clean.
- `pnpm test:run` — green, including the new `paginate` suite.
- `pnpm build` — clean.
- `pnpm baseline` — re-run; `docs/baseline-pipeline.md` regenerated
  with the new `pages` column; confirm the `overlaps` and `pieces`
  columns are byte-identical to the prior baseline.
- **Visual check by Evan** via `pnpm dev` is the next gate after this
  session — page layout, scale legibility, and tab/label placement on
  a real page are human-eye calls, per the v1 rendering-session
  precedent. The session does not block on it.

## Handoff expectations

Standard worktree session. The session log ends with a handoff block
(branch/worktree, commit, verification results, decisions made or
deferred, queue/roadmap deltas, open questions for the strategist).
The implementation report names: decisions made, any deviation from
this spec, the final tuned mm constants, library APIs touched, and
anything worth a strategist eye. The prompt file commits with the
session commit.

Suggested commit message:

```
feat: multi-page layout — shelf bin-packing onto printable pages
```

Roadmap / project-state deltas at session-end: roadmap 0018 → ✅,
0019 → ⏭, "Where we are now" advanced; `project-state.md` Sessions
completed / planned advanced. No open queue items intersect 0018.

---

## Appendix A — `src/core/paginate.ts` type contract (verbatim)

```ts
import type { RenderablePiece } from "./tabs.js";

/**
 * A printable page, described in millimetres. SVG user units in the
 * emit stage are millimetres, so these values map 1:1 to the output
 * viewBox.
 */
export interface PageSpec {
  /** Page width in millimetres. */
  widthMm: number;
  /** Page height in millimetres. */
  heightMm: number;
  /** Uniform printable margin on all four sides, in millimetres. */
  marginMm: number;
  /** Minimum gap between adjacent placed pieces, in millimetres. */
  gutterMm: number;
}

/** US Letter — 215.9 x 279.4 mm — with a 10 mm margin and 5 mm gutter. */
export const LETTER: PageSpec;

/** ISO A4 — 210 x 297 mm — with a 10 mm margin and 5 mm gutter. */
export const A4: PageSpec;

/**
 * One piece placed on a page. `piece` is a copy of the input piece
 * with every coordinate — edge endpoints and tab vertices — already
 * scaled and translated into page space: millimetres, origin at the
 * page's top-left corner. `sourceIndex` is the piece's index in the
 * RenderablePiece[] handed to `paginate`.
 */
export interface PlacedPiece {
  sourceIndex: number;
  piece: RenderablePiece;
}

/** A page and the pieces packed onto it, in placement order. */
export interface Page {
  /** Page width in millimetres (echoed from the PageSpec). */
  widthMm: number;
  /** Page height in millimetres (echoed from the PageSpec). */
  heightMm: number;
  /** Pieces placed on this page. */
  pieces: PlacedPiece[];
}

/**
 * Pack the renderable pieces onto printable pages. Every piece is
 * scaled by one uniform factor — chosen so the most constrained
 * piece fits within a single page's printable area — so the printed
 * pieces share a consistent real-world scale and physically mate.
 * Pieces are never split across pages. Pure function; input pieces
 * are not mutated.
 *
 * Empty input yields an empty array. Throws on a zero-extent piece
 * or a PageSpec whose margins leave no printable area.
 */
export function paginate(
  pieces: RenderablePiece[],
  page: PageSpec,
): Page[];
```
