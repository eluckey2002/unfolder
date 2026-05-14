# Session 0019 — v2 integration and retrospective

## What was attempted

Close v2. Two halves: codify v2's ship-state guarantee in an automated
test, close the one latent P1 the mid-phase audit found, and promote a
long-standing `it.todo` placeholder to a real property test — then wrap
the phase with a retrospective and refreshed handoff documents. This is
v2's analogue of the v1 wrap-up: the phase doesn't end with the last
feature, it ends with the test that guards what shipped and the writing
that captures what was learned.

## What shipped

- `src/core/spanning-tree.ts` — connectedness guard added after the
  BFS root-traversal. The BFS already maintained a `visited[]` array;
  the guard counts faces left unvisited and throws with a clear
  message: `buildSpanningTree requires a connected dual graph (single
  mesh component); N of M faces were unreachable from root R`. The
  silent-corruption path the 2026-05-14 audit flagged (Kruskal forest
  + `parent[i] === -1` ambiguous with the root marker) now fails loudly
  at the right boundary. Closes audit A1.
- `test/unit/spanning-tree.test.ts` — new `connectedness guard`
  describe block with two cases: two isolated faces with no adjacency,
  and a 3-face two-component graph (`{0,1}` connected, `{2}` isolated).
  The corpus is verified single-component and cannot exercise this
  path, so both cases synthesize a `DualGraph` directly with a
  parallel-length `weights` array.
- `test/integration/pipeline.test.ts` (new) — the v2 ship-state gate.
  Discovers every `.stl`/`.obj` in `test/corpus/` via the same
  `readdirSync` + `extname` pattern `scripts/baseline-pipeline.ts`
  uses, then `it.each`s a per-model pipeline run: parse → adjacency
  → dihedral weights → spanning tree (exercising the new guard's happy
  path) → flatten → overlap detect → recut → renderable → paginate →
  emit. Each model asserts: pipeline completes, every recut piece is
  internally overlap-free (`detectOverlaps(piece.layout)` returns
  `[]`), `Piece` structure is well-formed with `piece.faces.length ===
  piece.layout.faces.length` and valid face indices, at least one page
  is produced, every coordinate on every edge (including tab vertices)
  is within `[marginMm, widthMm - marginMm]` × `[marginMm, heightMm -
  marginMm]`, and `emitSvg(page)` returns a non-empty string starting
  with `<svg`. A corpus-coverage guard outside the loop asserts the
  discovered set is non-empty and contains the `tetrahedron.stl` and
  `deer.obj` anchor models, so a vanished corpus fails loudly. Vitest's
  existing `test/**/*.test.ts` include glob picks up the new
  `test/integration/` directory with no config change.
- `test/property/pipeline.test.ts` — the long-standing `it.todo`
  placeholder for the overlap-free invariant promoted to a real
  `fast-check` property: for every mesh produced by `closedMeshArb`,
  the pipeline through `recut` yields pieces that are each internally
  overlap-free. Trivially holds on the current convex arbitraries (the
  property test is the regression guard; the integration test carries
  the real corpus stress). Closes audit A4. `Piece` is also now
  structurally asserted by the integration test (closes audit A6).
- `docs/retrospectives/v2-complete.md` (new) — the v2 phase-boundary
  retrospective. What v2 delivered, what worked, what cost us, the six
  lessons carried into v3, and what changes for v3 (a different kind
  of work — improving stages rather than building them).
- `docs/project-history.md` — two new sections (`v2: the functional
  unfolder`, `A mid-phase audit`) inserted after `What v1's mistakes
  taught`; `The current moment` rewritten to land at the v2→v3 boundary.
- `docs/project-state.md` — `Current phase` rewritten for v2-complete /
  v3-pending; Session 0019 bullet added to `Sessions completed`;
  `Sessions planned` rewritten ("v2 complete; v3 plan pending"); the
  GitHub-remote bullet promoted from "revisit once we have a working
  v1" to a live v2→v3 boundary decision; `Where to look` updated for
  the new retrospective and the `docs/audits/` directory.
- `docs/roadmap.md` — `Where we are now` flipped to "v3, plan pending";
  the 0019 bullet flipped `⏭` → `✅` with a one-line summary of what
  shipped.
- `docs/queue.md` — three audit items closed (A1, A4, A6); the
  session-0018 baseline-mislabel cleanup added; A5 and the `parseStl`
  negative-path item remain queued.
- `docs/sessions/prompts/0019-v2-integration-retrospective.md` — the
  authoritative session prompt, copied from the main checkout into the
  worktree per working agreement.

## What's next

v2 is complete. v3 — quality output — does not have a session-level
plan yet. Drafting it is the first task of the next Cowork session,
the same way v2's plan was drafted fresh after v1. The v2-complete
retrospective, the refreshed handoff docs, and the new integration
test that now guards v2's ship state are its entry point. The
GitHub-remote question — deferred since v1, escalated this session
— should be settled at the boundary or early in v3.

## Decisions made or deferred

- **Connectedness guard is a session-log decision, not an ADR.** The
  guard is a precondition check — the same kind of gesture
  `buildAdjacency` already makes for non-manifold input — and not a
  contract that has alternatives worth a durable record. The one
  ADR-0006 escalation condition (graceful multi-component handling
  via component splitting and per-component unfolding) did not
  materialize: a throw was correct, the contract genuinely is
  "single-component dual graph in, spanning tree out."
- **Synthetic disconnected fixtures.** The corpus is verified
  single-component, so the unit test for the new guard constructs a
  `DualGraph` directly rather than parsing a fixture. Two cases
  cover the two natural shapes: zero adjacencies on multiple faces
  (each face its own component), and one component plus an isolated
  face.
- **Promoted property uses the post-recut invariant, not the
  pre-recut layout.** The v2 ship-state guarantee is per-piece after
  recut, not per-initial-layout, and the `closedMeshArb` arbitraries
  are convex enough that no model produces an overlapping initial
  layout. Asserting the post-recut invariant matches what ADR 0005
  actually promised. The corpus integration test carries the real
  per-model stress; the property test is the durable regression guard
  on the invariant statement itself.
- **Page-bounds tolerance.** Coordinates are checked against
  `[marginMm - EPS, widthMm - marginMm + EPS]` (EPS = 1e-6) to absorb
  floating-point artifacts from `transformPiece`'s multiply-and-add
  without hiding real overflow.

## Handoff

- **Branch / worktree:** `claude/nice-diffie-033d91` at
  `.claude/worktrees/nice-diffie-033d91/`.
- **Commits:** `<short-sha>` `feat: v2 integration test, connectedness guard, and v2-complete retrospective`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 93
  passing across 14 files (87 prior + 2 new spanning-tree guard cases
  + 1 promoted property test + 1 corpus-coverage guard + 1 per-model
  integration case × 11 corpus models = 93, with the prior `it.todo`
  no longer counted as a todo); `pnpm build` clean. The connectedness
  guard's happy path is exercised on every corpus model in the
  integration test.
- **Decisions made or deferred:** connectedness guard as a session-log
  decision (not an ADR; the ADR-0006 escalation condition did not
  materialize); synthetic-fixture approach for the guard unit test;
  property test asserts post-recut invariant; small EPS tolerance on
  page-bounds checks. No new ADR.
- **Queue / roadmap deltas:** `docs/queue.md` — A1, A4, A6 closed;
  baseline-mislabel cleanup added (from session 0018); A5 and the
  `parseStl` negative-path item remain. `docs/roadmap.md` — 0019 →
  ✅, "Where we are now" advanced to v3 / plan pending.
  `docs/project-state.md` — Current phase rewritten for v2-complete;
  Session 0019 added to Sessions completed; Sessions planned
  rewritten; GitHub-remote bullet escalated to a live v2→v3 boundary
  decision; Where-to-look gained the `docs/audits/` bullet.
  `docs/project-history.md` — two new v2 sections inserted; The
  current moment rewritten. `docs/retrospectives/v2-complete.md` new.
- **Open questions for the strategist:** GitHub-remote question is
  now live at the v2→v3 boundary — escalated in `project-state.md`'s
  open-questions section, not decided here. Nothing else blocking.
