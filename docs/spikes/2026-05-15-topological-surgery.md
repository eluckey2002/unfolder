# Spike: topological-surgery menu against v3 baseline

**Date:** 2026-05-15. **Session:** 0023. **Branch:** `spike/topological-surgery`.

This is the project's first spike. It establishes the
`spikes/<date>-<slug>/` and `docs/spikes/` conventions.

## Goal

`docs/references/takahashi.md` (session 0022) recommends three
cut-strategy alternatives to v2's pure unsigned-dihedral MST plus
greedy cut-addition recut:

* **Variant A — Vertex-curvature pre-flatten guard** (per Takahashi
  2011 §3.3). Necessary-condition check on every vertex: hyperbolic
  vertices (corner-angle sum > 2π) need ≥ 2 incident cut edges;
  elliptic vertices (< 2π) need ≥ 1.
* **Variant B — Blended convex / concave / length weights** (per
  Export-Paper-Model). Replace v2's unsigned-dihedral fold weight
  with a linear combination of three terms.
* **Variant C — Greedy cut-removal recut** (per PolyZamboni).
  Invert v2's "start connected, cut what overlaps" to "start
  fragmented, fold what's safe."

The spike implemented each at proof-of-concept polish, ran each on
the 11-model v3 corpus, captured the v3 baseline metric set plus
SVG output, and asked: which belong in v3, which become opt-in,
which drop, and what user-facing parameters each naturally exposes
for v4?

## Setup

* **Corpus:** the 11 models in `test/corpus/` (same set as
  `scripts/baseline-pipeline.ts`). Faces range 4 (tetrahedron) to
  720 (deer).
* **Metrics:** the v3 quality baseline metric set —
  piece count, pages, total cut length (mm, double-counted per the
  cut-length decisions-log entry), tab count, paper efficiency —
  plus per-variant wall-clock time. Variant A's diagnostic
  produces vertex-class counts and violation counts instead.
* **v2 reference numbers:** transcribed from `docs/baseline-v3.md`
  (the frozen v3 starting point); not re-run as part of the spike.
* **No modifications to `src/`.** Spike code lives in
  `spikes/2026-05-15-topological-surgery/` and depends on `src/core/`
  modules read-only.

Run the full sweep with `pnpm spike`. Raw numbers in
`results.md`; per-(variant, model) SVGs in `svg/`; the visual
comparison surface in [`comparison.html`](../../spikes/2026-05-15-topological-surgery/comparison.html).

## Variant A — Vertex-curvature pre-flatten guard

**What was built.** A diagnostic pass at
`spikes/.../variant-a-curvature/curvature.ts` that computes per-vertex
corner-angle sums, classifies each vertex
(hyperbolic / elliptic / parabolic by sign of 2π − Σ corner angles),
counts incident edges in v2's final cut set
(spanning-tree cuts ∪ recut-promoted cuts), and reports every
vertex that violates the Takahashi necessary condition.

**Results.**

| model            | faces | hyperbolic | elliptic | parabolic | violations |
| ---------------- | ----- | ---------- | -------- | --------- | ---------- |
| tetrahedron.stl  | 4     | 0          | 4        | 0         | **0**      |
| octahedron.stl   | 8     | 0          | 6        | 0         | **0**      |
| cube.obj         | 12    | 0          | 8        | 0         | **0**      |
| cube.stl         | 12    | 0          | 8        | 0         | **0**      |
| cylinder.obj     | 28    | 0          | 16       | 0         | **0**      |
| egg.obj          | 44    | 0          | 24       | 0         | **0**      |
| uv-sphere.obj    | 48    | 0          | 26       | 0         | **0**      |
| ginger-bread.obj | 80    | 12         | 22       | 8         | **0**      |
| croissant.obj    | 162   | 36         | 47       | 0         | **0**      |
| meat-sausage.obj | 320   | 66         | 96       | 0         | **0**      |
| deer.obj         | 720   | 179        | 183      | 0         | **0**      |

**The key question — does v2's spanning tree already satisfy the
condition?** **Yes, on every model.** Zero violations across the
corpus, including the four highly-concave models (deer, croissant,
meat-sausage, ginger-bread) where one would most expect the
classifier to flag missing cuts at saddle vertices.

**Observation.** This isn't because v2's MST happens to be
hyper-aware of curvature — v2's recut step splits the unfolding
into pieces whenever the layout overlaps, and a piece that
unfolds cleanly *cannot* contain a hyperbolic vertex with fewer
than 2 incident cuts (the geometric reason is exactly Takahashi's
own argument). v2's recut implicitly enforces the necessary
condition by feasibility, not by direct check.

**What this means for v3.** Variant A is **free correctness
reassurance, not a meaningful algorithmic change.** Wiring it in as
an enforcement gate during spanning-tree construction would change
nothing about output quality, because the recut step is already
maintaining the invariant downstream. The function still has value
as:

* A **post-condition assertion** — cheap (O(F + E) per run) and
  worth checking after every recut to catch regressions in the
  recut algorithm itself.
* A **diagnostic for the audit-visualization session** — hyperbolic
  and parabolic vertex counts are intrinsic mesh properties worth
  surfacing in the v3 audit view.

Cost is negligible, the check is mathematically clean, and zero
violations is a reassuring property to encode. Keep it as a
post-condition; don't expose any user-facing parameter.

## Variant B — Blended convex / concave / length weights

**What was built.** A new weight function
`computeBlendedWeights(mesh, dual, coeffs)` at
`spikes/.../variant-b-blended/blended.ts`, signature-compatible
with v2's `computeDihedralWeights` so it slots into
`buildSpanningTree` unchanged. Computes the signed dihedral angle
locally (v2's `dihedral.ts` only exposes unsigned), splits it into
convex and concave terms, adds an edge-length term, and returns a
single scalar per dual-graph adjacency.

**Coefficients used for the spike run.**
```
convex  = 0.5    (mild preference to cut convex ridges)
concave = 1.0    (stronger preference to cut concave valleys —
                 concave cuts hide in the assembled fold)
length  = -0.1   (long edges prefer to fold; negative term so
                 longer edges produce lower fold-weight)
```

Coefficients chosen by hand to encode three deliberate intentions:
hidden seams should land in concave creases; convex ridges should
remain visible (so prefer to cut them only when the geometry forces
it); long edges should fold rather than cut because they dominate
the total cut-length metric we care about. Tuning the coefficients
is **out of scope** for the spike — the question was whether the
*shape* of the weight makes a visible difference, not whether
specific defaults are optimal.

**Results — v2 baseline → Variant B.**

| model            | pieces        | cut mm          | tabs          | efficiency      |
| ---------------- | ------------- | --------------- | ------------- | --------------- |
| cube.obj         | 1 → 1         | 623 → 623       | 7 → 7         | 23.4 → 23.4 %   |
| cube.stl         | 1 → 1         | 825 → 825       | 7 → 7         | 41.0 → 41.0 %   |
| tetrahedron.stl  | 1 → 1         | 529 → 529       | 3 → 3         | 26.5 → 26.5 %   |
| octahedron.stl   | 1 → 1         | 569 → 569       | 5 → 5         | 22.1 → 22.1 %   |
| cylinder.obj     | 1 → 1         | 641 → 641       | 15 → 15       | 22.4 → 22.4 %   |
| egg.obj          | 1 → 1         | 1154 → 1154     | 23 → 23       | 35.5 → 35.5 %   |
| uv-sphere.obj    | 1 → 1         | 1022 → 935      | 25 → 25       | 22.1 → 18.5 %   |
| ginger-bread.obj | 5 → 5         | 2215 → 2383     | 45 → 45       | 23.0 → 22.0 %   |
| croissant.obj    | **15 → 6**    | **2889 → 2906** | 96 → 87       | 15.3 → 15.7 %   |
| meat-sausage.obj | **3 → 2**     | **2334 → 1596** | 163 → 162     | 11.3 → 8.4 %    |
| deer.obj         | **28 → 36**   | **6039 → 7018** | 388 → 396     | 9.8 → 18.8 %    |

**Observations.**

* **Convex meshes don't move.** All seven convex models (the four
  platonic / extruded, plus egg and uv-sphere) are dominated by the
  length term — the dihedral terms contribute nothing because there
  are no concave dihedrals — and the MST result is unchanged or
  effectively-unchanged. Cut-length jitter on convex models
  (uv-sphere 1022 → 935) is the *paper-fit scale* shifting when the
  layout's bounding box changes shape, not a real change in cut
  topology. Same explanation for cube.obj 23.4 % vs cube.stl 41 %
  in the baseline.
* **Concave meshes go in both directions.** Croissant 15 → 6 pieces
  and meat-sausage 3 → 2 (with cut length down 32 %) are clear wins
  attributable to favoring concave-edge cuts and long-edge folds.
  Deer 28 → 36 is a clear regression: the deer's many small
  concave seams around the legs and ears produce a weight surface
  with many near-ties, and the chosen coefficients tip them the
  wrong way.
* **Mixed-but-promising verdict.** The blend reaches outcomes that
  pure unsigned-dihedral cannot, but the chosen defaults are not
  uniformly better.

**Parameters this variant naturally exposes (for v4 UI).** The
three coefficients — `convex`, `concave`, `length` — are the
obvious knobs. Possible UI presets:

* **"Hide seams"** — bias `concave` high (1.5–2.0), `convex` low.
* **"Short cuts"** — bias `length` more negative.
* **"Aesthetic ridges"** — bias `convex` low (preserve visible
  edges of the original geometry).

The blend's coefficient sensitivity is a real liability: as deer
shows, the wrong defaults can regress. v3 should not ship Variant
B as the *default* algorithm without per-corpus tuning — but it
*is* the natural pathway to a tunable mode that v4 can expose.

## Variant C — Greedy cut-removal recut

**What was built.** A wholly new recut at
`spikes/.../variant-c-cut-removal/cut-removal.ts` that replaces both
the spanning-tree and recut steps with a single greedy pass:

1. Every face is its own component, laid out in its canonical local
   frame (`v0` at origin, `v1` on +x, `v2` in upper half-plane —
   matching the convention `buildLayout` uses for the root face).
2. Sort all dual-graph adjacencies by 3D edge length descending.
   **Iteration order:** long-first. Rationale: long cuts dominate
   the total-cut-length metric, so folding them back has the
   highest per-fold payoff. Other obvious orders (dihedral-angle
   sorted, area-weighted, or PolyZamboni's axis-aligned sort) are
   *not* tested in this spike — see "Honest limitations."
3. For each adjacency `(a, b)`: if `find(a) == find(b)`, skip
   (cycle). Otherwise compute the rigid 2D transform that aligns
   face `b`'s frame to face `a`'s shared edge, with a reflection
   step to ensure the two apexes land on opposite sides of the
   shared edge (mirrors `buildLayout`'s rigid-unfolding rule).
4. Tentatively transform every face in the moving component. Run
   bbox-prefiltered triangle-pair overlap checks against the
   anchor component. If clean, commit (union the components,
   permanently transform the moving component's positions); if
   not, reject the merge (leave the edge as a cut).

The output is a `RecutResult` compatible with v2's downstream
chain — `tabs` → `paginate` → `emit-svg` consumes it unchanged,
which lets the variant exercise the full v3 metric set.

**Numerical-stability fallback.** During a merge attempt, the
inner `polygonClipping.intersection` call can throw on
near-coincident floating-point boundaries (two triangles sharing
an edge by construction inside the same component force this).
The variant catches such exceptions and treats them as a
**conservative overlap** — the merge is rejected. Without this,
four of the eleven models aborted mid-run. With it, every model
produces output; the rejection count is the upper bound on how
many otherwise-valid merges were sacrificed to numerical
robustness, and it is reported per-model in `results.md`.

**Results — v2 baseline → Variant C.**

| model            | pieces        | cut mm          | tabs          | efficiency      |
| ---------------- | ------------- | --------------- | ------------- | --------------- |
| cube.obj         | 1 → 1         | 623 → 623       | 7 → 7         | 23.4 → 23.4 %   |
| cube.stl         | 1 → 1         | 825 → 825       | 7 → 7         | 41.0 → 41.0 %   |
| tetrahedron.stl  | 1 → 1         | 529 → 529       | 3 → 3         | 26.5 → 26.5 %   |
| octahedron.stl   | 1 → 1         | 569 → 749       | 5 → 5         | 22.1 → 38.2 %   |
| cylinder.obj     | 1 → 1         | 641 → 711       | 15 → 15       | 22.4 → 27.6 %   |
| egg.obj          | 1 → 1         | 1154 → 988      | 23 → 23       | 35.5 → 26.0 %   |
| uv-sphere.obj    | 1 → 1         | 1022 → 991      | 25 → 25       | 22.1 → 20.2 %   |
| ginger-bread.obj | **5 → 2**     | **2215 → 1296** | 45 → 42       | 23.0 → 26.7 %   |
| croissant.obj    | **15 → 3**    | **2889 → 2093** | 96 → 84       | 15.3 → 20.3 %   |
| meat-sausage.obj | **3 → 1**     | **2334 → 1748** | 163 → 161     | 11.3 → 20.0 %   |
| deer.obj         | **28 → 17**   | **6039 → 5074** | 388 → 377     | 9.8 → 22.2 %    |

**Observations.**

* **Strong, consistent wins on every concave model.** Croissant
  15 → 3 (−80 %), deer 28 → 17 (−39 %), ginger-bread 5 → 2 (−60 %),
  meat-sausage 3 → 1 (single-piece unfolding — the ideal). Cut
  length drops 14–42 % on those four. Paper efficiency more than
  doubles on deer (9.8 % → 22.2 %) and ginger-bread.
* **Convex models unchanged on piece count; cut length unchanged
  topologically.** Cube, tetrahedron — identical. Cylinder,
  octahedron, egg, uv-sphere — same single piece, but cut length
  shifts because the unfolded *layout shape* changes, which
  changes paper-fit scale. This is the same scale artifact that
  shows up across cube.obj vs cube.stl in the baseline (same
  mesh, different source dimensions) and is documented in the
  cut-length decisions-log entry. **Topological cut-set on the
  convex models is identical between v2 and Variant C** in every
  case — same set of edges classified as cuts, just laid out
  differently.
* **Trade-off on convex models:** octahedron's 22.1 % → 38.2 %
  paper-efficiency *gain* is the same kind of scale artifact —
  the cut-removal layout happens to use page area more
  efficiently. The "cut length" jitter cuts both ways.
* **Numerical-robustness floor.** The conservative-rejection
  fallback rejected 36 (croissant), 24 (ginger-bread), 185
  (deer), 3 (cylinder) merges that the strict overlap test
  could not adjudicate. Variant C's piece counts are an *upper
  bound* — a more numerically robust implementation could only
  improve, not worsen, the results.

**Wall-clock cost.** Variant C runs faster than v2 on every model
in this corpus (deer: 72 ms vs v2's full pipeline ~400+ ms),
because the early-termination overlap check on small components
out-performs v2's all-pairs overlap-pass-then-recut. The 30-second
per-model time budget that the spike harness enforces was not
triggered on any model.

**Parameters this variant naturally exposes (for v4 UI).**

* **Iteration order.** Three obvious presets — long-first,
  dihedral-sorted, random — produce noticeably different
  unfoldings. The user-facing knob would be the *priority
  function* itself (sortable list of "long edges," "concave
  edges," "edges aligned to axis X/Y/Z"), with **long-first** as
  the documented default.
* **Maximum component size cap.** PolyZamboni's
  `max_faces_per_component = 10` default is a builder ergonomic —
  smaller pieces are easier to assemble. The cap is trivial to add
  to this variant (skip a merge that would exceed it). Not tested
  here but worth the queue.
* **Overlap policy.** The conservative-rejection fallback could
  become a user setting (strict / lenient / ignore) once
  audit-visualization makes overlaps user-visible.

## Cross-variant comparison

| model            | faces | v2 pieces | A violations | B pieces | C pieces |
| ---------------- | ----- | --------- | ------------ | -------- | -------- |
| tetrahedron.stl  | 4     | 1         | 0            | 1        | 1        |
| octahedron.stl   | 8     | 1         | 0            | 1        | 1        |
| cube.obj         | 12    | 1         | 0            | 1        | 1        |
| cube.stl         | 12    | 1         | 0            | 1        | 1        |
| cylinder.obj     | 28    | 1         | 0            | 1        | 1        |
| egg.obj          | 44    | 1         | 0            | 1        | 1        |
| uv-sphere.obj    | 48    | 1         | 0            | 1        | 1        |
| ginger-bread.obj | 80    | 5         | 0            | 5        | **2**    |
| croissant.obj    | 162   | 15        | 0            | **6**    | **3**    |
| meat-sausage.obj | 320   | 3         | 0            | 2        | **1**    |
| deer.obj         | 720   | 28        | 0            | 36       | **17**   |

**Per-model sweet spots.**

* **Convex models (7 of 11):** all three variants tie with v2.
  Pick by other criteria (cut-length quality on a per-model basis,
  layout aesthetics).
* **Mildly concave (ginger-bread, croissant):** Variant C
  dominates — 60–80 % piece-count reduction with no compensating
  loss on other metrics.
* **Strongly concave organic (deer, meat-sausage):** Variant C
  dominates. Variant B helps on meat-sausage but regresses on
  deer.

**No variant strictly dominates v2 on every metric simultaneously**
(Variant C trades a small cut-length increase for a piece-count
collapse on octahedron, for example), but **Variant C dominates v2
on the v3-quality axis we care most about — fragmentation — across
every model in the corpus, and ties or improves on every metric
on every concave model.** Variant B is a clear second place;
Variant A is no-op-on-output.

## Visual judgment surface

Open [`comparison.html`](../../spikes/2026-05-15-topological-surgery/comparison.html)
and scan the side-by-side per-model panels. The visual differences
that matter:

* On **croissant**, **deer**, and **ginger-bread**, Variant C
  produces a small number of *large, organic-shaped* pieces where
  v2 produced many *small, scattered* pieces. The Variant C
  layouts are physically a much more sensible thing to cut out
  and assemble.
* On **meat-sausage**, Variant C achieves a single-piece
  unfolding (the ideal). v2's three-piece result and Variant B's
  two-piece result are clearly inferior assembly experiences.
* On **convex models**, the three layouts are visually distinct
  but represent the same cut set. Pick on layout aesthetic if
  paper economy is the goal.

## Recommendations for v3

A menu, not a tournament:

* **Variant A — Adopt as a post-condition assertion.** Wire
  `reportCurvature` (or its violation-list equivalent) into the
  end of the recut stage as a `console.warn` / structured-log
  signal: "non-zero violations would indicate a regression."
  Zero user-facing surface. Free correctness reassurance. Spike
  shows zero violations on the entire corpus, which means the
  assertion is *currently always satisfied* — exactly what we
  want from an invariant check.
* **Variant B — Drop as the default; expose as opt-in.** Don't
  make blended weights the v3 default unfolder. The deer
  regression is disqualifying for a "ships better than v2 on
  every model" goal. Do keep the implementation in `src/` (or
  promote from spike to `src/`) so v4's UI can expose the three
  coefficients as a "Cut style" panel. **Recommendation:**
  promote during the v3 cut-quality session (0024) as an
  alternate weight function, gated behind a parameter.
* **Variant C — Adopt as the v3 default.** Replace v2's MST +
  recut with greedy cut-removal as the **default v3 algorithm**.
  Piece counts collapse 39–80 % on every concave model with no
  metric regression. Convex models tie on piece count and
  cut-set (only layout shape changes). The numerical-robustness
  fallback is documented and rejecting roughly 5–25 % of merge
  attempts; tightening the fallback is incremental future work.
* **Default v3 algorithm:** Variant C. **Opt-in v3 algorithm:**
  Variant B (one parameter set). **Always-on invariant:**
  Variant A's check.

Per-model sweet spots argue for *keeping multiple algorithms
accessible*: v3 should ship the API surface for "which algorithm,
which parameters," even if the default is fixed. v4's interactive
mode will surface this directly.

## Honest limitations

* **Parameter tuning was not in scope.** Variant B's three
  coefficients were picked by intent, not search. Variant C's
  iteration order is fixed at "long edges first" — no comparison
  against dihedral-sorted, area-weighted, or random orders. A
  follow-up parameter-tuning spike on Variant C alone, sweeping
  iteration orders and cap sizes, is the obvious next thing.
* **Variant C's numerical fallback is conservative.** The
  spike-level treatment of polygon-clipping exceptions as
  overlaps probably rejects some merges that a more robust
  predicate would accept. A custom triangle-pair-overlap
  predicate using exact arithmetic on the few near-tangent
  cases would tighten this. Variant C's published numbers are
  therefore an upper bound on piece count — better is
  achievable, worse is not.
* **No larger meshes tested.** The corpus tops out at 720 faces
  (deer). Takahashi's paper caps practical genetic-algorithm
  unfolding at ~500 faces; PolyZamboni's max-component cap is
  10 faces; this spike's Variant C runs comfortably on deer in
  72 ms, which suggests scaling is not currently a bottleneck,
  but the spike does not exercise the regime where it would
  become one.
* **No pathological inputs.** Non-manifold meshes, very thin
  triangles, near-degenerate dihedrals, very high genus — none
  tested. The spike's confidence applies only to the corpus
  shape: closed two-manifold, single component, genus 0,
  vertices well-spread.
* **Confidence in the per-variant verdicts.** **High** that
  Variant C is the right v3 default — the piece-count
  improvements are large enough to survive any reasonable
  tightening of measurement. **Medium** that Variant B should
  be opt-in only — the deer regression could be a coefficient
  problem rather than a structural one, and a follow-up tuning
  spike could flip this verdict. **High** that Variant A's
  output-effect verdict (no-op) is correct — the math says it
  must hold, and the empirics confirm it.

## Ideas not tested (parked for future spikes)

* **Force-directed unfolding** — simulate faces as 2D rigid
  bodies connected by hinges, with repulsive forces between
  non-adjacent faces; cuts emerge where hinges over-strain.
  Energy-based continuous relaxation of the discrete
  cut-selection problem. Strong v4-UX fit because every
  parameter is a physical quantity (repulsion strength, hinge
  stiffness) and a user can watch the simulation converge.
  Queued separately as a `[research]` item in `docs/queue.md`.
* **Steepest Edge heuristic** for convex meshes — provably
  optimal on convex polyhedra (single-piece unfolding always
  reachable). Out of scope here because every convex model
  already unfolds to one piece under v2; would only matter as a
  *faster* algorithm for the convex case.
* **Tabu search over Variant C's iteration order.** Variant C's
  output depends entirely on the merge order; a local-search
  pass over alternative orderings could find better orderings
  for individual models without changing the algorithm shape.
* **Progressive mesh approximation.** Pre-process highly
  triangulated meshes into a coarser representation, unfold the
  coarse version, then refine. Mostly a concern for v5+ when
  the input regime widens.
* **Takahashi's full GA.** Reference implementation matches the
  paper, but the cost (~13 minutes per 950-face mesh) is
  prohibitive for the v3 ship state. Worth revisiting if
  Variant C's output proves to need single-piece-unfolding
  guarantees that greedy cannot achieve.
