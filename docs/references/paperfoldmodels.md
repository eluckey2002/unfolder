# Reference: paperfoldmodels

## What it is

- **Project**: [paperfoldmodels](https://github.com/felixfeliz/paperfoldmodels)
- **Author**: Felix Scholz (`felix.scholz@jku.at`)
- **Language**: Python 3
- **Scope**: Takes a triangular surface mesh and produces SVG sheets you can print, cut out, and fold into a papercraft model of the original 3D shape.
- **Size**: ~510 lines of Python total — `unfoldmesh.py` (462 lines, all the algorithm and SVG output) plus `testUnfold.py` (48 lines, CLI wrapper).
- **Dependencies**: NumPy, [OpenMesh](http://www.openmesh.org) (for the half-edge mesh representation and any file format it reads), and NetworkX (for graph algorithms).
- **Reference**: The author cites a [report by Straub and Prautzsch](https://geom.ivd.kit.edu/downloads/proj-paper-models_cut_out_sheets.pdf) as the basis for the algorithm.
- **Comments**: Mostly in German (the author wrote it for a high-school audience).

## The algorithm in plain English

Imagine you have a closed mesh of triangles in 3D and you want to lay every triangle flat on one big piece of paper without bending or stretching. You can pivot one triangle around an edge it shares with a neighbor; whatever side of that hinge "rotates down" stays attached. To unfold the whole thing you have to choose, for every edge in the mesh, whether it's a **fold** (the two triangles stay attached) or a **cut** (they get separated). If you make that choice well you might fit the whole mesh onto one piece of paper as a single piece. If you make it poorly — or, often, no matter what you do — some triangles end up sitting on top of each other in the plane, so you have to make extra cuts and ship multiple paper pieces.

The algorithm follows the three steps named in the README:

**Step 1 — pick an initial set of folds via a spanning tree.** Build a graph where each node is a triangular face and each edge connects two faces that touch in 3D. (Mathematicians call this the *dual graph* of the mesh.) Score every edge: longer 3D edges get lower weights. Run a minimum spanning tree (MST) over that graph. The tree edges become folds; everything else becomes a cut. Because it's a spanning tree, the fold structure is connected and acyclic — every triangle is reachable through folds from every other triangle, and there are exactly enough folds to keep the mesh from falling apart. Preferring longer edges is a heuristic: long folds tend to leave fewer, shorter cut edges to glue back together.

**Step 2 — flatten the mesh by walking the tree.** Pick any face as the root and drop it on the plane: vertex 0 at the origin, vertex 1 along the positive x-axis at the original edge length away, vertex 2 above the x-axis at whatever position the other two edge lengths force (so the 2D triangle is congruent to the 3D one). Then DFS through the spanning tree. Every time you cross a fold edge to a new face, two of that face's vertices are already placed (the endpoints of the shared edge). The third — the apex of the new triangle — has its position determined by the new triangle's two non-shared edge lengths. There are two valid positions for the apex (one on each side of the shared edge); pick the one *opposite* the parent face so the new triangle doesn't sit on top of the old one. Repeat until every face is placed.

This is rigid unfolding: every triangle keeps its original size and shape; only the dihedral angles between neighbors change (they all get flattened to 180°).

**Step 3 — find and remove self-intersections.** After flattening, distant parts of the mesh can land on top of each other on the page. For every pair of unfolded faces, test whether their triangles overlap (any edge crosses, or one contains the other). For each overlapping pair, find the path between them in the spanning tree — cutting any single fold along that path is enough to separate the two pieces.

This becomes a small set-cover problem: pick a minimum number of folds-to-cut such that at least one cut lies on every overlap-path. The code uses the classic greedy approximation — repeatedly pick the fold edge that lies on the largest number of still-uncovered paths — until every overlap is covered. Then remove those edges from the spanning tree, find the resulting connected components (each component is one paper piece), and re-run Step 2 on each. Result: a list of non-overlapping 2D layouts, one SVG each, plus matching "glue numbers" so you can tell which cut edges on which sheet should be taped back together.

## Data structures

- **`mesh`** (OpenMesh `TriMesh`): the input 3D mesh, in half-edge form. Provides the navigation primitives the algorithm leans on heavily: `face_handle(halfedge)`, `next_halfedge_handle`, `from/to_vertex_handle`, `opposite_halfedge_handle`, plus `calc_edge_length` and `calc_dihedral_angle`.
- **`dualGraph`** (NetworkX `Graph`): one node per face (keyed by face index), one edge per shared 3D edge. Edge attributes: `idx` (the original mesh's edge index), `weight` (the fold-preference score).
- **`spanningTree`** (NetworkX `Graph`): the MST of `dualGraph`. Cuts later get removed from this in place.
- **`unfoldedMesh`** (OpenMesh `TriMesh`): the output 2D layout. All vertices have z=0. Shared vertices along fold edges are properly shared (only the apex of each new face is a fresh vertex).
- **Parallel arrays keyed by unfolded-edge index** (NumPy arrays, not OpenMesh properties):
  - `isFoldingEdge: bool` — true if this edge is interior to the paper piece (drawn dashed), false if it's a boundary you'll cut and glue (drawn solid).
  - `foldingDirection: int` — +1 for mountain folds, -1 for valleys. Read from `calc_dihedral_angle` of the corresponding 3D edge. Drives the red/blue coloring in the SVG.
  - `glueNumber: int` — the original 3D edge's index. Two cut edges that need to be glued will carry the same number; printed as text near each cut.
- **`connections: int[]`** — unfolded face index → original face index. Used to map back from 2D intersections to the 3D MST when computing cut paths.
- **`halfEdgeConnections: dict[int, int]`** — original halfedge index → unfolded halfedge index. Built up incrementally during DFS so the algorithm can find the right 2D halfedge to pivot around when crossing each fold.

The choice to keep visualization metadata in separate NumPy arrays rather than as OpenMesh properties keeps the code simpler — no `add_property` / `set_property` boilerplate — at the cost of having to pass several arrays around together.

## Non-obvious choices

**MST edge weight is "1 − normalized length", which favors long edges.** Line 242:

```python
edgeweight = 1.0 - (mesh.calc_edge_length(edge) - minLength) / (maxLength - minLength)
```

So longer 3D edges → smaller weights → preferred in the MST → kept as folds. It's worth saying out loud because the direction is non-obvious from the formula. The intuition: folding along long edges leaves short edges as the cuts that need glue tabs, which is generally cleaner.

**The apex-position choice for the first vs. subsequent triangles is asymmetric.** For the root triangle, `getThirdPoint` returns two candidates (apex above or below the x-axis) and the code explicitly picks the positive-y one (line 119). For every subsequent triangle the code just takes the first solution returned by `getThirdPoint` (line 190) without inspecting it. This works because, before computing the new apex, the algorithm flips the folding halfedge to its opposite (line 168–169) so that it now traverses the shared edge in the *reverse* direction. `getThirdPoint`'s "first solution" sits at positive y in the local frame defined by `v0 → v1`; flipping the direction flips which side of the segment that is. Net effect: the new apex always lands on the opposite side from the parent's apex. This is correct but fragile — a reimplementation that doesn't carefully replicate the halfedge-flipping convention will silently fold triangles onto each other.

**Intersection test is conservative.** `triangleIntersection` checks all 9 edge-edge pairs *and* whether all three vertices of either triangle lie inside the other. The "fully inside" check catches the case where one triangle entirely contains the other (no edges cross). Both checks use a positive epsilon so adjacent triangles that share an edge by construction don't false-positive as intersecting.

**Cut selection is greedy set cover, not optimal.** The loop in `unfold` (lines 316–339) reads as a custom weight calculation but is really just "pick the edge on the most uncovered paths, repeat." It uses `cutWeights[i] = 1 / (numEdgesInPaths[i] - numInC)` and `argmin`, which is equivalent to `argmax` of the uncovered count. Standard log-factor approximation; not optimal, but practical.

**`mesh.calc_dihedral_angle` is called on every halfedge of every face placed, including ones that will turn out to be cuts.** So `foldingDirection` is set even for boundary edges. Cut edges still get drawn red or blue in the SVG — but they're drawn solid rather than dashed (controlled by `isFoldingEdge`). It seems the color on cut edges acts as a glue-mating cue.

**The dual-graph nodes get a `pos` attribute computed from `(x, z)` coordinates of the original mesh vertices** (lines 244–250). This isn't `(x, y)` — it picks x and z, which is geometrically arbitrary. Nothing else in the file reads this attribute. It looks like leftover code from a debug visualization of the dual graph itself.

**All-pairs face intersection is O(F²) with no spatial acceleration.** Fine for an icosahedron, painful for the included reduced bunny.

**There's no second spanning-tree-search after cuts.** The algorithm computes the MST once. After cuts are removed, each connected component is its own tree, and the same `unfoldSpanningTree` routine is reused on each. No attempt is made to find a better unfolding of each individual component (e.g., a different root, different fold choices within the component).

**The code assumes a clean closed triangle mesh.** A boundary edge would have only one adjacent face, and `mesh.face_handle(mesh.halfedge_handle(edge, 1))` would return an invalid handle. Nothing defends against this.

**The line `numUnfoldedEdges = 3 * numFaces - sizeTree`** (line 87) is a count derived from "each face contributes 3 edges, but each tree-edge merges two of them." For a spanning tree on all F faces, `sizeTree = F - 1`, giving `2F + 1` distinct unfolded edges. The same routine is reused for components, and the formula generalizes correctly.

**Halfedge identification across the boundary uses an `idx → idx` dict, not OpenMesh's own handle equality.** This is needed because the unfolded mesh is a separate `TriMesh` instance from the original, so the original halfedges have no direct counterpart inside it.

## What we'd apply to our work

- **The three-step structure (MST → unfold → cut overlaps).** This is a clean separation of concerns and matches how a human would think about the problem. Worth keeping as the top-level shape of our pipeline.
- **Weighted-MST as the cut/fold heuristic.** The weight function is a single isolated knob; swapping it (e.g., to prefer small-dihedral folds, or to prefer folds that keep faces "facing the same way") becomes easy. Good extensibility surface.
- **`getThirdPoint` as the flattening primitive.** Just trigonometry — translates directly to TypeScript. The "two solutions, pick by side" idiom is reusable.
- **Greedy set cover for cut selection.** Simple, fast, gives a small constant-factor approximation. A reasonable v1.
- **Glue numbers tagged from original-mesh edge indices.** Useful for end users. We should keep the convention of tagging matching cut edges with a shared identifier.
- **External per-entity property arrays (vs. baking metadata into mesh data structures).** Cleaner separation; easier to debug. We'll likely do the same.

## What we'd intentionally do differently

- **No OpenMesh, no NetworkX.** We need to ship a TypeScript half-edge mesh and our own implementations of MST, DFS, shortest path, and connected components. These are textbook algorithms, but we have to write them (or pick lightweight libraries with good types).
- **Browser-targeted, not file-output-targeted.** The Python code's deliverable is an SVG file. Ours is an interactive 3D-and-2D experience. We don't want the unfolding logic interleaved with SVG-emission code the way `writeSVG` is. Keep the algorithm a pure function that returns a data structure; render in a separate layer.
- **Avoid O(F²) overlap detection.** Use a spatial index (BVH or AABB tree) for the all-pairs check, or process triangles in a sweep order. This will matter at moderately complex meshes.
- **More principled epsilon.** `1e-12` is fine for tiny meshes but won't survive a mesh scaled into world units. Use a tolerance relative to the mesh's bounding-box diagonal.
- **Defend against boundary / non-manifold meshes.** Either reject them with a clear error or actually handle them. Don't let invalid handles propagate.
- **Break `unfoldSpanningTree` into smaller pieces.** It's ~130 lines of one imperative procedure that mixes geometry computation, halfedge-handle bookkeeping, and visualization-data side effects. A v1 in TypeScript should split: "place root face", "place child face given parent face + shared edge", "record metadata for an unfolded face".
- **Consider revisiting cut placement.** Greedy set-cover doesn't account for which edges are visually inconspicuous, which produce reasonable-aspect-ratio pieces, or how many pieces the user wants. Worth at least leaving the door open to better strategies later.
- **Consider trying multiple spanning trees.** The MST is one of many possible trees. Computing several (with different weight tweaks or random tie-breaks), unfolding each, and picking the one with the fewest overlaps before cutting could materially reduce the cuts needed. The Straub & Prautzsch paper presumably discusses this; worth reading.
- **Drop the unused dual-graph `pos` attribute.** Vestigial.

## Honest uncertainties

A few things I read but didn't fully verify:

- The exact correctness of the apex-side choice in subsequent triangles depends on OpenMesh's halfedge ordering conventions inside a face. I'm convinced the result is correct because the included icosahedron SVG looks right, but I haven't independently verified the orientation invariants. A reimplementation should test this on a non-symmetric face arrangement before trusting it.
- The "two faces are inside each other" branch of `triangleIntersection` uses a `inTri = True; inTri = inTri and ...` chain that, if any of the three points falls outside the other triangle, ends with `inTri = False` for that triangle test — but the variable is then reset before the second containment test. That's fine, but the structure is brittle; an early `if not pointInTriangle: continue` would read more clearly.
- The dihedral-angle sign convention (`< 0` → valley, `> 0` → mountain) presumably matches OpenMesh's convention for `calc_dihedral_angle`. I haven't double-checked the sign in OpenMesh's docs; if our half-edge library uses the opposite convention, mountain/valley colors will flip in the output.
