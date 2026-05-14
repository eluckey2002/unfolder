# Session 0007 — Mesh loading

## What was attempted

Stand up the Parse stage of the v1 pipeline per ADR 0001: an ASCII
STL parser in `src/core/` returning a typed `Mesh3D` data structure,
plus a three.js viewport in `src/app/` that renders the parsed mesh
on a canvas with mouse-rotate via OrbitControls. First session that
lands real `src/core/` and `src/app/` code, and the first session
under the spec-based prompt pattern.

## What shipped

- `src/core/mesh.ts` — `Vec3`, `Triangle`, and `Mesh3D` types. The
  Parse stage's output contract.
- `src/core/parse-stl.ts` — ASCII STL parser with vertex
  deduplication via 6-decimal rounding. Pure function, no three.js
  dependency.
- `test/unit/parse-stl.test.ts` — Tests asserting expected
  vertex/face counts for tetrahedron (4/4), cube (8/12), and
  octahedron (6/8), plus a rejection test for non-STL input.
- `src/app/render.ts` — Three.js scene setup wrapped in
  `createViewport(container, mesh)`. Builds a BufferGeometry from
  the Mesh3D, adds lighting and OrbitControls, runs the render
  loop, returns a cleanup function.
- `src/app/main.ts` — Replaces the console-log stub from Session
  0005. Imports `tetrahedron.stl` via Vite's `?raw` query, parses,
  mounts the viewport.
- `index.html` — Full-viewport canvas container.

All three verification commands green. Test suite reports 4
passing tests (1 sanity + 3 parser).

## What's next

Session 0008 — Face adjacency graph. Build the dual graph: one
node per face, edges between faces sharing a 3D edge. This is the
first session that touches the adjacency representation, and the
natural ADR moment for the mesh-representation decision deferred
in ADR 0001 (half-edge vs. indexed face list).

## Decisions made or deferred

- **Hand-rolled ASCII STL parser** rather than three.js's
  STLLoader. STLLoader produces a three.js BufferGeometry; ADR 0001
  requires the Parse stage to return our `Mesh3D` type. Hand-roll
  fits the pure-function contract.
- **Vertex deduplication at parse time**, not in the adjacency
  stage. Concentrates the floating-point fuzziness in one place
  and gives downstream stages canonical topology.
- **Dedup tolerance is `toFixed(6)` string keying.** Coarse but
  sufficient for v1 corpus.
- **Vite `?raw` imports** for loading STL contents at build time.
  Avoids a `public/` directory or runtime fetch.
- **Mesh representation in `src/core/` is indexed face list.** Not
  half-edge. Half-edge-vs-indexed decision remains deferred per
  ADR 0001's deferrals list; the natural moment is Session 0008.
- **Tests cover the parser only.** Renderer needs WebGL; manual
  visual validation via `pnpm dev`.
- **First spec-based prompt session.** Implementation choices made
  by Claude Code under the spec; documented in the implementation
  report appendix attached to the session reply.

## Queue updates

No items closed. No items added.
