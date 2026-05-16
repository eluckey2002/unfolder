# Queue

This file tracks deferred items the strategist actively manages between
sessions: small documentation updates, convention decisions awaiting a
natural moment, discovered issues that don't justify their own session
yet, and follow-up edits queued during work on something else.

This file is for _tactical_ follow-ups. _Strategic_ unknowns (final
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

- [pilot] v3 experiment — a live state artifact that maintains itself
  from git, queue, and test state instead of a hand-synced roadmap
  doc. Try once in v3. Surfaced by the v2 retrospective.
- [research] Force-directed unfolding spike — simulate faces as
  2D rigid bodies connected by hinges, with repulsive force
  between non-adjacent faces; cuts emerge where hinges over-strain.
  Continuous relaxation of the discrete cut-selection problem.
  Strong v4-UX fit (parameters have direct physical meaning —
  repulsion strength, hinge stiffness — and a user can watch the
  simulation think). Not in the standard shipping-tool menu;
  energy-based methods exist in the broader unfolding literature.
  Hard parts: rigid unfolding's geometric constraints, local
  minima, discretization at the end, computational cost. Explore
  as own spike if 0023's three approaches under-deliver on the
  hard concave cases. Surfaced 2026-05-15.
