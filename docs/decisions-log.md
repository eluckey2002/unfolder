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
