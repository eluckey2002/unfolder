# Session 0010 — Flatten

## What was attempted

Build the Flatten stage of the v1 pipeline per ADR 0001 — walking
the spanning tree from its root and placing each face on the 2D
plane via rigid unfolding. Output: a `Layout2D` giving the 2D
positions of every face's three vertices. Bundled with Session
0011 (SVG export) in a single Claude Code invocation with an
internal checkpoint after this stage.

## What shipped

- `src/core/flatten.ts` — `Vec2`, `FlatFace`, `Layout2D` types;
  `getThirdPoint` (circle-circle intersection primitive); and
  `buildLayout(mesh, tree)`. Root face placed with vertex 0 at
  the origin; every subsequent face placed by `getThirdPoint`
  with an explicit geometric side test selecting the apex
  position opposite the parent's apex.
- `test/unit/flatten.test.ts` — `getThirdPoint` verified against
  a known 3-4-5 triangle; per-corpus tests confirm every face's
  2D triangle is congruent to its 3D triangle, and that child
  apexes land opposite their parent apexes (the unfold-not-fold-
  back invariant).

All verification commands green. Test suite reports 15 passing
(1 sanity + 4 parser + 3 adjacency + 3 spanning-tree + 4
flatten).

## What's next

Session 0011 — SVG export (the second half of this bundle).
Serialize the `Layout2D` to an SVG string and wire the full
pipeline into the browser app.

## Decisions made or deferred

- **Explicit geometric side test for apex placement.** The
  paperfoldmodels reference used a halfedge-flipping convention
  for choosing which side a child face unfolds onto, and its own
  writeup flagged that as "correct but fragile." This
  implementation instead computes the side of the shared-edge
  line that the parent's apex sits on (via a 2D cross-product
  sign) and places the child apex on the opposite side. No
  halfedge conventions to replicate. This is a within-stage
  algorithmic choice per ADR 0001, so it's recorded here rather
  than as a standalone ADR.
- **`Layout2D` is self-describing.** Each `FlatFace` carries the
  mesh vertex indices alongside their 2D positions, so the SVG
  export stage needs only `(layout, tree)` and not `Mesh3D`.
- **Root face placement is arbitrary-but-consistent.** Vertex 0
  at the origin, vertex 1 along +x, vertex 2 in the +y
  half-plane. Any consistent choice works for v1; this one is
  simple and deterministic.

## Queue updates

No items closed. No items added.
