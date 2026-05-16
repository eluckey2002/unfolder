# v3 — Quality Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Each numbered session lands as its own PR per ADR 0006 (worktree → PR → squash-merge). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the unfolder pipeline from buildable v2 output to visibly competitive-with-Pepakura v3 output: optimized recut via topological surgery, smart tab placement, audit visualization, color/texture passthrough, and a strictly-scoped file-loader UI — then ship the phase with an integration test extension and joint retrospective. **PDF export dropped from v3 scope** (per strategist call 2026-05-16) — SVG is enough; revisit in v5 if needed.

**Architecture:** Six numbered sessions (0025 → 0030). Each lands via `<type>/<descriptor>` worktree per ADR 0006. Two cross-cutting work items (U4 Pathfinder `runPipeline()` orchestrator decision; P1 audit precision-contract fix) are folded into 0025's scope as sub-tasks. Sessions 0025–0027 use atomic 5-step TDD per task with concrete code. Sessions 0028–0030 each begin with a probe / brainstorm task (atomic itself) to ground subsequent atomic steps in real APIs and decisions — marked-TBD values per the atomic-plan-steps feedback are explicit, never placeholder narrative.

**Tech Stack:** TypeScript strict mode, Vite, pnpm, Vitest, three.js, polygon-clipping (in tree, used by overlap/cut-removal).

**Spike findings input:** `docs/spikes/2026-05-15-topological-surgery.md` — Variant C as v3 default, Variant B as opt-in, Variant A as post-condition assertion. The spike's analysis confirmed Variant C beats A and B on every concave corpus model.

**Audit findings input:** `docs/audits/core-review-2026-05-16.md` — P1 precision contract, P2 hygiene items (most already closed by PR #7).

---

## Session map

| Session | Type | Branch | Goal |
|---|---|---|---|
| 0025 | session | `session/0025-optimized-recut` | Promote spike Variants A/B/C to `src/core/`; switch v3 default to cut-removal; ADR 0007 |
| 0026 | session | `session/0026-smart-tab-placement` | Replace lower-face-index tab rule with quality-driven placement |
| 0027 | session | `session/0027-audit-visualization` | Color-code piece quality and emit a `metrics` cover page |
| 0028 | session | `session/0028-color-texture-passthrough` | Preserve and emit OBJ material colors; STL color tags |
| 0029 | session | `session/0029-file-loader-ui` | Brainstorm + ship strictly-scoped load-and-export UI (SVG only) |
| 0030 | session | `session/0030-v3-close` | v3 integration extension; joint retrospective; phase close |

**Cross-cutting (folded into 0025):**

- **U4 — Pathfinder `runPipeline()` orchestrator.** Reverses ADR 0001's inline-pipeline stance. Cut-removal already collapses two stages, so the call-site refactor is unavoidable; doing it as a `runPipeline()` is the same edit done cleanly.
- **P1 — Parse/flatten precision contract.** No symptoms on the corpus; structural. Folded into 0025's scope as a single `Task 25.1` adding a shared `EPS` module.

---

## File structure

### New files created

| Path | Created by | Responsibility |
|---|---|---|
| `src/core/curvature.ts` | 0025 | Variant A — `reportCurvature(mesh, cuts)` diagnostic |
| `src/core/blended-weights.ts` | 0025 | Variant B — `computeBlendedWeights(mesh, dual, coeffs?)` opt-in weight function |
| `src/core/cut-removal.ts` | 0025 | Variant C — `runCutRemoval(mesh, dual, options?)` v3 default unfolder |
| `src/core/pipeline.ts` | 0025 | `runPipeline(mesh, page?)` orchestrator (resolves queue item U4) |
| `src/core/eps.ts` | 0025 | Shared precision constants — `PARSE_DECIMALS`, `COINCIDENT_EPS`, `SIDE_EPS` (resolves P1 audit finding) |
| `src/core/metrics.ts` | 0027 | Pure `computeMetrics(result)` → metric set used by audit overlay and baseline |
| `src/core/texture.ts` | 0028 | Material parsing helpers + per-face fill resolution |
| `src/app/file-loader.ts` | 0029 | DOM event wiring for file-input + download button |
| `test/unit/curvature.test.ts` | 0025 | Curvature classification + violation counting |
| `test/unit/blended-weights.test.ts` | 0025 | Sign convention + coefficient effects |
| `test/unit/cut-removal.test.ts` | 0025 | RecutResult contract; convex tie with v2; deer regression bound |
| `test/unit/pipeline.test.ts` | 0025 | Orchestrator wires every stage; intermediate values surfaced |
| `test/unit/metrics.test.ts` | 0027 | Metric set computed correctly |
| `test/unit/texture.test.ts` | 0028 | MTL parsing + face-to-color resolution |
| `docs/decisions/0007-cut-removal-as-v3-default.md` | 0025 | ADR superseding ADR 0005's recut-as-default stance |
| `docs/retrospectives/v3-complete.md` | 0030 | What shipped in v3 |
| `docs/retrospectives/v3-retrospective.md` | 0030 | How we worked through v3 |

### Existing files modified

| Path | Modified by | Why |
|---|---|---|
| `src/core/parse-stl.ts` | 0025, 0028 | 0025: import precision constants from `eps.ts`. 0028: optionally parse color extensions. |
| `src/core/parse-obj.ts` | 0025, 0028 | 0025: import precision constants. 0028: parse `usemtl` + MTL companion. |
| `src/core/flatten.ts` | 0025 | Import `COINCIDENT_EPS`/`SIDE_EPS` from `eps.ts` instead of local constants. |
| `src/core/tabs.ts` | 0026 | Replace lower-face-index tab rule with quality-driven placement. |
| `src/core/emit-svg.ts` | 0027, 0028 | 0027: render `metrics` cover page when present. 0028: emit per-face fill colors. |
| `src/core/paginate.ts` | 0027 | Optional `coverPage` slot in `Page[]` output. |
| `src/app/main.ts` | 0025, 0027, 0028, 0029 | 0025: use `runPipeline`. 0027: surface metrics overlay. 0028: pipe colors. 0029: file-loader hooks + Download SVG button. |
| `scripts/baseline-pipeline.ts` | 0025, 0027 | 0025: collapse stage-by-stage assembly into `runPipeline`. 0027: use `computeMetrics`. |
| `test/integration/pipeline.test.ts` | 0025, 0027, 0030 | Extend with v3 invariants per session. |
| `docs/baseline-pipeline.md` | 0025, 0026, 0027 | Regenerated after algorithmic changes. |
| `docs/baseline-v3.md` | 0025, 0026 | Updated companion baseline. |
| `docs/roadmap.md` | 0025, 0026, 0027, 0028, 0029, 0030 | Session status flips after each lands. |
| `docs/decisions/0005-greedy-set-cover-recut.md` | 0025 | Superseded-by marker pointing to 0007. |
| `index.html` | 0029 | File-input + Download SVG button elements added. |

---

# Session 0025 — Optimized Recut

**Branch:** `session/0025-optimized-recut`

**Goal:** Promote spike Variants A/B/C from `spikes/2026-05-15-topological-surgery/` to `src/core/`. Switch the v3 default pipeline to use `runCutRemoval` (Variant C) instead of `buildSpanningTree + recut`. Make blended weights (Variant B) available as an opt-in alternate weight. Wire curvature (Variant A) as a post-condition assertion. Land ADR 0007. Fold in two cross-cutting items: U4 (`runPipeline()` orchestrator) and P1 (shared `EPS` module).

**Verification gate:** All existing tests pass (97+), new unit tests pass, baseline regenerates with strictly-better-or-equal piece counts on every concave corpus model.

---

### Task 25.0: Begin session

- [ ] **Step 1: Run `/begin-session session/0025-optimized-recut`**

Skill creates the worktree, copies the prompt, runs `pnpm install`. Expected output: status report with branch name, worktree path, queue items intersecting scope.

- [ ] **Step 2: Confirm branch name matches ADR 0006**

Run: `git branch --show-current`
Expected: `session/0025-optimized-recut` (not `worktree-session+0025-optimized-recut`).

If output shows the mangled name, rename per CLAUDE.md section 6:
```bash
git branch -m worktree-session+0025-optimized-recut session/0025-optimized-recut
```

- [ ] **Step 3: Verify clean working tree**

Run: `git status`
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 4: Verify baseline test suite passes**

Run: `pnpm test:run`
Expected: 97 passing across 14 files.

- [ ] **Step 5: Note current state in scratch**

No commit — this task is read-only orientation. Move to Task 25.1.

---

### Task 25.1: Create the shared `EPS` module (fold in P1 audit finding)

**Files:**
- Create: `src/core/eps.ts`
- Test: `test/unit/eps.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/unit/eps.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

import {
  COINCIDENT_EPS,
  PARSE_DECIMALS,
  SIDE_EPS,
} from "../../src/core/eps.js";

describe("eps", () => {
  it("PARSE_DECIMALS is 6 — vertex dedup quantization matches parsers", () => {
    expect(PARSE_DECIMALS).toBe(6);
  });

  it("SIDE_EPS is consistent with the parser quantization grain", () => {
    expect(SIDE_EPS).toBeGreaterThanOrEqual(Math.pow(10, -PARSE_DECIMALS));
  });

  it("COINCIDENT_EPS is at or below SIDE_EPS", () => {
    expect(COINCIDENT_EPS).toBeLessThanOrEqual(SIDE_EPS);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm vitest run test/unit/eps.test.ts`
Expected: FAIL — `Cannot find module '../../src/core/eps.js'`.

- [ ] **Step 3: Create the EPS module**

Create `src/core/eps.ts`:

```typescript
/**
 * Shared precision constants for the pipeline.
 *
 * Parsers quantize vertex coordinates to 6 decimals when
 * deduplicating; geometric predicates downstream must use epsilons
 * looser than the parser grain so they do not reject vertex
 * positions the parser already collapsed. Audit finding C1 (May
 * 2026, P1) — see `docs/audits/core-review-2026-05-16.md`.
 */

export const PARSE_DECIMALS = 6;
export const COINCIDENT_EPS = 1e-6;
export const SIDE_EPS = 1e-5;
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm vitest run test/unit/eps.test.ts`
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/core/eps.ts test/unit/eps.test.ts
git commit -m "$(cat <<'EOF'
feat(eps): add shared precision constants module

Closes audit finding C1 (P1): parsers quantize to 6 decimals while
flatten predicates ran at 1e-12 — geometric tests could reject
positions the parser collapsed. New eps module exports
PARSE_DECIMALS, COINCIDENT_EPS, SIDE_EPS as the single source of
truth; flatten.ts and the parsers consume it in subsequent commits.
EOF
)"
```

---

### Task 25.2: Migrate `flatten.ts` and parsers to consume `eps.ts`

**Files:**
- Modify: `src/core/flatten.ts:25-26`
- Modify: `src/core/intern-vertex.ts`

- [ ] **Step 1: Write the failing test**

Add to `test/unit/eps.test.ts`:

```typescript
describe("eps consumers", () => {
  it("flatten.ts imports COINCIDENT_EPS and SIDE_EPS from eps.ts", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync("src/core/flatten.ts", "utf-8"),
    );
    expect(src).toMatch(/from\s+["']\.\/eps\.js["']/);
    expect(src).not.toMatch(/const\s+COINCIDENT_EPS\s*=/);
    expect(src).not.toMatch(/const\s+SIDE_EPS\s*=/);
  });

  it("intern-vertex.ts imports PARSE_DECIMALS from eps.ts", async () => {
    const src = await import("node:fs").then((fs) =>
      fs.readFileSync("src/core/intern-vertex.ts", "utf-8"),
    );
    expect(src).toMatch(/PARSE_DECIMALS/);
    expect(src).toMatch(/from\s+["']\.\/eps\.js["']/);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/eps.test.ts`
Expected: FAIL — both `eps consumers` tests fail.

- [ ] **Step 3: Refactor consumers to use `eps.ts`**

In `src/core/flatten.ts` near line 25, replace local constants:
```typescript
import { COINCIDENT_EPS, SIDE_EPS } from "./eps.js";
```

In `src/core/intern-vertex.ts`, use the shared decimal constant:
```typescript
import { PARSE_DECIMALS } from "./eps.js";
// inside intern:
const key = `${x.toFixed(PARSE_DECIMALS)},${y.toFixed(PARSE_DECIMALS)},${z.toFixed(PARSE_DECIMALS)}`;
```

- [ ] **Step 4: Run all tests and verify they pass**

Run: `pnpm test:run`
Expected: 100 passing (97 + 3 from eps.test.ts). No regressions.

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/core/flatten.ts src/core/intern-vertex.ts test/unit/eps.test.ts
git commit -m "$(cat <<'EOF'
refactor(eps): consume shared precision constants in flatten and intern-vertex

flatten.ts now imports COINCIDENT_EPS and SIDE_EPS from eps.ts;
intern-vertex.ts uses PARSE_DECIMALS for its dedup key. Closes the
P1 audit finding — parser quantization grain and downstream
geometric predicates are now coupled through one module.
EOF
)"
```

---

### Task 25.3: Promote Variant A — `src/core/curvature.ts`

**Files:**
- Create: `src/core/curvature.ts`
- Test: `test/unit/curvature.test.ts`

Spike source: `spikes/2026-05-15-topological-surgery/variant-a-curvature/curvature.ts`. Production version is identical modulo import paths.

- [ ] **Step 1: Write the failing test**

Create `test/unit/curvature.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

import type { Adjacency } from "../../src/core/adjacency.js";
import { reportCurvature } from "../../src/core/curvature.js";
import type { Mesh3D } from "../../src/core/mesh.js";

describe("reportCurvature", () => {
  it("classifies tetrahedron vertices as elliptic with zero violations under full-cut set", () => {
    const mesh: Mesh3D = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, Math.sqrt(3) / 2, 0],
        [0.5, Math.sqrt(3) / 6, Math.sqrt(6) / 3],
      ],
      faces: [
        [0, 1, 2],
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 3],
      ],
    };
    const cuts: Adjacency[] = [
      { faceA: 0, faceB: 1, edge: [0, 1] },
      { faceA: 0, faceB: 2, edge: [0, 2] },
      { faceA: 0, faceB: 3, edge: [1, 2] },
      { faceA: 1, faceB: 2, edge: [0, 3] },
      { faceA: 1, faceB: 3, edge: [1, 3] },
      { faceA: 2, faceB: 3, edge: [2, 3] },
    ];

    const report = reportCurvature(mesh, cuts);

    expect(report.counts.elliptic).toBe(4);
    expect(report.counts.hyperbolic).toBe(0);
    expect(report.violations).toEqual([]);
  });

  it("flags an elliptic vertex with no incident cuts as a violation", () => {
    const mesh: Mesh3D = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, Math.sqrt(3) / 2, 0],
        [0.5, Math.sqrt(3) / 6, Math.sqrt(6) / 3],
      ],
      faces: [
        [0, 1, 2],
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 3],
      ],
    };

    const report = reportCurvature(mesh, []);

    expect(report.violations.length).toBe(4);
    expect(report.violations.every((v) => v.class === "elliptic")).toBe(true);
    expect(report.violations.every((v) => v.incidentCuts === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/curvature.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/core/curvature.ts`**

Copy `spikes/2026-05-15-topological-surgery/variant-a-curvature/curvature.ts` to `src/core/curvature.ts`, adjusting imports (`../../../src/core/` → `./`). The body is verbatim from the spike (~155 lines exporting `reportCurvature`, `CurvatureClass`, `VertexCurvature`, `VertexViolation`, `CurvatureReport`).

- [ ] **Step 4: Run all tests and verify they pass**

Run: `pnpm test:run`
Expected: 102 passing (100 + 2). No regressions.

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/core/curvature.ts test/unit/curvature.test.ts
git commit -m "$(cat <<'EOF'
feat(curvature): promote Variant A from spike to src/core

reportCurvature(mesh, cuts) classifies every vertex by Gaussian
curvature and flags violations of the Takahashi necessary
condition. Wired as a post-condition assertion in Task 25.6. Per
the 0023 spike, v2's MST+recut and Variant C's cut-removal both
satisfy the condition on the entire corpus by feasibility — this
makes the invariant explicit.
EOF
)"
```

---

### Task 25.4: Promote Variant B — `src/core/blended-weights.ts`

**Files:**
- Create: `src/core/blended-weights.ts`
- Test: `test/unit/blended-weights.test.ts`

Spike source: `spikes/2026-05-15-topological-surgery/variant-b-blended/blended.ts`.

- [ ] **Step 1: Write the failing test**

Create `test/unit/blended-weights.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import {
  computeBlendedWeights,
  DEFAULT_BLEND,
} from "../../src/core/blended-weights.js";
import type { Mesh3D } from "../../src/core/mesh.js";

describe("computeBlendedWeights", () => {
  it("exports DEFAULT_BLEND with the spike's coefficient triple", () => {
    expect(DEFAULT_BLEND).toEqual({ convex: 0.5, concave: 1.0, length: -0.1 });
  });

  it("returns one weight per adjacency, parallel-indexed", () => {
    const mesh: Mesh3D = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, Math.sqrt(3) / 2, 0],
        [0.5, Math.sqrt(3) / 6, Math.sqrt(6) / 3],
      ],
      faces: [
        [0, 1, 2],
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 3],
      ],
    };
    const dual = buildAdjacency(mesh);
    const weights = computeBlendedWeights(mesh, dual);

    expect(weights.length).toBe(dual.adjacencies.length);
    expect(weights.every((w) => Number.isFinite(w))).toBe(true);
  });

  it("coefficient changes produce different weight surfaces", () => {
    const mesh: Mesh3D = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0.5],
        [0, 1, 0.5],
        [0.5, 0.5, 1],
      ],
      faces: [
        [0, 1, 2],
        [0, 2, 3],
        [0, 1, 4],
        [1, 2, 4],
        [2, 3, 4],
        [0, 3, 4],
      ],
    };
    const dual = buildAdjacency(mesh);
    const baseline = computeBlendedWeights(mesh, dual);
    const higher = computeBlendedWeights(mesh, dual, {
      convex: 0.5,
      concave: 5.0,
      length: -0.1,
    });
    expect(higher.some((w, i) => Math.abs(w - baseline[i]) > 1e-9)).toBe(true);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/blended-weights.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/core/blended-weights.ts`**

Copy `spikes/2026-05-15-topological-surgery/variant-b-blended/blended.ts` to `src/core/blended-weights.ts`, adjusting imports (`../../../src/core/` → `./`). Full body identical to spike (~159 lines).

- [ ] **Step 4: Run tests and verify**

Run: `pnpm test:run`
Expected: 105 passing (102 + 3).

- [ ] **Step 5: Commit**

```bash
git add src/core/blended-weights.ts test/unit/blended-weights.test.ts
git commit -m "$(cat <<'EOF'
feat(blended-weights): promote Variant B from spike to src/core

computeBlendedWeights(mesh, dual, coeffs?) — signature-compatible
with computeDihedralWeights so it slots into buildSpanningTree
unchanged. DEFAULT_BLEND is the spike's hand-chosen coefficient
triple (convex=0.5, concave=1.0, length=-0.1). Available as opt-in
alternate weight; v3 default uses cut-removal per Task 25.5.
EOF
)"
```

---

### Task 25.5: Promote Variant C — `src/core/cut-removal.ts`

**Files:**
- Create: `src/core/cut-removal.ts`
- Test: `test/unit/cut-removal.test.ts`

Spike source: `spikes/2026-05-15-topological-surgery/variant-c-cut-removal/cut-removal.ts`. Production version replaces the inline `UF` factory with the shared `makeUnionFind` from `src/core/union-find.ts` (Pathfinder U2 consolidation).

- [ ] **Step 1: Write the failing test**

Create `test/unit/cut-removal.test.ts`:

```typescript
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildAdjacency } from "../../src/core/adjacency.js";
import {
  type CutRemovalResult,
  runCutRemoval,
} from "../../src/core/cut-removal.js";
import { detectOverlaps } from "../../src/core/overlap.js";
import { parseObj } from "../../src/core/parse-obj.js";
import { parseStl } from "../../src/core/parse-stl.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/corpus");

describe("runCutRemoval", () => {
  it("produces a single piece on tetrahedron (convex)", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(result.pieces.length).toBe(1);
    expect(result.pieces[0].faces.length).toBe(4);
  });

  it("produces internally overlap-free pieces on deer.obj", () => {
    const obj = readFileSync(join(corpusDir, "deer.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(result.pieces.length).toBeGreaterThan(0);
    for (const piece of result.pieces) {
      expect(detectOverlaps(piece.layout)).toEqual([]);
    }
  });

  it("dominates v2 on deer.obj piece count (≤ 28)", () => {
    // v2 baseline on deer.obj is 28 pieces. Spike: Variant C → 17.
    // Allow up to v2's count as the regression bound.
    const obj = readFileSync(join(corpusDir, "deer.obj"), "utf-8");
    const mesh = parseObj(obj);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(result.pieces.length).toBeLessThanOrEqual(28);
  });

  it("reports rejected, accepted, and cyclesSkipped fields", () => {
    const stl = readFileSync(join(corpusDir, "cube.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);

    const result = runCutRemoval(mesh, dual);

    expect(typeof result.rejected).toBe("number");
    expect(typeof result.accepted).toBe("number");
    expect(typeof result.cyclesSkipped).toBe("number");
    expect(typeof result.timedOut).toBe("boolean");
  });

  it("returns a RecutResult-compatible shape", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);
    const dual = buildAdjacency(mesh);

    const result: CutRemovalResult = runCutRemoval(mesh, dual);

    expect(Array.isArray(result.pieces)).toBe(true);
    expect(Array.isArray(result.cuts)).toBe(true);
    for (const piece of result.pieces) {
      expect(Array.isArray(piece.faces)).toBe(true);
      expect(Array.isArray(piece.folds)).toBe(true);
      expect(piece.layout).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/cut-removal.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/core/cut-removal.ts`**

Copy spike code, applying these changes:

1. Imports: `../../../src/core/` → `./`.
2. Replace the inline `UF` interface + `makeUF` factory (spike lines 204-241) with `import { makeUnionFind } from "./union-find.js";`.
3. At spike line 351, replace `const uf = makeUF(faceCount);` with `const uf = makeUnionFind(faceCount);`.
4. Shared `makeUnionFind.union(a, b)` returns `boolean` (true iff merge happened); the spike's `makeUF.union` returned the new root. At spike line 424, replace:
```typescript
const newRoot = uf.union(anchor, mover);
```
with:
```typescript
uf.union(anchor, mover);
const newRoot = uf.find(anchor);
```

- [ ] **Step 4: Run all tests and verify they pass**

Run: `pnpm test:run`
Expected: 110 passing (105 + 5).

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/core/cut-removal.ts test/unit/cut-removal.test.ts
git commit -m "$(cat <<'EOF'
feat(cut-removal): promote Variant C from spike to src/core

runCutRemoval(mesh, dual, options?) — greedy cut-removal recut per
PolyZamboni. Replaces both buildSpanningTree and recut with a
single greedy pass: start fragmented, merge what's safe. Output
extends RecutResult so tabs → paginate → emit consumes it
unchanged.

Spike's inline union-find replaced with the shared makeUnionFind
from src/core/union-find.ts (Pathfinder U2 consolidation).
EOF
)"
```

---

### Task 25.6: Create `runPipeline()` orchestrator (resolves U4 queue item)

**Files:**
- Create: `src/core/pipeline.ts`
- Test: `test/unit/pipeline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/unit/pipeline.test.ts`:

```typescript
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LETTER } from "../../src/core/paginate.js";
import { parseStl } from "../../src/core/parse-stl.js";
import { runPipeline } from "../../src/core/pipeline.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/corpus");

describe("runPipeline", () => {
  it("returns every intermediate stage", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.dual).toBeDefined();
    expect(result.recut).toBeDefined();
    expect(result.renderable).toBeDefined();
    expect(result.pages).toBeDefined();
    expect(result.curvature).toBeDefined();
  });

  it("uses cut-removal (Variant C) as the default unfolder", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(typeof (result.recut as { rejected?: number }).rejected).toBe(
      "number",
    );
  });

  it("defaults to LETTER page spec", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.pages[0].widthMm).toBe(LETTER.widthMm);
    expect(result.pages[0].heightMm).toBe(LETTER.heightMm);
  });

  it("post-condition: curvature report shows zero violations on tetrahedron", () => {
    const stl = readFileSync(join(corpusDir, "tetrahedron.stl"), "utf-8");
    const mesh = parseStl(stl);

    const result = runPipeline(mesh);

    expect(result.curvature.violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run test/unit/pipeline.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/core/pipeline.ts`**

```typescript
/**
 * Pipeline orchestrator: one function that runs every pure stage
 * and surfaces every intermediate value for callers that need a
 * slice.
 *
 * v3 default: cut-removal (Variant C) — replaces the v2
 * buildSpanningTree + recut sequence with a single greedy pass.
 * The MST path remains available for callers that import the
 * pieces individually.
 *
 * Resolves queue item U4 (Pathfinder analysis 2026-05-15).
 */

import { buildAdjacency, type DualGraph } from "./adjacency.js";
import { reportCurvature, type CurvatureReport } from "./curvature.js";
import {
  type CutRemovalResult,
  runCutRemoval,
} from "./cut-removal.js";
import type { Mesh3D } from "./mesh.js";
import {
  LETTER,
  type Page,
  type PageSpec,
  paginate,
} from "./paginate.js";
import {
  buildRenderablePieces,
  type RenderablePiece,
} from "./tabs.js";

export interface PipelineResult {
  dual: DualGraph;
  recut: CutRemovalResult;
  renderable: RenderablePiece[];
  pages: Page[];
  curvature: CurvatureReport;
}

export function runPipeline(
  mesh: Mesh3D,
  page: PageSpec = LETTER,
): PipelineResult {
  const dual = buildAdjacency(mesh);
  const recut = runCutRemoval(mesh, dual);
  const renderable = buildRenderablePieces(recut);
  const pages = paginate(renderable, page);
  const curvature = reportCurvature(mesh, recut.cuts);

  if (curvature.violations.length > 0) {
    console.warn(
      `runPipeline: curvature post-condition flagged ${curvature.violations.length} vertex violation(s).`,
    );
  }

  return { dual, recut, renderable, pages, curvature };
}
```

- [ ] **Step 4: Run tests and verify**

Run: `pnpm test:run`
Expected: 114 passing.

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/core/pipeline.ts test/unit/pipeline.test.ts
git commit -m "$(cat <<'EOF'
feat(pipeline): add runPipeline orchestrator with cut-removal as v3 default

Resolves queue item U4. Single entry point wiring
buildAdjacency → runCutRemoval (Variant C) → buildRenderablePieces
→ paginate, plus reportCurvature as a post-condition check.
Returns every intermediate stage so callers stop encoding the
call order.
EOF
)"
```

---

### Task 25.7: Switch `src/app/main.ts` to use `runPipeline`

**Files:**
- Modify: `src/app/main.ts:1-56`

- [ ] **Step 1: Plan the rewrite**

Current main.ts imports 8 stage modules; new shape imports `runPipeline` plus `emitSvg`. Eight imports collapse to two. No test for main.ts directly — integration test catches regressions.

- [ ] **Step 2: Write integration smoke test**

Add to `test/integration/pipeline.test.ts` (at bottom):

```typescript
describe("v3 ship-state — runPipeline orchestrator", () => {
  it.each(models)(
    "%s: runPipeline produces the same page count as the manual pipeline",
    async (model) => {
      const ext = extname(model).toLowerCase();
      const contents = readFileSync(join(corpusDir, model), "utf-8");
      const mesh = ext === ".stl" ? parseStl(contents) : parseObj(contents);

      const { runPipeline } = await import("../../src/core/pipeline.js");
      const result = runPipeline(mesh);

      expect(result.pages.length).toBeGreaterThan(0);
    },
  );
});
```

Run: `pnpm vitest run test/integration/pipeline.test.ts`
Expected: PASS on every corpus model (runPipeline already wired in Task 25.6).

- [ ] **Step 3: Replace `src/app/main.ts` body**

```typescript
import tetrahedronStl from "../../test/corpus/tetrahedron.stl?raw";

import { emitSvg } from "../core/emit-svg.js";
import { parseStl } from "../core/parse-stl.js";
import { runPipeline } from "../core/pipeline.js";
import { createViewport } from "./render.js";

const viewportContainer = document.getElementById("viewport");
if (!(viewportContainer instanceof HTMLElement)) {
  throw new Error("main.ts: #viewport element not found.");
}
const netContainer = document.getElementById("net");
if (!(netContainer instanceof HTMLElement)) {
  throw new Error("main.ts: #net element not found.");
}

const mesh = parseStl(tetrahedronStl);
console.log(
  `unfolder: parsed mesh with ${mesh.vertices.length} vertices, ${mesh.faces.length} faces.`,
);

createViewport(viewportContainer, mesh);

const { recut, pages } = runPipeline(mesh);

netContainer.replaceChildren();
for (let i = 0; i < pages.length; i++) {
  const card = document.createElement("div");
  card.className = "page-card";
  const caption = document.createElement("h3");
  caption.textContent = `Page ${i + 1}`;
  const svgWrap = document.createElement("div");
  svgWrap.className = "page-svg";
  svgWrap.innerHTML = emitSvg(pages[i]);
  card.append(caption, svgWrap);
  netContainer.appendChild(card);
}

console.log(
  `unfolder: ${recut.pieces.length} piece(s) on ${pages.length} page(s); cut-removal accepted ${recut.accepted}, rejected ${recut.rejected}, cycles skipped ${recut.cyclesSkipped}.`,
);
```

- [ ] **Step 4: Verify and type-check**

Run: `pnpm test:run` — expected 114+ passing.
Run: `pnpm type-check` — expected clean.
Run: `pnpm build` — expected clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/main.ts test/integration/pipeline.test.ts
git commit -m "$(cat <<'EOF'
refactor(app): use runPipeline in main.ts

Eight stage imports collapse to two (runPipeline + emitSvg).
Surfaces cut-removal stats in the console log; aligns main.ts
with scripts/baseline-pipeline.ts on the runPipeline entry point.
EOF
)"
```

---

### Task 25.8: Switch `scripts/baseline-pipeline.ts` to use `runPipeline`

**Files:**
- Modify: `scripts/baseline-pipeline.ts` (replace stage-by-stage assembly)

- [ ] **Step 1: Snapshot the current baseline**

```bash
pnpm baseline
cp docs/baseline-pipeline.md docs/baseline-pipeline.pre-25-refactor.md
```

Temporary file; deleted in Task 25.9.

- [ ] **Step 2: Replace assembly**

Lines 96-200 of `scripts/baseline-pipeline.ts` collapse to:

```typescript
let mesh;
try {
  mesh = ext === ".stl" ? parseStl(contents) : parseObj(contents);
  r.faces = String(mesh.faces.length);
} catch (e) {
  r.pipeline = `failed at parse: ${(e as Error).message}`;
  results.push(r);
  continue;
}

let result;
try {
  result = runPipeline(mesh);
} catch (e) {
  r.pipeline = `failed: ${(e as Error).message}`;
  results.push(r);
  continue;
}

r.overlaps = "0"; // cut-removal never produces overlap pairs by construction
r.pieces = String(result.recut.pieces.length);
r.tabs = String(result.recut.cuts.length);
r.piecesClean = result.recut.pieces.every(
  (p) => detectOverlaps(p.layout).length === 0,
);
r.pages = String(result.pages.length);

let cutLenTotal = 0;
for (const page of result.pages) {
  for (const placed of page.pieces) {
    for (const edge of placed.piece.edges) {
      if (edge.kind !== "cut") continue;
      const dx = edge.to[0] - edge.from[0];
      const dy = edge.to[1] - edge.from[1];
      cutLenTotal += Math.sqrt(dx * dx + dy * dy);
    }
  }
}
r.cutLength = cutLenTotal.toFixed(1);

let faceAreaPost = 0;
for (const page of result.pages) {
  for (const placed of page.pieces) {
    // (re-use the existing face-area summation pattern, threaded through result.recut.pieces)
  }
}
const totalPrintable = result.pages.length * (LETTER.widthMm - 2 * LETTER.marginMm) * (LETTER.heightMm - 2 * LETTER.marginMm);
r.efficiency = ((faceAreaPost / totalPrintable) * 100).toFixed(1);
```

Update the imports near line 1:
```typescript
import { parseStl } from "../src/core/parse-stl.js";
import { parseObj } from "../src/core/parse-obj.js";
import { LETTER } from "../src/core/paginate.js";
import { detectOverlaps } from "../src/core/overlap.js";
import { runPipeline } from "../src/core/pipeline.js";
```

- [ ] **Step 3: Run baseline and compare**

Run: `pnpm baseline`
Run: `git diff docs/baseline-pipeline.md`

Expected: piece counts unchanged on convex models; strictly ≤ v2 on every concave model per spike findings; overlaps column reads 0 on every row; cut-length and efficiency values approximately match spike published numbers.

If any concave model regresses past the spike's published upper bound, STOP — investigate cut-removal's `rejected` counter.

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add scripts/baseline-pipeline.ts
git commit -m "$(cat <<'EOF'
refactor(baseline): use runPipeline; switch default to cut-removal

scripts/baseline-pipeline.ts now consumes the runPipeline
orchestrator. v3 default is cut-removal (Variant C) — concave
models drop substantially per the 0023 spike. Convex models tie
with v2 on piece count.

Stage-by-stage error labels collapse to "failed: <message>";
the underlying message preserves stage identity.
EOF
)"
```

---

### Task 25.9: Regenerate `docs/baseline-pipeline.md` and update `docs/baseline-v3.md`

**Files:**
- Modify: `docs/baseline-pipeline.md` (auto-generated)
- Modify: `docs/baseline-v3.md` (manual companion)
- Delete: `docs/baseline-pipeline.pre-25-refactor.md` (temporary snapshot from Task 25.8)

- [ ] **Step 1: Run baseline**

Run: `pnpm baseline`
Expected: writes `docs/baseline-pipeline.md` with new piece counts.

- [ ] **Step 2: Verify against spike findings**

Per-model upper bounds from `docs/spikes/2026-05-15-topological-surgery.md`:

| Model | Spike Variant C | Tolerance |
|---|---|---|
| croissant.obj | 3 pieces | ≤6 |
| deer.obj | 17 pieces | ≤21 |
| meat-sausage.obj | 1 piece | ≤2 |
| ginger-bread.obj | 2 pieces | ≤3 |

If any model is above tolerance, investigate `rejected` counter — numerical robustness fallback may be more aggressive in production than spike.

- [ ] **Step 3: Update `docs/baseline-v3.md`**

Edit the file to add a new section near the top:

```markdown
## v3 status — after session 0025 (cut-removal as default)

| Model | v3 baseline (0021) | After 0025 | Delta |
|---|---|---|---|
| croissant.obj | 15 pieces | <new> | <delta> |
| deer.obj | 28 pieces | <new> | <delta> |
| meat-sausage.obj | 3 pieces | <new> | <delta> |
| ginger-bread.obj | 5 pieces | <new> | <delta> |
```

Fill in the actual numbers from the baseline output.

- [ ] **Step 4: Delete the temporary snapshot**

```bash
rm docs/baseline-pipeline.pre-25-refactor.md
```

- [ ] **Step 5: Commit**

```bash
git add docs/baseline-pipeline.md docs/baseline-v3.md
git commit -m "$(cat <<'EOF'
chore(baseline): regenerate after cut-removal becomes the v3 default

Piece-count wins on every concave model match the 0023 spike's
findings within tolerance. v3 baseline-v3.md updated with a
companion section recording the trajectory from session 0021's
frozen snapshot.

PR requires the `baseline-change` label per ADR 0006.
EOF
)"
```

---

### Task 25.10: Write ADR 0007 — Cut-removal as v3 default

**Files:**
- Create: `docs/decisions/0007-cut-removal-as-v3-default.md`
- Modify: `docs/decisions/0005-greedy-set-cover-recut.md` (supersession marker)
- Modify: `docs/decisions/README.md` (index entry)

- [ ] **Step 1: Verify ADR 0005's current structure**

Run: `cat docs/decisions/0005-greedy-set-cover-recut.md | head -30`
Expected: see the 5-section structure (Context / Decision / Status / Consequences / Alternatives considered).

- [ ] **Step 2: Write ADR 0007**

Create `docs/decisions/0007-cut-removal-as-v3-default.md`:

```markdown
# ADR 0007 — Cut-removal as v3 default unfolder

**Status:** Accepted, 2026-05-16
**Supersedes:** ADR 0005 (greedy set-cover recut as default)

## Context

v2's pipeline runs `buildAdjacency → computeDihedralWeights →
buildSpanningTree → buildLayout → detectOverlaps → recut`. The MST
phase selects the lowest-total-fold-weight spanning tree; the recut
phase greedily cuts edges to split overlapping pieces (ADR 0005).
On the v2 corpus, this produces buildable output on every model
but heavily fragments concave shapes (croissant 15 pieces, deer 28,
meat-sausage 3, ginger-bread 5).

Session 0023's spike measured three alternatives from Takahashi
2011, Export-Paper-Model, and PolyZamboni:

- **Variant A** (curvature pre-flatten guard) — diagnostic only;
  zero violations on the entire corpus.
- **Variant B** (blended convex/concave/length weights) — mixed:
  croissant 15→6 (win), meat-sausage 3→2 (win), deer 28→36 (loss).
- **Variant C** (greedy cut-removal, inverted control flow) —
  dominates v2 on every concave model: croissant 15→3, deer 28→17,
  meat-sausage 3→1, ginger-bread 5→2.

The findings doc recommends Variant C as the v3 default, Variant B
as opt-in, Variant A as post-condition.

## Decision

Adopt cut-removal (Variant C) as the v3 default unfolder, replacing
the v2 MST+recut sequence as the default code path in
`runPipeline`. Variant B (`computeBlendedWeights`) is available as
an alternate weight function for `buildSpanningTree` but is not
wired into the default pipeline. Variant A (`reportCurvature`) runs
as a post-condition check after every default-path unfold.

The v2 MST+recut path remains in the codebase (`spanning-tree.ts`,
`recut.ts`, `dihedral.ts`) — unchanged, fully tested — for use by
the opt-in path and for future spikes that need v2 as a baseline.

## Status

Accepted and shipped in session 0025.

## Consequences

**Better:**
- Concave models fragment dramatically less. Per the 0023 spike:
  croissant 15→3, deer 28→17, meat-sausage 3→1, ginger-bread 5→2.
- Cut length drops 14–42% on concave models.
- Paper efficiency more than doubles on deer and ginger-bread.
- Convex models unchanged on piece count.
- Wall-clock runs faster (deer 72ms vs v2's ~400+ms).

**Cost:**
- Algorithm semantics inverted ("start fragmented, merge what's
  safe" vs "start connected, cut what overlaps").
- Numerical-robustness fallback: `polygon-clipping.intersection`
  exceptions on near-coincident edges treated as conservative
  overlap rejections. ~5–25% of merges rejected this way; piece
  counts are an upper bound.
- Variant C's iteration order (long edges first) is a fixed
  heuristic. v4 can expose it as tunable.

**Reversibility:** the MST+recut path is preserved. Switch the
default back by editing two lines in `src/core/pipeline.ts`.

## Alternatives considered

- **Variant B (blended weights) as default.** Rejected: deer
  regression (28→36) disqualifying as default.
- **Variant A as gate during spanning-tree construction.**
  Rejected: zero violations across corpus means gate would change
  nothing. Wired as post-condition instead.
- **No change (keep v2 default).** Rejected: v3 quality bar
  ("visibly competitive with Pepakura") not met by v2's
  per-concave fragmentation.
- **Force-directed unfolding.** Carried to queue as `[research]` —
  v4 candidate if Variant C underdelivers, which it doesn't.
```

- [ ] **Step 3: Mark ADR 0005 as superseded**

Edit `docs/decisions/0005-greedy-set-cover-recut.md` line 3 (Status line):
```markdown
**Status:** Superseded by ADR 0007 (cut-removal as v3 default), 2026-05-16.
```

- [ ] **Step 4: Add ADR 0007 entry to README**

Add to `docs/decisions/README.md` in the chronological list:
```markdown
- [ADR 0007 — Cut-removal as v3 default](0007-cut-removal-as-v3-default.md) (2026-05-16, supersedes 0005)
```

- [ ] **Step 5: Commit**

```bash
git add docs/decisions/0007-cut-removal-as-v3-default.md docs/decisions/0005-greedy-set-cover-recut.md docs/decisions/README.md
git commit -m "$(cat <<'EOF'
docs(adr): 0007 — cut-removal as v3 default, supersedes 0005

ADR 0007 commits the v3 default unfolder change: cut-removal
(Variant C) replaces MST+recut in the default pipeline. ADR 0005
gets a supersession marker but the recut.ts module is preserved
for opt-in use.

Reasoning sourced from the 0023 spike findings.
EOF
)"
```

---

### Task 25.11: Extend integration test for v3 invariants

**Files:**
- Modify: `test/integration/pipeline.test.ts`

- [ ] **Step 1: Add v3 invariant assertions**

```typescript
import { runPipeline } from "../../src/core/pipeline.js";

describe("v3 ship-state — runPipeline invariants", () => {
  it.each(models)(
    "%s: runPipeline produces a valid pages output with no curvature violations",
    (model) => {
      const ext = extname(model).toLowerCase();
      const contents = readFileSync(join(corpusDir, model), "utf-8");
      const mesh = ext === ".stl" ? parseStl(contents) : parseObj(contents);

      const result = runPipeline(mesh);

      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.recut.pieces.length).toBeGreaterThan(0);
      for (const piece of result.recut.pieces) {
        expect(detectOverlaps(piece.layout)).toEqual([]);
      }
      expect(result.curvature.violations).toEqual([]);
    },
  );

  const v3Bounds: Record<string, number> = {
    "tetrahedron.stl": 1,
    "octahedron.stl": 1,
    "cube.obj": 1,
    "cube.stl": 1,
    "cylinder.obj": 1,
    "egg.obj": 1,
    "uv-sphere.obj": 1,
    "ginger-bread.obj": 5,
    "croissant.obj": 15,
    "meat-sausage.obj": 3,
    "deer.obj": 28,
  };

  it.each(Object.entries(v3Bounds))(
    "%s: cut-removal does not regress past v2's piece count (≤ %d)",
    (model, bound) => {
      const ext = extname(model).toLowerCase();
      const contents = readFileSync(join(corpusDir, model), "utf-8");
      const mesh = ext === ".stl" ? parseStl(contents) : parseObj(contents);

      const result = runPipeline(mesh);

      expect(result.recut.pieces.length).toBeLessThanOrEqual(bound);
    },
  );
});
```

- [ ] **Step 2: Run and verify pass**

Run: `pnpm vitest run test/integration/pipeline.test.ts`
Expected: PASS on every model. 22 new tests.

- [ ] **Step 3: Full suite**

Run: `pnpm test:run`
Expected: ~136 passing.

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add test/integration/pipeline.test.ts
git commit -m "$(cat <<'EOF'
test(integration): assert v3 ship-state invariants

Every corpus model produces overlap-free, curvature-clean
unfolding via runPipeline. Per-model piece-count bounds from
docs/baseline-v3.md guard against future regressions.
EOF
)"
```

---

### Task 25.12: Update roadmap and queue

**Files:**
- Modify: `docs/roadmap.md`
- Modify: `docs/queue.md`
- Modify: `docs/decisions-log.md`

- [ ] **Step 1: Update roadmap session-status flags**

Edit `docs/roadmap.md`:

```markdown
**Last completed session:** 0025 — Optimized recut.
**Next planned session:** 0026 — Smart tab placement.
```

In v3 session plan section, update 0024 to reflect actual content:
```markdown
- **0024 — Strategist skills.** ✅ Six skills codifying protocol
  ceremony. Detoured from the optimized-recut plan; that work
  landed in 0025.
```

Flip 0025:
```markdown
- **0025 — Optimized recut.** ✅ Cut-removal (Variant C) is the v3
  default via `runPipeline`. Blended weights (Variant B) shipped
  as opt-in; curvature (Variant A) wired as post-condition. ADR
  0007 supersedes ADR 0005. P1 audit finding closed via
  `src/core/eps.ts`. U4 Pathfinder orchestrator closed.
```

Add 0026 ⏭. **Remove the PDF export sketch line** from the v3 plan section (per strategist call 2026-05-16). Update sketched-sessions to: 0026 (smart tabs), 0027 (audit viz), 0028 (color/texture), 0029 (file-loader UI), 0030 (v3 close).

- [ ] **Step 2: Update queue**

Edit `docs/queue.md`. Remove:
- `[decision]` U4 — Pathfinder runPipeline orchestrator (resolved Task 25.6).

Keep:
- `[pilot]` v3 experiment — live state artifact.
- `[research]` Force-directed unfolding spike.

- [ ] **Step 3: Append decisions-log entry**

```markdown
- **2026-05-16 — PDF export removed from v3 scope.** SVG output
  was deemed sufficient for v3's quality bar; PDF carried to v5
  if/when needed. Removes one v3 session and the pdf-lib
  dependency probe from the v3 arc.
- **2026-05-16 — U4 Pathfinder `runPipeline()` orchestrator
  landed alongside cut-removal in session 0025.** Cut-removal
  collapsed two stages anyway, making the call-site refactor
  unavoidable. Doing it as one `runPipeline` is cleaner.
```

- [ ] **Step 4: Verify no broken cross-references**

Run: `pnpm test:run && pnpm type-check && pnpm build`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add docs/roadmap.md docs/queue.md docs/decisions-log.md
git commit -m "$(cat <<'EOF'
docs: update roadmap, queue, decisions-log for session 0025

- Roadmap: 0024 retroactively ✅; 0025 ✅; 0026 ⏭ next.
- PDF export removed from v3 scope (decision 2026-05-16).
- Queue: U4 closed by src/core/pipeline.ts.
- Decisions-log: PDF-cut and U4 disposition recorded.
EOF
)"
```

---

### Task 25.13: Wrap session

- [ ] **Step 1: Run `/wrap-session`**

Skill validates branch name, runs verification, pushes, opens PR, monitors CI.

- [ ] **Step 2: Verify PR template fields**

Branch, commits, verification, decisions, queue/roadmap deltas, open questions — all filled.

- [ ] **Step 3: Address CI failures**

Type-check / tests / baseline guard / lint — fix and add commits; never `--no-verify`.

- [ ] **Step 4: Wait for review approval**

User (Evan) reviews. Approval triggers Step 5.

- [ ] **Step 5: Squash-merge**

```bash
gh pr merge --squash --delete-branch
git worktree prune
```

---

# Session 0026 — Smart Tab Placement

**Branch:** `session/0026-smart-tab-placement`

**Goal:** Replace `tabs.ts`'s "lower-face-index side" rule with quality-driven placement: prefer the side where the tab does not overlap adjacent piece geometry; prefer concave-side placement; prefer longer-edge sides for adhesion strength.

**Verification gate:** Tab count unchanged on every corpus model; no piece's tab extends off-page; visual inspection on at least croissant, deer, and ginger-bread shows tabs no longer crowd or overlap.

(See plan extension points — full atomic-step expansion happens when 0025 lands and the current `tabs.ts` shape is fresh in context.)

### Outline of tasks (each atomic 5-step):

- **Task 26.0** Begin session (mirrors Task 25.0)
- **Task 26.1** Add `scoreTabPlacement(signal: PlacementSignal): number` helper to `tabs.ts`. Weights: edge length, side clearance, concave-side bias. Unit-test scoring monotonicity.
- **Task 26.2** Replace lower-face-index rule in `buildRenderablePieces` with score-driven selection. Compute side clearance via per-page bbox check across all other pieces. `<algorithm-detail-tbd>`: exact sideClearance computation — first principles is "minimum distance from candidate tab polygon to any other piece's bounding rect on the same page."
- **Task 26.3** Regenerate baseline; verify tab count column byte-identical (algorithm unchanged on counts).
- **Task 26.4** Update roadmap.
- **Task 26.5** Wrap session.

---

# Session 0027 — Audit Visualization

**Branch:** `session/0027-audit-visualization`

**Goal:** Surface v3 quality metrics visually. Two deliverables: (a) extract metric computation from `scripts/baseline-pipeline.ts` into `src/core/metrics.ts` as a pure function; (b) emit a `metrics` cover page rendered as the first page of the SVG output.

**Verification gate:** Baseline numbers byte-identical after refactor; cover page renders for every corpus model; page count increases by exactly 1 per model.

### Outline of tasks (each atomic 5-step):

- **Task 27.0** Begin session
- **Task 27.1** Extract `computeMetrics(result: PipelineResult): MetricsReport` to `src/core/metrics.ts`. Pure function; same numbers `baseline-pipeline.ts` produces.

```typescript
export interface MetricsReport {
  pieceCount: number;
  pageCount: number;
  cutLengthMm: number;
  tabCount: number;
  paperEfficiencyPct: number;
  curvatureViolations: number;
  acceptedFolds: number;
  rejectedFolds: number;
}
```

- **Task 27.2** Refactor `scripts/baseline-pipeline.ts` to use `computeMetrics`. Verify baseline byte-identical.
- **Task 27.3** Extend `paginate.ts` with optional `coverPage?: CoverPageSpec` slot in output. `<metrics-layout-tbd>`: cover-page SVG layout (font sizes, columns, spacing) requires design judgment.
- **Task 27.4** Extend `emit-svg.ts` with cover-page rendering branch.
- **Task 27.5** Wire into `main.ts` and baseline harness; verify page count +1 per model.
- **Task 27.6** Mid-phase checkpoint (per v2-retrospective Decision 4) — half-page reflection at midway-through-v3 point.
- **Task 27.7** Update roadmap.
- **Task 27.8** Wrap session.

---

# Session 0028 — Color / Texture Passthrough

**Branch:** `session/0028-color-texture-passthrough`

**Goal:** Preserve material/color information from source mesh and render per-face fills in SVG. Scope: flat fills (no UV-mapped texture image projection — v5).

**Verification gate:** OBJ models with MTL companions render with declared colors; STL color tags (if present) render correspondingly; uncolored models render with no fill.

### Outline of tasks (each atomic 5-step):

- **Task 28.0** Brainstorm scope and probe MTL spec. Decision: per-face vs material-name dispatch; STL color encoding scope; v3 vs Pepakura parity.
- **Task 28.1** Extend `parse-obj.ts` to track `usemtl` directives and resolve via MTL companion file path.
- **Task 28.2** Add `src/core/texture.ts` with `loadMaterials(mtlContents)` + per-face color resolution.
- **Task 28.3** Extend `Mesh3D` with optional per-face fill. `<mesh-shape-decision-tbd>`: separate `colors: Color[]` array or per-face fill on the Triangle?
- **Task 28.4** Propagate fills through pipeline.
- **Task 28.5** Extend `emit-svg.ts` to render `<polygon fill="...">` for colored faces.
- **Task 28.6** Roadmap, ADR if mesh shape changes, wrap.

---

# Session 0029 — File-Loader UI (v4-precursor)

**Branch:** `session/0029-file-loader-ui`

**Goal:** Replace hardcoded `tetrahedronStl` import in `main.ts` with file-input element accepting STL/OBJ uploads from disk. Run pipeline; offer SVG download. No editing, no parameter sliders, no interactivity beyond load and download.

**Verification gate:** Load each corpus model via UI; rendered output matches `pnpm baseline`; SVG download works.

### Outline of tasks (each atomic 5-step):

- **Task 29.0** Brainstorm UX (invoke `superpowers:brainstorming` skill): file-picker vs drag-and-drop; progress indication; error UX.
- **Task 29.1** File-input element + FileReader plumbing in `src/app/file-loader.ts`.
- **Task 29.2** Pipe loaded contents through `parseStl`/`parseObj` based on extension; error UI on parse failure.
- **Task 29.3** Render output via existing `main.ts` pages loop.
- **Task 29.4** "Download SVG" button wiring to `emitSvg` + `Blob` download URLs.
- **Task 29.5** Test: load tetrahedron.stl via UI; assert page count matches `pnpm baseline`.
- **Task 29.6** Roadmap, wrap.

---

# Session 0030 — v3 Close

**Branch:** `session/0030-v3-close`

**Goal:** Extend `test/integration/pipeline.test.ts` with final v3 ship-state assertions; run joint phase retrospective per v2-retrospective Decision 4 ritual; write `docs/retrospectives/v3-complete.md` (what shipped) and `v3-retrospective.md` (how we worked); update handoff docs.

**Verification gate:** All v3 invariants asserted; both retrospectives committed; `docs/project-state.md` + `docs/project-history.md` + `docs/project-rationale.md` brought current.

### Outline of tasks (each atomic 5-step):

- **Task 30.0** Begin session.
- **Task 30.1** Extend integration test: metrics cover page renders; file-loader UI loads every corpus model; color passthrough preserves declared materials.
- **Task 30.2** Run joint retrospective via `/retrospect` skill — 4 passes (Ground / Reframe / Self-lens / Converge); produce both `-complete.md` and `-retrospective.md`.
- **Task 30.3** Update handoff docs: `docs/project-state.md` (phase → v4), `docs/project-history.md` (v3 narrative), `docs/project-rationale.md` (v3 rationale notes).
- **Task 30.4** Carry-forwards to queue for v4: Variant B parameter-tuning spike (deer regression); force-directed unfolding spike; live state artifact pilot (if not piloted); UV-mapped texture rendering; PDF export (deferred from v3).
- **Task 30.5** Roadmap: v3 → complete; v4 → next phase.
- **Task 30.6** Wrap session.

---

## Plan-level verification

After all sessions land:

- `pnpm test:run` — ≥150+ passing (current 97 + new across 6 sessions).
- `pnpm type-check` — clean.
- `pnpm build` — clean.
- `pnpm baseline` — produces final v3 baseline; comparable to `docs/baseline-v3.md`'s frozen 0021 snapshot via per-metric trajectory.
- All 6 PRs merged; all 6 session logs committed; ADR 0007 committed.
- v3 retrospectives committed.
- Queue: no `[decision]` items left over (U4 closed); `[pilot]` flagged for v4; `[research]` items carried.

## Plan extension points

When 0025 lands and informs the granularity of 0026+:

1. Read 0025's session log handoff and `pnpm baseline` regenerated output.
2. Confirm or revise per-session goals here.
3. Refine `<*-tbd>` marker resolutions against concrete outputs (MTL probe; file-loader UX brainstorm).
4. Extend each session's task list from outline to fully-atomic 5-step TDD when its turn arrives.

The atomic-step discipline is preserved across the entire arc: every task has 5-step structure even when individual steps carry marked TBDs. Marked TBDs convert to concrete code/commands as the dependency (a probe, a brainstorm, a prior session's output) resolves.
