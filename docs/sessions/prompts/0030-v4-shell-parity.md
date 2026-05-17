# Session 0030 — v4.0 shell parity

**Work type:** numbered session.
**Branch:** `session/0030-v4-shell-parity`.
**Land via:** worktree → PR → CI green → squash-merge per ADR 0006.

## Goal

Migrate the unfolder app from imperative three.js + plain DOM into a React + react-three-fiber shell, with a Zustand store wiring the v4 state shape (in-memory only) and Playwright + React Testing Library infrastructure in place. The dev-only build runs the existing v3 pipeline on the hardcoded `ginger-bread.obj + .mtl` demo and renders the same output as `pnpm dev` on `main` did at session start (`main` ≥ `2ba5bb4` for the v4 spec revision).

v4.0 is an **internal milestone** per `docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md` § 3 — no user-visible change vs. today. The work is the foundation that v4.1–v4.3 ship on top of.

## Context

v4 begins per the v4 design spec. v4.0's scope is in § 3 (release sequencing); the state shape this session implements is in § 4; the four surfaces are described in § 5 but only the 3D pane and 2D pane are populated in v4.0 (preflight and drawer are out of scope).

Working agreements that apply (cited where they live; Decisions 2, 3, 5 codified in `CLAUDE.md` § 1; Decisions 1, 4, 6 live in v3-retrospective.md only — see merge commit `e288a4a` for the split rationale):

- **Visual gate** (Decision 2 — `CLAUDE.md` § 1): named in this prompt under Verification; runs before commit.
- **Plan gates report, never predict** (Decision 3 — `CLAUDE.md` § 1): no "X equals N" gates in the plan-mode-derived TDD plan.
- **Sub-agent reliability calibration** (Decision 1 — `docs/retrospectives/v3-retrospective.md`, NOT in CLAUDE.md): interpretive sub-agent tasks trusted by default; enumerative counts cross-checked with deterministic tooling.

Current state to migrate:

- `src/app/main.ts` — 44 LOC plain Vite entry. Vite `?raw` imports of `ginger-bread.obj` + `ginger-bread.mtl`, calls `runPipeline + emitSvg`, dumps the SVG into a `#net` `<div>` via `innerHTML`. The implementer should read it directly at session start.
- `src/app/render.ts` — 89 LOC imperative three.js. `Scene`, `PerspectiveCamera`, `WebGLRenderer`, `OrbitControls`, manual `requestAnimationFrame` loop, manual resize/dispose. Returns a dispose function. Read directly at session start.
- `index.html` (project root) — has the `#viewport` and `#net` divs the current `main.ts` queries. Will need updating.

Pipeline entry points (unchanged in this session):

- `runPipeline(mesh, pipelineConfig?, materials?)` in `src/core/pipeline.ts`.
- `emitSvg(page)` in `src/core/emit-svg.ts`.
- `parseObj`, `parseMtl` in `src/core/parse-obj.ts`, `src/core/parse-mtl.ts`.

Demo fixture (the parity target — same output expected from new shell):
`test/corpus/ginger-bread.obj` + `test/corpus/ginger-bread.mtl`. The post-0028 baseline numbers live in `docs/baseline-pipeline.md`. Implementer reports the actual rendered counts at parity-check time rather than asserting them ahead.

## Files

**Created:**

- `src/app/main.tsx` — React entry point; mounts the root component.
- `src/app/App.tsx` — top-level component composing the 3D pane and 2D pane.
- `src/app/Viewport3D.tsx` — r3f component replacing `createViewport()`.
- `src/app/PatternPane.tsx` — React component wrapping the `emitSvg()` output.
- `src/app/store.ts` — Zustand store with the v4 spec § 4 state shape.
- `src/app/PatternPane.test.tsx` — RTL unit test (one assertion: renders one `<svg>` per `pages` entry).
- `playwright.config.ts` — Playwright config.
- `tests/e2e/shell-parity.spec.ts` — one smoke test: app boots without console errors, 3D canvas renders, 2D pane contains an `<svg>` per page, captures screenshot for visual gate.

**Modified:**

- `package.json` — add `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `immer`, `@types/react`, `@types/react-dom`. Add dev-deps `@testing-library/react`, `@playwright/test`, `@vitejs/plugin-react`.
- `vite.config.ts` — register the React plugin.
- `tsconfig.json` — JSX + React-related changes as required by the project's current TS config.
- `index.html` — replace `#viewport` + `#net` with a single React mount target `#root`.
- `vitest.config.ts` (or extend `vite.config.ts`) — flip the test environment to `jsdom` (or `happy-dom`) and expand the include glob to cover both `test/**/*.test.ts` (existing Vitest tests) and `src/**/*.test.tsx` (new RTL component tests).
- `.github/workflows/ci.yml` — add a Playwright job. Existing `pnpm test:run`, `pnpm type-check`, `pnpm build` jobs continue.

**Deleted:**

- `src/app/main.ts` — superseded by `main.tsx`.
- `src/app/render.ts` — superseded by `Viewport3D.tsx`.

**Untouched:** all of `src/core/`, `test/corpus/`, `test/unit/`, `test/integration/`, `test/property/`. The pipeline does not change. No baseline regen.

## Tasks

The implementer drafts the atomic plan in plan mode before code, per `CLAUDE.md` § 1. Use the 5-step TDD pattern where applicable (write failing test → run/fail → implement → run/pass → commit). Plan gates are report-form, not predicted-value (per CLAUDE.md "Plan gates report, never predict").

Sketch of the task arc; the implementer refines numbering and decomposition in plan-mode.

1. **State-management library: Zustand + Immer per spec.** The v4 design spec § 4 flags this as a "low-confidence call — open to alternatives if a director-level preference exists." Strategist resolution at prompt-drafting time: proceed with Zustand + Immer per the spec. Rationale: hooks-native, plays well with r3f, ~4 kB compressed, idiomatic for the §4 state shape. If library probing in Task 2 surfaces a concrete obstacle (broken API, version conflict, etc.), stop and surface the obstacle — do not silently swap libraries.

2. **Dependencies + Vite React plugin.** Run `NODE_OPTIONS="--use-system-ca" pnpm add react react-dom @react-three/fiber @react-three/drei zustand immer` (or alternate state library per Task 1) and the dev-dep additions. Register the React plugin in `vite.config.ts`. **Probe the library APIs before writing code** — confirm current `@react-three/fiber` `<Canvas>` and `@react-three/drei` `<OrbitControls>` APIs, and the current Zustand-with-Immer middleware pattern. Do not assume from memory; CLAUDE.md "doc-fetch and probe before writing prompts that involve new tools/libraries" extends here.

3. **State store.** Define the Zustand store in `src/app/store.ts` per the v4 spec § 4 shape (see Appendix for the verbatim shape). Three categories: SOURCE OF TRUTH (`sourceMesh`, `pipelineConfig`, `pinnedRegions`, `appliedFixes`), DERIVED (`currentLayout` as the only populated derived value in v4.0; `preflightReport` and `fixSuggestions` are typed but stubbed empty), UI EPHEMERA (`selection`, `hover`, panel/drawer state — typed; values are stubs). The `appliedFixes` entry type carries `{ regionSelector, constraintChange, seed: u32, edgeOrderHash: string }` even though no entries are ever appended in v4.0 — the shape lock is the point.

4. **`Viewport3D.tsx`.** Build an r3f component that takes a `Mesh3D` and renders the same 3D scene `createViewport()` produces today. Behavior contract — read `src/app/render.ts` for current values; pick the JSX primitive names from the Task 2 library probe: ambient + directional lighting with the same intensities, a flat-shaded `MeshStandardMaterial` in `#6b88a8`, a perspective camera at `(3, 2, 3)`, damping-enabled orbit controls. r3f handles the render loop and dispose declaratively — no manual `requestAnimationFrame`, no manual resize listener, no manual disposal.

5. **`PatternPane.tsx`.** A React component that takes `pages: Page[]` from the pipeline and renders one card per page. Each card renders the `emitSvg(page)` string output. `dangerouslySetInnerHTML` is acceptable in v4.0 — no per-piece React structure (that lands in v4.1 when piece-drag arrives).

6. **App composition.** Top-level `App.tsx` reads the store, runs the pipeline once on mount using the same `gingerBreadObj + gingerBreadMtl` Vite `?raw` imports, populates the store (`sourceMesh`, `currentLayout`), and renders `Viewport3D` + `PatternPane`. The hardcoded fixture path is preserved — no file-loader UI in v4.0.

7. **Bootstrap migration.** Convert `main.ts` → `main.tsx`, replacing the DOM-imperative bootstrap with a React root mount. Delete `render.ts`. Update `index.html` to expose a single `#root` mount point.

8. **Test infrastructure.** Add `playwright.config.ts` configured to run against `pnpm dev`. Write `tests/e2e/shell-parity.spec.ts` — one Playwright smoke that: (a) boots the app, (b) asserts no console errors during boot, (c) asserts the 3D canvas mounts, (d) asserts the 2D pane contains exactly one `<svg>` per emitted page, and (e) captures a `page.screenshot()` saved to `docs/sessions/0030-visual-gate/after.png` for the visual gate (see Task 10). The existing Vitest config has `environment: "node"` and `include: ["test/**/*.test.ts"]`; RTL component tests need a DOM environment, so add `jsdom` (or `happy-dom`) as a dev-dep, flip the test environment, and expand the include glob to cover `src/**/*.test.tsx`. Add at least one RTL test asserting `PatternPane` renders one `<svg>` per `pages` entry. The split between `tests/e2e/` (plural, Playwright convention) and `test/` (singular, Vitest convention) is intentional and worth a one-line note in the new `playwright.config.ts` so a future maintainer sees the divide.

9. **CI.** Add a Playwright job to `.github/workflows/ci.yml`. Browser matrix on CI: Chromium, Firefox, WebKit (Playwright's WebKit approximates Safari and runs on the existing Ubuntu runners). Safari 16+ proper is best-effort per v4 design spec § 9 and is NOT in CI (Ubuntu runners cannot run Safari directly); do not gate on Safari-native until separately verified.

10. **Visual gate.** Mechanism (per CLAUDE.md § 1's visual-gate working agreement and `scripts/visual-gate.ts` reference — that script does not yet exist; this session implements the screenshot capture via Playwright instead, since Playwright lands in Task 8 anyway): at session start (before any code changes) capture `docs/sessions/0030-visual-gate/before.png` from a Playwright script that loads `pnpm dev` on the unchanged tree. After the migration is complete, the Task 8 smoke produces `after.png`. Diff manually (side-by-side in any image viewer) and report the result in the session log. Acceptable diffs: minor anti-aliasing or font-rendering shifts. Unacceptable: missing pieces, wrong colors, mis-positioned tabs, foldability tint changes, broken or missing 3D mesh. The `before.png` / `after.png` files are transient (NOT committed) — same pattern as session 0029's `scripts/probe-v3-sweep.ts`.

11. **Session log.** Document deviations from this prompt, the visual-gate result, any obstacles surfaced by the library probe in Task 2, and any mid-session revisions to the report-form gates in this prompt.

## Specs

**Parity invariant (the v4.0 commitment).** Running `pnpm dev` after this session renders the same output for `ginger-bread.obj + .mtl` as `pnpm dev` on `main` did at session start. Concrete check points the implementer measures and reports (in report-form — do not predict the values):

- The 2D pane shows the same page-card structure as the pre-migration render: same number of pages, same number of piece outlines per page, same foldability tint distribution per page, same face-fill polygon count and color, same edge labels and tab polygons. Implementer reports the actual numbers.
- The 3D pane shows the gingerbread mesh with the same default camera position `(3, 2, 3)`, the same ambient + directional lighting, the same `#6b88a8` flat-shaded material.
- Orbit controls behave the same: damping enabled, pan/zoom/rotate work, mouse-up doesn't snap.

**Store shape.** Matches v4 spec § 4 verbatim (see Appendix). The determinism contract on each `appliedFixes` entry is **encoded in the type** in v4.0 even though no entries are appended — the shape lock prevents a v4.1 type migration when edge-toggle and undo arrive.

**Core/app boundary.** `src/core/` is untouched. No React imports cross into `src/core/`. No `Suggestion` or `FixProposal` types leak UI concerns into core, per v4 spec § 4: "The fix-suggestion engine in `src/core/` returns a structured `FixProposal { kind, params, predictedLayout, predictedBadges }`. Human-readable copy, drawer ordering, preview rendering, 'why this fix' text — all live in `src/app/`." Relevant to v4.3 but the discipline starts in v4.0.

**Test gates (report-form).**
- `pnpm test:run` — report the test count; should not regress in `src/core/` coverage. Any new tests sit in `src/app/` or `tests/`.
- `pnpm type-check` clean.
- `pnpm build` clean. Bundle size will grow substantially with React + r3f + drei; report the new gzipped size in the session log, no fixed threshold required for this session.
- `pnpm dev` boots clean; report any console error.
- Playwright e2e smoke passes on Chrome, Firefox, Edge.

**Out of scope (do not implement; deferred per v4 design spec § 3):**

*Deferred to v4.1 ("I can use it"):*
- File-loader UI for drop STL/OBJ (the absorbed "session 0029 file-loader UI").
- SVG or PDF download button.
- Save / load `.unfolder.json` (file-based; no IndexedDB yet).
- Manual piece drag-to-rearrange.
- Bidirectional 3D↔2D highlight.
- Manual edge cut/fold toggle (also requires v3.5).
- Undo / redo via `appliedFixes` traversal (also requires v3.5's determinism contract).

*Deferred to v4.2 ("I get feedback"):*
- Per-piece risk badges.
- Inside/outside inference + override.
- Preflight panel content (surface is stubbed/absent in v4.0).
- Auto-save / IndexedDB / persistence.
- Mesh hashing or `meshHash` field.

*Deferred to v4.3 ("I get fixes"):*
- Fix-suggestion engine, drawer, ranking.
- Region re-unfold (algorithm in v3.5).

If a task implies any of the above, the implementer should stop and surface to Evan rather than scope-creep.

## Verification

Standard gates; **report counts and sizes, do not predict them**:

1. `pnpm test:run` — all passing; report total count.
2. `pnpm type-check` — clean.
3. `pnpm build` — clean; report new gzipped bundle size.
4. **Playwright e2e smoke** (`tests/e2e/shell-parity.spec.ts`) — passes locally and in CI. The smoke subsumes the older "`pnpm dev` boots clean" check: it boots the dev server, asserts no console errors, asserts canvas + svg presence, and captures the after-screenshot. (There's no exit code for a long-running dev server; the assertion lives inside the smoke.)
5. **Visual-gate diff** — `before.png` vs. `after.png` compared per Task 10; result documented in the session log.
6. **CI green** on the PR before merge.
7. **No scope creep gate** — `git diff main -- src/core/` is empty (v4.0 does not touch core); `git diff main -- test/corpus/ test/unit/ test/integration/ test/property/` is empty (pipeline tests not changed by this session).

## Appendix

### State shape (verbatim from v4 design spec § 4)

```
SOURCE OF TRUTH (persisted from v4.1; v4.0 in-memory only)
  ├─ sourceMesh         — Mesh3D, immutable once loaded
  ├─ pipelineConfig     — weight fn, recut variant, tab strategy, page spec
  ├─ pinnedRegions      — Set<{pieceId | faceIds}>
  └─ appliedFixes       — ordered list; each entry =
                          { regionSelector, constraintChange,
                            seed: u32, edgeOrderHash: string }

DERIVED (cached, recomputed lazily)
  ├─ currentLayout      — re-run pipeline applying fixes in order
  ├─ preflightReport    — piece count, scale, mesh hygiene, per-piece risk badges
  └─ fixSuggestions     — per-badge ranked fix proposals

UI EPHEMERA (not undoable, not persisted)
  └─ selection, hover, panel state, drawer state
```

### v4.0 line items (verbatim from v4 design spec § 3)

```
v4.0  Shell parity (INTERNAL milestone)         ~2–3 sessions
   No user-visible change vs current pipeline output. The work is the
   foundation that v4.1–v4.3 ship on top of.
   ├─ React + react-three-fiber app shell
   ├─ Zustand store with the §4 state shape
   │  (regionSelector, pinnedRegions, appliedFixes
   │  are v4.0 IN-MEMORY ONLY — no persistence
   │  format committed yet)
   ├─ Migrate src/app/render.ts from imperative
   │  three.js to declarative r3f
   ├─ Wrap existing emitSvg output in React
   │  component (the 2D pane)
   ├─ Playwright + React Testing Library infra
   └─ Ship state: dev-only build that runs the
      v3 pipeline and renders the same output
      as today, behind a new React shell.
```
