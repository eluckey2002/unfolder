# Roadmap

## Purpose

This document is the one-page view of where `unfolder` is going and
how we're getting there. It combines the long-arc phase plan from the
README with the session-level plan from `project-state.md`, and shows
current status at a glance. Read this when you want orientation; read
`README.md` for the project pitch, `project-state.md` for working
agreements and open questions, and the individual session logs in
`docs/sessions/` for per-session detail.

## Where we are now

**Phase:** v2 — Functional Unfolder. Implementation underway.
**Last completed session:** 0012 — OBJ parser.
**Next planned session:** 0013 — Sourced model test corpus.

Run `git log` for exact repo state — this document tracks phase and
session status, not commit hashes.

## Phase plan (v1–v6)

**v1 — Walking skeleton.** Load a mesh, run a naive depth-first
unfolding, render the result as SVG. Works correctly on platonic
solids (tetrahedron, cube, octahedron). No tabs, no overlap detection,
no UI. Ship state: end-to-end pipeline you can invoke from the dev
server, producing a printable SVG for any of the three platonic
solids.

**v2 — Functional unfolder.** Dihedral-weighted spanning tree, overlap
detection, automatic recut, glue tabs with edge labels, multi-page
layout. Ship state: buildable papercraft output for low-poly meshes
(faceted animal heads, geometric busts), still without a real UI.

**v3 — Quality output.** Takahashi's topological surgery for optimized
cuts, audit visualization (color-coded regions by foldability), smart
tab placement, color/texture passthrough, real PDF export. Ship
state: output that's visibly competitive with Pepakura's for
non-interactive use cases.

**v4 — Interactive editor.** Project changes character — from batch
tool to application. Real UI with 3D viewport and 2D layout panel.
Click edges to toggle cut/fold. Drag pieces to rearrange. Live
feedback on overlaps. Undo/redo. Save/load project state. React +
react-three-fiber. Ship state: a usable interactive editor, even
before texture features.

**v5 — Feature parity.** Texture mapping, 3D fold preview, multiple
tab shapes, edge numbering schemes, PDO export, print tiling for
large pieces. The long polish phase. Ship state: feature-comparable
to Pepakura Designer for typical workflows.

**v6 — Distribution.** Static deploy, documentation, eventual
template gallery, eventual public release. Ship state: a free,
browser-based, cross-platform alternative to Pepakura available to
anyone.

## v1 session plan

Sessions 0001–0011 are committed to `main`. v1 is complete.

- **0001 — Project skeleton.** ✅ Directory structure, gitignore,
  initial commits.
- **0002 — Read `paperfoldmodels`.** ✅ Reference-implementation
  writeup at `docs/references/paperfoldmodels.md`.
- **0003 — First ADR.** ✅ ADR 0001 — v1 pipeline architecture
  (staged pure functions).
- **0004 — Queue and working agreements.** ✅ `docs/queue.md`
  established; working agreements expanded.
- **0005 — Bootstrap the build.** ✅ Vite + TypeScript + pnpm +
  Vitest toolchain.
- **0006 — Generate the test corpus.** ✅ Three.js-generated STL
  files for tetrahedron, cube, octahedron.
- **0007 — Mesh loading.** ✅ Parse STL files; render triangles on a
  canvas via three.js. First `src/core/` and `src/app/` code.
- **0008 — Face adjacency graph.** ✅ Build the dual graph (one node
  per face, edges between adjacent faces).
- **0009 — Spanning tree.** ✅ DFS over the adjacency graph; classify
  each edge as fold or cut.
- **0010 — Flatten.** ✅ Walk the spanning tree to assign 2D
  coordinates to every face.
- **0011 — SVG export.** ✅ Emit the flattened layout as printable SVG.
  v1 complete.

## v2 session plan

v2 — the functional unfolder — turns the walking skeleton into a
tool that produces buildable papercraft for real low-poly meshes.
The dependency chain runs in one direction, which fixes the
ordering: the test corpus and its loader come first, because the
dihedral-weighting heuristic cannot be tested on platonic solids
(their dihedral angles are uniform), and each algorithm stage
consumes the previous stage's output.

Per the planning decision, the first three sessions are specified
in detail; 0015–0019 are a deliberate sketch, refined as the early
sessions land. Sessions continue the global numbering.

- **0012 — OBJ parser.** ✅ Add `src/core/parse-obj.ts`, producing the
  same `Mesh3D` the STL parser produces. Geometry only — normals,
  texture coordinates, groups, and materials are skipped or
  parsed-and-ignored. Handles OBJ's shared-vertex indexing
  (1-indexed, negative indices) and fan-triangulates quad and n-gon
  faces, since the downstream pipeline assumes triangles. The
  triangulation strategy and any STL/OBJ format-dispatch router are
  session-log decisions unless triangulation proves load-bearing,
  in which case it earns an ADR.

- **0013 — Sourced model test corpus.** ⏭ Source four to six
  CC-licensed low-poly OBJ models matching the v2 ship-state target
  — faceted animal heads, geometric busts, low-poly props —
  spanning a range of face counts and topological variety: some
  that v1's plain DFS unfolds cleanly, some that overlap. Files
  land in `test/corpus/` with a `PROVENANCE.md` recording source
  and license per model. The session's core deliverable beyond the
  files is the baseline: run the full v1 pipeline on every model
  and record which flatten cleanly and which overlap — the failure
  corpus that drives every later v2 session. Depends on 0012.

- **0014 — Dihedral-weighted spanning tree.** Replace v1's plain
  DFS (deferred to v2 by ADR 0003) with a dihedral-weighted minimum
  spanning tree over the dual graph: each edge weighted by the
  dihedral angle of its mesh edge, so the tree prefers folding flat
  edges and cutting sharp ones. ADR 0004 commits the weighting
  heuristic — the load-bearing decision of the session. Includes
  dihedral-angle computation, the weighted tree, tests, and a
  re-run of the 0013 baseline showing the overlap picture change.
  The MST algorithm itself (Prim or Kruskal, naive is fine) is a
  session-log decision. Code-review subagent: yes. Depends on 0013
  for a corpus with real dihedral variety.

### v2 sketch — 0015 onward

Refined as the early sessions land; session count and bundling stay
open until 0014 lands and informs the granularity.

- **0015 — Overlap detection.** `polygon-clipping` integration; a
  pure predicate over the 2D layout that finds face-pair overlaps.
  Detection only, no fixing.
- **0016 — Automatic recut.** The control loop: on detected
  overlap, promote a fold edge to a cut, re-flatten, repeat. The
  net becomes multi-piece here. Likely ADR 0005 on recut strategy.
- **0017 — Glue tabs with edge labels.** Tab geometry on cut edges
  plus matching edge labels. Likely forces a refactor of v1's naive
  per-face-per-edge SVG emit, which does not carry edge identity.
- **0018 — Multi-page layout.** Pack the multi-piece net across
  printable pages; naive bin-packing first.
- **0019 — v2 integration and retrospective.** Full pipeline run on
  the 0013 corpus, ship-state validation, handoff-doc updates, and
  `docs/retrospectives/v2-complete.md`.

## Maintaining this document

Updated by the strategist at the end of any session whose status
changes. Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the active phase's session plan. Phase descriptions only
change when a phase's ship-state commitment itself changes — a
substantive enough event to warrant its own ADR.
