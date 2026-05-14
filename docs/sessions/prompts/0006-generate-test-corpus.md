# Session 0006 — Generate the test corpus

## Goal

Generate ASCII STL files for the three platonic solids we test against
in v1: tetrahedron, cube, octahedron. Files written to `test/corpus/`
and committed as fixtures. Generator script lives at
`scripts/generate-corpus.ts`, uses three.js's built-in geometries plus
`STLExporter` from three.js addons. Establishes the `scripts/`
directory as a convention for dev utilities (first session that adds
one).

## Pre-work consistency scan

Before making changes, scan `docs/queue.md` for items that intersect
this session's scope. Surface anything found. Expected: no current
queue items intersect Session 0006 directly. Two meta-process items
(`[process] Restructuring prompts should include a consistency-scan
step` and the one being added in this session) apply to *how* this
prompt is written, not to its work. No items close in this session;
one new item gets added (see Task 11).

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm you're on `main`, the
   working tree is clean (untracked at `.claude/` and
   `docs/sessions/prompts/` are expected), and `main`'s HEAD is
   `ec116c1`.

2. **Install three.js and its types.** Run:

   ```
   pnpm add three
   pnpm add -D @types/three
   ```

   `three` is a runtime dependency (Session 7+ will use it in `src/`
   for canvas rendering), so it goes in `dependencies`, not
   `devDependencies`. `@types/three` is a dev-only types package.

3. **Create the `scripts/` directory** at the repo root. New
   convention for the project — dev utilities live here, separate from
   `src/` (library code) and `test/` (tests). No `.gitkeep` needed
   because the directory will be populated immediately in Task 4.

4. **Create `scripts/generate-corpus.ts`** with the content in
   **Appendix A** below, copied verbatim.

5. **Update `package.json`.** Add a `generate-corpus` script that
   invokes `vite-node` against the generator. Insert this line into
   the `scripts` block, after `type-check`:

   ```json
   "generate-corpus": "vite-node scripts/generate-corpus.ts"
   ```

   Preserve trailing commas / formatting as needed. The
   `dependencies` and `devDependencies` blocks should already reflect
   the three.js install from Task 2.

6. **Update `tsconfig.json`.** Add `"scripts"` to the `include` array
   so `tsc --noEmit` covers the generator. The new `include` should
   be:

   ```json
   "include": ["src", "test", "scripts", "vite.config.ts"]
   ```

7. **Delete `test/corpus/.gitkeep`.** The directory will be populated
   with STL files by the generator in Task 8.

8. **Run the generator.** Execute:

   ```
   pnpm generate-corpus
   ```

   Expected output (order may vary):

   ```
   Wrote .../test/corpus/tetrahedron.stl
   Wrote .../test/corpus/cube.stl
   Wrote .../test/corpus/octahedron.stl
   ```

   Verify the three files exist in `test/corpus/`. Each should be a
   plain-text ASCII STL starting with `solid` and ending with
   `endsolid`. Do not modify the file contents.

9. **Verify the toolchain stays green.** Run:

   ```
   pnpm type-check
   pnpm test:run
   pnpm build
   ```

   All three should still succeed. If any fail, stop and report.

10. **Create the session log** at
    `docs/sessions/0006-generate-test-corpus.md` with the content in
    **Appendix B**, copied verbatim.

11. **Update `docs/queue.md`.** APPEND this new line at the end of
    the open-items list:

    ```
    - [process] Before writing config-heavy prompts involving external
      libraries, fetch current docs and verify the patterns are still
      canonical. Surfaced 0005.
    ```

12. **Stage all changes and commit** with this message:

    ```
    feat: add test corpus generator and platonic-solid STL fixtures
    ```

    Files to stage (verify with `git status`):
    - `package.json`, `pnpm-lock.yaml` (modified — three.js added)
    - `tsconfig.json` (modified — `scripts` added to include)
    - `scripts/generate-corpus.ts` (new)
    - `test/corpus/tetrahedron.stl`,
      `test/corpus/cube.stl`,
      `test/corpus/octahedron.stl` (new)
    - `test/corpus/.gitkeep` (deleted)
    - `docs/queue.md` (modified — one line appended)
    - `docs/sessions/0006-generate-test-corpus.md` (new)

13. **Fast-forward `main` to the new commit.** From the main checkout:

    ```
    git merge --ff-only claude/<your-worktree-branch>
    ```

14. **Report back:** the final `main` HEAD hash, the three STL file
    paths, and confirmation that `type-check`, `test:run`, and `build`
    completed cleanly.

## Notes

- The STL files are committed sight-unseen on the assumption that
  three.js's geometries and `STLExporter` produce correct output.
  Visual inspection (opening the files in a 3D viewer) happens
  post-session by Evan, not as part of the verification step.
- Use `three/examples/jsm/exporters/STLExporter.js` as the import
  path — `three/addons/exporters/STLExporter.js` is the newer
  documented form but requires tsconfig path-mapping to resolve types
  cleanly. Using `examples/jsm` keeps the tsconfig simple at v1.
- The generator uses three.js's default geometry parameters (radius 1
  for the tetrahedron and octahedron, 1×1×1 for the cube). Different
  solids end up with different edge lengths, but the unfolding
  algorithm doesn't care about scale.
- Do not add any tests on the generator itself. Validation happens in
  Session 0007 when the mesh loader parses the STLs.
- If `pnpm` reports peer-dependency warnings during install, note them
  in your report but do not modify anything to resolve them unless
  they cause an actual error.
- If you discover any stale references in `project-state.md` while
  working (per the consistency-scan practice), surface them in your
  report rather than editing in this session. The strategist will
  decide whether to fix in this session or queue.

---

## Appendix A — `scripts/generate-corpus.ts`

```ts
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  TetrahedronGeometry,
  type BufferGeometry,
} from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

const exporter = new STLExporter();
const material = new MeshBasicMaterial();

const solids: { name: string; geometry: BufferGeometry }[] = [
  { name: "tetrahedron", geometry: new TetrahedronGeometry(1) },
  { name: "cube", geometry: new BoxGeometry(1, 1, 1) },
  { name: "octahedron", geometry: new OctahedronGeometry(1) },
];

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "test", "corpus");

for (const { name, geometry } of solids) {
  const mesh = new Mesh(geometry, material);
  const ascii = exporter.parse(mesh, { binary: false }) as string;
  const outPath = join(outDir, `${name}.stl`);
  writeFileSync(outPath, ascii);
  console.log(`Wrote ${outPath}`);
}
```

---

## Appendix B — Session log content

````markdown
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
````
