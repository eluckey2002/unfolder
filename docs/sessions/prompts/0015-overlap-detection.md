# Session 0015 — Overlap detection

## Goal

Add a proper overlap-detection stage to `src/core/`: a pure
predicate over the 2D layout that finds every pair of faces whose
unfolded triangles overlap. This is the canonical detector — it
replaces the naive hand-rolled triangle-overlap check that session
0013's baseline harness has been using, and it is what session
0016's automatic recut will consume.

Scope boundary: **detection only, no fixing.** This session finds
overlaps; it does not cut anything, does not re-layout, and is not
wired into the app pipeline. 0016's recut is the first real
consumer. The unfolding-algorithm survey
(`docs/references/unfolding-algorithm-survey.md`) confirms
detection is the easy, well-understood part of the architecture —
this session is mechanical library integration, not an algorithm
decision, and carries no ADR.

## How this prompt works

Established spec-based prompt (pattern from 0007/0012/0013/0014).
For the implementation the prompt describes behavior; you implement
against the actual library and `src/core/` exports. This prompt is
itself the written plan CLAUDE.md section 5's plan-first rule calls
for; no separate plan-mode step.

At the end you produce an implementation report (**Appendix A**).
If a concern warrants strategist input before locking it in, stop
short of committing and surface it.

## Pre-work consistency scan

Scan `docs/queue.md`. The one open item — `parseStl` negative-path
tests — does not intersect this session's scope.

This session depends on session 0014 (committed at `68bda07`). If
`main` has advanced from parallel work, that is fine — note the
actual HEAD.

This session also commits one strategist-authored file:
`docs/references/unfolding-algorithm-survey.md`, the algorithm
landscape survey. It is present in the main checkout (untracked);
Task 3 copies it into the worktree, and it is staged with this
session rather than spending a separate maintenance commit on it.

## Tasks

1. **Create the worktree and verify starting state.** Create a
   worktree for this numbered session; the SessionStart hook prints
   cwd, branch, and `git worktree list`. Confirm `main` is clean and
   note its HEAD (near `68bda07`). Run `pnpm install` first.

2. **Copy this prompt file into the worktree** — copy the
   authoritative `docs/sessions/prompts/0015-overlap-detection.md`
   from the main checkout.

3. **Copy the survey doc into the worktree** — copy
   `docs/references/unfolding-algorithm-survey.md` from the main
   checkout (it is present there, untracked; do not reconstruct
   it). It commits with this session.

4. **Add the `polygon-clipping` dependency:** `pnpm add
   polygon-clipping`. It is a runtime dependency (used in
   `src/core/`), not a dev dependency. It ships its own TypeScript
   declarations — no `@types/polygon-clipping` is needed.

5. **Implement `src/core/overlap.ts`** per **Spec 1**.

6. **Update `scripts/baseline-pipeline.ts`** per **Spec 2** — the
   harness now uses the canonical `detectOverlaps` stage instead of
   its hand-rolled triangle-overlap check.

7. **Implement `test/unit/overlap.test.ts`** per **Spec 3**.

8. **Verify the toolchain.** Run `pnpm type-check`, `pnpm test:run`,
   `pnpm build` — all must pass. Report the cumulative test total;
   count it, do not predict it.

9. **Re-run the baseline.** Run `pnpm baseline`; it regenerates
   `docs/baseline-pipeline.md`. The per-model overlap counts may
   shift slightly from 0014's numbers — that is the canonical
   `polygon-clipping` detector replacing the harness's hand-rolled
   check, a **measurement-accuracy change, not an algorithm
   change** (the spanning tree is untouched this session). Capture
   the new table and note any shifts.

10. **Produce the implementation report** per **Appendix A**.

11. **Stop-if-concerns gate.** If a concern warrants strategist
    input before committing — an unexpected baseline shift, a
    correctness question about the predicate — stop and report.
    Otherwise proceed.

12. **Update `docs/roadmap.md` and `docs/project-state.md`** for the
    status flip. Read the current files and apply: in the roadmap's
    "v2 session plan", mark 0015 done (`✅`) and 0016 next (`⏭`), and
    advance the "Where we are now" section. In `project-state.md`,
    add a Session 0015 entry to "Sessions completed", advance
    "Sessions planned", update the "Current phase" line. Match the
    surrounding style; do not reformat untouched text.

13. **Create the session log** at
    `docs/sessions/0015-overlap-detection.md` with the content in
    **Appendix B**, copied verbatim. Fill the baseline numbers and
    the handoff-block placeholders.

14. **Wrap the session — run `/wrap-session`.** Commit message:

    ```
    feat: overlap detection stage (polygon-clipping)
    ```

    Stage explicitly by name (no `git add -A`):
    - `src/core/overlap.ts` (new)
    - `scripts/baseline-pipeline.ts` (modified)
    - `test/unit/overlap.test.ts` (new)
    - `package.json`, `pnpm-lock.yaml` (modified — dependency added)
    - `docs/baseline-pipeline.md` (regenerated)
    - `docs/references/unfolding-algorithm-survey.md` (new —
      strategist-authored, see Task 3)
    - `docs/roadmap.md`, `docs/project-state.md` (modified)
    - `docs/sessions/0015-overlap-detection.md` (new)
    - `docs/sessions/prompts/0015-overlap-detection.md` (new)

    If `/wrap-session`'s rebase hits a doc conflict, stop and report.

15. **Report back:** the final `main` HEAD hash, the verification
    results, the regenerated baseline table, and the implementation
    report from Task 10, in a fenced block.

## Notes

- ES module imports with `.js` extensions for local files,
  consistent with `src/`. Import `polygon-clipping` by its bare
  package specifier.
- `overlap.ts` is a pure `src/core/` stage — no three.js, no I/O.
- Do not wire `detectOverlaps` into `src/app/main.ts`. Nothing in
  the app pipeline consumes overlaps yet; 0016's recut is the first
  consumer. The baseline harness is a *measurement* consumer, which
  is consistent with this session's "detection only" scope.
- Do not start `pnpm dev`.

---

## Spec 1 — `src/core/overlap.ts`

**Exports:** a `FaceOverlap` interface and
`detectOverlaps(layout: Layout2D): FaceOverlap[]`.

**Purpose:** find every pair of faces whose 2D triangles overlap in
the unfolded layout. A pure geometric predicate — no spanning-tree
input is needed (see the note below on why).

**Imports:** `Layout2D` (and `Vec2` if useful) from `./flatten.js`;
`polygon-clipping` by its package specifier.

**Library facts — verified by probe during prompt prep
(`polygon-clipping` v0.15.7):**

- Default export: `import polygonClipping from "polygon-clipping"`.
  Ships its own `.d.ts`.
- Operations: `intersection`, `union`, `difference`, `xor`. Use
  `intersection`.
- Geometry format: a *geometry* is an array of polygons; a polygon
  is an array of rings; a ring is an array of `[x, y]` pairs. A
  single triangle is therefore `[[[x,y],[x,y],[x,y]]]` — one
  polygon, one ring, three points.
- `intersection(triA, triB)` returns a MultiPolygon: an **empty
  array** when the triangles do not share positive area, and a
  non-empty array when they genuinely overlap. Confirmed by probe:
  two overlapping triangles → non-empty; two disjoint → `[]`; two
  triangles sharing an exact edge → `[]`.
- It is winding-agnostic — triangles given clockwise or
  counter-clockwise produce the same result.

**Behavior:**

- `FaceOverlap` is `{ faceA: number; faceB: number }` with
  `faceA < faceB` (canonical ordering, mirroring `Adjacency`).
- For every unordered pair of faces `(i, j)` in `layout.faces`:
  build each face's triangle in `polygon-clipping`'s geometry
  format from its `positions`, call `intersection`, and if the
  result is **non-empty**, record `{ faceA: i, faceB: j }`.
- Return the array of overlapping pairs, in a deterministic order
  (ascending by `faceA` then `faceB`).
- O(F²) all-pairs. That is fine for the v2 corpus — the survey
  notes a spatial index is the known scaling path, but it is a
  deferred refinement, not this session's work. A brief code
  comment should say so.

**Why no spanning-tree input:** two faces joined by a fold edge are
placed by the flatten stage sharing that edge *exactly* — the two
shared-edge vertices carry identical `Vec2` coordinates. Their
triangles therefore share only a boundary segment, zero interior
area, and `polygon-clipping.intersection` returns `[]` for them.
The "non-empty intersection" predicate excludes correctly-placed
fold-adjacent faces on its own; no fold-edge bookkeeping is needed.

**Style:** small helpers welcome (a `faceToGeom`); mirror the
existing `src/core/` style.

---

## Spec 2 — `scripts/baseline-pipeline.ts` changes

The harness currently counts overlapping face pairs with a
hand-rolled triangle-intersection check (Sutherland–Hodgman, from
session 0013). Replace that check with a call to `detectOverlaps`
from `src/core/overlap.ts`: the harness's "overlapping face pairs"
column now reports `detectOverlaps(layout).length`.

Remove the now-unused hand-rolled clipping code. Everything else
about the harness — file enumeration, per-stage `try/catch`, the
table and summary output — stays as is.

The point: the baseline numbers now come from the same canonical
detector the rest of the codebase uses, not a throwaway check.

---

## Spec 3 — `test/unit/overlap.test.ts`

Validate `detectOverlaps`:

- **Overlapping pair** — a hand-built `Layout2D` with two faces
  whose 2D triangles clearly overlap (share positive interior
  area) → the pair is detected.
- **Disjoint pair** — a hand-built `Layout2D` with two faces whose
  triangles are far apart → no overlap detected.
- **Edge-touching pair** — a hand-built `Layout2D` with two faces
  sharing an exact edge but no interior overlap (the geometry a
  fold-adjacent pair produces) → **not** detected. This is the key
  correctness case: correctly-placed neighbours must not
  false-positive.
- **Platonic solids through the real pipeline** — run
  `tetrahedron.stl` / `cube.stl` / `octahedron.stl` through
  `parseStl → buildAdjacency → computeDihedralWeights →
  buildSpanningTree → buildLayout`, then `detectOverlaps` → zero
  overlaps each. This self-validates the detector against meshes
  known to unfold cleanly.

Use hand-built `Layout2D` fixtures for the first three cases —
construct the `FlatFace` objects directly with chosen `positions`.
Keep the unit tests fast; the full-corpus measurement is what
`pnpm baseline` is for. Mirror the setup style of the existing
`test/unit/` files.

---

## Appendix A — Implementation report template

After Task 8's verification passes, produce a report in this exact
structure and include it in your final reply.

````markdown
## Implementation report — Session 0015

### Decisions made within the spec
- **overlap.ts:** [the geometry-conversion helper, how you
  structured the pair loop, anything the spec did not pin down]
- **baseline-pipeline.ts:** [what the swap touched, what
  hand-rolled code was removed]
- **overlap.test.ts:** [the hand-built Layout2D fixtures you
  authored]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### Baseline shift (0014 → 0015)
- [Per-model overlap counts under the canonical detector vs.
  0014's hand-rolled numbers. Any model whose count changed, and
  by how much. This is a measurement-method change — note it as
  such, not as an algorithm result.]

### polygon-clipping integration notes
- [Anything about the library that surprised you — type wiring,
  edge cases, floating-point slivers, performance on the deer.]

### Concerns / second-look candidates
- [Subtle corners worth a strategist eye. If nothing: "None."]

### Verification
- `pnpm type-check`: [result]
- `pnpm test:run`: [cumulative total]
- `pnpm build`: [result]
- `pnpm baseline`: [ran / docs/baseline-pipeline.md regenerated]
````

---

## Appendix B — Session log content

Create `docs/sessions/0015-overlap-detection.md` with this content,
verbatim. Fill the baseline numbers and the handoff-block
placeholders; append to "Decisions made or deferred" only if you
made notable choices not already covered.

````markdown
# Session 0015 — Overlap detection

## What was attempted

Add a canonical overlap-detection stage to `src/core/` — a pure
predicate over the 2D layout that finds every pair of faces whose
unfolded triangles overlap — and point the baseline harness at it,
replacing the hand-rolled check from session 0013. Detection only:
no cutting, no re-layout, not wired into the app pipeline. 0016's
recut is the first real consumer.

## What shipped

- `src/core/overlap.ts` — `detectOverlaps(layout)`, a pure stage
  built on `polygon-clipping`. For every face pair it tests
  triangle-triangle intersection; a non-empty intersection is an
  overlap. Needs no spanning-tree input — fold-adjacent faces share
  an exact edge and produce an empty intersection on their own.
  O(F²); a spatial index is the deferred scaling path.
- `polygon-clipping` added as a runtime dependency.
- `scripts/baseline-pipeline.ts` — now counts overlaps via the
  canonical `detectOverlaps` stage; the hand-rolled triangle check
  is removed.
- `test/unit/overlap.test.ts` — overlapping, disjoint, and
  edge-touching hand-built cases, plus the platonic solids through
  the real pipeline (zero overlaps each).
- `docs/references/unfolding-algorithm-survey.md` — the strategist's
  algorithm-landscape survey, committed alongside this session.

## Baseline shift

The canonical detector replaces the harness's hand-rolled check —
a measurement-method change, not an algorithm change (the spanning
tree is untouched this session). Per-model counts, 0014 → 0015:
[fill in — note which models shifted and by how much; the platonic
solids and convex baselines should stay at 0].

## What's next

Session 0016 — Automatic recut. The first consumer of
`detectOverlaps`: for each overlapping pair, find the path between
the two faces in the spanning tree and cut a fold edge on it,
splitting the net into multiple non-overlapping pieces. Likely
ADR 0005 on the recut strategy.

## Decisions made or deferred

- **Detection needs no spanning-tree input.** `polygon-clipping`
  returns an empty intersection for the exact-shared-edge geometry
  that fold-adjacent faces produce, so the "non-empty intersection"
  predicate excludes them without fold-edge bookkeeping.
- **O(F²) all-pairs.** Fine for the v2 corpus; a spatial index is
  the known scaling path, deferred.
- **`polygon-clipping` over a hand-rolled clip.** The committed
  stack decision (project-state); the library is robust on
  degenerate and collinear cases a hand-rolled clip gets wrong, and
  it is the 2D-geometry foundation later v2 sessions build on.

## Handoff

- **Branch / worktree:** `claude/<name>` at
  `.claude/worktrees/<name>/` — fill in.
- **Commits:** `<short-sha> feat: overlap detection stage (polygon-clipping)`
  — fill in the SHA.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` <N>
  passing; `pnpm build` clean; `pnpm baseline` regenerated
  `docs/baseline-pipeline.md`.
- **Decisions made or deferred:** detection needs no tree input;
  O(F²) with a spatial index deferred; `polygon-clipping` over a
  hand-rolled clip. No ADR.
- **Queue / roadmap deltas:** Roadmap — 0015 → ✅, 0016 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0015 added to Sessions
  completed; Sessions planned advanced. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** [Anything needing
  Cowork-side follow-up — otherwise: none.]
````
