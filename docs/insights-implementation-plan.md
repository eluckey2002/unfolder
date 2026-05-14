# Insights Report — Implementation Plan

Derived from the Claude Code Insights report (`~/.claude/usage-data/report.html`,
covering 2026-05-01 to 2026-05-14) and the review of its findings.

**Scope of this plan:** Tier 1 + Tier 2 items (low-risk config/workflow changes)
plus the property-based test harness promoted from the report's "On the Horizon"
section. The two large autonomous-loop ideas (auto-merge pipeline, nightly corpus
rebuild) are deliberately out of scope — see the final section.

---

## Context

The Insights report analyzed two weeks of Claude Code sessions in origami and
surfaced repeated frictions: worktree confusion (editing main when work belongs in
a worktree, stranded uncommitted changes), implementation-without-plan as the one
session that missed its outcome, false-positive UI bug reports from CSS-injection
"responsive tests" instead of real screenshots, observer-mode protocol violations
(wrong capture tag, attempted tool calls when none were available), redundant Bash
inspection (673 Bash vs 143 Read), and a lossy human relay between Cowork
(strategist) and Claude Code (implementer) that goes through Evan. The report also
flagged that the unfolding pipeline's test coverage is example-based on three fixed
STL fixtures — fine for v1 but a coverage gap before v2 adds dihedral-weighted
trees and recut. This plan converts those frictions into config + working-agreement
changes and stands up a property-based test harness to close the coverage gap.

The intended outcome: the high-frequency frictions get pinned down by repo-versioned
mechanisms (hooks, skills, written agreements) rather than relying on memory or
re-discovery each session, and the pipeline gains property-shaped tests that will
keep working as v2 invariants get added.

---

## Happy-path assumptions

These are assumed true so the plan can stay concrete. Correct any that are wrong
before execution starts.

1. **This plan doc lives at `docs/insights-implementation-plan.md`** and is itself
   committed (a maintenance commit, not a numbered session).
2. **Each work item below is small enough to land as its own commit.** Several are
   small enough to bundle into one housekeeping session; the test harness (WI-9)
   warrants its own numbered session.
3. **`pnpm` is the package manager**, Vitest 4 is the test runner, and
   `vite.config.ts` continues to own test config (`include: ["test/**/*.test.ts"]`).
4. **There is no separate observer *agent*; Evan is the Cowork↔Claude Code
   go-between.** Cowork runs strategist Claude (plans, reviews, maintains docs);
   Claude Code implements and sometimes runs an observer mode that records
   `<observation>`/`<summary>` entries (claude-mem's capture format). The
   "~14 observer sessions" the report counted are Claude Code terminal sessions in
   that mode. No protocol for it is written down today — WI-4 creates one.
5. **Worktree directories are auto-named by Cowork** (`.claude/worktrees/<random>/`,
   branch `claude/<random>`). We can *surface* the active worktree but cannot
   rename it to a session number, so the convention is "make it visible," not
   "make it numbered."
6. **CLAUDE.md is the file Claude Code reads automatically; `docs/project-state.md`
   is where human-facing working agreements live.** Behavioral rules that must
   change Claude Code's actions go in CLAUDE.md; process conventions are documented
   in project-state.md. Some items touch both on purpose.
7. **No behavior is changed for v2 session 0012 (OBJ parser) by this plan** — these
   are workflow/tooling changes that sit alongside feature work.

---

## Decisions to confirm before starting

These gate specific work items. Each has a recommendation; none should be decided
silently.

### D1 — Version-control `.claude/` config, or keep it machine-local?

`.gitignore` currently ignores all of `.claude/` ("Claude Code local state —
worktrees, machine-local config"). That means a `.claude/settings.json` hook file
and a `.claude/skills/` skill would **not** be committed, would **not** propagate
into worktrees, and would **not** be shared with the strategist/collaborator.

- **Option A — keep `.claude/` fully ignored.** Hooks/skills are machine-local.
  Simple, but every worktree and every collaborator needs them re-created, which
  re-introduces the exact inconsistency the report flags.
- **Option B (recommended) — un-ignore specific paths.** Add `!/.claude/settings.json`
  and `!/.claude/skills/` (keep `.claude/worktrees/` ignored). Hooks and skills
  become versioned, propagate into worktrees, and the repo stays the source of
  truth — consistent with the project's stated working agreement.
- **Option C — put skills at user level (`~/.claude/skills/`)** like the existing
  `/corpus` skill, and keep `settings.json` machine-local. Mixed; loses repo
  versioning for project-specific workflow.

**Gates:** WI-1, WI-5, WI-7. **RESOLVED: Option B.** Add `!/.claude/settings.json`
and `!/.claude/skills/` to `.gitignore` (below the `.claude/` line); keep
`.claude/worktrees/` ignored.

### D2 — How to write down the observer protocol and tighten the Cowork↔Claude Code relay

**Corrected understanding:** there is no separate observer *agent*. Evan is the
go-between — Cowork runs strategist Claude (plans, reviews, maintains docs); Claude
Code implements and sometimes runs an observer mode recording
`<observation>`/`<summary>` entries; Evan carries context between the two. So D2 has
two parts: (1) where the protocol doc lives so it's actually loaded, and (2) which
relay-automation direction(s) to adopt.

Part 1 — protocol home: `docs/strategist-protocol.md` pointed to from the
re-orientation prompt Evan pastes into new Cowork chats (the "re-orientation prompt
convention" already noted in session 0004), or a clearly-headed CLAUDE.md section.
Recommendation: standalone doc + pointer; keeps the main CLAUDE.md lean.

Part 2 — relay-automation options (pick one or more; this is the open choice):
- **R1 — Repo-as-bus.** Minimize chat-relay, maximize file-relay. Claude Code already
  writes session logs; formalize a fixed handoff schema so the strategist ingests it
  deterministically without Evan paraphrasing. Lowest effort, aligns with the
  existing "repo is the source of truth" agreement.
- **R2 — Crisp, example-driven tag spec.** The "wrong tag" friction exists because
  `<observation>`/`<summary>` are free-text. A precise spec with examples removes the
  ambiguity. (Tool-based recording would be better still, but claude-mem's capture
  format appears to be transcript tags, not a write tool — verify before assuming a
  tool path exists.)
- **R3 — Paired `/handoff` skill.** A Claude Code `/handoff` skill emits exactly the
  artifact the strategist expects; a strategist session-start step ingests it.
  Removes Evan as a lossy paraphraser. Builds on R1.
- **R4 — Scheduled strategist housekeeping.** A recurring scheduled Cowork task that
  reviews what landed, updates `project-state.md`, and surfaces queue items —
  automating the strategist's housekeeping cadence.

**Gates:** WI-4. **RESOLVED: R1 + R2.** R3 (`/handoff` skill) and R4 (scheduled
housekeeping) are deferred — revisit R3 if the relay still feels heavy after R1.

### D3 — `/wrap-session` as a project skill or a user skill?

The existing `/corpus` skill is user-level (`~/.claude/skills/corpus/`). `/wrap-session`
is origami-specific.

**Gates:** WI-5. **RESOLVED: project-level `.claude/skills/wrap-session/`** (D1 =
Option B confirmed, so it gets versioned with the repo).

---

## Phase 0 research findings

Three read-only research agents ran before any edits. Results:

**F1 — claude-mem has no recording tool (WI-4 / R2).** claude-mem exposes only four
read/query tools (`query_corpus`, `smart_outline`, `smart_search`, `smart_unfold`).
There is no record/write/store tool; corpus building is handled by the `/corpus`
*skill*, not an MCP tool. So observation capture is transcript-tag based — **R2 is a
written tag spec, not a tool migration.** Caveat: the claude-mem server wasn't
connected in the research session, so this came from transcripts + CLAUDE.md rather
than a live enumeration — worth a 30-second live confirm on the real machine, but
treat the answer as settled.

**F2 — the SessionStart hook will propagate into worktrees (WI-1).** Claude Code
discovers `.claude/settings.json` at the git repo root; inside a worktree, the
worktree's own checked-out copy applies. Because D1 = Option B makes `settings.json`
a *tracked* file, it physically exists in every worktree checked out after Phase 1
lands — so the hook fires there. `SessionStart` fires reliably including on resume
(`source: "resume"`). No gotcha from `.claude/worktrees/` being nested inside
`.claude/`. Caveats: docs don't detail the exact cwd→repo-root walk from inside a
worktree (verify empirically once committed — already in WI-1's verification step),
and worktrees created from commits *before* Phase 1 won't have the file — only new
worktrees get it.

**F3 — exact core pipeline shapes captured (WI-9).** Full type/signature inventory
done. Two findings that change WI-9's design:
- **`buildAdjacency` is closed-manifold-only** — it throws on any edge not shared by
  exactly 2 faces (boundary or non-manifold). WI-9's generated meshes must therefore
  be *closed manifolds* (platonic/Archimedean solids, convex hulls of random point
  sets — convex hulls qualify) or they only exercise the throw path.
- **Existing coverage is example-based on 3 platonic solids;** only flatten
  congruence is genuinely property-shaped. Real gaps for WI-9 to fill: `Adjacency`
  canonical ordering, spanning-tree acyclicity, fold/cut partition correctness,
  `buildAdjacency` non-manifold rejection, `parseStl` throw paths. No degenerate or
  non-manifold STL fixtures exist yet.

---

## Work items

Each item lists its goal, rationale, files touched, atomic steps, verification, and
dependencies. Items are independent unless a dependency is noted.

### WI-1 — Surface the active worktree (SessionStart hook + CLAUDE.md note)

**Goal:** Claude (and Evan) always know which worktree/branch is live before any
edit. **Why:** highest-frequency friction in the report — editing the main repo's
file instead of the worktree copy, stranded uncommitted changes, re-edits.

**Files:** `.claude/settings.json` (new), `CLAUDE.md` (new section), `.gitignore`
(if D1 = Option B).

**Atomic steps:**
1. Resolve D1. If Option B: add `!/.claude/settings.json` to `.gitignore` below the
   `.claude/` line.
2. Create `.claude/settings.json` with a `SessionStart` hook running
   `pwd && git branch --show-current && git worktree list`.
3. Verify the hook fires: start a fresh session, confirm the path/branch/worktree
   list appears in context at session start.
4. Add a `## Worktree discipline` section to `CLAUDE.md` (place it as a new
   top-level section, e.g. section 5): always confirm cwd before an Edit/Write when
   in a worktree; edit the worktree copy, never the main repo; `git worktree list`
   resolves ambiguity.
5. (Optional, evaluate then decide) add a `PreToolUse` hook matching `Edit|Write`
   that prints `pwd` + branch. Note in the plan: this fires on *every* edit and is
   noisy — adopt only if the SessionStart hook alone proves insufficient.

**Verification:** start a session inside a worktree and a session in main; confirm
each correctly reports its location. Make one edit in a worktree and confirm no
stray change lands in main.

**Risk/deps:** D1 = Option B resolves this — per Phase 0 finding F2, a tracked
`.claude/settings.json` propagates into every worktree checked out after Phase 1
lands. Worktrees branched from earlier commits won't have it. Still verify
empirically once committed (step 3).

### WI-2 — Make plan-first the default for multi-file sessions

**Goal:** Sessions touching more than ~2 files start with a written, approved plan.
**Why:** the report's one "not achieved" outcome jumped straight to implementation;
the clean end-to-end wins all had a plan file first. Also aligns with Evan's stated
preference for atomic step breakdown.

**Files:** `docs/project-state.md` (Working agreements → "Session and commit
mechanics"), `CLAUDE.md` (brief operational rule).

**Atomic steps:**
1. Draft one working-agreement bullet: any session touching >2 files (or producing
   new functionality) enters plan mode and produces a written plan — files to
   create/modify, verification steps, commit/merge strategy — and waits for
   approval before implementing.
2. Add that bullet under "Session and commit mechanics" in `docs/project-state.md`.
3. Add a one-line operational pointer in `CLAUDE.md` so Claude Code actually
   enforces it (the working agreement documents the convention; CLAUDE.md makes it
   act).
4. Sanity-check against the existing autonomy-by-stakes agreement so the two
   don't contradict.

**Verification:** re-read both files in sequence; confirm no conflict with the
existing "strategist autonomy is calibrated by stakes" agreement.

**Risk/deps:** None. Pure documentation.

### WI-3 — Verify UI/CSS against real renders, not synthetic probes

**Goal:** Stop false-positive bug reports from CSS-injection "responsive tests."
**Why:** the report's fun-fact friction — Claude reported a CSS bug that didn't
exist because it injected CSS to simulate a viewport instead of screenshotting the
real render.

**Files:** `CLAUDE.md` (verification rule).

**Atomic steps:**
1. Add a bullet to CLAUDE.md (a "Verification" section, or under WI-1's new
   section): when verifying UI/CSS, screenshot the running app at the target
   viewport — do not inject CSS to simulate conditions.
2. Cross-check against any existing frontend/preview guidance to avoid duplication.

**Verification:** none beyond review — this is a one-line convention.

**Risk/deps:** None.

### WI-4 — Strategist/observer protocol + tighten the Cowork↔Claude Code relay

**Goal:** (a) Write down the rules observer-mode sessions keep violating, and
(b) reduce the manual relay Evan performs between Cowork (strategist) and Claude
Code (implementer). **Why:** the report shows repeated protocol violations (wrong
tag type — `<observation>` when `<summary>` was required, attempted tool calls when
none were available); and the relay itself is lossy human effort.

**Context (per corrected D2):** no separate observer agent — Evan is the go-between.
Cowork runs strategist Claude; Claude Code implements and sometimes records
`<observation>`/`<summary>` entries; Evan carries context between them.

**Files:** `docs/strategist-protocol.md` (new); a pointer in the Cowork
re-orientation prompt; the `docs/sessions/NNNN-*.md` session-log format (extended
with a fixed handoff status block).

**Atomic steps:**
1. **(R2)** Per Phase 0 finding F1, claude-mem has no recording tool — capture is
   transcript-tag based, so proceed with a written spec. (Optional: a 30-second live
   confirm on the real machine where the claude-mem server is connected.)
2. **(R2)** Write `docs/strategist-protocol.md`: a precise, example-driven spec with
   a worked example of `<observation>` and of `<summary>` and exactly when each is
   used; the rule that observer-mode sessions never attempt tool calls when none are
   available; what to do when a continuation session lacks Bash.
3. **(R1)** Define the handoff schema: extend the existing `docs/sessions/NNNN-*.md`
   session-log format with a short, fixed status block Claude Code fills at session
   end — branch/worktree, commits, verification results, decisions, queue deltas —
   structured enough that the strategist ingests it without paraphrasing.
4. **(R1)** Document in `docs/strategist-protocol.md` that the strategist reads that
   artifact directly from the repo at session start — the repo is the relay, not a
   chat paste.
5. Add a one-line "read docs/strategist-protocol.md first" pointer to the Cowork
   re-orientation prompt. Keep this *out* of the main CLAUDE.md.

**Verification:** run one observer-mode session and confirm correct tag usage and no
attempted tool calls at a checkpoint; confirm the strategist can ingest the handoff
status block from a session log without Evan paraphrasing.

**Risk/deps:** Confirmed by Phase 0 (F1) — no tool-based recording in claude-mem, so
R2 is a written spec, not a tool migration. **Deferred:** R3 (`/handoff` skill) and
R4 (scheduled housekeeping) are out of scope for this item — revisit R3 if the relay
still feels heavy once R1 is in place.

### WI-5 — `/wrap-session` skill

**Goal:** Formalize the verify → commit → rebase → fast-forward-to-main ritual into
one command. **Why:** the report shows it's a repeated multi-step flow; Evan already
builds skills (`/corpus`). Reduces redundant verification churn.

**Files:** `.claude/skills/wrap-session/SKILL.md` (new — location per D1/D3).

**Atomic steps:**
1. Resolve D1 and D3 to fix the skill's location.
2. Write `SKILL.md` with explicit ordered steps: confirm worktree is clean →
   `pnpm test:run` → `pnpm type-check` → commit with a conventional message →
   write/append the session log entry → rebase onto main → fast-forward main.
3. Make worktree-branch deletion an explicit **confirmation step**, never automatic.
4. Add a "do not re-run a verification command already run this session; reuse the
   result" instruction inside the skill.
5. Register/verify the skill is discoverable as `/wrap-session`.

**Verification:** invoke `/wrap-session` on a throwaway worktree with a trivial
change; confirm each step runs in order and branch deletion prompts for
confirmation.

**Risk/deps:** Gated by D1, D3. Destructive step (branch deletion) must be gated —
do not let the skill delete branches silently.

### WI-6 — Prefer Read/Grep/Glob over Bash for inspection

**Goal:** Cut redundant Bash inspection (the report: 673 Bash vs 143 Read, four
identical `ls -la` runs in one session). **Why:** Read/Grep/Glob are faster, cached
by the harness, and don't clutter transcripts.

**Files:** `CLAUDE.md` (guidance bullet).

**Atomic steps:**
1. Add a CLAUDE.md bullet: use Read/Grep/Glob for inspection; reserve Bash for
   commands with side effects (build, test, git); reuse a verification result
   already obtained this session instead of re-running.
2. Note explicitly that this complements — does not replace — the existing
   smart-explore guidance in CLAUDE.md section 2.

**Verification:** none beyond review.

**Risk/deps:** None. Note: a chunk of the 673 Bash calls are legitimate git/test
side-effect work, so don't expect the count to crater — the target is the
*redundant* subset.

### WI-7 — TypeScript check automation

**Goal:** Catch type errors automatically without the noise of running `tsc` after
every single edit. **Why:** the report suggested a `PostToolUse` `tsc` hook;
running it on every TS edit is slow and breaks during legitimate mid-refactor
states.

**Files:** `.claude/settings.json` (Stop hook) and/or `.claude/skills/wrap-session/SKILL.md`.

**Atomic steps:**
1. Resolve D1 (shares the settings file with WI-1).
2. Choose the trigger: a `Stop` hook running `pnpm type-check`, **or** rely on the
   `pnpm type-check` step already inside `/wrap-session` (WI-5). Recommendation: the
   wrap-session step is sufficient; add the Stop hook only if type errors are still
   slipping through.
3. If adopting the Stop hook, add it to `.claude/settings.json` alongside the
   SessionStart hook.
4. Do **not** use a `PostToolUse` `Edit|Write` matcher for this.

**Verification:** introduce a deliberate type error, confirm the chosen mechanism
catches it; confirm a mid-refactor edit doesn't trigger spurious failures.

**Risk/deps:** Gated by D1. Overlaps with WI-5 — decide WI-7 and WI-5 together.

### WI-8 — Lean on Task agents for parallel exploration

**Goal:** Use sub-agents for parallel read-only exploration instead of serial Bash.
**Why:** the report notes Task agents were used only ~18 times against 673 Bash
calls; codebase-exploration and reference-reading sessions are exactly the use case.

**Files:** `CLAUDE.md` (guidance bullet).

**Atomic steps:**
1. Add a CLAUDE.md bullet: for multi-target exploration (e.g. "map adjacency.ts" +
   "read how paperfoldmodels handles X"), dispatch parallel Task agents rather than
   serial Bash/Read.
2. Reference the existing subagent corpus-priming paste-block in CLAUDE.md section 1
   so dispatched agents still get corpus context.

**Verification:** none beyond review.

**Risk/deps:** None.

### WI-9 — Property-based test harness for the unfolding pipeline

**Goal:** Property-based tests (via `fast-check`) that assert pipeline invariants
across many generated inputs, not just the three fixed STL fixtures. **Why:** the
report's strongest "Horizon" idea — and it's good engineering independent of any
AI-autonomy angle. The pipeline (`parseStl → buildAdjacency → buildSpanningTree →
buildLayout → emitSvg`) has clear invariants worth pinning down before v2 adds
dihedral-weighted trees and recut.

**Files:** `package.json` (dev dep), `test/property/*.test.ts` (new),
possibly `test/property/arbitraries.ts` (new), `docs/decisions/0004-*.md` (new ADR,
if the invariant set is treated as a real commitment), `docs/sessions/00NN-*.md`
(session log).

**Atomic steps:**
1. This warrants its own numbered session — start with a plan file (per WI-2).
2. `pnpm add -D fast-check`.
3. Inventory the exact data shapes from `src/core/`: `Mesh3D`, `DualGraph`,
   `SpanningTree`, `Layout2D`, `FlatFace`. Confirm function signatures.
4. Decide the **invariant set** and write each as a property. Per Phase 0 finding
   F3, existing unit tests cover flatten congruence example-style; property tests
   should generalize that and fill the structural gaps. Realistic for v1:
   - **Edge-length preservation (congruence)** — every shared 3D edge keeps its
     length in the 2D layout within epsilon. Generalizes the existing
     `assertCongruent` test to generated meshes.
   - **Area conservation** — sum of 2D `FlatFace` areas ≈ sum of 3D triangle areas
     within epsilon (follows from congruence; cheap cross-check).
   - **Connectivity** — every face is placed in `Layout2D` and reachable in the
     `SpanningTree`.
   - **`Adjacency` canonical ordering** — every `Adjacency` has `faceA < faceB` and
     a sorted `edge` (gap: untested today).
   - **Spanning-tree well-formedness** — `parent` encodes an acyclic tree,
     `parent[root] === -1`, `folds.length + cuts.length === adjacencies.length`, and
     `folds.length === faceCount - 1` for connected meshes (gap).
   - **`buildAdjacency` rejects non-manifolds** — a boundary or non-manifold edge
     throws (gap; needs a deliberately malformed fixture).
   - **Well-formed SVG** — `emitSvg` output parses and has `3 × faceCount` lines.
   - **No-overlap** — write it, but mark it a **v2 target / expected-to-fail on
     non-trivial meshes**: overlap detection and recut are explicitly v2 work and
     not yet built. Do not let a failing no-overlap test block the harness landing.
5. Build `fast-check` arbitraries that generate *valid* meshes. Per Phase 0 finding
   F3, `buildAdjacency` is **closed-manifold-only** (throws on any edge not shared by
   exactly 2 faces), so generated meshes must be closed manifolds: parametric
   platonic/Archimedean solids, and triangulated convex hulls of random point sets
   (convex hulls are closed manifolds). Do **not** generate raw random triangles —
   they won't be manifolds and will only exercise the throw path. Add a small set of
   deliberately *malformed* fixtures (open mesh, non-manifold edge) to drive the
   rejection properties.
6. Keep the three existing `test/corpus/*.stl` fixtures as a baseline; the property
   tests run *in addition to* the existing `test/unit/*.test.ts`.
7. Confirm `vite.config.ts`'s `include` glob picks up `test/property/**` (it
   currently matches `test/**/*.test.ts`, so a `test/property/foo.test.ts` is
   covered — verify).
8. Run `pnpm test:run`; all properties green except the explicitly-marked
   no-overlap v2 target.
9. If the invariant set is a real commitment, record it as an ADR; write the
   session log.

**Verification:** `pnpm test:run` green (minus the marked v2 target); deliberately
break one invariant in a stage and confirm the relevant property fails with a
useful counterexample.

**Risk/deps:** Largest item. Generating valid random meshes is the hard part — if
arbitraries prove too costly, fall back to a fixed expanded fixture corpus and keep
property assertions over that. The parallel "explore greedy vs MST vs set-cover in
parallel agents" idea from the report is **not** in this item — the harness lands
first; algorithm exploration is a separate future session.

---

## Critical files

- `.gitignore` — un-ignore `!/.claude/settings.json` and `!/.claude/skills/` (D1).
- `.claude/settings.json` (new) — SessionStart hook (WI-1); possibly Stop hook (WI-7).
- `.claude/skills/wrap-session/SKILL.md` (new) — verify→commit→rebase ritual (WI-5).
- `CLAUDE.md` — worktree discipline, plan-first, UI verification, Read/Grep/Glob,
  Task-agent dispatch (WI-1, WI-2, WI-3, WI-6, WI-8).
- `docs/project-state.md` — plan-first working agreement (WI-2).
- `docs/strategist-protocol.md` (new) — observer tag spec + repo-as-bus relay (WI-4).
- `docs/sessions/NNNN-*.md` format — handoff status block schema (WI-4).
- `package.json` — `fast-check` dev dep (WI-9).
- `test/property/*.test.ts` (new), `test/property/arbitraries.ts` (new) — harness (WI-9).
- `docs/decisions/0004-*.md` (new ADR, conditional) — invariant set commitment (WI-9).

---

## Existing utilities to reuse

- The existing `assertCongruent` helper in `test/unit/` — generalize into a
  property in WI-9 rather than rewriting from scratch.
- The three `test/corpus/*.stl` fixtures stay as baseline alongside property tests.
- The `/corpus` skill at `~/.claude/skills/corpus/` is the structural reference for
  WI-5's `/wrap-session` skill format.
- The existing subagent corpus-priming paste-block in CLAUDE.md section 1 — WI-8
  references it so dispatched Task agents still get corpus context.

---

## Suggested sequencing

**Phase 0 — decisions (no code).** Resolve D1, D2, D3. D1 unblocks the most items.
*(All three resolved in this plan.)*

**Phase 1 — one housekeeping session, batched commits.** WI-2, WI-3, WI-6, WI-8 are
all CLAUDE.md / project-state.md edits with no dependencies — do them together so
CLAUDE.md is edited once, not four times. Then WI-1 and WI-7 (the
`.claude/settings.json` items) together, since they share the file. Then WI-5
(`/wrap-session`), which WI-7 may fold into.

**Phase 2 — one numbered session.** WI-4 (observer protocol) once D2 is resolved —
small but benefits from focus.

**Phase 3 — its own numbered session.** WI-9 (test harness) — the only item with
real code, dependencies, and an ADR. Plan-file-first per WI-2.

**Do not start Phase 3 before Phase 1** — WI-9 should itself follow the plan-first
agreement that Phase 1 establishes.

---

## Parallelization

Parallel sub-agents help here, but the binding constraint is **file contention, not
task independence** — agents editing the same file in parallel clobber each other.

**Does not parallelize — one agent, sequential edits.** WI-1 (CLAUDE.md note), WI-2,
WI-3, WI-6, WI-8 all edit `CLAUDE.md`; WI-1 and WI-7 share `.claude/settings.json`;
WI-2 also touches `project-state.md`. This whole cluster is small (a bullet or two
each) — give it to a single agent. Parallelizing trivial edits costs more
coordination than it saves.

**Genuinely parallelizable — disjoint files.** WI-4 (`docs/strategist-protocol.md` +
session-log format), WI-5 (`.claude/skills/wrap-session/`), and WI-9
(`test/property/*` + `package.json`) touch non-overlapping paths. Run them as
parallel agents, each with `isolation: "worktree"` (matches the existing
worktree-per-session workflow); the branches merge cleanly because the file sets
don't overlap.

**Best parallel-agent uses are research and verification, not splitting edits:**
- An up-front read-only research phase: one agent checks claude-mem's tool surface
  (WI-4 step 1), one inventories `src/core/` data shapes (WI-9 step 3), one confirms
  how `.claude/settings.json` hooks propagate into worktrees. No contention.
- A fresh-context verification agent after each merge to check done-criteria
  independently.
- Inside WI-9 later: the deferred greedy/MST/set-cover spanning-tree exploration is
  the textbook parallel-agent use — one agent per variant against the shared
  property suite.

**Ordering constraint this introduces:** Phase 1 includes the `.gitignore` change
(D1) that WI-5 depends on to be versioned. Phase 1 must land and merge to main
*before* the Phase 2 parallel agents branch from it.

**Realistic parallel execution:**
- Phase 0 — 3 read-only research agents (parallel). *(Already done.)*
- Phase 1 — 1 agent: the CLAUDE.md + docs + `.claude/settings.json` + `.gitignore`
  cluster. Merge to main.
- Phase 2 — 2 parallel worktree agents: WI-4 ∥ WI-5. Merge both.
- Phase 3 — 1 agent (or its own numbered session): WI-9.
- A verification agent after each merge.

---

## End-to-end verification

After each phase merges, run a fresh-context check:

1. **Phase 1 check.**
   - Start a session in a freshly-checked-out worktree; confirm the SessionStart
     hook prints `pwd`, branch, and `git worktree list`.
   - Start a session in main; confirm the same.
   - `git ls-files .claude/` shows `settings.json` (and any `skills/` files added in
     the same phase) as tracked.
   - `grep -n "Worktree discipline\|plan-first\|UI verification\|Read/Grep/Glob\|Task agents"` over `CLAUDE.md` shows each new bullet present once (no duplicates).
   - Read `docs/project-state.md` and confirm the plan-first agreement is under
     "Session and commit mechanics" and doesn't contradict the autonomy-by-stakes
     agreement.

2. **Phase 2 check.**
   - Read `docs/strategist-protocol.md`; confirm worked examples for both
     `<observation>` and `<summary>`, and a written rule about not attempting tool
     calls when none are available.
   - Run an observer-mode session against a small task; check the resulting log has
     the new fixed handoff status block at the end.
   - Invoke `/wrap-session` against a throwaway worktree with one trivial change;
     confirm each step runs in order, that any verification command isn't re-run
     within the session, and that branch deletion explicitly prompts for
     confirmation.

3. **Phase 3 check.**
   - `pnpm add -D fast-check` reflected in `package.json` and `pnpm-lock.yaml`.
   - `pnpm test:run` is green except the explicitly-marked v2 no-overlap target.
   - Deliberately break one stage (e.g. perturb a layout coordinate by ε > the
     tolerance) and confirm the corresponding property fails with a useful
     `fast-check` counterexample.
   - If an ADR was added: `ls docs/decisions/0004-*.md` exists and records the
     invariant set.

---

## Explicitly out of scope

Carried over from the report's "On the Horizon" section, deliberately **not**
planned here:

- **Autonomous session-to-merge pipeline.** Auto-merge to main with self-correcting
  loops needs guardrails that don't exist yet. Revisit only after the supervised
  single-session workflow (WI-1, WI-5) has a track record, and after measuring what
  fraction of sessions today complete without intervention.
- **Nightly self-rebuilding corpora.** The report suggested auto-rebuild and
  auto-commit of corpora; this directly contradicts the project's own CLAUDE.md
  section 3 ("Always propose, then wait for user confirmation. Never auto-build").
  The read-only half — drift detection and a `docs/corpus-health.md` coverage
  report — would be a safe future item; the auto-rebuild half should stay gated.

Both are worth returning to once the friction items above are implemented and the
single-session success rate has been measured.
