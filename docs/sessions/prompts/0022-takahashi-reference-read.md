# Session 0022 — Takahashi reference read

## Goal

Read the literature that will inform v3's cut-quality work and
produce a structured writeup at `docs/references/takahashi.md`. The
target is *concepts and lessons for v3, not transcription* — same
principle as session 0002's `paperfoldmodels` read. The writeup
becomes the spike (0023) and the optimized-recut work's grounding.

This session also folds in a small decisions-log clarification on
the cut-length metric's interpretation, per the post-0021 review
(Appendix A).

Pure docs session: no source changes, no behaviour changes.

## Context

The 2026-05-15 algorithm survey at
`docs/references/unfolding-algorithm-survey.md` named the v3 menu
— it *characterised* Takahashi as topological surgery (genetic,
single-patch), PolyZamboni as greedy cut-addition, and Export
Paper Model as blended tunable weights — but the survey was an
explicitly secondary-source landscape pass and did *not* read
those sources directly. This session does. Let the writeup say
what the algorithms actually do as found in the sources, not what
the survey said about them. 0023 (the topological-surgery spike)
sits behind it: a clean, honest writeup of what the alternatives
do is what gives the spike a chance of producing useful findings.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, run `git fetch`, ensure local
   `main` is in sync with `origin/main`, and note the current HEAD.
   Create the worktree as `session/0022-takahashi-reference-read`
   per ADR 0006. Run `pnpm install`.

2. **Set up reference sources.** Clone (or update) into the
   `references/` directory at the repo root (it is gitignored — the
   clones do not enter the repo):
   - `https://github.com/AntonFlorey/PolyZamboni` — Blender addon;
     the auto-unfold algorithm and unfoldability-visualisation are
     the study targets.
   - `https://github.com/riceroll/unfolding-mesh` — claims to
     implement Takahashi's optimized topological surgery; the most
     direct accessible expression of that algorithm.
   - `https://github.com/addam/Export-Paper-Model` — Blender addon;
     the weight-combination approach is the study target.
   - `https://github.com/rodrigorc/papercraft` — standalone tool;
     a cross-cutting data point on the standard architecture.

   The Takahashi paper itself
   (https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8659.2011.02053.x)
   is likely paywalled. Try the publisher link, ResearchGate, arXiv,
   and any preprint host; if no full-text version is accessible,
   document that and proceed from the implementations + the existing
   survey's summary. **Do not paraphrase paper content not actually
   read** — the writeup must be honest about what was read
   directly versus what comes from secondary sources.

3. **Read and study.** The focus is *what these approaches actually
   do*, *how their algorithms decide cuts*, and *what concepts/
   vocabulary they introduce that v3 should adopt or reject*. Pay
   particular attention to:
   - Takahashi (via `riceroll/unfolding-mesh` and any accessible
     paper material): what "topological surgery" concretely means
     in this implementation; whether and how a genetic algorithm
     is used; what objective function (if any) is being optimised;
     the data structures; what makes single-patch unfoldings
     feasible.
   - PolyZamboni: how its auto-unfold control flow actually works
     (the survey suggests greedy cut-addition from a connected
     start, the opposite direction from `paperfoldmodels` and our
     v2 `recut` — confirm or correct); how the
     unfoldability-visualisation is computed and rendered; how
     user-editing interacts with the algorithm.
   - Export Paper Model: how its weighting is structured (the
     survey suggests blended convex/concave/edge-length weights);
     how any randomised multi-try tactic works; what the tuning
     surface looks like to the user.
   - `rodrigorc/papercraft`: a skim only — confirm or disconfirm
     patterns observed in the others; not a primary focus.
   - Cross-cutting: terminology, data structures, key insights
     that appear across multiple implementations.

4. **Produce `docs/references/takahashi.md`.** Follow the style of
   `docs/references/paperfoldmodels.md` — readable plain-English
   explanation, concrete data structures, honest scope notes, and a
   "what we take / what we leave" section that names how v3 should
   draw on the reading. Sections to include:
   - **What it is** — per-tool brief with link, language, size,
     scope.
   - **The algorithm(s) in plain English** — Takahashi-style
     topological surgery, then PolyZamboni's greedy cut-addition,
     then the blended-weight variant. Each explained as if to
     someone who has read `paperfoldmodels.md` but not these.
   - **Data structures** — what each implementation uses.
   - **What we adopt / what we reject** — concrete recommendations
     for v3, mapped against our existing pipeline shape (we are not
     replacing the MST + greedy-recut architecture; we are
     considering refinements to the heuristic, the recut strategy,
     or both).
   - **Honest uncertainties** — what was *not* read directly; where
     the writeup is downstream of secondary sources.

5. **Add a decisions-log entry** to `docs/decisions-log.md` with
   the cut-length clarification — content in **Appendix A**,
   verbatim, appended as the newest entry.

6. **Update `docs/roadmap.md`** — flip `0022` from `⏭` (or unmarked)
   to `✅` with a one-line summary of what shipped; mark `0023` with
   `⏭`. In "Where we are now": advance "Last completed session" to
   `0022 — Takahashi reference read` and "Next planned session" to
   `0023 — Topological-surgery spike`. The doc may have drifted —
   if anchors don't match, surface and proceed.

7. **Write the session log** at
   `docs/sessions/0022-takahashi-reference-read.md` — standard
   "What was attempted / What shipped / What's next / Decisions
   made or deferred" format, ending with the handoff status block
   defined in `strategist-protocol.md` under
   `## Handoff status block (session log extension)`. The handoff
   block's `Branch / worktree` field uses the ADR-0006 naming
   (`session/0022-takahashi-reference-read`), not the
   `claude/<name>` example shown in the protocol template.

8. **Verification:**
   - `pnpm type-check` clean.
   - `pnpm test:run` passing — report the total, do not predict.
   - `pnpm build` clean.
   - `pnpm baseline` produces byte-identical `docs/baseline-pipeline.md`
     (modulo the date line) and leaves `docs/baseline-v3.md`
     untouched — no source changes, so both files should be
     unchanged.

9. **Stage and commit.** Files:
   - `docs/references/takahashi.md` (new)
   - `docs/decisions-log.md` (modified — appended entry)
   - `docs/roadmap.md` (modified)
   - `docs/sessions/0022-takahashi-reference-read.md` (new)
   - `docs/sessions/prompts/0022-takahashi-reference-read.md` (new
     — this prompt file; copy from the main checkout into the
     worktree, do not reconstruct)

   Commit message:

   ```
   docs: Takahashi reference read — topological surgery, PolyZamboni, blended weights

   Reference writeup at docs/references/takahashi.md covering
   Takahashi's optimized topological surgery, PolyZamboni's greedy
   cut-addition, and Export Paper Model's blended tunable weights —
   the menu for v3's cut-quality work. Companion to the existing
   paperfoldmodels reference; sets up the 0023 spike. Folds in a
   decisions-log clarification on the cut-length metric's
   double-count interpretation per the post-0021 review.
   ```

10. **Open a PR** against `main` via `gh pr create`. The PR template
    at `.github/pull_request_template.md` (committed by ADR 0006 /
    session 0020) is the structural home of the handoff block; read
    it to see the sections to fill — fill every section the
    template contains, do not omit any. If the template is missing,
    flag and stop before opening the PR. Body mirrors the session
    log: Summary matches "What shipped"; Verification's checkboxes
    reflect the runs above with the test total reported; Spec
    adherence/scope names any deviations; Decisions section lists
    the cut-length clarification tagged `[surfaced-and-proceeded]`
    plus any judgment calls inside the writeup; Doc coherence
    lists `docs/references/takahashi.md`, `docs/decisions-log.md`,
    `docs/roadmap.md`; Queue/roadmap deltas note the roadmap
    advance; Links include the session log, this prompt file, ADR
    0006, and the existing `unfolding-algorithm-survey.md` that this
    builds on; Squash commit message reproduces the commit message
    above.

11. **Address CI** per the must-answer rule from ADR 0006 — resolve
    each CI comment (or reply with a reasoned dismissal); the
    `verify` check must pass. Baseline guard should pass cleanly
    (no source changes). If green and no advisory comments fire,
    the PR is merge-ready — wait for Evan's squash-merge.

## Report back

An implementation report: the PR URL, files landed, the test total,
which Takahashi-paper source (if any) you were able to read directly
versus relying on secondary material, any drift in the verbatim
Appendix A (flag, do not self-correct), and anything worth a
strategist eye — especially algorithmic insights from the reading
that materially change v3's optimization menu.

---

## Appendix A — `docs/decisions-log.md` entry (verbatim, append as newest)

```
- **2026-05-15 — Cut-length metric uses double-count
  (physical-builder-effort) interpretation.** "Cut length (mm)" in
  the v3 quality metric set sums the 2D mm-length of every
  cut-classified edge across every renderable piece, which
  double-counts each shared cut. This is the physical-builder
  reading: the scissor cuts along both sides of every cut, so the
  number reflects real cutting effort. The single-count topological
  alternative (each cut summed once, comparable to unfolding
  literature) is a trivial `/2` conversion if needed; the relative
  v3 trajectory is identical either way. *Companion note:* the
  paper-efficiency metric is scale-sensitive (cube.stl 41.0% vs
  cube.obj 23.4% in the 0021 baseline — same shape, different
  source-corpus dimensions),
  so the metric set is intended for per-model v3-trajectory
  tracking, not cross-model comparison.
```
