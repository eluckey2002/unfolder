# Strategist Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create five new Claude Code skills (`/begin-session`, `/red-team-prompt`, `/strategist`, `/retrospect`, `/open-questions`) and update the existing `/wrap-session` skill so the strategist-protocol ceremony lives in code instead of being pasted into every session prompt.

**Architecture:** Independent skills at `.claude/skills/<name>/SKILL.md`, following the convention of the existing `wrap-session` skill. Each skill has one clear purpose and can be invoked alone. `/strategist` may optionally offer to chain to `/red-team-prompt`, but skills never call each other directly. Skills are tested by manual smoke invocation, not unit tests (skills are content, not code).

**Tech Stack:** Markdown skill files with YAML frontmatter (`name`, `description`). Bash/git invocations inside skills for `/begin-session` and `/wrap-session`. Subagent dispatch via the Task tool for `/red-team-prompt`. New ledger file `docs/open-questions.md`.

**Spec:** [docs/superpowers/specs/2026-05-16-strategist-skills-design.md](../specs/2026-05-16-strategist-skills-design.md) — read it first.

---

## File Structure

**New files:**
- `.claude/skills/begin-session/SKILL.md`
- `.claude/skills/red-team-prompt/SKILL.md`
- `.claude/skills/strategist/SKILL.md`
- `.claude/skills/retrospect/SKILL.md`
- `.claude/skills/open-questions/SKILL.md`
- `docs/open-questions.md`

**Modified files:**
- `.claude/skills/wrap-session/SKILL.md` (ADR 0006 PR flow)
- `CLAUDE.md` (section 6 — list new skills)
- `docs/strategist-protocol.md` (remove preflight checklist now owned by `/red-team-prompt`; add skill references)

---

## Conventions used throughout

**SKILL.md format** (per existing `wrap-session`):
```markdown
---
name: <kebab-case-name>
description: <one-line, includes trigger phrases the user might say>
---

# <Title-case name>

<One-paragraph context>

## Step 1 — <imperative title>

<body>

...

---

**Anti-patterns to avoid:**

- <bulleted list>
```

**Commit format:** Conventional Commits, e.g. `feat(skills): add /begin-session skill`.

**Branch:** This entire body of work runs in a single worktree per ADR 0006. Suggested name: `session/0024-strategist-skills` (use whatever number is next when starting).

**Note on bootstrapping:** This session runs *before* `/begin-session` and the updated `/wrap-session` exist, so the user creates the worktree manually and pushes/merges manually via the existing v3 PR flow (per ADR 0006). The skills built here apply to subsequent sessions.

---

### Task 1: Pre-flight — verify environment and read templates

**Files:**
- Read: `.claude/skills/wrap-session/SKILL.md` (existing skill — use as format template)
- Read: `docs/strategist-protocol.md` (source of preflight checklist; will be moved into `/red-team-prompt`)
- Read: `.github/PULL_REQUEST_TEMPLATE.md` (used in `/wrap-session` update — verify it exists)

- [ ] **Step 1: Verify skills directory exists**

```bash
ls .claude/skills/
```

Expected: shows at least `wrap-session/`.

- [ ] **Step 2: Read existing wrap-session SKILL.md as a format template**

Use the Read tool on `.claude/skills/wrap-session/SKILL.md`. Note: imperative voice, numbered steps with `## Step N — <title>` headers, bash blocks with explicit commands, anti-patterns section at bottom.

- [ ] **Step 3: Read strategist-protocol.md and extract the preflight checklist**

Read `docs/strategist-protocol.md` lines 82-111 (the "Prompt preflight checklist" section). This content will be embedded in `/red-team-prompt`'s subagent prompt verbatim, then removed from `strategist-protocol.md` in Task 12.

- [ ] **Step 4: Verify the GitHub PR template exists**

```bash
ls .github/PULL_REQUEST_TEMPLATE.md 2>/dev/null || ls .github/pull_request_template.md 2>/dev/null
```

If missing, note for Task 4 — the `/wrap-session` update will instruct using a generic body when the template is absent.

---

### Task 2: Create `/begin-session` skill

**Files:**
- Create: `.claude/skills/begin-session/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/begin-session
```

- [ ] **Step 2: Write the SKILL.md file**

Create `.claude/skills/begin-session/SKILL.md` with this exact content:

````markdown
---
name: begin-session
description: Set up the worktree and starting state for a numbered session, spike, or maintenance commit per ADR 0006. Use when the user types /begin-session or starts a new session from main.
---

# Begin-session

Bootstrap a new worktree per ADR 0006. Walk the steps in order — do not skip.

## Step 1 — Validate branch name

The first argument is the branch name. It MUST match `^(session|maint|spike)/[a-z0-9-]+$`. Examples:
- `session/0024-recut-improvements`
- `spike/0023-takahashi-mst`
- `maint/clean-references-readme`

If invalid, stop and surface to the user. Do not auto-correct.

## Step 2 — Confirm you are in the main checkout

```bash
pwd && git worktree list
```

If cwd is a worktree (not the main checkout), stop. The user invoked from the wrong place.

## Step 3 — Confirm main is clean and up to date

```bash
git fetch origin main
git status --short
git rev-parse origin/main
```

Working tree must be clean. Note the HEAD SHA — it'll be useful for the session log later.

## Step 4 — Prune stale worktrees

```bash
git worktree prune
```

Per CLAUDE.md section 5: merged session branches are auto-deleted on the remote; the local worktree admin still needs pruning.

## Step 5 — Create the worktree

```bash
git worktree add ../<branch-name> -b <branch-name> main
```

If the branch already exists locally or on origin, stop. The user should pick a fresh name.

## Step 6 — Locate the authoritative prompt file

Parse the branch name to find the prompt:
- `session/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
- `spike/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
- `maint/<descriptor>` → `docs/sessions/prompts/<descriptor>.md`

Verify the file exists in the main checkout. If missing, stop — do not silently reconstruct it (v1 lesson). Maint commits without a prompt file are valid per protocol but out of scope for this skill.

## Step 7 — Copy the prompt file into the worktree

Use `cp` to copy from the main checkout to the same relative path in the worktree. The worktree's copy is what commits with the session; at fast-forward time `diff -q` between the main and worktree copies should show byte-identical.

## Step 8 — Switch to the worktree and install

```bash
cd ../<branch-name>
pnpm install
```

Fresh worktrees lack `node_modules`. Stop if pnpm install fails.

## Step 9 — Scan the queue for scope intersections

Read `docs/queue.md`. Read the prompt's Goal section. Surface any queue items that intersect the session's scope — even tangentially. Better to over-flag than under-flag.

## Step 10 — Print the starting state report

Output to the user:

```
Worktree:    ../<branch-name>
Branch:      <branch-name>
Main HEAD:   <SHA>
Prompt:      docs/sessions/prompts/<filename>
Queue items: <count>; <list scope-intersecting ones>
```

The session is ready to start.

---

**Anti-patterns to avoid:**

- Auto-generating branch names. ADR 0006 mandates explicit naming.
- Skipping `pnpm install` because "it'll probably work." Fresh worktrees lack `node_modules`.
- Silently reconstructing a missing prompt file. The v1 lossy-reconstruction lesson stands.
- Running on a dirty main. Stop and let the user clean up first.
````

- [ ] **Step 3: Verify file structure**

```bash
ls .claude/skills/begin-session/
```

Expected: shows `SKILL.md`.

```bash
head -4 .claude/skills/begin-session/SKILL.md
```

Expected: shows the frontmatter with `name: begin-session` and a `description:` line.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/begin-session/SKILL.md
git commit -m "feat(skills): add /begin-session skill

Codifies the worktree + prompt-copy + pnpm install + queue-scan ritual
that previously appeared as 40 lines of verbatim boilerplate in every
numbered-session prompt. Per ADR 0006 branch naming.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Smoke-test `/begin-session`

**Files:**
- Create (temporary): `docs/sessions/prompts/9999-skill-smoketest.md`
- Delete after test

- [ ] **Step 1: Create a throwaway prompt file**

Write `docs/sessions/prompts/9999-skill-smoketest.md` with minimal content:

```markdown
# Session 9999 — Skill smoketest

## Goal

Throwaway prompt for skill smoke testing. Delete after use.

## Tasks

(none — this prompt is never run)
```

- [ ] **Step 2: Invoke /begin-session against the throwaway**

Invoke the skill via the Skill tool: `Skill(skill="begin-session", args="session/9999-skill-smoketest")`.

Expected behaviors (verify each):
- Validates branch name (matches regex) — passes
- Reports cwd = main checkout — passes
- Fetches origin/main, reports HEAD — succeeds
- Creates worktree at `../session/9999-skill-smoketest` — succeeds
- Copies `docs/sessions/prompts/9999-skill-smoketest.md` into the worktree — file present
- Runs `pnpm install` — succeeds
- Prints starting state report — visible

If any step fails, debug and re-test before continuing.

- [ ] **Step 3: Tear down the test worktree**

```bash
git worktree remove ../session/9999-skill-smoketest
git branch -D session/9999-skill-smoketest
```

- [ ] **Step 4: Delete the throwaway prompt file**

```bash
rm docs/sessions/prompts/9999-skill-smoketest.md
```

- [ ] **Step 5: Confirm clean state**

```bash
git status --short
git worktree list
```

Expected: no uncommitted changes; only the current session's worktree listed.

- [ ] **Step 6: No commit** — smoke test artifacts are discarded, not committed.

---

### Task 4: Update `/wrap-session` for ADR 0006 PR flow

**Files:**
- Modify: `.claude/skills/wrap-session/SKILL.md`

- [ ] **Step 1: Update Step 1 (branch validation)**

Replace this block in `.claude/skills/wrap-session/SKILL.md`:

```
Confirm cwd is the worktree (not the main checkout) and the branch matches the
expected `claude/<random>` pattern. If you're in main, stop and ask the user
whether this is a maintenance commit (no rebase step) or a misconfigured
session.
```

With:

```
Confirm cwd matches expectations. Two valid paths:

**Worktree path (default for session/spike):** cwd is a worktree, branch matches `^(session|maint|spike)/[a-z0-9-]+$`. Proceed through all steps.

**Direct-to-main path (legal for maint per protocol):** cwd is main, branch is `main`. Skip steps 6, 7, and 8 (no PR, no fast-forward, no worktree cleanup); commit goes straight to main.

If cwd doesn't match either pattern, stop and surface.
```

- [ ] **Step 2: Update Step 4 (handoff-block reference)**

Replace:

```
If this is a numbered session, ensure `docs/sessions/NNNN-*.md` exists and
ends with the **handoff status block** (see `docs/strategist-protocol.md` once
WI-4 lands — until then, follow the existing session-log format).
```

With:

```
If this is a numbered session, ensure `docs/sessions/NNNN-*.md` exists and
ends with the **handoff status block** per `docs/strategist-protocol.md`.
```

- [ ] **Step 3: Replace Step 6 (rebase) and Step 7 (fast-forward) with PR flow**

Replace the existing Step 6 and Step 7 blocks entirely with:

````markdown
## Step 6 — Push the branch (session/spike only)

```bash
git push -u origin <branch>
```

Maintenance commits direct-to-main: `git push origin main` and skip to Step 9.

## Step 7 — Open a PR (session/spike only)

```bash
gh pr create --title "<conventional-commit-subject>" --body "$(cat <<'EOF'
## Summary
<1-3 bullets>

## Test plan
<bulleted checklist>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `.github/PULL_REQUEST_TEMPLATE.md` exists, prefer its body structure.

Watch CI:

```bash
gh pr checks --watch
```

When CI is green and review (if any) has passed:

```bash
gh pr merge --squash --delete-branch
```

If the PR has unresolved review comments, surface them to the user — do not auto-merge.
````

- [ ] **Step 4: Update Step 8 (worktree cleanup)**

Replace the existing Step 8 with:

````markdown
## Step 8 — Worktree cleanup (requires explicit confirmation)

`gh pr merge --delete-branch` already removes the remote branch. Local cleanup:

**Never delete the worktree silently.** Ask the user:

> Branch `<branch>` merged via PR. Delete the local worktree at `<path>` and the local branch? (Y/n)

Only on explicit "yes" run:

```bash
git worktree remove <path>
git branch -d <branch>
```

For maintenance commits direct-to-main: no worktree to clean up; skip.
````

- [ ] **Step 5: Update Step 9 (Cowork artifact)**

Replace the existing Step 9 with:

```markdown
## Step 9 — Update Cowork artifact (deprecated path)

**DEPRECATED.** With the strategist skills (`/strategist`, `/retrospect`, etc.) in place, the Cowork strategist is no longer the per-session source of truth, and the `unfolder-roadmap` Cowork artifact is no longer load-bearing.

If an active Cowork session is in flight, surface the diff (queue, recent commits, HEAD) to the user for relay. Otherwise, skip this step.
```

- [ ] **Step 6: Verify the file is coherent**

Read the updated `.claude/skills/wrap-session/SKILL.md` end-to-end. Check:
- All step numbers still flow correctly
- No references to `claude/<random>` remain
- No "once WI-4 lands" hedge remains
- The two paths (worktree session/spike, direct-to-main maint) are both consistent across steps

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/wrap-session/SKILL.md
git commit -m "chore(skills): update /wrap-session for ADR 0006 PR flow

Replace the pre-PR-flow fast-forward path with gh-based PR open + CI
watch + squash-merge. Update branch validation to the ADR 0006
<type>/<descriptor> pattern. Mark the Cowork artifact step deprecated
now that the strategist skills replace per-session Cowork use.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Smoke-test updated `/wrap-session`

Full smoke test is impractical (would require completing a real session). Verify key path-branching logic by reading.

- [ ] **Step 1: Read the updated skill end-to-end**

Use the Read tool on `.claude/skills/wrap-session/SKILL.md`. Mentally walk through each path:
- Worktree-based session/spike → Steps 1-9 all apply (PR flow at 6-7)
- Direct-to-main maint → Steps 1-5 then 9 (skip 6, 7, 8)

- [ ] **Step 2: Verify gh is available**

```bash
gh --version
gh auth status
```

Expected: gh installed, authenticated. If not, surface — the skill will fail without it.

- [ ] **Step 3: No commit** — read-only verification.

---

### Task 6: Create `/red-team-prompt` skill

**Files:**
- Create: `.claude/skills/red-team-prompt/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/red-team-prompt
```

- [ ] **Step 2: Write the SKILL.md file**

Create `.claude/skills/red-team-prompt/SKILL.md` with this exact content:

````markdown
---
name: red-team-prompt
description: Stress-test a drafted session prompt for ambiguity, stale APIs, predicted test counts, and other failure modes before it reaches the director. Use when the user types /red-team-prompt or asks to "red-team", "review", or "sanity-check" a prompt.
---

# Red-team prompt

Dispatch a no-context subagent to stress-test a drafted prompt against the preflight checklist embedded below. The skill reports findings; it does not auto-fix.

## Step 1 — Validate input

The first argument is a path to a `.md` file. Verify it exists with the Read tool. If a `--write` flag is present, the report will be saved alongside the prompt at `<prompt-path-stem>-redteam.md`.

## Step 2 — Read the prompt

Read the full prompt file. Capture the line count — the subagent will cite by line number.

## Step 3 — Dispatch the subagent

Use the Agent tool with `subagent_type: Plan`. Do **NOT** prime the agent with project context, working agreements, or CLAUDE.md content — the fresh-eyes property is the whole point.

Subagent prompt (literal — paste exactly with the prompt content inlined at the bottom):

> I am red-teaming a draft session prompt for a software engineering project. The prompt is intended for a Claude Code agent to implement. Identify issues against this checklist:
>
> 1. **Ambiguity** — any instruction with two reasonable interpretations
> 2. **Stale API references** — paraphrased function signatures, version-specific syntax that may have changed
> 3. **Predicted test counts** — any "tests should pass with N total" or similar. The prompt should ask the implementer to report the count, never predict it
> 4. **Dictated library call signatures** — specific function calls written in the prompt rather than described as behavior to implement
> 5. **Cross-file inconsistencies** — referenced files, commits, SHAs that don't match the actual repo state (you can verify these if a repo is mounted)
> 6. **Missing verification steps** — code-modification tasks without an explicit verification command
> 7. **Verbatim-vs-spec mismatch** — content marked verbatim that should be a behavior spec, or spec content where wording IS the deliverable
>
> Format your response in three sections:
> - **Blocking** — issues that would produce wrong work if left
> - **Suggestions** — issues that would degrade output quality
> - **Nits** — wording or style issues
>
> Cite by prompt line number for every finding. If a category has nothing, write "(none)".
>
> Prompt content follows:
>
> ---
>
> <paste full prompt file content here>

## Step 4 — Print findings

Output the subagent's response to the user verbatim. Do not edit, summarize, or filter.

## Step 5 — Optionally write the report

If `--write` was passed, save the subagent's output to `<prompt-path-without-.md>-redteam.md` (e.g., `0023-foo.md` → `0023-foo-redteam.md`) alongside the prompt file.

---

**Anti-patterns to avoid:**

- Priming the subagent with the project's working agreements or CLAUDE.md. Defeats the fresh-eyes property.
- Auto-fixing issues. The skill reports; the strategist decides what to fix.
- Filtering the subagent's findings. The user sees everything, including nits.
- Skipping the skill because "the prompt looks fine to me." The skill exists because the strategist's self-review has known blind spots.
````

- [ ] **Step 3: Verify file structure**

```bash
ls .claude/skills/red-team-prompt/
head -4 .claude/skills/red-team-prompt/SKILL.md
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/red-team-prompt/SKILL.md
git commit -m "feat(skills): add /red-team-prompt skill

Dispatch a no-context Plan subagent to stress-test drafted prompts
against the strategist-protocol preflight checklist. Closes the v2
retrospective's pilot that was named but never run.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Smoke-test `/red-team-prompt`

- [ ] **Step 1: Invoke against a known prompt**

Run the skill against an existing prompt with known characteristics:

```
Skill(skill="red-team-prompt", args="docs/sessions/prompts/0016-automatic-recut.md")
```

Expected: produces a Blocking/Suggestions/Nits report. Some findings expected (the spec listed several types the v2 prompts have).

- [ ] **Step 2: Verify subagent received no project priming**

Inspect the actual subagent prompt that the skill produces (it should be the literal text from Step 3 of the skill). Confirm no CLAUDE.md content, no working agreements, no project-state.md content was injected.

- [ ] **Step 3: Test `--write` mode**

Run with `--write` flag:

```
Skill(skill="red-team-prompt", args="docs/sessions/prompts/0016-automatic-recut.md --write")
```

Expected: produces a file at `docs/sessions/prompts/0016-automatic-recut-redteam.md`.

Delete after verifying — it's a smoke-test artifact:

```bash
rm docs/sessions/prompts/0016-automatic-recut-redteam.md
```

- [ ] **Step 4: No commit** — smoke-test artifacts are discarded.

---

### Task 8: Create `/open-questions` skill and seed the ledger

**Files:**
- Create: `.claude/skills/open-questions/SKILL.md`
- Create: `docs/open-questions.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/open-questions
```

- [ ] **Step 2: Write the SKILL.md file**

Create `.claude/skills/open-questions/SKILL.md` with this exact content:

````markdown
---
name: open-questions
description: Manage the docs/open-questions.md ledger. Force explicit disposition (close/carry/queue/drop) on each open question from session handoffs — no silent carry. Use when the user types /open-questions, "scan open questions", or starts a new session.
---

# Open questions

Manage the ledger at `docs/open-questions.md`. Default subcommand is `scan`.

## Subcommands

- `scan` (default) — read last session log's open-questions block, walk each item
- `list` — show current ledger contents
- `add <text>` — add a new entry directly
- `close <id> <resolution>` — close with resolution note
- `carry <id> <reason> <target-session>` — carry forward with reason + target
- `queue <id> <reason>` — promote to `docs/queue.md`
- `drop <id> <reason>` — drop with reason

## Step 1 — Read the ledger (or create it)

If `docs/open-questions.md` doesn't exist, create with this header:

```markdown
# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

## Resolved
```

## Step 2 — Execute the subcommand

### scan (default)

1. Find the most recent session log in `docs/sessions/` (sorted by filename — works because numbers are zero-padded).
2. Extract the "Open questions for the strategist" block. If missing, print "No open questions in `<filename>`. Ledger unchanged." and stop.
3. For each item, prompt the user with the question text and these options: **close** / **carry** / **queue** / **drop** / **skip-for-now**.
4. Apply chosen disposition by editing `docs/open-questions.md`:
   - close → add entry to `## Resolved` with resolution + today's date
   - carry → add to `## Open` with reason + target session
   - queue → add a line to `docs/queue.md` with appropriate category tag AND add to `## Resolved` noting "queued <date>"
   - drop → add to `## Resolved` with drop reason
   - skip-for-now → no change; will resurface next scan

### list

Print the contents of `docs/open-questions.md`. If empty (only headers), print "Ledger empty."

### add <text>

Add a new entry to `## Open` with ID `[Q-<session>-<n>]` where `<session>` is the current session number from the most recent log and `<n>` is the next available number for that session.

### close <id> <resolution>

Move the entry from `## Open` to `## Resolved` with resolution text and today's date.

### carry <id> <reason> <target-session>

Update the entry in `## Open` with new reason and target.

### queue <id> <reason>

Add a line to `docs/queue.md` with the entry text + an appropriate category tag (`decision`, `cleanup`, `process`, `convention`, etc.). Mark in ledger as resolved with disposition "queued <date>".

### drop <id> <reason>

Move to `## Resolved` with drop reason.

## Step 3 — Print summary

After any state change, print: `Ledger updated. Open: <N>. Resolved this run: <M>.`

---

**Anti-patterns to avoid:**

- Silently carrying any item. Disposition must be explicit.
- Modifying a session log to change its open-questions block. The log is immutable; the ledger is the working surface.
- Auto-resolving items from context. The user decides each disposition.
````

- [ ] **Step 3: Seed the ledger**

Create `docs/open-questions.md` with this content:

````markdown
# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

(none yet — ledger seeded 2026-05-16; will populate from session 0024 onward)

## Resolved

(historical open questions from sessions 0012-0022 are not retroactively migrated. They were either implicitly resolved by subsequent work, addressed in retrospectives, or are no longer relevant. Future ledger entries start with session 0024.)
````

- [ ] **Step 4: Verify structure**

```bash
ls .claude/skills/open-questions/
ls docs/open-questions.md
head -4 .claude/skills/open-questions/SKILL.md
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/open-questions/SKILL.md docs/open-questions.md
git commit -m "feat(skills): add /open-questions skill and seed ledger

New skill manages docs/open-questions.md. Forces explicit disposition
(close/carry/queue/drop) on each open question from session handoffs
— no silent carry. Closes the v2-retrospective gap where 0012's
<short-sha> question dragged 8 sessions because no closure mechanism
existed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Smoke-test `/open-questions`

- [ ] **Step 1: Test `list` on empty ledger**

Invoke `Skill(skill="open-questions", args="list")`.

Expected: prints "Ledger empty." (or shows the seed file's content).

- [ ] **Step 2: Test `scan` against the most recent session log**

Invoke `Skill(skill="open-questions", args="scan")`.

Expected: finds the most recent log (likely `0022-takahashi-reference-read.md`), extracts its open-questions block, prompts you to disposition each item.

Walk through the prompts but choose `skip-for-now` for each — we don't actually want to apply them yet (the seed comment says we start from 0024).

After the scan completes, verify `docs/open-questions.md` is unchanged.

- [ ] **Step 3: Test `add`**

Invoke `Skill(skill="open-questions", args='add Test entry — delete me')`.

Expected: adds an entry to `## Open` with some ID like `[Q-0022-1]`.

- [ ] **Step 4: Test `drop` on the test entry**

Use the ID assigned in Step 3:

`Skill(skill="open-questions", args="drop Q-0022-1 smoke test cleanup")`.

Expected: the entry moves from `## Open` to `## Resolved` with drop reason.

- [ ] **Step 5: Manually clean the ledger**

If the smoke-test entries are still visible, edit `docs/open-questions.md` and remove them — leave the seed-state content intact.

```bash
git diff docs/open-questions.md
```

Expected: no diff after cleanup.

- [ ] **Step 6: No commit** — smoke-test artifacts discarded.

---

### Task 10: Create `/retrospect` skill

**Files:**
- Create: `.claude/skills/retrospect/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/retrospect
```

- [ ] **Step 2: Write the SKILL.md file**

Create `.claude/skills/retrospect/SKILL.md` with this exact content:

````markdown
---
name: retrospect
description: Run the 4-pass phase-boundary retrospective. Produces -complete.md (what shipped) and -retrospective.md (how we worked) per the v2 pattern. Use when the user types /retrospect, "retrospect on v3", or "phase retrospective".
---

# Retrospect

Run the 4-pass retrospective ritual for a completed phase. Each pass pauses for the user's direction — this is the joint exercise pattern, not a strategist draft.

## Step 1 — Validate phase

The first argument is the phase (e.g., `v3`). If `docs/retrospectives/<phase>-complete.md` already exists, ask the user whether to overwrite. Otherwise proceed.

## Step 2 — Gather phase artifacts

Read these in parallel:

- Session logs whose number falls in the phase range (read `docs/roadmap.md` to determine the range — each phase has explicit session number boundaries)
- ADRs created during the phase (`docs/decisions/`)
- Queue items added/closed in the phase (`docs/queue.md` history via `git log -p docs/queue.md`)
- Audit findings in the phase (`docs/audits/`)
- `git log --oneline` for the phase range

Hold the artifacts in working memory. The user will not paraphrase — the read is from the repo directly.

## Step 3 — Pass 1: Ground

Produce a factual timeline and first-pass observations (observations, not conclusions). Save to `docs/retrospectives/<phase>-complete-draft.md`. Surface to the user.

Prompt:

> Pass 1 draft saved to `docs/retrospectives/<phase>-complete-draft.md`. Review the timeline and observations. Anything missed or mischaracterized? When ready, say "Pass 2" and we'll move on.

Wait for user response.

## Step 4 — Pass 2: Reframe

Per the v2 pattern: convert observations into decisions. Each decision has context, competing viewpoints, and (optionally) novel ideas to pilot.

Prompt:

> Pass 2 — for each observation from Pass 1, I'll propose a decision with viewpoints. Accept, redirect, or skip each.

Walk the observations one by one with the user. Record accepted decisions and pilots; mark rejected ones.

## Step 5 — Pass 3: Self-lens

Produce an honest assessment of the strategist's (this skill's, or the Cowork strategist's if applicable) performance in the phase. Where it over-weighted bookkeeping, where it offloaded synthesis, what habits showed.

Prompt:

> Pass 3 — here's my honest read of how I performed this phase:
>
> <draft assessment>
>
> Add to or push back on anything.

## Step 6 — Pass 4: Converge

Write both files:

- `docs/retrospectives/<phase>-complete.md` — what shipped (use v2-complete.md as the structural reference)
- `docs/retrospectives/<phase>-retrospective.md` — how we worked (use v2-retrospective.md as the structural reference)

Delete the Pass 1 draft.

## Step 7 — Suggest follow-ups

Print a list of follow-up actions the retrospective implies:
- Handoff doc updates (project-state.md, project-history.md, project-rationale.md)
- Queue additions
- Working agreement changes (CLAUDE.md, strategist-protocol.md)

Do not apply automatically. The user decides which to act on.

---

**Anti-patterns to avoid:**

- Producing a strategist-draft retrospective unilaterally. The 4-pass pause-and-direct between passes is the point — that's the v2 lesson.
- Compressing the 4 passes into one.
- Auto-applying follow-ups. The user decides.
- Starting before the phase is actually done.
````

- [ ] **Step 3: Verify structure**

```bash
ls .claude/skills/retrospect/
head -4 .claude/skills/retrospect/SKILL.md
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/retrospect/SKILL.md
git commit -m "feat(skills): add /retrospect skill

Codifies the 4-pass phase-boundary retrospective ritual from
v2-retrospective.md as a standing skill, so retrospectives happen
on cadence rather than only when Evan asks. Joint exercise pattern
preserved — each pass pauses for direction.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Smoke-test `/retrospect`

Full smoke test requires a completed phase; v3 is in flight, so we can only verify the refuse-cleanly path.

- [ ] **Step 1: Invoke against v3 (in flight)**

```
Skill(skill="retrospect", args="v3")
```

Expected: the skill reads roadmap.md, finds v3 has incomplete sessions, and either:
- Refuses (preferred) with a clear "v3 not done — completed sessions <N>, planned <M>" message
- Or proceeds (and we abort immediately)

Either is acceptable for smoke purposes; the gathering logic is what we're verifying.

- [ ] **Step 2: If a draft was created, delete it**

```bash
test -f docs/retrospectives/v3-complete-draft.md && rm docs/retrospectives/v3-complete-draft.md
```

- [ ] **Step 3: No commit** — smoke artifacts discarded.

---

### Task 12: Create `/strategist` skill

**Files:**
- Create: `.claude/skills/strategist/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/strategist
```

- [ ] **Step 2: Write the SKILL.md file**

Create `.claude/skills/strategist/SKILL.md` with this exact content:

````markdown
---
name: strategist
description: Switch Claude Code into strategist persona — load orientation docs, detect drift, draft session prompts in the lean template, engage in planning conversation. Use when the user types /strategist, asks to "plan the next session", "draft a prompt", or "what's next".
---

# Strategist

Switch into strategist mode. Load orientation docs, then either draft an artifact (if a task was provided) or enter planning conversation.

## Step 1 — Load orientation

Read these in order (use parallel Read calls):

1. `docs/project-state.md`
2. `docs/strategist-protocol.md`
3. `docs/queue.md`
4. `docs/roadmap.md`
5. The most recent file in `docs/retrospectives/`
6. The last 2-3 session logs in `docs/sessions/` (sorted by filename)

## Step 2 — Check for outside-chat drift

```bash
git log --oneline -20
git status --short
```

If commits landed since the most recent session log's expected HEAD, note them. If main has uncommitted changes, ask before proceeding.

## Step 3 — Print orientation summary

Print one short paragraph:

```
Loaded. Current phase: <X>. Last session: <NNNN>. Open queue items: <N>. Drift since last session log: <yes/no, brief>. Most recent retrospective: <filename>.
```

## Step 4 — Branch on input

**If a task was passed** (e.g., `/strategist draft session 0024 prompt for recut improvements`), execute it. The most common task is drafting a session prompt — see Step 5.

**If no task**, enter planning conversation. Greet the user and ask what they want to plan. Apply these working agreements:

- **Recommendation-first**, not options. Lead with what you'd do and why.
- **Mark uncertainty** explicitly when present.
- **Use AskUserQuestion** only for genuine either/or forks where the user's input changes the outcome — never as a shortcut to avoid synthesis.

## Step 5 — Drafting a session prompt

Use the lean template below. `/begin-session` and `/wrap-session` handle ceremony — do NOT include worktree boilerplate, prompt-copy instructions, `pnpm install`, or handoff-block templates in the drafted prompt.

````markdown
# Session NNNN — <Title>

## Goal

<1-3 sentences. What ships.>

## Context

<Only what is NOT in project-state.md or the prior session log. Link, do not recap. Cite filenames.>

## Tasks

<Numbered list. No worktree boilerplate. No "produce implementation report" step — standing protocol now.>

## Specs

<Behavior specs, not code. Per the existing pattern from 0014-0018.>

## Appendix (verbatim content only)

<ADR drafts, document content where wording IS the deliverable. Omit if not needed.>
````

Save to `docs/sessions/prompts/<descriptor>.md`. After saving, offer:

> Prompt drafted at `docs/sessions/prompts/<filename>`. Run `/red-team-prompt` against it before handing off?

## Step 6 — Common forks: apply working agreements

When making a call, apply CLAUDE.md and project-state.md guidance. Specifically:

- **Naive before optimized** for any algorithmic choice in v1-v3.
- **ADR for decisions with real alternatives and consequences**; session-log note for naive-first within-stage choices.
- **No predicted test counts.** Ever.
- **Specs describe intent, not call signatures.**
- **Doc-fetch-and-probe before assuming any library API.**

---

**Anti-patterns to avoid:**

- Restating context from `project-state.md` verbatim in the drafted prompt. Link instead.
- Offering forks where a recommendation was possible (v2 lesson).
- Predicting test counts (v1 lesson, repeated in v2).
- Dictating library call signatures (v1 lesson).
- Skipping the orientation load because "it's a quick question." The load is the cheap part.
- Including worktree creation, `pnpm install`, or handoff-block template in the drafted prompt. `/begin-session` and `/wrap-session` own that ceremony.
````

- [ ] **Step 3: Verify structure**

```bash
ls .claude/skills/strategist/
head -4 .claude/skills/strategist/SKILL.md
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/strategist/SKILL.md
git commit -m "feat(skills): add /strategist skill

Switch Claude Code into strategist persona. Loads 8-doc orientation,
runs git log -20 for drift, then either drafts a session prompt
using the lean template or enters planning conversation. Replaces
the Cowork strategist's per-session ritual.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Smoke-test `/strategist`

- [ ] **Step 1: Invoke without task**

```
Skill(skill="strategist")
```

Expected:
- Reads project-state, strategist-protocol, queue, roadmap, latest retrospective, last 2-3 session logs (8+ files)
- Runs `git log --oneline -20` and `git status --short`
- Prints the orientation summary paragraph
- Greets and asks what to plan

- [ ] **Step 2: Invoke with a drafting task**

```
Skill(skill="strategist", args="draft a session 0099 prompt for testing skill drafting — throwaway")
```

Expected:
- Drafts a prompt using the lean template (Goal / Context / Tasks / Specs / Appendix)
- No worktree boilerplate in the draft
- No handoff-block template in the draft
- Saves to `docs/sessions/prompts/0099-testing-skill-drafting.md` (or similar)
- Offers to run `/red-team-prompt`

- [ ] **Step 3: Verify the draft uses the lean template**

```bash
wc -l docs/sessions/prompts/0099-*.md
```

Expected: significantly shorter than the v2 prompts (target: 60-120 lines vs the v2 average of 400-600).

- [ ] **Step 4: Inspect content**

Read the draft. Verify:
- No "Pre-work consistency scan" section
- No "How this prompt works" section
- No worktree creation tasks
- No handoff-block template at the end
- Goal / Context / Tasks / Specs structure clean

- [ ] **Step 5: Delete the test draft**

```bash
rm docs/sessions/prompts/0099-*.md
```

- [ ] **Step 6: No commit** — smoke-test artifacts discarded.

---

### Task 14: Update CLAUDE.md — section 6 (new skills)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read current section 6**

Use the Read tool on `CLAUDE.md` to find the exact text of section 6 (Development workflow). Note its current structure.

- [ ] **Step 2: Add a new subsection after the existing bullets**

Append this block at the end of section 6 (after the existing bullets):

```markdown

### Strategist skills (the operative subset)

The repo carries a set of skills that codify the strategist's ceremony.
Use them instead of pasting the ritual into prompts or running it by
hand.

| Skill | Purpose |
|---|---|
| `/begin-session <branch>` | Worktree + prompt-copy + `pnpm install` + queue scan. Replaces Tasks 1-2 of the old prompt template. |
| `/wrap-session` | Verify → commit → push → PR → CI → squash-merge. ADR 0006's PR flow. |
| `/strategist [task]` | Load 8-doc orientation, detect drift, draft session prompts in the lean template, or enter planning conversation. |
| `/red-team-prompt <path>` | Dispatch a no-context subagent to stress-test a drafted prompt before handoff. |
| `/open-questions [subcmd]` | Manage `docs/open-questions.md`. Force explicit disposition on each handoff open-question; no silent carry. |
| `/retrospect <phase>` | Run the 4-pass phase-boundary retrospective; produce `-complete.md` + `-retrospective.md`. |

The lean prompt template (Goal / Context / Tasks / Specs / Appendix)
replaces the old worktree-boilerplate prompt format. `/strategist` uses
the lean template by default.
```

- [ ] **Step 3: Verify the addition**

```bash
grep -A 2 "Strategist skills" CLAUDE.md
```

Expected: shows the new subsection.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude-md): document strategist skills in section 6

List the 6 strategist skills (5 new + updated /wrap-session) with
one-line purposes, plus the lean prompt template that replaces the
old worktree-boilerplate format.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Update `docs/strategist-protocol.md` — remove preflight checklist, add skill references

**Files:**
- Modify: `docs/strategist-protocol.md`

- [ ] **Step 1: Read the current protocol document**

Read `docs/strategist-protocol.md` end-to-end. Locate:
- The "Prompt preflight checklist" section (lines 82-111 per Task 1's inspection)
- The "When this doc is consulted" section

- [ ] **Step 2: Remove the preflight checklist section**

Delete the entire "## Prompt preflight checklist" section and all its bullets. The checklist is now embedded in `/red-team-prompt`'s subagent prompt; the protocol document should no longer carry a duplicate.

- [ ] **Step 3: Add a new section pointing to the skills**

After the "When this doc is consulted" section, add:

```markdown

## Skills that codify this protocol

The following skills implement parts of this protocol. Use them rather
than performing the ritual by hand:

- `/begin-session` — bootstrap worktree per ADR 0006
- `/wrap-session` — verify → commit → PR → squash-merge
- `/strategist` — orientation load + lean-template prompt drafting
- `/red-team-prompt` — stress-test a drafted prompt (owns the preflight checklist)
- `/open-questions` — manage the open-questions ledger
- `/retrospect` — 4-pass phase-boundary retrospective

See `CLAUDE.md` section 6 for the operative subset.
```

- [ ] **Step 4: Verify the result is coherent**

Read the updated `docs/strategist-protocol.md` end-to-end. Confirm:
- No preflight checklist content remains (the skill owns it now)
- No dangling references to the deleted section from other parts of the document
- The new "Skills that codify" section reads naturally

- [ ] **Step 5: Commit**

```bash
git add docs/strategist-protocol.md
git commit -m "docs(protocol): remove preflight checklist, add skill references

The preflight checklist now lives inside /red-team-prompt's subagent
prompt where it is actually applied. Carrying a duplicate copy in the
protocol document creates drift risk. Add a section pointing readers
to the codified skills.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Final verification and PR

- [ ] **Step 1: Verify clean state**

```bash
git status --short
git log --oneline -10
```

Expected: clean working tree; recent commits show the 6 commits made through this session.

- [ ] **Step 2: Run project verification commands**

```bash
pnpm type-check
pnpm test:run
```

Expected: both clean. (No source code was changed — these should pass trivially. If they don't, something is wrong.)

- [ ] **Step 3: Verify all new skill files exist with correct frontmatter**

```bash
for d in begin-session red-team-prompt strategist retrospect open-questions wrap-session; do
  echo "=== $d ==="
  head -4 .claude/skills/$d/SKILL.md
done
```

Expected: each skill shows `name:` and `description:` in frontmatter.

- [ ] **Step 4: Write the session log**

Create `docs/sessions/<NNNN>-strategist-skills.md` (use the session number assigned to this work). Follow the existing session-log format — read 0021 or 0022 as templates. End with the handoff block per `docs/strategist-protocol.md`.

The handoff block "Open questions for the strategist" should record any that came up during the build (e.g., specific behaviors that need first-real-use validation).

- [ ] **Step 5: Commit the session log**

The design spec and implementation plan landed as a separate maintenance commit on main before this session started — do NOT re-add them here.

```bash
git add docs/sessions/<NNNN>-strategist-skills.md
git commit -m "docs(session NNNN): strategist skills session log

Session log for the strategist-skills implementation. The design
spec (docs/superpowers/specs/2026-05-16-strategist-skills-design.md)
and implementation plan (docs/superpowers/plans/2026-05-16-strategist-skills.md)
landed via maintenance commit before this session.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Push the branch**

```bash
git push -u origin session/<NNNN>-strategist-skills
```

- [ ] **Step 7: Open the PR**

Use the PR title format and body from `.github/PULL_REQUEST_TEMPLATE.md` if it exists, or:

```bash
gh pr create --title "feat: strategist skills — codify protocol ceremony" --body "$(cat <<'EOF'
## Summary

- Five new skills: /begin-session, /red-team-prompt, /strategist, /retrospect, /open-questions
- /wrap-session updated for ADR 0006 PR flow
- docs/open-questions.md ledger seeded
- CLAUDE.md section 6 + strategist-protocol.md updated

Implements the design in `docs/superpowers/specs/2026-05-16-strategist-skills-design.md` per the workflow critique conversation.

## Test plan

- [ ] Each skill smoke-tested per the implementation plan
- [ ] Type-check + test suite pass (no source changes)
- [ ] First real use will be the next numbered session — that's the load-bearing validation

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 8: Watch CI and merge**

```bash
gh pr checks --watch
```

When green:

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 9: Local cleanup**

```bash
git checkout main
git pull origin main
git worktree remove ../session/<NNNN>-strategist-skills
git branch -d session/<NNNN>-strategist-skills
```

Session complete.

---

## Self-review notes

**Spec coverage:** Every section of the spec maps to one or more tasks:
- Architecture → enforced by file structure choice (independent skills)
- Each of 6 skills → its own task pair (build + smoke)
- File layout → covered in Task 1 verification and per-skill tasks
- Documentation updates → Tasks 14, 15
- Testing approach → smoke tests in odd-numbered tasks
- Open questions in spec → not implemented now (correctly); deferred per spec

**Placeholder scan:** No "TBD"/"TODO"/"implement later" patterns. Branch name `session/<NNNN>-strategist-skills` uses `<NNNN>` as a literal placeholder for the session number — this is correct because the user picks the number at session-start time, and the placeholder appears in only a handful of places.

**Type consistency:** All skill names use the kebab-case convention (`begin-session`, not `beginSession`). All subcommand names consistent across the `/open-questions` task and skill content.

**One unavoidable bootstrap issue:** This session runs *before* `/begin-session` and the updated `/wrap-session` exist, so the user creates the worktree and runs the PR flow manually. This is called out in the plan header.
