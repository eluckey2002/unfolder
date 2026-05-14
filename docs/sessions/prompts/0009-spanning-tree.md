# Session 0009 — Spanning tree

## Goal

Build the Spanning Tree stage of the v1 pipeline. Input is the
`DualGraph` from Session 0008; output is a `SpanningTree` that
classifies each adjacency as either *fold* (tree edge) or *cut*
(non-tree edge), plus a parent-pointer structure that downstream
stages (flatten) use to walk the tree in order.

This session commits **ADR 0003 — plain DFS spanning tree for v1,
weighted MST deferred to v2.**

## How this prompt works

Spec-based for the implementation; verbatim for type definitions,
ADR 0003 text, session log, and small markup edits. Ends with an
implementation report you paste back to the strategist. If
concerns warrant strategist input before commit, stop short of
Task 13 and report.

## Pre-work consistency scan

Scan `docs/queue.md` for items intersecting Session 0009. Current
queue has one open item (working-agreements consolidation) — does
not intersect. No items close in this session.

Scan adjacent docs (`docs/project-state.md`, `docs/roadmap.md`)
for stale content surfaced during implementation. The one known
stale item — `roadmap.md` section-intro line "Sessions 0001–0006
are committed to `main`; 0007–0011 are planned" — is fixed in
Task 9 of this prompt. If you find anything else, surface in the
implementation report.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at
   `b6c9247`. Working tree may have untracked files at `.claude/`
   and `docs/sessions/prompts/` — expected.

   Per the worktree-by-default rule for numbered sessions: work
   in a fresh worktree branch. Fast-forward `main` at the end.

2. **Create `docs/decisions/0003-spanning-tree-algorithm.md`**
   with the content in **Appendix A**, copied verbatim.

3. **Implement `src/core/spanning-tree.ts`** per **Spec 1** below.
   Type definitions inside that file are in **Appendix B**,
   verbatim.

4. **Implement `test/unit/spanning-tree.test.ts`** per **Spec 2**.

5. **Verify the toolchain.** From the worktree:

   ```
   pnpm install  # fresh worktrees may lack node_modules — see notes
   pnpm type-check
   pnpm test:run
   pnpm build
   ```

   All four should succeed. Tests should report 11 passing total
   (1 sanity + 4 parser + 3 adjacency + 3 spanning-tree). If any
   command fails, stop and report.

6. **Produce the implementation report** per **Appendix F**'s
   template.

7. **If any report concerns warrant strategist input before
   committing**, stop here. Otherwise proceed.

8. **Update `docs/roadmap.md`** with the edits in **Appendix C**.

9. **Update `docs/project-state.md`** with the edits in
   **Appendix D**. (Adding 0009 to "Sessions completed," removing
   from "Sessions planned," plus two new working-agreement
   bullets that came out of Session 0008's report.)

10. **Create the session log** at
    `docs/sessions/0009-spanning-tree.md` with the content in
    **Appendix E**, copied verbatim.

11. **Stage all changes and commit** with this message:

    ```
    feat: spanning tree (DFS) and ADR 0003
    ```

    Files to stage:
    - `docs/decisions/0003-spanning-tree-algorithm.md` (new)
    - `src/core/spanning-tree.ts` (new)
    - `test/unit/spanning-tree.test.ts` (new)
    - `docs/roadmap.md` (modified)
    - `docs/project-state.md` (modified)
    - `docs/sessions/0009-spanning-tree.md` (new)
    - `docs/sessions/prompts/0009-spanning-tree.md` (new — this
      prompt, per the prompt-cadence rule)

12. **Fast-forward `main`** from the worktree branch. If you see
    a collision with `docs/sessions/prompts/0009-spanning-tree.md`
    in the main checkout (a known pattern documented in the
    project's working agreements), the resolution is: verify
    byte-identical via `diff -q`, remove the main copy, then FF.

13. **Report back:** final `main` HEAD hash, all four
    verification commands' results, test count, **and the
    implementation report from Task 6** in a fenced markdown
    block.

## Notes

- ADR 0003 commits DFS, not MST. The architectural justification
  is in the ADR text itself; don't substitute Kruskal's or any
  weighted variant.
- DFS implementation: iterative (explicit stack), not recursive.
  Recursive is fine for the v1 corpus but iterative is robust to
  deeper meshes we might use later. Two passes: Phase 1 runs DFS
  populating `parent[]`; Phase 2 iterates `dual.adjacencies`
  classifying each as fold (connects a face to its parent) or
  cut.
- The root face is `0` by default (the function signature accepts
  a `root: number = 0` parameter). For v1 platonic solids any
  root produces an equally valid tree; fixing to 0 keeps tests
  deterministic.
- For non-root faces, `parent[i]` is the face that discovered `i`
  during DFS. For the root, `parent[root] === -1` as a sentinel.
- ES module imports with `.js` extensions; same pattern as
  Sessions 0007 and 0008.
- Do not start `pnpm dev` in this session.
- The roadmap.md Main HEAD line: set to `b6c9247` (pre-commit
  main HEAD). One-commit staleness after this commit lands is
  expected.

---

## Spec 1 — `src/core/spanning-tree.ts`

**Exports:** `buildSpanningTree(dual: DualGraph, root?: number): SpanningTree`
plus the `SpanningTree` type from **Appendix B**.

**Purpose:** convert a `DualGraph` (face adjacency) into a
`SpanningTree` that classifies each adjacency as fold or cut and
provides parent pointers for tree traversal. Pure function, no I/O.

**Behavior:**

- **Validate `root`.** Default `0`. If `root < 0` or `root >=
  dual.byFace.length`, throw an `Error` whose message names the
  invalid root and the valid range.
- **Phase 1 — DFS to populate `parent[]`.** Iterative DFS with an
  explicit stack. Initialize a `visited: boolean[]` of length
  `dual.byFace.length`, a `parent: number[]` of the same length
  filled with `-1`. Mark `visited[root] = true`. Push `root` onto
  the stack. While stack is non-empty: pop a face, iterate the
  adjacency indices in `dual.byFace[face]`; for each adjacency,
  identify the neighbor (the face in the `Adjacency` other than
  `face`). If the neighbor is unvisited, mark it visited, set
  `parent[neighbor] = face`, and push neighbor onto the stack.
- **Phase 2 — Classify adjacencies.** Iterate `dual.adjacencies`.
  For each `adj`, the adjacency is a *fold* iff
  `parent[adj.faceA] === adj.faceB` or
  `parent[adj.faceB] === adj.faceA`. Otherwise it's a *cut*.
  Push the adjacency reference (not a copy) into either `folds`
  or `cuts`.
- **Return** `{ root, parent, folds, cuts }`.

**Imports:** `Adjacency` and `DualGraph` types from
`./adjacency.js`. The new `SpanningTree` type is defined in this
file (Appendix B content).

---

## Spec 2 — `test/unit/spanning-tree.test.ts`

**Purpose:** validate `buildSpanningTree` against the v1 corpus.

**Imports:** `parseStl` from `../../src/core/parse-stl.js`,
`buildAdjacency` from `../../src/core/adjacency.js`,
`buildSpanningTree` from `../../src/core/spanning-tree.js`,
`describe`, `it`, `expect` from `vitest`, `readFileSync` from
`node:fs`, `dirname`, `join` from `node:path`, `fileURLToPath`
from `node:url`.

**Setup:** same pattern as the prior test files. A `treeFromCorpus(name)`
helper that parses STL, builds adjacency, builds spanning tree,
and returns the `SpanningTree`.

**Tests** (single `describe("buildSpanningTree — platonic
solids")`):

- `tetrahedron: 3 folds, 3 cuts; tree spans all faces` —
  parses `tetrahedron.stl`, builds tree, asserts
  `folds.length === 3`, `cuts.length === 3`,
  `folds.length === 4 - 1`, `parent[0] === -1`, and every
  non-root face has a valid parent (parent value is `0..3` for
  tetra).
- `cube: 11 folds, 7 cuts` — asserts 11 / 7, totals equal
  18, root marker invariant.
- `octahedron: 7 folds, 5 cuts` — asserts 7 / 5, totals equal
  12, root marker invariant.
- `rejects invalid root` — calling `buildSpanningTree(dual, -1)`
  throws; calling `buildSpanningTree(dual, 999)` throws.

---

## Appendix A — `docs/decisions/0003-spanning-tree-algorithm.md` (verbatim)

```markdown
# ADR 0003: Plain DFS spanning tree for v1, weighted MST deferred to v2

## Context

ADR 0001 deferred the spanning-tree algorithm choice to "Session 8
era." Session 0009 is when the choice becomes acute. The Spanning
Tree stage converts the `DualGraph` (face adjacency, from Session
0008) into a classification of each adjacency as either *fold*
(tree edge) or *cut* (non-tree edge), plus a parent-pointer tree
structure that downstream stages use to walk faces in order.

`paperfoldmodels`, our reference, uses Kruskal's MST with edge
weights derived from 3D edge length (longer edges preferred as
folds, leaving shorter edges as cuts and thus less glue tape).
v2 of unfolder plans dihedral-weighted MST as part of the "real"
unfolder. v1's test corpus, however, is platonic solids — all
edges equal length, all dihedral angles equal.

For platonic solids, every valid spanning tree produces an equally
valid unfolding. DFS, length-weighted MST, and dihedral-weighted
MST are equivalent for our v1 inputs. The algorithm choice is
purely about how much v2-readiness to bake in now.

## Decision

v1 uses **plain iterative DFS** rooted at face index 0. No edge
weights, no MST.

The function signature is `buildSpanningTree(dual: DualGraph,
root?: number): SpanningTree`. The `root` parameter exists for
test flexibility; v1's pipeline always passes (or defaults to) 0.

The `SpanningTree` output contract — root, parent pointers, folds,
cuts — does not depend on the algorithm that produced it. Sessions
0010 (flatten) and 0011 (SVG export) consume the contract; they
don't care how the tree was built.

When v2 arrives with low-poly meshes where edge lengths and
dihedral angles actually vary, the algorithm gets replaced — DFS
function body swapped for Kruskal's (or Prim's) with a weight
function. The function signature and `SpanningTree` shape stay the
same. The replacement is scoped to one file; the pipeline doesn't
move.

## Consequences

What becomes easier:

- Smallest possible v1 algorithm. ~25 lines of iterative DFS plus
  ~10 lines of adjacency classification.
- Deterministic output (fixed root, fixed traversal order means
  the same tree every time). Easier to test, debug, and reason
  about.
- No weight-function abstraction to design or maintain in v1.
- v1's test corpus passes with a known-correct tree shape because
  DFS on a symmetric polyhedron is straightforwardly enumerable.

What becomes harder:

- v2's algorithm replacement is real work — Kruskal's plus a
  union-find, plus a weight-function abstraction that v2's session
  has to design. Tradeoff accepted because the v2 work is scoped
  to one file and doesn't touch the pipeline contract.
- For asymmetric meshes (not v1), DFS may produce trees with
  long cut paths and aesthetically poor unfoldings. v2 fixes this.

Follow-on ADRs likely:

- ADR for v2's spanning-tree algorithm and weighting heuristic.
  Likely v2 era. May also pick between Kruskal's, Prim's, or
  multiple-trees-and-pick-best per the paperfoldmodels writeup's
  open suggestion.
```

---

## Appendix B — Type definitions inside `src/core/spanning-tree.ts` (verbatim)

These go at the top of the file, after the `Adjacency` and
`DualGraph` import:

```ts
import type { Adjacency, DualGraph } from "./adjacency.js";

/**
 * Spanning tree over the face adjacency graph. Folds are the tree
 * edges (faces "stay connected" along these when unfolded); cuts
 * are the non-tree edges (faces "separate" along these).
 */
export interface SpanningTree {
  /** Root face index. The traversal starts here; `parent[root] === -1`. */
  root: number;
  /**
   * Parent face for each face, by face index. For non-root faces,
   * `parent[i]` is the face that discovered `i` during DFS. For
   * the root, `parent[root] === -1`.
   */
  parent: number[];
  /** Adjacencies classified as fold (tree edges). */
  folds: Adjacency[];
  /** Adjacencies classified as cut (non-tree edges). */
  cuts: Adjacency[];
}
```

---

## Appendix C — `docs/roadmap.md` edits

Change in the v1-session-plan list:

- `**0009 — Spanning tree.** ⏭ DFS over the adjacency graph...`
  → `**0009 — Spanning tree.** ✅ DFS over the adjacency graph...`
- `**0010 — Flatten.** Walk the spanning tree...`
  → `**0010 — Flatten.** ⏭ Walk the spanning tree...`

Change the section-intro prose:

- `Sessions 0001–0011 complete v1. Sessions 0001–0006 are
  committed to \`main\`; 0007–0011 are planned.`
  → `Sessions 0001–0011 complete v1. Sessions 0001–0009 are
  committed to \`main\`; 0010–0011 are planned.`

In the "Where we are now" section:

- `**Last completed session:** 0008 (face adjacency graph).`
  → `**Last completed session:** 0009 (spanning tree).`
- `**Next planned session:** 0009 — Spanning tree.`
  → `**Next planned session:** 0010 — Flatten.`
- `**Main HEAD:** \`7fc7564\`.` → `**Main HEAD:** \`b6c9247\`.`

---

## Appendix D — `docs/project-state.md` edits

### D.1 — Add Session 0009 to "Sessions completed"

Append this bullet at the end of the "Sessions completed" section:

```markdown
- **Session 0009 — Spanning tree.** DFS spanning tree over the dual graph in `src/core/spanning-tree.ts`; ADR 0003 commits "plain DFS for v1, weighted MST deferred to v2." Log: `docs/sessions/0009-spanning-tree.md`.
```

### D.2 — Remove Session 0009 from "Sessions planned"

Remove this bullet from the "Sessions planned" section:

```
- **Session 0009** — Spanning tree (cut/fold edge classification).
```

Update the section's intro from "Sessions 0009 through 0011
complete v1." to "Sessions 0010 through 0011 complete v1."

### D.3 — Append two new working-agreement bullets

At the end of the "Working agreements" section (after the
"Prompts specify behavior, not code" bullet), append these two
bullets verbatim:

```markdown
- **Fresh worktrees may lack `node_modules`.** Numbered-session
  prompts include `pnpm install` as the first verification step
  before the type-check/test/build trio, since worktrees created
  fresh don't inherit the main checkout's installed dependencies.
- **Prompt files create a fast-forward collision pattern on
  worktree merge.** When fast-forwarding a worktree session whose
  commit includes the prompt file (per the prompt-cadence rule),
  expect a collision with the main checkout's untracked copy of
  the same prompt. Resolution: verify byte-identical via `diff -q`,
  remove the main copy, then FF.
```

---

## Appendix E — Session log content (verbatim)

````markdown
# Session 0009 — Spanning tree

## What was attempted

Build the Spanning Tree stage of the v1 pipeline per ADR 0001 —
taking the `DualGraph` from Session 0008 and producing a
`SpanningTree` that classifies each adjacency as fold or cut,
plus a parent-pointer structure for downstream stages to walk in
order. Also write ADR 0003 — the spanning-tree algorithm choice
deferred from ADR 0001 — committing to plain DFS for v1 with
weighted MST deferred to v2.

## What shipped

- `docs/decisions/0003-spanning-tree-algorithm.md` — ADR 0003.
- `src/core/spanning-tree.ts` — `SpanningTree` type and
  `buildSpanningTree(dual, root?)`. Iterative DFS from root,
  followed by two-pass adjacency classification (an adjacency
  is fold iff it connects a face to its parent in the tree).
  Pure function; rejects invalid root.
- `test/unit/spanning-tree.test.ts` — four tests: per-platonic-solid
  fold/cut counts (3/3, 11/7, 7/5) and tree-structure invariants,
  plus a rejection test for out-of-range root.

All four verification commands green. Test suite reports 11
passing tests (1 sanity + 4 parser + 3 adjacency + 3 spanning-tree).

## What's next

Session 0010 — Flatten. Walk the spanning tree from root, placing
each face on the 2D plane: vertex 0 at the origin, vertex 1 along
the positive x-axis, vertex 2 forced by the original edge lengths.
For each subsequent face, two of its three vertices are already
placed (the endpoints of the shared edge with its parent); the
third vertex is positioned opposite the parent face. Produces a
2D layout consumed by Session 0011 (SVG export).

## Decisions made or deferred

- **ADR 0003 committed:** plain DFS spanning tree for v1, weighted
  MST deferred to v2. Defers the weighting-heuristic decision to
  v2's session.
- **Iterative DFS, not recursive.** Robust for deeper meshes
  beyond v1's corpus; same complexity, no recursion-depth risk.
- **Two-pass classification.** Phase 1 populates `parent[]`;
  Phase 2 iterates adjacencies. Cleaner than classifying during
  traversal — no "already classified" guard needed.
- **Root face is 0 by default,** with an optional override for
  test flexibility. Determinism makes tests reliable.
- **`parent[root] === -1` as the sentinel.** Common convention,
  type-system-friendly via numeric comparison.

## Queue updates

No items closed. No items added.
````

---

## Appendix F — Implementation report template

After Task 5's verifications complete green, produce a report in
this structure and include it in your final reply.

````markdown
## Implementation report — Session 0009

### Decisions made within the spec
- **spanning-tree.ts:** [implementation choices the spec didn't
  dictate — helper names, stack data structure choice, neighbor
  lookup pattern]
- **spanning-tree.test.ts:** [test structure choices]
- **ADR 0003 filing:** [pre-merge edits if any; or "Filed verbatim."]

### Deviations from spec
- [Anything that diverged. If nothing: "None."]

### Library APIs / patterns verified
- [Any patterns confirmed against existing test files or library docs]

### Concerns / second-look candidates
- [Anything subtle worth a strategist eye. If nothing: "None."]

### Stale content discovered (adjacent files)
- [Any stale content in project-state.md, roadmap.md, queue.md,
  or other adjacent files. If nothing: "None."]

### Test output
- Total: N passed / N failed / N skipped
- New spanning-tree tests: N passed
````
