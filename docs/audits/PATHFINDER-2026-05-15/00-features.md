# Feature Inventory

Source tree: `src/` (15 files) + `scripts/` + `test/`. Linear pipeline architecture (ADR 0001). Each stage is a pure function consuming the previous stage's output. Per CLAUDE.md, v1 has been fully replaced by v2 — no parallel implementations remain.

Six features, organised by pipeline role:

| # | Feature | Purpose | Core files | Entry point |
|---|---|---|---|---|
| F1 | **Input parsing** | File text → indexed `Mesh3D` | `src/core/parse-stl.ts`, `src/core/parse-obj.ts`, `src/core/mesh.ts` | `parseStl(contents)` at [parse-stl.ts:15](src/core/parse-stl.ts:15), `parseObj(contents)` at [parse-obj.ts:17](src/core/parse-obj.ts:17) |
| F2 | **Topology + edge weighting** | `Mesh3D` → `DualGraph` + per-edge weight array | `src/core/adjacency.ts`, `src/core/dihedral.ts` | `buildAdjacency(mesh)` at [adjacency.ts:42](src/core/adjacency.ts:42), `computeDihedralWeights(mesh, dual)` at [dihedral.ts:67](src/core/dihedral.ts:67) |
| F3 | **Spanning tree** | `DualGraph + weights` → fold-tree / cut-set partition | `src/core/spanning-tree.ts` | `buildSpanningTree(dual, weights, root?)` at [spanning-tree.ts:79](src/core/spanning-tree.ts:79) |
| F4 | **2D layout + overlap resolution** | `Mesh3D + tree` → connected, overlap-free pieces | `src/core/flatten.ts`, `src/core/overlap.ts`, `src/core/recut.ts` | `buildLayout(mesh, tree)` at [flatten.ts:88](src/core/flatten.ts:88), `detectOverlaps(layout)` at [overlap.ts:46](src/core/overlap.ts:46), `recut(tree, layout, overlaps)` at [recut.ts:239](src/core/recut.ts:239) |
| F5 | **Output assembly** | Pieces → tabbed renderables → paged SVG strings | `src/core/tabs.ts`, `src/core/paginate.ts`, `src/core/emit-svg.ts` | `buildRenderablePieces(recut)` at [tabs.ts:61](src/core/tabs.ts:61), `paginate(pieces, page)` at [paginate.ts:98](src/core/paginate.ts:98), `emitSvg(page)` at [emit-svg.ts:22](src/core/emit-svg.ts:22) |
| F6 | **Application shell** | Wire pipeline + 3D preview + DOM mount | `src/app/main.ts`, `src/app/render.ts` | top-level statements in [main.ts:24](src/app/main.ts:24), `createViewport(container, mesh)` at [render.ts:40](src/app/render.ts:40) |

## Notes on boundaries

- `src/core/mesh.ts` is **types only** ([mesh.ts:9-19](src/core/mesh.ts:9)); folded into F1 since it is the parse-stage output contract.
- F2 is two stages but both consume `Mesh3D` and produce per-adjacency data; they always run as a pair (`buildAdjacency` then `computeDihedralWeights`) — keeping them in one feature reflects how they are used and tested together.
- F4 bundles three stages because they form a fix-point: `flatten → overlap → recut`. `recut` then **re-emits a single layout per piece** without reflattening (see [recut.ts:9-15](src/core/recut.ts:9)).
- F6 contains the only impure code in `src/` (DOM mutation, three.js, `console.log`). Everything in `src/core/` is pure per ADR 0001.

## Data flow

```
file string
    │
    ▼
F1 ── parseStl / parseObj ──► Mesh3D
    │
    ▼
F2 ── buildAdjacency ──► DualGraph
       computeDihedralWeights ──► weights[]
    │
    ▼
F3 ── buildSpanningTree ──► SpanningTree { folds, cuts, parent }
    │
    ▼
F4 ── buildLayout ──► Layout2D
       detectOverlaps ──► FaceOverlap[]
       recut ──► RecutResult { pieces, cuts }
    │
    ▼
F5 ── buildRenderablePieces ──► RenderablePiece[] (folds, cuts, glue tabs)
       paginate ──► Page[]
       emitSvg ──► svg string (per page)
    │
    ▼
F6 ── main.ts wires all of the above; render.ts shows 3D preview
```
