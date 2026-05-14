# Session 0017 — Glue tabs with edge labels

## What was attempted

Make the recut pieces buildable and take rendering multi-piece.
Every cut edge gets a matching label so a builder knows which edge
tapes to which; boundary cut edges get a trapezoidal glue tab on
one side; and `emitSvg` plus the app are refactored from a single
net to one rendered piece each.

## What shipped

- `src/core/recut.ts` — extended: `Piece` gains `faces` (the mesh
  face indices, parallel to `layout.faces`), and `recut` returns
  `RecutResult` (`{ pieces, cuts }`) — `cuts` being every cut edge
  a builder glues. The recut decision (ADR 0005) is unchanged; only
  the return shape extended.
- `src/core/tabs.ts` — `buildRenderablePieces`, a pure stage that
  classifies each piece's edges fold/cut, assigns each cut edge a
  shared label, and computes a trapezoidal glue tab on one
  deterministic side of each cut.
- `src/core/emit-svg.ts` — refactored to serialize one
  `RenderablePiece`: fold lines dashed, cut lines solid, tab
  polygons, label text.
- `src/app/main.ts` and `index.html` — the app runs the full
  pipeline through recut and renders every piece.
- `test/unit/tabs.test.ts` (new) and updated `emit-svg` / `recut`
  tests.

## What's next

Session 0018 — Multi-page layout. Pack the multi-piece net across
printable pages; the pieces currently render at their original
recut positions (still overlapping each other on the plane), so
0018 arranges them — naive bin-packing first.

## Decisions made or deferred

- **`recut`'s return shape extended** to `RecutResult` and `Piece`
  gained `faces` — both surface data `recut` already computed. The
  ADR 0005 recut *decision* is unchanged; recorded here per ADR
  0004's precedent for a signature extension.
- **Tab-side rule:** the tab goes on the lower-face-index side of
  each cut — one deterministic rule covering boundary and internal
  cuts alike.
- **Naive trapezoidal tab**, sized as a fraction of the edge
  length (`h = 0.4·L`, `inset = 0.25·L`). The roadmap's "multiple
  tab shapes" is v5.
- **Labels are sequential integers**, shared by both mating sides
  via the common 3D edge.
- **Label placement in `emit-svg`:** when a side has a tab, the
  label sits at the edge midpoint offset inward (away from the
  tab); when the same edge's mating side has no tab here, the
  label sits at the midpoint without offset. Apex information is
  not threaded into `emit-svg`; the tab-bearing side gives us the
  outward direction directly. v2-quality legibility, finer
  placement deferred.

## Handoff

- **Branch / worktree:** `claude/eloquent-ellis-bd8202` at
  `.claude/worktrees/eloquent-ellis-bd8202/`.
- **Commits:** `<short-sha>` `feat: glue tabs, edge labels, and multi-piece rendering`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 61
  passing + 1 todo (62 total); `pnpm build` clean; `pnpm baseline`
  re-ran with the new pipeline path (`recut` →
  `buildRenderablePieces` → `emitSvg` per piece); the
  `docs/baseline-pipeline.md` table is byte-identical to 0016,
  confirming the algorithm was not perturbed.
- **Decisions made or deferred:** recut return-shape extended
  (not an ADR change); tab-side rule lower-face-index; naive
  trapezoidal tab; sequential-integer labels; label-placement
  simplification on no-tab side.
- **Queue / roadmap deltas:** Roadmap — 0017 → ✅, 0018 → ⏭,
  "Where we are now" advanced. `project-state.md` — 0017 added to
  Sessions completed; Sessions planned advanced.
  `docs/queue.md` — unchanged.
- **Open questions for the strategist:** None. The tab and label
  geometry is naive-by-spec; visual verification by Evan (running
  `pnpm dev`) is the next gate, per the v1 rendering-session
  precedent.
