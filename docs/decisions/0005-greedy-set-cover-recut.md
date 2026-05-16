# ADR 0005: Greedy set-cover recut

> **Status:** Superseded by ADR 0007 (cut-removal as v3 default), 2026-05-16. The recut module remains in the codebase for the opt-in MST+recut path; only the default pipeline changed.

## Context

ADR 0004's dihedral-weighted MST decides which spanning tree gets
built, but the session 0014 baseline confirmed what the
architecture always assumed: the tree alone does not produce
overlap-free nets. On the concave corpus models the unfolded net
self-overlaps heavily — croissant 388 overlapping face pairs, deer
841. Session 0015 added overlap detection. Session 0016 is the
recut: the step that drives overlaps to zero by cutting the single
net into multiple non-overlapping pieces.

The decision is the recut strategy. `paperfoldmodels` and the
algorithm survey (`docs/references/unfolding-algorithm-survey.md`)
agree on the standard practical approach: for each overlapping face
pair there is a unique path between the two faces through the
spanning tree's fold edges, and cutting any one fold edge on that
path separates the pair. Choosing a small set of fold edges that
covers every overlap path is a set-cover problem.

## Decision

v2's recut is **greedy set-cover**, applied once.

- `src/core/recut.ts` exports `recut(tree, layout, overlaps):
  Piece[]` — a pure function. A `Piece` is
  `{ layout: Layout2D; folds: Adjacency[] }`: a connected portion
  of the unfolding that is internally overlap-free.
- For each overlap pair, compute the fold-edge path between the two
  faces via the spanning tree's `parent[]` pointers (walk to the
  lowest common ancestor).
- Greedy set-cover: repeatedly pick the fold edge lying on the most
  still-uncovered overlap paths, until every path is covered. Those
  fold edges become the recut cuts. Optimal set-cover — the
  minimum number of cuts, hence the fewest pieces — is NP-hard;
  greedy is the classic logarithmic-factor approximation, and it is
  what `paperfoldmodels` uses.
- Remove the recut cuts from the fold set; the surviving folds form
  a forest. Each connected component is one `Piece`.
- **No re-flattening.** Rigid unfolding is local: a face's position
  relative to any other face in its component is fixed by the
  fold-edge path between them, and that path lies entirely within
  the component. So the original layout's face positions,
  restricted to a component, are already a valid layout of that
  component — `recut` *selects* each piece's faces from the
  original `layout`, it does not recompute positions.
- **One pass is sufficient — no iteration.** A face pair ends up in
  the same component if and only if their fold-edge path has no
  recut cut on it, which (by the set-cover) is exactly when they
  were not an overlap pair. So every component is internally
  overlap-free after a single pass. The "control loop" the roadmap
  describes resolves in one shot.

## Consequences

What becomes easier:

- `recut` is a pure function with no geometry recomputation — it is
  set-cover plus connected components, both textbook, plus a
  selection from the existing layout. It needs no `Mesh3D`.
- One-shot correctness is provable, not merely empirical — though
  the baseline harness verifies it across the whole corpus by
  re-running detection on every piece.
- The `Piece` type — a layout plus its internal fold edges — is
  what sessions 0017 (glue tabs) and 0018 (multi-page layout)
  consume.

What becomes harder / the costs:

- Greedy set-cover is not minimal: it can pick more cuts than
  necessary, producing more pieces than an optimal recut would.
  Accepted — naive before optimized; the survey's optimization
  approaches (Takahashi's genetic single-patch, tabu search) are
  v3 "quality output" work.
- The pieces are not packed. `recut` leaves each piece's faces in
  their original layout positions, so different pieces still
  overlap each other on the plane. Packing pieces onto pages is
  session 0018's job; 0016 produces the pieces as data.

What this does NOT do:

- It does not render. `emitSvg` and the app pipeline are untouched
  this session — multi-piece rendering is session 0017's concern,
  since glue tabs inherently require per-piece rendering. The
  dev-server demo shows a stale single layout until then;
  acceptable, the demo is not load-bearing before v4's real UI.

Follow-on ADRs likely:

- A possible future ADR if optimal-or-better recut — fewer pieces —
  proves worth it; that is the survey's v3 menu.
