# Strategist skills — design spec

**Date:** 2026-05-16
**Status:** Draft for review
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

## The skills

### 1. `/begin-session`

**Purpose:** Replace the Tasks 1-2 boilerplate (worktree creation, prompt copy, `pnpm install`) that appears verbatim in 11 numbered-session prompts.

**Invocation:** `/begin-session <branch-name>`

Branch name must match `^(session|maint|spike)/[a-z0-9-]+$` per ADR 0006. Examples:
- `/begin-session session/0024-recut-improvements`
- `/begin-session spike/0023-takahashi-mst`
- `/begin-session maint/clean-references-readme`

**Steps:**
1. Validate branch name against the ADR 0006 regex. Stop if invalid.
2. Confirm cwd is the main checkout. If in a worktree, stop and surface.
3. `git fetch origin main` then `git status --short` — main must be clean.
4. `git rev-parse origin/main` — note HEAD for the session log.
5. `git worktree prune`.
6. `git worktree add ../<branch-name> -b <branch-name> main`.
7. Locate the authoritative prompt file:
   - `session/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
   - `spike/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
   - `maint/<descriptor>` → `docs/sessions/prompts/<descriptor>.md` (no number prefix, per protocol)

   Verify exists; stop if missing. Maint commits without a prompt file are valid per protocol but out of scope for this skill — invoke `/begin-session` only when there is a prompt to anchor the worktree to.
8. Copy prompt file from main checkout into worktree (preserves authoritative version per the v1 lesson about reconstruction).
9. Print or cd to worktree path.
10. Run `pnpm install` in the worktree.
11. Read `docs/queue.md` and surface items that may intersect the session's scope (read prompt's goal section to infer scope).
12. Print status report: branch, HEAD SHA, worktree path, queue intersections, prompt file path.

**Failure modes:**
- Main dirty → stop, surface
- Branch already exists → stop, surface (don't auto-pick a new name)
- Prompt file missing for session/spike → stop, surface
- `pnpm install` fails → stop, surface

**Anti-patterns:**
- Auto-generating branch names. ADR 0006 mandates explicit naming.
- Skipping `pnpm install` because "it'll probably work." Fresh worktrees lack `node_modules`.
- Silently reconstructing a missing prompt file. The v1 lossy-reconstruction lesson stands.

### 2. `/red-team-prompt`

**Purpose:** Stress-test a drafted prompt before it reaches Evan. Closes the v2-retrospective pilot that was named but never run.

**Invocation:** `/red-team-prompt <prompt-path> [--write]`

`--write` saves the report to `<prompt-path-without-ext>-redteam.md` alongside the prompt.

**Steps:**
1. Validate path exists and is a `.md` file.
2. Read prompt file.
3. Read preflight checklist from `docs/strategist-protocol.md`.
4. Dispatch a Plan subagent (no chat context) with:
   - The prompt content
   - The preflight checklist
   - Specific instruction to flag: ambiguity (any instruction with two reasonable interpretations); stale API references (paraphrased function signatures); predicted test counts; dictated library call signatures (v1 anti-pattern); cross-file inconsistencies (referenced files/SHAs that don't match); missing verification steps; verbatim content that should be spec; spec content that should be verbatim
   - Format response as: blocking issues / suggestions / nits, with prompt-line citations
5. Print findings.
6. If `--write`, save report.

**Failure modes:**
- Path missing → stop
- Subagent finds no issues → valid result, print "clean"

**Anti-patterns:**
- Auto-fixing issues. The skill reports; the strategist decides.
- Priming the subagent with the project's working agreements (defeats the fresh-eyes property).

### 3. `/strategist`

**Purpose:** Switch Claude Code into strategist persona. Loads orientation docs and engages in planning mode. Replaces the 8-doc Cowork re-orientation ritual.

**Invocation:** `/strategist [task]`

With no task: enters planning conversation after orientation. With task: drafts the artifact requested (typically `draft session NNNN prompt for X`).

**Steps:**
1. Load orientation docs in this order:
   - `docs/project-state.md`
   - `docs/strategist-protocol.md`
   - `docs/queue.md`
   - `docs/roadmap.md`
   - latest retrospective in `docs/retrospectives/` (most recent file)
   - last 2-3 session logs in `docs/sessions/` (sorted)
2. Run `git log --oneline -20` to catch outside-chat drift.
3. Run `git status --short` on main.
4. Print one-line summary: "Loaded. Current phase: <X>. Last session: <NNNN>. Open queue items: <N>. Drift since last session log: <yes/no>."
5. If task provided: act. If drafting a prompt, use the lean template (see below). Save to `docs/sessions/prompts/<descriptor>.md`. Offer to run `/red-team-prompt` on it.
6. If no task: enter planning conversation. Recommendation-first, not options. Mark uncertainty. Use AskUserQuestion only for genuine either/or forks.

**Lean prompt template** (replaces the bloated format):
```markdown
# Session NNNN — <Title>

## Goal
<1-3 sentences. What ships.>

## Context
<Only what's not in project-state.md or the prior session log. Link, don't recap.>

## Tasks
<Numbered list. No worktree boilerplate — /begin-session handles that.
 No "produce implementation report" — that's standing protocol now.>

## Specs
<Behavior specs, not code. Per the existing pattern.>

## Appendix (verbatim content only)
<ADR drafts, document content where wording IS the deliverable.>
```

**Failure modes:**
- Orientation doc missing → flag and continue (don't block)
- Uncommitted changes on main → flag and ask whether to proceed

**Anti-patterns:**
- Restating context from project-state.md verbatim in the drafted prompt. Link instead.
- Offering forks where a recommendation was possible (v2 lesson).
- Predicting test counts (v1 lesson, repeated in v2).
- Dictating library call signatures (v1 lesson).

### 4. `/retrospect`

**Purpose:** Run the 4-pass retrospective ritual from v2-retrospective.md as a standing skill, not an Evan-must-ask-for-it event.

**Invocation:** `/retrospect <phase>` (e.g., `/retrospect v3`)

**Steps:**
1. Validate `docs/retrospectives/<phase>-complete.md` does not exist (else this is a re-run, ask before overwriting).
2. Gather artifacts:
   - Session logs whose number falls in the phase range (read from `docs/roadmap.md`)
   - ADRs created in the phase
   - Queue items added/closed in the phase
   - Audit findings in the phase (`docs/audits/`)
   - `git log` for the phase range
3. **Pass 1 — Ground.** Produce factual timeline + first-pass observations (observations, not conclusions). Save to `docs/retrospectives/<phase>-complete-draft.md`. Surface to user for review.
4. **Pass 2 — Reframe.** Per v2's pattern: ask user to direct converting observations into decisions, each with context, competing viewpoints, and novel pilots to try. User accepts/redirects each.
5. **Pass 3 — Self-lens.** Strategist's honest assessment of its own performance in the phase (what it over/under-weighted, where it offloaded, what habits showed).
6. **Pass 4 — Converge.** Write `<phase>-complete.md` (what shipped) and `<phase>-retrospective.md` (how we worked). Delete the draft.
7. Print follow-up suggestions: handoff doc updates, queue additions, working agreement changes. Do not apply automatically.

**Failure modes:**
- Phase has no completed sessions → stop
- User wants to skip a pass → warn that the 4-pass structure is load-bearing, but proceed if confirmed

**Anti-patterns:**
- Producing a strategist-draft retrospective unilaterally (the v2 lesson — that's how `v2-complete.md` was first written and Evan asked for a real retro).
- Compressing the 4 passes into one. The pause-and-direct between passes is the point.

### 5. `/open-questions`

**Purpose:** Manage a new `docs/open-questions.md` ledger. Force explicit disposition on every open question — no silent carry, no 8-session drags.

**Invocation:** `/open-questions [subcommand] [args]`

Subcommands:
- `scan` (default) — read last session log's "Open questions for the strategist" block, walk each item
- `list` — show current ledger
- `add <text>` — add new entry directly
- `close <id> <resolution>` — close with note
- `carry <id> <reason> <target>` — carry forward with reason + target session
- `queue <id> <reason>` — move to `docs/queue.md`
- `drop <id> <reason>` — drop with reason

**Ledger format** (`docs/open-questions.md`):
```markdown
# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

- [Q-0023-1] Raised 0023 — <question>. Carrying to 0024 (Takahashi work will inform).
- [Q-0023-2] Raised 0023 — <question>. Queued to docs/queue.md as [decision].

## Resolved

- [Q-0012-1] Raised 0012 — `<short-sha>` handoff field unfillable. Resolved 2026-05-15: dropped field (v3-boundary-housekeeping).
```

**Steps for `scan`:**
1. Find most recent session log in `docs/sessions/` (sorted by filename).
2. Extract "Open questions for the strategist" section.
3. For each item: prompt user with options (close / carry / queue / drop) plus the item's text.
4. Apply chosen disposition to `docs/open-questions.md` (create file if missing).
5. Print summary of changes.

**Failure modes:**
- No previous session log → start fresh ledger
- Last log has no open-questions section → no-op, print confirmation

**Anti-patterns:**
- Silently carrying any item. Disposition must be explicit.
- Modifying the session log to change its open-questions section. The log is immutable; the ledger is the working surface.

### 6. `/wrap-session` (update existing)

The current skill at `.claude/skills/wrap-session/SKILL.md` is stale for ADR 0006's PR flow. Specific changes:

- **Step 1:** Change branch validation from `claude/<random>` pattern to `^(session|maint|spike)/[a-z0-9-]+$`. Direct-to-main maintenance commits (also legal per protocol) trigger an alternate path: skip steps 1, 6, 7, 8 (no worktree, no rebase, no PR, no worktree cleanup). Commit goes straight to main per the simpler `git commit` + `git push origin main` flow.
- **Step 4:** Remove the "until WI-4 lands" hedge — strategist-protocol.md exists and is canonical.
- **Steps 6-7 (rebase + fast-forward):** Replace with PR-based flow for `session/` and `spike/` branches:
  1. Push branch: `git push -u origin <branch>`
  2. Open PR: `gh pr create --title "<conventional-commit-subject>" --body "<from .github/PULL_REQUEST_TEMPLATE.md filled in>"`
  3. Monitor CI: `gh pr checks <pr-number> --watch`
  4. On green + review: `gh pr merge --squash --delete-branch` (or surface to user for review-gate, per session sensitivity)
  - Maintenance commits (`maint/` or direct-to-main per protocol) keep the simpler fast-forward path
- **Step 8 (worktree cleanup):** Adjust — `gh pr merge --delete-branch` already deletes the remote branch; local cleanup is `git worktree remove` + `git branch -d`.
- **Step 9 (Cowork artifact):** Mark deprecated. Once the strategist skills are in place, the Cowork artifact dependency goes away. Leave the step with a note pointing to the deprecation.

## File layout

```
.claude/skills/
  begin-session/SKILL.md          (new)
  red-team-prompt/SKILL.md        (new)
  strategist/SKILL.md             (new)
  retrospect/SKILL.md             (new)
  open-questions/SKILL.md         (new)
  wrap-session/SKILL.md           (updated)
docs/
  open-questions.md               (new — ledger)
  superpowers/specs/
    2026-05-16-strategist-skills-design.md  (this file)
```

## Documentation updates (in-scope)

Updates that ship with this body of work because they keep the canon coherent:
- `CLAUDE.md` section 6 (Development workflow): list the new skills with one-line descriptions.
- `docs/strategist-protocol.md`: add references to `/strategist`, `/red-team-prompt`, `/open-questions`. Remove the prompt-preflight checklist (lines 82-111) since `/red-team-prompt` now owns it.
- `docs/sessions/prompts/README.md` (if it exists): note that boilerplate is no longer expected in prompts.

## Testing approach

Skills aren't unit-tested. Validation by dogfooding:
1. **Smoke test each skill manually** after creation:
   - `/begin-session session/0099-skill-smoketest` against a throwaway prompt file → verify worktree created, prompt copied, pnpm installed, queue scanned. Tear down via `git worktree remove`.
   - `/red-team-prompt docs/sessions/prompts/0016-automatic-recut.md` → verify it produces categorized findings on a known-good prompt.
   - `/strategist` (no task) → verify orientation loads, status summarized.
   - `/strategist draft a session prompt for clean-up of references README` → verify draft uses lean format.
   - `/retrospect v3` → verify it refuses (v3 not done) with clear message.
   - `/open-questions scan` → verify last session log's open questions surfaced.
   - `/wrap-session` against a maintenance commit on main → verify the maint path works without PR flow.
2. **First real use**: the next numbered session (likely 0024) uses `/begin-session` + `/wrap-session` end-to-end. If it works, the pattern's proven.
3. **First strategist use**: drafting 0024's prompt via `/strategist` instead of in Cowork. Compare output quality to the prior pattern.

## Risks and unknowns

- **Skill personas may not feel like a real strategist.** The Cowork strategist has thinking-out-loud conversation quality; a skill might feel more transactional. Mitigation: write `/strategist` to engage in conversation, not just execute. Validate by use.
- **The lean prompt template may lose context that mattered.** Mitigation: link aggressively to docs that carry the context. Watch the first 2-3 sessions for "Claude Code missed something the boilerplate would have caught" and adjust.
- **Red-team subagent quality is unknown.** May produce noise or miss real issues. Mitigation: start with prompts we already know had issues (e.g., the bundled 0010+0011) and see what it catches.
- **`/begin-session` couples to ADR 0006's branch naming.** If ADR 0006 changes, skill changes with it. Acceptable — the coupling is intentional.

## Out of scope (deferred)

These are real follow-up work but not part of this body:
- Doc surgery (`project-state.md` Sessions completed list, roadmap/state phase deduplication, working agreement pruning).
- Replacing the Cowork strategist chat use entirely. Decide phase by phase whether the chat still adds value.
- Building portable versions of these skills for other projects.
- Automating the unfolder-roadmap Cowork artifact updates (it goes away when we stop using the Cowork strategist for routine work).

## Open questions for review

1. Does `/strategist` need a way to invoke just the doc-load + summary step without entering planning mode? (e.g., `/strategist status` or just running the orientation as a one-shot.) Current design: no — the summary prints unconditionally, then planning begins. Add subcommand later if needed.
2. Should `/red-team-prompt` automatically run as a step inside `/strategist`'s prompt-draft path? Current design: no — it offers, doesn't auto-run. Keeps skills independent.
3. Does `/open-questions` need a `migrate` subcommand to import existing open questions from old session logs (0012-0022) on first run? Current design: no — start fresh from session 0023 onward; old questions either closed in retrospectives or considered superseded.
