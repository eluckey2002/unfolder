# Session 0011 — SVG export

## What was attempted

Build the Emit stage of the v1 pipeline per ADR 0001 —
serializing the `Layout2D` to an SVG string with fold edges
dashed and cut edges solid — and wire the full pipeline into the
browser app so the unfolded net displays alongside the 3D
viewport. Second half of the bundled 0010+0011 invocation. This
completes v1: the walking skeleton runs end to end.

## What shipped

- `src/core/emit-svg.ts` — `emitSvg(layout, tree)`, a pure
  function producing a complete SVG document string. Computes a
  bounding box and viewBox, then draws one `<line>` per
  face-edge, dashed for fold edges and solid for cut edges.
- `test/unit/emit-svg.test.ts` — confirms well-formed SVG output
  and correct line counts per platonic solid (tetrahedron 12,
  cube 36, octahedron 24).
- `src/app/main.ts` and `index.html` — the app now runs the full
  pipeline (parse → adjacency → spanning tree → flatten → emit)
  and displays the unfolded SVG net beside the 3D mesh viewport
  in a split layout.

All verification commands green. Test suite reports 18 passing
(15 from Session 0010's state + 3 emit-svg).

## What's next

v1 — the walking skeleton — is complete. The end-to-end pipeline
loads a platonic solid and produces a printable SVG net. Next is
v2 planning: dihedral-weighted spanning tree, overlap detection
and automatic recut, glue tabs with edge labels, multi-page
layout. v2's session-level plan gets drafted now that v1's
implementation experience can inform the granularity.

## Decisions made or deferred

- **Per-face-per-edge SVG drawing.** Each face draws its three
  edges independently. Fold edges end up drawn twice at
  identical coordinates (harmless); cut edges drawn twice at
  different coordinates (correct — both sides of a cut edge
  appear on the net boundary). Simpler than deduplicating, and
  the line counts stay trivially predictable for testing.
- **Split-screen app layout.** The browser app shows the 3D
  mesh and the 2D net side by side rather than replacing one
  with the other. Makes v1 visually legible: the input shape
  and its unfolding are both on screen.
- **SVG written to the DOM, not to disk.** Per ADR 0001, the
  emit stage is a pure function returning a string; the app
  layer decides what to do with it. For v1 that's injecting it
  into the page.

## Queue updates

No items closed. No items added. (v2 planning will populate the
queue and roadmap with the next phase's sessions.)
