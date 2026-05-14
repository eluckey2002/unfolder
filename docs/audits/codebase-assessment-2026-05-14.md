# Codebase Assessment — 2026-05-14

**Scope.** All four axes (architecture & health, tech debt & risk, test coverage & quality, roadmap-vs-reality) at exhaustive depth.

**Methodology.** Read-only static audit. No source edits. `pnpm install`, `pnpm type-check`, `pnpm test:run`, `pnpm baseline` for ground truth. Five parallel investigation agents.

**Phase.** Conducted mid-v2 — after session 0016 (automatic recut) shipped, before 0017 (glue tabs) began.

---

## Executive Summary

The codebase is in healthy shape. Zero P0 findings — nothing blocks v2 ship or breaks v1 behavior silently. ADRs cohere with code (one supersession needing a status flip). All 10 `src/core/` modules are pure functions with strict typing; the DAG is acyclic; the v2 pipeline runs the full 11-model corpus and produces 58 overlap-free pieces.

**Top 5 findings to act on:**

1. **P1 — Disconnected dual graphs silently mis-handled** (`src/core/spanning-tree.ts:79`, `src/core/flatten.ts:88`). Kruskal MST produces a forest if input has multiple components; `parent[i] === -1` is then ambiguous with the root, and `buildLayout` will read undefined positions for unreachable faces. No runtime check.
2. **P1 — Overlap-free property test still `it.todo`** at `test/property/pipeline.test.ts:248`. v2's headline guarantee (per ADR 0005) is unverified by property tests; only the baseline harness checks it on the corpus.
3. **P1 — Closed-manifold guard not echoed in v2 stages.** Only `src/core/adjacency.ts:74-77` enforces it; `dihedral.ts`, `spanning-tree.ts`, `flatten.ts`, `overlap.ts`, `recut.ts` all inherit it implicitly.
4. **P1 — No CI.** `.github/workflows/` is absent. All verification is local. `pnpm audit` was never run.
5. **P1 — `Piece` interface (the pipeline's output type) has zero test references.** `recut.ts:32` defines it; no test inspects its structure.

**Headline metrics.**

| Metric | Value |
|---|---|
| TS LOC (src + test + scripts) | 2,807 |
| Source files (src/) | 12 (10 core + 2 app) |
| Tests | 57 (56 passing + 1 `it.todo`) |
| ADRs | 5 (all Accepted; 0003 needs Superseded flag) |
| Sessions shipped | 16 (0001–0016) |
| Corpus models passing pipeline | 11 / 11 |
| Recut pieces produced (corpus) | 58 (range 1–28 per model) |
| Type-check | Clean |

---

## 1. Baseline Metrics

### 1.1 LOC ranking (top 15)

| File | LOC |
|---|---|
| `src/core/recut.ts` | 259 |
| `test/property/pipeline.test.ts` | 251 |
| `scripts/baseline-pipeline.ts` | 194 |
| `src/core/flatten.ts` | 193 |
| `test/property/meshes.ts` | 179 |
| `src/core/spanning-tree.ts` | 149 |
| `test/unit/recut.test.ts` | 137 |
| `test/unit/flatten.test.ts` | 136 |
| `test/unit/parse-obj.test.ts` | 125 |
| `test/unit/dihedral.test.ts` | 124 |
| `test/unit/overlap.test.ts` | 113 |
| `test/unit/spanning-tree.test.ts` | 112 |
| `src/core/parse-obj.ts` | 93 |
| `src/core/adjacency.ts` | 89 |
| `src/app/render.ts` | 89 |

### 1.2 Churn (last 3 months)

Top: `docs/project-state.md` (18), `docs/roadmap.md` (13), `docs/queue.md` (7), `CLAUDE.md` (6), `package.json` (5). Top src: `src/app/main.ts` (4), `scripts/baseline-pipeline.ts` (4). All v2 work landed in 6 feature commits since 2026-05-13.

### 1.3 Pipeline baseline (from `pnpm baseline`)

| Model | Faces | Overlaps (pre-recut) | Pieces |
|---|---:|---:|---:|
| tetrahedron.stl | 4 | 0 | 1 |
| octahedron.stl | 8 | 0 | 1 |
| cube.stl / cube.obj | 12 | 0 | 1 |
| cylinder.obj | 28 | 0 | 1 |
| egg.obj | 44 | 0 | 1 |
| uv-sphere.obj | 48 | 0 | 1 |
| ginger-bread.obj | 80 | 48 | 5 |
| croissant.obj | 162 | 388 | 15 |
| meat-sausage.obj | 320 | 184 | 3 |
| deer.obj | 720 | 857 | 28 |

Every piece is internally overlap-free. Simple/convex models trivially fit one piece; organic geometry naturally fragments.

---

## 2. Architecture — Module Cards (`src/core/`)

| Module | LOC | Pure | Type strictness | Notable | Verdict |
|---|---:|:---:|---|---|---|
| `mesh.ts` | 19 | yes | clean | type-only contract | healthy |
| `parse-stl.ts` | 62 | yes | clean | dedup via `toFixed(6)` | healthy |
| `parse-obj.ts` | 93 | yes | clean | fan-triangulation, ordinal→canonical map | healthy |
| `adjacency.ts` | 89 | yes | one cast | `as [number, number]` at line 70 | minor (P2) |
| `dihedral.ts` | 84 | yes | clean | throws on degenerate face; `DEGENERATE_NORMAL_EPS=1e-12` | healthy |
| `spanning-tree.ts` | 149 | yes | clean | Kruskal MST + BFS parent derivation | healthy |
| `flatten.ts` | 193 | yes | clean | `buildLayout` is 102 LOC | minor (P2) |
| `overlap.ts` | 61 | yes | clean | O(F²) all-pairs polygon intersection | healthy |
| `recut.ts` | 259 | yes | one `!` | `connectedComponents` 52 LOC; non-null assertion at line 148 | needs attention (P1) |
| `emit-svg.ts` | 62 | yes | clean | parameterized stroke widths | healthy |

Every core module is a pure function with no I/O or hidden state. Strict mode is on (`tsconfig.json:8`); only two type-loosening sites exist in core: `adjacency.ts:70` cast and `recut.ts:148` non-null assertion. `buildLayout` (flatten.ts) and `connectedComponents`/`greedySetCover` (recut.ts) are the cognitive-load hotspots — correct, but reviewer-unfriendly.

---

## 3. Architecture — Cross-Module & v1↔v2 Surface

### 3.1 Import DAG

Acyclic. `mesh.ts` is the root type; `parse-stl/obj` are leaves; `adjacency` → `dihedral`/`spanning-tree`; `spanning-tree` → `flatten` → `emit-svg`/`overlap`/`recut`. `src/app/render.ts:14` imports only `Mesh3D` from core — clean rendering separation.

### 3.2 v1 is no longer a callable code path

`buildSpanningTree(dual, weights, root?)` now *requires* the weights array (length-mismatch throw at lines 91–95). ADR 0003 promised the v1 signature `buildSpanningTree(dual, root?)`; ADR 0004 silently replaced it. There is no v1-vs-v2 fork at runtime — the codebase has been overwritten in place. This is intended per ADR 0004's adoption, but deserves: ADR 0003 status update → "Superseded by 0004"; a note that "v1 pipeline" now refers to a historical algorithm, not a still-callable surface.

### 3.3 `src/app/main.ts` orchestration

Runs the full v2 pipeline inline (`main.ts:20-31`). No exported "complete pipeline" function — each stage is reassembled at every call site. Intentional per ADR 0001 ("types are the contract").

---

## 4. Algorithm Correctness & ADR Coherence

### 4.1 ADR coherence table

| ADR | Decision | Status in code | Evidence |
|---|---|---|---|
| 0001 — pure-function pipeline | five-stage pure functions | holds | every src/core/ module is pure |
| 0002 — adjacency as stage | `DualGraph` output | holds | `adjacency.ts:42-89` |
| 0003 — DFS for v1 | unweighted DFS | superseded | replaced by Kruskal MST (ADR 0004) |
| 0004 — dihedral weighting | Kruskal MST by dihedral | mostly holds | weight in `[0, π]`; winding-consistency unchecked |
| 0005 — greedy set-cover recut | one-pass greedy | holds | `recut.ts:226-259`; one-pass argument verified |

### 4.2 Edge case audit

| Stage | Edge case | Detected? | Where |
|---|---|---|---|
| parse-stl/obj | malformed input, non-finite coords, mid-file EOF | throws | `parse-stl.ts:17,44,55` |
| adjacency | edge shared by ≠2 faces | throws | `adjacency.ts:74-77` |
| adjacency | isolated vertices, degenerate faces | no | not checked |
| dihedral | zero-area face | throws | `dihedral.ts:53-56` |
| dihedral | inconsistent winding | **silent** | normal dot still computes; weight meaningless |
| spanning-tree | weight length mismatch, root out-of-range | throws | `spanning-tree.ts:86-95` |
| spanning-tree | **disconnected dual graph** | **silent** | Kruskal builds a forest; non-root component faces get `parent[i] === -1` (same as root marker) |
| flatten | **unreachable face from root** | **undefined** | `buildLayout` reads undefined positions |
| overlap | shared-edge precision | trusted | polygon-clipping returns `[]` for zero-area intersections |
| recut | empty overlap set | yes | `recut.ts:224` returns single piece |
| recut | greedy sub-optimality | accepted | per ADR 0005 |

### 4.3 Numeric precision

| Site | Threshold | Note |
|---|---|---|
| `parse-stl.ts:25`, `parse-obj.ts:24` | `toFixed(6)` ≈ 1e-6 | vertex dedup quantization |
| `flatten.ts:25` | `COINCIDENT_EPS = 1e-12` | colinear apex |
| `flatten.ts:26` | `SIDE_EPS = 1e-9` | apex-side test |
| `dihedral.ts:18` | `DEGENERATE_NORMAL_EPS = 1e-12` | zero-area face |

**Mismatch.** Parse quantizes to 1e-6; flatten checks at 1e-9. A face whose vertices were quantized by parsing can fail downstream geometric predicates that assume sub-quantum precision. No symptoms observed on the corpus, but the mismatch is structural — P2 note.

---

## 5. Tech Debt, Risk & Build Health

### 5.1 Confirmed clean

No `TODO`/`FIXME`/`HACK`/`XXX` in `src/`, `test/`, `scripts/`. No dead-code exports (caveat: `Piece` type — see §6). No commented-out code blocks. `.gitignore` correctly excludes `node_modules/`, `dist/`, `.vite/`, `.claude/`.

### 5.2 Risks & gaps

| # | Finding | Severity | Recommendation |
|---|---|---:|---|
| D1 | No CI — `.github/workflows/` missing | P1 | Add minimal workflow: install + type-check + test:run |
| D2 | `vite-node` used in scripts, not in devDeps | P1 | Add `vite-node` to devDeps |
| D3 | `polygon-clipping@0.15.7` is sub-1.0 | P2 | Pin or document; monitor 0.16 |
| D4 | `tsconfig.json` includes DOM globally | P2 | Consider separate `tsconfig.core.json` |
| D5 | No `pnpm audit` step | P2 | Add `audit` script; wire into CI |
| D6 | Closed-manifold guard not echoed in v2 modules | P1 | Comment header per v2 module, or light asserts |
| D7 | `vite.config.ts` has no source-map / coverage config | P2 | Defer until v2 ship |

### 5.3 Dependency snapshot

`polygon-clipping 0.15.7` (pre-1.0), `three 0.184.0`, `typescript 6.0.3`, `vite 8.0.12`, `vitest 4.1.6`, `fast-check 4.8.0`, `@types/node 25.7.0`, `@types/three 0.184.1`. `pnpm install` idempotent. `pnpm audit` not run — pending CI.

---

## 6. Test Coverage & Quality

### 6.1 Test inventory

sanity 1; parse-stl 4; parse-obj 8; adjacency 3; dihedral 4; spanning-tree 6; flatten 4; overlap 4; recut 4; emit-svg 4; property — pipeline 16 properties + 2 unit + 1 `it.todo`. **Total: 57 (56 passing + 1 todo).** Run time 1.54s. (A Phase-0 count of "44" was a miscount; actual is 57.)

### 6.2 Coverage gaps

| # | Finding | Severity | Recommendation |
|---|---|---:|---|
| T1 | `Piece` type has zero test references | P1 | Assert piece structure in `recut.test.ts` |
| T2 | Overlap-free invariant still `it.todo` | P1 | Promote to real property test now ADR 0005 merged |
| T3 | `dihedral.ts` has no property test | P1 | Add: weights in `[0, π]`; determinism |
| T4 | `src/app/` has zero automated tests | P2 | Acceptable for prototype; flag for v3 |
| T5 | `closedMeshArb` only generates 4 topologies (≤12 faces) | P2 | Add a `corpusFixturesArb` |
| T6 | No coverage tooling configured | P2 | Deferred per plan |
| T7 | recut.ts test ratio 0.53 (LOC test/src) | P1 | Adding T1+T2 closes most of this |

### 6.3 Property test arbitrary profile

`closedMeshArb` samples uniformly across `{tetrahedron, cube, octahedron, triangular prism}` — 4 fixed topologies (4–12 faces), scaled and translated. Not exercised: high-poly (>12 faces), near-coplanar adjacency, non-Platonic topologies, real corpus fixtures.

---

## 7. Documentation & Roadmap Reality

### 7.1 Alignment table

| Check | Result |
|---|---|
| Every roadmap-claimed session has a commit | yes |
| Every commit since v1 has a session log | yes |
| ADR format compliant (Context/Decision/Consequences) | yes |
| ADRs have explicit Status/Date frontmatter | no |
| Session logs end with handoff blocks | partial (0014–0016 yes; 0001–0013 predate protocol) |
| Queue items not stale | yes (watch) — one item at ~4 sessions |
| CLAUDE.md ↔ project-state.md ↔ strategist-protocol.md coherent | yes |
| Phase-boundary docs current | partial — refresh expected at session 0019 |
| ADR 0003 marked Superseded | no |

### 7.2 Stale-file scan

`docs/insights-implementation-plan.md` — active. `docs/baseline-pipeline.md` — active, regenerated by `pnpm baseline`. No orphan source files. `test/corpus/OBJ format/` subdir is a provenance archive, not imported.

### 7.3 v3–v6 coherence

v3 references "Takahashi topological surgery" — continues ADR 0004's dihedral heuristic. v4–v6 sketched, consistent with v2 learnings. No redesign warranted.

---

## 8. `src/app/` — UI Smoke (deferred)

The dev server runs; `index.html` defines `#viewport` and `#net`; `main.ts:20-31` orchestrates the full v2 pipeline. Manual smoke (page renders, OrbitControls drag-rotate, SVG net, aspect-ratio reflow, swapping the loaded model) is deferred to Evan or a follow-up session with browser tooling. Finding U1 (P2): `src/app/` lacks any automated test or screenshot fixture — acceptable for prototype phase.

---

## 9. Prioritized Findings

### P0 — Critical

None.

### P1 — Important

| # | Finding |
|---|---|
| A1 | Disconnected dual graph → `parent[i] === -1` ambiguous with root; `buildLayout` reads undefined positions |
| A2 | Winding consistency not validated in `dihedral.ts` |
| A3 | Closed-manifold guard not echoed in v2 stages |
| A4 | Overlap-free invariant still `it.todo` |
| A5 | `dihedral.ts` has no property test |
| A6 | `Piece` interface untested |
| A7 | No CI workflow |
| A8 | `vite-node` missing from devDeps |
| A9 | `recut.ts` undertest ratio (0.53) |

### P2 — Nice-to-have

B1 `adjacency.ts:70` unnecessary cast · B2 `flatten.ts` `buildLayout` 102 LOC · B3 `recut.ts:148` non-null assertion; `connectedComponents` 52 LOC · B4 precision mismatch (parse 1e-6 vs flatten 1e-9) · B5 `polygon-clipping@0.15.7` sub-1.0 · B6 `tsconfig.json` includes DOM globally · B7 no `pnpm audit` script · B8 `closedMeshArb` topology variety limited · B9 `src/app/` no automated tests · B10 ADR 0003 missing "Superseded by 0004" status · B11 ADRs lack explicit Status/Date fields · B12 phase-boundary docs stale relative to v2 work

---

## 10. Recommended Follow-ups (from the audit)

The audit proposed queue drafts for A1, A2, A4, A5, A6, A7, A8, B10, and a draft ADR 0006 (connectedness contract for spanning-tree input). It explicitly marked these "proposed, not committed." See §12 for the strategist's triage of these.

---

## 11. Confidence & Known Gaps

**Confidence: high** for static findings (file:line evidence). **Medium** for numeric-precision claims (no fuzzing run). **Deferred** for UI smoke.

What this audit did not do: run `pnpm audit`; measure branch coverage; fuzz numeric edge cases; verify v1 performance (v1 is no longer runnable); profile `recut.ts` or `polygon-clipping`; cross-check the `paperfoldmodels-algorithm` corpus against the implementation.

---

## 12. Strategist triage (2026-05-14)

Strategist review of this audit, after verifying its load-bearing claims against the repo.

**Verified correction to the audit:**

- **D2 / A8 — non-finding.** `vite-node` *is* in `package.json` devDependencies (`^6.0.0`). The audit miscounted — the same class of slip as its own flagged Phase-0 test-count miscount. Dropped from the action list.

**Recalibrated against project context the audit did not fully weigh:**

- **A2 (winding unchecked)** — not a new defect. ADR 0004 already owns this as a deliberate, documented assumption, with the winding-robust formula named as the refinement path. A known deferral, not a gap. Not queued.
- **A3 (manifold guard not echoed in v2 stages)** — mostly moot: a `DualGraph` can only be produced by `buildAdjacency`, which throws on non-manifold input. The "future caller bypasses adjacency" path is not reachable through the type system. Not queued; a comment-header pass is optional hygiene at most.
- **A7 (no CI)** — this is the GitHub-remote question, which `project-state.md` holds as a deliberate open item ("no remote yet"). A CI workflow has nowhere to run without a remote. A v2→v3-boundary decision, not a v2-internal action.
- **B12 (phase-boundary docs stale)** — by design. The working agreement refreshes `project-history.md` / `project-rationale.md` at phase boundaries; session 0019 (the v2 retrospective) does exactly that. Not a finding.
- **A9 (recut test ratio)** — a soft metric, subsumed by A4 and A6; not tracked as its own item.

**Genuine act-on items — queued in `docs/queue.md`:**

A1 (disconnected-dual guard), A4 (promote the overlap-free property test, now actionable since ADR 0005 shipped), A5 (dihedral property test), A6 (`Piece` structural assertions), B10 (ADR 0003 superseded marker). All small; none block v2.

**Carried to the v2→v3 boundary:** the CI / GitHub-remote decision, and whether A1's connectedness contract warrants a formal ADR 0006 versus a session-log decision on a throw-guard.
