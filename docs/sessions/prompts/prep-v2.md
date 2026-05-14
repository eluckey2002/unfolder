# Prompt — prep v2 (maintenance)

**Type:** Maintenance work, not a numbered session. No session log,
no session number. Work directly on `main` — no worktree.

**Output:** Two commits, described below, in order. This prompt
file (`docs/sessions/prompts/prep-v2.md`) commits with Commit 2.

## Background

v1 is complete and merged. The v2 session-level plan has been
drafted and approved and needs to land in the repo. While preparing
it, a `git status` check surfaced three pieces of v1-era drift that
should be cleared in the same pass: nine session-prompt files were
never committed, `.claude/` is not gitignored and holds two stale
worktrees, and the README's status section is stale.

## Pre-flight

1. Confirm you are on `main` with a clean-enough working tree (the
   only untracked content should be the items this prompt
   addresses — the orphaned prompt files, `.claude/`, and this
   prompt file).
2. If any git operation reports a stale `.git/index.lock`, remove
   it and retry.

## Commit 1 — repo hygiene

Three things, one commit:

**a. Backfill the nine orphaned prompt files.** These exist in
`docs/sessions/prompts/` but were never tracked. Stage exactly
these nine:

- `docs/sessions/prompts/0003-first-adr.md`
- `docs/sessions/prompts/0003-first-adr-amendment.md`
- `docs/sessions/prompts/0003-first-adr-merge.md`
- `docs/sessions/prompts/0004-queue-and-working-agreements.md`
- `docs/sessions/prompts/0004-amend-and-merge.md`
- `docs/sessions/prompts/0005-bootstrap-the-build.md`
- `docs/sessions/prompts/0006-generate-test-corpus.md`
- `docs/sessions/prompts/0007-mesh-loading.md`
- `docs/sessions/prompts/add-roadmap.md`

Do not modify their contents — commit them as-is. This is a
backfill of an omission, consistent with the Session 0002 log
backfill precedent.

**b. Gitignore `.claude/`.** Add `.claude/` to `.gitignore` — it
holds Claude Code's machine-local state (worktrees, local config)
and should never be tracked. Place it as its own commented section;
suggested position is right after the `/references/` block:

```
# Local reference implementations — not vendored
/references/

# Claude Code local state (worktrees, machine-local config)
.claude/

# macOS
.DS_Store
```

**c. Prune the stale worktrees.** `git worktree list` currently
shows two worktrees under `.claude/worktrees/` that git flags as
prunable (`nifty-yonath-2e1e28`, `pedantic-boyd-38155a`). Clean
them up so `git worktree list` shows only the main checkout. Use
whatever git operations do this cleanly; remove leftover
directories if pruning leaves them behind. This is local cleanup —
it produces no committed content beyond the `.gitignore` change in
(b).

**Commit 1 message:**

```
chore: repo hygiene — backfill orphaned prompt files, gitignore .claude/

Sessions 0003-0007 and the add-roadmap maintenance commit saved
their prompt files locally but never committed them; the
commit-the-prompt-file discipline only became reliable at session
0008. This backfills the nine orphaned files unchanged.

Also gitignores .claude/ (Claude Code worktrees and machine-local
state) and prunes two stale v1-era worktrees.
```

## Commit 2 — draft v2 session plan and sync orientation docs

Four file edits. Verbatim replacement content is in the appendices —
for these edits the wording is the deliverable, so apply it exactly.

**a. `docs/roadmap.md`** — three edits, see Appendix A.

**b. `docs/project-state.md`** — two edits, see Appendix B.

**c. `README.md`** — one edit, see Appendix C.

**d.** Stage this prompt file (`docs/sessions/prompts/prep-v2.md`)
with this commit.

**Commit 2 message:**

```
docs: draft v2 session plan and sync orientation docs

Adds the v2 session plan to the roadmap: sessions 0012-0014
(OBJ parser, sourced model test corpus, dihedral-weighted spanning
tree) specified in detail, 0015-0019 sketched per the planning
decision to detail only the first three. Drops the self-staling
"Main HEAD" line from the roadmap.

Syncs project-state.md and README.md to reflect v1 complete / v2
planned.
```

## Verification

This work touches documentation and `.gitignore` only — no source,
no config, no tests. Do not run or predict the test suite.

- `git worktree list` shows only the main checkout.
- `git status` is clean — no untracked prompt files, and `.claude/`
  no longer appears.
- `git ls-files docs/sessions/prompts/` lists all prompt files
  including the nine backfilled ones and this one.
- `git log --oneline -3` shows the two new commits in order.
- `docs/roadmap.md`, `docs/project-state.md`, and `README.md` are
  well-formed CommonMark — in particular, a blank line precedes
  every list and follows every header.
- Internal cross-references still resolve: `project-state.md` and
  `README.md` both point at `docs/roadmap.md`; the roadmap's v2
  plan references sessions 0012-0019 and ADR 0004 consistently.

## Implementation report

Produce a brief report at the end: what landed in each commit, any
deviations from this prompt, anything unexpected in the worktree
prune or the git state, and anything worth a strategist eye.

---

## Appendix A — `docs/roadmap.md` edits

### A1. Replace the "Where we are now" section

Replace this block:

```
## Where we are now

**Phase:** v1 — Walking Skeleton (complete).
**Last completed session:** 0011 (SVG export).
**Next planned session:** v2 planning (session plan to be drafted).
**Main HEAD:** `2745764`.
```

with:

```
## Where we are now

**Phase:** v2 — Functional Unfolder. Planning complete;
implementation not started.
**Last completed session:** 0011 — SVG export (v1 walking skeleton
complete).
**Next planned session:** 0012 — OBJ parser.

Run `git log` for exact repo state — this document tracks phase and
session status, not commit hashes.
```

### A2. Replace the "Beyond v1" section

Replace this block:

```
## Beyond v1

v2 through v6 don't have session-level plans yet. They will be
drafted when v1 lands, with the v1 experience informing the
granularity and scope of each subsequent session. The phase
descriptions above are the current commitment; the sessions inside
each phase will emerge.
```

with:

```
## v2 session plan

v2 — the functional unfolder — turns the walking skeleton into a
tool that produces buildable papercraft for real low-poly meshes.
The dependency chain runs in one direction, which fixes the
ordering: the test corpus and its loader come first, because the
dihedral-weighting heuristic cannot be tested on platonic solids
(their dihedral angles are uniform), and each algorithm stage
consumes the previous stage's output.

Per the planning decision, the first three sessions are specified
in detail; 0015–0019 are a deliberate sketch, refined as the early
sessions land. Sessions continue the global numbering.

- **0012 — OBJ parser.** Add `src/core/parse-obj.ts`, producing the
  same `Mesh3D` the STL parser produces. Geometry only — normals,
  texture coordinates, groups, and materials are skipped or
  parsed-and-ignored. Handles OBJ's shared-vertex indexing
  (1-indexed, negative indices) and fan-triangulates quad and n-gon
  faces, since the downstream pipeline assumes triangles. The
  triangulation strategy and any STL/OBJ format-dispatch router are
  session-log decisions unless triangulation proves load-bearing,
  in which case it earns an ADR.

- **0013 — Sourced model test corpus.** Source four to six
  CC-licensed low-poly OBJ models matching the v2 ship-state target
  — faceted animal heads, geometric busts, low-poly props —
  spanning a range of face counts and topological variety: some
  that v1's plain DFS unfolds cleanly, some that overlap. Files
  land in `test/corpus/` with a `PROVENANCE.md` recording source
  and license per model. The session's core deliverable beyond the
  files is the baseline: run the full v1 pipeline on every model
  and record which flatten cleanly and which overlap — the failure
  corpus that drives every later v2 session. Depends on 0012.

- **0014 — Dihedral-weighted spanning tree.** Replace v1's plain
  DFS (deferred to v2 by ADR 0003) with a dihedral-weighted minimum
  spanning tree over the dual graph: each edge weighted by the
  dihedral angle of its mesh edge, so the tree prefers folding flat
  edges and cutting sharp ones. ADR 0004 commits the weighting
  heuristic — the load-bearing decision of the session. Includes
  dihedral-angle computation, the weighted tree, tests, and a
  re-run of the 0013 baseline showing the overlap picture change.
  The MST algorithm itself (Prim or Kruskal, naive is fine) is a
  session-log decision. Code-review subagent: yes. Depends on 0013
  for a corpus with real dihedral variety.

### v2 sketch — 0015 onward

Refined as the early sessions land; session count and bundling stay
open until 0014 lands and informs the granularity.

- **0015 — Overlap detection.** `polygon-clipping` integration; a
  pure predicate over the 2D layout that finds face-pair overlaps.
  Detection only, no fixing.
- **0016 — Automatic recut.** The control loop: on detected
  overlap, promote a fold edge to a cut, re-flatten, repeat. The
  net becomes multi-piece here. Likely ADR 0005 on recut strategy.
- **0017 — Glue tabs with edge labels.** Tab geometry on cut edges
  plus matching edge labels. Likely forces a refactor of v1's naive
  per-face-per-edge SVG emit, which does not carry edge identity.
- **0018 — Multi-page layout.** Pack the multi-piece net across
  printable pages; naive bin-packing first.
- **0019 — v2 integration and retrospective.** Full pipeline run on
  the 0013 corpus, ship-state validation, handoff-doc updates, and
  `docs/retrospectives/v2-complete.md`.
```

### A3. Generalize one line in "Maintaining this document"

Replace:

```
Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the v1 session list.
```

with:

```
Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the active phase's session plan.
```

---

## Appendix B — `docs/project-state.md` edits

### B1. Update the "Current phase" section

Replace the middle paragraph:

```
**v1 — Walking Skeleton is complete.** The end-to-end pipeline loads a platonic solid and produces a printable SVG net rendered alongside the 3D viewport. Next phase is v2 — functional unfolder (dihedral-weighted spanning tree, overlap detection and automatic recut, glue tabs with edge labels, multi-page layout). v2's session-level plan is the next strategist task.
```

with:

```
**v1 — Walking Skeleton is complete.** The end-to-end pipeline loads a platonic solid and produces a printable SVG net rendered alongside the 3D viewport. The current phase is v2 — functional unfolder (dihedral-weighted spanning tree, overlap detection and automatic recut, glue tabs with edge labels, multi-page layout). v2's session-level plan is drafted in `docs/roadmap.md`; session 0012 (OBJ parser) is next. v2 implementation has not started.
```

### B2. Replace the "Sessions planned" section

Replace this block:

```
## Sessions planned

v1 is complete. The next strategist task is drafting v2's session-level plan; until then there are no specific sessions queued.
```

with:

```
## Sessions planned

v2's session-level plan is drafted — see `docs/roadmap.md` for the
full arc. Per the planning decision, the first three sessions are
specified in detail; sessions 0015–0019 are a deliberate sketch,
refined as the early sessions land.

- **0012 — OBJ parser.** `src/core/parse-obj.ts` producing the v1
  `Mesh3D`. The next session.
- **0013 — Sourced model test corpus.** CC-licensed low-poly OBJ
  models in `test/corpus/`, plus the v1-pipeline overlap baseline.
- **0014 — Dihedral-weighted spanning tree.** Weighted MST over the
  dual graph; ADR 0004 commits the weighting heuristic.

Sketched beyond that: 0015 overlap detection, 0016 automatic recut,
0017 glue tabs with edge labels, 0018 multi-page layout, 0019 v2
integration and retrospective.
```

---

## Appendix C — `README.md` edit

### C1. Replace the "Status" section

Replace this block:

```
## Status

v1 in progress. Currently: not yet bootstrapped.
```

with:

```
## Status

v1 — the walking skeleton — is complete. The full pipeline (parse →
adjacency → spanning tree → flatten → emit SVG) runs end to end on
the platonic solids, with a browser app showing the 3D mesh beside
its unfolded SVG net. v2 — the functional unfolder — is planned; its
session plan is in `docs/roadmap.md`. v2 implementation has not
started.
```
