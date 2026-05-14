# Session 0008 — Face adjacency graph

## Goal

Build the face adjacency graph stage of the v1 pipeline. Input is a
`Mesh3D` (from Session 0007's parser); output is a `DualGraph` — one
node per face, one edge per shared 3D edge between adjacent faces.
This is the Adjacency stage named in ADR 0001 and the input that
Sessions 0009 (spanning tree), 0010 (flatten), and 0011 (SVG) will
all consume.

This session also commits the first ADR since 0001: **ADR 0002 —
adjacency as a separate output, not a half-edge mesh.** ADR 0001
deferred this decision to "Session 7 era, when adjacency lookups
become acute"; Session 0008 is when they actually become acute, so
it's also the right session to write the ADR.

## How this prompt works

Spec-based for implementation (algorithm code lives in specs;
Claude Code writes the code using current TypeScript and library
API knowledge). Verbatim for type definitions, the ADR text,
session log, and small markup edits. End with an implementation
report (Appendix F template) that Evan pastes back to the
strategist for review.

If concerns surface that warrant strategist input before committing,
stop short of commit (Task 12) and report. Otherwise proceed.

## Pre-work consistency scan

Scan `docs/queue.md` for items intersecting this session. Current
state: one open item (`[convention]` working-agreements
consolidation) — does not intersect Session 0008. No items close in
this session.

If you find anything in `docs/project-state.md` that's stale
relative to actual project state — session counts, sessions
completed/planned, open questions — surface in the implementation
report. Do not fix unless it's inside this prompt's scope.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at
   `7fc7564`. Working tree may have untracked files at `.claude/`
   and `docs/sessions/prompts/` — expected.

   Per the worktree-by-default rule for numbered sessions: work
   in a fresh worktree branch. Fast-forward `main` at the end.

2. **Create `docs/decisions/0002-adjacency-as-separate-stage.md`**
   with the content in **Appendix A**, copied verbatim. ADRs are
   immutable once merged to `main`; pre-merge edits in your
   worktree are fine if you spot an issue, but flag any change in
   the implementation report.

3. **Implement `src/core/adjacency.ts`** per **Spec 1** below.
   Type definitions inside that file are in **Appendix B**,
   verbatim — they're contracts.

4. **Implement `test/unit/adjacency.test.ts`** per **Spec 2**.

5. **Verify the toolchain.** Run in order:

   ```
   pnpm type-check
   pnpm test:run
   pnpm build
   ```

   All three should succeed. Tests should report 8 passing total
   (1 sanity from 0005 + 4 parser from 0007 + 3 adjacency from
   this session, in 3 test files). If any command fails, stop
   and report.

6. **Produce the implementation report** per **Appendix F**'s
   template.

7. **If any report concerns warrant strategist input before
   committing**, stop here. Otherwise proceed.

8. **Update `docs/roadmap.md`** with the edits in **Appendix C**.

9. **Update `docs/project-state.md`** with the edits in
   **Appendix D**. (Adding 0008 to "Sessions completed," removing
   it from "Sessions planned.")

10. **Create the session log** at
    `docs/sessions/0008-face-adjacency-graph.md` with the content
    in **Appendix E**, copied verbatim.

11. **Stage all changes and commit** with this message:

    ```
    feat: face adjacency graph (DualGraph) and ADR 0002
    ```

    Files to stage:
    - `docs/decisions/0002-adjacency-as-separate-stage.md` (new)
    - `src/core/adjacency.ts` (new)
    - `test/unit/adjacency.test.ts` (new)
    - `docs/roadmap.md` (modified)
    - `docs/project-state.md` (modified)
    - `docs/sessions/0008-face-adjacency-graph.md` (new)
    - `docs/sessions/prompts/0008-face-adjacency-graph.md` (new —
      this prompt file, per the prompt-cadence rule)

12. **Fast-forward `main`** from the worktree branch.

13. **Report back:** final `main` HEAD hash, three verification
    commands' results, test count, **and the implementation
    report from Task 6** in a fenced markdown block so Evan can
    copy it cleanly to the strategist.

## Notes

- ADR 0002's text is committed verbatim (Appendix A). Do not edit
  the substance. If you spot a factual issue while filing, flag in
  the implementation report; the strategist decides whether to
  amend pre-merge.
- For the implementation in Spec 1: an edge is "canonical" when
  its two vertex indices are sorted ascending. Use this as the Map
  key so `[2, 5]` and `[5, 2]` collide. Decisions about whether to
  use a string key (`"2,5"`), a tuple, or a numeric encoding are
  yours to make — pick what reads well in code.
- The platonic-solid corpus is closed manifold by construction —
  every edge is shared by exactly 2 faces. If `buildAdjacency`
  encounters an edge shared by !== 2 faces, throw with a clear
  message naming the offending edge. v1 doesn't support boundary
  or non-manifold meshes per ADR 0001's deferrals.
- Use ES module imports with `.js` extensions in source code.
- Do not start `pnpm dev` in this session.
- The roadmap.md Main HEAD line: set it to `7fc7564` (pre-commit
  main HEAD). One-commit staleness after Session 0008's commit
  lands is expected; the strategist resolves it at next
  session-end.

---

## Spec 1 — `src/core/adjacency.ts`

**Exports:** `buildAdjacency(mesh: Mesh3D): DualGraph` plus the
`Adjacency` and `DualGraph` types from **Appendix B**.

**Purpose:** convert a `Mesh3D` (indexed face list) into a
`DualGraph` (face-adjacency relationships keyed for fast lookup).
Pure function, no I/O.

**Behavior:**

- For each face in `mesh.faces`, enumerate its three edges as
  unordered pairs of vertex indices: `(f[0], f[1])`, `(f[1], f[2])`,
  `(f[2], f[0])`.
- Canonicalize each edge so the two vertex indices are sorted
  ascending (smaller index first). Use the canonical form as a
  hash key — string concatenation (`"${min},${max}"`) is the
  simplest readable choice; use that.
- Build a map from canonical edge → list of face indices that
  contain that edge.
- After scanning all faces, iterate the map. For each entry:
  - If the face list has exactly 2 face indices, emit an
    `Adjacency`. Set `faceA` to the smaller face index, `faceB` to
    the larger — this gives a canonical orientation that's helpful
    later. Set `edge` to the canonical vertex pair `[min, max]`.
  - If the face list has any other count (1 = boundary edge;
    3+ = non-manifold), throw an `Error` whose message names the
    edge (vertex indices) and the unexpected face count.
- Build the `byFace` index: a `number[][]` where `byFace[i]`
  contains all adjacency indices (positions in the `adjacencies`
  array) that involve face `i`. Size of outer array equals
  `mesh.faces.length`; each inner array's length equals that
  face's neighbor count.
- Return `{ adjacencies, byFace }`.

**Imports:** `Mesh3D` type from `./mesh.js`. The new `Adjacency`
and `DualGraph` types are defined in this file (Appendix B
content).

---

## Spec 2 — `test/unit/adjacency.test.ts`

**Purpose:** validate `buildAdjacency` against the v1 test corpus.

**Imports:** `parseStl` from `../../src/core/parse-stl.js`,
`buildAdjacency` from `../../src/core/adjacency.js`, `describe`,
`it`, `expect` from `vitest`, `readFileSync` from `node:fs`,
`dirname`, `join` from `node:path`, `fileURLToPath` from
`node:url`.

**Setup:** same pattern as `parse-stl.test.ts` — resolve corpus
directory via `dirname(fileURLToPath(import.meta.url))` joined
with `../corpus`. Use a `buildFromCorpus(name)` helper that
parses the STL and builds adjacency, returning the `DualGraph`.

**Tests** (single `describe("buildAdjacency — platonic solids")`):

- `tetrahedron: 6 adjacencies, each face has 3 neighbors` —
  expect `adjacencies.length === 6` and `byFace.every(list =>
  list.length === 3)`.
- `cube: 18 adjacencies, each face has 3 neighbors` — expect 18
  adjacencies and every face's neighbor list has length 3.
- `octahedron: 12 adjacencies, each face has 3 neighbors` —
  expect 12 adjacencies and every face has 3 neighbors.

(The neighbor counts are all 3 because each triangle in a closed
manifold has 3 sides, each shared with exactly one neighbor.
The total adjacency count is `(faces × 3) / 2` for any closed
triangulation, which is why tetra → 6, cube → 18, octa → 12.)

---

## Appendix A — `docs/decisions/0002-adjacency-as-separate-stage.md` (verbatim)

```markdown
# ADR 0002: Adjacency as a separate output, not a half-edge mesh

## Context

ADR 0001 established the v1 pipeline as a sequence of pure-function
stages and explicitly deferred the mesh representation decision
(half-edge vs. indexed face list) "to Session 7 era, when adjacency
lookups become acute." Session 0007 implemented the Parse stage
using indexed face list (`Mesh3D = { vertices: Vec3[]; faces:
Triangle[] }`), without committing to a longer-term representation.

Session 0008 builds the face adjacency graph — the dual graph where
each node is a face and each edge connects two faces sharing a 3D
edge. This is the first stage where adjacency lookups are actually
required, forcing the deferred decision.

`paperfoldmodels`, our reference, uses a half-edge mesh (OpenMesh
`TriMesh`) for the input plus a separate graph structure (NetworkX
`Graph`) for the dual graph. Two layers: half-edge for navigation
around vertices and faces, graph for spanning-tree work. We have to
decide whether to follow that two-layer pattern, merge into a single
richer mesh representation, or take a simpler path.

## Decision

Adjacency is built as a separate output stage that consumes
`Mesh3D` and produces a new `DualGraph` data structure. `Mesh3D`
remains the canonical input representation throughout v1. We do not
introduce a half-edge mesh.

The new stage's signature is `buildAdjacency(mesh: Mesh3D):
DualGraph`. The output structure names each adjacency (which two
faces meet, which two vertices form their shared edge) and provides
face-keyed lookup so downstream stages can find a face's neighbors
in O(1) amortized.

This is consistent with ADR 0001's pipeline shape — stages return
distinct data structures, and the algorithm code only ever sees
the contract of one stage's output as input to the next.

## Consequences

What becomes easier:

- Simple data structures throughout. `Mesh3D` stays a typed pair
  of arrays; `DualGraph` is a typed adjacency list. No half-edge
  bookkeeping or boundary conventions to maintain.
- Each stage's output is self-contained and inspectable.
  Adjacency can be tested and visualized independently of the
  spanning-tree work that consumes it.
- Sessions 0009 (spanning tree) and 0010 (flatten) inherit clean
  inputs without needing to navigate raw mesh topology.

What becomes harder:

- Some operations that would be O(1) in a half-edge mesh (e.g.,
  walking around a single vertex, finding all faces meeting at a
  vertex) become O(F) here or require additional indexes. v1
  doesn't need these; v3+ probably will.
- If v3+ requires richer mesh queries — Takahashi's topological
  surgery, edge collapses, vertex-star traversal — we'll need to
  either add a `HalfEdgeMesh` as a downstream stage or upgrade
  `Mesh3D` itself. Either path is open from here.
- The two-layer pattern of `paperfoldmodels` is not replicated.
  Their half-edge layer was load-bearing for operations v1 doesn't
  reach; deferring it is a deliberate simplification.

Follow-on ADRs likely:

- A `HalfEdgeMesh` introduction if v3+ requires it — likely v3
  era when smart tab placement or topological-surgery work
  demands vertex-star traversal.
- A spanning-tree algorithm decision (MST with weights vs. plain
  DFS tree) — Session 0009, building on this ADR's `DualGraph`
  output.
```

---

## Appendix B — Type definitions inside `src/core/adjacency.ts` (verbatim)

These go at the top of the file, after the `Mesh3D` import:

```ts
/**
 * One adjacency relationship: two faces meeting at a shared edge.
 */
export interface Adjacency {
  /** The smaller face index (canonical ordering). */
  faceA: number;
  /** The larger face index. */
  faceB: number;
  /** The shared 3D edge as two vertex indices, sorted ascending. */
  edge: [number, number];
}

/**
 * Face adjacency graph (the dual graph). One node per face, one
 * edge per shared 3D edge between adjacent faces.
 */
export interface DualGraph {
  /** All adjacencies, one entry per shared edge in the mesh. */
  adjacencies: Adjacency[];
  /**
   * Indexed by face index. `byFace[i]` is the list of indices into
   * `adjacencies` that involve face `i`. Equivalent to "for each
   * face, which adjacencies touch it" — used by downstream stages
   * for O(1) neighbor lookup.
   */
  byFace: number[][];
}
```

---

## Appendix C — `docs/roadmap.md` edits

Change:

- `**0008 — Face adjacency graph.** ⏭ Build the dual graph...`
  → `**0008 — Face adjacency graph.** ✅ Build the dual graph...`
- `**0009 — Spanning tree.** DFS over the adjacency graph...`
  → `**0009 — Spanning tree.** ⏭ DFS over the adjacency graph...`

In the "Where we are now" section:

- `**Last completed session:** 0007 (mesh loading).`
  → `**Last completed session:** 0008 (face adjacency graph).`
- `**Next planned session:** 0008 — Face adjacency graph.`
  → `**Next planned session:** 0009 — Spanning tree.`
- `**Main HEAD:** \`a69dcf3\`.` → `**Main HEAD:** \`7fc7564\`.`
  (One-commit staleness after this commit lands is intentional;
  strategist updates post-session.)

---

## Appendix D — `docs/project-state.md` edits

### D.1 — Add Session 0008 to "Sessions completed"

Append this bullet at the end of the "Sessions completed" section:

```markdown
- **Session 0008 — Face adjacency graph.** `DualGraph` output stage in `src/core/adjacency.ts`; ADR 0002 commits the "adjacency as separate stage" decision deferred from ADR 0001. Log: `docs/sessions/0008-face-adjacency-graph.md`.
```

### D.2 — Remove Session 0008 from "Sessions planned"

Remove this bullet from the "Sessions planned" section:

```
- **Session 0008** — Face adjacency graph (dual graph).
```

Renumber the section's intro from "Sessions 0008 through 0011
complete v1." to "Sessions 0009 through 0011 complete v1."

---

## Appendix E — Session log content (verbatim)

````markdown
# Session 0008 — Face adjacency graph

## What was attempted

Build the Adjacency stage of the v1 pipeline per ADR 0001 — taking
`Mesh3D` (from Session 0007's parser) and producing a `DualGraph`
where each node is a face and each edge connects two faces sharing
a 3D edge. This is the input that Sessions 0009, 0010, and 0011
all consume. Also write ADR 0002 — the mesh representation
decision deferred from ADR 0001 — committing to "adjacency as a
separate output stage, not a half-edge mesh."

## What shipped

- `docs/decisions/0002-adjacency-as-separate-stage.md` — ADR 0002.
- `src/core/adjacency.ts` — `Adjacency` and `DualGraph` types plus
  `buildAdjacency(mesh: Mesh3D): DualGraph`. Pure function; emits
  one adjacency per shared 3D edge; rejects boundary or
  non-manifold meshes with a clear error.
- `test/unit/adjacency.test.ts` — three tests asserting expected
  adjacency counts and per-face neighbor counts for the platonic
  corpus: tetrahedron 6/3, cube 18/3, octahedron 12/3.

All three verification commands green. Test suite reports 8
passing tests total (1 sanity + 4 parser + 3 adjacency).

## What's next

Session 0009 — Spanning tree. DFS over the `DualGraph` to
classify each adjacency as fold or cut, producing a spanning tree
of the adjacency graph. The deferred algorithm decision (MST with
weights vs. plain DFS tree) becomes acute and warrants its own
ADR 0003.

## Decisions made or deferred

- **ADR 0002 committed:** adjacency as a separate output stage,
  not a half-edge mesh. Defers the `HalfEdgeMesh` introduction
  until v3+ if needed.
- **`DualGraph` shape:** `adjacencies: Adjacency[]` plus a
  face-indexed `byFace: number[][]` lookup. Trades a small amount
  of memory for O(1) neighbor lookup, which Session 0009 needs.
- **Edge canonicalization:** sort vertex-index pairs ascending,
  use string concatenation as the Map key. Simple and readable.
- **Boundary/non-manifold rejection:** throws with a clear error.
  v1 corpus is closed manifold by construction; v2+ may need a
  different policy.
- **No renderer changes.** `src/app/` stays as it is — visualizing
  the adjacency graph is cosmetic and deferred.

## Queue updates

No items closed. No items added.
````

---

## Appendix F — Implementation report template

After Task 5's verifications complete green, produce a report in
this structure and include it in your final reply to Evan.

````markdown
## Implementation report — Session 0008

### Decisions made within the spec
- **adjacency.ts:** [implementation choices the spec didn't
  dictate — helper names, control flow, edge encoding details]
- **adjacency.test.ts:** [test structure choices]
- **ADR 0002 filing:** [any pre-merge edits, if you spotted
  factual issues during filing. If none: "Filed verbatim."]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### Library APIs / patterns verified
- [Any APIs used the spec didn't dictate, current docs checked,
  patterns confirmed]

### Concerns / second-look candidates
- [Anything subtle worth a strategist eye. Include any stale
  content discovered in adjacent files. If nothing: "None."]

### Stale content discovered (adjacent files)
- [Per the practice from Session 0007's review — anything in
  `project-state.md`, `roadmap.md`, queue, or elsewhere that
  looks stale relative to actual project state. If nothing:
  "None."]

### Test output
- Total: N passed / N failed / N skipped
- New adjacency tests: N passed
````
