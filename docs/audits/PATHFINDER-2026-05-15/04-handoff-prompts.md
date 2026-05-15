# Handoff prompts

Four independent `/make-plan` prompts, one per unified system in `03-unified-proposal.md`. They can be run in any order. Each is self-contained and can be copy-pasted directly.

---

## U1 — Canonical pair key helper

```
/make-plan

Goal: consolidate three byte-identical copies of the "canonical unordered pair → string key" helper into one shared module `src/core/pair-key.ts`.

Target unified component: `src/core/pair-key.ts` exporting

    export const canonicalPairKey = (a: number, b: number): string =>
      a < b ? `${a},${b}` : `${b},${a}`;

Exact call sites to rewrite (from PATHFINDER-2026-05-15/02-duplication-report.md, D1):
- src/core/adjacency.ts:39-40 — delete local `canonicalEdgeKey`, import `canonicalPairKey` from `./pair-key.js`, update one call site at adjacency.ts:53.
- src/core/flatten.ts:37-38 — delete local `canonicalPairKey`, import, update call sites at flatten.ts:93 and flatten.ts:123.
- src/core/tabs.ts:30-31 — delete local `canonicalEdgeKey`, import, update call sites at tabs.ts:67, tabs.ts:76, tabs.ts:90.

Reference: PATHFINDER-2026-05-15/01-flowcharts/F2-topology.md, F4-layout.md, F5-output.md.

Anti-patterns to reject in the plan:
- Do NOT introduce a generic "key utilities" module with a registry of key strategies. One function, one file.
- Do NOT keep a deprecated alias in any of the old locations. Delete the inline helpers.
- Do NOT change the existing pair key format (e.g. switch to a tuple, hash, or BigInt) — any change cascades through every Map<string, …> in the pipeline.

Verification:
- `pnpm test` (vitest) and `pnpm baseline` pass with byte-identical baseline-pipeline.md output.
- `rg "a < b \\? .*\\$\\{a\\}" src/core/` returns exactly one hit (in `pair-key.ts`).
```

---

## U2 — Union-find helper

```
/make-plan

Goal: extract a single union-find factory module and replace the two existing copies (one already factory-shaped, one inline) so disjoint-set behaviour lives in exactly one place.

Target unified component: `src/core/union-find.ts` exporting

    export interface UnionFind {
      find: (x: number) => number;
      /** Returns true if a and b were in different sets (the union happened). */
      union: (a: number, b: number) => boolean;
    }
    export function makeUnionFind(n: number): UnionFind { … }

Implementation is the existing factory at src/core/spanning-tree.ts:38-77, lifted verbatim.

Exact call sites to rewrite (from PATHFINDER-2026-05-15/02-duplication-report.md, D2):
- src/core/spanning-tree.ts:38-77 — delete the local `UnionFind` interface and `makeUnionFind` factory; import from `./union-find.js`. Existing usage at spanning-tree.ts:101-107 is unchanged.
- src/core/recut.ts:183-208 — inside `connectedComponents`, delete the inline `ufParent[]`/`rank[]`/`find`/`union` block. Replace with:
    const uf = makeUnionFind(faceCount);
    for (const [childFace, fold] of parentFold) {
      if (cuts.has(childFace)) continue;
      uf.union(fold.faceA, fold.faceB);
    }
    // ... then use uf.find(i) at recut.ts:217
  Discard the boolean return of `uf.union`; recut doesn't need it. No semantic change.

Reference: PATHFINDER-2026-05-15/01-flowcharts/F3-spanning-tree.md, F4-layout.md.

Anti-patterns to reject in the plan:
- Do NOT generalise the API to weighted union-find, persistent union-find, or generic-typed elements (`UnionFind<T>`). Mesh face indices are `number`; keep it that way.
- Do NOT add a `size()` or `groups()` method on speculation. `recut` builds its components by walking `find(i)` for every i; that pattern is fine and shouldn't be wrapped.
- Do NOT change union-by-rank to union-by-size or path-halving — keep the existing algorithm to avoid altering the deterministic output of `buildSpanningTree`.

Verification:
- `pnpm test` passes — especially `test/unit/spanning-tree.test.ts` and `test/unit/recut.test.ts`.
- `pnpm baseline` produces byte-identical baseline-pipeline.md (deterministic output is preserved).
- `rg "while \\(parent\\[r\\] !== r\\)" src/core/` returns exactly one hit (in `union-find.ts`).
```

---

## U3 — Shared vertex interner

```
/make-plan

Goal: extract the duplicated 6-decimal vertex deduplication helper out of parse-stl and parse-obj into a shared module while keeping the two outer parsers separate (the formats are legitimately different — see PATHFINDER-2026-05-15/02-duplication-report.md, N1).

Target unified component: `src/core/intern-vertex.ts` exporting

    export interface VertexInterner {
      intern: (x: number, y: number, z: number) => number;
      readonly vertices: Vec3[];
    }
    export function makeVertexInterner(): VertexInterner { … }

`intern` MUST validate `Number.isFinite` on every coordinate and throw a clear error including the failed (x, y, z) triple. Key construction uses `toFixed(6)` exactly as the existing parsers do — that 6-decimal convention is the established cross-parser contract.

Exact call sites to rewrite (from PATHFINDER-2026-05-15/02-duplication-report.md, D4):
- src/core/parse-stl.ts:20-32 — delete `vertices[]`, `vertexIndex` Map, `internVertex` closure; replace with `const v = makeVertexInterner()`. Replace the call at parse-stl.ts:48 with `v.intern(x, y, z)`. Drop the local finiteness check at parse-stl.ts:44-46 (now inside `intern`). Return `{ vertices: v.vertices, faces }`.
- src/core/parse-obj.ts:18-31 — same pattern. Replace the call at parse-obj.ts:69. Drop the local finiteness check at parse-obj.ts:64-68. Return `{ vertices: v.vertices, faces }`.

Reference: PATHFINDER-2026-05-15/01-flowcharts/F1-input-parsing.md.

Anti-patterns to reject in the plan:
- Do NOT make the dedup tolerance configurable (no `{ decimals: 6 }` option). The 6-decimal contract is shared across both parsers; one global constant.
- Do NOT extract a third helper for "parse a finite number" — `Number.isFinite` is plenty.
- Do NOT change error message wording in a way that breaks any unit test that asserts on substrings. Check test/unit/parse-stl.test.ts and test/unit/parse-obj.test.ts before editing error strings.
- Do NOT merge the two outer parsers. The format-specific outer loops are legitimate specialization per N1.

Verification:
- `pnpm test` passes — especially the parser test files. Update any error-message string assertions to match the new "intern-vertex" prefix.
- `pnpm baseline` produces byte-identical vertex/face counts for every STL and OBJ model in `test/corpus/`.
```

---

## U4 — Unified pipeline orchestrator

```
/make-plan

Goal: collapse the duplicated eight-stage pipeline call chain (currently re-encoded in src/app/main.ts, scripts/baseline-pipeline.ts, and the property/integration test files) into a single `src/core/pipeline.ts` function. Callers stop encoding the stage sequence.

Target unified component: `src/core/pipeline.ts` exporting

    import type { Mesh3D } from "./mesh.js";
    import type { PageSpec } from "./paginate.js";
    import { LETTER } from "./paginate.js";
    // ... internal imports for buildAdjacency, etc.

    export function runPipeline(mesh: Mesh3D, page: PageSpec = LETTER): {
      dual; weights; tree; layout; overlaps; recut; renderable; pages;
    } { … }

The body is the existing call sequence verbatim — see src/app/main.ts:31-38 and the post-parse block at scripts/baseline-pipeline.ts:74-128.

Exact call sites to rewrite (from PATHFINDER-2026-05-15/02-duplication-report.md, D3):
- src/app/main.ts:31-38 — delete the eight individual stage imports and the eight sequential calls. Import only `runPipeline` plus the parsers. Replace with `const { pages } = runPipeline(mesh);`. The DOM emission loop at main.ts:40-51 and console.log at main.ts:53-55 stays. main.ts may still need `emitSvg` for the per-page render — keep that import.
- scripts/baseline-pipeline.ts:74-128 — replace the six try/catch stage blocks with one `try { const r = runPipeline(mesh); ... } catch (e) { ... }`. To preserve the per-stage `failed at X` labels in the baseline markdown, throw a `class StageError extends Error { constructor(public stage: string, public cause: Error) ... }` from `runPipeline` (catch internally and re-throw tagged) — the harness pattern-matches `instanceof StageError` to fill `r.pipeline`. If the team finds StageError objectionable, drop the per-stage label and accept "failed at pipeline" — the harness is internal tooling.
- test/property/pipeline.test.ts and test/integration/pipeline.test.ts — if they walk the same chain, update to call `runPipeline` and assert on intermediate values from the returned object. (Read these files in the plan phase before deciding scope; the duplication report cites the corpus, not direct reads.)

Reference: PATHFINDER-2026-05-15/01-flowcharts/F6-app-shell.md, plus the corresponding flowcharts for each stage.

Anti-patterns to reject in the plan:
- Do NOT introduce a "stage registry" or pluggable pipeline. One linear sequence, one function body. If a future variant pipeline is needed, it gets a new sibling function (e.g. `runPipelineUntilOverlap`), not configuration.
- Do NOT add a streaming/callback API (`onStage(name, value)`) on speculation. The baseline harness is the only caller that would benefit, and a typed thrown error covers it.
- Do NOT keep the per-stage imports in main.ts "for flexibility". Delete them. main.ts should depend on `runPipeline` plus the parsers plus `emitSvg`.
- Do NOT feature-flag the new orchestrator alongside the inline calls. Cut over fully.
- Do NOT defer the StageError decision — pick one of (a) typed stage-tagged errors or (b) coarser failure labels and document the choice in the commit message.

Verification:
- `pnpm test` and `pnpm baseline` both pass.
- The generated docs/baseline-pipeline.md is identical to the pre-change version aside from any deliberately-changed `pipeline` column values.
- The browser app at `pnpm dev` still renders the tetrahedron net into `#net` and the 3D preview into `#viewport`.
- Pipeline call chain (`buildAdjacency` … `paginate`) appears in exactly one file under `src/` after the change. (`rg "buildSpanningTree\\(" src` should return one hit in `pipeline.ts` and one in test/script files only.)
```

---

## Ordering note

U1, U2, U3 are leaf changes inside single modules. U4 is the largest (touches main.ts and scripts/baseline-pipeline.ts). Recommended order: U1 → U2 → U3 → U4 (smallest to largest, lowest risk first), but the four are independent and can be done in parallel branches if the team prefers.
