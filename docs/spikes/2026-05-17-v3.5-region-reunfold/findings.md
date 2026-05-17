# Region re-unfold spike — findings

**Date:** 2026-05-17. **Session:** 0031. **Branch:** `spike/0031-region-reunfold`.
**Companion:** `algorithm.md` in the same directory.

This is the second of two committed deliverables for spike session
0031, mirroring the structure of the precedent spike findings doc at
`docs/spikes/2026-05-15-topological-surgery.md` (verdict / evidence /
next step). Required by the prompt's Verification gate 6.

## Verdict

**NEEDS-REVISION.** The algorithm is structurally implementable and
the contract is precise enough to ground promote-to-core. Four
underspecifications in v4 spec § 7 require spec-document edits before
the v4.3 fix-suggestion engine compiles against a stable contract.
None of the four are show-stoppers; all four are
clarifications + corrections that the 0032 promote-to-core session
applies as part of its first task.

The verdict is **not** ALGORITHM-READY because the spec-document
layer carries four named drifts (listed below). The verdict is **not**
INFEASIBLE because the algorithm shape is sound, the determinism
contract has a precise mechanical definition, and the failure path is
explicit. The fallback (manual region-pin + full-pipeline-re-run with
loading spinner per v4 spec § 3) is NOT triggered.

## Evidence

### What the spike produced

- `algorithm.md` — full algorithm specification: input/output
  contract, preconditions, six-step procedure with per-step rationale
  and edge-case handling, failure modes, determinism contract with
  precise `edgeOrderHash` definition, API sketch, worked-example
  trace on `octahedron.stl`.
- This document (`findings.md`).
- Session log at `docs/sessions/0031-v3.5-region-reunfold-spike.md`.

### What the worked example showed

The synthetic 2-of-8-face region on `octahedron.stl` exercises Steps
1, 2, 3, 4 (region pipeline + anchor transform), 5 (no-collision
case), and 6 (piece-split-by-region) end-to-end with explicit
geometry. The hand-trace surfaced:

- **The boundary partition (Step 1) is mechanical.** Walking
  `dual.adjacencies` and bucketing by `region` in/out membership is
  3 lines of TypeScript. No edge cases.
- **The anchor selection (Step 2) needs a precise tie-break.** v4
  spec § 7 said "pick any region edge as a free anchor" for the
  no-boundary case; sufficient phrasing for understanding but not
  implementation. The spike picks longest-3D + canonical pair key,
  and adds the third tier (no boundary at all) with an
  internal-fallback path the spec did not enumerate.
- **The region-aware adjacency builder is a new module
  (`buildRegionAdjacency`).** v4 spec § 7 implies this exists; v3
  today's `buildAdjacency` throws on non-manifold edges, which is
  exactly what region boundaries look like. The promote-to-core
  session implements this as a new export from `adjacency.ts` (or a
  new module).
- **The anchor transform IS already computable from existing
  primitives.** The spike's Step 4(b) shows how to compose the rigid
  2D transform from face 0's canonical frame to the pinned
  `(p0, p1)` position using only operations already in
  `cut-removal.ts`. No new geometry primitives needed.
- **The `edgeOrderHash` definition is precise enough to be
  byte-reproducible** across two implementations (canonical
  serialization → sha256 → first 32 hex chars). The hash binds only
  the region's iteration order, not the global pipeline's — this
  scope choice is the v3.5 spike's commitment and is what the v4.3
  determinism property test exercises.
- **`seed: u32` has no consumer in v3 today.** Confirmed
  deterministically: grep against `src/core/` for `Math.random`,
  `crypto`, `seedrandom`, `rng`, `seed` returns zero matches. The
  field is captured in `appliedFixes` for forward compatibility
  only; in v3.5 the algorithm always returns `replay.seed = 0`.
- **What the trace does NOT exercise** is documented in
  `algorithm.md` § 6: rotation/translation obstacle resolution on a
  real collision; multiple local pieces; region straddling multiple
  global pieces; post-splice overlap; multi-page splice. These gaps
  are the first deliverable of 0032 (promote-to-core) rather than a
  blocker for the verdict — the algorithm specifies the behavior for
  each, and only execution can validate it.

### What was NOT measured

- **Perf.** Out of scope per the prompt ("No perf measurement this
  session — perf cost model is the v3.5 second-half deliverable per
  v4 spec § 4"). Per-step cost is reasoned in `algorithm.md` but
  not measured.
- **The deer-scale demonstration.** The spike worktree has no
  `node_modules` (this is a doc-only spike), the prompt forbids
  silent `pnpm install`, and an attempt to install was correctly
  blocked by the harness. The strategist call: pivot to a
  hand-traceable minimal mesh that exercises every algorithm step
  with explicit geometry, and reserve the deer-scale demo for the
  promote-to-core session's first task. Documented in
  `algorithm.md` § 6.
- **The cost of `buildRegionAdjacency`.** New module; cost is
  O(boundary edges + internal edges) which is bounded by region
  face count × 3. Cheap; not measured.

### Determinism evidence

- Source-code grep against `src/core/` confirms zero `Math.random`,
  zero `crypto.random*`, zero `seed`/`rng` references. The v3
  pipeline is fully deterministic over its inputs without an
  explicit seed.
- `runCutRemoval`'s sort is `lengths[b] - lengths[a]` —
  deterministic given a stable Array.sort (V8 guarantees this since
  ES2019) and a deterministic key. Two runs with the same inputs
  produce byte-identical `cuts` and `pieces` arrays.
- The spike's `edgeOrderHash` definition adds an explicit canonical
  tie-break (`(faceA, faceB, edge[0], edge[1])`) on top of the
  length-descending sort, which removes any residual dependence on
  adjacency-list insertion order in `buildAdjacency`. This is the
  load-bearing detail for v4.3's determinism property test.

## v4 spec § 7 revisions needed (for session 0032 to apply)

These are the spec-document edits flagged in `algorithm.md` § 7 as
**[spec-edit]**. The spike does NOT apply them; 0032 applies them as
its first task before promote-to-core implementation begins.

1. **Spec § 7 pseudocode uses `buildSpanningTree + flatten + recut`,
   but v3 since ADR 0007 (Variant C, session 0024) uses greedy
   cut-removal as the default — `pipeline.ts` does not import
   `spanning-tree.ts` or `flatten.ts` at all.** The pseudocode should
   be rewritten to reflect greedy cut-removal control flow (start
   fragmented, merge what's safe), with the spike's anchor-first
   iteration described in `algorithm.md` § 2 Step 4.

2. **Spec § 4 says each `appliedFixes` entry pins (a) an RNG seed
   and (b) a hash of the edge-length ordering. The v3 pipeline
   consumes no RNG.** Spec text should either clarify that `seed` is
   reserved for future use (the spike's recommended path) or name a
   specific v3.5 randomness source (the spike does not introduce
   one). The spike's recommendation is reserved-for-future-use; this
   preserves the shape lock on `appliedFixes` without implying
   behavior that does not exist.

3. **Spec § 7's `layout.replaceRegion(region, globalLayout)` is one
   line and implies page-blind, atomic replacement.** The spike's
   Step 6 requires: (a) per-piece removal of region faces with
   split-as-needed for pieces straddling the region boundary, and
   (b) page-aware repagination that touches ONLY the affected pages.
   Spec § 7 should acknowledge both. The contract `algorithm.md` § 2
   Step 6 names ("non-region pieces on non-affected pages retain
   their exact `placed.transform` values") is the binding promise.

4. **Spec § 7 does not name the v3.5 scope boundary that boundary
   edges remain cuts post-re-unfold.** The user CANNOT re-unfold a
   region in a way that folds across its boundary into a pinned
   non-region face — that would require moving the pinned face's 2D
   position, which violates the pinned-outside contract. Spec § 7
   should acknowledge this; v4.3's fix-family menu (six fixes per
   spec § 7) implicitly already respects this — none of the six
   requires cross-region folding — but the constraint is
   load-bearing for the spike's correctness argument and should be
   stated.

None of the four blocks 0032 from proceeding. Each is a 1–3 line
edit to v4 spec § 7 plus one cross-reference to the new
ADR-or-design-doc that 0032 produces.

## Next step (concretely)

**Session 0032 — v3.5 promote-to-core + ADR for the region-aware
pipeline contract.** Scope:

1. **First task: v4 spec § 7 revisions per the four-item block
   above.** Strategist-applied edit; reviewed by sub-agent for
   factual coherence before commit. This unblocks the rest of the
   session.
2. **Promote `buildRegionAdjacency` to `src/core/adjacency.ts`** as
   a new export (or to a new file if discoverability is better).
   TDD: tests cover (a) region = full mesh equals current
   `buildAdjacency`, (b) region with a boundary returns
   `openBoundary` non-empty, (c) region with a disconnected face
   set rejects.
3. **Promote `reUnfoldRegion` to `src/core/region-reunfold.ts`** per
   the API sketch in `algorithm.md` § 5. TDD per the algorithm's
   step decomposition; each step gets its own unit test plus the
   composed function's integration test.
4. **The deer-scale worked example.** Run the algorithm on the
   largest piece of `deer.obj` (per `docs/baseline-pipeline.md`, 17
   pieces total; largest enumeration requires probe code which the
   session can write and commit since it's a numbered session, not
   a spike). Validate: obstacle resolution rotation/translation grid
   actually finds clear placements on a realistic configuration;
   multi-local-piece case; multi-page splice. **Report the actual
   outcomes — if rotation/translation grid is insufficient for
   deer-scale regions, the spike's grid parameters need tuning OR
   the fallback path becomes the v4.3 default.**
5. **The determinism property test.** "Applying fixes 0..N from
   scratch matches the cached layout at step N for all N up to the
   current append-point on a fixed corpus." This is the v4.3
   blocker per v4 spec § 4; landing it in 0032 means v4.1's
   undo/redo can ship without re-discovering the property.
6. **ADR for the region-aware pipeline contract.** Records: the
   `RegionReUnfoldResult` shape, the `edgeOrderHash` definition,
   the `seed`-reserved-for-future-use posture, the page-aware
   splice contract, and the boundary-edges-always-cuts scope
   boundary. The ADR is the canonical reference v4.3 implements
   against.

**If 0032 surfaces that the rotation/translation grid is
insufficient** for deer-scale obstacle resolution (Step 5 of the
algorithm), the spike's verdict on the algorithm itself flips to
NEEDS-REVISION on the rotation-grid parameters, NOT to INFEASIBLE.
The v3.5 fallback (manual region-pin + full-pipeline-re-run with
loading spinner) remains the v4.3 ship plan if obstacle resolution
provably cannot be made to work in the perf budget. The spike's
estimate is that for typical deer-piece sizes (~17 pieces of average
~42 faces each) the grid is sufficient; this is a prediction the
spike does not validate.

## Underspecifications in v4 spec § 7 — full enumeration

Cross-referenced with `algorithm.md` § 7's resolutions. All are
addressed in `algorithm.md`; the four marked **[spec-edit]** there
require v4 spec § 7 document changes (this section's "v4 spec § 7
revisions needed").

1. `pickRegistrationAnchor` — behavior with no fold-edge boundary.
   *Resolved internally:* tier-3 internal anchor with caller hint.
2. `pickRegistrationAnchor` — behavior with multiple candidates.
   *Resolved internally:* longest-3D + canonical pair-key tie-break.
3. `resolveObstacle` — what transformations it tries.
   *Resolved internally:* per-piece rotation about parent-edge
   midpoint + translation along parent-edge direction.
4. `resolveObstacle` — in what order, with what step size and
   termination criterion.
   *Resolved internally:* rotation first (12 × 15°), then translation
   (±8 × median-edge step), first-clear stops.
5. `layout.replaceRegion` — what happens to pre-existing pieces
   straddling the region.
   ***Resolved + [spec-edit]:*** per-piece face removal with
   split-as-needed.
6. `layout.replaceRegion` — how page assignment is preserved.
   ***Resolved + [spec-edit]:*** affected-pages-only repagination.
7. `edgeOrderHash` — which edges contribute.
   *Resolved internally:* region-only dual edges.
8. `edgeOrderHash` — how the hash is computed.
   *Resolved internally:* canonical serialization → sha256 → first
   128 bits hex.
9. FAIL handling — silent vs surfaced.
   *Resolved internally:* typed `RegionReUnfoldResult.FAIL` with
   reason enum + diagnostics; v4.3 PREDICT-SCORE rejects with
   SCORE = −∞.
10. `seed: u32` relationship to the actual pipeline RNG paths.
    ***Resolved + [spec-edit]:*** no RNG in v3 today; reserve for
    future use, clarify spec § 4 phrasing.
11. **Newly surfaced (not in the prompt's enumeration):** v4 spec
    § 7's pseudocode names `buildSpanningTree + flatten + recut` —
    the v3 default since ADR 0007 is greedy cut-removal.
    ***Resolved + [spec-edit]:*** spec pseudocode is stale; rewrite
    to reflect greedy cut-removal.
12. **Newly surfaced (not in the prompt's enumeration):** v3.5
    scope boundary that boundary edges always remain cuts
    post-re-unfold (re-unfold cannot fold across the region/pinned
    boundary).
    ***Resolved + [spec-edit]:*** acknowledge in spec § 7.
