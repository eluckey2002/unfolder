# Retrospective — v3 complete

This is the third phase-boundary retrospective. Like the first two, it is
the durable record of what v3 became — the lessons that would otherwise
live only in a Cowork chat and evaporate at the next context boundary.
Read `v1-complete.md` and `v2-complete.md` first; this one assumes them.

## What v3 delivered

The tangible: v3 was the "quality output" phase on top of v2's functional
pipeline. Where v2 made every stage exist, v3 made the load-bearing ones
visibly good. Takahashi-style topological surgery replaced
dihedral-weighted MST + recut as the default unfolder: cut-removal
(ADR 0007, session 0025) collapses concave-model fragmentation dramatically
without regressing convex shapes. Smart tab placement (0026) swapped the
positional lower-face-index rule for an explainable score — longer edges
get a soft bonus, tabs that would clip their own piece's interior take a
hard penalty. Per-piece foldability classification (0027) added an
explainable buildability signal — `clean` / `caution` / `warn` from
smallest face-corner angle and smallest edge length — and a low-alpha SVG
tint overlay so a builder can see at a glance which pieces will be
tricky. Per-face color passthrough (0028) wired OBJ `.mtl` diffuse colors
through to SVG fills, with a no-color invariant that keeps materials-free
models byte-identical to their pre-color output.

The intangible: v3 was the first phase that had to answer "is this good
enough?" rather than "does this run?" The pipeline already worked
end-to-end. The question was whether the output was buildable papercraft.
The frozen v3-baseline snapshot (session 0021) gave the question a shape
— five quality metrics per model, captured at v3's start, comparable
across every subsequent session — and every implementation session
recorded its trajectory against it. By the end, four of the five metrics
had moved in the intended direction; piece count nearly halved across
the corpus, driven by cut-removal on the concave models that v2's
dihedral heuristic had fragmented hardest.

## What shipped, session by session

- **[0021 — v3 quality baseline](../sessions/0021-v3-quality-baseline.md).**
  Froze the five v3 quality metrics (piece count, total cut length,
  tab count, paper-area efficiency, page count) and captured the
  v3-start snapshot across the eleven-model corpus.
  `docs/baseline-v3.md` and `scripts/baseline-pipeline.ts` were both
  born here; the latter became the running quality dashboard that
  every subsequent session reported its delta against.
- **[0022 — Takahashi reference read](../sessions/0022-takahashi-reference-read.md).**
  A research read on Takahashi's topological-surgery paper. Findings
  doc landed in `docs/research/`; the read became the planning
  hand-off to the spike that followed.
- **[0023 — topological-surgery spike](../sessions/0023-topological-surgery-spike.md).**
  Three-variant spike: MST cut-shortening (A), cut-removal joining (B),
  greedy cut-removal (C). Variant C won decisively on fragmentation
  regression across the concave models; the spike findings became the
  basis for ADR 0007 and the implementation in 0025.
- **[0025 — optimized recut](../sessions/0025-optimized-recut.md).**
  Promoted Variant C from `spikes/` to `src/core/cut-removal.ts` as
  the v3 default unfolder. ADR 0007 records the decision; ADR 0005's
  greedy set-cover recut is superseded. Aggregate corpus impact:
  pieces 58 → 30, pages 18 → 14. Cut-removal also collapsed two prior
  stages (buildSpanningTree + recut → runCutRemoval), surfacing
  `runPipeline()` as the single-entry orchestrator at the same time.
- **[0026 — smart tab placement](../sessions/0026-smart-tab-placement.md).**
  Replaced the positional tab-side rule with a score-driven choice —
  edge-length bonus, hard penalty for `tabOverlapsOwnPieceInterior`.
  Algorithmic counts (pieces, pages, tabs) held byte-identical; tab
  placement is monotonically no-worse than the old rule and strictly
  better wherever both candidate sides aren't penalized. The
  area-based refinement is queued.
- **[0027 — audit visualization](../sessions/0027-audit-visualization.md).**
  Added per-piece foldability classification (`clean`/`caution`/`warn`)
  from two explainable metrics (smallest face-corner angle, smallest
  edge length) and a low-alpha SVG tint overlay per class. Pure
  downstream pass — no upstream algorithm changes. The classifier
  carries forward as v4's foundation for interactive buildability
  badges.
- **[0028 — color passthrough](../sessions/0028-color-passthrough.md).**
  Wired OBJ `.mtl` diffuse `Kd` through parser → pipeline → SVG fill.
  Naive-first scope per the v3 commitment: `Kd` only; texture / UV /
  STL color all deferred to v5. Authored one fixture MTL
  (`ginger-bread.mtl`); no-color invariant verified byte-identical
  for materials-free models on `cube.obj` and `octahedron.stl`.

Session 0024 (strategist-skills) is intentionally absent from this list
— it was a process commit, not a v3 product surface.

## Metric trajectory

Aggregate across the eleven-model corpus, frozen v3-start (0021) versus
post-0028 live baseline:

| Metric | v3 start (0021) | post-0028 | Δ |
| --- | --- | --- | --- |
| Total pieces | 58 | 30 | **−48 %** |
| Total pages | 18 | 14 | −22 % |
| Total cut length (mm) | 18,839.9 | 15,609.7 | −17 % |
| Total tabs | 777 | 749 | −4 % |
| Average paper efficiency | 22.9 % | 26.5 % | +3.6 pp |

Piece count and page count are the headline wins, driven almost entirely
by cut-removal on the concave models that dihedral-weighted MST had
fragmented hardest: croissant 15 → 3, deer 28 → 17, ginger-bread 5 → 2,
meat-sausage 3 → 1. Piece count and tab count moved by the same absolute
amount (−28 each): each cut-removal step merges two pieces by deleting
one shared cut, which also retires that cut's tab — so a 28-piece
collapse is also a 28-tab collapse. Cut length dropped much less than
piece count in proportion (−17 % vs −48 %) because the merged pieces
are themselves larger; the total perimeter walked by scissors does not
scale linearly with piece count. Paper efficiency drifted up modestly
as the larger pieces packed more densely against the printable margin.

Per-model trajectory and the two informational quality signals added
mid-phase (`tab overlap (own)` from 0026 and `foldability (c/c/w)` from
0027) live in `docs/baseline-v3.md` and the live
`docs/baseline-pipeline.md`. Neither signal is a frozen v3 metric;
both feed future sessions.

## Visual-sweep verdict

A corpus-wide visual sweep, run in this session and the close-out
verification of v3's quality bar (resolved Q-0026-2), confirms that v3's
output is structurally complete and visibly competitive on every
tractable input. Every emitted SVG renders to a consistent Letter-size
canvas with the expected element classes: piece outlines, fold lines
(dashed) and cut lines (solid), edge labels, tab polygons, foldability
tints, and — for `ginger-bread.obj`, the only corpus model with a
sibling `.mtl` — per-face color fills composited correctly behind the
tints. Foldability classification matches the post-0028 baseline
distribution exactly: 7 clean / 4 caution / 19 warn pieces across the
30-piece corpus output, with `ginger-bread.obj` exemplifying that v3's
two new visual surfaces compose cleanly (80 colored triangles render
underneath both `caution` and `warn` tint overlays without legibility
loss). Convex models (cube via both `.obj` and `.stl` parser paths,
tetrahedron, octahedron, uv-sphere) classify clean and render without
artifacts; smooth single-piece surfaces (cylinder, egg) classify
caution, flagging tight-geometry pole and cap regions rather than
rendering failure; the concave organic models (croissant,
meat-sausage, ginger-bread, deer) classify mostly warn, reflecting
small-feature regions that survive cut-removal. The model that sits
closest to the quality-bar edge is `deer.obj`: 15 of 17 pieces warn,
reflecting the 720-face concave-organic geometry whose dense
small-feature regions persist past cut-removal. The deer ships
buildable output, and its warn classifications are the honest "this
will be tricky" signal the v3 audit-visualization surface exists to
produce.

## What's left, deferred to v4 or later

- **Interactive editor surface** (file load, drag pieces, click edges,
  parameter sliders, undo/redo, React shell) — all v4 territory. The
  v4 design spec
  (`docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md`)
  is the entry point. The originally-v3-late file-loader UI was
  absorbed into v4.0 per that spec.
- **PDF export.** Pulled from v3 mid-phase (decisions-log 2026-05-16);
  SVG output was deemed sufficient for v3's quality bar. Carried to
  v5 if and when it earns its place.
- **Texture / UV color, STL color.** Explicit naive-first deferral per
  decisions-log 2026-05-16 ("MTL parser is Kd-only"). v5 territory.
- **Tolerance-aware overlap detector** (`detectOverlapsTolerant`).
  Queued as `[research]` in `docs/queue.md`; would let
  `polygon-clipping`-based integration verification return as a strict
  assertion rather than the current curvature-post-condition route.
  Not v3-blocking.
- **Area-based tab placement signal.** Queued as `[enhancement]`;
  replaces 0026's boolean `tabOverlapsOwnPieceInterior` with an
  intersection-area predicate, expected to discriminate "less
  crowded" from "more crowded" on the 133 cases where both candidate
  tab sides currently overlap (17.8 % of tabs across the corpus,
  concentrated in `deer.obj`).
- **Force-directed unfolding.** Queued as `[research]`; an alternative
  energy-based approach worth exploring if Variant C ever
  under-delivers on harder concave inputs than the current corpus
  contains.

## Lessons learned (light)

1. **Frozen baselines drive quality phases.** v2's failure baseline
   (5 of 11 unfoldable under plain DFS) drove v2. v3's five-metric
   frozen snapshot drove v3. The shape generalizes: a quality phase
   needs a structured "where we started" so every session's "where
   we are now" is legible against it.
2. **Spike before commit on algorithmically load-bearing changes.**
   Sessions 0022 + 0023 (read + spike) preceded 0025 (commit). The
   spike's tri-variant comparison turned ADR 0007 into a decision
   with evidence behind every alternative, not an aspiration with
   one option in mind.
3. **Naive-first survives scoping pressure.** Color shipped as
   `Kd`-only; texture deferred. Smart tabs shipped with the
   pre-paginate-tractable signals; the post-paginate ones were cut
   from scope mid-session. In each case the cut kept the session
   shippable and the surface honest. The cost of aspiration is
   visible in v3's README clean-up at close: three places had to be
   updated because v3's scope contracted (PDF removed, texture
   deferred, file-loader UI absorbed into v4.0).
4. **A foldability classifier doing its job will flag a lot of
   pieces.** Twenty-three of thirty pieces classify caution or warn
   in v3's corpus output. That is not a quality failure — it is the
   classifier reporting honest geometry. The v4 spec's
   feedback-driven iterative unfolding turns those signals from
   warnings into actionable entry points.
5. **Save the deep retrospective for `/retrospect v3`.** This file is
   what shipped. The process and relationship retrospective is a
   separate ceremony, following the v2 pattern of
   `v2-complete.md` + `v2-retrospective.md` as paired but separate
   artifacts.

---

Welcome to v4.
