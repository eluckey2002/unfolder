# Session 0028 — Color Passthrough (OBJ Materials)

## What was attempted

Ship per-face diffuse color from OBJ `.mtl` materials through to the
2D SVG output. Closes the "color" half of the README's v3
"color/texture passthrough" surface. Texture (UV + image sampling),
per-vertex color OBJ extensions, and STL color extensions explicitly
deferred to v5 per the prompt's naive-first scoping. Data-flow seam
mirrors 0027's `foldability?` pattern: a new optional `faceColors?`
field on `RenderablePiece`, populated by a downstream pass in
`runPipeline`, consumed by `emit-svg` as a per-face fill polygon
emitted before the foldability tint and line work.

## What shipped

### Ten commits on `session/0028-color-passthrough`

1. `630cdef feat(parse-mtl): MTL parser for newmtl + Kd diffuse` — Task 1
2. `5860313 feat(mesh): optional faceMaterials + mtllibs on Mesh3D` — Task 2
3. `babe8bf feat(parse-obj): capture usemtl materials and mtllib paths` — Task 3
4. `cc2097c feat(corpus): ginger-bread.mtl single-color demo fixture` — Task 4
5. `5d4bd95 feat(tabs): optional faceColors on RenderablePiece` — Task 5
6. `16091b5 feat(pipeline): resolve materials to per-face colors` — Task 6
7. `e7ca438 feat(emit-svg): per-face diffuse fill before tints` — Task 8
8. `f967ece feat(app): load ginger-bread.mtl and pass to runPipeline` — Task 10 (also fixed `paginate.transformPiece` to preserve `faceColors`)
9. `8ef742b feat(baseline): materials column + per-corpus summary line` — Task 11
10. `1bf226b docs(0028): baseline-v3 trajectory + decisions-log entries` — Task 12

Tasks 7 and 9 are manual gate steps (pre / post SVG-invariant probe) —
no commits, transient `scripts/probe-svg-invariant.ts` deleted before
PR per the plan.

### Code surface

- **`src/core/parse-mtl.ts` (new)** — `parseMtl(contents): Map<string, RGB>`. Pure function over a `.mtl` string. Recognises only `newmtl` and `Kd`; every other directive silently ignored (including `map_Kd` — visual gate depends on this). Throws on `newmtl` with no name and on `Kd` non-finite / out-of-`[0,1]` channels. Exports `RGB = [number, number, number]`.
- **`src/core/mesh.ts`** — extended `Mesh3D` with two optional fields: `faceMaterials?: (string | undefined)[]` (parallel-indexed to `faces`) and `mtllibs?: string[]` (in source order, deduped). Optional + materials-aware parsers only — STL flows through unchanged.
- **`src/core/parse-obj.ts`** — tracks a current-material cursor across `usemtl`. Bare `usemtl` and `usemtl off` clear the cursor (permissive read of the loose-spec corner). `mtllib` paths captured deduped in source order; fan-triangulation propagates the source face's material to every emitted triangle. Material fields conditionally attached so material-free OBJs produce byte-identical `Mesh3D` shape.
- **`src/core/tabs.ts`** — added optional `faceColors?: (RGB | undefined)[]` on `RenderablePiece` adjacent to 0027's `foldability?`. Comment documents the alignment: `faceColors[k]` corresponds to `edges[3k..3k+3]` per the existing face-triplet invariant.
- **`src/core/pipeline.ts`** — `runPipeline` accepts an optional third argument `materials?: Map<string, RGB>`. Resolution pass runs **immediately after `buildRenderablePieces`** (before `paginate`) — color depends on face identity + lookup, no post-paginate dependency. Walks `recut.pieces[p].faces[k]` to derive the mesh-face index, reads `mesh.faceMaterials`, resolves to RGB. `faceColors` is only attached when at least one face resolves to a color — preserves the no-color invariant on the no-materials and all-unresolved paths.
- **`src/core/paginate.ts`** — `transformPiece` now preserves `faceColors` through placement. Pre-0028 it returned only `{ edges }`, silently dropping every other piece field; 0027's `foldability?` survived only because runPipeline re-assigned it post-paginate. `faceColors` doesn't depend on placement so it's forwarded directly. `foldability?` is still intentionally not forwarded — re-assignment post-paginate keeps geometry-driven classification honest.
- **`src/core/emit-svg.ts`** — new per-face fill pass between the page-border rect and the foldability-tint loop. Each piece's `faceColors` iterates in face-triplet order; each colored face becomes one `<polygon class="face-fill" fill="#RRGGBB" stroke="none">`. Hex encoding rounds `[0,1]` floats to nearest integer in 0-255 and zero-pads to six digits. Undefined entries emit nothing — the foldability tint composites onto white where no fill exists.
- **`src/app/main.ts`** — added Vite `?raw` import for `test/corpus/ginger-bread.mtl` alongside the existing OBJ `?raw` import, parses via `parseMtl`, and threads the lookup as the third argument to `runPipeline`.
- **`scripts/baseline-pipeline.ts`** — harness loads sibling `.mtl` files referenced by `mesh.mtllibs` and threads the merged lookup into `runPipeline`. New `materials` column counts distinct names that BOTH have a face attached AND resolve in the lookup. New per-corpus summary line: "Materials: N distinct across M model(s) with color data."
- **`test/corpus/ginger-bread.mtl` (new)** — single `newmtl colormap` block, `Kd 0.55 0.30 0.10` (`#8c4d1a` ≈ gingerbread brown). First MTL file in the corpus.
- **Tests** — 9 new unit tests in `test/unit/parse-mtl.test.ts`; 4 new in `test/unit/parse-obj.test.ts` (split existing "ignores noise" + 3 capture tests); 3 new in `test/unit/pipeline.test.ts` (materials resolution + no-color invariant + unresolved-name); 4 new in `test/unit/emit-svg.test.ts` (fill emission order + no-color path + undefined entries + hex round-to-nearest). **Suite: 189 passing** (was 167 after 0027 → 168 baseline; this session adds 21 new tests).

### Documentation

- **`docs/baseline-pipeline.md`** — regenerated. New `materials` column with `1` for `ginger-bread.obj`, `0` everywhere else. All other columns byte-identical to post-0027 (gate 5 verified via `git diff`). New summary line "Materials: 1 distinct across 1 model(s) with color data."
- **`docs/baseline-v3.md`** — appended "v3 trajectory — after session 0028 (color passthrough)" section.
- **`docs/decisions-log.md`** — two entries:
  - MTL parser is Kd-only; texture / UV / STL color deferred.
  - `paginate.transformPiece` preserves `faceColors` (with rationale for why `foldability?` is still re-assigned post-paginate instead of forwarded).

## Verification

- `pnpm test:run` — **189 / 189 passing**
- `pnpm type-check` — clean
- `pnpm build` — clean (~580 KB bundle)
- **Hard gate (no-color invariant):** transient `scripts/probe-svg-invariant.ts` (uncommitted, deleted post-gate) ran `runPipeline` + `emitSvg` on `cube.obj` and `octahedron.stl` before Task 8 and after Tasks 8 + 10 (after the paginate fix). `diff -u before/cube-p0.svg after/cube-p0.svg` and the matching octahedron diff both produced empty output. Byte-identical preserved.
- **Hard gate (baseline diff):** `git diff docs/baseline-pipeline.md` shows only the new `materials` column + summary line + the daily-regenerated date string. Existing 12 columns byte-identical row-for-row.
- **Visual gate:** generated `ginger-bread.obj + ginger-bread.mtl` SVG via a transient `vite-node` probe (`scripts/probe-visual.ts`, uncommitted, deleted post-gate). Output: 1 page, 80 face-fill polygons (one per face), all `fill="#8c4d1a"`; 2 foldability-tint polygons (one per piece, 2 pieces); 240 line elements (= 80 faces × 3 edges). Painter's stack ordering verified in the SVG document order: page-border rect → 80 fills → 2 tints → 240 lines. `pnpm dev` boots clean (Vite ready in 279 ms, served on the next free port). Full browser-screenshot pass was not run from this session shell (no headless browser tooling); the SVG inspection plus dev-server smoke is the substitute. Hex spot-check: `Kd 0.55 0.30 0.10 → round(0.55*255)=140=0x8c, round(0.30*255)=77=0x4d, round(0.10*255)=26=0x1a → #8c4d1a` ≈ believable gingerbread brown.

## What we learned

1. **`paginate.transformPiece` silently drops fields.** During the visual gate, `renderable[0].faceColors` was correctly populated by `runPipeline`'s resolution pass but `placed.piece.faceColors` was undefined in the page output — `transformPiece` returned only `{ edges }`. 0027's `foldability?` only survived because runPipeline re-assigned it after paginate. Fixed in this session to forward `faceColors` explicitly; left `foldability?` un-forwarded since post-paginate geometry should drive its re-classification anyway. Logged as a decisions-log entry so future contributors don't accidentally reintroduce the silent strip.
2. **The pre/post SVG probe gate is high-value insurance.** Without the byte-diff on `cube.obj` and `octahedron.stl`, the paginate fix could have leaked into the no-materials path in a way no unit test was structured to catch. Worth the transient `scripts/probe-svg-invariant.ts` cost.
3. **The corpus has exactly one OBJ material name (`colormap`).** Every committed OBJ that declares `usemtl` uses that single name. A multi-color demo would have required either editing committed corpus content or authoring a new corpus model. Resolved per Evan's call: single-color naive-first demo.
4. **Vite `?raw` for both OBJ and MTL is the minimal-change path.** The 0029 file-loader UI (per the 2026-05-15 decisions-log entry) is the right place for a runtime `fetch()` refactor, not 0028's scope.

## Open follow-ups

- **Texture / UV passthrough** — explicitly deferred to v5 per the prompt and the new decisions-log entry. No queue item added; the deferral is documented at the decision level.
- **STL color extensions** — same deferral. Honest STL color is the same story as texture: a v5 concern.
- **Multi-color gingerbread demo** — would require editing `ginger-bread.obj` to introduce a second `usemtl frosting` partway through its face range, with a PROVENANCE.md note. Not added to the queue — the single-color demo satisfies the visual-gate intent and matches naive-first scope. If a future visual-quality session wants a richer palette, it can author multi-color fixtures or pull a real-world OBJ with native multi-material support.

## Handoff

- **Branch / worktree:** `session/0028-color-passthrough` at `.claude/worktrees/session+0028-color-passthrough/`
- **Commits (subject only per 2026-05-15 decision):** `feat(parse-mtl): MTL parser for newmtl + Kd diffuse` → `feat(mesh): optional faceMaterials + mtllibs on Mesh3D` → `feat(parse-obj): capture usemtl materials and mtllib paths` → `feat(corpus): ginger-bread.mtl single-color demo fixture` → `feat(tabs): optional faceColors on RenderablePiece` → `feat(pipeline): resolve materials to per-face colors` → `feat(emit-svg): per-face diffuse fill before tints` → `feat(app): load ginger-bread.mtl and pass to runPipeline` → `feat(baseline): materials column + per-corpus summary line` → `docs(0028): baseline-v3 trajectory + decisions-log entries` → `docs(0028): session log`.
- **Verification:** `pnpm test:run` 189 passing; `pnpm type-check` clean; `pnpm build` clean (~580 KB); baseline-pipeline.md diff shows only the new `materials` column + summary line (pre-0028 columns byte-identical); no-color invariant SVG byte-diff empty on `cube.obj` and `octahedron.stl`.
- **Decisions made or deferred:**
  - [flowed-silently] Data-flow seam: optional `faceColors?` on `RenderablePiece`, populated by a downstream pass in `runPipeline`, mirroring 0027's `foldability?`. Per-face cardinality (not per-piece) because color is per-face data.
  - [flowed-silently] Materials parameter on `runPipeline`: third optional argument (`materials?: Map<string, RGB>`), default behavior unchanged.
  - [flowed-silently] Resolution pass position: **before** `paginate`, not after — color is layout-independent.
  - [surfaced-and-proceeded] `paginate.transformPiece` field forwarding: visual gate caught the silent-drop; fixed inline (forward `faceColors`, leave `foldability?` un-forwarded). Decision logged.
  - [surfaced-and-proceeded] Single-color gingerbread demo (vs. multi-color via OBJ edit) — Evan's call during plan-mode AskUserQuestion. Rationale: naive-first scope, no corpus edits.
  - [surfaced-and-proceeded] MTL loading in `main.ts` via Vite `?raw` import (vs. runtime `fetch()` refactor) — Evan's call during plan-mode AskUserQuestion. Rationale: minimal change; runtime fetch belongs to 0029's file-loader scope per `decisions-log.md` 2026-05-15 entry.
  - No ADR — this is an endpoint extension on the existing pipeline contract, not a structural change.
- **Queue / roadmap deltas:** None added; none closed.
- **Open questions for the strategist:** None. Color passthrough is shipped; texture and STL color are explicitly deferred to v5 with the deferral documented in the decisions log.
