# `src/core/` Multi-Angle Review — 2026-05-16

**Scope.** All 12 files under `src/core/` (1,418 LOC), reviewed across
four angles: correctness & bugs, architecture & design, performance,
readability & maintainability.

**Methodology.** Read-only static review of each file in data-flow order
(`mesh → adjacency → dihedral → spanning-tree → flatten → overlap →
recut`, then `parse-stl/obj`, then `tabs → paginate → emit-svg`).
Cross-referenced against ADRs 0001–0005, the unit/property/integration
test suites, and the prior `codebase-assessment-2026-05-14.md` audit.
No source edits. `pnpm install && pnpm type-check && pnpm test:run`
green at HEAD (`96d9300`): 14 files, 97 tests passing, clean
type-check.

**Phase.** Post-v3-baseline (`d195b7c`), pre-feature-work. The pipeline
has stabilized — no `src/core/` file has changed in the last five
commits — making this a useful pre-refactor baseline.

---

## Executive Summary

The codebase remains in healthy shape — the strong foundations the
prior audit recorded still hold (pure-function discipline across all
12 modules, strict typing, acyclic DAG, every stage tested). Most P1
items from the May 14 audit have shipped fixes. **Zero P0 findings.**
Of 12 new findings, 1 is P1 and 11 are P2 — all are either deferred
optimizations the ADRs already own, or hygiene items.

**Top 5 findings to act on:**

1. **P1 — Implicit precision contract between Parse and Flatten**
   (`parse-stl.ts:25`, `parse-obj.ts:24`, `flatten.ts:25-26`). Parsers
   dedup vertices at `toFixed(6)` (~1e-6); `flatten.ts` runs predicates
   at `COINCIDENT_EPS = 1e-12` and `SIDE_EPS = 1e-9`. Distinct vertices
   within 1e-6 of each other silently merge during parse, and a face
   whose vertices were quantized can fail downstream geometric tests
   that assume sub-quantum precision. **Carry-forward from B4 (May
   14)** — still no symptoms on the corpus, still structural. Bumped
   to P1 because it now appears in two parsers and the inconsistency
   is a long-term trap for CAD-scale models (e.g. metres at sub-mm
   precision).
2. **P2 — Duplicate union-find implementations**
   (`spanning-tree.ts:44-77`, `recut.ts:178-208`). Two near-identical
   path-compression-by-rank UFs, one factored as `makeUnionFind` and
   one inlined inside `connectedComponents`. Single-source candidate.
3. **P2 — Triplicate `canonicalEdgeKey`/`canonicalPairKey`**
   (`adjacency.ts:39`, `flatten.ts:37`, `tabs.ts:30`). Three copies of
   the same `(a,b) => a < b ? \`${a},${b}\` : \`${b},${a}\`` helper,
   one renamed `canonicalPairKey` for face pairs vs. edges but
   identical in behaviour.
4. **P2 — `Layout2D.faces` index-alignment invariant documented in the
   wrong file** (`recut.ts:22-32` documents the convention; `flatten.ts:21`
   defines `Layout2D` with no mention of it). A reader landing on
   `flatten.ts` first wouldn't learn the invariant, and `tabs.ts:80-83`
   silently relies on the dense form when iterating
   `piece.layout.faces[k]` against `piece.faces[k]`.
5. **P2 — `paginate.ts` overflow protection is implicit**
   (`paginate.ts:122-128` vs. `paginate.ts:158-168`). The placement
   loop doesn't guard against a single piece wider than `printableW` —
   it relies on the global-min scale at lines 122-128 to make every
   piece fit. The two pieces are 50 lines apart with no comment tying
   them together; if anyone ever swaps the scale strategy for better
   page utilization, pieces will silently overflow the page.

**Resolved since May 14 audit** — no follow-up needed:

| May 14 | Resolution |
|---|---|
| A1 — disconnected dual graph silently mis-handled | `spanning-tree.ts:148-156` now throws on unreachable faces |
| A4 — overlap-free property test still `it.todo` | Real test at `test/property/pipeline.test.ts:255-268` |
| A5 — `dihedral.ts` has no property test | Two added at `test/unit/dihedral.test.ts:128-152` |
| A6 — `Piece` interface untested | Structure asserted across `test/unit/recut.test.ts:38-145` |
| A7 — no CI | `.github/workflows/ci.yml` present |
| B10 — ADR 0003 missing supersession marker | Marker present at `docs/decisions/0003-spanning-tree-algorithm.md:3` |

---

## 1. Findings by file

### 1.1 `mesh.ts` (19 LOC)

Type-only contract. Nothing to change.

### 1.2 `adjacency.ts` (89 LOC)

- **P2 — Cast at line 70 still present.** `key.split(",").map(Number) as [number, number]` — the May 14 audit flagged this (B1). Trivially eliminable by storing the pair in the map value rather than splitting the key, but the cost is a slightly heavier `Map<string, { faces: number[]; edge: [number, number] }>`. Stay or go is a taste call; flagging only because it's the one type-loosening site in this file.
- **Strength.** Closed-manifold guard at line 74 throws clearly on non-2-manifold edges and names which edge fails. Per the May 14 strategist note (§12, A3), the type system makes this the single chokepoint — no v2 stage can receive a `DualGraph` that didn't pass through here.

### 1.3 `dihedral.ts` (84 LOC)

- **No new findings.** Throws-on-degenerate at `dihedral.ts:53-56` is correct and traceable. Winding-consistency assumption is documented (lines 7-12) and owned by ADR 0004's "What becomes harder" — not a defect. Property tests at `test/unit/dihedral.test.ts:128-152` cover the `[0, π]` range and determinism.

### 1.4 `spanning-tree.ts` (159 LOC)

- **Strength — connectedness guard added** (lines 148-156). This closes May 14 A1. Error message is precise and names the unreachable count.
- **P2 — `makeUnionFind` is the canonical UF** (lines 44-77) and a duplicate lives in `recut.ts:183-208`. See §2.1.
- **Readability micro.** The two-pass build — Kruskal selects fold edges by sorted weight, then a separate BFS rooting walks fold neighbours to derive `parent[]` — is correct but reads as "did we just spend O(E + F) walking the same graph twice?" A doc-comment line at `spanning-tree.ts:120` ("rooting pass: BFS over fold edges; Kruskal's tree-vs-non-tree was already decided above") would help future readers.

### 1.5 `flatten.ts` (193 LOC)

- **P1 — Numeric precision mismatch with parsers.** See executive summary item 1. The constants themselves (`COINCIDENT_EPS = 1e-12`, `SIDE_EPS = 1e-9`) are defensible relative to each other; the problem is they assume sub-quantum vertex precision the parsers don't supply.
- **P2 — `Layout2D` definition (line 21) does not document the index-alignment invariant.** See executive summary item 4. A one-line reference to `recut.ts:22-32` would close the loop. Currently a reader of `flatten.ts` would not know that `Layout2D.faces[k]` is face-index-aligned (where the `k` in `recut`'s `Piece.layout` is dense and uses `Piece.faces[k]` to map back).
- **P2 — Vertex-position lookup by linear scan repeats** (lines 135-145 and 180-185). Both 3-element loops; trivial cost. A `findVertexPos(face, vertexId)` helper would dedup and be self-documenting.
- **Performance — `getThirdPoint` allocates a 2-element array of 2-tuples per call** (lines 82-85), once per non-root face. ~F allocations per pipeline run. Not a hotspot at v2 corpus sizes (worst case 720 faces); flagging because it's the only allocation in an otherwise tight inner loop and is easy to refactor to out-params if profiling ever flags it.

### 1.6 `overlap.ts` (61 LOC)

- **Performance — O(F²) all-pairs polygon intersection** (lines 46-60). Self-acknowledged in the doc comment at lines 41-44; deferred to "when face counts grow" per ADR 0001 §"Deferred to v2+". On the deer.obj corpus (720 faces) this is 259k `polygon-clipping.intersection` calls and is the dominant cost in the pipeline. P2 — known and owned.
- **Strength — the trick where shared-edge `Vec2` reuse from `flatten.ts` makes fold-adjacent faces produce zero-area intersections** (doc comment lines 7-10) is non-obvious and load-bearing. Worth preserving in any future refactor of the layout/overlap interface.

### 1.7 `recut.ts` (284 LOC) — the largest and most subtle file

- **P2 — Inlined union-find duplicates `spanning-tree.ts:44-77`** (lines 183-208). Same path-compression-by-rank, slightly different shape (no return-bool from `union`). Hoist candidate.
- **P2 — Non-null assertion at line 161** (`coverage.get(bestFace)!`). Carry-forward from May 14 B3. Still safe (`bestFace` was just iterated from `coverage` at lines 149-157), still a cosmetic eliminable by capturing the entry inside the iteration loop.
- **P2 — `Piece` index-alignment doc lives only here** (lines 22-32). Mirror it from `flatten.ts:21` (see §1.5). Currently the `Piece.faces[k] ↔ layout.faces[k]` invariant is documented exactly once, in the file that consumes the original layout — not the file that defines it.
- **P2 — `treePathChildren` (lines 93-122) walks LCA without computing it.** The trick is that each step contributes the deeper face's index as the path-edge identifier (a non-root face has exactly one parent edge, identifiable by the child face index). Subtle. The doc comment at lines 93-97 introduces this convention; a one-line annotation at line 104 (`// "child face index" identifies the edge to its parent`) would make the loop body's `result.add(x)` semantics legible without re-reading the comment.
- **P2 — Greedy tie-break uses `bestFace === -1` as a first-iteration sentinel** (line 152). Without it, ties skip the first candidate (the comparison `f < bestFace` against `-1` is false for every non-negative `f`). Correct, but worth a one-line "// `bestFace === -1` is the first-iteration init" so the next maintainer doesn't simplify it away.
- **P2 — Empty-path edge case is unreachable but undocumented.** If any `paths[i]` is empty (`treePathChildren(a, b)` returned `Set()`), the greedy loop at line 146 cannot cover it: only edges in path sets get `coverage` entries, so a path with no edges has nothing to pick. `remaining` would never decrement to zero; the loop relies on the `bestCount === 0` early exit at line 158 to escape. Currently unreachable because `detectOverlaps` does not report self-overlaps (`o.faceA === o.faceB`). The contract — "every overlap involves two distinct faces" — is true in practice but not stated in `FaceOverlap`'s doc (`overlap.ts:25-31`). A precondition note at the top of `recut.ts` would close this.
- **Strength.** No-re-flattening argument (lines 11-15) and the one-pass-suffices argument (ADR 0005 line 48-53) are both materially correct and the code matches them exactly. The doc comments are doing real work here — if this file ever needs to shrink, do not shrink the comments.

### 1.8 `parse-stl.ts` (62 LOC)

- **P1 — Vertex dedup at `toFixed(6)`** (line 25). See executive summary item 1. For meshes in millimetres at default precision, fine. For meshes in metres at sub-mm precision, two distinct vertices at `(0.000001, 0, 0)` and `(0.0000005, 0, 0)` round to the same key and collapse to whichever was encountered first (line 30 stores original coords, but only one survives). No test coverage for this case (`test/unit/parse-stl.test.ts:14-62` covers platonic solids only).
- **Strength.** Validation is precise: `solid` header check (line 16), non-finite coord rejection (line 44), mid-triangle EOF (line 55). All three throw with usable messages.

### 1.9 `parse-obj.ts` (93 LOC)

- **P1 — Same `toFixed(6)` dedup as `parse-stl.ts`** (line 24). Same root cause, same risk.
- **P2 — Negative-index handling deserves a test.** Line 42 implements OBJ's `-N` (relative) face refs as `ordinalToCanonical.length + i`. Looks correct: `i = -1` → `length - 1` (most-recent vertex). The spec is unambiguous but easy to off-by-one — and `test/unit/parse-obj.test.ts` (per May 14 audit count, 8 tests) does not exercise this branch directly. Worth adding a fixture.
- **Strength.** The `ordinalToCanonical` indirection (lines 21-22, 48) cleanly separates "OBJ's view of vertex order" from `Mesh3D`'s deduplicated indices. This is exactly the discipline `paperfoldmodels` lacked (per ADR 0001's context).

### 1.10 `tabs.ts` (117 LOC)

- **P2 — `apexIdx = 3 - i - j` (line 85)** relies on `{0,1,2}.sum() === 3`. Clever and zero-cost; a `// {0,1,2}.sum() === 3 → 3rd index = 3 - i - j` comment is the price of admission for the next reader.
- **P2 — Trapezoidal tab geometry has no self-intersection guard.** `buildTab` (lines 37-59) extrudes perpendicular to the edge by `TAB_HEIGHT_RATIO * L = 0.4 * L`. For a long-and-thin triangle (e.g. a slim spike), the tab's height (40% of its base edge) can exceed the triangle's other-edge lengths, and the trapezoid's `inset = 0.25 * L` corners can intrude on the apex side of an adjacent face if the dihedral is sharp. No corpus model has visibly tripped this; would surface first on irregular hand-modelled geometry.
- **P2 — Internal invariant trusted but not stated.** Line 96 throws if an edge is "neither a fold nor a known cut." This can only fire if `recut`'s contract is violated (every edge must be in `piece.folds` or `recut.cuts`). Defensive code is good; a one-line invariant note above the throw would explain why the check exists.

### 1.11 `paginate.ts` (182 LOC)

- **P2 — Implicit overflow protection.** See executive summary item 5. The `s = min(min(sx, sy)) over all pieces` choice at lines 122-128 guarantees the placement loop's `x + wScaled > printableW` branch (line 158) never fires for a single piece wider than the page. If anyone ever introduces a per-shelf or per-page scale variation, the placement loop will silently produce off-page geometry. A comment at line 158 ("`s` is chosen above to ensure each piece fits on its own page; if you change that, add a guard here") would close the loop.
- **P2 — Global-min scale strategy under-utilizes the page when piece sizes vary widely.** Acceptable for now (`paginate` is the simplest correct thing per ADR 0001's "naive before optimized") but worth flagging as a known suboptimality. Meaningful only when corpus models with one large piece and many small ones land.
- **Strength.** Zero-extent piece guard (lines 114-119) catches degenerate input precisely, names the offending piece index. PageSpec error at lines 106-110 likewise names the failing dimensions.

### 1.12 `emit-svg.ts` (75 LOC)

- **P2 — Magic numbers at lines 12-19** (`CUT_STROKE_MM`, `FOLD_STROKE_MM`, `TAB_STROKE_MM`, `FOLD_DASH_MM`, `FOLD_GAP_MM`, `LABEL_FONT_MM`). All in mm, all consistent with the page-units convention from `paginate`. Fine as constants today; they are the natural configuration surface when a "render preset" abstraction is needed (v3+).
- **P2 — Label-offset uses `outLen > 0` guard** (line 63). Currently unreachable (an edge of length zero would already have failed in `paginate.ts:114-118`'s zero-extent check), but defensive. Acceptable.
- **Strength.** Output is a single string concatenation with no DOM dependency (consistent with ADR 0001 — "no I/O, no rendering coupling in the pipeline"; emit is the pipeline's terminal stage).

---

## 2. Cross-cutting findings

### 2.1 Duplicate helpers — the consolidation candidates

Three duplications across the 12 files:

| Helper | Sites | Identical? |
|---|---|---|
| Path-compression-by-rank UF | `spanning-tree.ts:44-77`, `recut.ts:183-208` | yes (modulo `union` returning `void` vs. `bool`) |
| `canonicalEdgeKey` (vertex pair) | `adjacency.ts:39`, `tabs.ts:30` | yes |
| `canonicalPairKey` (face pair) | `flatten.ts:37` | identical shape, different name |

A `src/core/_internal/` (or similarly-marked) folder hosting
`union-find.ts` and `canonical-key.ts` would be the lightest-weight
fix. **Caveat:** the "no internal helpers folder" status quo is a
deliberate consequence of ADR 0001's pure-function-stage discipline —
if the helpers move, the new file is a non-stage utility that needs a
clear "this is shared infrastructure, not a pipeline stage" marker so
nobody mistakes it for a stage. A README or a leading doc comment is
sufficient.

### 2.2 The `Layout2D` index-alignment invariant has a documentation
gap

`Layout2D.faces[k]` is **face-index-aligned** when produced by
`buildLayout` (`flatten.ts:88-193`), but **dense** when produced as
`Piece.layout.faces[k]` by `recut` (`recut.ts:274-278`). The dense
form needs `Piece.faces[k]` for the mesh-face-index. This is
documented at `recut.ts:22-32` but **not at the type definition**
(`flatten.ts:21`). The downstream consumers (`tabs.ts:80-83`,
`overlap.ts:46-60`) interact with both forms via the same `Layout2D`
type and rely on the convention. A two-line cross-reference at
`flatten.ts:21` and a mirror at `recut.ts:33-37` (where `Piece` is
defined) would close the gap without altering any code.

### 2.3 Numeric precision contract — parse vs. flatten (carry-forward)

The May 14 audit's B4 ("parse 1e-6 vs flatten 1e-9") is unchanged. It
appears in two files (`parse-stl.ts:25`, `parse-obj.ts:24`) and
mismatches the geometric predicates in `flatten.ts:25-26`. Bumped from
P2 to P1 because the v2 corpus expansion (sourced models per ADR
0013) increases the chance of encountering a CAD model where the
quantization actually matters. A single shared `EPS` module exporting
the precision tier and the parse-quantization decimals — with the
matching invariant stated — would prevent this from drifting further.

### 2.4 ADR drift watch

| ADR | Decision | Status in code | Verdict |
|---|---|---|---|
| 0001 — pure-function pipeline | five-stage pure functions | holds | every `src/core/` module is pure |
| 0002 — adjacency as stage | `DualGraph` output | holds | `adjacency.ts:42-89` |
| 0003 — DFS for v1 | unweighted DFS | superseded (marker present) | replaced by Kruskal MST per ADR 0004 |
| 0004 — dihedral weighting | Kruskal MST by dihedral | holds | weights in `[0, π]` per `dihedral.test.ts:128-141` |
| 0005 — greedy set-cover recut | one-pass greedy | holds | `recut.ts:239-284`; one-pass argument verified |

No ADR is contradicted by current code. ADRs still lack
explicit Status/Date frontmatter (May 14 B11 — unchanged). Light
hygiene; not blocking.

### 2.5 Performance — known hotspots, none fix-now

| Site | Cost | Owned by |
|---|---|---|
| `overlap.ts:46-60` O(F²) intersection | dominant on deer.obj (720 faces, 259k pair tests) | doc comment + ADR 0001 deferral |
| `flatten.ts:54-86` `getThirdPoint` allocs | F allocations per run, trivial | not a hotspot |
| `recut.ts:129-176` greedy set-cover | NP-hard problem; greedy is the chosen approximation | ADR 0005 |
| `paginate.ts:130-178` shelf-pack | naive; no rotation/splitting | ADR 0001 "naive before optimized" |

Profile before optimizing any of these. None blocks v3 work.

---

## 3. What's already good

- **Pure-function discipline** holds across all 12 modules. Zero
  shared mutable state, zero module-level globals, zero I/O. ADR 0001
  is a live invariant, not a documented aspiration.
- **Doc comments explain "why", not "what."** `recut.ts`'s top-of-file
  comment (lines 1-15) and the no-re-flattening note (lines 11-15)
  are doing real work — they're the only place the one-pass-suffices
  argument is stated where a reader can find it. Same pattern in
  `overlap.ts:1-15` (the shared-edge-zero-area trick) and
  `dihedral.ts:1-12` (the winding-consistency assumption). Preserve.
- **Errors name the offending input.** `adjacency.ts:75-77` (which
  edge), `dihedral.ts:54-56` (which face index), `flatten.ts:125-127`
  (which face pair), `spanning-tree.ts:152-156` (how many unreachable
  faces), `paginate.ts:115-117` (which piece). Consistent practice
  across the codebase.
- **Test architecture matches the pipeline architecture.** Per-stage
  unit tests + property tests over generated meshes + corpus
  integration tests. The May 14 P1 list (`it.todo`, `Piece` untested,
  no dihedral property test) is fully closed.

---

## 4. Triaged action list

### P0 — Critical

None.

### P1 — Important

| # | Finding | Location |
|---|---|---|
| C1 | Parse/flatten precision contract mismatch (carry-forward of B4) | `parse-stl.ts:25`, `parse-obj.ts:24`, `flatten.ts:25-26` |

### P2 — Nice-to-have (recommended in priority order)

| # | Finding | Location |
|---|---|---|
| H1 | Hoist duplicate union-find | `spanning-tree.ts:44-77` ↔ `recut.ts:183-208` |
| H2 | Hoist `canonicalEdgeKey` / `canonicalPairKey` | `adjacency.ts:39`, `flatten.ts:37`, `tabs.ts:30` |
| D1 | Mirror `Layout2D` / `Piece` index-alignment doc to type defs | `flatten.ts:21`, `recut.ts:33-37` |
| D2 | Comment paginate's overflow-protection coupling | `paginate.ts:158` |
| D3 | Comment `recut.ts` greedy tie-break sentinel | `recut.ts:152` |
| D4 | Comment `tabs.ts` `apexIdx = 3 - i - j` arithmetic trick | `tabs.ts:85` |
| D5 | Document the no-self-overlap precondition `recut` relies on | `recut.ts` (new top-of-file note) or `overlap.ts:25-31` |
| T1 | Add `parse-obj.ts` negative-index test fixture | `test/unit/parse-obj.test.ts` |
| T2 | Add a parser-precision regression test (CAD-scale mesh) | `test/unit/parse-{stl,obj}.test.ts` |
| C2 | `recut.ts:161` non-null assertion (carry-forward of B3) | `recut.ts:161` |
| C3 | `adjacency.ts:70` cast (carry-forward of B1) | `adjacency.ts:70` |
| C4 | `polygon-clipping@0.15.7` sub-1.0 (carry-forward of B5) | `package.json` |
| C5 | ADRs lack Status/Date frontmatter (carry-forward of B11) | `docs/decisions/000{1..5}*.md` |

### Out of scope

- Reviewing `src/app/` (the three.js renderer) — separate review.
- Reviewing test code itself; tests are evidence here.
- Reviewing ADRs for soundness; taken as authoritative.
- Implementing any fixes — per ADR 0006, fixes happen in a follow-up
  session branch, not this audit doc.

---

## 5. Confidence & known gaps

**Confidence: high** for static findings (all have file:line evidence
the reader can verify). **Medium** for the precision-mismatch claim
(C1 / B4) — the structural argument is solid but no fuzzing run was
performed. **Not assessed:** `polygon-clipping`'s numeric robustness
on adversarial inputs; binary STL or OBJ parser edge cases beyond what
the corpus exercises; runtime profiling of `overlap.ts`'s O(F²) loop.

What this audit did not do: run `pnpm audit`; measure branch coverage;
fuzz the parsers; profile `recut.ts` or `polygon-clipping`; review
the v3 quality-baseline harness in `scripts/`; cross-check any of
this against the `paperfoldmodels` reference.
