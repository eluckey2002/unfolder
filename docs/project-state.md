# Project state

This is the orientation document for a new Claude session picking up the `unfolder` project. Read this first, then `project-rationale.md` for the reasoning behind decisions, then `project-history.md` for how we got here. After that, read the actual files in `docs/`, `src/`, and `references/` as needed.

## Project overview

`unfolder` is a browser-based papercraft unfolding tool. It takes a 3D mesh (STL, OBJ) and produces a 2D layout that can be printed, cut, scored, folded, and glued back into the 3D form. The long-term goal is feature parity with Pepakura Designer, in the browser, cross-platform, free.

The full vision and phase plan (v1 through v6) lives in `README.md`. Read it.

## Current phase

**v1 — Walking Skeleton is complete.** The end-to-end pipeline loads a platonic solid and produces a printable SVG net rendered alongside the 3D viewport. The current phase is v2 — functional unfolder (dihedral-weighted spanning tree, overlap detection and automatic recut, glue tabs with edge labels, multi-page layout). v2's session-level plan is in `docs/roadmap.md`; session 0015 (overlap detection) is complete, and session 0016 (automatic recut) is next.

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
- **Session 0012 — OBJ parser.** Wavefront OBJ parser in `src/core/parse-obj.ts` producing the v1 `Mesh3D` — geometry-only, with shared-vertex indexing (1-based, negative indices), the four face-reference forms, and fan-triangulation of quad/n-gon faces. Vertex dedup mirrors the STL parser. First v2 implementation session. Log: `docs/sessions/0012-obj-parser.md`.
- **Session 0013 — Sourced model test corpus.** Seven v2 corpus models in `test/corpus/` (four CC0 Kenney Food Kit models, a low-poly deer, two procedural convex baselines), all verified closed two-manifold; `PROVENANCE.md` records source/license per model; `scripts/prepare-corpus.py` is the reproducible record of how the sourced and generated models were produced. `scripts/baseline-pipeline.ts` and `docs/baseline-v1-pipeline.md` capture the v1 baseline: 5 of 11 models produce overlap-free nets under v1's plain DFS. Log: `docs/sessions/0013-sourced-model-test-corpus.md`.
- **Session 0014 — Dihedral-weighted spanning tree.** Replaced v1's plain DFS with a Kruskal-based dihedral-weighted MST (ADR 0004). `src/core/dihedral.ts` computes per-adjacency fold weights from outward face-normal angles; `buildSpanningTree` now takes a `weights` parameter. The 0013 baseline was re-run (renamed `docs/baseline-pipeline.md`): 5 → 7 overlap-free models, with mixed effects on the concave shapes — improvements on cylinder, egg, ginger-bread; regressions on croissant, deer, meat-sausage. First v2 algorithm session. Log: `docs/sessions/0014-dihedral-weighted-spanning-tree.md`.
- **Session 0015 — Overlap detection.** Added `src/core/overlap.ts` — `detectOverlaps(layout)`, a pure predicate built on `polygon-clipping` that finds every face pair with positive 2D triangle-triangle intersection. `scripts/baseline-pipeline.ts` now uses it in place of the hand-rolled Sutherland–Hodgman check from session 0013. The 7-of-11 overlap-free summary is unchanged; the four concave models shift slightly upward (+3 to +16 pairs) as the new detector catches sliver overlaps `AREA_EPS=1e-10` was missing. `docs/references/unfolding-algorithm-survey.md` committed alongside. No ADR — `polygon-clipping` was already the committed stack decision. Log: `docs/sessions/0015-overlap-detection.md`.

## Sessions planned

v2's session-level plan is drafted — see `docs/roadmap.md` for the
full arc. Per the planning decision, the first three sessions are
specified in detail; sessions 0016–0019 are a deliberate sketch,
refined as the early sessions land.

- **0016 — Automatic recut.** The first consumer of
  `detectOverlaps`: for each overlapping pair, find the path
  between the two faces in the spanning tree and promote a fold
  edge on it to a cut, splitting the net into multiple
  non-overlapping pieces. Likely ADR 0005 on recut strategy. The
  next session.

Sketched beyond that: 0017 glue tabs with edge labels, 0018
multi-page layout, 0019 v2 integration and retrospective.

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

How Evan, the strategist Claude, and Claude Code work together.
These evolved across v1 — treat them as current state, not
eternal. Grouped into themes; the reasoning behind most of them is
in `docs/retrospectives/v1-complete.md`.

### Roles

- **Evan is the director.** He decides what we build and when,
  sets the bar for quality, and makes the call when alternatives
  exist.
- **Strategist Claude is the planner and reviewer.** Drafts
  session prompts, reviews Claude Code output, maintains
  documentation, surfaces decisions with reasoning.
- **Claude Code is the implementer.** Runs prompts the strategist
  drafts, produces code, makes commits, and reports back.

### Decisions and communication

- **Recommendations, not options.** Lead with the recommended
  choice and why; don't offload synthesis onto Evan. He overrides
  when needed.
- **Confidence gets marked.** When a recommendation is uncertain,
  say so.
- **Strategist autonomy is calibrated by stakes.** High-confidence
  prose decisions inside Evan-approved structures flow silently.
  Medium-confidence calls on permanent artifacts (ADR substance,
  commit messages, file names) get surfaced briefly, then
  proceeded with. Low-confidence calls and anything crossing a
  project-shape boundary (conventions, scope, working agreements)
  get surfaced and wait for Evan's input.
- **Evan is involved in most decisions for now.** He signals
  explicitly when he trusts a category of recommendations to flow
  silently.
- **Premature optimization is a watched failure mode.** Naive
  before optimized; push back on cleverness in v1-v2.

### Session and commit mechanics

- **Multi-file sessions plan first.** Any session touching more
  than ~2 files or producing new functionality enters plan mode
  and produces a written plan — files to create/modify,
  verification steps, commit/merge strategy — and waits for
  approval before implementing. Single-file fixes and pure
  documentation tweaks don't need this.
- **Each session ends with a commit and a session log entry.** No
  exceptions, even for rough sessions.
- **Session done = merged to `main`.** Pre-merge worktree commits
  are drafts; immutability applies once merged.
- **Numbered session vs. maintenance commit.** Work gets a
  numbered session if it matches an entry in a phase's session
  plan, or produces new functionality, code, or substantive
  structural changes. Otherwise it lands as a plain maintenance
  commit — no session log, no number, descriptive prompt filename
  without a numeric prefix.
- **Worktree by default for numbered sessions; direct-`main` OK
  for maintenance commits.** Worktrees exist for the pre-merge
  amendment freedom — bugs caught between commit and merge fold in
  without violating immutability. Maintenance commits don't carry
  that risk surface.
- **Session prompts are saved as files** at
  `docs/sessions/prompts/` before being pasted into Claude Code,
  and commit with the session log (or commit) they describe.
- **Prompt files in worktrees: copy, don't reconstruct.** When a
  numbered session runs in a worktree, Claude Code copies the
  authoritative prompt file from the main checkout into the
  worktree (that path is readable from a worktree) and commits
  that copy. Reconstructing the prompt from the pasted message is
  lossy. At fast-forward, expect a collision with the main
  checkout's untracked copy; resolve by verifying byte-identical
  (`diff -q`) and removing the main copy before the FF.
- **Fresh worktrees lack `node_modules`.** Numbered-session
  prompts include `pnpm install` as the first verification step.

### How the strategist works

- **Mechanical work goes to Claude Code, not Evan.** Inspections,
  file creation, commits, reading file contents — if it's
  mechanical, Claude Code does it.
- **Doc-fetch and probe before writing prompts.** Before a prompt
  that involves new tools, libraries, or restructuring: (a) fetch
  current documentation for any external library used — including
  method semantics, not just import paths; (b) probe the actual
  response shape with a sample call rather than assuming; (c) scan
  related files for cross-references that could go stale.
- **Prompts specify behavior, not code.** Algorithm, render, and
  test code are described as specifications; Claude Code
  implements using current library API knowledge. Specs describe
  intent — they never dictate specific library call signatures
  (that's implementing from stale memory). Verbatim appendix
  content is reserved for type contracts, configuration files,
  and document content where the wording IS the deliverable.
  Claude Code produces an implementation report at session-end:
  decisions made, deviations from spec, library APIs verified,
  concerns worth a strategist eye, stale content noticed.
- **The strategist does not predict cumulative test counts.**
  Stating "N tests should pass" invites off-by-one errors as the
  suite grows. Prompts say the new tests should pass and ask
  Claude Code to report the total.
- **The strategist actively manages deferrals via
  `docs/queue.md`.** No item silently dropped; none left in
  indefinite limbo.
- **The strategist maintains `docs/roadmap.md`.** Status flags
  flip when a session commits; phase descriptions change only
  when a phase's ship-state commitment itself changes.
- **The strategist updates the `unfolder-roadmap` Cowork artifact
  at session-end** — and after maintenance commits that
  materially change displayed state (queue, recent commits,
  HEAD).
- **Handoff docs stay current at phase boundaries.**
  `project-state.md` is kept current continuously;
  `project-history.md` and `project-rationale.md` are updated at
  each phase boundary rather than left to drift. Each completed
  phase produces a retrospective in `docs/retrospectives/` — the
  durable capture of working-method lessons that would otherwise
  live only in a Cowork chat.

### Repo and orientation

- **The repo is the source of truth.** Anything not committed
  effectively doesn't exist for future sessions. Chat is
  ephemeral.
- **When opening a new Cowork chat to resume the project**, paste
  this re-orientation message:
  > Continue the unfolder project — a browser-based papercraft
  > unfolding tool. Read, in order: `docs/project-state.md`,
  > `docs/strategist-protocol.md`, `docs/project-rationale.md`,
  > `docs/project-history.md`, the latest retrospective in
  > `docs/retrospectives/`, `docs/queue.md`, `docs/roadmap.md`,
  > and the two or three most recent session logs in
  > `docs/sessions/`. Then run `git log --oneline -20` to catch
  > anything that landed outside a chat. Then we'll plan the next
  > session.
- **Session logs end with a handoff status block.** Defined in
  `docs/strategist-protocol.md`; this is what the strategist reads
  instead of having Evan paraphrase the session in chat.

## Open questions / things in flight

- We have not yet committed to a final project name. `unfolder` is the working name. Worth revisiting before v6.
- No GitHub remote yet. Worth revisiting once we have a working v1.

## Where to look

- `README.md` — project vision and phase plan
- `docs/roadmap.md` — v1-v6 phase plan and session-level status at a glance
- `docs/project-state.md` — this file (current state, working agreements)
- `docs/project-rationale.md` — why the project decisions were made
- `docs/project-history.md` — narrative arc of how the project evolved
- `docs/retrospectives/` — phase-boundary retrospectives (`v1-complete.md` is the first)
- `docs/decisions/` — ADRs (0001 pipeline architecture, 0002 adjacency-as-stage, 0003 DFS spanning tree, 0004 dihedral-weighted MST)
- `docs/references/` — writeups of external implementations we've studied
- `docs/sessions/` — logs of completed Claude Code sessions
- `docs/sessions/prompts/` — the saved prompt that produced each session or maintenance commit
- `references/` — gitignored clones of external repos for reading

## Preferences specific to Evan

- Goes by **Evan**.
- Background: PM at Firebrand, maker hobbies, generative-art interests, an existing Ver_dep methodology for agentic repo work. The unfolder project is shaped by his maker practice; v4 onward may eventually integrate with his generative-art generators (e.g. String Theory).
- Prefers **strategic language over technical jargon** in high-level discussion; details when warranted.
- Prefers **paraphrasing over quotation**; cites sources when claims warrant it.
- Strong preference for **fact-based, candid, forward-thinking** collaboration.
- When revising existing content, returns **only the revised section**, not the full document.
- Calls out **when memory is being used or new memory is being saved**.
