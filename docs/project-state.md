# Project state

This is the orientation document for a new Claude session picking up the `unfolder` project. Read this first, then `project-rationale.md` for the reasoning behind decisions, then `project-history.md` for how we got here. After that, read the actual files in `docs/`, `src/`, and `references/` as needed.

## Project overview

`unfolder` is a browser-based papercraft unfolding tool. It takes a 3D mesh (STL, OBJ) and produces a 2D layout that can be printed, cut, scored, folded, and glued back into the 3D form. The long-term goal is feature parity with Pepakura Designer, in the browser, cross-platform, free.

The full vision and phase plan (v1 through v6) lives in `README.md`. Read it.

## Current phase

**v1 — Walking Skeleton is complete.** The end-to-end pipeline loads a platonic solid and produces a printable SVG net rendered alongside the 3D viewport. Next phase is v2 — functional unfolder (dihedral-weighted spanning tree, overlap detection and automatic recut, glue tabs with edge labels, multi-page layout). v2's session-level plan is the next strategist task.

Detailed v1-v6 phase definitions are in `README.md`.

## Sessions completed

- **Session 0001 — Project skeleton.** Directory structure, gitignore, three commits. Log: `docs/sessions/0001-project-skeleton.md`.
- **Session 0002 — Read `paperfoldmodels`.** Reference-implementation writeup at `docs/references/paperfoldmodels.md`. Log: `docs/sessions/0002-read-paperfoldmodels.md` (backfilled).
- **Session 0003 — First ADR.** ADR 0001 — v1 pipeline architecture (staged pure functions). Log: `docs/sessions/0003-first-adr.md`.
- **Session 0004 — Queue and working agreements.** `docs/queue.md` established; first working-agreement consolidation. Log: `docs/sessions/0004-queue-and-working-agreements.md`.
- **Session 0005 — Bootstrap the build.** Vite + TypeScript + pnpm + Vitest toolchain. Log: `docs/sessions/0005-bootstrap-the-build.md`.
- **Session 0006 — Generate the test corpus.** Three.js-generated ASCII STL files for tetrahedron, cube, octahedron. Log: `docs/sessions/0006-generate-test-corpus.md`.
- **Session 0007 — Mesh loading.** ASCII STL parser in `src/core/` with vertex dedup; three.js viewport in `src/app/` with OrbitControls. First `src/core/` and `src/app/` code. Log: `docs/sessions/0007-mesh-loading.md`.
- **Session 0008 — Face adjacency graph.** `DualGraph` output stage in `src/core/adjacency.ts`; ADR 0002 commits the "adjacency as separate stage" decision deferred from ADR 0001. Log: `docs/sessions/0008-face-adjacency-graph.md`.
- **Session 0009 — Spanning tree.** DFS spanning tree over the dual graph in `src/core/spanning-tree.ts`; ADR 0003 commits "plain DFS for v1, weighted MST deferred to v2." Log: `docs/sessions/0009-spanning-tree.md`.
- **Session 0010 — Flatten.** Rigid unfolding in `src/core/flatten.ts` — `getThirdPoint` primitive and `buildLayout` walking the spanning tree, with an explicit geometric side test for apex placement. Log: `docs/sessions/0010-flatten.md`.
- **Session 0011 — SVG export.** `emitSvg` in `src/core/emit-svg.ts`; full pipeline wired into the browser app with a split 3D/net layout. v1 walking skeleton complete. Log: `docs/sessions/0011-svg-export.md`.

## Sessions planned

v1 is complete. The next strategist task is drafting v2's session-level plan; until then there are no specific sessions queued.

## Key decisions made so far

Decisions that aren't yet ADRs but are real commitments. The reasoning is in `project-rationale.md`.

- **TypeScript, strict mode** as the implementation language
- **Browser-only** — no server, static deployment
- **Vite** for dev server and build tooling
- **pnpm** as the package manager
- **Vitest** for unit tests
- **three.js** for 3D rendering and mesh loading
- **polygon-clipping** for 2D overlap detection (added in v2)
- **pdf-lib** for PDF export (added in v3)
- **React + react-three-fiber** for the UI (added in v4)
- **Local git only** for now; no GitHub remote yet
- **Conventional Commits** style for commit messages
- **MIT license** (planned, not yet committed to the repo)
- **`src/core/` vs `src/app/` separation** is structural — `core/` is pure logic, `app/` is UI. Matters most in v4.
- **Naive before optimized** — pick the simplest correct algorithm first, watch it fail, then optimize.
- **Visual debugging from day one** — every module that touches geometry has a way to render its current state.
- **Decisions get ADRs, sessions get logs** — both in `docs/`, both immutable once committed.
- **Read references before bootstrapping** — `paperfoldmodels` first (done), others as relevant later.

## Working agreements

How Evan and the strategist Claude work together. These have evolved during the project; treat them as current state, not eternal.

- **Evan is the director.** He decides what we build and when, sets the bar for quality, and makes the call when alternatives exist.
- **Strategist Claude is the planner and reviewer.** Drafts session prompts, reviews Claude Code output, maintains documentation, surfaces decisions with reasoning.
- **Claude Code is the implementer.** Runs prompts the strategist drafts, produces code, makes commits.
- **Decisions are surfaced with recommendations and reasoning, not options.** Lead with the recommended choice and why; don't ask Evan to do synthesis work. He'll override when needed.
- **Confidence gets marked.** When a recommendation is uncertain, say so.
- **Mechanical work goes to Claude Code, not Evan.** Inspections, file creation, commits, even reading file contents — if it's mechanical, Claude Code does it. Evan relays, reviews, decides.
- **Each session ends with a commit and a session log entry.** No exceptions, even for rough sessions.
- **Session prompts are saved as files**, ideally at `docs/sessions/prompts/NNNN-short-title.md`, before being pasted into Claude Code. The prompt becomes a tracked artifact, not chat ephemera.
- **The repo is the source of truth.** Anything not committed effectively doesn't exist for future sessions. Chat is ephemeral.
- **Evan is currently involved in most decisions.** He will signal explicitly when he trusts a category of recommendations to flow through silently. Until then, surface choices.
- **Premature optimization is a watched-for failure mode.** The naive-before-optimized principle is enforced; push back on cleverness in v1-v2.
- **Strategist autonomy is calibrated by stakes.** High-confidence prose
  decisions inside Evan-approved structures flow silently. Medium-
  confidence calls on permanent artifacts (ADR substance, commit
  messages, file names) get surfaced briefly then proceeded with. Low-
  confidence calls and anything crossing a project-shape boundary
  (conventions, scope, working agreements) get surfaced and wait for
  Evan's input.
- **Session done = merged to `main`.** Each session ends with the work
  merged to `main`, not just committed somewhere. Pre-merge worktree
  commits are still drafts; immutability applies once merged.
- **The strategist actively manages deferrals via `docs/queue.md`.** No
  item is silently dropped; no item lingers indefinitely. See the
  process in `docs/queue.md`.
- **When opening a new Cowork chat to resume the project**, paste this
  re-orientation message: "Continue the unfolder project. Read
  `docs/project-state.md`, `docs/project-rationale.md`, and
  `docs/project-history.md` in that order, then `docs/queue.md` and the
  two most recent session logs in `docs/sessions/`. Then run
  `git log --oneline -20` to catch any work that landed outside this
  chat. Then we'll plan Session NNNN."
- **The strategist maintains `docs/roadmap.md`.** Status flags
  flip from planned to completed when a session commits; phase
  descriptions only change when a phase's ship-state commitment
  itself changes (an ADR-worthy event).
- **The strategist updates the `unfolder-roadmap` Cowork artifact
  at each session-end.** Same trigger as the roadmap.md status
  flip — both happen together. The artifact carries a baked
  snapshot of session statuses, queue, and recent commits.
- **Before writing a prompt that involves new tools, libraries, or
  restructuring**, the strategist does three things: (a) fetches current
  documentation for any external library used, (b) probes the actual
  response shape with a sample call rather than assuming, and (c) scans
  related files for cross-references that could go stale after the
  change. All three, not any one in isolation.
- **Worktree by default for numbered sessions; direct-`main` OK for
  maintenance commits.** The pre-merge amendment freedom that worktrees
  enable is the actual reason for the rule — bugs caught between commit
  and merge can be folded in without violating immutability. Maintenance
  commits don't carry that risk surface and can land directly.
- **Work gets a numbered session if it matches an entry in the v1 (or
  later) session plan, or produces new functionality, code, or
  substantive structural changes.** Otherwise it lands as a plain
  maintenance commit — no session log, no number, descriptive prompt
  filename without numeric prefix, clear conventional-commit message.
- **Prompt files commit with the session log (or commit) they describe**,
  in the same commit. Amendment/merge sub-prompts get swept in by the
  next session's commit if they weren't part of the original.
- **Prompts specify behavior, not code, for implementation work.**
  Algorithm code, render code, and test bodies are described as
  specifications; Claude Code writes the implementation using current
  library API knowledge. Verbatim content in appendices is reserved for
  type contracts, configuration files, and document content where the
  wording IS the deliverable. Claude Code produces an implementation
  report at session-end naming decisions made, deviations from spec,
  library APIs verified, and concerns worth a strategist eye.
- **Fresh worktrees may lack `node_modules`.** Numbered-session
  prompts include `pnpm install` as the first verification step
  before the type-check/test/build trio, since worktrees created
  fresh don't inherit the main checkout's installed dependencies.
- **Prompt files create a fast-forward collision pattern on
  worktree merge.** When fast-forwarding a worktree session whose
  commit includes the prompt file (per the prompt-cadence rule),
  expect a collision with the main checkout's untracked copy of
  the same prompt. Resolution: verify byte-identical via `diff -q`,
  remove the main copy, then FF.

## Open questions / things in flight

- We have not yet committed to a final project name. `unfolder` is the working name. Worth revisiting before v6.
- No GitHub remote yet. Worth revisiting once we have a working v1.

## Where to look

- `README.md` — project vision and phase plan
- `docs/roadmap.md` — v1–v6 phase plan and v1 session-level status at a glance
- `docs/project-state.md` — this file (current state, working agreements)
- `docs/project-rationale.md` — why we made the decisions we made
- `docs/project-history.md` — narrative arc of how the project evolved
- `docs/decisions/` — ADRs (ADR 0001 captures the v1 pipeline architecture)
- `docs/references/` — writeups of external implementations we've studied
- `docs/sessions/` — logs of completed Claude Code sessions
- `docs/sessions/prompts/` — saved prompts (convention starts when we move to Cowork)
- `references/` — gitignored clones of external repos for reading

## Preferences specific to Evan

- Goes by **Evan**.
- Background: PM at Firebrand, maker hobbies, generative-art interests, an existing Ver_dep methodology for agentic repo work. The unfolder project is shaped by his maker practice; v4 onward may eventually integrate with his generative-art generators (e.g. String Theory).
- Prefers **strategic language over technical jargon** in high-level discussion; details when warranted.
- Prefers **paraphrasing over quotation**; cites sources when claims warrant it.
- Strong preference for **fact-based, candid, forward-thinking** collaboration.
- When revising existing content, returns **only the revised section**, not the full document.
- Calls out **when memory is being used or new memory is being saved**.
