# Queue

This file tracks deferred items the strategist actively manages between
sessions: small documentation updates, convention decisions awaiting a
natural moment, discovered issues that don't justify their own session
yet, and follow-up edits queued during work on something else.

This file is for *tactical* follow-ups. *Strategic* unknowns (final
project name, GitHub remote visibility, license commitment) live in
`project-state.md`'s "Open questions / things in flight" section.

## Format

Each item is one or two lines:

```
- [category-tag] One-line description. Surfaced NNNN.
```

Category tags are free-form (current ones: `convention`, `docs`,
`cleanup`). Add new tags as needed.

## Process

- The strategist adds items when a session surfaces a deferral, in the
  moment, and calls it out in chat — no silent additions.
- The strategist reads this file at the start of every session and
  surfaces anything that intersects scope.
- When items naturally cluster, the strategist proposes a small
  housekeeping session to clear them. Likely every 3–5 implementation
  sessions, or sooner if items accumulate.
- Items unaddressed for ~5 sessions get re-evaluated. Schedule or drop;
  no indefinite limbo.
- When a session resolves an item, the session deletes the line here
  and the session log records what closed.

## Open items

- [convention] Decide commit cadence for strategist prompt files at
  `docs/sessions/prompts/`. Currently untracked. Surfaced 0003.
- [docs] Update `docs/decisions/README.md` to scope ADR immutability to
  "once merged to `main`"; add a sentence noting pre-merge drafts can
  be amended. Surfaced 0003.
- [cleanup] Backfill Session 0001 and 0002 session-log files in `main`.
  They exist in worktrees but never landed. Surfaced 0003.
- [process] Restructuring prompts should include a consistency-scan
  step for cross-references (catches stale session numbers, file
  paths, etc.). Surfaced 0004.
- [process] Before writing config-heavy prompts involving external
  libraries, fetch current docs and verify the patterns are still
  canonical. Surfaced 0005.
