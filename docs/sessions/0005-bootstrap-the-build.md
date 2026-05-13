# Session 0005 — Bootstrap the build

## What was attempted

Stand up the v1 toolchain: Vite + TypeScript + pnpm + Vitest. End state
should be a clean `pnpm install`, `pnpm test`, `pnpm type-check`, and
`pnpm build` — all green. Per Session 0004's pre-work discussion, this
session takes "minimalism Level 2": configs, one passing test, a
console-only entry point. No visible UI; `src/core/` stays empty until
later sessions populate it.

## What shipped

`package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`,
`index.html`, `src/app/main.ts`, `test/unit/sanity.test.ts`. Stale
`.gitkeep` files in `src/app/` and `test/unit/` removed. Configuration
choices: TypeScript `strict: true` only (no additional strictness
flags); Vitest `node` environment; no coverage tooling; no path
aliases; single `vite.config.ts` covering both build and test config
via `defineConfig` import from `vitest/config`.

## What's next

Session 0006 — Mesh generation script. Generate STL files for the
platonic-solid test corpus programmatically. First session that
populates `test/corpus/`.

## Decisions made or deferred

- Test file location: `test/unit/*.test.ts` per the README's documented
  layout. Co-located tests (`src/core/foo.test.ts` next to `foo.ts`)
  remain an option if a future session wants to switch conventions.
- Coverage tooling deferred; revisit when there's enough code for the
  metric to be actionable.
- Path aliases (`@core`, `@app`) deferred; add if relative imports
  become awkward.
- Dev-server validation done manually by Evan post-session rather than
  scripted, due to the persistent nature of the dev server.
- Vitest 4.x triple-slash pattern `/// <reference types="vitest" />`
  was stale in the original prompt; corrected to `defineConfig` import
  from `vitest/config`.

## Queue updates

- Closed: `[docs] Add re-orientation prompt snippet` — landed in
  Session 0004.
- Added: `[process] Restructuring prompts should include a
  consistency-scan step for cross-references.`
