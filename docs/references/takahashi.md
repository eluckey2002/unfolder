# Reference: Takahashi & friends — three approaches to better cuts

Companion to [`paperfoldmodels.md`](paperfoldmodels.md). Where that
writeup ground v1/v2 in a single minimal MST-and-recut implementation,
this one grounds v3's cut-quality work — the **menu of better
heuristics** that 0023 (the topological-surgery spike) and the
optimized-recut work will pull from.

The 2026-05-15 [`unfolding-algorithm-survey.md`](unfolding-algorithm-survey.md)
named the menu from secondary sources. This doc reads the menu's items
directly: the Takahashi 2011 paper itself (preprint), PolyZamboni's
Blender source, Export-Paper-Model's Blender source, and a skim of
`rodrigorc/papercraft`. Two of the survey's confident lines turned out
to be wrong on the source — flagged below as we go.

## What's covered here

| Tool / paper | Author | Lang / size | What it contributes |
|---|---|---|---|
| **["Optimized Topological Surgery for Unfolding 3D Meshes"](http://web-ext.u-aizu.ac.jp/~shigeo/pdf/pg2011u-preprint.pdf)** (Takahashi et al., Pacific Graphics 2011) | Takahashi, Wu, Saw, Lin, Yen | 10-page paper | The core algorithmic contribution — a genetic-algorithm patch-stitcher that targets a *single* connected unfolded patch, with a vertex-curvature trick for cheap local-overlap rejection. |
| **[`riceroll/unfolding-mesh`](https://github.com/riceroll/unfolding-mesh)** | based on Takahashi | C++, ~15k lines, OpenGL/CGAL/BGL/GSL | Direct implementation of the paper. Verifies the mechanics — population 64, mutation 0.1, primary fitness coefficient 10.0, MST-via-Boost-Kruskal followed by `MSTtoST()` thresholding all match the paper. |
| **[`AntonFlorey/PolyZamboni`](https://github.com/AntonFlorey/PolyZamboni)** | Anton Florey | Python (Blender add-on), ~7.5k lines | Greedy *cut-removal* (start every edge cut, try to fold each one back), feasibility-gated by overlap and glue-flap collision. The most polished open-source low-poly tool. Also a real-time **unfoldability visualisation** worth studying for v4. |
| **[`addam/Export-Paper-Model-from-Blender`](https://github.com/addam/Export-Paper-Model-from-Blender)** | Adam Dominec | Python (Blender add-on), ~3k lines | The clearest example of a **blended tunable weight** — a linear sum of convex / concave / length terms with three user-exposed coefficients. |
| **[`rodrigorc/papercraft`](https://github.com/rodrigorc/papercraft)** | Rodrigo Rivas | Rust, standalone | A fourth point on the architecture map: a *manual* editor with no auto-unfold algorithm. Useful negative datapoint. |

The Takahashi paper text was read directly from a publisher-hosted
preprint (link above). The publisher version
([Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8659.2011.02053.x))
is paywalled; the preprint is the same content.

## The algorithm in plain English

### Takahashi 2011 — patch decomposition + GA stitching + Type II rearrangement

The paper's framing matters. Takahashi argues that the unfolding
problem has **two extreme strategies** (§3.4):

> The first is to expand the spanning tree of cut edges adaptively
> over the 3D mesh, and the second is to compose the mesh unfolding
> by iteratively merging a set of single triangular faces.

The first (Straub-Prautzsch, the lineage of `paperfoldmodels` and our
v2) "can never find such overlap-free unfoldings because we cannot
evaluate how the current set of cut edges is close to the optimal
solutions." The second has too many degrees of freedom. Their answer
is to **start in the middle**: a forest of small patches, then
intelligently stitch them.

The pipeline has three stages.

**Stage 1 — patch decomposition** (§4). Build the dual graph of the
mesh and weight every dual edge with the same minimum-perimeter
heuristic Straub-Prautzsch use:

> w(e) = (lmax − l) / (lmax − lmin)

where `l` is the corresponding mesh edge's 3D length. This is
**identical to the `paperfoldmodels` weighting** — long mesh edges get
small dual-edge weights, so they're preferred as folds. Then — and
this is the difference from `paperfoldmodels` — instead of taking the
full minimum spanning tree, *keep only dual edges below a threshold*,
producing a **forest of spanning subtrees**, one per resulting patch.
The paper tries three thresholds that disconnect 65%, 70%, and 75% of
the dual edges, and picks the one that produces the best end-to-end
result. Local self-overlaps inside each initial patch are resolved
the standard way: find an overlapping pair, walk the path between them
in the patch's tree, cut an edge on it.

**Stage 2 — GA stitching** (§5). Now the algorithm needs to merge the
patches back together along their boundary edges, picking which
boundary edge to stitch first, second, third, … so as to avoid
re-introducing overlaps. This is a combinatorial ordering problem with
no obvious greedy answer, so they use a genetic algorithm:

- **Stitchable edges.** Not every boundary edge is a candidate. A
  boundary edge is *stitchable* iff merging the two adjacent patches
  along it doesn't create a **local self-overlap** at either of the
  edge's endpoint vertices. This is decided cheaply — see "Vertex
  curvature classification" below — without actually projecting
  geometry. This radically prunes the search space.
- **Chromosome.** A permutation of stitchable-edge IDs.
- **Reordering.** When the chromosome is evaluated, the algorithm
  walks the permutation; each edge that successfully merges its two
  patches (no global overlap) is moved to the head, each one that
  fails (would overlap) is pushed to the tail. The "successful prefix"
  is what actually got applied; the "failed suffix" is along for the
  ride.
- **Fitness function.** The objective being *minimised* (Eq. 1):

  > f = λp Np + λl Rl + λm Rm + λb Rb

  where Np = number of remaining patches; Rl = (faces excluded from
  the largest patch) / (total faces); Rm = relative exterior margin
  on the paper sheet; Rb = average boundary-edge distance between
  duplicated cut-edge pairs / total boundary edges. The default
  weights are **λp = λl = 10·λm = 100·λb** — patch count and
  largest-patch dominate, then paper coverage, then assembly
  ergonomics. The Rl term is essential; without it the GA gets stuck
  in equilibrium states where multiple patches share roughly equal
  face counts (paper §7.3, Fig. 12(b)).
- **Crossover and mutation.** Designed for the "successful prefix /
  failed suffix" structure. Crossover swaps within the *ambiguous
  middle* (edges in neither parent's success set nor either's failure
  set), preserving partial orders. Mutation swaps a random successful
  ID with a random failed ID. Probabilities **0.9 crossover / 0.1
  mutation**, **population 64**, half the population replaced each
  generation.

**Stage 3 — optional rearrangement** (§6). If the GA terminates with
N > 1 patches still left, the paper applies a "Type II" topological-
surgery operation (Fig. 9): merge two patches across a boundary edge
*regardless* of overlap, find an overlapping face pair in the merged
patch, cut a different edge on the path between them. Iterate until
N = 1. Table 1 in the paper shows this stage closes the gap from
"GA didn't quite get to 1" to "1 patch" in 3-of-7 of their test
meshes.

**The vertex-curvature classification** (§3.3, the key insight for
performance). Classify each mesh vertex by **Gaussian curvature** =
2π − Σ(corner angles around the vertex):

- **Hyperbolic vertex** (negative curvature, total > 2π) — has to
  have **≥ 2 cut edges incident** to lay flat without self-overlap.
- **Elliptic vertex** (positive curvature, total < 2π) — needs only
  **≥ 1 cut edge incident**.

Maintaining a per-vertex cut count and checking it against this rule
rejects local self-overlaps **without any 2D projection**. This is the
trick that makes the GA tractable: the inner loop almost never has to
project geometry to test stitchability. The exception (paper §4.2):
when corner angles around a hyperbolic vertex sum to > 3π or two cut
edges span a very small angle, this rule under-counts and projection
is required — but the paper says these cases are rare in practice.

**Empirical results** (Table 1). Applied to seven meshes ranging from
312 (horse) to 950 (fish) faces, **a single-patch unfolding was always
achievable** if all three threshold settings were tried, sometimes
needing the optional rearrangement stage. Times: bunny-348 in 32 s,
fish-950 in 786 s. Beyond ~1000 faces (mannequin-1376) the algorithm
fails to find a single patch — the paper recommends a 500-face cap
for hand-buildable papercraft.

### PolyZamboni — greedy cut-**removal**, axis-sorted, multi-feasibility

[`autozamboni.py`](https://github.com/AntonFlorey/PolyZamboni/blob/main/polyzamboni/autozamboni.py),
93 lines, is the entire control flow. The 2026-05-15 survey called this
"greedy cut-addition from a connected start." **That's wrong in
direction.** The actual algorithm goes the *other* way:

1. Start by marking every "free" edge (not user-locked) as a cut.
   The mesh starts maximally fragmented — every face is its own patch.
2. Sort all auto-cut edges by **alignment to a target axis** (Z, Y, or
   X). Edges most aligned go first. The intent is to keep cuts
   roughly parallel to a chosen direction (paper grain, viewer line of
   sight, etc.).
3. Walk the sorted list once. For each edge, **try to remove the
   cut** (turn it into a fold) and check four feasibility conditions
   in order:
   1. **Boundary edge?** Skip — nothing to remove.
   2. **Cyclic component?** Would removing this edge create a cycle
      in the unfolding tree? Skip.
   3. **Size limit.** Would the resulting merged component exceed
      `max_faces_per_component` (default 10)? Skip.
   4. **Overlap.** Compute the affine 2D transform that aligns the
      two touching components, then test all triangle pairs from both
      for intersection. If any overlaps and the user's quality
      setting isn't `ALL_OVERLAPS_ALLOWED`, skip.
4. After the cut is removed, re-test for **glue-flap collisions** in
   the merged component; if any and the quality setting is
   `NO_OVERLAPS_ALLOWED`, revert.

That's it. **Single pass, no backtracking, deterministic given the
sort order.**

This is genuinely a different shape from Takahashi: same "start
fragmented, merge" direction, but with a *fixed sort order* instead of
a GA, and a *bounded* component size as a hard cap. PolyZamboni isn't
trying to find a single connected patch — it deliberately wants the
output to be many small, easy-to-handle pieces.

The **unfoldability visualisation** is the other notable contribution.
At every moment the user can see, in the 3D viewport (`drawing.py`):

- User-cut edges (red dashed), locked edges (green), auto-cut edges
  (teal dashed).
- **Region quality colouring:** every connected component is tinted
  by health — green for `PERFECT_REGION`, yellow for
  `BAD_GLUE_FLAPS_REGION`, orange for `OVERLAPPING_REGION`, red for
  `NOT_FOLDABLE_REGION` (cyclic).
- **Glue-flap colouring:** flap outlines coloured by whether they
  collide with the face they'll glue to — petrol = clear, bordeaux =
  collision.

This is a real-time live-feedback model: the user sees the
*consequences* of every edit in the same view they make the edit in.
The structural lesson for v3/v4 is that the unfoldability check is
*the* thing the user needs feedback on, and it should not be
hidden behind a button — it should be the default render.

### Export Paper Model — blended-weight greedy join

[`unfolder.py`](https://github.com/addam/Export-Paper-Model-from-Blender/blob/master/unfolder.py),
1253 lines, contains the algorithm. The control flow is a **greedy
edge-priority join** — also a "start fragmented, merge" pattern, but
sorted by a *content-aware* weight rather than axis alignment.

1. Create one Island per face.
2. Score every edge with a priority value (formula below).
3. Sort edges ascending by priority.
4. Walk the sorted list. For each edge, attempt to merge the two
   adjacent islands; the merge succeeds if the resulting 2D layout
   has no self-intersections *and* fits within the user-set page
   size. Successful merges remove an island; failures leave the edge
   as a cut.
5. After all edges are processed, finalise islands and pack them onto
   pages with a bin-packing routine (`nesting.py`).

The **priority formula** (`Edge.generate_priority`,
[`unfolder.py:657-664`](https://github.com/addam/Export-Paper-Model-from-Blender/blob/master/unfolder.py#L657)):

```python
if angle > 0:
    self.priority = priority_effect['CONVEX'] * angle / pi
else:
    self.priority = priority_effect['CONCAVE'] * (-angle) / pi
self.priority += (self.vector.length / average_length) * priority_effect['LENGTH']
```

A **linear sum of three terms**, with the dihedral term split by
sign. The defaults are `CONVEX=0.5, CONCAVE=1, LENGTH=-0.05`. Each
coefficient is exposed directly in the operator's UI as a
FloatProperty, so the full (CONVEX, CONCAVE, LENGTH) coefficient
space is the user's tuning surface — there's no single "style" knob.

**No randomisation, no multi-trial.** The 2026-05-15 survey recorded
"randomly perturbing them to retry is a documented tactic"; that
characterisation does not match this codebase. The algorithm is fully
deterministic given a fixed mesh and fixed coefficients.

A subtlety worth recording but not relying on: lower priority is
considered first for joining, and the *interpretation* of which
coefficient sign means "prefer to fold" vs "prefer to cut" depends on
this direction. The defaults concretely mean: short edges have lower
priority (because of the `-0.05 * length / avg`) and so are joined
first; concave folds (coef 1) get higher priority than convex of the
same magnitude (coef 0.5) and so are joined later, i.e. *more likely
to remain cuts*. That's the opposite of what one might intuitively
prefer (hide cuts in concave creases) — adopting the formula doesn't
mean adopting the defaults.

### `papercraft` (Rust) — manual editor, no algorithm

Worth a sentence: `rodrigorc/papercraft` has *no auto-unfold
algorithm*. Faces start as isolated islands; the user toggles edges
between cut and fold by clicking. This is a fourth distinct point on
the architecture map and a useful corrective: not every serious
papercraft tool tries to automate the cut decision. (For our
trajectory it's not influential — v3 is still about producing better
output without user input — but it's a reminder that the algorithm
*can* be the user, and probably will be in v4.)

## Vertex curvature classification — the borrowable trick

The single most portable idea from the Takahashi paper, separable from
the GA and the patch-stitching framing, is the **local-overlap
rejection rule**:

> A vertex with corner-angle sum > 2π must have ≥ 2 incident cut
> edges. A vertex with corner-angle sum < 2π must have ≥ 1.

This is a *property of the cut/fold assignment* and a mesh's vertex
geometry — completely independent of which heuristic chose the cuts.
Maintaining a per-vertex cut count and checking the rule **before**
attempting to flatten gives a constant-time-per-edge filter for one
class of overlaps, with zero geometric computation. It applies equally
to MST-then-recut, greedy join, greedy removal, or GA. It would slot
into our v2 pipeline as a cheap pre-flatten validation.

(The exception case — corner sum > 3π or two cuts at near-zero angle
around a hyperbolic vertex — does require projection, but the paper
reports it's rare and it doesn't undermine the main filter's value.)

## Data structures — what each implementation uses

- **Takahashi 2011 (paper / `unfolding-mesh`).** Dual graph (CGAL),
  Boost Graph Library for spanning subtrees, vertex-curvature
  classification per mesh vertex, set of patches each represented as a
  spanning subtree of dual edges, GA chromosome = ordered list of
  stitchable-edge IDs.
- **PolyZamboni.** Central object is `PaperModel` holding the bmesh,
  an `edge_constraints` dict (edge index → `cut`/`glued`/`auto`),
  and a dict of `ConnectedComponent` objects. Each component carries
  a face set, per-face 2D coords, an affine transform to the
  unfolding root, and glue-flap geometry & collision info. Persisted
  to Blender custom properties; reconstructed on load.
- **Export Paper Model.** A wrapper layer over Blender's `bmesh` —
  `Mesh` → `Edge` (with cached dihedral angle and priority) → `Island`
  (face/edge/vertex sets in 3D and 2D, with a circular linked list of
  `UVEdge` for boundary traversal). 2D edges carry a `flipped` flag to
  handle face-orientation mismatches.

The recurring pattern across all three: the working representation is
**"a set of patches, each with its own 2D layout"**, not "the global
unfolded mesh." Patch identity carries through the whole pipeline.
Our v2 does this implicitly via `RecutResult` / `RenderablePiece`;
v3 likely wants to make patch-as-first-class-entity more central.

## What we adopt — concrete additions to v3's menu

**Adopt** (low cost, high relevance):

- **The vertex-curvature classification as a pre-flatten guard.**
  Cheap, principled, applies to any heuristic. Worth wiring up
  independently of which spanning-tree heuristic ends up winning.
  Belongs in `src/core/` as a pure predicate over `(Mesh3D, Set<Edge>)`.
- **The framing of patches as first-class.** Even before we change the
  algorithm, our types should carry "patch identity" through the
  pipeline rather than reconstructing it from connected-components
  passes. PolyZamboni's `ConnectedComponent` and Export Paper Model's
  `Island` are both this shape, and the lift is small.
- **Per-edge `priority` as a single-axis score.** Whether we end up
  with a linear blend (Export Paper Model) or something else, having
  a single scalar score per dual edge is a clean abstraction that
  makes the heuristic swap-out a one-function change.

**Try in the 0023 spike** (medium cost, may pay off):

- **A blended convex/concave/length weight as the v3 spanning-tree
  heuristic**, replacing v2's pure unsigned dihedral. Defaults from
  Export Paper Model are a reasonable starting point but should be
  re-derived against our corpus's piece-count metric — the right
  numbers for a Blender user base aren't necessarily the right numbers
  for our pipeline.
- **Greedy cut-removal as an alternate recut strategy.** PolyZamboni's
  loop is simple and orthogonal to v2's MST-then-recut. Worth
  measuring whether it produces better piece counts on our concave
  corpus models, since it has a different inductive bias (start
  fragmented, merge what's safe — the opposite of "start connected,
  cut what's necessary").
- **The unfoldability visualisation pattern** for v4. Live region
  colouring by foldability is the right default render, not a
  diagnostic mode.

**Hold for later** (high cost, uncertain payoff):

- **Takahashi's full GA.** The single-patch goal is genuinely
  attractive but the paper's own data caps it at ~500 faces and the
  optimisation cost is real (786 s for fish-950). For our corpus and
  our pipeline budget, a careful greedy heuristic plausibly gets
  most of the win at a fraction of the cost. The spike (0023) should
  measure — but the prior on "ship the GA" is low.
- **Stage 3's Type II rearrangement.** Useful only if we're chasing
  single-patch unfoldings. If we're not, irrelevant.

## What we reject

- **Single-patch as a goal.** The Takahashi paper's framing assumes
  it's strictly better. Our corpus and ship-state target are different
  — Pepakura-competitive output for builders, not maximally elegant
  topology — and PolyZamboni's deliberately *bounded-size* components
  (default cap 10 faces) are a more honest match for what a builder
  actually wants to assemble. Fewer pieces is better, all else equal,
  but "fewer" is not "one."
- **Axis-aligned cut sorting.** PolyZamboni's primary sort key
  (alignment to a chosen world axis) is a UX concession to manual
  editing — it gives the user a knob that produces visually
  predictable cuts. For our automated pipeline it's not a useful
  signal; we have no preferred axis.
- **Manual-editor architecture (`papercraft`).** Right product, wrong
  phase. v4, not v3.

## Honest uncertainties

- **The `riceroll/unfolding-mesh` implementation matches the paper
  on every parameter inspected** (population 64, mutation 0.1,
  fitness coefficient 10.0 for patch count, MST via Boost-Kruskal
  followed by `MSTtoST()` weight-thresholding, saddle-vertex
  ≥3-edge constraint generalising the hyperbolic-vertex rule). One
  divergence worth knowing: the GA's per-individual evaluation
  (`applyGenome()`) is **deterministic and non-reversible** — once an
  edge stitch is committed within a chromosome's evaluation, it
  stays. The chromosome is a sequential action list, not a
  re-evaluable genotype. This makes the search highly sensitive to
  permutation order and explains why crossover/mutation are designed
  around the "successful prefix / failed suffix" structure. If we
  ever pursue a Takahashi-like GA, this is the subtle point that
  will make or break it.
- **The Export Paper Model priority direction** — which sign of
  coefficient means "prefer to fold" vs "prefer to cut" — is stated
  here from the code, but the survey-era intuition pulled the
  opposite direction. Confirm by experiment, not by memory, before
  porting the defaults.
- **Curvature-classification edge cases.** The paper mentions the
  > 3π / small-angle exceptions but doesn't quantify the failure
  rate. For our corpus this should be tested before relying on the
  filter as a sole gate.
- **PolyZamboni's `max_faces_per_component=10` default** is a
  product call, not a derived bound. If we adopt the cut-removal
  pattern, the right cap for our corpus needs its own measurement.

## Sources

- Shigeo Takahashi, Hsiang-Yun Wu, Seow Hui Saw, Chun-Cheng Lin,
  Hsu-Chun Yen, "Optimized Topological Surgery for Unfolding 3D
  Meshes," *Computer Graphics Forum* 30(7) (Pacific Graphics 2011),
  pp. 2077–2086.
  [Preprint PDF](http://web-ext.u-aizu.ac.jp/~shigeo/pdf/pg2011u-preprint.pdf)
  · [Wiley (paywalled)](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8659.2011.02053.x)
  · [Authors' project page](https://web-ext.u-aizu.ac.jp/~shigeo/research/unfolding/index-e.html).
- `riceroll/unfolding-mesh` —
  https://github.com/riceroll/unfolding-mesh.
- `AntonFlorey/PolyZamboni` —
  https://github.com/AntonFlorey/PolyZamboni.
- `addam/Export-Paper-Model-from-Blender` —
  https://github.com/addam/Export-Paper-Model-from-Blender.
- `rodrigorc/papercraft` — https://github.com/rodrigorc/papercraft.
- Companion writeups in this repo:
  [`paperfoldmodels.md`](paperfoldmodels.md),
  [`unfolding-algorithm-survey.md`](unfolding-algorithm-survey.md).
