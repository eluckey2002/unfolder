# Session 0022 — Takahashi reference read

## What was attempted

Read the literature that informs v3's cut-quality work and produce a
reference writeup at `docs/references/takahashi.md`, parallel to the
0002-era `paperfoldmodels.md` writeup. Folded in a small
decisions-log clarification on the cut-length metric's
double-count interpretation per the post-0021 review.

Pure docs session; no source changes.

## What shipped

- **`docs/references/takahashi.md`** (new). Covers, in order:
  what each tool/paper is and how much was read directly; the
  Takahashi 2011 algorithm in plain English (patch decomposition →
  GA stitching → optional Type II rearrangement) with the
  vertex-curvature local-overlap rule called out as the single most
  portable trick; PolyZamboni's actual algorithm — greedy
  cut-*removal* gated by four feasibility checks (boundary, cycle,
  size cap, overlap) plus a glue-flap collision recheck —
  *correcting* the 2026-05-15 survey's "greedy cut-addition"
  characterisation; Export-Paper-Model's deterministic linear-blend
  priority formula (convex/concave/length, defaults
  `0.5/1/-0.05`), correcting the survey's "randomly perturbing them
  to retry" line; a one-paragraph note on `papercraft` as a manual
  editor (a fourth distinct architecture point); shared data-structure
  patterns (patch-as-first-class is universal); a concrete adopt /
  try-in-spike / hold list for v3; and an honest-uncertainties
  section.
- **Takahashi 2011 paper read in full** from a publisher-hosted
  preprint at
  `http://web-ext.u-aizu.ac.jp/~shigeo/pdf/pg2011u-preprint.pdf`.
  The Wiley page is paywalled; the preprint is the same content. The
  doc cites and links the preprint.
- **`docs/decisions-log.md`** — appended verbatim from the
  prompt's Appendix A: cut-length double-count interpretation entry
  with companion note on paper-efficiency scale-sensitivity.
- **`docs/roadmap.md`** — 0022 advanced to ✅ with a one-line
  summary; 0023 marked ⏭; "Where we are now" header advanced
  (last-completed → 0022, next-planned → 0023).
- **This session log** at
  `docs/sessions/0022-takahashi-reference-read.md`.
- **The session prompt** copied into the worktree at
  `docs/sessions/prompts/0022-takahashi-reference-read.md` per the
  PR-flow convention.

## What's next

0023 — Topological-surgery spike. The takahashi.md writeup names the
spike's menu directly: try a blended convex/concave/length weight
against v2's pure unsigned dihedral; try greedy cut-removal as an
alternate recut strategy; consider the vertex-curvature
classification as a pre-flatten guard independent of the heuristic
choice. The spike is exploratory — its deliverable is a findings doc,
not a shippable stage.

## Decisions made or deferred

- **Cut-length metric uses double-count (physical-builder-effort)
  interpretation.** Recorded in the decisions log. Per Appendix A,
  appended verbatim. `[surfaced-and-proceeded]`.
- **Two corrections to the 2026-05-15 algorithm survey, surfaced in
  takahashi.md rather than amending the survey doc.** PolyZamboni
  is greedy cut-*removal* (start every edge cut, fold each one back
  if feasible), not "greedy cut-addition from a connected start."
  Export-Paper-Model is a *fully deterministic* linear weighted
  greedy join — the "randomly perturbing them to retry" line in the
  survey doesn't match the source. The survey is preserved as the
  landscape pass it was (it explicitly flagged secondary-sourceness
  in its honest-uncertainties section); takahashi.md is the
  source-verified successor. `[surfaced-and-proceeded]`.
- **Single-patch unfolding is named as "hold for later" in the
  v3 menu**, not adopted. Takahashi's paper-reported 786 s on a
  950-face mesh and the explicit ~500-face cap for hand-buildable
  papercraft put the GA's cost/benefit out of v3's likely budget.
  PolyZamboni's deliberately bounded-size components (default
  `max_faces_per_component=10`) are a more honest match for what a
  builder wants to assemble. `[surfaced-and-proceeded]`.
- **The vertex-curvature classification is named as the single most
  portable Takahashi insight** — independent of the GA, independent
  of the patch-stitching framing, applies to any cut-selection
  heuristic. Recorded in takahashi.md as an "adopt" item.
  `[surfaced-and-proceeded]`.

No ADR was written — this is a docs-only session and the calls are
strategist judgment, properly logged in the decisions log and the
takahashi.md writeup.

## Files touched

- `docs/references/takahashi.md` (new — the deliverable).
- `docs/decisions-log.md` (modified — appended cut-length entry).
- `docs/roadmap.md` (modified — 0022 ✅, 0023 ⏭, status header
  advanced).
- `docs/sessions/0022-takahashi-reference-read.md` (this file).
- `docs/sessions/prompts/0022-takahashi-reference-read.md` (the
  prompt, copied into the worktree).

## Queue / roadmap deltas

- Roadmap: 0022 advanced to ✅ with a one-line summary; 0023
  marked ⏭; status header advanced.
- Queue: no changes.

## Verification

- `pnpm type-check` — clean.
- `pnpm test:run` — 97 tests passing across 14 test files.
- `pnpm build` — clean (the existing chunk-size advisory on
  `dist/assets/index-*.js`, unchanged from prior sessions).
- `pnpm baseline` — runs clean; both `docs/baseline-pipeline.md`
  and `docs/baseline-v3.md` are byte-identical to the pre-session
  state (modulo the date line in `baseline-pipeline.md`), as
  expected for a no-source-change session.

## Handoff

- **Branch / worktree:** `session/0022-takahashi-reference-read` at
  `.claude/worktrees/0022-takahashi-reference-read/`. Created with
  the descriptive name per ADR 0006.
- **Commits:** `docs: Takahashi reference read — topological surgery,
  PolyZamboni, blended weights`.
- **Verification:** `pnpm test:run` 97 passing across 14 files;
  `pnpm type-check` clean; `pnpm build` clean; `pnpm baseline`
  unchanged (no source changes, as expected).
- **Decisions made or deferred:**
  - Cut-length metric double-count interpretation (decisions log
    entry 2026-05-15, Appendix A verbatim).
    `[surfaced-and-proceeded]`.
  - Two corrections to the 2026-05-15 algorithm survey, surfaced in
    takahashi.md rather than amending the survey.
    `[surfaced-and-proceeded]`.
  - Single-patch unfolding named as "hold for later," not adopted in
    v3's menu. `[surfaced-and-proceeded]`.
  - Vertex-curvature classification named as the most portable
    Takahashi insight, "adopt." `[surfaced-and-proceeded]`.
- **Queue / roadmap deltas:** Roadmap advanced (0022 ✅, 0023 ⏭,
  status header). No queue changes.
- **Open questions for the strategist:**
  - Does the 0023 spike scope match the "try-in-spike" list named at
    the bottom of takahashi.md (blended weight vs pure dihedral;
    greedy cut-removal as alternate recut; curvature pre-flatten
    guard)? If the spike's actual prompt narrows or broadens that
    list, takahashi.md's "What we adopt — Try in the 0023 spike"
    section is the place to update.
  - The two survey corrections are surfaced in takahashi.md but the
    survey itself is unchanged. Worth a one-line forward-pointer
    in `unfolding-algorithm-survey.md` saying "see takahashi.md for
    source-verified algorithm details and corrections to the
    PolyZamboni and Export-Paper-Model characterisations here"? Not
    done in this session; flagging for the strategist's call.
