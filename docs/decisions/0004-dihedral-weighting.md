# ADR 0004: Dihedral-weighted MST for the v2 spanning tree

## Context

ADR 0003 committed plain DFS for v1's spanning tree and explicitly
deferred "v2's spanning-tree algorithm and weighting heuristic" to a
follow-on ADR. Session 0014 is when that choice becomes acute: the
v2 corpus (session 0013) has real geometric variety — concave
low-poly models whose edges differ in length and dihedral angle —
and the v1 baseline shows plain DFS produces heavily overlapping
nets on them (croissant 259 overlapping face pairs, deer 795,
meat-sausage 166).

The spanning tree decides, for every shared edge, fold (tree edge)
or cut (non-tree edge). A weighted minimum spanning tree lets a
heuristic shape that choice. Two heuristics are on the table:

- **Edge length**, as `paperfoldmodels` uses — longer 3D edges
  preferred as folds, leaving shorter edges as the cuts that need
  glue tabs. Cleaner gluing, but indifferent to how sharply the
  surface bends.
- **Dihedral angle** — flat (near-coplanar) edges preferred as
  folds, sharp creases preferred as cuts. The `paperfoldmodels`
  writeup itself flags this as a variant worth trying ("prefer
  small-dihedral folds"). Folding along flat regions and cutting
  along sharp creases produces nets that follow the model's natural
  panels, and tends to reduce self-overlap, since sharp creases are
  where unfolded faces swing far and collide.

## Decision

v2's spanning tree is a **dihedral-weighted minimum spanning tree**.

- A new pure stage, `computeDihedralWeights(mesh, dualGraph) ->
  number[]`, produces one weight per adjacency. The weight is the
  angle between the two faces' outward unit normals,
  `arccos(clamp(dot(nA, nB), -1, 1))`, in `[0, π]`: a flat edge
  weighs ~0 (cheap to fold), a sharp crease weighs toward π
  (expensive — the MST prefers to cut it).
- `buildSpanningTree` becomes a minimum spanning tree over the dual
  graph using those weights (Prim or Kruskal — implementer's
  choice, recorded in the session log; the corpus is small enough
  that complexity does not matter). Tree edges are folds, non-tree
  adjacencies are cuts. The MST is then rooted at `root` and
  `parent[]` derived by traversing tree edges — so the
  `SpanningTree` output contract is unchanged, and the flatten and
  emit-svg stages downstream do not move.
- `buildSpanningTree`'s input signature changes to
  `buildSpanningTree(dual, weights, root?)`. ADR 0003 anticipated
  the signature staying stable; that does not survive contact with
  dihedral weighting, because the weight is geometric and the
  topological `DualGraph` carries no geometry. The output contract
  — the thing that actually protects the downstream stages — is
  what stays stable.
- The weight is the **unsigned** angle between normals: it does not
  distinguish convex (mountain) from concave (valley) creases. Both
  are "sharp" and both should be cut. Signed mountain-vs-valley
  weighting is a deferred refinement.
- A single MST — not multiple-trees-and-pick-best, a refinement the
  `paperfoldmodels` writeup raised. Naive before optimized.

## Consequences

What becomes easier:

- The weight function is one isolated, independently testable pure
  stage — refining or swapping the heuristic later touches one file.
- Nets follow the model's natural flat panels; on the v2 corpus
  this is expected to reduce — though not eliminate — self-overlap
  versus plain DFS. Session 0014's baseline re-run records the
  actual change.
- The `SpanningTree` output contract is unchanged; flatten and
  emit-svg are untouched.

What becomes harder / the costs:

- `computeDihedralWeights` assumes **consistent face winding** —
  the normal-dot heuristic is only meaningful if adjacent faces are
  wound consistently. The v2 corpus is verified consistently wound;
  a future mesh that is not would produce wrong weights. A
  winding-robust dihedral formula (via the in-plane edge-perpendicular
  vectors, independent of normal orientation) is the refinement path
  if that ever bites.
- It assumes non-degenerate faces — a zero-area face has no defined
  normal. `computeDihedralWeights` throws on one rather than
  producing a silent NaN.
- Every caller of `buildSpanningTree` updates for the new signature.

What this does NOT do:

- It does not detect or remove overlaps. Dihedral weighting only
  changes which tree gets built; the net can still self-overlap.
  Overlap detection is session 0015; automatic recut is 0016.
  Session 0014's success is measured as a change in the baseline
  overlap counts, not their elimination.

Follow-on ADRs likely:

- ADR for v2's recut strategy (session 0016).
- A possible future refinement ADR if signed mountain-vs-valley
  weighting, or multiple-trees-and-pick-best, proves worth it.
