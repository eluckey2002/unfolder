---
name: wrap-session
description: Formalize the verify → commit → rebase → fast-forward ritual that ends a numbered session or maintenance commit. Use when the user types /wrap-session or asks to "wrap up", "ship", "merge to main", or "finish the session".
---

# Wrap-session

You are wrapping a worktree session. Walk the steps below in order. Do not skip
ahead. Do not re-run a verification command already executed this session —
trust the prior result and reuse it.

## Step 1 — Confirm location

```bash
pwd && git branch --show-current && git worktree list
```

Confirm cwd is the worktree (not the main checkout) and the branch matches the
expected `claude/<random>` pattern. If you're in main, stop and ask the user
whether this is a maintenance commit (no rebase step) or a misconfigured
session.

## Step 2 — Confirm the working tree is staged-clean for review

```bash
git status --short
```

Surface anything unexpected to the user before continuing. **Untracked files
that should be tracked are easy to miss** (the report's "orphaned prompt files"
friction); confirm prompt files and session logs are staged.

## Step 3 — Verify

If `pnpm test:run` has not already been run this session against the current
state, run it. If type-checking matters for the change (any `.ts`/`.tsx` edit),
run `pnpm type-check`. Both must pass.

For UI/CSS changes: verify by screenshot of the running app, not by injecting
CSS into a synthetic probe.

## Step 4 — Session log

If this is a numbered session, ensure `docs/sessions/NNNN-*.md` exists and
ends with the **handoff status block** (see `docs/strategist-protocol.md` once
WI-4 lands — until then, follow the existing session-log format).

If this is a maintenance commit, no session log; just a descriptive prompt
file in `docs/sessions/prompts/` without a numeric prefix.

## Step 5 — Commit

Conventional Commits style. Use a HEREDOC for the message body. Stage files
explicitly by name (not `git add -A`) to avoid grabbing stray files. Include
the prompt file and session log in the commit.

## Step 6 — Rebase onto main

```bash
git fetch origin main 2>/dev/null || true
git rebase main
```

If conflicts arise, resolve them — **do not** discard the worktree's changes.
If you cannot resolve cleanly, stop and surface to the user.

## Step 7 — Fast-forward main

Switch to main and fast-forward:

```bash
git checkout main
git merge --ff-only <branch>
```

If FF is rejected, stop — main has moved and you need to rebase again.

## Step 8 — Worktree cleanup (requires explicit confirmation)

**Never delete the worktree branch silently.** Ask the user:

> Branch `<branch>` merged to main. Delete the worktree at `<path>` and remove
> the branch? (Y/n)

Only on explicit "yes" run:

```bash
git worktree remove <path>
git branch -d <branch>
```

## Step 9 — Update Cowork artifact (if applicable)

Per the working agreement: the strategist updates the `unfolder-roadmap`
Cowork artifact at session-end and after maintenance commits that materially
change displayed state. Surface the diff (queue, recent commits, HEAD) to the
user for them to relay.

---

**Anti-patterns to avoid:**

- Re-running `pnpm test:run` immediately after a green run earlier in the same
  session. Reuse the result.
- Auto-deleting the branch without confirmation.
- Using `git add -A` or `git add .` (can pull in `.DS_Store`, prompt
  fragments, or stale files).
- Squash-merging or amending commits at this step. Each commit is a draft only
  until merged; the rebase + FF preserves the worktree's commit history.
