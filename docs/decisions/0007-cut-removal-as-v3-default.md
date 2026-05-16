# ADR 0007 — Cut-removal as v3 default unfolder

**Status:** Accepted, 2026-05-16
**Supersedes:** ADR 0005 (greedy set-cover recut as default)

## Context

v2's pipeline runs `buildAdjacency → computeDihedralWeights →
buildSpanningTree → buildLayout → detectOverlaps → recut`. The MST
phase selects the lowest-total-fold-weight spanning tree; the recut
phase greedily cuts edges to split overlapping pieces (ADR 0005).
On the v2 corpus, this produces buildable output on every model
but heavily fragments concave shapes (croissant 15 pieces, deer 28,
meat-sausage 3, ginger-bread 5).

Session 0023's spike measured three alternatives from Takahashi
2011, Export-Paper-Model, and PolyZamboni:

- **Variant A** (curvature pre-flatten guard) — diagnostic only;
  zero violations on the entire corpus.
- **Variant B** (blended convex/concave/length weights) — mixed:
  croissant 15→6 (win), meat-sausage 3→2 (win), deer 28→36 (loss).
- **Variant C** (greedy cut-removal, inverted control flow) —
  dominates v2 on every concave model: croissant 15→3, deer 28→17,
  meat-sausage 3→1, ginger-bread 5→2.

The findings doc recommends Variant C as the v3 default, Variant B
as opt-in, Variant A as post-condition.

## Decision

Adopt cut-removal (Variant C) as the v3 default unfolder, replacing
the v2 MST+recut sequence as the default code path in
`runPipeline`. Variant B (`computeBlendedWeights`) is available as
an alternate weight function for `buildSpanningTree` but is not
wired into the default pipeline. Variant A (`reportCurvature`) runs
as a post-condition check after every default-path unfold.

The v2 MST+recut path remains in the codebase (`spanning-tree.ts`,
`recut.ts`, `dihedral.ts`) — unchanged, fully tested — for use by
the opt-in path and for future spikes that need v2 as a baseline.

## Status

Accepted and shipped in session 0025.

## Consequences

**Better:**
- Concave models fragment dramatically less. Per the 0023 spike:
  croissant 15→3, deer 28→17, meat-sausage 3→1, ginger-bread 5→2.
- Cut length drops 14–42% on concave models.
- Paper efficiency more than doubles on deer and ginger-bread.
- Convex models unchanged on piece count.
- Wall-clock runs faster (deer 72ms vs v2's ~400+ms).

**Cost:**
- Algorithm semantics inverted ("start fragmented, merge what's
  safe" vs "start connected, cut what overlaps").
- Numerical-robustness fallback: `polygon-clipping.intersection`
  exceptions on near-coincident edges treated as conservative
  overlap rejections. ~5–25% of merges rejected this way; piece
  counts are an upper bound.
- Variant C's iteration order (long edges first) is a fixed
  heuristic. v4 can expose it as tunable.

**Reversibility:** the MST+recut path is preserved. Switch the
default back by editing two lines in `src/core/pipeline.ts`.

## Alternatives considered

- **Variant B (blended weights) as default.** Rejected: deer
  regression (28→36) disqualifying as default.
- **Variant A as gate during spanning-tree construction.**
  Rejected: zero violations across corpus means gate would change
  nothing. Wired as post-condition instead.
- **No change (keep v2 default).** Rejected: v3 quality bar
  ("visibly competitive with Pepakura") not met by v2's
  per-concave fragmentation.
- **Force-directed unfolding.** Carried to queue as `[research]` —
  v4 candidate if Variant C underdelivers, which it doesn't.
