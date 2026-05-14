# Session 0014 — Dihedral-weighted spanning tree

## Goal

First v2 algorithm session. Replace v1's plain DFS spanning tree
(ADR 0003 deferred this to v2) with a **dihedral-weighted minimum
spanning tree**: weight every shared edge by how sharply the surface
folds there, then build an MST that prefers folding flat regions and
cutting sharp creases.

The 0013 baseline is the before-picture — plain DFS overlaps hard on
the concave corpus models (croissant 259 overlapping face pairs,
deer 795, meat-sausage 166; egg 2; cylinder 1; the platonic solids
and convex baselines clean). 0014 re-runs that baseline and records
what dihedral weighting changes.

Scope boundary: 0014 only changes *which tree gets built*. It does
**not** detect or remove overlaps — the net can still self-overlap.
Overlap detection is session 0015; automatic recut is 0016. Success
here is a measured change in the baseline overlap counts, not their
elimination.

ADR 0004 commits the weighting heuristic — the load-bearing decision.

## How this prompt works

Established spec-based prompt (pattern from 0007/0012/0013). For
implementation files the prompt describes behavior; you implement
against the actual `src/core/` exports. Verbatim appendices are
reserved for the ADR and document content.

This is an **ADR-bearing algorithm session** — Task 10 dispatches a
code-review subagent over the new geometry and MST code before the
commit, per the v1 retrospective's working method. This prompt is
itself the written plan CLAUDE.md section 5's plan-first rule calls
for; no separate plan-mode step.

At the end you produce an implementation report (**Appendix B**). If
a concern warrants strategist input before locking it in, stop short
of committing and surface it.

## Pre-work consistency scan

Scan `docs/queue.md`. The one open item — `parseStl` negative-path
tests — does not intersect this session's scope.

This session depends on session 0013: the v2 corpus, the
`scripts/baseline-pipeline.ts` harness, and `docs/baseline-v1-pipeline.md`
must all be present (committed at `798fef5`). Confirm they are. If
`main` has advanced from parallel work, that is fine — note the
actual HEAD.

## Tasks

1. **Create the worktree and verify starting state.** Create a
   worktree for this numbered session; the SessionStart hook prints
   cwd, branch, and `git worktree list`. Confirm `main` is clean and
   note its HEAD (near `798fef5`). Run `pnpm install` first.

2. **Copy this prompt file into the worktree** — copy the
   authoritative `docs/sessions/prompts/0014-dihedral-weighted-spanning-tree.md`
   from the main checkout; it commits with this session.

3. **Create `docs/decisions/0004-dihedral-weighting.md`** with the
   content in **Appendix A**, copied verbatim.

4. **Implement `src/core/dihedral.ts`** per **Spec 1**.

5. **Modify `src/core/spanning-tree.ts`** per **Spec 2** — the
   weighted MST replaces the DFS.

6. **Update every caller of `buildSpanningTree`** per **Spec 3**.

7. **Tests:** implement `test/unit/dihedral.test.ts` per **Spec 4**;
   update `test/unit/spanning-tree.test.ts` per **Spec 5**.

8. **Verify the toolchain.** Run `pnpm type-check`, `pnpm test:run`,
   `pnpm build` — all must pass. Report the cumulative test total;
   it grows by the new dihedral tests plus any added spanning-tree
   tests — do not predict the number, count it.

9. **Re-run the baseline.** Rename the baseline doc:
   `docs/baseline-v1-pipeline.md` → `docs/baseline-pipeline.md`
   (it is no longer v1-specific). In `scripts/baseline-pipeline.ts`,
   update the output path to `docs/baseline-pipeline.md` and the
   generated document title from "v1 pipeline baseline" to
   "Pipeline baseline". Run `pnpm baseline`. Capture the new table
   and the before/after comparison against the 0013 numbers.

10. **Code-review subagent.** Dispatch a code-review subagent (Task
    tool) over `src/core/dihedral.ts` and the modified
    `src/core/spanning-tree.ts`. Give it those files, ADR 0004
    (Appendix A), and Specs 1–2. Ask it to check: geometric
    correctness of the normal and dihedral computation; whether the
    consistent-winding assumption is handled as ADR 0004 documents;
    MST correctness (is it genuinely a minimum spanning tree; are
    folds/cuts classified correctly; is `parent[]` a valid rooted
    tree with `parent[root] === -1`); and edge cases (degenerate
    face throws, `weights`-length mismatch, single-face mesh,
    uniform-weight ties). Fold its findings into the implementation
    report; address anything material before Task 12.

11. **Produce the implementation report** per **Appendix B**.

12. **Stop-if-concerns gate.** If a concern warrants strategist
    input before committing — a code-review finding you are unsure
    how to resolve, an unexpected baseline result, a correctness
    question — stop and report. Otherwise proceed.

13. **Update `docs/roadmap.md` and `docs/project-state.md`** for the
    status flip. Read the current files and apply: in the roadmap's
    "v2 session plan", mark 0014 done (`✅`) and 0015 next (`⏭`), and
    advance the "Where we are now" section. In `project-state.md`,
    add a Session 0014 entry to "Sessions completed", advance
    "Sessions planned", update the "Current phase" line. Match the
    surrounding style; do not reformat untouched text.

14. **Create the session log** at
    `docs/sessions/0014-dihedral-weighted-spanning-tree.md` with the
    content in **Appendix C**, copied verbatim. Fill the handoff
    block's placeholders and the before/after baseline numbers.

15. **Wrap the session — run `/wrap-session`.** It confirms
    location, reuses this session's verification, checks the
    session log's handoff block, commits, rebases onto `main`,
    fast-forwards, and prompts for worktree cleanup. Commit message:

    ```
    feat: dihedral-weighted MST spanning tree (ADR 0004)
    ```

    Stage explicitly by name (no `git add -A`):
    - `src/core/dihedral.ts` (new)
    - `src/core/spanning-tree.ts` (modified)
    - `src/app/main.ts` and any other modified callers
    - `scripts/baseline-pipeline.ts` (modified)
    - `test/unit/dihedral.test.ts` (new)
    - `test/unit/spanning-tree.test.ts` (modified), and any other
      modified test files
    - `docs/decisions/0004-dihedral-weighting.md` (new)
    - `docs/baseline-pipeline.md` (renamed from
      `docs/baseline-v1-pipeline.md`, regenerated)
    - `docs/roadmap.md`, `docs/project-state.md` (modified)
    - `docs/sessions/0014-dihedral-weighted-spanning-tree.md` (new)
    - `docs/sessions/prompts/0014-dihedral-weighted-spanning-tree.md` (new)

    If `/wrap-session`'s rebase hits a doc conflict, stop and report.

16. **Report back:** the final `main` HEAD hash, the verification
    results, the before/after baseline comparison, and the
    implementation report from Task 11, in a fenced block.

## Notes

- ES module imports with `.js` extensions, consistent with `src/`.
- `dihedral.ts` is a pure `src/core/` stage — no three.js, no I/O.
- The baseline re-run is a **measurement**, not a target. Record
  whatever it shows — a large drop, a small one, or a mixed result
  — honestly. Dihedral weighting is a heuristic; 0015/0016 are what
  drive overlaps to zero.
- Do not start `pnpm dev`.

---

## Spec 1 — `src/core/dihedral.ts`

**Exports:** `computeDihedralWeights(mesh: Mesh3D, dual: DualGraph): number[]`

**Purpose:** produce one fold-weight per adjacency, parallel-indexed
to `dual.adjacencies`. Per ADR 0004.

**Imports:** `Mesh3D`, `Vec3` from `./mesh.js`; `DualGraph` from
`./adjacency.js`.

**Behavior:**

- A helper computes a face's outward unit normal from its three
  vertex positions: the normalized cross product of two edge vectors
  — for face `[v0, v1, v2]` with positions `p0, p1, p2`,
  `normalize(cross(p1 − p0, p2 − p0))`. Face winding determines the
  normal's direction; the v2 corpus is consistently wound, so all
  normals come out consistently oriented.
- If a face's normal has near-zero length — a degenerate, zero-area
  face — throw a clear `Error` naming the face index. Do not return
  a NaN weight. This matches the pipeline's fail-loudly style
  (`parseStl`, `buildAdjacency` both throw on bad input).
- For each adjacency in `dual.adjacencies`, in order: compute the
  outward unit normals `nA`, `nB` of `faceA` and `faceB`, then the
  weight `arccos(clamp(dot(nA, nB), −1, 1))` — the angle between the
  normals, in `[0, π]`. A flat (near-coplanar) edge weighs ≈ 0; a
  sharp crease weighs toward π.
- Return the array of weights, one per adjacency, same order as
  `dual.adjacencies`.
- Pure function. Small helpers (`faceNormal`, a `clamp`) are
  welcome; mirror the existing `src/core/` style.

---

## Spec 2 — `src/core/spanning-tree.ts` changes

**New signature:** `buildSpanningTree(dual: DualGraph, weights: number[], root: number = 0): SpanningTree`

The DFS implementation is **replaced** — do not keep a dead DFS
function. The `SpanningTree` interface (`{ root, parent, folds, cuts }`)
is **unchanged**.

**Behavior:**

- Validate `root` is in `[0, faceCount)` (keep the existing check),
  and that `weights.length === dual.adjacencies.length` — throw a
  clear `Error` otherwise.
- Build a **minimum spanning tree** over the dual graph: faces are
  nodes, `dual.adjacencies` are the candidate edges, edge weight is
  `weights[adjacencyIndex]`. Prim or Kruskal — implementer's choice;
  the corpus is small so neither's complexity matters. Record the
  choice and a one-line reason in the session log.
- The adjacencies selected into the MST are the **folds**; every
  other adjacency is a **cut**.
- Root the tree at `root`: traverse the fold edges from `root`
  (BFS or DFS over tree edges only) to derive `parent[]`.
  `parent[root] === −1`; every other face's parent is its
  discoverer along the tree.
- Return `{ root, parent, folds, cuts }` — the existing shape.
- Update the file's header comment: it currently cites ADR 0003 and
  "plain iterative DFS"; it should cite ADR 0004 and the
  dihedral-weighted MST.

**Note:** on a uniform-dihedral mesh (a platonic solid — all weights
equal), the MST is determined by tie-breaking; that is expected. The
weighting only differentiates when dihedral angles vary, which the
v2 corpus provides. The dual graph is connected for every corpus
model, so the MST spans all faces; a disconnected mesh would yield a
forest, which is out of scope (v1's DFS assumed connectivity too).

---

## Spec 3 — updating callers

`buildSpanningTree`'s signature changed, so every caller must now
compute weights first: `const weights = computeDihedralWeights(mesh, dual)`
then `buildSpanningTree(dual, weights, root?)`.

Grep `buildSpanningTree` across `src/`, `scripts/`, and `test/` and
update every call site. Known callers: `src/app/main.ts` (pipeline
wiring), `scripts/baseline-pipeline.ts` (the 0013 harness),
`test/unit/spanning-tree.test.ts`, `test/property/pipeline.test.ts`.

The property-test invariants in `test/property/pipeline.test.ts` are
**structural** — they hold for any valid spanning tree, and the MST
is one. Only the call signature changes there; do not change the
property assertions.

---

## Spec 4 — `test/unit/dihedral.test.ts`

Validate `computeDihedralWeights` (and the face-normal helper, if
exported):

- **Coplanar pair** — two coplanar triangles sharing an edge →
  weight ≈ 0 (within a small epsilon).
- **Known-angle fold** — two triangles meeting at a known dihedral
  (e.g. a right-angle fold) → weight ≈ that angle.
- **Cube corpus geometry** — load `cube.obj` (or `cube.stl`),
  build adjacency, compute weights → all twelve adjacency weights
  ≈ π/2 (a cube's faces meet at 90°). Exercises real corpus
  geometry through the actual pipeline stages.
- **Degenerate face** — a mesh with a zero-area face → throws.

Use inline known-geometry meshes for the precise-angle cases; the
corpus fixture for the cube case. Mirror the setup style of the
existing `test/unit/` files.

---

## Spec 5 — `test/unit/spanning-tree.test.ts` changes

- Update the existing tests for the new signature — compute (or
  construct) a `weights` array and call
  `buildSpanningTree(dual, weights, root?)`.
- The per-platonic-solid fold/cut counts **still hold** — a spanning
  tree has `F − 1` folds regardless of algorithm. Keep the
  tetrahedron 3/3, cube 11/7, octahedron 7/5 assertions.
- Keep the out-of-range `root` rejection test.
- Add a `weights`-length-mismatch rejection test.
- **Add a behavioral MST test:** a small hand-built dual graph with
  weights where a plain traversal and the minimum spanning tree
  would select different fold sets — assert `buildSpanningTree`
  selects the minimum-weight set. This is the core new behavior and
  must be tested directly, not just via fold/cut counts.

---

## Appendix A — `docs/decisions/0004-dihedral-weighting.md` (verbatim)

```markdown
# ADR 0004: Dihedral-weighted MST for the v2 spanning tree

## Context

ADR 0003 committed plain DFS for v1's spanning tree and explicitly
deferred "v2's spanning-tree algorithm and weighting heuristic" to a
follow-on ADR. Session 0014 is when that choice becomes acute: the
v2 corpus (session 0013) has real geometric variety — concave
low-poly models whose edges differ in length and dihedral angle —
and the v1 baseline shows plain DFS produces heavily overlapping
nets on them (croissant 259 overlapping face pairs, deer 795,
meat-sausage 166).

The spanning tree decides, for every shared edge, fold (tree edge)
or cut (non-tree edge). A weighted minimum spanning tree lets a
heuristic shape that choice. Two heuristics are on the table:

- **Edge length**, as `paperfoldmodels` uses — longer 3D edges
  preferred as folds, leaving shorter edges as the cuts that need
  glue tabs. Cleaner gluing, but indifferent to how sharply the
  surface bends.
- **Dihedral angle** — flat (near-coplanar) edges preferred as
  folds, sharp creases preferred as cuts. The `paperfoldmodels`
  writeup itself flags this as a variant worth trying ("prefer
  small-dihedral folds"). Folding along flat regions and cutting
  along sharp creases produces nets that follow the model's natural
  panels, and tends to reduce self-overlap, since sharp creases are
  where unfolded faces swing far and collide.

## Decision

v2's spanning tree is a **dihedral-weighted minimum spanning tree**.

- A new pure stage, `computeDihedralWeights(mesh, dualGraph) ->
  number[]`, produces one weight per adjacency. The weight is the
  angle between the two faces' outward unit normals,
  `arccos(clamp(dot(nA, nB), -1, 1))`, in `[0, π]`: a flat edge
  weighs ~0 (cheap to fold), a sharp crease weighs toward π
  (expensive — the MST prefers to cut it).
- `buildSpanningTree` becomes a minimum spanning tree over the dual
  graph using those weights (Prim or Kruskal — implementer's
  choice, recorded in the session log; the corpus is small enough
  that complexity does not matter). Tree edges are folds, non-tree
  adjacencies are cuts. The MST is then rooted at `root` and
  `parent[]` derived by traversing tree edges — so the
  `SpanningTree` output contract is unchanged, and the flatten and
  emit-svg stages downstream do not move.
- `buildSpanningTree`'s input signature changes to
  `buildSpanningTree(dual, weights, root?)`. ADR 0003 anticipated
  the signature staying stable; that does not survive contact with
  dihedral weighting, because the weight is geometric and the
  topological `DualGraph` carries no geometry. The output contract
  — the thing that actually protects the downstream stages — is
  what stays stable.
- The weight is the **unsigned** angle between normals: it does not
  distinguish convex (mountain) from concave (valley) creases. Both
  are "sharp" and both should be cut. Signed mountain-vs-valley
  weighting is a deferred refinement.
- A single MST — not multiple-trees-and-pick-best, a refinement the
  `paperfoldmodels` writeup raised. Naive before optimized.

## Consequences

What becomes easier:

- The weight function is one isolated, independently testable pure
  stage — refining or swapping the heuristic later touches one file.
- Nets follow the model's natural flat panels; on the v2 corpus
  this is expected to reduce — though not eliminate — self-overlap
  versus plain DFS. Session 0014's baseline re-run records the
  actual change.
- The `SpanningTree` output contract is unchanged; flatten and
  emit-svg are untouched.

What becomes harder / the costs:

- `computeDihedralWeights` assumes **consistent face winding** —
  the normal-dot heuristic is only meaningful if adjacent faces are
  wound consistently. The v2 corpus is verified consistently wound;
  a future mesh that is not would produce wrong weights. A
  winding-robust dihedral formula (via the in-plane edge-perpendicular
  vectors, independent of normal orientation) is the refinement path
  if that ever bites.
- It assumes non-degenerate faces — a zero-area face has no defined
  normal. `computeDihedralWeights` throws on one rather than
  producing a silent NaN.
- Every caller of `buildSpanningTree` updates for the new signature.

What this does NOT do:

- It does not detect or remove overlaps. Dihedral weighting only
  changes which tree gets built; the net can still self-overlap.
  Overlap detection is session 0015; automatic recut is 0016.
  Session 0014's success is measured as a change in the baseline
  overlap counts, not their elimination.

Follow-on ADRs likely:

- ADR for v2's recut strategy (session 0016).
- A possible future refinement ADR if signed mountain-vs-valley
  weighting, or multiple-trees-and-pick-best, proves worth it.
```

---

## Appendix B — Implementation report template

After Task 8's verification passes, produce a report in this exact
structure and include it in your final reply.

````markdown
## Implementation report — Session 0014

### Decisions made within the spec
- **dihedral.ts:** [helper structure, the normal computation,
  degenerate-face epsilon, anything the spec did not pin down]
- **spanning-tree.ts:** [Prim or Kruskal and why, the MST data
  structures, how you rooted the tree and derived parent[]]
- **callers / tests:** [what the caller updates touched, the
  hand-built MST test case you authored]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### Baseline change (0013 → 0014)
- [The before/after overlap counts per model. Which models
  improved, by how much; any that got worse or were unchanged.
  Honest reporting — this is a measurement.]

### Code-review subagent findings
- [What the subagent flagged, and how each was resolved or why it
  was left. If it found nothing: "None."]

### Concerns / second-look candidates
- [Subtle corners worth a strategist eye. If nothing: "None."]

### Verification
- `pnpm type-check`: [result]
- `pnpm test:run`: [cumulative total]
- `pnpm build`: [result]
- `pnpm baseline`: [ran / docs/baseline-pipeline.md regenerated]
````

---

## Appendix C — Session log content

Create `docs/sessions/0014-dihedral-weighted-spanning-tree.md` with
this content, verbatim. Fill the before/after baseline numbers and
the handoff-block placeholders; append to "Decisions made or
deferred" only if you made notable choices not already covered.

````markdown
# Session 0014 — Dihedral-weighted spanning tree

## What was attempted

Replace v1's plain DFS spanning tree with a dihedral-weighted
minimum spanning tree, per ADR 0004 — the first v2 algorithm
session. Weight every shared edge by the angle between its two
faces' normals (flat edges cheap, sharp creases expensive), build
an MST over those weights, and re-run the corpus baseline to
measure what changes versus plain DFS.

## What shipped

- `docs/decisions/0004-dihedral-weighting.md` — ADR 0004, committing
  the dihedral-weighted MST and the weighting heuristic.
- `src/core/dihedral.ts` — `computeDihedralWeights(mesh, dual)`, a
  pure stage producing one fold-weight per adjacency: the angle
  between adjacent faces' outward unit normals.
- `src/core/spanning-tree.ts` — `buildSpanningTree` is now a
  minimum spanning tree over the dihedral weights, replacing the
  plain DFS. The `SpanningTree` output contract is unchanged; the
  input signature gains a `weights` parameter.
- Updated callers (`src/app/main.ts`, `scripts/baseline-pipeline.ts`,
  the affected tests) for the new signature.
- `test/unit/dihedral.test.ts` and updated
  `test/unit/spanning-tree.test.ts`, including a behavioral test
  that the MST selects the minimum-weight fold set.
- `docs/baseline-pipeline.md` — the baseline doc, renamed from
  `baseline-v1-pipeline.md` and regenerated with the
  dihedral-weighted MST in place.

## Baseline change

Plain DFS (0013) → dihedral-weighted MST (0014), overlapping face
pairs per model: [fill in the before/after — e.g. croissant
259 → N, deer 795 → N, meat-sausage 166 → N, ginger-bread 60 → N,
egg 2 → N, cylinder 1 → N; platonic solids and convex baselines
expected to stay at 0].

## What's next

Session 0015 — Overlap detection. A proper `polygon-clipping`-based
overlap-detection stage in `src/core/`, replacing the baseline
harness's naive measurement check. The remaining overlaps this
session's baseline records are what 0015 detects and 0016 recuts.

## Decisions made or deferred

- **Dihedral weighting, not edge-length weighting** — ADR 0004. The
  reference (`paperfoldmodels`) weights by edge length; v2
  deliberately weights by dihedral fold angle.
- **MST algorithm:** [Prim or Kruskal — fill in, with the one-line
  reason].
- **Unsigned dihedral** — the weight does not distinguish
  mountain from valley creases. Signed weighting is a deferred
  refinement (ADR 0004).
- **`computeDihedralWeights` assumes consistent winding** —
  corpus-guaranteed; a winding-robust formula is the refinement
  path. Recorded in ADR 0004.

## Handoff

- **Branch / worktree:** `claude/<name>` at
  `.claude/worktrees/<name>/` — fill in.
- **Commits:** `<short-sha> feat: dihedral-weighted MST spanning tree (ADR 0004)`
  — fill in the SHA.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` <N>
  passing; `pnpm build` clean; `pnpm baseline` regenerated
  `docs/baseline-pipeline.md`.
- **Decisions made or deferred:** dihedral (not edge-length)
  weighting — ADR 0004; MST algorithm choice — session-log;
  unsigned dihedral and the consistent-winding assumption — both
  deferred refinements noted in ADR 0004.
- **Queue / roadmap deltas:** Roadmap — 0014 → ✅, 0015 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0014 added to Sessions
  completed; Sessions planned advanced. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** [Anything needing
  Cowork-side follow-up — e.g. a surprising baseline result worth
  discussing. Otherwise: none.]
````
