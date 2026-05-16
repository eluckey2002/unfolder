---
name: begin-session
description: Set up the worktree and starting state for a numbered session, spike, or maintenance commit per ADR 0006. Use when the user types /begin-session or starts a new session from main.
---

# Begin-session

Bootstrap a new worktree per ADR 0006. You are operating from inside the main checkout; walk the steps in order — do not skip.

## Step 1 — Validate branch name and derive paths

The first argument is the branch name. It MUST match `^(session|maint|spike)/[a-z0-9-]+$`. Examples:
- `session/0024-recut-improvements`
- `spike/0023-takahashi-mst`
- `maint/clean-references-readme`

If invalid, stop and surface to the user. Do not auto-correct.

**Convention:** the worktree directory replaces `/` with `+` in the branch name. So branch `session/0024-foo` becomes worktree directory `.claude/worktrees/session+0024-foo`. Derive these for use in later steps (substitute the actual values, since `cd` and shell variables do not persist between Bash calls):

- `BRANCH` = the branch name (e.g. `session/0024-foo`)
- `WORKTREE_DIR` = `.claude/worktrees/` + the branch with `/` replaced by `+` (e.g. `.claude/worktrees/session+0024-foo`)

## Step 2 — Confirm you are in the main checkout

```bash
pwd
git worktree list | head -1
```

The first entry of `git worktree list` is always the main checkout. The current `pwd` must match that path. If they differ, stop — the user invoked from a worktree, not main.

## Step 3 — Confirm main is clean and in sync with origin

```bash
git fetch origin main
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

Working tree must be clean (no output from `git status --short`). Local `HEAD` must equal `origin/main` (no divergence). If either fails, stop and surface — do not bootstrap a session on stale or dirty main.

If `git fetch` itself fails (no network, no remote), stop.

Note the HEAD SHA — it'll be useful for the session log later.

## Step 4 — Prune stale worktrees

```bash
git worktree prune
```

Per CLAUDE.md section 5: merged session branches are auto-deleted on the remote; the local worktree admin still needs pruning.

## Step 5 — Create the worktree

Substitute the derived `WORKTREE_DIR` and `BRANCH` from Step 1 into a single Bash call (shell variables do not persist between calls):

```bash
git worktree add .claude/worktrees/<type>+<descriptor> -b <type>/<descriptor> main
```

For example, branch `session/0024-foo` → `git worktree add .claude/worktrees/session+0024-foo -b session/0024-foo main`.

If the branch already exists locally or on origin, the command fails. Stop and surface — the user should pick a fresh name.

## Step 6 — Locate the authoritative prompt file (session/spike only)

Parse the branch name to find the prompt file path:
- `session/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
- `spike/<NNNN>-<descriptor>` → `docs/sessions/prompts/<NNNN>-<descriptor>.md`
- `maint/<descriptor>` → `docs/sessions/prompts/<descriptor>.md` (maintenance commits with no prompt file are out of scope for this skill — invoke only when a prompt file exists)

Verify the file exists in the current (main) checkout:

```bash
ls docs/sessions/prompts/<prompt-filename>
```

If missing, stop — do not silently reconstruct it (v1 lesson).

## Step 7 — Copy the prompt file into the worktree

Source is the file in the current main checkout; destination is the same relative path inside the worktree. Use the worktree path from Step 1:

```bash
cp docs/sessions/prompts/<prompt-filename> .claude/worktrees/<type>+<descriptor>/docs/sessions/prompts/<prompt-filename>
```

The worktree's copy is what commits with the session; at fast-forward time `diff -q` between the main and worktree copies should show byte-identical.

## Step 8 — Install dependencies in the worktree

In Claude Code each Bash call is a fresh shell — `cd` does not persist between calls. Use `pnpm`'s explicit directory flag:

```bash
pnpm install --dir .claude/worktrees/<type>+<descriptor>
```

Fresh worktrees lack `node_modules`. Stop if `pnpm install` fails.

## Step 9 — Scan the queue for scope intersections

Read `docs/queue.md` (in the main checkout — the worktree's copy is identical at this moment). Read the prompt's Goal section. Surface any queue items that intersect the session's scope — even tangentially. Better to over-flag than under-flag.

## Step 10 — Print the starting state report

Output to the user:

```
Worktree:    .claude/worktrees/<type>+<descriptor>
Branch:      <type>/<descriptor>
Main HEAD:   <SHA from Step 3>
Prompt:      docs/sessions/prompts/<filename>
Queue items: <count>; <list scope-intersecting ones>
```

The session is ready to start. Subsequent commands the user runs should reference the worktree path explicitly, since the user is still operating from the main checkout's working directory.

---

**Anti-patterns to avoid:**

- Auto-generating branch names. ADR 0006 mandates explicit naming.
- Skipping `pnpm install` because "it'll probably work." Fresh worktrees lack `node_modules`.
- Silently reconstructing a missing prompt file. The v1 lossy-reconstruction lesson stands.
- Running on a dirty main, or on a local main that has diverged from origin. Stop and let the user clean up first.
- Invoking from inside an existing worktree. This skill bootstraps a new session from main — running it from inside another session's worktree is a sign of stale state. Check `pwd` + `git branch --show-current`.
- Using `cd` between bash blocks expecting it to persist. Each Bash call is a fresh shell; substitute the worktree path explicitly into every command.
