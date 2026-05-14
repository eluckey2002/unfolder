# Session 0013 — Sourced model test corpus

## Goal

Land the v2 test corpus and capture the v1-pipeline baseline against it.

The seven v2 corpus models already exist in `test/corpus/` — four
CC0 Kenney models, a low-poly deer, and two procedurally-generated
convex baselines. They were built and topology-verified by the
strategist (closed two-manifold, single component, genus 0,
consistent winding). This session commits them, documents their
provenance, and produces the baseline: run the full v1 pipeline on
every corpus model and record which unfold cleanly and which
overlap. That baseline is the failure corpus every later v2 session
measures improvement against.

This is not an algorithm session. The only new code is a
measurement harness — a script, not a pipeline stage.

## How this prompt works

Established spec-based prompt (pattern from sessions 0007/0012). For
the harness, the prompt describes behavior; you implement against
the actual `src/core/` exports. Verbatim appendices are reserved for
document content where the wording is the deliverable. This prompt
is itself the written plan CLAUDE.md section 5's plan-first rule
calls for — files, verification, commit strategy are all below; no
separate plan-mode step.

At the end you produce an implementation report (**Appendix B**). If
a concern warrants strategist input before locking it in, stop short
of committing and surface it.

## Pre-work consistency scan

Scan `docs/queue.md`. There is one open item — adding `parseStl`
negative-path tests — which does **not** intersect this session's
scope (the corpus, the baseline harness). Leave it.

Note: the strategist has placed the seven corpus `.obj` files and
`scripts/prepare-corpus.py` in the working tree (untracked). They
are inputs to this session, not things you create. The raw source
downloads — `test/corpus/Deer.obj` (original) and the
`test/corpus/OBJ format/` Kenney pack — are also present and
untracked; they are deliberately **not** committed (raw inputs, not
deliverables). Leave them in place; do not stage or delete them.

## Tasks

1. **Create the worktree and verify starting state.** Create a
   worktree for this numbered session. The SessionStart hook prints
   cwd, branch, and `git worktree list` — trust that for location.
   Confirm `main` is clean apart from the expected untracked corpus
   inputs, and note its current HEAD hash. Run `pnpm install` in the
   fresh worktree before anything else.

2. **Copy this prompt file into the worktree.** Copy the
   authoritative `docs/sessions/prompts/0013-sourced-model-test-corpus.md`
   from the main checkout; it commits with this session.

3. **Confirm the corpus inputs are present.** Verify these nine
   files exist in the worktree's `test/corpus/`:
   `deer.obj`, `egg.obj`, `ginger-bread.obj`, `croissant.obj`,
   `meat-sausage.obj`, `cylinder.obj`, `uv-sphere.obj`, and
   `scripts/prepare-corpus.py`. If any are missing, stop and report
   — do not try to regenerate them.

4. **Add a `baseline` script to `package.json`:**
   `"baseline": "vite-node scripts/baseline-pipeline.ts"` —
   alongside the existing `generate-corpus` script.

5. **Implement `scripts/baseline-pipeline.ts`** per **Spec 1**.

6. **Run `pnpm baseline`.** It writes `docs/baseline-v1-pipeline.md`
   and prints the result table. Capture it. If a corpus model fails
   a pipeline stage, that is a *recorded result*, not a session
   failure — the harness is built to catch and report it.

7. **Create `test/corpus/PROVENANCE.md`** with the content in
   **Appendix A**, copied verbatim.

8. **Verify.** Run `pnpm type-check` and `pnpm test:run`. Type-check
   must pass. The test suite is unchanged by this session (the
   harness is a script, not unit-tested code, consistent with
   `scripts/generate-corpus.ts`) — report the total; it should match
   the pre-session count.

9. **Produce the implementation report** per **Appendix B**.

10. **Stop-if-concerns gate.** If a concern warrants strategist
    input before committing — an unexpected pipeline failure on a
    model that should unfold, a harness correctness question — stop
    and report. Otherwise proceed.

11. **Update `docs/roadmap.md` and `docs/project-state.md`** for the
    status flip. Read the current files and apply: in the roadmap's
    "v2 session plan", mark 0013 done (`✅`) and 0014 next (`⏭`), and
    advance the "Where we are now" section (last completed → 0013,
    next → 0014). In `project-state.md`, add a Session 0013 entry to
    "Sessions completed", advance "Sessions planned" (drop 0013, mark
    0014 the next session), and update the "Current phase" line.
    Match the surrounding style; do not reformat untouched text.

12. **Create the session log** at
    `docs/sessions/0013-sourced-model-test-corpus.md` with the
    content in **Appendix C**, copied verbatim. Fill the handoff
    block's placeholders where you can.

13. **Wrap the session — run `/wrap-session`.** It confirms
    location, reuses this session's verification, checks the session
    log's handoff block, commits, rebases onto `main`,
    fast-forwards, and prompts for worktree cleanup. Commit message:

    ```
    feat: v2 test corpus and v1-pipeline baseline
    ```

    Stage these files explicitly by name (no `git add -A`):
    - `test/corpus/deer.obj`, `egg.obj`, `ginger-bread.obj`,
      `croissant.obj`, `meat-sausage.obj`, `cylinder.obj`,
      `uv-sphere.obj` (7 new)
    - `scripts/prepare-corpus.py` (new)
    - `scripts/baseline-pipeline.ts` (new)
    - `package.json` (modified)
    - `test/corpus/PROVENANCE.md` (new)
    - `docs/baseline-v1-pipeline.md` (new, generated)
    - `docs/roadmap.md`, `docs/project-state.md` (modified)
    - `docs/sessions/0013-sourced-model-test-corpus.md` (new)
    - `docs/sessions/prompts/0013-sourced-model-test-corpus.md` (new)

    Do **not** stage `test/corpus/Deer.obj` or `test/corpus/OBJ format/`.
    If `/wrap-session`'s rebase hits a doc conflict, stop and report.

14. **Report back:** the final `main` HEAD hash, the verification
    results, the baseline table, and the implementation report from
    Task 9, in a fenced block so it copies cleanly.

## Notes

- Use ES module imports with `.js` extensions, consistent with the
  rest of `src/` and `scripts/generate-corpus.ts`.
- The harness imports the real `src/core/` stage functions — it does
  not reimplement any pipeline logic.
- Do not start `pnpm dev`.

---

## Spec 1 — `scripts/baseline-pipeline.ts`

**Purpose:** run the full v1 pipeline over every mesh in
`test/corpus/` and record the per-model baseline — pipeline
completion and a naive overlap count. This is the v1-pipeline
baseline that v2's algorithm sessions (0014 onward) measure
improvement against. Run via `pnpm baseline` (vite-node).

**Behavior:**

- Enumerate every `.stl` and `.obj` file directly in `test/corpus/`
  — not subdirectories (the raw `OBJ format/` pack is excluded).
- For each file: read its contents and dispatch by extension —
  `.stl` → `parseStl`, `.obj` → `parseObj`.
- Run the pipeline using the existing `src/core/` exports:
  `buildAdjacency` → `buildSpanningTree` → `buildLayout` →
  `emitSvg`. Wrap each stage so a thrown error is caught and
  recorded as "failed at `<stage>`" rather than aborting the whole
  run.
- For each model that produces a `Layout2D`, compute the **naive
  overlap count**: the number of unordered face pairs whose 2D
  triangles share positive-area overlap. Two faces joined by a fold
  edge are placed sharing exactly that edge — they touch along a
  boundary, which is *not* an overlap; only positive shared area
  counts. Use a standard 2D triangle-triangle intersection test.
  This O(n²) check is a one-off baseline-measurement tool — it is
  explicitly **not** the v2 overlap-detection stage, which session
  0015 builds properly in `src/core/` with `polygon-clipping`. Say
  so in a code comment.
- Write `docs/baseline-v1-pipeline.md`: a header noting the file is
  generated by this script plus the date; a table with columns —
  model, format, faces (triangles), pipeline (completed / failed at
  `<stage>`), overlapping face pairs; and a one-line summary (how
  many models produce overlap-free nets under v1's plain-DFS
  unfolding). Also print the table to stdout.

**Expected shape of the result:** the platonic solids and `cube.obj`
should complete with zero overlaps — that is the harness validating
itself. The seven v2 models are the actual discovery; some are
expected to overlap, and that is the point.

**Decisions for the session log:** the naive overlap check lives in
`scripts/`, not `src/core/`, because it is a measurement tool, not a
pipeline stage; STL/OBJ dispatch is by file extension; the harness
catches per-stage errors so one failing model does not abort the
run.

---

## Appendix A — `test/corpus/PROVENANCE.md` (verbatim)

```markdown
# Test corpus provenance

`test/corpus/` holds the meshes the unfolder pipeline is tested and
benchmarked against. This file records, per model, where it came
from, its license, and any transformation applied before it entered
the corpus.

## v1 platonic solids

`tetrahedron.stl`, `cube.stl`, `octahedron.stl` — procedurally
generated in session 0006 by `scripts/generate-corpus.ts` (three.js
geometry exported as ASCII STL). Project-authored.

`cube.obj` — hand-authored unit-cube fixture, added in session 0012
to exercise the OBJ parser (quad faces → fan-triangulation).
Project-authored.

## v2 procedural baselines

`cylinder.obj`, `uv-sphere.obj` — procedurally generated by
`scripts/prepare-corpus.py`. Convex closed manifolds with known-clean
topology by construction; they serve as control cases that should
unfold without overlap. Project-authored.

## v2 sourced models

Each sourced model was verified — after the transformation noted —
to be a closed two-manifold, single connected component, genus 0,
with consistent winding.

`egg.obj`, `ginger-bread.obj`, `croissant.obj`, `meat-sausage.obj` —
from the Kenney "Food Kit" (kenney.nl), released under Creative
Commons Zero (CC0 1.0): public domain, no attribution required.
Transformation: the Kenney OBJ export lists every triangle twice;
`scripts/prepare-corpus.py` removed the duplicate face lines (each
file's face count halved exactly). Geometry otherwise unchanged.

`deer.obj` — low-poly deer model, modeled by Evan for this project.
Project-authored; no external source or license concern.
Transformation: the original was three disconnected closed shells (a
body and two antlers); `scripts/prepare-corpus.py` kept the largest
component — the body, the concave shape the model was chosen for —
and rewrote it geometry-only. The two antler shells were dropped.

## Reproducing the corpus

`scripts/prepare-corpus.py` is the record of how the v2 sourced and
generated models were produced. It expects the raw downloads present
(the Kenney Food Kit OBJ pack and the original deer model); those
raw inputs are not vendored in the repo.
```

---

## Appendix B — Implementation report template

After Task 8's verification passes, produce a report in this exact
structure and include it in your final reply.

````markdown
## Implementation report — Session 0013

### Decisions made within the spec
- **baseline-pipeline.ts:** [choices the spec did not dictate — the
  triangle-overlap test you used, file enumeration, output
  formatting, error handling structure]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### Pipeline behaviors observed
- [Which corpus models completed the pipeline, which failed and
  where, the overlap counts. Anything surprising — a model that
  should unfold cleanly but didn't, a stage that threw
  unexpectedly.]

### Concerns / second-look candidates
- [Subtle corners worth a strategist eye. The deer provenance status.
  If nothing: "None."]

### Verification
- `pnpm type-check`: [result]
- `pnpm test:run`: [cumulative total — should match pre-session]
- `pnpm baseline`: [ran / docs/baseline-v1-pipeline.md written]
````

---

## Appendix C — Session log content

Create `docs/sessions/0013-sourced-model-test-corpus.md` with this
content, verbatim. Fill the handoff-block placeholders where you can;
append to "Decisions made or deferred" only if you made notable
choices not already covered.

````markdown
# Session 0013 — Sourced model test corpus

## What was attempted

Land the v2 test corpus and capture the v1-pipeline baseline against
it. The seven corpus models — four CC0 Kenney models, a low-poly
deer, two procedurally-generated convex baselines — were built and
topology-verified by the strategist beforehand; this session commits
them, documents provenance, and runs the full v1 pipeline over every
corpus model to record which unfold cleanly and which overlap.

## What shipped

- Seven v2 corpus models in `test/corpus/` — `deer.obj`, `egg.obj`,
  `ginger-bread.obj`, `croissant.obj`, `meat-sausage.obj`,
  `cylinder.obj`, `uv-sphere.obj` — all verified closed two-manifold,
  single component, genus 0, consistent winding.
- `scripts/prepare-corpus.py` — the reproducible record of how the
  sourced models were cleaned (Kenney doubled-face removal, deer
  largest-component extraction) and the baselines generated.
- `scripts/baseline-pipeline.ts` — a measurement harness that runs
  the full v1 pipeline over every corpus mesh and records pipeline
  completion plus a naive overlap count. Run via `pnpm baseline`.
- `test/corpus/PROVENANCE.md` — per-model source, license, and
  transformation.
- `docs/baseline-v1-pipeline.md` — the generated baseline: the
  failure corpus that v2's algorithm sessions measure against.

## What's next

Session 0014 — Dihedral-weighted spanning tree. Replace v1's plain
DFS with a dihedral-weighted MST over the dual graph; ADR 0004
commits the weighting heuristic. The 0013 baseline is the
before-picture: 0014 re-runs `pnpm baseline` to show the overlap
count change.

## Decisions made or deferred

- **The baseline overlap check is a measurement tool, not a pipeline
  stage.** It lives in `scripts/`, is naive O(n²), and is explicitly
  distinct from the proper `polygon-clipping`-based overlap detection
  that session 0015 builds in `src/core/`.
- **The raw source downloads are not vendored.** The Kenney Food Kit
  pack and the original deer model stay untracked; only the seven
  derived corpus models are committed. `scripts/prepare-corpus.py`
  records the method.
- **The deer corpus model is the largest component of the original**
  — the original was three disconnected shells; the two antlers were
  dropped. Recorded in `PROVENANCE.md`.

## Handoff

- **Branch / worktree:** `claude/<name>` at
  `.claude/worktrees/<name>/` — fill in.
- **Commits:** `<short-sha> feat: v2 test corpus and v1-pipeline baseline`
  — fill in the SHA.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` <N>
  passing (unchanged from pre-session); `pnpm baseline` ran,
  `docs/baseline-v1-pipeline.md` generated.
- **Decisions made or deferred:** baseline overlap check is a
  measurement tool not a pipeline stage; raw downloads not vendored;
  deer model is the largest component of the original. No ADR.
- **Queue / roadmap deltas:** Roadmap — 0013 → ✅, 0014 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0013 added to Sessions
  completed; Sessions planned advanced. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** None.
````
