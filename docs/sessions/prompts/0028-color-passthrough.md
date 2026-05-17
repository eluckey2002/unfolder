# Session 0028 — Color Passthrough (OBJ Materials)

**Work type:** numbered session.
**Branch:** `session/0028-color-passthrough`.
**Land via:** worktree → PR → CI green → squash-merge per ADR 0006. PR
requires the `baseline-change` label.

## Goal

Per-face diffuse color from OBJ `.mtl` materials renders through to the
2D SVG output. Closes the "color" half of the v3 README "color/texture
passthrough" surface. **Texture (UV + image sampling) is deferred** —
v3 ships color only; texture is v5 territory per the phase plan.
Per-vertex color OBJ extensions and STL color extensions are also
deferred (naive-first).

## Context

- Coexists with 0027's foldability tint. Painter's-algorithm order
  (top-to-back of the final render): line work → foldability tint →
  face fills. In SVG document order this reverses: fills emitted
  earliest, foldability tint next, line work last. The foldability
  tint shifts colored faces' hues but does not occlude them;
  classification stays readable through the tint's low alpha.
- Mesh-face → color lookup is already a clean keying:
  `Piece.faces: number[]` (`src/core/recut.ts:36`) carries original
  mesh-face indices in `Layout2D.faces`-aligned order. At emit-time
  the k-th `FlatFace` in a piece corresponds to mesh-face
  `piece.faces[k]`. Same indirection pattern 0027's classifier used.
  Data-flow seam: implementer picks (a) optional `faceColors?` on
  `RenderablePiece` parallel to the edge-triplet pattern (one color
  entry per face, length = `edges.length / 3`) or (b) external
  lookup threaded via the `emitSvg` signature. The 0027 pattern
  favors (a); plan picks it explicitly.
- `src/core/parse-obj.ts:70` currently parses-and-ignores `usemtl`,
  `mtllib`, `g`, `o`, `s`, `vn`, `vt`. The session extends it to
  capture `mtllib` and `usemtl` without changing the rest.
- `.mtl` is a sibling file to the `.obj`. Both the dev server
  (browser `fetch` from `/test/corpus/`) and the baseline harness
  (`fs.readFileSync`) need a small sibling-path helper to load it.
- **MTL absent is the silent default.** Models without a sibling
  `.mtl` (most of the current corpus) render exactly as today —
  no fills, foldability tint visible on white background. Adding a
  `.mtl` is opt-in per model. This invariant is verifiable
  (gate 4 below).
- Naive-first per `README.md:78` ("Naive before optimized"): only
  `Kd` (diffuse RGB) is parsed; ambient/specular/emissive/shininess
  /maps ignored. The MTL fixture for the demo model can use one or
  two flat colors — no need to author a rich palette.

## Files

Modified:

- `src/core/parse-obj.ts` — track current material across `usemtl`;
  capture `mtllib` path references; attach per-face material name.
- `src/core/mesh.ts` — extend `Mesh3D` with two optional fields:
  one for per-face material names (parallel to `faces`), one for
  referenced `mtllib` paths (in source order). Both optional;
  pre-0028 callers that ignore them see no behavior change.
- `src/core/emit-svg.ts` — emit per-face fill polygon for each face
  carrying a resolved color, before the foldability-tint and
  line-work passes.
- `src/core/pipeline.ts` — `runPipeline` accepts an optional
  materials lookup (name → RGB); resolves each face's material
  name to a color and threads it to emit-time via the chosen seam.
- `src/core/tabs.ts` — if the chosen seam adds a field to
  `RenderablePiece`, the type lives here (parallel to 0027's
  `foldability?`).
- `src/app/main.ts` — fetch the companion `.mtl` for the demo OBJ
  if present; parse it; pass the materials lookup to `runPipeline`.
- `scripts/baseline-pipeline.ts` — when a sibling `.mtl` exists,
  load it and pass the materials lookup to `runPipeline`. Add a
  `materials` column.
- `docs/baseline-pipeline.md` — regenerated.
- `docs/baseline-v3.md` — trajectory note appended.
- `docs/decisions-log.md` — entry on MTL scope (Kd only) and the
  texture/UV/STL-color deferrals.

Created:

- `src/core/parse-mtl.ts` — MTL parser (name → diffuse RGB).
- `test/unit/parse-mtl.test.ts` — unit tests for the MTL parser.
- `test/unit/parse-obj.test.ts` (if absent — add) — assertions for
  `mtllib`/`usemtl` handling. Pre-0028 geometry-only assertions
  remain unchanged.
- `test/corpus/<model>.mtl` — author one MTL for one demo corpus
  model. Recommend `ginger-bread.obj` since 0027 made it the demo
  (a believable gingerbread-brown + frosting-white reads as a
  meaningful visual test). Alternatives are fine; the implementer
  picks during plan mode.
- `docs/sessions/0028-color-passthrough.md` — session log.

## Tasks

Implementer drafts the atomic 5-step TDD plan in plan mode before
code, per `CLAUDE.md` §1 ("Plan first for multi-file sessions").
Roughly:

1. Add `src/core/parse-mtl.ts` — pure parser, name → `{ diffuse }`
   lookup. `Kd` only; everything else ignored.
2. Extend `Mesh3D` with the two optional material fields.
3. Extend `parse-obj.ts` to track current material across `usemtl`
   and capture `mtllib` paths. Quad/n-gon fan-triangulation: every
   triangle from one source face shares its source's current
   material.
4. Author the MTL fixture for one corpus model.
5. Thread material resolution through `runPipeline`. Pick the seam
   (`RenderablePiece.faceColors?` vs external lookup) in plan mode.
6. Extend `emit-svg.ts` to emit per-face fill polygons before the
   foldability-tint and line-work passes.
7. Wire `src/app/main.ts` to fetch and apply the companion MTL.
8. Extend `scripts/baseline-pipeline.ts` to load MTL when present
   and surface a `materials` column.
9. Visual verification: dev-server screenshot of the colored demo
   model showing face fills + foldability tints layered correctly.
10. Session log + decisions-log entry.

## Specs

- **`parseMtl` (pure function)** — given `.mtl` file contents
  (string), return a name-keyed lookup of diffuse RGB triplets.
  Implementer picks the container shape (`Map<string, …>` vs
  `Record<string, …>`); behavior is what matters.

  - Recognises only `newmtl <name>` and `Kd <r> <g> <b>`. Every
    other directive (`Ka`, `Ks`, `Ke`, `Ns`, `d`, `Tr`, `illum`,
    `map_*`, …) is silently ignored.
  - RGB values are MTL-spec floats in `[0, 1]`. The lookup
    preserves them as floats; SVG hex conversion happens at
    `emit-svg` time.
  - Comments (`#`) and whitespace handled the same way
    `parse-obj.ts` does it.
  - Throws on `newmtl` with no name, and on `Kd` with non-finite
    or out-of-`[0, 1]` channel values. A file with only comments
    / whitespace returns an empty lookup (not an error — an
    empty MTL is valid, just useless).

- **`parseObj` extension** — preserves the existing
  geometry-only contract for callers that don't read the new
  fields. Side-channel additions:

  - Each `mtllib <path …>` line appends every space-separated
    path to `Mesh3D.mtllibs` (order-preserving; deduplicate
    if the same path appears twice).
  - Each `usemtl <name>` sets a "current material" cursor;
    subsequent `f` lines record that name in
    `Mesh3D.faceMaterials` (parallel-indexed to `faces`). Faces
    before the first `usemtl` record `undefined`. `usemtl off`
    (or a `usemtl` line with no name) clears the cursor —
    subsequent faces record `undefined` until the next named
    `usemtl`.
  - Quad/n-gon fan-triangulation: every triangle from one
    source face inherits the source face's current material.
  - Existing throws (non-finite vertex, zero/out-of-range face
    index, fewer-than-3-vertex face, no-faces) and existing
    handling (comments, leading whitespace, `#`-on-line) are
    unchanged.

- **Material resolution (caller-side)** — `parse-obj` returns
  *names* via `Mesh3D.faceMaterials`. The caller (browser app or
  baseline harness) iterates `mesh.mtllibs`, loads each sibling
  file, calls `parseMtl` on each, merges into a single
  name → RGB lookup (later definition wins for duplicates,
  matching common MTL semantics), then passes the merged lookup
  to `runPipeline`. `runPipeline` resolves each face's material
  name against the lookup; unresolved names (referenced but
  absent in any loaded MTL) silently treat the face as
  uncolored.

- **`emit-svg` extension** — for each piece carrying per-face
  colors, emit a `<polygon>` fill per colored face *before* the
  foldability-tint polygon and *before* any line-work elements.
  Colors render as `fill="#RRGGBB"` (sRGB hex; multiply each
  `[0, 1]` channel by 255, round, clamp). Faces without color
  emit no fill polygon (the existing no-fill behavior; the
  foldability tint composites onto white where no fill exists).

  *(Z-order, top-to-back in the final render: line work →
  foldability tint → face fills → page border. In SVG document
  order, the page border emits first (existing), then face fills,
  then foldability tint, then line work.)*

- **`scripts/baseline-pipeline.ts` `materials` column** — count
  of *distinct material names referenced and resolved* per model
  (i.e. the number of unique non-`undefined` entries in
  `mesh.faceMaterials` whose name resolved to a color in the
  merged MTL lookup). `0` for models with no `.mtl`. Summary
  line names per-corpus total distinct materials and the count
  of models with any color data — exact wording is illustrative,
  not verbatim, so long as both numbers appear.

- **Invariants under the refactor:**

  - Models without `.mtl` produce **byte-identical** SVG output
    to the post-0027 reference. The new fill emission is gated
    on "color present for this face"; with no resolved colors
    the emit path is identical. Verifiable per gate 4 below.
  - Piece count, page count, tab count, cut length, foldability
    counts **must not change**. Color is an aesthetic/render
    concern; the geometry pipeline is otherwise untouched.
  - `git diff docs/baseline-pipeline.md` after Task 8 lands
    shows *only* the new `materials` column + summary line.
    Any other column shift means an upstream stage was
    accidentally affected — stop and investigate.

## Verification

Standard gates; **report the test count, do not predict it**:

1. `pnpm test:run` — all passing
2. `pnpm type-check` — clean
3. `pnpm build` — clean
4. **Hard gate (no-color invariant):** for any corpus model
   without a `.mtl` (e.g. `cube.obj`, `octahedron.stl`), the
   emitted SVG strings are byte-identical to a pre-0028
   reference. Capture the references in plan mode (before
   Task 6); diff after Task 6 lands. Stop and investigate
   any diff.
5. **Hard gate (baseline diff):** `git diff
   docs/baseline-pipeline.md` shows only the new `materials`
   column + summary line; existing columns byte-identical.
6. **Visual gate per `CLAUDE.md` §1** ("Verify UI/CSS against
   real renders"): dev-server screenshot at a viewport showing
   the colored demo model. Face fills must be visible, line
   work crisp on top, foldability tints discernible as hue
   overlays (not obliterating the fill). Sanity-check the
   colors against the authored MTL — the named diffuse values
   should read as the intended hue (e.g. gingerbread-brown
   actually reads brown, not olive or maroon).

## Appendix

None.
