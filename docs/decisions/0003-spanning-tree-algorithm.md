# ADR 0003: Plain DFS spanning tree for v1, weighted MST deferred to v2

## Context

ADR 0001 deferred the spanning-tree algorithm choice to "Session 8
era." Session 0009 is when the choice becomes acute. The Spanning
Tree stage converts the `DualGraph` (face adjacency, from Session
0008) into a classification of each adjacency as either *fold*
(tree edge) or *cut* (non-tree edge), plus a parent-pointer tree
structure that downstream stages use to walk faces in order.

`paperfoldmodels`, our reference, uses Kruskal's MST with edge
weights derived from 3D edge length (longer edges preferred as
folds, leaving shorter edges as cuts and thus less glue tape).
v2 of unfolder plans dihedral-weighted MST as part of the "real"
unfolder. v1's test corpus, however, is platonic solids — all
edges equal length, all dihedral angles equal.

For platonic solids, every valid spanning tree produces an equally
valid unfolding. DFS, length-weighted MST, and dihedral-weighted
MST are equivalent for our v1 inputs. The algorithm choice is
purely about how much v2-readiness to bake in now.

## Decision

v1 uses **plain iterative DFS** rooted at face index 0. No edge
weights, no MST.

The function signature is `buildSpanningTree(dual: DualGraph,
root?: number): SpanningTree`. The `root` parameter exists for
test flexibility; v1's pipeline always passes (or defaults to) 0.

The `SpanningTree` output contract — root, parent pointers, folds,
cuts — does not depend on the algorithm that produced it. Sessions
0010 (flatten) and 0011 (SVG export) consume the contract; they
don't care how the tree was built.

When v2 arrives with low-poly meshes where edge lengths and
dihedral angles actually vary, the algorithm gets replaced — DFS
function body swapped for Kruskal's (or Prim's) with a weight
function. The function signature and `SpanningTree` shape stay the
same. The replacement is scoped to one file; the pipeline doesn't
move.

## Consequences

What becomes easier:

- Smallest possible v1 algorithm. ~25 lines of iterative DFS plus
  ~10 lines of adjacency classification.
- Deterministic output (fixed root, fixed traversal order means
  the same tree every time). Easier to test, debug, and reason
  about.
- No weight-function abstraction to design or maintain in v1.
- v1's test corpus passes with a known-correct tree shape because
  DFS on a symmetric polyhedron is straightforwardly enumerable.

What becomes harder:

- v2's algorithm replacement is real work — Kruskal's plus a
  union-find, plus a weight-function abstraction that v2's session
  has to design. Tradeoff accepted because the v2 work is scoped
  to one file and doesn't touch the pipeline contract.
- For asymmetric meshes (not v1), DFS may produce trees with
  long cut paths and aesthetically poor unfoldings. v2 fixes this.

Follow-on ADRs likely:

- ADR for v2's spanning-tree algorithm and weighting heuristic.
  Likely v2 era. May also pick between Kruskal's, Prim's, or
  multiple-trees-and-pick-best per the paperfoldmodels writeup's
  open suggestion.
