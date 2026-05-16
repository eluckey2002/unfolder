# Session 0023 — Topological-surgery spike

## Goal

Characterise the three cut-strategy alternatives recommended by
`docs/references/takahashi.md` against v3's baseline. The aim is not
to pick a winner; it is to produce a **menu** — per-variant
strengths, per-model sweet spots, recommended default, opt-in paths
for the others, and what natural user parameters each exposes — so
the v3 algorithm sessions that follow have grounded direction.

This is the project's **first spike**. Spike conventions are
established this session and named below; subsequent spikes follow
the same pattern.

The deliverables: three proof-of-concept implementations under
`spikes/`, metrics on the 11-model corpus, SVG output per variant
per model, a side-by-side HTML comparison page, and a structured
findings document under `docs/spikes/`. Plus three small
doc-coherence updates (roadmap, queue, decisions-log).

## Context

`takahashi.md` (committed in session 0022) reads three sources
directly — Takahashi's paper, PolyZamboni's source, Export Paper
Model's source — and recommends three things worth trying against
v2's pure unsigned-dihedral MST + greedy cut-addition recut:

1. **Vertex-curvature pre-flatten guard** — per Takahashi, every
   hyperbolic vertex (corner-angle sum > 2π) needs ≥2 incident
   cuts; every elliptic vertex (sum < 2π) needs ≥1. A purely
   geometric necessary-condition check that can run before any
   unfolding attempt.
2. **Blended convex/concave/edge-length weights** — per Export
   Paper Model. v2 uses one signal (unsigned dihedral); the blend
   exposes separate convex- and concave-angle terms plus a length
   term, which the survey and the source read both suggest behave
   better on concave organic shapes.
3. **Greedy cut-removal recut** — per PolyZamboni (now corrected;
   the earlier survey had this as "cut-addition" — see
   `takahashi.md` for the correction). Start with every edge cut
   and iteratively *fold edges back* one at a time, keeping a fold
   if the resulting piece still unfolds cleanly. Opposite control
   flow from `paperfoldmodels` and our v2.

The spike implements each at proof-of-concept polish, runs them
against the corpus, captures both metric data and SVG output, and
produces a findings doc that recommends what v3 should adopt and
how each could surface to users in v4.

This is also a **time-boxed** session — see Task 12.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, run `git fetch`, ensure local
   `main` is in sync with `origin/main`, and note the current HEAD.
   Create the worktree as `spike/topological-surgery` per ADR 0006
   (note the `spike/` prefix — first time using it). Run
   `pnpm install`.

2. **Create the spike directories.** This session establishes the
   convention; both directories are new:
   - `spikes/<YYYY-MM-DD>-topological-surgery/` at the repo root —
     committed (so future readers can inspect what was tried), but
     outside `src/` (so it is clearly not production code).
   - `docs/spikes/` — the home for spike findings docs, mirroring
     `docs/audits/`. Create it.

   Compute the date string once here (UTC, `YYYY-MM-DD`) and reuse
   that exact string everywhere it appears in this prompt — the
   spike directory, the SVG subdirectories, the findings-doc
   filename. The exact slug — `topological-surgery` — matches the
   branch name minus the type prefix.

3. **Implement Variant A — vertex-curvature pre-flatten guard.**
   The deliverable is a function under
   `spikes/<date>-topological-surgery/variant-a-curvature/` that:
   - Computes per-vertex curvature classification from the mesh
     (hyperbolic / elliptic / parabolic, by corner-angle sum).
   - Inspects the v2 baseline's spanning tree (which edges are
     folds, which are cuts) and checks the Takahashi necessary
     condition at every vertex.
   - Reports per-model: how many vertices violate the condition,
     and which.

   Variant A is *diagnostic on top of v2*: it does not change the
   pipeline; it tells us whether v2's spanning trees already happen
   to satisfy the curvature condition (in which case the guard is
   "free correctness reassurance") or whether they routinely
   violate it (in which case enforcing the guard during spanning
   tree construction would be a meaningful v3 algorithmic change).
   The implementation may reuse `src/core/*` modules freely as
   read-only dependencies.

4. **Implement Variant B — blended weights.** Under
   `spikes/<date>-topological-surgery/variant-b-blended/`:
   - A new weight function `computeBlendedWeights(mesh, dual)
     → number[]` that returns, per dual-graph edge, a linear
     combination of convex-angle, concave-angle, and edge-length
     contributions. Convex vs concave is determined by the *sign*
     of the dihedral angle (face normals turning outward vs
     inward). v2's `computeDihedralWeights` produces an *unsigned*
     dihedral; if `src/core/dihedral.ts` does not expose the
     signed value, compute it locally inside the variant — **do
     not modify `src/core/`**.
   - A pipeline runner that swaps v2's `computeDihedralWeights` for
     `computeBlendedWeights`, runs the rest of the pipeline
     unchanged, and measures the same v3 baseline metrics.
   - Pick starting coefficients yourself (e.g. equal weighting,
     1/1/1, or favouring length with 0.5/0.5/1.0) and *report what
     you used*. Tuning is not in scope; documenting the choice and
     surfacing sensitivity is.

   Read the existing `computeDihedralWeights` in `src/core/dihedral.ts`
   to ground the signature and integration pattern — do not assume
   the API from memory.

5. **Implement Variant C — greedy cut-removal recut.** Under
   `spikes/<date>-topological-surgery/variant-c-cut-removal/`:
   - A new recut function that takes the dual graph and (instead of
     the v2 cut-addition approach) starts with *every* dual-graph
     edge classified as cut, then iterates over edges and folds
     each one back if doing so does not introduce an overlap in any
     resulting piece's unfolding. Order of iteration is up to you
     (an obvious choice is dihedral-angle-sorted, or descending
     edge length); document what you picked.
   - A pipeline runner that uses this in place of v2's recut path
     (which runs MST → flatten → overlap → recut). The cut-removal
     approach replaces *both* the spanning tree step and the recut
     step with a single greedy fold-acceptance pass — read v2's
     `src/core/spanning-tree.ts` and `src/core/recut.ts` first to
     understand the contracts your variant needs to satisfy
     downstream (flatten, tabs, paginate, emit still need a tree
     and pieces).

   **Partial-completion fallback.** This is the most invasive of
   the three variants and the most likely to consume budget. If
   producing tree-shaped output that feeds the downstream stages
   (flatten / tabs / paginate / emit) proves non-trivial, *stop at
   the algorithm core* — report piece count, internal overlap-free
   status, and timing only; skip tabs / paginate / SVG / paper
   efficiency for this variant; note clearly in the findings doc
   that Variant C is partial. The variant's findings entry should
   reflect what the algorithm *does* well or poorly, even without
   the full downstream chain. Time-box accordingly — see Task 12.

6. **Build the spike runner.** A single TypeScript entry point
   under `spikes/<date>-topological-surgery/run.ts`. The reference
   pattern is `scripts/baseline-pipeline.ts` (invoked via
   `pnpm baseline` in `package.json`) — read that first; the spike
   runner mirrors its structure (corpus discovery, per-model loop,
   per-row table output). The metric set is exactly what
   `docs/baseline-v3.md` records (the frozen v3 baseline) — read
   it first to know the column shape. The runner:
   - Iterates the same 11 corpus models that `scripts/baseline-pipeline.ts`
     uses (same pattern: `readdirSync` + `extname` filter over
     `test/corpus/`).
   - Runs each variant on each model.
   - Captures, per (variant, model): piece count, total cut length
     (mm — using the same double-count convention as the v3
     baseline, per the cut-length decisions-log entry), tabs, paper
     efficiency, page count, *and* wall-clock time per variant.
   - Emits SVG output per variant per model into
     `spikes/<date>-topological-surgery/svg/<variant>/<model>/`
     (one SVG per page if multi-page).
   - Writes a markdown summary table under
     `spikes/<date>-topological-surgery/results.md` — three tables,
     one per variant, with the v2 baseline numbers alongside for
     reference (copy them from `docs/baseline-v3.md`).

   Add a `pnpm spike` script in `package.json` that invokes this
   runner via `vite-node` (mirroring `pnpm baseline`'s pattern in
   `package.json`).

7. **Build the comparison HTML page.** At
   `spikes/<date>-topological-surgery/comparison.html`. A single
   static page that, per corpus model, shows the v2-baseline SVG
   alongside Variant A / B / C SVGs side-by-side (a grid or
   per-model row, your call — readability is the requirement). Use
   plain HTML + a small amount of CSS; no JS framework. The
   relative paths to the SVGs are local to the spike directory.
   The page is the human-judgment surface — the findings doc
   references it as "open this and look."

8. **Write the findings document** at
   `docs/spikes/<YYYY-MM-DD>-topological-surgery.md`. Use the date
   from Task 2. Sections (this is the structural intent; exact
   wording is yours):

   - **Goal** — one-paragraph statement of what the spike tried
     and what counts as "found something."
   - **Setup** — corpus used, metrics measured, what the v2
     baseline is.
   - **Variant A — Vertex-curvature guard** — what was built,
     numeric results, observations, and the key question: do v2's
     spanning trees already satisfy the Takahashi condition or
     not? Answer drives whether the guard belongs in v3 as
     enforcement or just diagnostic.
   - **Variant B — Blended weights** — same structure. What
     coefficients were used, what the numbers showed, where the
     blend visibly helps and where it doesn't.
   - **Variant C — Cut-removal recut** — same. What iteration
     order was used, what trade-offs surfaced.
   - **Cross-variant comparison** — a master table or matrix:
     model × variant × headline metrics. Note per-model sweet
     spots if any emerge.
   - **Visual judgment surface** — a single paragraph pointing at
     `comparison.html` and naming what to look for.
   - **Recommendations for v3** — *menu, not tournament*. For each
     variant: adopt / opt-in / drop, and why. Recommend a default
     algorithm for v3 to ship. Note per-model sweet spots that
     argue for keeping multiple variants accessible.
   - **Parameters each variant naturally exposes** — for v4's
     future UI work, name the knobs each algorithm has (e.g. the
     blend coefficients for Variant B, the iteration order for C).
   - **Honest limitations** — what was *not* tested (e.g.
     parameter tuning, larger meshes, pathological inputs); how
     much confidence to put in the per-variant verdicts.
   - **Ideas not tested (parked for future spikes)** — explicitly
     name: force-directed unfolding (the rigid-body-with-hinges
     idea, energy-based relaxation of the discrete cut-selection
     problem; strong v4-UX fit; queued separately as `[research]`);
     Steepest Edge for convex inputs; tabu search; progressive
     mesh approximation. One line each.

9. **Update `docs/roadmap.md`** — three changes:
   - In "Where we are now": advance "Last completed session" to
     `0023 — Topological-surgery spike` and "Next planned session"
     to `0024 — Optimized recut (informed by the 0023 spike)`.
   - In the v3 session plan: flip `0023` from `⏭` to `✅` with a
     one-line summary of what shipped (the menu + findings doc +
     visual comparison surface); mark `0024` with `⏭`.
   - **Add a new sketched session entry to the v3 plan**, per
     **Appendix A** (verbatim) — the file-loader UI is now a known
     upcoming v3 session.

   The doc may have drifted from the strategist's last read — if
   any anchor does not match (including Appendix A's stated
   positioning "between the audit-visualization and v3-integration
   entries"), surface it and proceed using the intent above.

10. **Add a queue entry** to `docs/queue.md` for the force-directed
    research idea — content in **Appendix B**, verbatim, appended
    as the newest item.

11. **Add a decisions-log entry** to `docs/decisions-log.md` for
    the v4-precursor file-loader scope call — content in
    **Appendix C**, verbatim, appended as the newest entry.

12. **Time-box discipline.** This is a spike. If any single variant
    has consumed more than ~40% of your session budget without
    producing a runnable result, **stop implementing it and
    document what was tried in the findings doc** as "Variant X —
    partial, incomplete." Partial spike findings with honest annotation are
    valuable; a full spike that ran out of time mid-Variant-C and
    has nothing written down is not. The findings doc, the
    comparison page, and the runner taking at least *some* variants
    to completion is the floor of usefulness.

13. **Write the session log** at
    `docs/sessions/0023-topological-surgery-spike.md` — standard
    "What was attempted / What shipped / What's next / Decisions
    made or deferred" format, ending with the handoff status block
    defined in `strategist-protocol.md` under `## Handoff status
    block (session log extension)`. The handoff block's `Branch /
    worktree` field uses the ADR-0006 naming
    (`spike/topological-surgery`).

14. **Verification:**
    - `pnpm type-check` clean — spike code under `spikes/` must
      type-check. Use of `any` is acceptable in spike code where
      precise typing is friction; document any such use in the
      relevant variant's section.
    - `pnpm test:run` passing — report the total. Spike code does
      not need unit tests (it's throwaway by definition); the
      existing test suite must still pass.
    - `pnpm build` clean. Default: exclude `spikes/` from
      `tsconfig.json`'s build include so spike code does not enter
      the production build. Note in the report if you had to
      adjust the tsconfig.
    - `pnpm baseline` produces a byte-identical
      `docs/baseline-pipeline.md` (modulo the date line) and leaves
      `docs/baseline-v3.md` untouched — the spike does not modify
      `src/` or the live baseline.
    - `pnpm spike` runs cleanly end-to-end and produces all
      expected outputs (results.md, SVGs, comparison.html).

15. **Stage and commit.** Files (the full list may vary slightly
    depending on what shipped per Task 12):
    - `spikes/<date>-topological-surgery/**` (new, multiple files)
    - `docs/spikes/<date>-topological-surgery.md` (new)
    - `package.json` (modified — `pnpm spike` script)
    - `docs/roadmap.md` (modified)
    - `docs/queue.md` (modified)
    - `docs/decisions-log.md` (modified)
    - `docs/sessions/0023-topological-surgery-spike.md` (new)
    - `docs/sessions/prompts/0023-topological-surgery-spike.md`
      (new — this prompt file; copy from main, do not reconstruct)
    - `tsconfig.json` if a `spikes/` include/exclude adjustment was
      needed.

    Commit message:

    ```
    feat: topological-surgery spike — curvature guard, blended weights, cut-removal

    First spike for the project. Implements three cut-strategy
    alternatives recommended by docs/references/takahashi.md
    (Variant A: vertex-curvature pre-flatten guard;
     Variant B: blended convex/concave/length weights;
     Variant C: greedy cut-removal recut) at proof-of-concept
    polish, runs each against the 11-model corpus and the v3
    baseline metrics, produces SVG output plus a side-by-side
    comparison page, and writes a findings document under
    docs/spikes/ that recommends v3 adoption paths and per-variant
    user-facing parameters. Establishes spikes/ and docs/spikes/
    conventions. Folds in roadmap, queue, and decisions-log
    updates.
    ```

16. **Open a PR** against `main` via `gh pr create`. The PR
    template at `.github/pull_request_template.md` is the
    structural home of the handoff block; read it and fill every
    section the template contains. If the template file is
    missing, flag and stop before opening the PR. If the
    template's section names differ from the ones referenced
    below, map by intent and note the mapping in the PR
    description. Body mirrors the session log: Summary matches
    "What shipped"; Verification's checkboxes reflect the runs in
    Task 14 with the test total reported; Spec-adherence section
    names any deviations from this prompt (especially anything
    dropped per the Task-12 time-box); Decisions section lists
    the variant-specific choices (blend coefficients, iteration
    order, any `any`-typing, etc.) tagged
    `[surfaced-and-proceeded]`;
    Concerns/uncertainties/questions section flags anything the
    spike surfaced that deserves strategist attention;
    Doc-coherence section lists `docs/roadmap.md`,
    `docs/queue.md`, `docs/decisions-log.md`, plus the new
    `docs/spikes/` doc; Queue/roadmap deltas note Appendices A,
    B, C; Links include the session log, this prompt file,
    `docs/references/takahashi.md`, and the spike's findings doc;
    Squash commit message reproduces the commit message above;
    Merge-readiness checkboxes get checked once CI is green and
    all comments are addressed.

17. **Address CI** per the must-answer rule from ADR 0006 —
    resolve each CI comment (or reply with a reasoned dismissal);
    the `verify` check must pass. Baseline guard should pass
    cleanly (no `src/` changes). If green and no advisory comments
    fire, the PR is merge-ready — wait for Evan's squash-merge.

## Report back

An implementation report: the PR URL, files landed, the test
total, which variants completed and which (if any) were truncated
per the time-box, the per-variant headline numbers vs. the v2
baseline, any drift in the verbatim appendices (flag, do not
self-correct), and — most important — anything worth a strategist
eye from the reading (algorithmic surprises, recommendations that
materially change v3's optimization menu, parameters worth
exposing).

---

## Appendix A — `docs/roadmap.md` v3 session plan addition (verbatim)

Add this as a new entry in the v3 session plan, positioned near
the end of the sketched-sessions block (between the
audit-visualization and v3-integration entries — order may be
refined as v3 lands):

```
- **0029 — File-loader UI (v4-precursor).** A thin, strictly-scoped
  UI: load any STL/OBJ from disk, run the pipeline with default
  settings, render the unfolded output, and download SVG/PDF. No
  editing, no parameter controls, no interactivity beyond load and
  download — editing waits for v4. Lands after the algorithm and
  output-fidelity work so the UI exposes v3-quality output, not the
  v2 baseline. Numbering is provisional; the actual session number
  is whatever slot it falls into as v3 lands.
```

---

## Appendix B — `docs/queue.md` entry (verbatim, append as newest)

```
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
```

---

## Appendix C — `docs/decisions-log.md` entry (verbatim, append as newest)

```
- **2026-05-15 — Late-v3 file-loader UI scope.** v3 will gain a
  thin, strictly-scoped file-loader UI as its last functional
  addition (provisional slot 0029, between audit-visualization and
  v3-integration): load STL/OBJ → run pipeline with defaults →
  render → download SVG/PDF. No editing, no parameter sliders, no
  interactivity beyond load and download. Rationale: v3 already
  has UI-touching surfaces (audit visualization, PDF export), and
  without a way to load arbitrary models, v3's quality
  improvements are visible only as metrics in `docs/baseline-v3.md`
  rather than as product wins. The file-loader is a deliberate
  v4-precursor — interactive editing (click-to-edit cuts, drag
  pieces, undo/redo, parameter controls) remains v4 territory per
  the phase plan.
```
