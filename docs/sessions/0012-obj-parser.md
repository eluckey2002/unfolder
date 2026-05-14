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
- **Strict integer parsing for face vertex indices** —
  `Number(token)` with `Number.isInteger(idx) && idx !== 0` rather
  than `parseInt`. `parseInt("1.5")` truncates to `1` and
  `parseInt("1abc")` returns `1`; the stricter check rejects both
  as malformed, matching the spec's "parses as a nonzero integer"
  requirement.

## Handoff

- **Branch / worktree:** `claude/awesome-booth-0dc092` at
  `.claude/worktrees/awesome-booth-0dc092/`.
- **Commits:** `<short-sha> feat: OBJ parser in src/core` — SHA
  unknown at log-write time (chicken-and-egg: log commits with the
  source files in the same commit). First session under the new
  handoff convention; convention refinement deferred.
- **Verification:** `pnpm test:run` 27 passing across 7 files;
  `pnpm type-check` clean; `pnpm build` clean.
- **Decisions made or deferred:** `parseObj` is a sibling of
  `parseStl` (no format-dispatch router); vertex dedup mirrors the
  STL parser; single-pass parse; fan-triangulation for n-gons;
  geometry-only; strict integer parsing for face indices. All
  within-stage session-log notes — no ADR.
- **Queue / roadmap deltas:** Roadmap — 0012 → ✅, 0013 → ⏭,
  "Where we are now" advanced. `project-state.md` — 0012 added to
  Sessions completed; Sessions planned advanced. `docs/queue.md` —
  unchanged.
- **Open questions for the strategist:** None on the
  implementation itself. Session-mechanics observation: the
  handoff block's `<short-sha>` field is currently unfilled — the
  log is committed in the same commit as the source files, so its
  own SHA can't be known pre-commit, and `/wrap-session`'s
  anti-patterns prohibit amending. Worth a strategist call on
  whether to drop the SHA field, fill it via a follow-up
  maintenance commit, or accept the placeholder.
