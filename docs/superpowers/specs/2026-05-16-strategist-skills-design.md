# Strategist skills — design spec

**Date:** 2026-05-16
**Status:** Implemented in session 0024 worktree (`session/0024-strategist-skills`, commits `82d2a31..f79fda1`). This spec records the design intent and the corrections discovered during implementation. The `SKILL.md` files at `.claude/skills/<name>/` are canonical for execution; this spec is the design record.
**Context:** Follow-on from the workflow critique conversation that produced concrete redundancy evidence (boilerplate in every prompt, open-question drag, doc duplication across project-state / rationale / history / retrospectives / protocol).

## Goal

Move the high-leverage strategist functions into Claude Code skills so that ceremony lives in code rather than in pasted prose. Replace the per-session strategist-chat ritual with five new skills plus an update to the existing `/wrap-session`. Preserve the genuinely valuable strategist functions (judgment, fresh eyes, forcing artifact creation); eliminate the bookkeeping that the v2 retrospective already flagged as low-leverage.

## Non-goals

- Replacing the Cowork strategist chat entirely. The chat may still be useful for genuinely strategic moments (audit triage, phase retrospectives, "we hit a wall"). The skills shift the *default* away from the chat.
- Automating decisions. Skills accelerate ritual; humans still decide forks.
- Building portable skills. These are unfolder-specific — they reference project docs, conventions, and ADR 0006's PR flow. Not reusable across projects without rework.
- Refactoring prompts already written. Existing prompts stay as-is; the new skills shape *future* prompts.
- The doc surgery (kill "Sessions completed" list, merge roadmap/state, prune duplicate working agreements). Separate body of work, queued for after this lands.

## Architecture

Independent skills, optional composition. Each skill has one clear purpose and can be invoked alone. `/strategist` is the only one that may *offer* to chain (draft prompt → offer to red-team it) but never requires it. No top-level orchestrator. Pattern matches the existing `/wrap-session`.

Skills are project-local at `.claude/skills/<name>/SKILL.md`, matching existing convention. Frontmatter carries `name` and `description`; body uses imperative numbered steps and ends with anti-patterns.

**Claude Code execution constraints surfaced during implementation:**
- Each Bash tool call is a fresh shell — `cd` and shell variables do NOT persist between calls. Skills must substitute literal paths into each command rather than relying on shell state.
- Worktree directories live at `.claude/worktrees/<type>+<descriptor>/` (the `/` in the branch name becomes `+` in the directory name).
- Branch protection on `main` requires PRs even for maintenance commits; the owner can bypass but the protocol doc has been noted as stale on that point.

These constraints are reflected in the implemented `SKILL.md` files. The first draft of this spec did not account for them, and the code-quality review caught each instance per skill.

## The skills

### 1. `/begin-session`

**Purpose:** Replace the Tasks 1-2 boilerplate (worktree creation, prompt copy, `pnpm install`, queue scan) that appears verbatim in 11 numbered-session prompts.

**Invocation:** `/begin-session <branch-name>`

Branch name must match `^(session|maint|spike)/[a-z0-9-]+$` per ADR 0006. Examples:
- `/begin-session session/0024-recut-improvements`
- `/begin-session spike/0023-takahashi-mst`
- `/begin-session maint/clean-references-readme`

**Steps (10 total — see `.claude/skills/begin-session/SKILL.md` for the executable form):**

1. **Validate branch name** against the regex. Stop if invalid. Derive the worktree directory: `.claude/worktrees/<branch-with-slash-replaced-by-plus>/`.
2. **Confirm cwd is the main checkout** — compare `pwd` against `git worktree list | head -1` (which is always the main checkout). Stop if in a worktree.
3. **Confirm main is clean AND in sync with origin** — `git fetch origin main`, `git status --short` (must be empty), and compare `git rev-parse HEAD` against `git rev-parse origin/main` (must match — no divergence).
4. **Prune stale worktrees** — `git worktree prune`.
5. **Create the worktree** at the derived path — `git worktree add .claude/worktrees/<type>+<descriptor> -b <branch> main`.
6. **Locate the authoritative prompt file:**
   - `session/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
   - `spike/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
   - `maint/<descriptor>` → `docs/sessions/prompts/<descriptor>.md`

   Stop if missing; do not reconstruct (v1 lesson). Maint without a prompt file is legal per protocol but out of scope for this skill.
7. **Copy prompt file** from main checkout to the worktree's same relative path. Explicit `cp` with both paths; do not assume `cd` persistence.
8. **Install dependencies** in the worktree — `pnpm install --dir .claude/worktrees/<type>+<descriptor>` (NOT `cd` then `pnpm install` — `cd` doesn't persist between Bash calls in Claude Code).
9. **Scan queue** — read `docs/queue.md`, infer scope from the prompt's Goal section, surface intersecting items.
10. **Print starting state report** — worktree path, branch, main HEAD, prompt file, queue intersections.

**Failure modes:**
- Main dirty or diverged from origin → stop, surface
- Branch already exists locally or on origin → stop, surface
- Prompt file missing for session/spike → stop, surface
- `pnpm install` fails → stop, surface
- Invoked from inside an existing worktree → stop, surface

**Anti-patterns:**
- Auto-generating branch names. ADR 0006 mandates explicit naming.
- Skipping `pnpm install` because "it'll probably work." Fresh worktrees lack `node_modules`.
- Silently reconstructing a missing prompt file. The v1 lossy-reconstruction lesson stands.
- Running on a dirty main, or on a local main that has diverged from origin.
- Invoking from inside an existing worktree (sign of stale state).
- Using `cd` between bash blocks expecting it to persist.

### 2. `/red-team-prompt`

**Purpose:** Stress-test a drafted prompt before it reaches Evan. Closes the v2-retrospective pilot that was named but never run.

**Invocation:** `/red-team-prompt <prompt-path> [--write]`

`--write` saves the report to `<prompt-path-without-ext>-redteam.md` alongside the prompt.

**Steps (5 total):**

1. **Validate input** — path exists and is a `.md` file.
2. **Read the prompt** — capture full content and line count. Substitute the content into the dispatch template verbatim (not summarized, no blockquote prefix).
3. **Dispatch the subagent** via the Agent tool with `subagent_type: Plan`. Do NOT prime with project context — fresh-eyes property is load-bearing.
4. **Print findings** — verbatim, no filtering.
5. **Optionally write** to `<prompt-path-without-.md>-redteam.md` if `--write` flag passed.

**Embedded checklist (11 items, expanded from the original spec's 7 to match `strategist-protocol.md`'s preflight checklist):**

1. Ambiguity — instructions with two reasonable interpretations
2. Stale API references — paraphrased function signatures, version-specific syntax
3. Predicted test counts — should ask the implementer to report, never predict
4. Dictated library call signatures — should describe behavior, not write the call
5. Cross-file inconsistencies — referenced files/SHAs that don't match
6. Missing verification steps — code modifications without verification commands
7. Verbatim-vs-spec mismatch — wrong section format for content type
8. **Files and merge strategy declared** — prompt lists files to create/modify and the commit/merge path
9. **New tooling probed, not assumed** — any new library requires doc-fetch-and-probe
10. **Self-contained** — reads completely to a fresh Claude Code session
11. **Work type and branch name declared** — prompt states session/maint/spike and branch name

Skip "Frozen" from the protocol — that's a process-state concern, not content-review.

**Output format:** Blocking / Suggestions / Nits with prompt-line citations.

**Failure modes:**
- Path missing → stop
- Subagent finds no issues → valid result, print "clean"

**Anti-patterns:**
- Priming the subagent with project context. Defeats fresh-eyes property.
- Auto-fixing issues. Skill reports; strategist decides.
- Filtering findings. User sees everything.
- Skipping the skill because "the prompt looks fine to me" — the skill exists to catch what self-review misses.

### 3. `/strategist`

**Purpose:** Switch Claude Code into strategist persona. Loads orientation docs and engages in planning mode. Replaces the 8-doc Cowork re-orientation ritual.

**Invocation:** `/strategist [task]`

With no task: enters planning conversation after orientation. With task: drafts the artifact requested (typically `draft session NNNN prompt for X`).

**Steps (6 total):**

1. **Load orientation in parallel** — 8 files: `CLAUDE.md`, `docs/project-state.md`, `docs/strategist-protocol.md`, `docs/queue.md`, `docs/roadmap.md`, latest retrospective in `docs/retrospectives/`, last 2-3 session logs in `docs/sessions/`, `docs/open-questions.md` (may not exist).
   - **CLAUDE.md was added per code review** — without it the strategist drafts prompts that violate working agreements silently.
2. **Check for outside-chat drift** — `git log --oneline -20`, `git status --short`. ADR 0006 squash-merges rewrite SHAs, so compare by commit subject or date, not raw SHA.
3. **Print orientation summary** — one paragraph: phase, last session, queue items, ledger state (handles absent ledger with "run /open-questions scan" suggestion), drift status, latest retrospective.
4. **Branch on input** — with task: execute. No task: enter planning conversation applying recommendation-first / mark-uncertainty / AskUserQuestion-only-for-genuine-forks.
5. **Drafting a session prompt:** use the lean template (below). Save to `docs/sessions/prompts/<NNNN>-<descriptor>.md` (or `<descriptor>.md` for maint). Offer `/red-team-prompt` conditionally (recommended for session/spike, optional for maint).
6. **Apply working agreements** when making calls: naive-before-optimized (scoped to current stage per roadmap), ADR-for-real-decisions, no-predicted-test-counts, specs-not-call-signatures, doc-fetch-and-probe.

**Lean prompt template** (replaces the 400-600 line worktree-boilerplate format):
````markdown
# Session NNNN — <Title>

## Goal

<1-3 sentences. What ships.>

## Context

<Only what is NOT in project-state.md or the prior session log. Link, do not recap.>

## Tasks

<Numbered list. No worktree boilerplate. No "produce implementation report" step.>

## Specs

<Behavior specs, not code. Per the existing pattern.>

## Appendix (verbatim content only)

<ADR drafts, document content where wording IS the deliverable.>
````

**Template extensions** (when the lean form is insufficient):
- **ADR-bearing sessions** — Appendix includes structured ADR draft (Context / Decision / Status / Consequences).
- **Spike sessions** — Goal adds "Exit criteria" subsection and "Time-box" line.
- **Multi-stage sessions** — Tasks spanning >1 ADR or >5 files get an Architecture/Design section above Tasks.

**Failure modes:**
- Orientation doc missing → flag and continue
- Uncommitted changes on main → flag and ask

**Anti-patterns:**
- Restating context from `project-state.md` verbatim in drafted prompts. Link instead.
- Offering forks where a recommendation was possible (v2 lesson).
- Predicting test counts (v1 lesson).
- Dictating library call signatures (v1 lesson).
- Skipping orientation because "it's a quick question." The load is the cheap part.
- Including worktree creation, `pnpm install`, or handoff-block template in drafted prompts. `/begin-session` and `/wrap-session` own that ceremony.

### 4. `/retrospect`

**Purpose:** Run the 4-pass retrospective ritual from v2-retrospective.md as a standing skill.

**Invocation:** `/retrospect <phase>` (e.g., `/retrospect v3`)

**Steps (7 total):**

1. **Validate phase and prior state** — check phase completion against `docs/roadmap.md` (stop if in-flight). Check three prior-run files:
   - `<phase>-complete-draft.md` (Pass 1 done) → offer resume or restart
   - `<phase>-complete.md` (Pass 4 done) → warn before overwrite
   - `<phase>-retrospective.md` (Pass 4 done) → warn before overwrite
2. **Gather artifacts in parallel:** session logs in phase range, ADRs from phase, queue history (`git log -p docs/queue.md`), audit findings (`docs/audits/`), `git log --oneline` for phase range, **prior phase retrospectives** (for trend comparison — added per review).
3. **Pass 1 — Ground.** Factual timeline + first-pass observations. Save to `<phase>-complete-draft.md`. Wait for user response.
4. **Pass 2 — Reframe.** Walk observations one-by-one. For each: present decision with viewpoints, **wait for accept/redirect/skip** before next (explicit pause added per review).
5. **Pass 3 — Self-lens.** Honest assessment of the **Claude Code agent acting as strategist** (and Cowork strategist if applicable). Where it over-weighted bookkeeping, where it offloaded synthesis.
6. **Pass 4 — Converge.** Write `<phase>-complete.md` (use `v2-complete.md` structure) and `<phase>-retrospective.md` (use `v2-retrospective.md` structure). Delete draft.
7. **Print follow-up suggestions** — handoff doc updates, queue additions, working agreement changes. Do NOT apply automatically.

**Failure modes:**
- Phase has no completed sessions / not done per roadmap → stop
- User wants to skip a pass → warn that 4-pass structure is load-bearing, but proceed if confirmed

**Anti-patterns:**
- Producing a strategist-draft retrospective unilaterally (v2 lesson).
- Compressing the 4 passes into one.
- Auto-applying follow-ups.
- Starting before the phase is done. Step 1 enforces this — do not bypass.

### 5. `/open-questions`

**Purpose:** Manage `docs/open-questions.md` ledger. Force explicit disposition on every open question — no silent carry, no 8-session drags.

**Invocation:** `/open-questions [subcommand] [args]`

**Subcommands:**
- `scan` (default) — read last session log's "Open questions for the strategist" block, walk each item
- `list` — show current ledger
- `add <text>` — add a new entry
- `close <id> <resolution>` — close with note
- `carry <id> <reason> <target-session>` — carry forward with reason + target
- `queue <id> <reason>` — promote to `docs/queue.md`
- `drop <id> <reason>` — drop with reason

**Ledger format** (`docs/open-questions.md` — seeded fresh with this work):

````markdown
# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

- [Q-0024-1] Raised 0024 — <question>. Carrying to 0025 (X work will inform).
- [Q-0024-2] Raised 0024 — <question>. Queued to docs/queue.md as [decision].

## Resolved

- [Q-0024-3] Raised 0024 — <question>. Resolved 2026-05-17: <resolution>.
````

**ID scheme:** `[Q-<session>-<n>]` where `<session>` is the session number from the log filename and `<n>` is one greater than the highest existing `<n>` for that session prefix across both `## Open` and `## Resolved` (scan the ledger to determine — added per review to prevent duplicate IDs).

**Steps for `scan`:**
1. Find most recent session log (sorted by filename).
2. Extract "Open questions for the strategist" block. If missing: "No open questions in `<filename>`. Ledger unchanged."
3. **Each item gets an ID** using the scheme above (added per review — without IDs, subsequent close/carry/queue/drop operations break).
4. For each item: prompt user with close / carry / queue / drop / skip-for-now.
5. Apply disposition by editing `docs/open-questions.md`. For `queue`: **two-file update — queue.md first, then ledger; surface partial state on failure** (added per review).
6. Print summary: `Ledger updated. Open: <N>. Resolved this run: <M>.`

**Migration from history:** Historical open questions (0012-0022) NOT retroactively migrated. They were either implicitly resolved, addressed in retrospectives, or no longer relevant. Future entries start with 0024.

**Failure modes:**
- No previous session log → start fresh ledger
- Last log has no open-questions section → no-op
- `queue` two-file write fails mid-way → surface partial state

**Anti-patterns:**
- Silently carrying any item. Disposition must be explicit.
- Modifying a session log to change its open-questions block. The log is immutable; the ledger is the working surface.
- Auto-resolving items from context. User decides each disposition.

### 6. `/wrap-session` (updated existing)

**Purpose:** Verify → commit → push → PR → CI → squash-merge ritual for ending a session, or commit-and-push for direct-to-main maint.

The original `/wrap-session` was pre-v3-flow stale. Updated per ADR 0006:

**Step 1 — Two valid paths:**
- **Worktree path** — cwd is a worktree, branch matches `^(session|maint|spike)/[a-z0-9-]+$`. Default for session/spike; also valid for maint/ worktrees. Proceed all steps.
- **Direct-to-main path (maint only)** — cwd is main, branch is `main`. Legal per protocol (though branch protection may require PR even for maint — owner can bypass). Skip steps 6, 7, 8.

**Step 4 — WI-4 hedge removed.** strategist-protocol.md is canonical.

**Steps 6-7 — PR flow** (replaces rebase + fast-forward):
- Step 6: For direct-to-main maint, push origin main and skip to Step 9. For all worktree branches (incl. maint/): `git push -u origin <branch>`.
- Step 7: Read `.github/pull_request_template.md` at runtime, fill in sections from session info, pass via `--body` HEREDOC. Then `gh pr checks --watch` (if any check fails, do NOT merge — surface and pause). Then `gh pr merge --squash --delete-branch`.

**Step 8 — Worktree cleanup.** `gh pr merge --delete-branch` removes remote branch; local cleanup is `git worktree remove` + `git branch -d`. Requires explicit user confirmation.

**Step 9 — DEPRECATED.** Cowork artifact dependency goes away with the strategist skills. If active Cowork session in flight, surface diff for relay; else skip.

**Frontmatter description** updated from "rebase → fast-forward" to "PR → squash-merge".

**Anti-patterns updated:** removed the squash-merging-is-bad bullet (squash is now the path); added force-push warning instead.

## File layout (post-implementation)

```
.claude/skills/
  begin-session/SKILL.md      (new, 12 commits incl 1 fix)
  red-team-prompt/SKILL.md    (new, 2 commits incl 1 fix)
  strategist/SKILL.md         (new, 2 commits incl 1 fix)
  retrospect/SKILL.md         (new, 2 commits incl 1 fix)
  open-questions/SKILL.md     (new, 2 commits incl 1 fix)
  wrap-session/SKILL.md       (updated, 2 commits incl 1 fix)
docs/
  open-questions.md           (new — seeded ledger)
  superpowers/
    specs/2026-05-16-strategist-skills-design.md  (this file)
    plans/2026-05-16-strategist-skills.md         (implementation plan)
```

## Documentation updates (deferred to post-u1-u3 lands)

- `CLAUDE.md` section 6 (Development workflow): list new skills with one-line descriptions.
- `docs/strategist-protocol.md`: add references to new skills; remove the prompt-preflight checklist (lines 82-111) since `/red-team-prompt` now owns it.
- `docs/sessions/prompts/README.md` (if exists): note that boilerplate is no longer expected in prompts.

## Testing approach

Smoke testing was deferred and batched to land alongside the doc updates. The new skills WERE confirmed discoverable via the Skill tool mid-session (system reminder listed them), so smoke testing via real invocation will work.

Validation by use is the load-bearing test: the next numbered session uses `/begin-session` + `/wrap-session` + `/strategist` end-to-end. If they hold, the pattern's proven. If not, fix.

## Risks and unknowns

- **Skill personas may not feel like a real strategist.** Mitigation: `/strategist` engages in conversation, not just executes. Validate by use.
- **The lean prompt template may lose context that mattered.** Mitigation: link aggressively. Watch first 2-3 sessions for "Claude Code missed something the boilerplate would have caught" and adjust.
- **Red-team subagent quality.** Mitigation: dispatch with a known-buggy prompt first (e.g., the bundled 0010+0011) to calibrate.
- **`/begin-session` couples to ADR 0006's branch naming.** Acceptable — intentional coupling.

## Out of scope (deferred)

- Doc surgery (kill `project-state.md` Sessions completed list, roadmap/state phase deduplication, working agreement pruning).
- Replacing Cowork strategist chat entirely. Decide phase by phase.
- Portable versions of these skills for other projects.
- Automating the unfolder-roadmap Cowork artifact (goes away when Cowork strategist use drops).

## Lessons from implementation

Every single skill went through a feat commit → code-quality review → fix-per-review commit cycle. The code-quality reviewer caught real bugs on each one:

| Skill | What the spec missed (caught by review) |
|---|---|
| /begin-session | Worktree path convention (`/` → `+`); `cd` doesn't persist between Bash calls; HEAD-vs-origin/main check |
| /wrap-session | PR body should use repo's actual template, not a divergent hard-coded one; maint-worktree path |
| /red-team-prompt | Checklist had 7 items; protocol has 9 — added 4 missing; explicit substitution instruction |
| /open-questions | `scan` didn't assign IDs (broke subsequent ops); `add` `<n>` ambiguous (could duplicate); `queue` not atomic |
| /retrospect | Pass 2 lacked explicit pause; partial-completion states unhandled; missing prior retrospectives in gather |
| /strategist | CLAUDE.md missing from orientation; missing-ledger summary undefined; squash-merge SHA caveat; template extensibility |

The pattern argues that **the code-quality reviewer subagent is the single highest-leverage piece of the subagent-driven workflow for skill content** — 6-for-6 useful-finding rate, with each finding fixing a real bug. Worth keeping as a standing practice for any future SKILL.md authoring.

## Open questions for review (originally posed; status updated)

1. **Does `/strategist` need a way to invoke just doc-load + summary without entering planning mode?** RESOLVED: no — summary prints unconditionally, then planning begins. Add subcommand later if proves needed.
2. **Should `/red-team-prompt` auto-run inside `/strategist`'s prompt-draft path?** RESOLVED: no — it offers, doesn't auto-run. Keeps skills independent. The offer is now conditional on session type (recommended for session/spike, optional for maint).
3. **Does `/open-questions` need a `migrate` subcommand for old session logs?** RESOLVED: no — fresh start from 0024. Documented in the seeded ledger.
