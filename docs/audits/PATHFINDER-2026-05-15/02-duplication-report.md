# Duplication report

Four duplicated concerns worth consolidating, plus one near-duplication ruled out as legitimate specialization. The codebase is small and tight; most pure-pipeline modules contain no internal duplication.

## D1 — Canonical edge / pair key (3 copies)

The lexical pattern `a < b ? \`${a},${b}\` : \`${b},${a}\`` for "make a deterministic string key from an unordered pair of integers" appears in three files, each as a private top-level constant.

| # | Location | Name | Used for |
|---|---|---|---|
| 1 | [adjacency.ts:39-40](src/core/adjacency.ts:39) | `canonicalEdgeKey` | Vertex-pair key when grouping mesh edges by shared endpoints |
| 2 | [flatten.ts:37-38](src/core/flatten.ts:37) | `canonicalPairKey` | Face-pair key when looking up the fold adjacency between parent and child face |
| 3 | [tabs.ts:30-31](src/core/tabs.ts:30) | `canonicalEdgeKey` | Vertex-pair key when matching piece edges against the recut cut set |

Why diverged: never extracted; each module wrote the helper inline as it needed it. The implementations are byte-for-byte equivalent. Two of three even use the same name; the difference between an "edge" key (vertex IDs) and "pair" key (face IDs) is the caller's semantics, not the helper's.

**Verdict:** accidental duplication. Consolidate.

## D2 — Union-find (2 copies)

Two near-identical disjoint-set-union implementations exist with path-compressing find and union-by-rank over a `parent[]` + `rank[]` pair.

| # | Location | Shape |
|---|---|---|
| 1 | [spanning-tree.ts:38-77](src/core/spanning-tree.ts:38) | `makeUnionFind(n) → { find, union }` factory returning closure; `union` returns boolean indicating "actually merged" |
| 2 | [recut.ts:183-208](src/core/recut.ts:183) | Inline arrays inside `connectedComponents`; same algorithm; `union` returns void |

Both modules use Kruskal-style component tracking, but for slightly different reasons: spanning-tree builds the MST itself, recut builds components of "fold edges minus cuts." The data structure is identical.

Why diverged: written separately, in different sessions, by different agents (session 0011 vs session 0016). Neither cited the other.

**Verdict:** accidental duplication. Consolidate.

## D3 — Pipeline orchestration (2 copies of the same 8-call chain)

The same sequence of pipeline stage invocations appears in two distinct orchestrators with different I/O.

| # | Location | Source / sink |
|---|---|---|
| 1 | [main.ts:24-38](src/app/main.ts:24) | Hardcoded `?raw` tetrahedron import → DOM cards; only `parseStl` reachable |
| 2 | [scripts/baseline-pipeline.ts:50-130](scripts/baseline-pipeline.ts:50) | Iterates `test/corpus/*.{stl,obj}` → markdown table + console; both parsers via ext sniff at L66 |

The call sequence in both:

```
parseStl|parseObj → buildAdjacency → computeDihedralWeights →
buildSpanningTree → buildLayout → detectOverlaps → recut →
buildRenderablePieces → paginate → emitSvg
```

Why diverged: main.ts is the application; baseline-pipeline.ts is the verification harness. Each evolved its own try/catch logic, format sniffing (or lack of it), and reporting.

The corpus notes a third occurrence in `test/property/pipeline.test.ts` and `test/integration/pipeline.test.ts` walking the same chain with property-test invariant checks rather than DOM/markdown sinks. Not directly read in this audit but cited as additional evidence the call sequence is canonical.

**Verdict:** accidental duplication. The pipeline is one thing called from many places. Consolidate to a single `runPipeline(mesh, opts) → Page[]` (or a stream of stage outputs) and let each caller plug its own sink.

## D4 — Vertex deduplication ("intern 6-decimal key")

Both parsers maintain a `vertices: Vec3[]` plus a `vertexIndex: Map<string, number>` plus an `internVertex(x, y, z)` closure with identical 6-decimal `toFixed(6)` keys.

| # | Location |
|---|---|
| 1 | [parse-stl.ts:20-32](src/core/parse-stl.ts:20) |
| 2 | [parse-obj.ts:18-31](src/core/parse-obj.ts:18) |

Plus identical finiteness-check error semantics ([parse-stl.ts:44-46](src/core/parse-stl.ts:44), [parse-obj.ts:64-68](src/core/parse-obj.ts:64)).

The parse-obj docstring even says "the same way `parseStl` does it, keeping the `Mesh3D` contract uniform across both parsers" — the duplication is intentional but unowned.

**Verdict:** accidental duplication. Consolidate the dedup primitive; keep the two format-specific outer parsers (those are legitimately format-specialized).

## N1 — Not a duplication: parse-stl vs parse-obj as a whole

The two parsers look superficially similar but serve genuinely different file formats: STL has 3-vertex faces only and no vertex sharing in source, while OBJ has shared `v` lines, polygonal faces requiring fan triangulation, negative-index references, and irrelevant constructs (`vn`, `vt`, `g`, `usemtl`) to skip. The outer parsing loop logic does not unify cleanly. Only the inner `internVertex` primitive (see D4) is shared concern.

**Verdict:** legitimate specialization. Do not unify outer functions.

## Summary table

| ID | Concern | Locations | Severity | Verdict |
|---|---|---|---|---|
| D1 | Canonical pair key | adjacency.ts:39-40, flatten.ts:37-38, tabs.ts:30-31 | low (5 LOC × 3) | consolidate |
| D2 | Union-find | spanning-tree.ts:38-77, recut.ts:183-208 | medium (~40 LOC × 2) | consolidate |
| D3 | Pipeline call chain | main.ts:24-38, scripts/baseline-pipeline.ts:50-130 (+tests) | medium (logical) | consolidate |
| D4 | Vertex intern + finite check | parse-stl.ts:20-46, parse-obj.ts:18-31,64-68 | low (~15 LOC × 2) | consolidate (helper only) |
| N1 | parse-stl vs parse-obj outer | parse-stl.ts, parse-obj.ts | n/a | keep separate |
