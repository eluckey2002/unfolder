# Session 0006 — Generate the test corpus

## What was attempted

Generate ASCII STL files for the three platonic solids v1 tests
against — tetrahedron, cube, octahedron — and establish the
`scripts/` directory as the project's convention for dev utilities.
Use three.js's built-in geometries and `STLExporter` rather than
hand-authoring vertex data, as a deliberate early-adoption move
toward the library that will carry through the rest of v1 and beyond.

## What shipped

`scripts/generate-corpus.ts` — a ~30-line TypeScript script that
constructs three platonic-solid geometries via three.js and exports
each to an ASCII STL file via `STLExporter`. `pnpm generate-corpus`
runs it via `vite-node`. Three STL files written to `test/corpus/`:
`tetrahedron.stl`, `cube.stl`, `octahedron.stl`. `tsconfig.json`
extended to include `scripts/` in type-checking. `three` added as a
runtime dependency, `@types/three` as a dev dependency. `vite-node`
ships with Vitest, so no additional runner was installed.

## What's next

Session 0007 — Mesh loading. Parse the STL files from `test/corpus/`,
render their triangles on a canvas via three.js. First session that
produces visible 3D output in the browser and first session that
populates `src/core/` and `src/app/` with non-trivial code.

## Decisions made or deferred

- Three.js used for geometry generation rather than hand-authoring
  vertex/face data. Tradeoff: pulls a dependency for what's
  conceptually a constants file, but avoids the need to re-derive the
  corpus when three.js is needed for rendering anyway (Session 0007).
- ASCII STL chosen over binary. Files are tiny; debuggability matters
  more than compactness at this scale.
- Import path `three/examples/jsm/exporters/STLExporter.js` used
  rather than the newer `three/addons/...` form, because `@types/three`
  publishes type declarations at the older path and using it avoids
  tsconfig path-mapping complexity.
- No tests written on the generator itself. Validation deferred to
  Session 0007 where the mesh loader will parse these files.
- Default geometry parameters used (radius 1 for tetrahedron and
  octahedron, side 1 for cube). Different solids end up with different
  edge lengths; unfolding doesn't care about scale.

## Queue updates

- Added: `[process] Before writing config-heavy prompts involving
  external libraries, fetch current docs and verify the patterns are
  still canonical.`
