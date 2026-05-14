# Session 0007 — Mesh loading

## Goal

First session that lands real `src/core/` and `src/app/` code. Stand
up the Parse stage of the v1 pipeline (per ADR 0001): an ASCII STL
parser in `src/core/` that returns a typed `Mesh3D`, plus a three.js
viewport in `src/app/` that renders the parsed mesh on a canvas. End
state: load the dev server (`pnpm dev`), see the tetrahedron from
the test corpus rendered on a canvas you can rotate with the mouse.

The architectural commitment: the parser is a pure function — input
is the STL file contents (string), output is a `Mesh3D` data
structure. Three.js is only used in `src/app/` for rendering. The
parser does not touch three.js. Aligns with ADR 0001's "render in a
separate layer" rule.

## How this prompt works

This is the first session under the spec-based prompt pattern. For
implementation files, the prompt describes behavior, contracts, and
key constraints — not the code itself. You write the code based on
the spec, using whatever current library API patterns you've
verified. Verbatim file content is reserved for type definitions
(the API contracts), specific config/markup files, and document
content.

At the end, you produce a small **implementation report** (template
in **Appendix F**) that Evan pastes back to the strategist for
review. The report names the decisions you made, deviations from
spec if any, library APIs you verified, and concerns worth a
second look. If a concern feels serious enough to warrant strategist
input before locking it in, stop short of committing (Task 12) and
surface it instead.

## Pre-work consistency scan

Scan `docs/queue.md` for items that intersect Session 0007's scope.
Expected: none of the current open items directly intersect this
work. Two `[process]` items (consistency-scan + doc-fetch) apply to
*how* the prompt was written, not to the work itself. The strategist
already applied both when drafting. No items close in this session;
one new working-agreement bullet gets added to `project-state.md`
(Task 10).

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at
   `aed43b4`, working tree clean (untracked at `.claude/` and
   `docs/sessions/prompts/` expected). If `main` has advanced
   since this prompt was written, surface that and proceed — the
   verification hash in Task 14 will simply be different.

2. **Create `src/core/mesh.ts`** with the content in **Appendix A**,
   copied verbatim. These are the type contracts the parser and
   the renderer both depend on; the exact shape *is* the API.

3. **Implement `src/core/parse-stl.ts`** per **Spec 1** below.

4. **Implement `test/unit/parse-stl.test.ts`** per **Spec 2** below.

5. **Implement `src/app/render.ts`** per **Spec 3** below.

6. **Replace `src/app/main.ts`** entirely with the content in
   **Appendix B**, copied verbatim. (Small enough that the exact
   form is the answer.)

7. **Replace `index.html`** entirely with the content in
   **Appendix C**, copied verbatim.

8. **Verify the toolchain.** Run in order:

   ```
   pnpm type-check
   pnpm test:run
   pnpm build
   ```

   All three should succeed. Tests should report 4 passing tests
   total (the sanity test from Session 0005 plus three new parser
   tests from Spec 2). If any command fails, stop and report — do
   not work around. The strategist will diagnose.

9. **Produce the implementation report** per **Appendix F**'s
   template. Keep it focused: decisions, deviations, verified APIs,
   concerns. The strategist will read this, not the full diffs.

10. **If any concerns in the report feel serious enough to warrant
    strategist input before committing** (e.g., a deviation from
    spec, an unexpected library behavior, a question about
    correctness), stop here and report to Evan with the
    implementation report. Wait for direction before continuing
    to Task 11. If concerns are minor or you have no concerns,
    proceed.

11. **Update `docs/roadmap.md`** with the edits in **Appendix D**.

12. **Update `docs/project-state.md`** with the addition in
    **Appendix E**.

13. **Create the session log** at
    `docs/sessions/0007-mesh-loading.md` with the content in
    **Appendix G**, copied verbatim. If you made notable
    implementation decisions that the strategist's pre-written
    "Decisions made or deferred" section doesn't cover, append
    them — but don't modify the strategist's bullets.

14. **Stage all changes and commit** with this message:

    ```
    feat: STL parser in src/core and three.js viewport in src/app
    ```

    Files to stage:
    - `src/core/mesh.ts` (new)
    - `src/core/parse-stl.ts` (new)
    - `test/unit/parse-stl.test.ts` (new)
    - `src/app/render.ts` (new)
    - `src/app/main.ts` (modified)
    - `index.html` (modified)
    - `docs/roadmap.md` (modified)
    - `docs/project-state.md` (modified)
    - `docs/sessions/0007-mesh-loading.md` (new)

15. **Fast-forward `main`** if you worked in a worktree. If you
    committed directly on `main`, skip.

16. **Report back:** the final `main` HEAD hash, all three
    verification commands' results, the test count, **and the
    implementation report from Task 9** in a fenced markdown block
    so Evan can copy it cleanly.

## Notes

- Visual verification (`pnpm dev` + browser) is deferred to Evan,
  manually, after the commit lands. Do not start `pnpm dev` in
  this session.
- Use ES module imports with `.js` extensions in source code (e.g.,
  `import { parseStl } from "../core/parse-stl.js"`). Bundler
  module resolution handles this transparently; it's the forward-
  compatible style.
- If you discover stale references in `project-state.md` while
  editing it, surface them in the implementation report. Don't
  fix unless they're inside Task 12's scope.

---

## Spec 1 — `src/core/parse-stl.ts`

**Exports:** `parseStl(contents: string): Mesh3D`

**Purpose:** parse the contents of an ASCII STL file into a
`Mesh3D`. Pure function, no I/O.

**Imports:** `Mesh3D`, `Triangle`, `Vec3` types from `./mesh.js`.

**Behavior:**

- The file is expected to begin with `solid` (after leading
  whitespace). If not, throw a clear `Error` — the message should
  state that ASCII STL was expected.
- Read line by line. For each line whose trimmed content starts with
  `vertex`, parse three whitespace-separated numbers as `x`, `y`,
  `z`. Other lines (`facet normal`, `outer loop`, `endloop`,
  `endfacet`, `solid name`, `endsolid name`) are ignored.
- If any of `x, y, z` is not a finite number, throw with the
  offending line in the message.
- Every three consecutive `vertex` lines form one triangle. Track
  the parsed vertex indices in order; emit a `Triangle` (three
  vertex indices) every time three are collected.
- Vertices are **deduplicated** by string key:
  `` `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}` ``. Maintain
  a `Map<string, number>` from key to vertex index. First
  occurrence creates the canonical entry; later occurrences reuse
  the existing index. STL files spell out three vertices per face
  with no sharing, so this dedup step is what recovers canonical
  topology.
- If the file ends mid-triangle (vertex count not a multiple of 3),
  throw with a message naming the unconsumed count.

**Style:** keep the function readable. Helpers (e.g., an
`internVertex` closure) are welcome. No external dependencies
besides the type import.

**Binary STL** is not supported in v1 and is not part of this spec.
Detection-and-binary-handling will land when needed.

---

## Spec 2 — `test/unit/parse-stl.test.ts`

**Purpose:** validate `parseStl` against the v1 test corpus.

**Imports:** `parseStl` from `../../src/core/parse-stl.js`; `describe`,
`it`, `expect` from `vitest`; `readFileSync` from `node:fs`;
`dirname`, `join` from `node:path`; `fileURLToPath` from `node:url`.

**Setup:** resolve the corpus directory via
`dirname(fileURLToPath(import.meta.url))` and `join` to
`../corpus`. A helper `loadCorpus(name)` should return the contents
of `${corpusDir}/${name}.stl` as UTF-8 text.

**Tests** (Vitest, single `describe("parseStl — platonic solids")`
block):

- `tetrahedron: 4 vertices, 4 faces` — parses
  `tetrahedron.stl`, asserts `vertices.length === 4` and
  `faces.length === 4`.
- `cube: 8 vertices, 12 faces (quads triangulated)` — parses
  `cube.stl`, asserts 8 / 12.
- `octahedron: 6 vertices, 8 faces` — parses `octahedron.stl`,
  asserts 6 / 8.
- `rejects non-STL input` — calling
  `parseStl("this is not an STL file")` throws.

---

## Spec 3 — `src/app/render.ts`

**Exports:** `createViewport(container: HTMLElement, mesh: Mesh3D): () => void`

**Purpose:** mount a three.js viewport rendering `mesh` inside
`container`. Returns a cleanup function the caller can call to
dispose everything.

**Imports:**
- From `three`: whichever of `AmbientLight`, `BufferAttribute`,
  `BufferGeometry`, `DirectionalLight`, `Mesh`, `MeshStandardMaterial`,
  `PerspectiveCamera`, `Scene`, `WebGLRenderer` you actually use.
- `OrbitControls` from
  `three/examples/jsm/controls/OrbitControls.js` (this is the
  import path that aligns with `@types/three`'s declaration layout
  — same convention we used for `STLExporter` in Session 0006).
- `Mesh3D` type from `../core/mesh.js`.

**Internal helper:** build a `BufferGeometry` from a `Mesh3D`. Use
a `Float32Array` for positions (length = `vertices.length * 3`) and
a `Uint32Array` for indices (length = `faces.length * 3`). Call
`setAttribute("position", new BufferAttribute(positions, 3))`,
`setIndex(new BufferAttribute(indices, 1))`, and
`computeVertexNormals()` before returning.

**Scene setup:**
- A `Scene`.
- `PerspectiveCamera`: fov 45, aspect initially 1 (resize handler
  will correct it), near 0.01, far 100. Position at `(3, 2, 3)`;
  default lookAt origin is fine.
- `WebGLRenderer` with `{ antialias: true }`. Set
  `setPixelRatio(window.devicePixelRatio)`. Append the canvas
  (`renderer.domElement`) to `container`.
- `AmbientLight(0xffffff, 0.4)` added to the scene.
- `DirectionalLight(0xffffff, 0.9)` at position `(5, 5, 5)`, added
  to the scene.
- `MeshStandardMaterial` with `color: 0x6b88a8`, `flatShading: true`.
  Flat shading is intentional so polyhedron faces read crisply.
- A `Mesh` wrapping the geometry and material, added to the scene.
- `OrbitControls(camera, renderer.domElement)` with
  `enableDamping = true`.

**Render loop:** `requestAnimationFrame` callback that calls
`controls.update()` and `renderer.render(scene, camera)` each
frame. Track the frame handle so cleanup can cancel it.

**Resize handling:** a function that reads
`container.clientWidth` and `clientHeight`, calls
`renderer.setSize(w, h, false)` (passing `false` for the third
argument is important — it tells three.js not to write inline
styles on the canvas), and updates `camera.aspect` plus
`camera.updateProjectionMatrix()`. Run once at startup; bind to
`window`'s `resize` event.

**Cleanup function:** cancel the animation frame, remove the
resize listener, call `controls.dispose()`, `geometry.dispose()`,
`material.dispose()`, `renderer.dispose()`. If
`renderer.domElement.parentElement === container`, remove the
canvas. Return this function from `createViewport`.

---

## Appendix A — `src/core/mesh.ts` (verbatim)

```ts
/**
 * Core mesh types for the unfolder pipeline.
 *
 * Per ADR 0001, the Parse stage's output is "a 3D mesh — a list of
 * vertices and a list of triangular faces indexing into the vertex
 * list." This file defines that contract.
 */

export type Vec3 = [number, number, number];

/** A triangular face, expressed as three vertex indices into Mesh3D.vertices. */
export type Triangle = [number, number, number];

export interface Mesh3D {
  /** Deduplicated vertex positions. */
  vertices: Vec3[];
  /** Faces, each referencing three vertex indices. */
  faces: Triangle[];
}
```

---

## Appendix B — `src/app/main.ts` (verbatim)

```ts
import tetrahedronStl from "../../test/corpus/tetrahedron.stl?raw";

import { parseStl } from "../core/parse-stl.js";
import { createViewport } from "./render.js";

const container = document.getElementById("viewport");
if (!(container instanceof HTMLElement)) {
  throw new Error("main.ts: #viewport element not found.");
}

const mesh = parseStl(tetrahedronStl);
console.log(`unfolder: parsed mesh with ${mesh.vertices.length} vertices, ${mesh.faces.length} faces.`);

createViewport(container, mesh);
```

---

## Appendix C — `index.html` (verbatim)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>unfolder</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #1a1a1a; }
      #viewport { width: 100vw; height: 100vh; display: block; }
    </style>
  </head>
  <body>
    <div id="viewport"></div>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

---

## Appendix D — `docs/roadmap.md` edits

Change:
- `**0007 — Mesh loading.** ⏭ Parse STL files...`
  → `**0007 — Mesh loading.** ✅ Parse STL files...`
- `**0008 — Face adjacency graph.** Build the dual graph...`
  → `**0008 — Face adjacency graph.** ⏭ Build the dual graph...`

In the "Where we are now" section:
- `**Last completed session:** 0006 (test corpus generation).`
  → `**Last completed session:** 0007 (mesh loading).`
- `**Next planned session:** 0007 — Mesh loading.`
  → `**Next planned session:** 0008 — Face adjacency graph.`

Leave the "Main HEAD" line at its current value — the strategist
updates it post-session along with the artifact snapshot.

---

## Appendix E — `docs/project-state.md` addition

Append this bullet at the end of the existing "Working agreements"
section:

```
- **The strategist updates the `unfolder-roadmap` Cowork artifact
  at each session-end.** Same trigger as the roadmap.md status
  flip — both happen together. The artifact carries a baked
  snapshot of session statuses, queue, and recent commits.
```

---

## Appendix F — Implementation report template

After Task 8's verifications complete green, produce a report in
this exact structure and include it in your final reply to Evan.
He copies and pastes it back to the strategist.

````markdown
## Implementation report — Session 0007

### Decisions made within the spec
- **parse-stl.ts:** [what you implemented; what choices you made
  that the spec didn't dictate — variable names, helper functions,
  control flow]
- **parse-stl.test.ts:** [same — test structure, helpers, anything
  the spec didn't pin down]
- **render.ts:** [same — internal structuring, helper names,
  anything beyond what the spec said]

### Deviations from spec
- [Anything that diverged from the spec, with reasoning. If
  nothing: "None."]

### Library APIs / patterns verified
- [Which import paths resolved cleanly? Any APIs you cross-checked
  against current docs? Anything that surprised you?]

### Concerns / second-look candidates
- [Anything subtle worth a strategist eye — corner cases not in
  tests, choices that could go either way, patterns you're not
  fully sure about. If nothing: "None."]

### Test output
- Total: N passed / N failed / N skipped
- New parser tests: N passed
````

---

## Appendix G — Session log content

````markdown
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
````
