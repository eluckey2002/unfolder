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
