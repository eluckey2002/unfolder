# Session 0003 — First ADR

## What was attempted

Write the first ADR for the unfolder project, capturing the v1
algorithm-and-data-structures decisions that flow from Session 0002's
reading of `paperfoldmodels`.

## What shipped

`docs/decisions/0001-v1-pipeline-architecture.md`. Establishes v1 as a
sequence of pure-function stages — parse → adjacency → spanning tree →
flatten → emit — each producing a distinct typed data structure, with no
shared mutable state and no rendering inside the pipeline. Visualization
metadata is kept in a separate "render hints" structure rather than
piggybacking on the mesh or adjacency graph, in deliberate contrast to
`paperfoldmodels`' parallel-arrays approach. Mesh representation,
spanning tree algorithm, and other per-stage internal choices are
explicitly deferred to follow-on ADRs as the corresponding implementation
sessions reach them.

## What's next

Session 0004 — bootstrap the build: Vite + TypeScript + pnpm + Vitest,
dev server, hello world. First session that lands code.

## Decisions made or deferred

- **One consolidated pipeline-shape ADR** rather than splitting pipeline
  and mesh representation into two ADRs. Reasoning: pipeline shape is
  the larger architectural learning from `paperfoldmodels`; mesh-rep
  choice can wait until Session 7, when it becomes acute. Choosing now
  would be writing an ADR from theory rather than from felt experience.
- **Working-agreement update (deferred to a later docs session):**
  strategist Claude will exercise more autonomy on prose-level decisions
  inside Evan-approved structures, surfacing only medium/low-confidence
  calls. Not yet captured in `project-state.md`.
- **Discovered:** Sessions 0001 and 0002 don't have session-log files
  in `main` (`docs/sessions/` is currently empty in `main`), despite
  `project-state.md` referencing `docs/sessions/0001-project-skeleton.md`.
  Not addressed in this session; worth a small cleanup session later.
