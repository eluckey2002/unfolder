# Session 0005 — Bootstrap the build

## Goal

Stand up the Vite + TypeScript + pnpm + Vitest toolchain for unfolder.
End state: `pnpm install`, `pnpm test`, `pnpm type-check`, and `pnpm
build` all succeed. The dev server (`pnpm dev`) should also work but is
verified manually by Evan after the session lands.

Per the Session 0004 prompt-prep discussion, Session 0005 takes
"minimalism Level 2": configs + a single passing test + a minimal entry
point that logs to the console (no visible UI). `src/core/` stays empty
until later sessions populate it with real code.

## Pre-work consistency scan

Before making changes, scan `docs/queue.md` for items that intersect
this session's scope. Surface anything you find. Expected: none of the
current queue items intersect Session 0005 directly; this session does
close one queue item (re-orientation prompt — already landed in Session
0004) and add one new item (a learning about prompt restructuring). The
specific edits are in Task 8 below.

## Tasks

1. **Verify starting state.** From the main checkout, confirm you're on
   `main`, the working tree is clean (untracked at `.claude/` and
   `docs/sessions/prompts/` are expected and should be left alone), and
   `main`'s HEAD is `3578387`.

2. **Create `package.json`** at the repo root with the content in
   **Appendix A** below, copied verbatim.

3. **Install dev dependencies** with pnpm. Run:

   ```
   pnpm add -D vite typescript vitest @types/node
   ```

   This will create `pnpm-lock.yaml` and `node_modules/`. The lockfile
   should be committed; `node_modules/` is already gitignored.

4. **Create `tsconfig.json`** at the repo root with the content in
   **Appendix B**, copied verbatim.

5. **Create `vite.config.ts`** at the repo root with the content in
   **Appendix C**, copied verbatim. `defineConfig` is imported from
   `vitest/config` (not `vite`) so the `test` field is properly typed —
   the Vitest 4.x idiom.

6. **Create the entry point and test fixture.**

   - Delete `src/app/.gitkeep` (no longer needed — `src/app/main.ts`
     populates the directory).
   - Delete `test/unit/.gitkeep` (no longer needed —
     `test/unit/sanity.test.ts` populates the directory).
   - Leave `src/core/.gitkeep` in place (the directory stays empty
     until a later session adds real code).
   - Leave `test/corpus/.gitkeep` in place (populated in Session 0006).
   - Create `index.html` at the repo root with the content in
     **Appendix D**.
   - Create `src/app/main.ts` with the content in **Appendix E**.
   - Create `test/unit/sanity.test.ts` with the content in
     **Appendix F**.

7. **Verify the toolchain.** Run these commands in order; all should
   succeed:

   ```
   pnpm type-check
   pnpm test:run
   pnpm build
   ```

   - `type-check` runs `tsc --noEmit` and should produce no errors.
   - `test:run` runs Vitest once (non-watch) and should report one
     passing test.
   - `build` should produce a `dist/` directory.

   If any command fails, stop and report the error rather than working
   around it. The strategist will diagnose.

   Do NOT run `pnpm dev` in this session — the dev server runs
   persistently and isn't well-suited to scripted validation. Evan will
   verify it manually after the session lands.

8. **Update `docs/queue.md`.**

   - REMOVE this line (the work landed in Session 0004):

     ```
     - [docs] Add a "standard re-orientation prompt" snippet to
       `project-state.md` for opening a new Cowork chat (tells the new
       strategist instance which docs to read to get up to speed). Surfaced
       0003.
     ```

   - APPEND this new line at the end of the open-items list:

     ```
     - [process] Restructuring prompts should include a consistency-scan
       step for cross-references (catches stale session numbers, file
       paths, etc.). Surfaced 0004.
     ```

9. **Create the session log** at `docs/sessions/0005-bootstrap-the-build.md`
   with the content in **Appendix G**, copied verbatim.

10. **Stage all changes and commit** with this message:

    ```
    chore: bootstrap Vite + TypeScript + pnpm + Vitest toolchain
    ```

    Files to stage (verify with `git status` before committing):
    - `package.json`, `pnpm-lock.yaml` (new)
    - `tsconfig.json`, `vite.config.ts`, `index.html` (new)
    - `src/app/main.ts`, `test/unit/sanity.test.ts` (new)
    - `src/app/.gitkeep`, `test/unit/.gitkeep` (deleted)
    - `docs/queue.md` (modified — one line removed, one line added)
    - `docs/sessions/0005-bootstrap-the-build.md` (new)

    Do NOT stage `node_modules/` (gitignored already), `dist/`
    (gitignored), or anything under `docs/sessions/prompts/`.

11. **Fast-forward `main` to the new commit.** From the main checkout
    at `/Users/eluckey/Developer/origami`:

    ```
    git merge --ff-only claude/<your-worktree-branch>
    ```

12. **Report back:** the final `main` HEAD hash, and confirmation that
    each of `pnpm type-check`, `pnpm test:run`, and `pnpm build`
    completed cleanly.

## Notes

- Do not pin specific versions in `package.json` beyond what pnpm
  writes when it resolves dependencies. The lockfile captures exact
  versions for reproducibility.
- Do not add path aliases (`@core`, `@app`) to `tsconfig.json` or
  `vite.config.ts` in this session. Plain relative imports are fine for
  v1; path aliases can be added later if import paths get awkward.
- Do not add ESLint, Prettier, Husky, or any other tooling beyond what
  Appendix A specifies. v1 deliberately starts minimal; we'll add
  tooling when there's a reason.
- Do not add path coverage (`@vitest/coverage-v8`). Coverage tooling is
  deferred per Session 0004's discussion.
- If `pnpm` reports any peer-dependency warnings during install, note
  them in your report but do not modify anything to resolve them unless
  they cause an actual error in the verification step.

---

## Appendix A — `package.json`

```json
{
  "name": "unfolder",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "type-check": "tsc --noEmit"
  }
}
```

(The `pnpm add` command in Task 3 will append a `devDependencies`
section to this file. That's expected.)

---

## Appendix B — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"]
  },
  "include": ["src", "test", "vite.config.ts"]
}
```

---

## Appendix C — `vite.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
```

(Vitest 4.x requires importing `defineConfig` from `vitest/config` for
the `test` field's types. Earlier Vitest versions accepted Vite's
`defineConfig` paired with a `/// <reference types="vitest" />`
triple-slash directive; that pattern broke in Vitest 3+.)

---

## Appendix D — `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>unfolder</title>
  </head>
  <body>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

---

## Appendix E — `src/app/main.ts`

```ts
console.log("unfolder alive");
```

---

## Appendix F — `test/unit/sanity.test.ts`

```ts
import { describe, expect, it } from "vitest";

describe("toolchain sanity", () => {
  it("vitest is wired up correctly", () => {
    expect(true).toBe(true);
  });
});
```

---

## Appendix G — Session log content

````markdown
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
via triple-slash reference.

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

## Queue updates

- Closed: `[docs] Add re-orientation prompt snippet` — landed in
  Session 0004.
- Added: `[process] Restructuring prompts should include a
  consistency-scan step for cross-references.`
````
