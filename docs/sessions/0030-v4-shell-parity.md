## Session 0030 — v4.0 shell parity

## What was attempted

Migrate the unfolder app from imperative three.js + plain DOM into a
React + react-three-fiber shell, with a Zustand store wiring the v4
spec § 4 state shape (in-memory only) and Playwright + RTL test
infrastructure in place. v4.0 is an internal milestone — no
user-visible change vs. the v3 pipeline output on the hardcoded
ginger-bread.obj fixture.

## What shipped

### Seven commits on `session/0030-v4-shell-parity`

1. `5371b86 deps: react+r3f+drei+zustand+immer+playwright+rtl+jsdom; ignore visual-gate transients` — Task 1
2. `7de9598 config: register react plugin; jsx react-jsx; vitest env jsdom` — Tasks 2 + 3
3. `784015f feat(store): zustand v5 + immer; v4 § 4 shape lock` — Task 4
4. `ec92c40 feat(pane): PatternPane wraps emitSvg output in React card` — Task 5
5. `f713484 feat(viewport): r3f port of render.ts; same lights/camera/material` — Task 6
6. `ec92c40 → 0aff23c feat(shell): App composition + main.tsx; retire main.ts + render.ts` — Tasks 7 + 8
7. `8df21bd test(e2e): playwright shell-parity smoke; vite dedupe react+three` — Task 9
8. `0aff23c ci: add playwright e2e job; chromium+firefox+webkit on ubuntu` — Task 10

(Session log itself is a follow-up commit on this same branch.)

### Code surface

- **`src/app/store.ts` (new)** — `useAppStore` Zustand v5 + immer
  store. Three-category shape per v4 design spec § 4:
  - SOURCE OF TRUTH: `sourceMesh`, `pipelineConfig`, `pinnedRegions`,
    `appliedFixes[]`.
  - DERIVED: `currentLayout` (populated in v4.0), `preflightReport`
    (stubbed null), `fixSuggestions[]` (stubbed empty).
  - UI EPHEMERA: `selection`, `hover`, `panelState`, `drawerState`.
  - `AppliedFix` interface encodes the determinism contract
    (`seed: number`, `edgeOrderHash: string`) — shape-locked even
    though v4.0 never appends an entry, per the prompt's "shape lock
    is the point" instruction.
  - `RegionSelector` and `ConstraintChange` are discriminated unions
    so v4.3 fix-suggestion engine can grow variants additively.
  - Uses `immer.produce` directly instead of zustand's immer
    middleware wrapper — keeps zustand-v5 + immer-v11 type plumbing
    minimal for v4.0's four reducers. Switch to the wrapper if v4.1+
    grows many more.

- **`src/app/Viewport3D.tsx` (new)** — r3f port of the pre-v4
  `src/app/render.ts`. Same camera (fov 45, near 0.01, far 100,
  position `[3, 2, 3]`), same lights (ambient 0.4, directional 0.9
  at `[5, 5, 5]`), same material (`#6b88a8` flatShading). Geometry
  construction preserved 1:1 (BufferGeometry + Float32Array positions
  + Uint32Array indices + computeVertexNormals), memoized on the mesh
  ref. r3f handles render loop / resize / disposal declaratively —
  no manual requestAnimationFrame, resize listener, or dispose
  callback. Drei's `<OrbitControls enableDamping />` replaces the
  three/examples OrbitControls.

- **`src/app/PatternPane.tsx` (new)** — one `.page-card` per pages[]
  entry; each card wraps the v3 `emitSvg(page)` string via
  `dangerouslySetInnerHTML`. v4.0 contract is intentionally thin;
  per-piece React structure (drag, badge, highlight) lands in v4.1+.

- **`src/app/App.tsx` (new)** — composes `<Viewport3D | PatternPane>`,
  runs the v3 pipeline once on mount with the same `?raw`-imported
  `ginger-bread.obj + .mtl` the pre-v4 main.ts used, populates
  `sourceMesh + currentLayout` in the store. No file-loader UI in
  v4.0 — that's v4.1 per spec § 3.

- **`src/app/main.tsx` (new)** — React `createRoot` mount in
  `StrictMode` at `#root`.

- **`src/app/main.ts` (deleted)** — replaced by `main.tsx`.
- **`src/app/render.ts` (deleted)** — replaced by `Viewport3D.tsx`.

- **`src/app/store.test.ts` (new)** — 5 Vitest tests asserting
  store-shape lock.
- **`src/app/PatternPane.test.tsx` (new)** — 2 RTL tests asserting
  one `<svg>` per pages[] entry.

- **`index.html`** — replaced `#viewport` + `#net` divs with a single
  `#root` mount; same CSS styles preserved so the React-mounted
  `#app > #viewport + #net` structure lays out identically.

- **`vite.config.ts`** — registered `@vitejs/plugin-react`; flipped
  Vitest environment to `jsdom`; expanded `include` glob to cover
  `src/**/*.test.ts(x)` alongside `test/**`. Added
  `resolve.dedupe: ["react", "react-dom", "three"]` — without this,
  pnpm's strict-isolated layout produced duplicate copies at runtime
  (Invalid hook call + Multiple instances of Three.js).

- **`tsconfig.json`** — added `"jsx": "react-jsx"` (React 19 new JSX
  transform).

- **`playwright.config.ts` (new)** — three-browser matrix
  (chromium/firefox/webkit), `webServer` boots `pnpm dev` on 5173
  with `--strictPort`. Header comment documents the tests/ vs test/
  convention split (Playwright tests/e2e/ plural, Vitest test/
  singular).

- **`tests/e2e/shell-parity.spec.ts` (new)** — one smoke: boots app,
  asserts no console errors, asserts one `<canvas>` in `#viewport`,
  asserts one `<svg>` per `.page-card`, captures
  `docs/sessions/0030-visual-gate/after.png` on chromium only.

- **`.github/workflows/ci.yml`** — appended Playwright install +
  test steps and a failure-only report-upload artifact step.

- **`.gitignore`** — added entries for visual-gate transients
  (`before.png` / `after.png`), per-session probe scripts
  (`scripts/probe-*.ts`), and Playwright artifacts
  (`test-results/`, `playwright-report/`).

### Dependencies added

| Package | Version |
|---|---|
| react | 19.2.6 |
| react-dom | 19.2.6 |
| @react-three/fiber | 9.6.1 |
| @react-three/drei | 10.7.7 |
| zustand | 5.0.13 |
| immer | 11.1.8 |
| @types/react | 19.2.14 (dev) |
| @types/react-dom | 19.2.3 (dev) |
| @vitejs/plugin-react | 6.0.2 (dev) |
| @testing-library/react | 16.3.2 (dev) |
| @playwright/test | 1.60.0 (dev) |
| jsdom | 29.1.1 (dev) |

Peer-dep matrix verified before install: r3f 9 ↔ react 19.2.6 ↔
drei 10 ↔ zustand 5 all satisfied; three 0.184 (pre-existing)
satisfies r3f's `>=0.156`.

## Verification

- `pnpm test:run` — **196 / 196 passing** (189 pre-v4 baseline + 5
  store + 2 PatternPane; 23 test files total).
- `pnpm type-check` — clean.
- `pnpm build` — clean. Gzipped bundle **318.86 kB** (raw 1,145 kB).
  Pre-v4 baseline per docs/baseline notes was ~580 KB raw / not
  measured gzipped; the v4 bundle is substantially larger because
  React + r3f + drei are now in the runtime, as expected per the
  prompt's "no fixed threshold required for this session" note.
  A `chunkSizeWarningLimit` warning fires; code-splitting deferred
  to a future bundle-tuning session.
- `pnpm dev` — boots clean (no console error) on port 5173.
- **Playwright e2e** — 3/3 passing locally (chromium, firefox,
  webkit). Each: app boots, `<canvas>` mounted, `<svg>` count equals
  `.page-card` count, no console errors during boot. Chromium run
  also captures `after.png` for the visual gate.
- **Visual gate** — `before.png` (captured at session start against
  the unchanged pre-v4 tree on port 5174) and `after.png` (captured
  by the Playwright smoke against the v4 tree on port 5173) compared
  side-by-side. Verdict: **parity confirmed**. Same gingerbread
  pattern on the right pane (same 2 pieces — large brown + small
  brown — same dashed fold edges, same white tab outlines around
  cut edges, same edge labels, same foldability tint, same `#8c4d1a`
  gingerbread face fill from the 0028 color passthrough). Same blue
  `#6b88a8` flat-shaded gingerbread mesh on the left pane in the
  same default camera position. Absolute pixel positions differ
  because the two captures used different viewport widths (1440 vs
  1280) but the structural content is identical.
- **Scope-creep gate** — `git diff main -- src/core/` is empty;
  `git diff main -- test/corpus/ test/unit/ test/integration/ test/property/`
  is empty.

## What we learned

1. **pnpm + Vite + React requires explicit dedupe.** First Playwright
   run failed with "Invalid hook call" + "Multiple instances of
   Three.js" — pnpm's strict-isolated `node_modules` layout produced
   duplicate copies of React and three across the app and r3f's
   transient deps. Fix: `resolve.dedupe: ["react", "react-dom", "three"]`
   in `vite.config.ts`. Worth a note for future React-on-pnpm
   sessions; the symptom only surfaces at runtime, not at type-check
   or build, and not in the Vitest jsdom env.
2. **React 19 + the new JSX transform drops the JSX namespace.**
   First PatternPane build failed at `: JSX.Element` annotation
   under `"jsx": "react-jsx"`. Switched to inferred return types
   for v4.0 components — fine for this scope.
3. **Library probe paid off twice.** Catching the dedupe issue
   pre-CI (via a local Playwright dry-run) saved a CI round-trip.
   Catching the JSX.Element issue at type-check pre-commit saved
   another. Both surfaced fast because the plan opened with deps +
   config commits before any component code.

## Deviations from prompt

- Prompt's Tasks 7-8 were committed as a single commit (App.tsx +
  main.tsx + index.html + delete legacy) because they form one
  cohesive shell migration — splitting them would have left an
  intermediate state where main.tsx references App.tsx that doesn't
  exist, or vice versa. The plan-mode atomic split was:
  read → write → type-check → build → commit. Functionally
  equivalent to two TDD cycles since neither component has a unit
  test (App.tsx is integration-tested by the Playwright smoke;
  Viewport3D.tsx is visually-gated).
- Prompt's Task numbering had 10 = visual gate, 11 = session log.
  The visual-gate captures (before.png at session start, after.png
  in the Playwright smoke) are mechanism rather than a discrete
  task, so they fold into Tasks 0 (before) and 9 (after via smoke).
  Session log is this file.

## Open follow-ups

- **Bundle size.** v4.0 lands at 318.86 kB gzipped. Code-splitting
  the r3f + drei chunks behind a dynamic import is the obvious lever
  if v4.1+ wants to trim — not in scope for v4.0 per the prompt's
  "no fixed threshold required" note.
- **THREE.Clock deprecation warning.** r3f 9.6 still uses
  `THREE.Clock` which three 0.184 has deprecated in favor of
  `THREE.Timer`. Console.warn only, no functional impact. r3f will
  likely follow in a minor release; safe to ignore for v4.0.
- **Safari-native testing.** Per v4 design spec § 9, best-effort and
  not gated. The webkit project in Playwright approximates Safari on
  Ubuntu runners but does NOT prove Safari 16+ native compatibility;
  that requires a macOS runner or manual smoke and is deferred.

## Handoff

- **Branch / worktree:** `session/0030-v4-shell-parity` at
  `.claude/worktrees/session+0030-v4-shell-parity/`.
- **Commits (subject only):**
  `deps: react+r3f+drei+zustand+immer+playwright+rtl+jsdom; ignore visual-gate transients` →
  `config: register react plugin; jsx react-jsx; vitest env jsdom` →
  `feat(store): zustand v5 + immer; v4 § 4 shape lock` →
  `feat(pane): PatternPane wraps emitSvg output in React card` →
  `feat(viewport): r3f port of render.ts; same lights/camera/material` →
  `feat(shell): App composition + main.tsx; retire main.ts + render.ts` →
  `test(e2e): playwright shell-parity smoke; vite dedupe react+three` →
  `ci: add playwright e2e job; chromium+firefox+webkit on ubuntu` →
  `docs(0030): session log`.
- **Verification:** `pnpm test:run` 196/196; `pnpm type-check` clean;
  `pnpm build` clean (318.86 kB gzipped); Playwright 3/3 cross-browser;
  visual-gate parity confirmed; scope-creep gate empty on src/core/
  and test/{corpus,unit,integration,property}/.
- **Decisions made or deferred:**
  - [flowed-silently] Zustand v5 + immer.produce (not the middleware
    wrapper) per the prompt's "proceed with Zustand + immer per the
    spec" instruction. Library probe surfaced no obstacle.
  - [surfaced-and-proceeded] Vite `resolve.dedupe` for react + three
    — necessary on pnpm; runtime-only symptom.
  - [surfaced-and-proceeded] Inferred return types on React components
    (no `JSX.Element` annotation) — required under React 19 new JSX
    transform.
  - No ADR — v4.0 is a structural migration but ADR 0006 governs the
    PR flow it uses; library choices follow the v4 design spec.
- **Queue / roadmap deltas:** None added; none closed. v4.0 is the
  internal milestone the v4.1+ surfaces ship on top of.
- **Open questions for the strategist:**
  1. Should v4.1 plan-mode include a bundle-tuning task
     (code-splitting r3f/drei behind dynamic import)? Decision can
     wait until v4.1's first concrete user-facing surface is scoped.
  2. THREE.Clock deprecation: watch r3f release notes; pin three
     version or wait for r3f to migrate to THREE.Timer. Non-blocking.
