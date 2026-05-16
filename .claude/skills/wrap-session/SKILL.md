---
name: wrap-session
description: Formalize the verify → commit → PR → squash-merge ritual that ends a numbered session or maintenance commit. Use when the user types /wrap-session or asks to "wrap up", "ship", "merge to main", or "finish the session".
---

# Wrap-session

You are wrapping a worktree session. Walk the steps below in order. Do not skip
ahead. Do not re-run a verification command already executed this session —
trust the prior result and reuse it.

## Step 1 — Confirm location

```bash
pwd && git branch --show-current && git worktree list
```

Confirm cwd matches expectations. Two valid paths:

**Worktree path (default for session/spike):** cwd is a worktree, branch matches `^(session|maint|spike)/[a-z0-9-]+$`. Proceed through all steps.

**Direct-to-main path (legal for maint per protocol, though branch protection may require a PR — owner can bypass):** cwd is main, branch is `main`. Skip steps 6, 7, and 8 (no PR, no fast-forward, no worktree cleanup); commit goes straight to main.

If cwd doesn't match either pattern, stop and surface.

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
ends with the **handoff status block** per `docs/strategist-protocol.md`.

If this is a maintenance commit, no session log; just a descriptive prompt
file in `docs/sessions/prompts/` without a numeric prefix.

## Step 5 — Commit

Conventional Commits style. Use a HEREDOC for the message body. Stage files
explicitly by name (not `git add -A`) to avoid grabbing stray files. Include
the prompt file and session log in the commit.

## Step 6 — Push the branch (session/spike only)

```bash
git push -u origin <branch>
```

Maintenance commits direct-to-main: `git push origin main` and skip to Step 9.

## Step 7 — Open a PR (session/spike only)

The repository has a `.github/PULL_REQUEST_TEMPLATE.md`; use its structure for the body. If for some reason it's missing, fall back to a minimal Summary / Test plan body.

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

Watch CI:

```bash
gh pr checks --watch
```

When CI is green and any review comments have been addressed:

```bash
gh pr merge --squash --delete-branch
```

If the PR has unresolved review comments, surface them to the user — do not auto-merge.

## Step 8 — Worktree cleanup (requires explicit confirmation)

`gh pr merge --delete-branch` already removes the remote branch. Local cleanup remains.

**Never delete the worktree silently.** Ask the user:

> Branch `<branch>` merged via PR. Delete the local worktree at `<path>` and the local branch? (Y/n)

Only on explicit "yes" run:

```bash
git worktree remove <path>
git branch -d <branch>
```

For maintenance commits direct-to-main: no worktree to clean up; skip.

## Step 9 — Update Cowork artifact (deprecated path)

**DEPRECATED.** With the strategist skills (`/strategist`, `/retrospect`, etc.) in place, the Cowork strategist is no longer the per-session source of truth, and the `unfolder-roadmap` Cowork artifact is no longer load-bearing.

If an active Cowork session is in flight, surface the diff (queue, recent commits, HEAD) to the user for relay. Otherwise, skip this step.

---

**Anti-patterns to avoid:**

- Re-running `pnpm test:run` immediately after a green run earlier in the same
  session. Reuse the result.
- Auto-deleting the branch without confirmation.
- Using `git add -A` or `git add .` (can pull in `.DS_Store`, prompt
  fragments, or stale files).
- Amending commits after pushing; force-push is disruptive to PR CI runs.
