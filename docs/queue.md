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
- [decision] U4 — Pathfinder proposes a single `runPipeline()`
  orchestrator, reversing the inline-pipeline-per-call-site the
  2026-05-14 audit called intentional per ADR 0001. Needs a
  decisions-log entry or ADR before it can become a prompt — not
  maintenance-eligible. Surfaced by Pathfinder 2026-05-15.
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
- [research] `detectOverlapsTolerant(layout, areaEps)` —
  tolerance-aware overlap detector that lets integration tests
  assert strict overlap-free for Variant C cut-removal output.
  Current `detectOverlaps` was hardened in 0025 with a try/catch
  because `polygon-clipping.intersection` throws on near-coincident
  shared edges in Variant C output; integration verification was
  routed through the curvature post-condition (tolerance-free)
  instead. A tolerant variant would let polygon-clipping verification
  return as a strict assertion. Worth a small spike or maint commit;
  not blocking v3. Surfaced 0025.
- [cleanup] Wipe `.history/` directory contents — VS Code Local
  History accumulation. `.history/` is gitignored (added in pre-0025
  housekeeping) but the existing contents weren't cleaned. Trivial
  maint, no behavior change. Surfaced 0025.
- [docs] Prune `project-state.md` Sessions-completed list (now stale
  from session 0020 onward — 0025 was the 6th session in a row with
  "no change" to project-state); merge "Current phase" with roadmap's
  "Where we are now". The `[pilot]` live-state-artifact above is the
  proper long-term fix; this is a manual prune to stop the visible
  drift in the meantime. Surfaced by 0025 review.
