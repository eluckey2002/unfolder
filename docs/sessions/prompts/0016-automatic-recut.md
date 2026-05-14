# Session 0016 — Automatic recut

## Goal

The consequential v2 algorithm session — where the net finally
becomes overlap-free. Sessions 0014 (dihedral-weighted tree) and
0015 (overlap detection) built up to this; the 0014 baseline
confirmed the architecture's standing assumption that the tree
alone does not produce overlap-free nets (croissant 388 overlapping
face pairs, deer 857). 0016 is the recut: cut the single net into
multiple pieces, each internally overlap-free.

Add `src/core/recut.ts` — `recut(tree, layout, overlaps): Piece[]`,
a pure function implementing **greedy set-cover recut** per ADR
0005. For each overlapping face pair there is a fold-edge path
between the two faces in the spanning tree; cutting one fold edge
on that path separates them. Greedily cover every overlap path with
a small set of cuts, split the fold forest into connected
components, and each component is a `Piece`.

The key simplification, and ADR 0005's load-bearing insight: **no
re-flattening.** Rigid unfolding is local — a face's position
relative to any other face in its component is fixed by the
fold-edge path between them, which lies entirely within the
component. So the original layout's positions, restricted to a
component, are already a valid overlap-free layout of that piece.
`recut` *selects* faces from the existing layout; it does not
recompute geometry.

Scope boundary: 0016 produces the multi-piece result as **data** and
measures it via the baseline harness. It does **not** render —
`emitSvg` and the app pipeline are untouched. Multi-piece rendering
is session 0017's concern (glue tabs inherently require per-piece
rendering). The dev-server demo shows a stale single layout until
then; acceptable, the demo is not load-bearing before v4's UI.

## How this prompt works

Established spec-based prompt (pattern from 0007/0012/0014/0015).
For the implementation the prompt describes behavior; you implement
against the actual `src/core/` exports.

This is an **ADR-bearing algorithm session** — Task 9 dispatches a
code-review subagent over the recut algorithm before the commit,
per the v1 retrospective's working method. This prompt is itself
the written plan CLAUDE.md section 5's plan-first rule calls for.

At the end you produce an implementation report (**Appendix B**).
If a concern warrants strategist input before locking it in, stop
short of committing and surface it.

## Pre-work consistency scan

Scan `docs/queue.md`. The one open item — `parseStl` negative-path
tests — does not intersect this session's scope.

This session depends on session 0015: `src/core/overlap.ts` must
exist on `main`, exporting `detectOverlaps` and the `FaceOverlap`
type. If it does not, 0015 has not landed — stop and report. This
prompt was drafted against 0015's spec (`FaceOverlap` is
`{ faceA: number; faceB: number }`, mesh face indices); if 0015
shipped those names differently, reconcile — it is a minor naming
fix, not a design change.

If `main` has advanced from parallel work, that is fine — note the
actual HEAD.

## Tasks

1. **Create the worktree and verify starting state.** Create a
   worktree for this numbered session; the SessionStart hook prints
   cwd, branch, and `git worktree list`. Confirm `main` is clean,
   note its HEAD, and confirm `src/core/overlap.ts` exists (the
   0015 dependency). Run `pnpm install` first.

2. **Copy this prompt file into the worktree** — copy the
   authoritative `docs/sessions/prompts/0016-automatic-recut.md`
   from the main checkout.

3. **Create `docs/decisions/0005-greedy-set-cover-recut.md`** with
   the content in **Appendix A**, copied verbatim.

4. **Implement `src/core/recut.ts`** per **Spec 1**.

5. **Update `scripts/baseline-pipeline.ts`** per **Spec 2** — the
   harness now runs recut and reports piece counts, and verifies
   every piece is internally overlap-free.

6. **Implement `test/unit/recut.test.ts`** per **Spec 3**.

7. **Verify the toolchain.** Run `pnpm type-check`, `pnpm test:run`,
   `pnpm build` — all must pass. Report the cumulative test total;
   count it, do not predict it.

8. **Re-run the baseline.** Run `pnpm baseline`; it regenerates
   `docs/baseline-pipeline.md` with the new piece-count columns.
   Capture the table. This is the v2 payoff metric — the first
   time the corpus produces a buildable (overlap-free) result.

9. **Code-review subagent.** Dispatch a code-review subagent (Task
   tool) over `src/core/recut.ts`. Give it that file, ADR 0005
   (Appendix A), and Spec 1. Ask it to check: tree-path / LCA
   correctness; the greedy set-cover (does it actually cover every
   path; does it pick a shared edge once rather than per-path);
   connected-components correctness; the one-shot-sufficiency claim
   (a face pair is in one piece iff their path has no cut iff they
   were not an overlap pair); and edge cases (empty `overlaps` → a
   single piece equal to the whole layout; a single-face tree). Fold
   its findings into the implementation report; address anything
   material before Task 11.

10. **Produce the implementation report** per **Appendix B**.

11. **Stop-if-concerns gate.** If a concern warrants strategist
    input before committing — a code-review finding you are unsure
    how to resolve, a piece that is not internally overlap-free in
    the baseline run (that would be a recut bug), an unexpected
    piece count — stop and report. Otherwise proceed.

12. **Update `docs/roadmap.md` and `docs/project-state.md`** for the
    status flip: in the roadmap's "v2 session plan", mark 0016 done
    (`✅`) and 0017 next (`⏭`), advance the "Where we are now"
    section. In `project-state.md`, add a Session 0016 entry to
    "Sessions completed", advance "Sessions planned", update the
    "Current phase" line. Match the surrounding style; do not
    reformat untouched text.

13. **Create the session log** at
    `docs/sessions/0016-automatic-recut.md` with the content in
    **Appendix C**, copied verbatim. Fill the piece-count results
    and the handoff-block placeholders.

14. **Wrap the session — run `/wrap-session`.** Commit message:

    ```
    feat: automatic recut — greedy set-cover (ADR 0005)
    ```

    Stage explicitly by name (no `git add -A`):
    - `src/core/recut.ts` (new)
    - `scripts/baseline-pipeline.ts` (modified)
    - `test/unit/recut.test.ts` (new)
    - `docs/decisions/0005-greedy-set-cover-recut.md` (new)
    - `docs/baseline-pipeline.md` (regenerated)
    - `docs/roadmap.md`, `docs/project-state.md` (modified)
    - `docs/sessions/0016-automatic-recut.md` (new)
    - `docs/sessions/prompts/0016-automatic-recut.md` (new)

    If `/wrap-session`'s rebase hits a doc conflict, stop and report.

15. **Report back:** the final `main` HEAD hash, the verification
    results, the regenerated baseline table with piece counts, and
    the implementation report from Task 10, in a fenced block.

## Notes

- ES module imports with `.js` extensions, consistent with `src/`.
- `recut.ts` is a pure `src/core/` stage — no three.js, no I/O, and
  it needs no `Mesh3D` (it works entirely on the tree, the layout,
  and the overlap list).
- Do not touch `emitSvg` or `src/app/main.ts` — see the scope
  boundary above. Multi-piece rendering is 0017's work.
- Do not start `pnpm dev`.

---

## Spec 1 — `src/core/recut.ts`

**Exports:** a `Piece` interface and
`recut(tree: SpanningTree, layout: Layout2D, overlaps: FaceOverlap[]): Piece[]`.

**Purpose:** split an overlapping unfolding into connected,
internally-overlap-free pieces, per ADR 0005.

**Imports:** `SpanningTree` from `./spanning-tree.js`; `Layout2D`
from `./flatten.js`; `Adjacency` from `./adjacency.js`;
`FaceOverlap` from `./overlap.js`.

**Data facts the implementation relies on:**

- `layout.faces` is face-index-aligned — `layout.faces[i]` is the
  `FlatFace` for mesh face `i` (the v1 `buildLayout` contract).
- `overlaps[k].faceA` / `.faceB` are mesh face indices.
- `tree.parent[]` is indexed by mesh face index; `parent[root] === -1`.
- `tree.folds` are `Adjacency` objects (`faceA`, `faceB`, `edge`).

**Behavior:**

- `Piece` is `{ layout: Layout2D; folds: Adjacency[] }` — a
  connected portion of the unfolding that is internally
  overlap-free, plus the fold edges internal to it.
- **Tree paths.** For each overlap pair `(a, b)`, find the fold-edge
  path between face `a` and face `b` in the spanning tree: walk up
  from `a` and from `b` via `parent[]` to their lowest common
  ancestor; the path is the fold edges along `a → LCA` and
  `b → LCA`. Identify each fold edge by its **child face** — the
  edge from face `f` to `parent[f]` — since every non-root face has
  exactly one parent edge. Each overlap pair thus yields a set of
  child-face indices.
- **Greedy set-cover.** Repeatedly pick the child-face index
  appearing in the most still-uncovered overlap paths, mark every
  path containing it covered, and repeat until all paths are
  covered. The picked child-face indices are the **recut cuts** —
  the fold edges `(f, parent[f])` to remove. (Empty `overlaps` →
  no paths → no cuts.)
- **Components.** Remove the recut-cut fold edges from `tree.folds`;
  the surviving folds form a forest. Find its connected components
  (union-find or BFS over the surviving folds). Each component — a
  set of mesh face indices — is one `Piece`.
- **Build each `Piece`.** `Piece.layout = { faces:
  componentFaceIndices.map((i) => layout.faces[i]) }` — *select*
  the component's faces from the original layout. Do **not**
  recompute positions; ADR 0005's locality argument is why this is
  correct. `Piece.folds` = the surviving fold `Adjacency` objects
  whose `faceA` and `faceB` are both in the component.
- Return the `Piece`s in a deterministic order (e.g. ascending by
  the smallest face index in each component).
- Pure function.

**Helpers** welcome — a `treePath`, a `greedySetCover`, a
`connectedComponents`; a `Map` from child face to its parent-fold
`Adjacency` is a natural building block. Mirror the existing
`src/core/` style.

**Edge cases:** empty `overlaps` must yield exactly one `Piece`
containing every face (the whole layout). A single-face tree (no
folds) yields one `Piece`.

---

## Spec 2 — `scripts/baseline-pipeline.ts` changes

After `detectOverlaps`, call `recut(tree, layout, overlaps)`.

Report, per model: the pre-recut overlap count (as before) **and**
the piece count (`pieces.length`).

**Correctness check:** run `detectOverlaps` on every piece's layout
— each must report zero internal overlaps. A piece with internal
overlaps is a recut bug; surface it loudly (a column that should be
all zeros, and a summary line that calls it out if any piece is not
clean).

The regenerated `docs/baseline-pipeline.md` columns become: model,
format, faces, pipeline, overlaps (pre-recut), pieces. The summary
line states the piece-count range and confirms every piece is
internally overlap-free — the v2 payoff: the corpus now produces a
buildable result.

Everything else about the harness — file enumeration, per-stage
`try/catch`, table formatting — stays as is.

---

## Spec 3 — `test/unit/recut.test.ts`

Validate `recut`:

- **No overlaps → one piece.** A hand-built `SpanningTree` +
  `Layout2D` with `overlaps = []` → `recut` returns exactly one
  `Piece` containing all faces.
- **One overlap → two pieces.** A hand-built tree + layout + a
  single `FaceOverlap` → `recut` cuts one fold edge on the path
  between the two faces → two pieces, with the two overlapping
  faces in different pieces.
- **Shared-edge cover.** A hand-built case where several overlap
  paths all pass through one common fold edge → the greedy cover
  picks that one edge, not one edge per path (so the piece count
  is small).
- **Every piece is internally overlap-free — end to end.** Run
  `ginger-bread.obj` through the real pipeline (`parseObj →
  buildAdjacency → computeDihedralWeights → buildSpanningTree →
  buildLayout → detectOverlaps → recut`), then `detectOverlaps` on
  each resulting piece → zero overlaps in every piece. This is the
  core correctness guarantee, verified through the actual stages.

Use hand-built `SpanningTree` / `Layout2D` / `FaceOverlap[]`
fixtures for the precise cases; `ginger-bread.obj` for the
integration case (small enough to be fast, but it genuinely
overlaps under the v2 tree). Mirror the existing `test/unit/` style.

---

## Appendix A — `docs/decisions/0005-greedy-set-cover-recut.md` (verbatim)

```markdown
# ADR 0005: Greedy set-cover recut

## Context

ADR 0004's dihedral-weighted MST decides which spanning tree gets
built, but the v2 baseline confirmed what the
architecture always assumed: the tree alone does not produce
overlap-free nets. On the concave corpus models the unfolded net
self-overlaps heavily — croissant 388 overlapping face pairs, deer
857. Session 0015 added overlap detection. Session 0016 is the
recut: the step that drives overlaps to zero by cutting the single
net into multiple non-overlapping pieces.

The decision is the recut strategy. `paperfoldmodels` and the
algorithm survey (`docs/references/unfolding-algorithm-survey.md`)
agree on the standard practical approach: for each overlapping face
pair there is a unique path between the two faces through the
spanning tree's fold edges, and cutting any one fold edge on that
path separates the pair. Choosing a small set of fold edges that
covers every overlap path is a set-cover problem.

## Decision

v2's recut is **greedy set-cover**, applied once.

- `src/core/recut.ts` exports `recut(tree, layout, overlaps):
  Piece[]` — a pure function. A `Piece` is
  `{ layout: Layout2D; folds: Adjacency[] }`: a connected portion
  of the unfolding that is internally overlap-free.
- For each overlap pair, compute the fold-edge path between the two
  faces via the spanning tree's `parent[]` pointers (walk to the
  lowest common ancestor).
- Greedy set-cover: repeatedly pick the fold edge lying on the most
  still-uncovered overlap paths, until every path is covered. Those
  fold edges become the recut cuts. Optimal set-cover — the
  minimum number of cuts, hence the fewest pieces — is NP-hard;
  greedy is the classic logarithmic-factor approximation, and it is
  what `paperfoldmodels` uses.
- Remove the recut cuts from the fold set; the surviving folds form
  a forest. Each connected component is one `Piece`.
- **No re-flattening.** Rigid unfolding is local: a face's position
  relative to any other face in its component is fixed by the
  fold-edge path between them, and that path lies entirely within
  the component. So the original layout's face positions,
  restricted to a component, are already a valid layout of that
  component — `recut` *selects* each piece's faces from the
  original `layout`, it does not recompute positions.
- **One pass is sufficient — no iteration.** A face pair ends up in
  the same component if and only if their fold-edge path has no
  recut cut on it, which (by the set-cover) is exactly when they
  were not an overlap pair. So every component is internally
  overlap-free after a single pass. The "control loop" the roadmap
  describes resolves in one shot.

## Consequences

What becomes easier:

- `recut` is a pure function with no geometry recomputation — it is
  set-cover plus connected components, both textbook, plus a
  selection from the existing layout. It needs no `Mesh3D`.
- One-shot correctness is provable, not merely empirical — though
  the baseline harness verifies it across the whole corpus by
  re-running detection on every piece.
- The `Piece` type — a layout plus its internal fold edges — is
  what sessions 0017 (glue tabs) and 0018 (multi-page layout)
  consume.

What becomes harder / the costs:

- Greedy set-cover is not minimal: it can pick more cuts than
  necessary, producing more pieces than an optimal recut would.
  Accepted — naive before optimized; the survey's optimization
  approaches (Takahashi's genetic single-patch, tabu search) are
  v3 "quality output" work.
- The pieces are not packed. `recut` leaves each piece's faces in
  their original layout positions, so different pieces still
  overlap each other on the plane. Packing pieces onto pages is
  session 0018's job; 0016 produces the pieces as data.

What this does NOT do:

- It does not render. `emitSvg` and the app pipeline are untouched
  this session — multi-piece rendering is session 0017's concern,
  since glue tabs inherently require per-piece rendering. The
  dev-server demo shows a stale single layout until then;
  acceptable, the demo is not load-bearing before v4's real UI.

Follow-on ADRs likely:

- A possible future ADR if optimal-or-better recut — fewer pieces —
  proves worth it; that is the survey's v3 menu.
```

---

## Appendix B — Implementation report template

After Task 7's verification passes, produce a report in this exact
structure and include it in your final reply.

````markdown
## Implementation report — Session 0016

### Decisions made within the spec
- **recut.ts:** [the tree-path / LCA approach, the set-cover data
  structures, connected-components method, anything the spec did
  not pin down]
- **baseline-pipeline.ts:** [what the recut wiring touched, how the
  per-piece correctness check is surfaced]
- **recut.test.ts:** [the hand-built fixtures you authored]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### Recut results (the v2 payoff)
- [Per-model piece counts from the regenerated baseline. Pre-recut
  overlap count → piece count. Confirm every piece is internally
  overlap-free. The platonic solids and convex baselines should
  recut to a single piece; the concave models into several.]

### Code-review subagent findings
- [What the subagent flagged, and how each was resolved or why it
  was left. If nothing: "None."]

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

Create `docs/sessions/0016-automatic-recut.md` with this content,
verbatim. Fill the piece-count results and the handoff-block
placeholders; append to "Decisions made or deferred" only if you
made notable choices not already covered.

````markdown
# Session 0016 — Automatic recut

## What was attempted

The consequential v2 algorithm session: cut the overlapping net
into multiple internally-overlap-free pieces, per ADR 0005. Add
`src/core/recut.ts` — greedy set-cover over the overlap paths,
splitting the fold forest into connected components. The key
simplification: no re-flattening — rigid unfolding is local, so the
original layout's positions restricted to a component are already a
valid overlap-free layout of that piece.

## What shipped

- `docs/decisions/0005-greedy-set-cover-recut.md` — ADR 0005,
  committing greedy set-cover recut and the one-shot-sufficiency
  argument.
- `src/core/recut.ts` — `recut(tree, layout, overlaps)`, a pure
  function. For each overlap pair it finds the fold-edge tree path,
  greedily covers all paths with a small set of cuts, splits the
  surviving folds into connected components, and selects each
  component's faces from the original layout into a `Piece`. Needs
  no `Mesh3D`.
- `scripts/baseline-pipeline.ts` — now runs recut, reports per-model
  piece counts alongside the pre-recut overlap count, and verifies
  every piece is internally overlap-free.
- `test/unit/recut.test.ts` — hand-built no-overlap, single-overlap,
  and shared-edge-cover cases, plus `ginger-bread.obj` end to end:
  every resulting piece is internally overlap-free.

## Recut results

The first buildable v2 output. Per-model, pre-recut overlap count →
piece count: [fill in from the regenerated baseline — platonic
solids and convex baselines recut to 1 piece; concave models into
several; every piece internally overlap-free].

## What's next

Session 0017 — Glue tabs with edge labels. The first consumer of
`Piece[]` for rendering: tab geometry on the cut edges between
pieces, and matching edge labels so a builder knows which cut edge
mates to which. This is where `emitSvg` and the app pipeline get
their multi-piece rendering.

## Decisions made or deferred

- **Greedy set-cover, applied once** — ADR 0005. Optimal set-cover
  is NP-hard; greedy is the standard log-factor approximation.
  One pass is provably sufficient.
- **No re-flattening** — rigid unfolding is local, so `recut`
  selects faces from the existing layout rather than recomputing
  positions. ADR 0005.
- **Pieces are not packed** — they keep their original layout
  positions and still overlap each other on the plane; packing is
  session 0018.
- **`emitSvg` and the app are untouched** — multi-piece rendering
  is deferred to 0017, which needs it for glue tabs anyway.

## Handoff

- **Branch / worktree:** `claude/<name>` at
  `.claude/worktrees/<name>/` — fill in.
- **Commits:** `<short-sha> feat: automatic recut — greedy set-cover (ADR 0005)`
  — fill in the SHA.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` <N>
  passing; `pnpm build` clean; `pnpm baseline` regenerated
  `docs/baseline-pipeline.md` with piece counts; every piece
  internally overlap-free.
- **Decisions made or deferred:** greedy set-cover, one pass —
  ADR 0005; no re-flattening (rigid unfolding is local); pieces
  not packed (0018); emitSvg/app untouched (0017).
- **Queue / roadmap deltas:** Roadmap — 0016 → ✅, 0017 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0016 added to Sessions
  completed; Sessions planned advanced. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** [Anything needing
  Cowork-side follow-up — e.g. a surprising piece count worth
  discussing. Otherwise: none.]
````
