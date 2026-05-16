# Decisions log

A running record of non-ADR decisions — the calls the strategist
makes that are real but do not rise to an Architecture Decision
Record. ADRs are for architecture choices with lasting structural
consequence; session logs capture per-session decisions; this file
captures the cross-cutting strategist calls that would otherwise live
only in chat.

Its purpose is visibility. Per the v2 retrospective's Decision 1,
more calls flow as strategist recommendations rather than forks to
Evan. This log is how those calls stay reviewable — Evan can scan what
was decided and why, without re-litigating, and flag anything he would
have called differently.

## Format

One entry per decision, newest last:

```
- YYYY-MM-DD — <one-line decision>. <Why, in a sentence or two.> <Optional: what was rejected, and why.>
```

## Process

- The strategist adds an entry when it makes a non-ADR call with
  cross-session consequence — a convention, a scoping call, a process
  choice. In the moment, not batched.
- Entries are immutable once committed, like ADRs and session logs. A
  reversed decision gets a new entry referencing the old one.
- Evan reviews this file at whatever cadence he chooses; flagging an
  entry for discussion is always open.
- A decision that grows structural consequence gets promoted to a
  real ADR; the log entry then references it.

## Log

- **2026-05-14 — The v2 retrospective is a separate companion doc,
  not a revision of `v2-complete.md`.** `v2-complete.md` stands as the
  phase summary; `v2-retrospective.md` is the process-and-relationship
  retrospective. Establishes the per-phase convention: `-complete.md`
  is what shipped, `-retrospective.md` is how we worked.
- **2026-05-14 — The GitHub remote is public.** The project's stated
  identity is eventual public release; building in the open from v3
  is consistent with it. The repo name `unfolder` stays the working
  name; the final-name decision and others remain deferred to v6.
  Rejected: private-until-later, which preserved more optionality but
  forced nothing and matched a more cautious posture than the
  project's own identity.
- **2026-05-15 — Handoff status blocks drop the `<short-sha>` field
  and carry the commit subject only.** Short SHAs are redundant once
  the subject identifies the commit unambiguously, and shaving the
  field tightens the template the strategist consults at session
  start. Surfaced by the v2 retrospective's machinery prune.
- **2026-05-15 — The `test/corpus/OBJ format/` provenance archive is
  gitignored, not committed.** The folder holds source models for the
  test corpus and is not imported by any code path; tracking it would
  add ~megabytes of binary diff with no consumer. The audited corpus
  files in `test/corpus/` remain committed.
- **2026-05-15 — v3 quality metric set.** The v3 baseline tracks
  five measures, each tied to a v3 improvement vector: **piece
  count** (fragmentation — targeted by optimized recut), **total
  cut length in mm** (assembly effort — smarter cuts), **tab
  count** (assembly effort — smart tab placement), **paper-area
  efficiency** (paper waste — packing and scale), and **page
  count** (output size). Foldability proxy is deferred until a
  clean measurable definition emerges. Captured frozen in
  `docs/baseline-v3.md`; instrumented in
  `scripts/baseline-pipeline.ts`; both files CI-guarded with the
  `baseline-change` label as the intentional-regeneration escape
  hatch.
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
- **2026-05-16 — PDF export removed from v3 scope.** SVG output
  was deemed sufficient for v3's quality bar; PDF carried to v5
  if/when needed. Removes one v3 session and the pdf-lib
  dependency probe from the v3 arc. Updates the file-loader UI
  scope from "download SVG/PDF" to "download SVG" only. Strategist
  call; cited "to speed v3 up."
- **2026-05-16 — U4 Pathfinder `runPipeline()` orchestrator landed
  alongside cut-removal in session 0025.** Cut-removal collapsed
  two stages anyway (buildSpanningTree + recut → runCutRemoval),
  making the call-site refactor unavoidable. Doing it as one
  `runPipeline` is cleaner and surfaces every intermediate stage
  for callers that want a slice. No new ADR — the orchestrator is
  a structural seam, not an algorithmic decision; ADR 0001's
  pipeline contract is unchanged in spirit (pure stages, no I/O),
  just wired through a single entry point.
- **2026-05-16 — Hardened `detectOverlaps` with try/catch
  defensive against `polygon-clipping` exceptions.** Cut-removal
  output produces near-coincident shared edges (rigid-transform
  FP imprecision) that throw "Unable to complete output ring" in
  `polygon-clipping.intersection`. Variant C's internal anyOverlap
  already catches these as conservative overlap rejections;
  `detectOverlaps` now catches them as non-overlap (treat as
  shared-edge, not overlap). Asymmetric semantics by design: for
  merge admission, conservative-reject prevents bad merges; for
  post-hoc verification, optimistic-skip avoids false alarms.
  Real overlaps with interior intersection still take the normal
  path.
- **2026-05-16 — Smart-tab-placement weights (session 0026):
  `W_LENGTH=1.0`, `W_OVERLAP=1000`.** Deliberately one-sided —
  overlap is a hard constraint, edge length is a soft preference.
  Tie-breaks to `adj.faceA` when both candidate sides have the
  same score (preserves the symmetric-fixture test's existing
  expectation). Values are tunable starting points, not an
  architectural commitment; if a future session finds a better
  weighting, the constants change in `tabs.ts` and a follow-up
  entry lands here.
- **2026-05-16 — Three smart-tab signals deferred (session 0026).**
  The pre-0025 plan listed `sideClearance` (post-paginate spatial
  distance to other pieces) and `isConcaveSide` (3D edge concavity
  preference); both deferred — `sideClearance` requires
  post-paginate information that tabs.ts doesn't have, and
  `isConcaveSide` turned out to be muddled (concavity is a 3D edge
  property, not a side-of-2D-edge property). Replaced by
  `tabOverlapsOwnPieceInterior` which is pre-paginate-tractable.
- **2026-05-16 — Plan's "tab overlap (own) reads 0 on every row"
  verification gate was wrong (session 0026).** Actual measurement
  after smart placement lands: 133 of 749 tabs self-clip across 7
  of 11 models (deer 91, meat-sausage 11, ...). These are cases
  where BOTH candidate sides overlap; the score-driven rule ties
  and tie-breaks to faceA — same placement the old rule produced.
  Smart algorithm is monotonically no-worse than old; can't
  manufacture clean sides where geometry doesn't offer one. The
  `tab overlap (own)` column is now an informational regression
  guard, not a 0-or-fail gate. A finer area-based signal (replace
  the boolean with intersection area) would discriminate
  "less crowded" from "more crowded" and likely reduce the 133
  figure; queued as a follow-up.
- **2026-05-16 — v4 headline UX locked: "feedback-driven
  iterative unfolding" (B+C hybrid from the v4 user-research
  spike).** Spike inputs (competitive scan, five synthetic
  persona interviews, synthesis) initially recommended
  Hypothesis B alone (buildability-first preview); the director's
  reframe in brainstorming was that B alone is *defensive* —
  retreating from a model the user chose — and the v4 user-goal is
  reaching an excellent unfold of the model they wanted. The
  hybrid resolves it: buildability badges become entry points for
  region re-unfold rather than warnings against the chosen model;
  default user posture is accept-suggestion, not author-constraint.
  Power users keep manual pin/constrain. Region re-unfold is the
  load-bearing algorithm risk and will need a dedicated spike
  before v4 commits. Findings live at
  `docs/spikes/2026-05-16-v4-user-research/findings.md`; the v4
  design spec proper is the next strategist deliverable
  (currently dangling — drafted in the in-flight brainstorm,
  never written to disk).
- **2026-05-16 — Foldability classifier uses two explainable
  metrics with per-class aggregation.** Per-piece label `clean` /
  `caution` / `warn` from (1) smallest face-corner angle and (2)
  smallest edge length, both measured post-paginate. Aggregation:
  any single warn → warn; any two caution trips → warn; one
  caution trip → caution; clean otherwise. Picked for
  explainability (one-line user fix suggestion possible) and
  survival into v4's interactive buildability badges per the
  2026-05-16 v4 user-research findings. Seed thresholds: angle
  caution <30° / warn <15°; edge caution <5 mm / warn <2 mm; held
  without tuning — platonic solids + uv-sphere all classify clean,
  spread across the corpus is meaningful (7/4/19). Diameter /
  oversized-piece signal considered and dropped: paginate's global
  rescale already manifests oversized pieces through tiny
  post-rescale edges, captured by the edge-length signal.
