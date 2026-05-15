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

**Phase:** v3 — Quality Output. In progress.
**Last completed session:** 0019 — v2 integration and retrospective
(plus the v3-boundary housekeeping maintenance commit, `3e33524`).
**Next planned session:** 0020 — development flow setup.

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

- **0013 — Sourced model test corpus.** ✅ Seven CC0/project-authored
  models in `test/corpus/` — four Kenney Food Kit models, a low-poly
  deer, and two procedural convex baselines — all verified closed
  two-manifold, single component, genus 0. `PROVENANCE.md` records
  source and license per model. The session's core deliverable
  beyond the files is the v1 baseline at
  `docs/baseline-v1-pipeline.md`: 5 of 11 corpus models produce
  overlap-free nets under v1's plain DFS — the failure corpus that
  drives every later v2 session.

- **0014 — Dihedral-weighted spanning tree.** ✅ Replaced v1's plain
  DFS with a Kruskal-based dihedral-weighted MST over the dual graph
  (ADR 0004 commits the weighting heuristic). `src/core/dihedral.ts`
  computes one weight per adjacency from the angle between adjacent
  faces' outward unit normals; `buildSpanningTree` now takes a
  `weights` parameter. The 0013 baseline (renamed
  `docs/baseline-pipeline.md`) was re-run: 5 → 7 overlap-free
  models, with mixed effects on concave shapes (cylinder, egg,
  ginger-bread improved; croissant, deer, meat-sausage regressed)
  — the heuristic is genuinely mediocre on highly concave organic
  shapes, which 0015/0016 are what address.

### v2 sketch — 0015 onward

Refined as the early sessions land; session count and bundling stay
open until 0014 lands and informs the granularity.

- **0015 — Overlap detection.** ✅ `src/core/overlap.ts` —
  `detectOverlaps(layout)`, a pure predicate built on
  `polygon-clipping` that finds every overlapping face pair in the 2D
  layout. The baseline harness now uses it in place of the hand-rolled
  Sutherland–Hodgman check; the 7-of-11 overlap-free summary is
  unchanged, with small upward drift on the four concave models
  (+3 to +16 pairs).
- **0016 — Automatic recut.** ✅ `src/core/recut.ts` — greedy
  set-cover over the overlap tree-paths, splitting the fold forest
  into connected pieces (ADR 0005). No re-flattening: rigid
  unfolding is local, so each piece's positions are selected from
  the original layout. `scripts/baseline-pipeline.ts` now reports
  the pre-recut overlap count and per-model piece count; the
  regenerated `docs/baseline-pipeline.md` shows the v2 payoff —
  every piece across the 11-model corpus is internally
  overlap-free. Concave models split (croissant 15, deer 28,
  ginger-bread 5, meat-sausage 3); convex models stay at 1 piece.
  Multi-piece rendering deferred to 0017.
- **0017 — Glue tabs with edge labels.** ✅ `src/core/tabs.ts` —
  `buildRenderablePieces` turns the `RecutResult` (extended to
  surface per-piece mesh face indices and the full cut-edge set)
  into a renderable model: every cut edge labelled, with a
  trapezoidal tab on the lower-face-index side. `emitSvg`
  refactored to serialize one piece; the app loops over every
  piece. Baseline numbers unchanged (the algorithm was not
  touched).
- **0018 — Multi-page layout.** ✅ `src/core/paginate.ts` — a pure
  stage that bin-packs `RenderablePiece[]` onto US-Letter pages at
  one uniform scale (most-constrained piece sets the scale). Shelf
  packing, axis-aligned, no rotation. `emitSvg` refactored to take a
  `Page` and emit physical-mm dimensions. Baseline numbers
  unchanged; only the new `pages` column was added.
- **0019 — v2 integration and retrospective.** ✅ End-to-end
  integration test codifying v2 ship state; a connectedness guard in
  `buildSpanningTree` (closes audit A1); the overlap-free invariant
  promoted from `it.todo` to a real property test (closes A4); `Piece`
  structurally asserted (closes A6); `docs/retrospectives/v2-complete.md`
  written and handoff docs refreshed. v2 complete.

## v3 session plan

v3 — Quality Output — moves the pipeline from *buildable* to *good*:
output that's visibly competitive with Pepakura's for non-interactive
use. Five workstreams; per the planning convention, the first
sessions are detailed and the rest are a deliberate sketch, refined
as the early ones land.

**Workstreams:**

1. **Baseline & foundation** — define the v3 quality metric set,
   instrument the harness, capture the v3 "before" snapshot.
2. **The cut-quality core** — Takahashi reference read, a
   topological-surgery spike, optimized recut.
3. **Output fidelity** — color/texture passthrough, real PDF export.
4. **Builder-facing quality** — smart tab placement, audit
   visualization.
5. **Phase close** — v3 integration test, retrospectives, one
   mid-phase checkpoint.

**Sessions:**

- **0020 — Development flow setup.** ⏭ PR-based merge flow, CI
  safeguards, the doc-coherence updates (ADR 0006).
- **0021 — v3 quality baseline.** Define the metric set, instrument
  the harness, capture `docs/baseline-v3.md`. First session under the
  PR flow.
- **0022 — Takahashi reference read.** Study the topological-surgery
  literature and PolyZamboni; produce a reference writeup.
- **0023 — Topological-surgery spike.** Time-boxed, exploratory;
  produces a findings doc, not a shippable stage.
- **0024+ — sketched:** optimized recut, PDF export, color/texture
  passthrough, smart tab placement, audit visualization, v3
  integration and retrospective. Refined as 0021–0023 land.

## Maintaining this document

Updated by the strategist at the end of any session whose status
changes. Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the active phase's session plan. Phase descriptions only
change when a phase's ship-state commitment itself changes — a
substantive enough event to warrant its own ADR.
