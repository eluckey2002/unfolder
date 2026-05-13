# ADR 0001: v1 pipeline architecture

## Context

unfolder is in v1 — the walking-skeleton phase. The bar: load a triangular
mesh, run a naive depth-first unfolding, emit SVG, work correctly on
platonic solids (tetrahedron, cube, octahedron). No tabs, no overlap
detection, no UI. Sessions 6–10 build out that pipeline end-to-end.

In Session 0002 we read `paperfoldmodels` — a ~510-line Python reference
covering a slightly larger problem (it also handles overlap detection and
multi-piece output). The writeup at `docs/references/paperfoldmodels.md`
is the input to this ADR. Its single biggest learning was structural, not
algorithmic: the reference's core routine, `unfoldSpanningTree`, is a
single ~130-line imperative procedure that mixes geometry math, halfedge
bookkeeping, visualization metadata, and SVG-emission side effects. That
tangle is why the code is hard to read, hard to test, and tightly coupled
to its file-output target.

Because the same pipeline shape will carry through v1, v2, and v3, we
need to commit to a structure before the first stage gets coded.
Otherwise each implementation session will quietly reinvent one, and the
cumulative result will resemble `paperfoldmodels`' tangle.

## Decision

v1 is implemented as a sequence of pure-function stages. Each stage takes
the previous stage's output as input and returns a new data structure.
No stage reads or writes files. No stage produces side effects. No stage
knows about rendering. Rendering — SVG emission in v1, eventual
canvas/three.js visualization later — is a separate concern that consumes
the pipeline's final output.

### The stages

1. **Parse.** Input: STL file contents. Output: a 3D mesh — a list of
   vertices and a list of triangular faces indexing into the vertex list.
2. **Adjacency.** Input: 3D mesh. Output: a face-adjacency structure
   (one node per face, edges between faces that share a 3D edge).
3. **Spanning tree.** Input: face-adjacency structure. Output: a
   classification of each adjacency edge as fold or cut, such that the
   fold edges form a spanning tree of the adjacency graph.
4. **Flatten.** Input: 3D mesh + fold/cut classification. Output: a 2D
   layout — for each face, the (x, y) coordinates of its three vertices
   in the plane.
5. **Emit.** Input: 2D layout. Output: an SVG string.

### Rules across stages

- Each stage is a pure function: no shared mutable state, no module-level
  globals, no I/O. Reading the STL from disk and writing the SVG to disk
  happen outside the pipeline.
- Each stage's input and output have explicit TypeScript types. The types
  are the contract.
- Visualization metadata stays out of pipeline data structures. Mountain
  vs. valley sign, eventual glue numbers, color hints — these live in a
  separate "render hints" structure consumed by `emit`, not embedded in
  the mesh or the adjacency graph. (`paperfoldmodels` carries this
  metadata in parallel arrays alongside the unfolded mesh; we treat it
  as a distinct output, not a hitchhiker on existing data.)
- Algorithmic choices inside a stage are local to that stage and not
  part of this ADR. Mesh representation (half-edge vs. indexed face
  list), spanning tree algorithm (MST with weights vs. plain DFS tree),
  SVG page layout — those decisions land in their own ADRs as the
  corresponding sessions reach them.

### Deferred to v2+

The following are explicitly out of scope for v1 and not addressed by
this ADR:

- Overlap detection between unfolded faces and the cut-placement
  set-cover
- Glue tabs along cut edges
- Multi-piece output and glue-number labels
- Spatial acceleration for any operations that are quadratic in face
  count
- Boundary / non-manifold mesh handling — v1 assumes clean closed
  manifold input and may produce garbage otherwise
- Interactive UI (v4)

## Consequences

### What becomes easier

- Each implementation session (Sessions 6–10) has a tight, well-defined
  contract: known input type, known output type, no entanglement with
  other stages.
- Testing each stage in isolation: pure functions with no I/O to mock,
  exercised against the same test corpus (tetrahedron, cube,
  octahedron).
- Visual debugging at any stage: render hints attach to outputs, so each
  intermediate result can be visualized independently.
- Algorithm work and rendering work can proceed in parallel once each
  stage's contract is defined.
- Future ADRs (mesh representation, spanning tree algorithm, render-hints
  schema) have an obvious place to land — they're the per-stage internal
  decisions this ADR deferred.

### What becomes harder

- Performance ceiling: pure functions returning new structures preclude
  in-place optimizations. v1 doesn't care. If v4+ hits performance walls
  on large meshes, revisit then.
- More upfront boilerplate: each stage carries its own input and output
  types instead of threading a shared context object through the
  pipeline.
- Cross-stage bugs require more tracing: when output looks wrong, walk
  back through every stage's typed output to localize the fault.
- v2's overlap detection and cut placement won't slot into the linear
  pipeline neatly — they need to read the spanning tree, the 2D layout,
  and the original mesh together. Two plausible answers when v2 lands:
  a "refine" stage operating on the full pipeline state, or a controller
  iterating the pipeline with adjusted inputs. Naming the friction here
  so the v2 session expects it rather than discovers it.

### Follow-on ADRs likely

- Mesh representation (half-edge vs. indexed face list) — Session 7 era,
  when adjacency lookups become acute.
- Spanning tree algorithm and weighting heuristic — Session 8 era.
- 2D-layout / multi-piece data structure — v2 era, when overlap-driven
  cuts produce multiple connected components.
- Render-hints schema — when texture, labels, or interactive overlays
  need consistent semantics.
