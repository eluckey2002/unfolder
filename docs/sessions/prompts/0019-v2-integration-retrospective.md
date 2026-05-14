# Session 0019 — v2 integration and retrospective

## Goal

Close v2. This session has two halves:

**Code** — codify v2's ship-state guarantee in an automated test, and
close the one latent bug a mid-phase audit found. An end-to-end
integration test runs every corpus model through the full pipeline
and asserts the v2 contract (every model completes; every recut piece
internally overlap-free; every piece fits a page; `Piece` structure
well-formed). A connectedness guard in `buildSpanningTree` makes a
disconnected input mesh fail loudly instead of silently corrupting
downstream layout. The overlap-free invariant — currently an
`it.todo` placeholder in the property suite — is promoted to a real
property test.

**Docs** — the v2 phase-boundary wrap: write `docs/retrospectives/v2-complete.md`,
add a v2 chapter to `project-history.md`, refresh `project-state.md`
and `roadmap.md` to v2-complete / v3-next, and update `docs/queue.md`.

This closes audit findings **A1** (disconnected dual graph),
**A4** (overlap-free invariant untested), and **A6** (`Piece`
untested). It does **not** take on A5 (dihedral property test), the
`parseStl` negative-path tests, or the baseline-mislabel cleanup —
those stay queued. Scope is "wrap + integration test," deliberately
bounded.

## Session shape

Numbered session — new test code, a behavior change (the guard), and
substantive doc work. **Worktree** per the worktree-by-default rule.
A session log (`docs/sessions/0019-v2-integration-retrospective.md`)
is required, ending with a handoff block per `docs/strategist-protocol.md`,
as sessions 0017 and 0018 did. An implementation report at session-end.

**No ADR.** The connectedness guard is a precondition check — the
same gesture `buildAdjacency` already makes for non-manifold input —
and is recorded as a session-log decision. See Task 2 for the one
condition under which that call should be re-opened.

## Pre-work — queue scan

`docs/queue.md` currently has five open items. This session resolves
three of them (A1, A4, A6) and adds one (the baseline-mislabel
cleanup surfaced by session 0018). A5 and the `parseStl` negative-path
item are untouched and remain open. Task 8 handles the file; the
session log records what closed.

## Task 1 — Session setup

Standard worktree setup. Confirm `main` is at `e999587` (the
corpus-triggers refresh that followed session 0018); if it has
advanced, surface it and proceed. Create the worktree, run
`pnpm install` (a fresh worktree has no `node_modules`), and copy the
authoritative prompt file —
`docs/sessions/prompts/0019-v2-integration-retrospective.md` — from
the main checkout into the worktree, committing that copy rather than
reconstructing it from the pasted message.

## Task 2 — A1 connectedness guard in `buildSpanningTree`

`buildSpanningTree` (`src/core/spanning-tree.ts`) builds a Kruskal MST
over the dual graph, then BFS-walks the fold edges from `root` to
derive `parent[]`. For a connected dual graph, the only face left
with `parent[i] === -1` is the root. For a **disconnected** dual
graph, Kruskal produces a forest: every face in a non-root component
is also left at `parent[i] === -1` — silently ambiguous with the root
marker — and `buildLayout` downstream then reads undefined positions
for those unreachable faces. That silent corruption path is audit
finding A1.

Add a guard: after `parent[]` is derived, verify every face was
reached from `root` through fold edges. If any face was not, the
input mesh's dual graph has more than one connected component — throw
with a clear error stating that `buildSpanningTree` requires a
connected dual graph (a single-component mesh) and how many faces
were unreachable. The BFS already maintains a `visited` array; that
is the natural detection point, but the implementer chooses the
mechanism.

This is a **session-log decision, not an ADR** — a precondition
guard, no architectural alternative worth a durable record. **The one
exception:** if the guard turns out to need more than a throw — if it
becomes clear the contract genuinely wants graceful multi-component
handling (split the mesh, unfold each component) — stop and flag it.
That is an ADR 0006 conversation, not a silent expansion of scope.

Add a unit test to `test/unit/spanning-tree.test.ts`: construct the
simplest disconnected dual graph — two or more faces with no
adjacency linking them, with a parallel-length `weights` array — and
assert `buildSpanningTree` throws. The existing tests cover the
connected happy path.

## Task 3 — End-to-end integration test

New file `test/integration/pipeline.test.ts`. Vitest's `include`
glob is `test/**/*.test.ts`, so a new `test/integration/` directory
is picked up with no config change.

The test discovers every `.stl` and `.obj` file in `test/corpus/`
(files only — skip the `OBJ format/` subdirectory; `scripts/baseline-pipeline.ts`
is the precedent for the `readdirSync` + `extname` discovery pattern,
and `node:fs` works under Vitest's `node` environment). For each
discovered model, run the **complete** pipeline — parse (STL or OBJ
by extension) → `buildAdjacency` → `computeDihedralWeights` →
`buildSpanningTree` → `buildLayout` → `detectOverlaps` → `recut` →
`buildRenderablePieces` → `paginate(…, LETTER)` → `emitSvg` per page —
and assert the v2 ship-state contract. Use `it.each` over the
discovered models so each model is a named, independently-reported
test.

Per-model assertions:

1. **The pipeline completes** — every stage runs without throwing.
2. **Connectedness holds** — `buildSpanningTree` does not throw,
   exercising Task 2's guard on its happy path (the corpus is
   verified single-component).
3. **Every recut piece is internally overlap-free** — for each
   `piece` in `recut(...).pieces`, `detectOverlaps(piece.layout)`
   returns `[]`. This is v2's headline guarantee (ADR 0005).
4. **`Piece` structure is well-formed** — each piece has `layout`,
   `faces`, and `folds`; `piece.faces.length === piece.layout.faces.length`
   (the parallel-array contract in the `Piece` doc comment); `faces`
   entries are valid mesh face indices. This is the first test that
   inspects `Piece` structurally (closes audit A6).
5. **Every piece fits a page** — `paginate` returns at least one
   page, and every placed piece's coordinates fall within the page
   bounds.
6. **`emitSvg` produces well-formed output** — for every page,
   `emitSvg(page)` returns a non-empty string beginning with `<svg`.

Outside the per-model loop, add a **corpus-coverage guard**: assert
the discovered model set is non-empty and includes known anchor
models (e.g. `tetrahedron.stl` and `deer.obj`), so a vanished or
emptied corpus fails loudly rather than silently running zero tests.

This integration test does not replace `scripts/baseline-pipeline.ts`
— the baseline harness stays as the human-readable per-model report
(`pnpm baseline`); the integration test is the automated gate
(`pnpm test:run`). They are complementary.

## Task 4 — Promote the overlap-free property test

`test/property/pipeline.test.ts` carries an `it.todo` placeholder for
the overlap-free invariant — left as a placeholder in v1's
property-harness work, explicitly waiting for ADR 0005 (recut) to
land, which it has. Promote it to a real `fast-check` property: for
every mesh produced by the suite's existing mesh arbitrary, running
the pipeline through `recut` yields pieces that are each internally
overlap-free (`detectOverlaps(piece.layout)` is empty). Wire it to
the existing arbitraries and pipeline helpers in that file.

The property holds trivially on the current convex arbitraries
(they produce single, clean pieces) — that is acceptable. The test
is the durable regression guard; the Task 3 integration test carries
the real corpus-stress verification. Richer arbitraries are a
separate, already-noted concern and are not in this session's scope.

## Task 5 — Verification

Run `pnpm type-check`, `pnpm test:run`, and `pnpm build` — all
green. Report the new total test count (do not predict it — the
suite grew by the integration test's `it.each` cases, the new
spanning-tree unit test, and the promoted property test; Claude Code
counts).

`pnpm baseline` may be run as a smoke check but **do not commit a
regenerated `docs/baseline-pipeline.md`** — the guard and the new
tests do not change pipeline behavior on the connected corpus, so its
only diff would be the generation-date line.

## Task 6 — Write `docs/retrospectives/v2-complete.md`

Create the file with the content in **Appendix A**, copied verbatim.

## Task 7 — Edit `docs/project-history.md`

Two insertions and one replacement, all in **Appendix B**:

- Insert the two new sections (`## v2: the functional unfolder` and
  `## A mid-phase audit`) after the existing `## What v1's mistakes
  taught` section and before `## What this history teaches`.
- **Replace** the existing `## The current moment` section at the end
  of the file with the new version in Appendix B. Delete the old one
  — do not leave both.

## Task 8 — Edit `docs/project-state.md`

Five edits, all verbatim in **Appendix C**:

- **C.1** — replace the `## Current phase` section.
- **C.2** — append the Session 0019 bullet to `## Sessions completed`.
- **C.3** — replace the `## Sessions planned` section.
- **C.4** — replace the GitHub-remote bullet in `## Open questions /
  things in flight` (leave the project-name bullet unchanged).
- **C.5** — in `## Where to look`, replace the `docs/retrospectives/`
  bullet and add a new `docs/audits/` bullet after it.

## Task 9 — Edit `docs/roadmap.md`

Two edits, verbatim in **Appendix D**:

- **D.1** — replace the `## Where we are now` section.
- **D.2** — replace the `0019` bullet in the v2 session plan (flip
  `⏭` → `✅`).

Do not add a v3 session-plan section — v3's session-level plan is
drafted at the start of the next Cowork session, the same way v2's
was drafted fresh after v1.

## Task 10 — Edit `docs/queue.md`

Replace everything under the `## Open items` header with the content
in **Appendix E**. The `## Format` and `## Process` sections above it
are unchanged. Net effect: A1, A4, and A6 are removed (resolved by
this session); A5 and the `parseStl` item stay; the baseline-mislabel
cleanup item is added.

## Task 11 — Session log, commit, fast-forward

Write `docs/sessions/0019-v2-integration-retrospective.md` following
the standard session-log format (What was attempted / What shipped /
What's next / Decisions made or deferred / Handoff), ending with a
handoff block per `docs/strategist-protocol.md`. The log must record:
the connectedness-guard session-log decision; that queue items A1,
A4, and A6 closed and the baseline-mislabel item was added; the
verification results and final test count.

Stage all changes and commit with this message:

```
feat: v2 integration test, connectedness guard, and v2-complete retrospective
```

Files to stage:
- `src/core/spanning-tree.ts` (modified — the guard)
- `test/unit/spanning-tree.test.ts` (modified — guard unit test)
- `test/integration/pipeline.test.ts` (new)
- `test/property/pipeline.test.ts` (modified — `it.todo` promoted)
- `docs/retrospectives/v2-complete.md` (new)
- `docs/project-history.md` (modified)
- `docs/project-state.md` (modified)
- `docs/roadmap.md` (modified)
- `docs/queue.md` (modified)
- `docs/sessions/0019-v2-integration-retrospective.md` (new)
- `docs/sessions/prompts/0019-v2-integration-retrospective.md` (new —
  this prompt file)

Fast-forward `main`. Watch for the prompt-file collision with the
main checkout's untracked copy — resolve by verifying byte-identical
(`diff -q`) and removing the main copy before the FF.

## Task 12 — Report back

Final `main` HEAD hash; confirmation all eleven files staged; the
final test count; and — flag only, do not self-correct — any factual
problem spotted in the verbatim appendix content while filing, and
anything from Task 2's guard work that touches the ADR-0006 exception
condition.

## What's NOT in scope

- **A5** — the `dihedral.ts` property test. Stays queued.
- **The `parseStl` negative-path tests.** Stays queued.
- **The baseline-mislabel cleanup.** Added to the queue this session,
  not fixed in it.
- **`project-rationale.md`.** Deliberately untouched — no
  project-level decision changed in v2, and the retrospective-pointer
  section added at the v1 wrap already covers v2.
- **The v3 session plan.** Drafted at the start of the next chat.
- **The CI / GitHub-remote decision.** Noted as live in
  `project-state.md` (Appendix C.4); the decision itself is not made
  here.

## Notes

- Appendix content is verbatim where the wording is the deliverable
  (the retrospective, the history additions, the doc-section
  replacements). The code tasks (2, 3, 4) are specified as behavior —
  Claude Code writes the implementation against current library API
  knowledge.
- If a factual error is spotted in an appendix while filing, flag it
  in the report; the strategist decides whether to amend. Don't edit
  appendix content unilaterally.

---

## Appendix A — `docs/retrospectives/v2-complete.md` (verbatim)

```markdown
# Retrospective — v2 complete

This is the second phase-boundary retrospective. Like the first, it is
the durable record of what v2 became and what the working method
became across it — the lessons that would otherwise live only in a
Cowork chat and evaporate at the next context boundary. Read
`v1-complete.md` first; this one assumes it.

## What v2 delivered

The tangible: the pipeline grew from v1's six pure-function modules to
ten. New stages — `parse-obj`, `dihedral`, `overlap`, `recut`, `tabs`,
`paginate` — and meaningful evolution of `spanning-tree` (DFS replaced
by a dihedral-weighted Kruskal MST), `flatten`, and `emit-svg`. Two new
ADRs on the load-bearing algorithm decisions: 0004 (dihedral-weighted
MST) and 0005 (greedy set-cover recut). A real test corpus replaced the
three platonic solids — eleven models, sourced CC0 and procedurally
generated, every one verified a closed two-manifold. An end-to-end
ship-state integration test and a promoted overlap-free property test.
The pipeline now runs parse -> adjacency -> dihedral weights ->
spanning tree -> flatten -> overlap detect -> recut -> tabs -> paginate
-> emit, and on the full corpus it produces buildable papercraft: every
piece internally overlap-free, labelled, tabbed, and packed onto Letter
pages at one consistent scale.

The intangible: where v1 *invented* the working method, v2
*stress-tested* it. v2's sessions were bigger, the algorithms were real
(set-cover, MST, bin-packing, polygon clipping), two of them were
ADR-bearing, and a mid-phase codebase audit was run against the whole
thing. The method held under that load — and it picked up speed.

## What worked

The dependency-chain plan. v2's stages had a hard one-directional
dependency order — corpus before the heuristic that needs it,
detection before recut, recut before tabs, tabs before pagination —
and the session plan simply followed it. Each session consumed the
previous session's output across a stable type contract. The "first
three detailed, the rest a deliberate sketch" planning decision paid
off: the sketched sessions were refined as the early ones landed and
informed them.

The failure baseline. Session 0013 didn't just build a corpus — it
produced a baseline showing 5 of 11 models unfoldable under v1's plain
DFS. That number became v2's north star. Every later session was
measured against it: dihedral weighting moved it to 7 of 11, recut
moved it to every-piece-clean. Success was a number that changed, not
a feeling.

Spec-style prompts held up for genuinely algorithmic work. Describing
set-cover recut or shelf bin-packing as behavior — not code — and
letting Claude Code implement against current library knowledge
produced clean implementations, and the implementation reports kept
catching real things: a `polygon-clipping` import that crashed under
vite-node, a recut return-shape that needed extending for downstream
rendering.

ADR discipline got exercised and held. ADRs landed when the decision
was acute and had real alternatives — 0004 (dihedral vs. length
weighting), 0005 (greedy set-cover). They were correctly *not* written
when the decision was a naive-first within-stage choice — overlap
detection, tabs, pagination all recorded their choices in session
logs, not ADRs. The line between "decision worth a durable record" and
"session-log note" got tested across six sessions and stayed legible.

The mid-phase codebase audit was new this phase and earned its place.
A four-axis read-only assessment, run between sessions 0016 and 0017,
caught a latent P1 bug (a disconnected input mesh silently mishandled),
surfaced concrete test gaps, and — importantly — the strategist's
triage of it recalibrated several findings the audit over-weighted
rather than reflexively acting on all of them. An audit you partly
argue with is more useful than one you rubber-stamp.

And v2 found a faster rhythm. Evan asked for it directly — "i want to
get to the good stuff and start to move faster" — and the method
adapted: less sequential gating of non-blocking work, prompts drafted
and run in quicker succession, sessions allowed to land without every
one waiting on a full strategist review loop. The structure didn't
break under the higher speed.

## What did not work, or cost us

The dihedral heuristic was mediocre on concave organic shapes. Session
0014 was a genuine partial regression — croissant, deer, and
meat-sausage came out with *worse* overlap counts than plain DFS. That
prompted a real strategic doubt — should we be researching a better
algorithm? — answered with a research survey that concluded the
architecture was sound and the heuristic was a known-mediocre naive
choice. The actual fix was recut (0016), not a cleverer tree. The
lesson is not that 0014 failed; it is that a heuristic which regresses
some inputs is normal, the survey was the right response to the doubt,
and "naive tree plus robust recut" beat "chase the perfect tree."

The corpus sourcing was a detour. Sourcing versus generating models
went back and forth; the Kenney Food Kit pack had a doubled-faces
export quirk that broke the first `prepare-corpus.py`; the low-poly
deer arrived as three disconnected components. It resolved into a clean
verified eleven-model corpus, but it cost more cycles than the plan
budgeted.

A prompt was edited after it had been handed off. The 0016 prompt's
draft of ADR 0005 carried a baseline number the strategist corrected
*after* the prompt was already available to run, so the committed ADR
carried the pre-edit number. Immaterial in substance — ADRs are
immutable and the reasoning holds either way — but the rule it teaches
is real: once a prompt is handed off, it is frozen; a change is a new
prompt or an explicit flagged amendment.

Outside-chat drift recurred. Work landed on `main` without the
strategist in the loop — a session ran and a corpus-trigger refresh
committed between strategist turns. `git log` at session start caught
it, which is exactly why that discipline exists — but the recurrence
says the discipline has to stay conscious, not assumed to have been
internalized.

## Lessons carried into v3

1. Naive-correct plus a robust cleanup beats a clever-but-fragile core.
   Dihedral weighting is mediocre; recut makes the output buildable
   anyway. v3's optimized-cut work should remember which half did the
   real work.
2. A failure baseline is the best driver a phase can have. v3 should
   establish its own: against what does "quality output" visibly fall
   short today?
3. A prompt is frozen once handed off. Amend explicitly or write a new
   one.
4. The mid-phase audit earns its keep — schedule one mid-v3.
5. `git log` at the start of every chat. Outside-chat drift recurred in
   v2; it will recur again if the check lapses.
6. ADR for a decision with real alternatives and consequences;
   session-log note for a naive-first within-stage choice. The line
   held in v2 — keep it.

## What changes for v3

v3 — quality output — is a different kind of work than v2. v2 *built*
the pipeline stages; v3 *improves* them. Takahashi-style topological
surgery for better cuts, smart tab placement, audit visualization,
color and texture passthrough, real PDF export. The work shifts from
"make the stage exist" to "make the stage good," which means more of it
is refactoring inside modules the audit already flagged as the
cognitive-load hotspots — `recut.ts`, `flatten.ts`. The code-review
subagent matters more here than it did in v2.

v3 also introduces the first real external-format output — PDF, via
`pdf-lib` — and the first visualization work, the foldability audit
view. That is closer to UI than anything v2 touched. Probe `pdf-lib`
before designing around it; v1's lesson about probing new tooling
applies directly.

And the GitHub-remote question, deferred since v1, is now genuinely
live. v2 left it parked because CI has nowhere to run without a remote
— but v3's PDF output, growing test surface, and the integration test
built in session 0019 all make CI more valuable. It should be settled
at the v2->v3 boundary or early in v3.

v3's session-level plan does not exist yet. Drafting it is the first
task of the next Cowork session — the same way v2's plan was drafted
fresh after v1. This retrospective, the updated handoff documents, and
the integration test that now guards v2's ship state are its entry
point.

Welcome to v3.
```

---

## Appendix B — `docs/project-history.md` additions

Insert these two sections after `## What v1's mistakes taught` and
before `## What this history teaches`:

```markdown
## v2: the functional unfolder

v2 turned the walking skeleton into a tool that produces buildable
papercraft. It ran eight sessions, 0012 through 0019, and unlike v1 its
session order was not a matter of preference — the pipeline's
dependency chain fixed it.

Session 0012 added the OBJ parser, so the corpus could be more than
three.js-generated STL solids. Session 0013 built that corpus: eleven
models, four from a CC0 Kenney pack, a low-poly deer, two procedurally
generated convex baselines, every one verified a closed two-manifold —
and, more importantly, a baseline showing only 5 of the 11 unfolded
cleanly under v1's plain DFS. That failure baseline drove the rest of
the phase. Session 0014 replaced the DFS with a dihedral-weighted
minimum spanning tree (ADR 0004) and moved the baseline to 7 of 11 —
with regressions on the most concave shapes that prompted a research
survey to confirm the architecture was sound. Session 0015 added
overlap detection on top of `polygon-clipping`. Session 0016 added
automatic recut — greedy set-cover over the overlap tree-paths (ADR
0005) — and that was the payoff: every piece of every model now
internally overlap-free. Sessions 0017 and 0018 made the output
buildable and printable — glue tabs with matched edge labels, then
multi-page bin-packing onto physical Letter pages at one consistent
scale. Session 0019 closed the phase: an end-to-end integration test
that codifies v2's ship-state guarantee, a guard against the one latent
bug a mid-phase audit had found, and the v2 retrospective.

## A mid-phase audit

Something new happened in the middle of v2. Between sessions 0016 and
0017, a full four-axis codebase audit was run — architecture, tech
debt, test coverage, roadmap-versus-reality — as a read-only
assessment. It found no critical bugs but one genuine latent P1: a
disconnected input mesh would be silently mishandled rather than
rejected. It surfaced real test gaps. And the strategist's triage of it
did something worth recording: it argued back. Several findings the
audit rated P1 were recalibrated — already owned by an ADR, or
unreachable through the type system, or gated on a decision not yet due
— and only the genuine items were queued. The audit became a committed
artifact (`docs/audits/`), and the practice — a mid-phase audit,
triaged rather than rubber-stamped — is one v3 should repeat.
```

**Replace** the existing `## The current moment` section at the end of
the file with:

```markdown
## The current moment

As of the v2 wrap-up, v2 — the functional unfolder — is complete and
merged to `main`. The pipeline runs ten stages end to end and produces
buildable papercraft for real low-poly meshes: every piece overlap-free,
tabbed, labelled, and packed onto printable pages. Five ADRs, nineteen
session logs, two phase retrospectives, a managed queue, and an
end-to-end integration test that guards the ship state are all in the
repo.

The next phase is v3 — quality output: optimized cuts, audit
visualization, color and texture passthrough, real PDF export. Its
session-level plan does not exist yet; drafting it is the first task of
the next Cowork session, which will pick up the project using this
updated handoff package as its entry point. The test is the same as it
was at the v1 boundary: if the package is good, the next strategist
loses nothing.

Welcome to v3.
```

---

## Appendix C — `docs/project-state.md` edits

### C.1 — Replace the `## Current phase` section

```markdown
## Current phase

**v2 — Functional Unfolder is complete.** The pipeline runs ten
pure-function stages end to end — parse, adjacency, dihedral weighting,
spanning tree, flatten, overlap detection, recut, tabs, pagination,
emit — and produces buildable papercraft for real low-poly meshes:
every piece internally overlap-free, glue-tabbed, edge-labelled, and
bin-packed onto printable Letter pages at one consistent scale. An
end-to-end integration test (`test/integration/pipeline.test.ts`)
guards that ship state.

The current phase is v3 — quality output (optimized cuts via
topological surgery, audit visualization, color/texture passthrough,
real PDF export). v3's session-level plan does not exist yet — drafting
it is the first task of the next session. See `docs/roadmap.md`.

Detailed v1-v6 phase definitions are in `README.md`.
```

### C.2 — Append to `## Sessions completed`

Append this bullet at the end of the section, after the Session 0018
bullet:

```markdown
- **Session 0019 — v2 integration and retrospective.** End-to-end integration test in `test/integration/pipeline.test.ts` codifying v2's ship-state guarantee (every corpus model completes the pipeline; every recut piece internally overlap-free; every piece fits a page; `Piece` structure well-formed). A connectedness guard in `buildSpanningTree` that throws on a disconnected dual graph (closes audit finding A1). The overlap-free invariant promoted from `it.todo` to a real property test (closes A4); `Piece` now structurally asserted (closes A6). `docs/retrospectives/v2-complete.md` written; handoff docs refreshed; v2 closed. Log: `docs/sessions/0019-v2-integration-retrospective.md`.
```

### C.3 — Replace the `## Sessions planned` section

```markdown
## Sessions planned

v2 is complete. v3 — quality output — does not have a session-level
plan yet; drafting it is the first task of the next Cowork session, the
same way v2's plan was drafted fresh after v1. See `docs/roadmap.md`
for the v1-v6 phase arc.
```

### C.4 — Replace the GitHub-remote bullet in `## Open questions / things in flight`

Replace the bullet that currently reads `- No GitHub remote yet. Worth
revisiting once we have a working v1.` with:

```markdown
- No GitHub remote yet. This is now a live decision at the v2→v3 boundary: CI has nowhere to run without a remote, and v3's PDF-export work, growing test surface, and the new end-to-end integration test all make CI more valuable. Settle it at the boundary or early in v3.
```

Leave the project-name bullet unchanged.

### C.5 — `## Where to look` edits

Replace the `docs/retrospectives/` bullet with:

```markdown
- `docs/retrospectives/` — phase-boundary retrospectives (`v1-complete.md`, `v2-complete.md`)
```

And add this new bullet immediately after it:

```markdown
- `docs/audits/` — point-in-time codebase assessments (`codebase-assessment-2026-05-14.md` is the first)
```

---

## Appendix D — `docs/roadmap.md` edits

### D.1 — Replace the `## Where we are now` section

```markdown
## Where we are now

**Phase:** v3 — Quality Output. Not yet started; session plan pending.
**Last completed session:** 0019 — v2 integration and retrospective.
**Next planned session:** v3 session-level plan, drafted at the start
of the next Cowork session.

Run `git log` for exact repo state — this document tracks phase and
session status, not commit hashes.
```

### D.2 — Replace the `0019` bullet in the v2 session plan

```markdown
- **0019 — v2 integration and retrospective.** ✅ End-to-end
  integration test codifying v2 ship state; a connectedness guard in
  `buildSpanningTree` (closes audit A1); the overlap-free invariant
  promoted from `it.todo` to a real property test (closes A4); `Piece`
  structurally asserted (closes A6); `docs/retrospectives/v2-complete.md`
  written and handoff docs refreshed. v2 complete.
```

---

## Appendix E — `docs/queue.md` `## Open items` section (verbatim replacement)

Replace everything under the `## Open items` header with:

```markdown
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
```
```
