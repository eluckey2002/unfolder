# ADR 0002: Adjacency as a separate output, not a half-edge mesh

## Context

ADR 0001 established the v1 pipeline as a sequence of pure-function
stages and explicitly deferred the mesh representation decision
(half-edge vs. indexed face list) "to Session 7 era, when adjacency
lookups become acute." Session 0007 implemented the Parse stage
using indexed face list (`Mesh3D = { vertices: Vec3[]; faces:
Triangle[] }`), without committing to a longer-term representation.

Session 0008 builds the face adjacency graph — the dual graph where
each node is a face and each edge connects two faces sharing a 3D
edge. This is the first stage where adjacency lookups are actually
required, forcing the deferred decision.

`paperfoldmodels`, our reference, uses a half-edge mesh (OpenMesh
`TriMesh`) for the input plus a separate graph structure (NetworkX
`Graph`) for the dual graph. Two layers: half-edge for navigation
around vertices and faces, graph for spanning-tree work. We have to
decide whether to follow that two-layer pattern, merge into a single
richer mesh representation, or take a simpler path.

## Decision

Adjacency is built as a separate output stage that consumes
`Mesh3D` and produces a new `DualGraph` data structure. `Mesh3D`
remains the canonical input representation throughout v1. We do not
introduce a half-edge mesh.

The new stage's signature is `buildAdjacency(mesh: Mesh3D):
DualGraph`. The output structure names each adjacency (which two
faces meet, which two vertices form their shared edge) and provides
face-keyed lookup so downstream stages can find a face's neighbors
in O(1) amortized.

This is consistent with ADR 0001's pipeline shape — stages return
distinct data structures, and the algorithm code only ever sees
the contract of one stage's output as input to the next.

## Consequences

What becomes easier:

- Simple data structures throughout. `Mesh3D` stays a typed pair
  of arrays; `DualGraph` is a typed adjacency list. No half-edge
  bookkeeping or boundary conventions to maintain.
- Each stage's output is self-contained and inspectable.
  Adjacency can be tested and visualized independently of the
  spanning-tree work that consumes it.
- Sessions 0009 (spanning tree) and 0010 (flatten) inherit clean
  inputs without needing to navigate raw mesh topology.

What becomes harder:

- Some operations that would be O(1) in a half-edge mesh (e.g.,
  walking around a single vertex, finding all faces meeting at a
  vertex) become O(F) here or require additional indexes. v1
  doesn't need these; v3+ probably will.
- If v3+ requires richer mesh queries — Takahashi's topological
  surgery, edge collapses, vertex-star traversal — we'll need to
  either add a `HalfEdgeMesh` as a downstream stage or upgrade
  `Mesh3D` itself. Either path is open from here.
- The two-layer pattern of `paperfoldmodels` is not replicated.
  Their half-edge layer was load-bearing for operations v1 doesn't
  reach; deferring it is a deliberate simplification.

Follow-on ADRs likely:

- A `HalfEdgeMesh` introduction if v3+ requires it — likely v3
  era when smart tab placement or topological-surgery work
  demands vertex-star traversal.
- A spanning-tree algorithm decision (MST with weights vs. plain
  DFS tree) — Session 0009, building on this ADR's `DualGraph`
  output.
