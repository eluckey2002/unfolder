# Session 0004 finalize — fix two stale references, amend, merge to main

## Goal

Fix two stale session-number references in `docs/project-state.md` that
slipped through the Session 0004 renumbering, amend commit `008917c` to
fold the fixes in, then fast-forward `main` to the amended commit.

## Context

After Session 0004 shifted the "Sessions planned" list (4–10 became
4–11, with mesh generation moving from Session 5 to Session 6), two
references elsewhere in `project-state.md` were left pointing at the
old numbering. Same pre-merge-amendment pattern as Session 0003:
`project-state.md` is a living document, so even post-merge edits would
be fine here, but fixing before merge keeps `main`'s history clean.

## Tasks

1. **Edit `docs/project-state.md` line 103.** Currently reads:

   ```
   - Test corpus is currently empty. Will be populated in Session 5.
   ```

   Change `Session 5` to `Session 6`. No other edits to that line.

2. **Edit `docs/project-state.md` line 111.** Currently reads:

   ```
   - `docs/decisions/` — ADRs (currently none yet; first one comes in Session 3)
   ```

   Change the parenthetical to reflect actual state. Replace with:

   ```
   - `docs/decisions/` — ADRs (ADR 0001 captures the v1 pipeline architecture)
   ```

3. **Scan `docs/project-state.md`** for any other session-number
   references that may have gone stale after the renumbering. Search
   for `Session ` followed by a digit. Expected matches:
   - Lines 19–20: Session 0001 and 0002 (completed sessions, no change
     needed).
   - Lines 26–39: the Sessions planned list (already correct after
     Session 0004).
   - Line 103: fixed in Task 1.
   - Line 111: fixed in Task 2.
   - Any others — report them but do not edit without explicit
     instruction.

4. **Amend the previous commit** so the fixes fold into Session 0004's
   commit, preserving the commit message:

   ```
   git commit --amend --no-edit
   ```

5. **From the main checkout at `/Users/eluckey/Developer/origami`**,
   fast-forward `main` to the amended commit:

   ```
   git merge --ff-only claude/<your-worktree-branch>
   ```

   (Use whichever branch name the worktree is on. The strategist
   doesn't know the branch name in advance — `git branch --show-current`
   from within the worktree before switching to main will give it.)

6. **Verify** with `git log --oneline -5` from `main`. The top commit
   should be the amended Session 0004 commit; below it should be
   `3bf155f`, `45f778c`, `bda358d`, `a3b371f`, `c90e770`.

7. **Report the final `main` HEAD hash back.**

## Notes

- Do not touch `docs/queue.md` or `docs/sessions/0004-queue-and-working-
  agreements.md`. They're correct as committed.
- Do not commit the untracked `docs/sessions/prompts/` files in this
  session.
- If a stale reference scan in Task 3 finds anything not listed,
  surface it in your report instead of editing. The strategist will
  decide whether to fix in this session or queue for later.
