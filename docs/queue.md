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
`cleanup`, `process`). Add new tags as needed.

## Process

- The strategist adds items when a session surfaces a deferral, in the
  moment, and calls it out in chat — no silent additions.
- The strategist reads this file at the start of every session and
  surfaces anything that intersects scope.
- When items naturally cluster, the strategist proposes a small
  housekeeping commit to clear them. Likely every 3–5 implementation
  sessions, or sooner if items accumulate.
- Items unaddressed for ~5 sessions get re-evaluated. Schedule or drop;
  no indefinite limbo.
- When a session resolves an item, the session deletes the line here
  and the session log records what closed. Housekeeping commits clear
  items the same way.

## Open items

- [cleanup] Add two `parseStl` negative-path tests: non-finite coordinate
  (e.g. `vertex NaN 0 0`) and mid-triangle truncation (file ends after 1
  or 2 vertex lines). Both error paths are documented in
  `src/core/parse-stl.ts:11-13` but currently uncovered by tests.
  Surfaced during test-suite review.
- [test] Add a property test for `dihedral.ts`: weights land in
  `[0, π]` and the stage is deterministic. `src/core/dihedral.ts` has
  no property test. Surfaced by the 2026-05-14 codebase assessment
  (finding A5).
- [cleanup] `scripts/baseline-pipeline.ts` runs `paginate` inside the
  `recut` try-block, so a `paginate` throw is mislabelled "failed at
  recut". Give `paginate` its own try-block or relabel. Surfaced by
  session 0018.
