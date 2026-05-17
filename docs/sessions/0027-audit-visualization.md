# Session 0027 — Audit Visualization

## What was attempted

Ship per-piece foldability classification and a color-tint overlay in
the 2D SVG output. Closes the "audit visualization (color-coded
regions by foldability)" surface from the README v3 phase commitment.
Pure downstream pass over the existing v3 pipeline output — no
upstream algorithm changes; the visualization layers onto
`emit-svg.ts`. The classifier carries forward as v4's foundation for
interactive buildability badges per the 2026-05-16 v4 user-research
findings.

## What shipped

### Ten commits on `session/0027-audit-visualization`

1. `aff213f feat(foldability): edge-length signal classifier` — Task 1
2. `9b36aa2 feat(foldability): face-corner-angle signal + aggregation` — Task 2
3. `c09ccfb feat(tabs): optional foldability field on RenderablePiece` — Task 3
4. `886561f feat(pipeline): classify foldability post-paginate` — Task 4
5. `9260614 feat(emit-svg): outline-polygon reconstruction helper` — Task 5
6. `5a3ad17 feat(emit-svg): per-piece foldability tint` — Task 6
7. `5c20ce8 feat(app): swap to deer.obj for multi-piece classifier exercise` — Task 7
8. `d3a2222 feat(baseline): foldability column + per-class totals` — Task 8
9. `56df948 docs(0027): baseline-v3 trajectory note + decisions-log entry` — Task 9
10. `f173abb docs(decisions-log): foldability classifier metrics + thresholds` — Task 10

### Code surface

- **`src/core/foldability.ts` (new)** — `classifyFoldability(piece): "clean" | "caution" | "warn"`. Pure function over a `RenderablePiece`. Two metrics: smallest face-corner angle (derived from edge-triplet grouping; angle is scale-invariant) and smallest edge length (post-paginate mm). Per-class aggregation: 0 trips → clean; 1 caution → caution; 1 warn or 2 caution or caution+warn → warn. Seed thresholds: angle <30°/<15°, edge <5 mm/<2 mm.
- **`src/core/tabs.ts`** — added optional `foldability?: FoldabilityClass` field on `RenderablePiece`. One-line invariant comment documents the face-triplet edge order that `buildRenderablePieces` already produces and that `classifyFoldability` + `reconstructOutline` both depend on.
- **`src/core/pipeline.ts`** — `runPipeline` now mutates `placed.piece.foldability` for every paginated piece via a downstream pass after `paginate`. Curvature reporting still runs in parallel; no ordering change.
- **`src/core/emit-svg.ts`** — added exported `reconstructOutline(edges)` helper (cut-edge boundary walk, folds ignored) and a per-piece tinted-polygon emission pass before the existing line-work loop. Tints use HSL fills with low alpha:
  - clean → `hsla(120, 50%, 70%, 0.18)` (light green)
  - caution → `hsla(48, 90%, 65%, 0.22)` (light amber)
  - warn → `hsla(0, 70%, 65%, 0.25)` (light red)
- **`src/app/main.ts`** — swapped hardcoded `tetrahedronStl` to `deer.obj` via the existing `parseObj`. Tetrahedron is single-piece so it never exercised the classifier; deer.obj is the corpus's most complex model (17 pieces).
- **`scripts/baseline-pipeline.ts`** — added `foldability (c/c/w)` column with per-row `clean/caution/warn` counts; added per-corpus totals line to the summary. Pre-0027 columns are byte-identical (hard gate verified).
- **Tests** — added 6 unit tests in `test/unit/foldability.test.ts` (3 edge-length + 2 angle + 1 aggregation); 3 outline-reconstruction tests and 3 tint-emission tests in `test/unit/emit-svg.test.ts`; 1 pipeline-level integration assertion in `test/unit/pipeline.test.ts`. **Suite: 167 passing** (was 154 after 0026).

### Documentation

- **`docs/baseline-pipeline.md`** — regenerated with the new column. 7 clean / 4 caution / 19 warn pieces across the corpus. Platonic solids and uv-sphere all classify clean; deer.obj is 2/0/15 reflecting cut-removal sliver faces.
- **`docs/baseline-v3.md`** — appended a "v3 trajectory — after session 0027" section.
- **`docs/decisions-log.md`** — entry on the metric set, aggregation rule, threshold seed values, and the rationale for dropping the diameter signal.

## Verification

- `pnpm test:run` — 167 / 167 passing
- `pnpm type-check` — clean
- `pnpm build` — clean (~593 KB bundle)
- **Hard gate (baseline column invariant):** `git diff docs/baseline-pipeline.md` showed only the new `foldability` column and summary line; piece / page / tab / cut-length / efficiency columns byte-identical to the post-0026 baseline.
- **Visual gate:** generated a 3-page deer.obj preview via a transient `vite-node` probe (not committed) that wrapped each `emitSvg` page in an HTML card with the three-class legend. Sub-agent structural review confirmed (a) 17 `<polygon class="foldability-tint">` elements (one per piece), (b) all three exact HSL color values, (c) tints emitted before any `<line>` element in every page's document order, (d) 2,160 cut/fold lines layered over the tints. The preview was opened in the browser; warn tints are visible without obscuring stroke work or labels at the page-card scale.

## What we learned

1. **Face data didn't need a type extension.** The original concern in planning was that `RenderablePiece` carries no face vertex data, only edges — and `classifyFoldability` needs face-corner angles. Resolved by locking in the existing `buildRenderablePieces` invariant that edges are emitted in face-triplet order (3 per face, in vertex-walk sequence). The classifier groups `piece.edges` in 3s and derives corner angles from adjacent edge-vector dot products. No new type field for faces, no new plumbing.
2. **Angles are scale-invariant; edge lengths aren't.** Running the classifier post-paginate (where lengths are in printed mm) is necessary for the edge threshold but free for the angle threshold. This kept the integration seam shallow — one downstream pass after `paginate`, no rework of upstream stages.
3. **Threshold seed values held.** Platonic solids and uv-sphere all classify `clean`; cylinder and egg (single-piece strip-face shapes) classify `caution`; complex multi-piece models (croissant, ginger-bread, deer, meat-sausage) skew warn. The spread is meaningful — not a degenerate single-class outcome — and the platonic-solid sanity check confirms the classifier doesn't false-flag well-formed regular meshes. No tuning needed.
4. **deer.obj is 15/17 warn.** Honest signal: the deer model's cut-removal output produces many sliver faces (the prompt anticipated this). The visualization reads as predominantly red, which is the correct semantic for a model that genuinely is hard to fold by hand. v4's interactive iteration is where users will resolve this — for the v3 static output, the warns surface the truth.

## Open follow-ups (none)

Nothing carried out of this session. The area-based tab-placement
enhancement remains in `docs/queue.md` — touched `tabs.ts` only for
the optional `foldability` field, no logic change to placement, no
interaction with the queue item.
