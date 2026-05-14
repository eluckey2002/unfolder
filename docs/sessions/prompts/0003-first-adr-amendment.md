# Session 0003 amendment — fix session-range typo in ADR 0001

## Goal

Correct a factual inconsistency in ADR 0001 that you caught when writing
it. The ADR's Context section says "Sessions 4–10 build out that
pipeline end-to-end," but the Consequences section correctly says
"Sessions 6–10." Per `docs/project-state.md`, Sessions 4 and 5 are build
bootstrap and test-fixture generation, not pipeline stages — Sessions
6–10 are the pipeline.

The current commit (`0ddf694`) is in this worktree branch, not yet
merged to `main`. We treat pre-merge ADR commits as drafts, not as
immutable artifacts — so amending the commit here is in-bounds. (The
strict immutability rule kicks in once an ADR lands in `main`.)

## Tasks

1. In `docs/decisions/0001-v1-pipeline-architecture.md`, on the line that
   currently reads:

   ```
   detection, no UI. Sessions 4–10 build out that pipeline end-to-end.
   ```

   change `Sessions 4–10` to `Sessions 6–10`. No other edits to the ADR.

2. Amend the previous commit (`git commit --amend --no-edit`) so the
   correction folds into the original `docs: add ADR 0001 ...` commit.
   The commit message stays the same.

3. Report the new commit hash back.

## Notes

- Do not modify the session log (`docs/sessions/0003-first-adr.md`). The
  session log already correctly records what was decided and what
  shipped; the typo correction doesn't change any of that.
- If you find any other factual inconsistencies in the ADR text while
  you're in there, flag them in your report — do not fix them in this
  amendment.
- The dash character in `6–10` is an en-dash (U+2013), matching the
  existing style elsewhere in the document. Do not substitute a hyphen.
