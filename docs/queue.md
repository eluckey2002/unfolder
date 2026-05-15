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

- [pilot] v3 experiment — a live state artifact that maintains itself
  from git, queue, and test state instead of a hand-synced roadmap
  doc. Try once in v3. Surfaced by the v2 retrospective.
- [pilot] v3 experiment — a one-off role inversion: Evan drafts a
  session prompt and the strategist reviews it, to calibrate whether
  the strategist's prompt-craft adds value or just a layer. Try once
  in v3. Surfaced by the v2 retrospective.
- [cleanup] U1 — extract the duplicated canonical pair-key helper
  (`adjacency.ts`, `flatten.ts`, `tabs.ts`) to `src/core/pair-key.ts`.
  No behavior change; triplication verified. Intended as the first
  PR-flow dogfood after session 0020. Surfaced by the Pathfinder
  2026-05-15 consolidation analysis.
- [cleanup] U2 — extract the union-find factory (duplicated in
  `spanning-tree.ts` and `recut.ts`'s `connectedComponents`) to
  `src/core/union-find.ts`; relieves a recut.ts complexity hotspot
  the 2026-05-14 audit flagged. Surfaced by Pathfinder 2026-05-15.
- [cleanup] U3 — extract the shared vertex-interner closure
  (`parse-stl.ts`, `parse-obj.ts`) to `src/core/intern-vertex.ts`;
  the two parsers stay separate. Surfaced by Pathfinder 2026-05-15.
- [decision] U4 — Pathfinder proposes a single `runPipeline()`
  orchestrator, reversing the inline-pipeline-per-call-site the
  2026-05-14 audit called intentional per ADR 0001. Needs a
  decisions-log entry or ADR before it can become a prompt — not
  maintenance-eligible. Surfaced by Pathfinder 2026-05-15.
