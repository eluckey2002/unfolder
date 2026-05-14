# Session 0012 — OBJ parser

## Goal

First v2 implementation session. Add a Wavefront OBJ parser to
`src/core/` — `parseObj(contents: string): Mesh3D` — producing the
exact same `Mesh3D` contract the v1 STL parser produces. This is
what unblocks the v2 test corpus (session 0013): real low-poly
models ship as OBJ, not STL.

The parser is geometry-only. It reads vertex (`v`) and face (`f`)
lines and ignores everything else — normals, texture coordinates,
groups, objects, materials, smoothing. It handles the parts of the
OBJ format the STL parser never had to: shared-vertex indexing
(1-based, with negative/relative indices), the four face-reference
forms, and polygonal faces (quads and n-gons), which it
fan-triangulates because the whole downstream pipeline assumes
triangles.

Like `parseStl`, `parseObj` is a pure function: string in, `Mesh3D`
out, no I/O, no three.js. It lives beside `parse-stl.ts` in
`src/core/` as a sibling, not a replacement — v1's STL path stays
exactly as it is.

## How this prompt works

This is an established spec-based session prompt (the pattern was
introduced in session 0007). For implementation files the prompt
describes behavior and contracts, not code — you write the
implementation using current, verified library API knowledge.
Verbatim content is reserved for fixture files, type-contract
references, doc edits, and the session log, where the exact wording
is the deliverable.

This prompt is itself the written plan that CLAUDE.md section 5's
"plan first for multi-file sessions" rule calls for — the files to
create and modify, the verification steps, and the commit strategy
are all specified below. No separate plan-mode step is needed;
proceed to implement.

At the end you produce an **implementation report** (template in
**Appendix D**). If any concern in it feels serious enough to
warrant strategist input before locking it in, stop short of
committing and surface it instead.

## Pre-work consistency scan

Scan `docs/queue.md` for items intersecting this session's scope
(the OBJ parser, `src/core/`, `test/corpus/`). None are expected to
— if any do, surface it before starting.

Note: Evan works in parallel in this repo. This session runs in
its own worktree, so it is isolated. The only shared files it
edits are `docs/roadmap.md` and `docs/project-state.md` (status
updates, Tasks 9–10). `/wrap-session` (Task 12) rebases onto
`main` before fast-forwarding, which absorbs parallel commits; if
that rebase hits a conflict in a doc file, stop and report rather
than guessing.

## Tasks

1. **Create the worktree and verify starting state.** Create a
   worktree for this numbered session. The SessionStart hook
   prints cwd, branch, and `git worktree list` — trust that for
   location, per CLAUDE.md section 5. Confirm `main` is clean and
   note its current HEAD hash (near `bac2aec` at time of writing;
   if it has advanced from parallel work, that is fine — just note
   the actual hash). Run `pnpm install` in the fresh worktree
   before anything else — worktrees start without `node_modules`.

2. **Copy this prompt file into the worktree.** Copy the
   authoritative `docs/sessions/prompts/0012-obj-parser.md` from the
   main checkout into the worktree (do not reconstruct it from the
   pasted message). It commits with this session in Task 11.

3. **Implement `src/core/parse-obj.ts`** per **Spec 1** below.

4. **Create `test/corpus/cube.obj`** with the content in
   **Appendix A**, copied verbatim. This is a reusable corpus
   fixture — a clean unit cube as six quad faces.

5. **Implement `test/unit/parse-obj.test.ts`** per **Spec 2** below.

6. **Verify the toolchain.** Run in order:

   ```
   pnpm type-check
   pnpm test:run
   pnpm build
   ```

   All three should succeed. The eight new `parseObj` tests from
   Spec 2 should pass; report the cumulative suite total rather than
   asserting a predicted number. If any command fails, stop and
   report — do not work around it.

7. **Produce the implementation report** per **Appendix D**.

8. **If any concern in the report warrants strategist input before
   committing** — a spec deviation, an unexpected OBJ-format
   behavior, a correctness question — stop here and report. Wait
   for direction before continuing to Task 9. If concerns are minor
   or absent, proceed.

9. **Update `docs/roadmap.md`** with the edits in **Appendix B**.

10. **Update `docs/project-state.md`** with the edits in
    **Appendix C**.

11. **Create the session log** at `docs/sessions/0012-obj-parser.md`
    with the content in **Appendix E**, copied verbatim. If you made
    notable implementation decisions the pre-written "Decisions made
    or deferred" section doesn't cover, append them — don't modify
    the existing bullets.

12. **Wrap the session — run `/wrap-session`.** The skill runs the
    closing ritual: confirm location, confirm staged-clean, reuse
    this session's verification results (do not re-run them),
    confirm the session log ends with its handoff block, commit,
    rebase onto `main`, fast-forward, and prompt for
    worktree-cleanup confirmation. Use this commit message:

    ```
    feat: OBJ parser in src/core
    ```

    Stage these files explicitly by name (`/wrap-session` requires
    explicit staging — no `git add -A`):
    - `src/core/parse-obj.ts` (new)
    - `test/corpus/cube.obj` (new)
    - `test/unit/parse-obj.test.ts` (new)
    - `docs/roadmap.md` (modified)
    - `docs/project-state.md` (modified)
    - `docs/sessions/0012-obj-parser.md` (new)
    - `docs/sessions/prompts/0012-obj-parser.md` (new — the copied
      prompt file)

    If `/wrap-session`'s rebase hits a conflict in a doc file,
    stop and report rather than guessing.

13. **Report back:** the final `main` HEAD hash, all three
    verification command results, the cumulative test count, and
    the **implementation report from Task 7** in a fenced markdown
    block so it can be copied cleanly.

## Notes

- Use ES module imports with `.js` extensions in source code (e.g.
  `import type { Mesh3D, Triangle, Vec3 } from "./mesh.js";`).
- `parseObj` imports only the type contract from `./mesh.js` — no
  other dependencies, no three.js. Same purity contract as
  `parseStl`.
- Do not start `pnpm dev`. There is no visual-verification step in
  this session; the OBJ path is wired into the app in a later
  session.
- If you notice stale references in `docs/roadmap.md` or
  `docs/project-state.md` while editing them, surface them in the
  implementation report — don't fix anything outside the appendix
  edits.

---

## Spec 1 — `src/core/parse-obj.ts`

**Exports:** `parseObj(contents: string): Mesh3D`

**Purpose:** parse the contents of a Wavefront OBJ file into a
`Mesh3D`. Pure function, no I/O.

**Imports:** `Mesh3D`, `Triangle`, `Vec3` types from `./mesh.js`.

**Behavior:**

- Process the file in a **single pass**, line by line, in order.
  This matters: OBJ negative indices are relative to the vertex
  count *at the point the face is declared*, so vertex and face
  lines must be interpreted in document order.
- On each line, strip anything from a `#` to end of line (OBJ
  comments — they may be a whole line or trailing), then trim. Skip
  empty lines.
- Split the remaining line into whitespace-separated tokens. Branch
  on the **exact** first token:
  - `v` — a geometric vertex: `v x y z [w]`. Parse `x`, `y`, `z` as
    numbers; ignore the optional `w`. If any of `x, y, z` is
    non-finite, throw with the offending line in the message.
  - `f` — a face (see below).
  - Anything else (`vn`, `vt`, `vp`, `g`, `o`, `usemtl`, `mtllib`,
    `s`, …) — ignore. Match the first token exactly; do not
    prefix-match (`vn` and `vt` must not be mistaken for `v`).
- **Vertices are deduplicated**, the same way `parseStl` does it:
  intern each parsed vertex by the string key
  `` `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}` ``, reusing
  the existing index on a repeat. `Mesh3D.vertices` is the
  deduplicated list. Maintain, separately, an ordinal→canonical
  map: the Nth `v` line in the file maps to its canonical
  (interned) index. Rationale: `Mesh3D`'s contract says vertices
  are deduplicated, and the adjacency stage finds shared edges via
  shared vertex indices — an OBJ export with coincident vertices
  would silently break adjacency without this. Keeping the dedup
  identical across both parsers keeps the `Mesh3D` contract
  uniform. (This is a within-stage decision, consistent with the
  existing parser — a session-log note, not an ADR.)
- **Face lines** (`f`): the tokens after `f` are vertex references,
  three or more of them.
  - Each reference has one of four forms: `v`, `v/vt`, `v//vn`,
    `v/vt/vn`. Take the substring before the first `/` — that is
    the vertex index. (Texture and normal indices are discarded.)
  - Parse that as an integer. If it does not parse to a nonzero
    integer, throw with the offending line.
  - Resolve to a 0-based canonical vertex index:
    - **positive** `i`: 1-based and absolute → ordinal `i - 1`.
    - **negative** `i`: relative to the end → ordinal
      `(vertex count so far) + i` (so `-1` is the last vertex
      defined before this line).
    - Then map the ordinal through the ordinal→canonical map.
    - If the ordinal is out of range, throw with the offending
      line.
  - A face must have **at least three** references; fewer → throw.
  - **Fan-triangulate**: references resolving to canonical indices
    `[c0, c1, c2, …, cn]` produce triangles
    `(c0,c1,c2), (c0,c2,c3), …, (c0,c(n-1),cn)`. A triangle face
    yields one `Triangle`; a quad yields two; an n-gon yields
    `n - 2`. Fan triangulation is correct for convex faces and is
    the naive-first choice; smarter triangulation is deferred until
    a real model proves it necessary.
- After the single pass, if **no faces** were produced, throw a
  clear `Error` stating that no `f` lines were found. OBJ has no
  magic header (unlike STL's `solid`), so a faceless result is the
  signal that the input was not a usable mesh — this throw is the
  equivalent guard.

**Style:** keep it readable; mirror `parse-stl.ts`'s shape and
error-message style. Helper closures (an `internVertex`, a
reference resolver) are welcome. No external dependencies beyond
the type import.

---

## Spec 2 — `test/unit/parse-obj.test.ts`

**Purpose:** validate `parseObj` against the corpus fixture and
against the OBJ-specific behaviors the STL parser never exercised.

**Imports:** `parseObj` from `../../src/core/parse-obj.js`;
`describe`, `it`, `expect` from `vitest`; `readFileSync` from
`node:fs`; `dirname`, `join` from `node:path`; `fileURLToPath` from
`node:url`.

**Setup:** resolve the corpus directory the same way
`parse-stl.test.ts` does (`dirname(fileURLToPath(import.meta.url))`
joined to `../corpus`); a `loadCorpus(name)` helper returns
`${corpusDir}/${name}.obj` as UTF-8 text.

**Tests** (Vitest, a single `describe("parseObj")` block). Inline
OBJ strings are fine — and preferred — for the behavior cases; the
fixture is for the realistic-model case.

- `cube.obj: 8 vertices, 12 faces (quads triangulated)` — parse the
  `cube.obj` fixture; assert `vertices.length === 8` and
  `faces.length === 12`.
- `fan-triangulates an n-gon face` — an inline OBJ with five
  vertices and one pentagon face; assert it yields 3 triangles.
- `resolves negative (relative) vertex indices` — an inline OBJ
  whose face uses `f -3 -2 -1`; assert it produces the same
  triangle as the equivalent positive-index face.
- `parses all four face-reference forms` — an inline OBJ (with
  dummy `vt`/`vn` lines so the references are well-formed) whose
  faces use `f a b c`, `f a/t b/t c/t`, `f a//n b//n c//n`, and
  `f a/t/n b/t/n c/t/n`; assert every face resolves to the same
  three vertex indices.
- `ignores vn, vt, vp, g, o, usemtl, mtllib, s, and comments` — an
  inline OBJ interleaving those line types (and `#` comments,
  including a trailing one) around real geometry; assert the
  output is identical to the same geometry without them.
- `deduplicates coincident vertices` — an inline OBJ with two
  identical `v` lines; assert the duplicate collapses and the face
  referencing both ordinals resolves to one canonical index.
- `rejects a file with no faces` — `parseObj("v 0 0 0")` throws.
- `rejects an out-of-range face index` — an inline OBJ whose face
  references a vertex index past the end; throws.

---

## Appendix A — `test/corpus/cube.obj` (verbatim)

```
# Unit cube — v2 OBJ test corpus fixture.
# 8 vertices, 6 quad faces. Exercises fan-triangulation: 6 quads -> 12 triangles.
# Consistent CCW-outward winding; every edge is shared by exactly two faces.
v 0 0 0
v 1 0 0
v 1 1 0
v 0 1 0
v 0 0 1
v 1 0 1
v 1 1 1
v 0 1 1
f 1 4 3 2
f 5 6 7 8
f 1 2 6 5
f 2 3 7 6
f 3 4 8 7
f 4 1 5 8
```

---

## Appendix B — `docs/roadmap.md` edits

**B1.** In the "v2 session plan" section, prepend the completed flag
to the 0012 entry and the next-up flag to the 0013 entry:

- `- **0012 — OBJ parser.** Add \`src/core/parse-obj.ts\`, producing the`
  → `- **0012 — OBJ parser.** ✅ Add \`src/core/parse-obj.ts\`, producing the`
- `- **0013 — Sourced model test corpus.** Source four to six`
  → `- **0013 — Sourced model test corpus.** ⏭ Source four to six`

**B2.** In the "Where we are now" section:

- `**Phase:** v2 — Functional Unfolder. Planning complete;`
  `implementation not started.`
  → `**Phase:** v2 — Functional Unfolder. Implementation underway.`
- `**Last completed session:** 0011 — SVG export (v1 walking skeleton`
  `complete).`
  → `**Last completed session:** 0012 — OBJ parser.`
- `**Next planned session:** 0012 — OBJ parser.`
  → `**Next planned session:** 0013 — Sourced model test corpus.`

**B3.** In the "Maintaining this document" section, re-wrap the
paragraph so no line overruns the file's wrap width (the current
third line runs long). Replace:

```
Updated by the strategist at the end of any session whose status
changes. Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the active phase's session plan. Phase descriptions only change when a
phase's ship-state commitment itself changes — a substantive enough
event to warrant its own ADR.
```

with:

```
Updated by the strategist at the end of any session whose status
changes. Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the active phase's session plan. Phase descriptions only
change when a phase's ship-state commitment itself changes — a
substantive enough event to warrant its own ADR.
```

---

## Appendix C — `docs/project-state.md` edits

**C1.** In the "Current phase" section, replace the last two
sentences:

```
v2's session-level plan is drafted in `docs/roadmap.md`; session 0012 (OBJ parser) is next. v2 implementation has not started.
```

with:

```
v2's session-level plan is in `docs/roadmap.md`; session 0012 (OBJ parser) is complete, and session 0013 (sourced model test corpus) is next.
```

**C2.** At the end of the "Sessions completed" list, append:

```
- **Session 0012 — OBJ parser.** Wavefront OBJ parser in `src/core/parse-obj.ts` producing the v1 `Mesh3D` — geometry-only, with shared-vertex indexing (1-based, negative indices), the four face-reference forms, and fan-triangulation of quad/n-gon faces. Vertex dedup mirrors the STL parser. First v2 implementation session. Log: `docs/sessions/0012-obj-parser.md`.
```

**C3.** In the "Sessions planned" section, replace the three-item
list:

```
- **0012 — OBJ parser.** `src/core/parse-obj.ts` producing the v1
  `Mesh3D`. The next session.
- **0013 — Sourced model test corpus.** CC-licensed low-poly OBJ
  models in `test/corpus/`, plus the v1-pipeline overlap baseline.
- **0014 — Dihedral-weighted spanning tree.** Weighted MST over the
  dual graph; ADR 0004 commits the weighting heuristic.
```

with:

```
- **0013 — Sourced model test corpus.** CC-licensed low-poly OBJ
  models in `test/corpus/`, plus the v1-pipeline overlap baseline.
  The next session.
- **0014 — Dihedral-weighted spanning tree.** Weighted MST over the
  dual graph; ADR 0004 commits the weighting heuristic.
```

---

## Appendix D — Implementation report template

After Task 6's verifications pass, produce a report in this exact
structure and include it in your final reply.

````markdown
## Implementation report — Session 0012

### Decisions made within the spec
- **parse-obj.ts:** [choices the spec didn't dictate — helper
  structure, control flow, how you handled the ordinal→canonical
  mapping, error-message wording]
- **parse-obj.test.ts:** [test structure, the inline OBJ strings
  you authored, helpers]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### OBJ-format behaviors verified
- [What you confirmed about face-reference parsing, negative
  indexing, n-gon triangulation, line-type filtering. Anything that
  surprised you.]

### Concerns / second-look candidates
- [Subtle corners worth a strategist eye — the fixture's winding,
  triangulation on non-convex faces, anything that could go either
  way. If nothing: "None."]

### Test output
- Cumulative suite total: N passed / N failed / N skipped
- New parseObj tests: N passed
````

---

## Appendix E — Session log content

Create `docs/sessions/0012-obj-parser.md` with this content,
verbatim. Append to "Decisions made or deferred" only if you made
notable choices not already covered.

````markdown
# Session 0012 — OBJ parser

## What was attempted

Add a Wavefront OBJ parser to `src/core/` —
`parseObj(contents: string): Mesh3D` — producing the same `Mesh3D`
contract as the v1 STL parser. First v2 implementation session.
The OBJ path unblocks the v2 test corpus (session 0013), since real
low-poly models ship as OBJ. Geometry-only: vertex and face lines
are read, everything else is ignored. The parser handles what STL
never required — shared-vertex indexing with negative indices, the
four face-reference forms, and fan-triangulation of polygonal
faces.

## What shipped

- `src/core/parse-obj.ts` — `parseObj`, a pure function mirroring
  `parseStl`'s shape. Single-pass parse; geometry-only; vertex
  deduplication identical to the STL parser; 1-based and
  negative/relative index resolution; fan-triangulation of quad and
  n-gon faces. Throws on non-finite coordinates, unparseable or
  out-of-range face references, faces with fewer than three
  vertices, and files that yield no faces.
- `test/corpus/cube.obj` — a clean unit-cube corpus fixture, six
  quad faces, consistent CCW-outward winding.
- `test/unit/parse-obj.test.ts` — eight tests: the cube fixture
  (8 vertices, 12 triangles), n-gon fan-triangulation, negative
  index resolution, all four face-reference forms, ignored line
  types, vertex dedup, and two rejection cases.

All three verification commands green. (See the implementation
report for the cumulative test count.)

## What's next

Session 0013 — Sourced model test corpus. Source CC-licensed
low-poly OBJ models — faceted animal heads, geometric busts,
low-poly props — into `test/corpus/`, with a `PROVENANCE.md` for
source and license per model, and record the v1-pipeline overlap
baseline: which models flatten cleanly and which overlap. That
baseline is the failure corpus that drives the rest of v2.

## Decisions made or deferred

- **`parseObj` is a sibling of `parseStl`, not a replacement.** The
  STL path is unchanged; the two parsers both produce `Mesh3D`. No
  format-dispatch router was built — callers choose the parser.
  A router lands later only if a caller needs it.
- **Vertex deduplication mirrors the STL parser** —
  `toFixed(6)` string-key interning. OBJ already shares vertices by
  index, but a re-dedup keeps the `Mesh3D` "deduplicated vertices"
  contract uniform and keeps the adjacency stage robust to OBJ
  exports with coincident vertices. Within-stage choice, consistent
  with the existing parser — recorded here, not as an ADR.
- **Single-pass parse.** OBJ negative indices are relative to the
  vertex count at the point a face is declared, so lines are
  interpreted in document order rather than collecting all vertices
  first.
- **Fan-triangulation for polygonal faces.** Correct for convex
  faces and the naive-first choice; smarter triangulation is
  deferred until a real model proves it necessary.
- **Geometry-only.** Normals, texture coordinates, groups, objects,
  materials, and smoothing are parsed-and-ignored. v2 needs
  topology, not appearance.

## Handoff

- **Branch / worktree:** `claude/<name>` at
  `.claude/worktrees/<name>/` — fill in the actual name.
- **Commits:** `<short-sha> feat: OBJ parser in src/core` — fill
  in the actual SHA.
- **Verification:** `pnpm test:run` <N> passing; `pnpm type-check`
  clean; `pnpm build` clean.
- **Decisions made or deferred:** `parseObj` is a sibling of
  `parseStl` (no format-dispatch router); vertex dedup mirrors the
  STL parser; single-pass parse; fan-triangulation for n-gons;
  geometry-only. All within-stage session-log notes — no ADR.
- **Queue / roadmap deltas:** Roadmap — 0012 → ✅, 0013 → ⏭,
  "Where we are now" advanced. `project-state.md` — 0012 added to
  Sessions completed; Sessions planned advanced. `docs/queue.md` —
  unchanged.
- **Open questions for the strategist:** None — unless the
  implementation report surfaced one; list it here if so.
````
