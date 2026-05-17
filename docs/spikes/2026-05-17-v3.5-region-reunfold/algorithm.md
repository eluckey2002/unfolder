# Region re-unfold algorithm — v3.5 spike specification

**Date:** 2026-05-17. **Session:** 0031. **Branch:** `spike/0031-region-reunfold`.
**Status:** Spike output; subject to revision in promote-to-core (session 0032). Behavior contract; not implementation.

This document specifies the algorithm that v3.5 promotes to `src/core/`
and that v4.3 calls as the engine behind "re-unfold region with alt
weights." Starting point is the pseudocode block at
`docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md` § 7
lines 302–345. Underspecifications in that block are flagged in
`findings.md` and resolved here.

The companion `findings.md` carries the verdict and the next-step
recommendation for session 0032.

## 1. Contract

### Inputs

- `mesh: Mesh3D` — the full source mesh; unchanged across re-unfold.
- `dual: DualGraph` — `buildAdjacency(mesh)`; unchanged across re-unfold.
- `globalLayout: PipelineResult` — the current full-mesh layout (recut
  pieces + pages); the "pinned" content that re-unfold must not
  perturb outside the region.
- `region: Set<number>` — face indices forming a connected subgraph in
  the dual graph. Connectedness is a precondition; the caller (v4.3
  UX) is responsible for surfacing only connected selections to the
  user.
- `regionConstraints` — at minimum a weight-function selector
  (`{ kind: "dihedral" | "blended"; coeffs? }`) and a recut-variant
  selector (`{ kind: "greedy-cut-removal"; orderHeuristic: "edge-length-desc" }`).
  Mirrors `pipelineConfig` shape but scoped to one region; the v3.5
  promote-to-core session formalizes the type. The variant set is
  whatever `src/core/` already supports; in v3 today the only recut
  variant is greedy cut-removal (v3 default).
- `replay` — optional `{ seed: u32; edgeOrderHash: string }`. Present on
  re-application of a stored `appliedFixes` entry; absent on first
  application.

### Output

`RegionReUnfoldResult`:

```typescript
type RegionReUnfoldResult =
  | { kind: "OK";
      spliced: PipelineResult;        // new full-mesh layout
      replay: { seed: u32; edgeOrderHash: string };
                                      // the fields to pin into the
                                      // caller's appliedFixes entry
      diagnostics: { ... };           // per-step counts; see §6
    }
  | { kind: "FAIL";
      reason:
        | "obstacle-unresolvable"
        | "region-overlap"            // local recut couldn't make
                                      // region overlap-free
        | "post-splice-overlap"       // detectOverlaps on the
                                      // spliced full layout is
                                      // non-empty
        | "region-disconnected"
        | "anchor-pinning-precondition-violated";
      diagnostics: { ... };
    };
```

`FAIL` is surfaced to v4.3's PREDICT → SCORE → PREVIEW pipeline, which
marks the fix as "could not apply automatically" (v4 spec § 7) rather
than retry; the user retains the option of manual-pin + full-rerun.

### Preconditions

- `region` is non-empty and forms a connected subgraph of `dual`.
- Every face in `region` is currently placed somewhere in
  `globalLayout`. (Trivially true — every face is in exactly one
  recut piece.)

### Postconditions on `OK`

- `spliced` has the same set of mesh face indices (no face dropped or
  duplicated).
- Every face NOT in `region` has the same 2D position in `spliced`
  as it had in `globalLayout` (bit-exact, not just visually
  equivalent — this is the "pinned outside" contract).
- `detectOverlaps(spliced.layout)` is empty.
- Re-running the algorithm with the same inputs AND the returned
  `replay` produces a `spliced` byte-equal to the first run. This is
  the determinism contract that the v4.3 property test (v4 spec § 4)
  exercises.

## 2. Procedure

Six steps. Each step's failure mode is documented in §4; each step's
diagnostic output is documented in §6.

### Step 1 — Partition region boundary into folds and free edges

Walk `dual.adjacencies`. For each adjacency `(faceA, faceB, edge)`:

| `faceA ∈ region` | `faceB ∈ region` | classification |
|---|---|---|
| true | true | INTERNAL — within-region edge; the region's local pipeline decides whether it folds or cuts |
| true | false | BOUNDARY — region detaches from a pinned face here |
| false | true | BOUNDARY (same) |
| false | false | EXTERNAL — irrelevant to this fix; not consumed |

Among the BOUNDARY edges, classify each by whether it is currently a
**fold-into-an-adjacent-piece** or a **cut-between-pieces** in
`globalLayout`. Concretely: a boundary edge `(rFace, nFace)` (region
face / non-region face) is a fold iff the non-region face `nFace` is in
the same recut piece as some region face that shares an edge with it
*and* the recut's `folds` list contains this adjacency.

In v3's current cut-removal recut, all in-piece face-to-face hops are
edges in `Piece.folds`; cuts are the dual-graph edges NOT in any
piece's `folds`. So the boundary partition is mechanical.

Output: `boundaryFolds: Adjacency[]`, `boundaryCuts: Adjacency[]`. The
region is the **closure** of its faces, not its current piece
membership — that closure may straddle multiple pieces.

### Step 2 — Pick the registration anchor

The registration anchor is **one BOUNDARY edge** that pins the region's
new local layout to the same two endpoints in 2D as it has in the
current global layout. After registration, the region's local layout
sits on the page in the same orientation as before, so the v4 UX
"re-unfold this piece" visually keeps the piece's grounding.

**Selection rule, in priority order:**

1. If `boundaryFolds.length > 0`: pick the LONGEST edge among
   `boundaryFolds` (by 3D edge length, computed from `mesh.vertices`).
   Tie-break by smallest canonical pair key
   `(min(faceA,faceB), max(faceA,faceB))`. Rationale: long edges are
   the most visually grounding for the user; canonical tie-break is
   determinism.
2. Else if `boundaryCuts.length > 0`: pick the LONGEST edge among
   `boundaryCuts`. Same tie-break. Rationale: even a former cut edge
   carries a positional anchor (the two 2D endpoints sit on
   neighboring pieces in `globalLayout` whose page placement is
   pinned).
3. Else (region is the whole mesh or a fully-detached island):
   pick the longest INTERNAL edge of the region; the region simply
   lays out in a canonical frame and the splice step (Step 6) places
   it at the current piece's bounding-box centroid. This is the
   "anchor pinning precondition violated" path noted in the FAIL
   reasons — it's recoverable (the algorithm still completes) but
   the caller (v4.3 UX) loses the visual-position guarantee and
   should surface a "re-unfold may move the piece on the page" hint.
   Diagnostic: `diagnostics.anchorMode = "internal-fallback"`.

**The anchor's 2D pinning.** Whatever edge is chosen, its two
endpoints in 2D are read from `globalLayout` — specifically from
whichever face in `globalLayout` owns the endpoint, deterministically
the one with the smaller mesh face index when multiple faces share
the vertex (this matches the canonical ordering already used in
`Adjacency`). These two `Vec2` values are the **pinned anchor**:
`{ p0: Vec2, p1: Vec2 }`. The region's local layout will be rigidly
transformed so its corresponding edge endpoints sit at exactly these
positions.

> **Departure from v4 spec § 7 pseudocode.** The spec named
> `pickRegistrationAnchor(region, layout)` as a single function. The
> spike refines this to a deterministic priority rule with three
> tiers; the third tier (no boundary) is the entry point the spec did
> not enumerate.

### Step 3 — Build the region-local mesh subset

Construct a `Mesh3D`-shaped view of the region:

```
regionMesh = {
  vertices: mesh.vertices,           // share vertex array verbatim;
                                     // local triangles index into it
  faces: region.faces.map(...)       // the original Triangle for
                                     // each region face, indices
                                     // unchanged
  faceMaterials, mtllibs: undefined  // not relevant to the unfold
}
```

Build `regionDual = buildAdjacency(regionMesh)` over this subset.

**Why not pass `mesh.faces` + a region filter into `buildAdjacency`?**
`buildAdjacency` already throws on non-manifold edges (more than 2
faces per edge); on a region subset, edges that were shared with
non-region faces become **boundary edges shared by exactly 1 face in
`regionMesh`**, which `buildAdjacency` currently throws on. The
algorithm therefore needs a **region-aware variant of
`buildAdjacency`** that treats `boundaryEdges` as open boundaries (1
face only is allowed, not flagged as non-manifold). This is the
specific shape-change `src/core/adjacency.ts` needs in promote-to-core.

**Sketched signature:**
```typescript
function buildRegionAdjacency(
  mesh: Mesh3D,
  region: Set<number>,
): { dual: DualGraph; openBoundary: Adjacency[] }
```
`openBoundary` carries the "1 face only" edges so the local pipeline
knows which edges are forced-cuts (they cannot fold to anything
because the other side is not in `regionMesh`).

### Step 4 — Run the region pipeline

Run the v3 default pipeline (greedy cut-removal) over `regionDual`, but
with two augmentations:

(a) **Forced cuts.** The `openBoundary` edges from Step 3 are
edges-shared-with-pinned-faces; they are NOT considered for folding
in the region-local recut. Equivalently: skip them in the iteration
order, or pre-mark them as "permanent cuts." This is the conceptual
analogue of saying "the region detaches here from the pinned layout —
that's a cut by construction." For BOUNDARY edges that the region's
local recut would naturally make folds (i.e., the user is re-unfolding
to add a fold across what was a cut to a non-region piece), v3.5
promote-to-core decides: in the SIMPLE case (this spike) the boundary
is always cuts — re-unfold cannot fold to a non-region face because
that face's 2D position is pinned and cannot be moved. Folding to it
would require globally relaxing the pinned region, which is out of
scope for v3.5 by construction. **Flagged in `findings.md` as a
v3.5 scope boundary worth strategist acknowledgement.**

(b) **Anchor-first iteration.** The local greedy recut starts with
every region face in its canonical local frame
(`canonicalLayout(mesh, f)` in `cut-removal.ts`). The iteration order
is `regionDual.adjacencies` sorted by 3D edge length descending (the
v3 default `edgeOrderHash`-bearing order — see §5). The merge that
chooses the anchor face's 2D position is the FIRST merge that touches
the anchor face. Before any merges happen, every face is in its own
canonical frame; the anchor face's canonical frame and the global
layout's pinned `anchor.p0, anchor.p1` differ by exactly one rigid
2D transform. **Compute that transform once before the merge loop
starts** and apply it (and only it) to every face position the moment
that face is first attached to the anchor's component (or, equivalently,
apply it to the anchor face's frame in advance — the rigid-unfolding
property guarantees the same end state). This is the realization of
"register to global frame using the anchor edge" from v4 spec § 7
Step 4.

> **Departure from v4 spec § 7 pseudocode.** The spec wrote
> `buildSpanningTree → flatten → recut`. The v3 production pipeline
> replaced this control flow in session 0024 with greedy cut-removal
> (ADR 0007); v3 today does NOT call `buildSpanningTree` or `flatten`
> from `pipeline.ts`. The spec's pseudocode is therefore out of date —
> a v4 spec § 7 revision flagged in `findings.md`.

After the local pipeline:

- `localResult: CutRemovalResult` — its `pieces` are the region's
  output pieces in the region's local 2D frame after the anchor
  transform.

### Step 5 — Resolve obstacles

The **obstacle set** is `globalLayout`'s 2D polygons for every face
NOT in `region`, kept as a polygon set (not a single bounding hull) so
concavities and per-page gaps are preserved. The obstacle set is
**read-only** in this step.

For each piece `P` in `localResult.pieces`, the obstacle check is:

```
for face f in P:
  for face g in obstacleSet:
    if bboxOverlap(f, g) and polygon-clipping intersection(f, g) > 0:
      mark P as colliding
```

This reuses the `anyOverlap` predicate from `cut-removal.ts` verbatim,
extended to the obstacle set as the existingA argument.

If any piece collides:

1. **Try rotation about the anchor edge.** The anchor edge endpoints
   `(p0, p1)` are pinned; rotating around their midpoint changes the
   piece's orientation but if the anchor edge moves, the anchor
   property is violated. So rotation is only available for pieces in
   `localResult.pieces` that DO NOT touch the anchor edge — those
   pieces are free to rotate about ANY point as long as they keep
   their connectivity to the anchor-touching piece (which means
   rotating about their attachment edge, not the anchor edge). For
   the anchor-touching piece itself, **rotation is not available** —
   only the splice's failure path is.

   Concretely: for a non-anchor-touching colliding piece P, identify
   the boundary edge between P and the anchor-touching piece (or
   between P and any pinned-orientation parent piece in
   `localResult`). Rotate P about that boundary edge's midpoint by
   `kπ/N` for `k = 1..N` with `N = 12` (15° steps), checking obstacle
   collision after each rotation. Stop at the first non-colliding
   `k`. This is small enough (12 attempts × O(pieceFaces × obstacleFaces)
   per check) to fit the perf budget, and is documented as a
   parameter the v3.5 promote-to-core session can tune.

2. **If rotation exhausts without finding a clear orientation:**
   try translation. Translate P along the boundary edge direction (the
   edge between P and its parent piece) by ±`step` increments, with
   `step = max(meshEdgeMedian, page.width / 20)`, up to a maximum of
   8 steps in each direction. Stop at the first clear position.

3. **If both rotation and translation fail for any piece:** the
   re-unfold returns `FAIL` with reason `"obstacle-unresolvable"`
   and `diagnostics.collidingPiece = pieceIdx`.

**Termination criterion is the FIRST clear position found, not the
nearest-to-original.** Rationale: determinism + cheap. A
nearest-to-original variant is implementable but adds a sort and a
parameter; v3.5 ships first-found.

> **Departure from v4 spec § 7 pseudocode.** The spec said "rotate /
> translate around the anchor"; the spike refines this to per-piece
> rotation about each piece's parent-edge midpoint (not the anchor
> edge for non-anchor-touching pieces), with explicit step sizes
> (15° rotation, edge-median translation) and bounded attempt counts
> (12 rotation steps, ±8 translation steps). The anchor-touching
> piece itself cannot be rotated by this step — its failure becomes
> the overall fix's failure.

### Step 6 — Splice into the global layout

Construct `splicedLayout` by:

1. Copy `globalLayout`'s pieces and pages structure.
2. For each piece in `globalLayout` that overlapped `region`'s face
   set: **remove every region face from that piece**; if the piece
   becomes empty, remove the piece. Pieces that had a mix of region
   and non-region faces are split — the remaining non-region faces
   stay in their existing pinned 2D positions. (In practice the
   common case is that `region` is one entire `globalLayout` piece;
   then this step removes one piece cleanly.)
3. **Add `localResult.pieces` (now in their resolved 2D positions) as
   new pieces.** Each new piece's `faces` field carries mesh face
   indices; the `layout.faces` array has the resolved 2D positions.
4. **Page assignment:** the new pieces are placed on the page(s) that
   the removed region's faces previously occupied; if the new pieces
   no longer fit on those pages, repaginate ONLY the affected pages
   (other pages untouched). v3.5's promote-to-core session decides
   whether this is `paginate(affectedPages.pieces, pageSpec)` or
   something finer-grained; the spike specifies the contract, not
   the implementation: **non-region pieces on non-affected pages
   retain their exact `placed.transform` values.**

> **Departure from v4 spec § 7 pseudocode.** The spec wrote
> `layout.replaceRegion(region, globalLayout)` as a single call. The
> spike refines: the splice is page-aware (affected pages
> repaginated; others not), and pieces straddling the region/non-region
> boundary are split. **Both behaviors are flagged in `findings.md`
> as v4 spec § 7 underspecifications resolved here.**

5. Run `detectOverlaps(splicedLayout)` over the FULL spliced layout.
   If non-empty: return `FAIL` with reason `"post-splice-overlap"`
   and `diagnostics.postSpliceOverlapCount = overlaps.length`.

6. Otherwise: return `OK` with the resolved layout, the diagnostics,
   and the replay tuple computed in §5.

## 3. The `edgeOrderHash` and `seed` binding (determinism contract)

This is the load-bearing definition for the v4.3 determinism property
test ("applying fixes 0..N from scratch matches the cached layout at
step N"). Two independent implementations of this algorithm against
the same `mesh + dual + region + regionConstraints` MUST produce the
same `edgeOrderHash`.

### `edgeOrderHash` definition

The hash binds the **iteration order over the region's dual-graph
adjacencies** that the local recut walks. Concretely:

1. Compute `regionDual = buildRegionAdjacency(mesh, region)` (Step 3).
2. Compute `lengths[i] = ||mesh.vertices[edge[0]] - mesh.vertices[edge[1]]||`
   for each `regionDual.adjacencies[i]`.
3. Sort `regionDual.adjacencies` indices by `lengths[i]` descending.
   Tie-break: by the canonical pair key
   `(min(faceA, faceB), max(faceA, faceB))` ascending, then by
   `(edge[0], edge[1])` ascending. **Ties MUST be broken
   deterministically; JavaScript's `Array.sort` is stable but the
   tie-break order is part of the contract, not a side effect of
   stability.**
4. Render the sorted order as a string:
   `sortedIndices.map(i => `${adj.faceA}-${adj.faceB}-${adj.edge[0]}-${adj.edge[1]}`).join("|")`
5. `edgeOrderHash = sha256(serialized).hex.slice(0, 32)` — 128-bit
   prefix for readability + collision resistance. The implementation
   uses Web Crypto / Node `crypto`; both produce the same hex.

### `seed: u32` definition

**Current state:** `src/core/` has no RNG. `Math.random` is not called
anywhere in `core/`; `crypto.random*` likewise. Grep against `src/core/`
returns zero matches for `Math.random`, `random`, `seed`, `rng`,
`crypto`. The v3 pipeline is fully deterministic over its inputs
without a seed.

**v3.5 promote-to-core posture (recommended):** `seed: u32` is **NOT
consumed by the v3.5 algorithm**. The field is captured in
`appliedFixes` as a forward-compatibility shape lock — if v4.3+ adds
fix families that use RNG (e.g. random tie-breakers in Variant B
weights, or perturbation in obstacle resolution), the field is already
there. For v3.5, the `replay.seed` returned by this algorithm is
always `0` (or any constant chosen by the promote-to-core session;
`0` is simplest).

**Flag for `findings.md`:** v4 spec § 4 says "each `appliedFixes`
entry pins (a) an RNG seed and (b) a hash of the edge-length ordering
used by cut-removal on the affected region." (a) implies the algorithm
consumes a seed; in v3.5 it does not. This is a documentation drift
the spec edit in 0032 must resolve — either by clarifying that the
seed is reserved for future use (the spike's recommendation) or by
naming where v3.5 actually consumes randomness (the spike does not
introduce randomness).

### Replay contract

On a re-application of an `appliedFixes` entry: the algorithm
recomputes `edgeOrderHash` from inputs and compares against the
captured value. If they DIFFER, the input has drifted (mesh edit, or
implementation change), and the algorithm raises a typed error
`HashMismatchError` rather than silently producing different output.
v4.1 undo/redo treats this as a corruption signal — the engine cannot
guarantee determinism so the fix is dropped from the redo stack with
a user-visible warning.

## 4. Failure modes (per step)

| Step | Failure | Cause | Result |
|---|---|---|---|
| 1 | none — partitioning is mechanical | — | — |
| 2 | "anchor-pinning-precondition-violated" | region has no boundary edges (full-mesh selection or detached island) | proceeds with internal anchor, `diagnostics.anchorMode = "internal-fallback"` |
| 3 | "region-disconnected" | `region` is not connected in `dual` | `FAIL` (caller responsibility but defensively checked) |
| 4 | "region-overlap" | local recut leaves overlaps within the region itself; shouldn't happen with the v3 cut-removal algorithm (which by construction produces overlap-free pieces) but defensively checked | `FAIL` |
| 5 | "obstacle-unresolvable" | rotation + translation grids exhausted without finding a clear placement | `FAIL` |
| 6 | "post-splice-overlap" | `detectOverlaps(splicedLayout)` non-empty (rare — would indicate Step 5's per-piece clearance missed an interaction the global check catches) | `FAIL` |

`FAIL` is surfaced to v4.3's PREDICT → SCORE pipeline as a fix with
`SCORE = -∞`, which gets REJECTed by Step 4 of the scoring loop. The
user sees "could not apply automatically — try manual edit" per v4
spec § 7's fallback line. Manual edit (v4.3's "edge-click direct
manipulation" surface) is the user's recovery path; the v3.5 fallback
to "manual region-pin + full-pipeline-re-run" (v4 spec § 3) is the
v4.3 user's other escape hatch.

## 5. API sketch

```typescript
// Names are illustrative; promote-to-core session 0032 finalizes.

interface RegionReUnfoldInputs {
  mesh: Mesh3D;
  dual: DualGraph;
  globalLayout: PipelineResult;
  region: Set<number>;
  regionConstraints: RegionConstraints;
  replay?: { seed: u32; edgeOrderHash: string };
}

interface RegionConstraints {
  weights: { kind: "dihedral" | "blended"; coeffs?: BlendedCoeffs };
  recut: { kind: "greedy-cut-removal";
           orderHeuristic: "edge-length-desc" };
}

type RegionReUnfoldResult =
  | { kind: "OK";
      spliced: PipelineResult;
      replay: { seed: u32; edgeOrderHash: string };
      diagnostics: RegionReUnfoldDiagnostics }
  | { kind: "FAIL";
      reason: RegionReUnfoldFailReason;
      diagnostics: RegionReUnfoldDiagnostics };

type RegionReUnfoldFailReason =
  | "obstacle-unresolvable"
  | "region-overlap"
  | "post-splice-overlap"
  | "region-disconnected"
  | "anchor-pinning-precondition-violated";

interface RegionReUnfoldDiagnostics {
  anchorMode: "boundary-fold" | "boundary-cut" | "internal-fallback";
  anchorEdge?: { faceA: number; faceB: number; edge: [number, number] };
  regionFaceCount: number;
  boundaryFoldCount: number;
  boundaryCutCount: number;
  localPieceCount: number;       // pieces produced by region recut
  obstacleFaceCount: number;
  obstacleResolutionAttempts: Array<{
    pieceIdx: number;
    rotations: number;           // how many rotation steps tried
    translations: number;        // how many translation steps tried
    resolved: boolean;
  }>;
  postSpliceOverlapCount: number;  // 0 on OK
  spliceAffectedPages: number[];
  edgeOrderHashInput?: string;     // first 64 chars of serialized
                                   // order, for diagnostics only
}

function reUnfoldRegion(
  inputs: RegionReUnfoldInputs,
): RegionReUnfoldResult;
```

## 6. Worked example — synthetic 2-of-8 region on `octahedron.stl`

The full-corpus target (`deer.obj`, largest piece) requires
executing the production pipeline to enumerate piece sizes, which
this session does not (the spike worktree has no `node_modules`; the
prompt forbids silent installs). Instead the worked example uses a
**hand-traceable minimal mesh** that exercises every step of the
algorithm with explicit geometry. The synthetic example demonstrates
the algorithm's behavior; the deer-scale demonstration is the first
deliverable of 0032's promote-to-core session.

### Target

`octahedron.stl`, 8 faces. Baseline pipeline result (per
`docs/baseline-pipeline.md`): **1 piece, 1 page, 1 clean foldability,
0 overlaps.** The single piece contains all 8 faces.

**Region:** faces `{0, 1}` — the two faces that share the "top edge"
of the octahedron. These are adjacent in the dual graph; the other 6
faces form the obstacle.

**Why this choice.** The region is small enough to hand-trace every
transform. The boundary of the region in the dual graph is well-defined
(each region face shares one edge with another region face, and two
edges with non-region faces, for a total of 4 boundary edges and 1
internal edge). The 6 obstacle faces' 2D layout is determined by the
v3 default pipeline and is internally overlap-free by definition. The
algorithm's behavior on this configuration validates Step 1 (boundary
partitioning), Step 2 (anchor selection with multiple candidates),
Step 3 (region-aware adjacency), Step 4 (anchor-first iteration),
Step 5 (no collision expected — sanity case), Step 6 (page-aware
splice).

### Numbers (hand-derived, cross-checked against source code)

Octahedron has 8 faces (cross-checked: `octahedron.stl` baseline row
shows `faces: 8`); 4 faces share each of its 6 vertices. Dual graph
has `3 × F / 2 = 12` adjacencies (each face contributes 3 edges, each
edge counted twice). For `region = {0, 1}` (two faces sharing an
edge):

- **Internal dual edges:** 1 (the shared edge `(0, 1)`).
- **Boundary dual edges:** `(0, x)` for x ∈ {neighbors of face 0
  excluding face 1} = 2 edges; same for face 1 = 2 edges. Total
  boundary: 4.
- **External dual edges:** 12 − 1 − 4 = 7 edges (entirely between
  non-region faces).

Mesh face indexing in `parseStl` follows the file's triangle order; on
the `octahedron.stl` shipped in `test/corpus/`, faces 0 and 1 are
adjacent iff they share a 3D edge. This is verified at runtime via
`buildAdjacency`. For the hand-trace, we assume (and the algorithm
proves at execution) that this adjacency exists; if it does not on the
specific STL byte-order, the worked example trivially relabels `region`
to the first two indices that ARE adjacent.

### Step-by-step trace

**Step 1 — Boundary partition.** With `region = {0, 1}`:
- Internal: `(0, 1)` — 1 adjacency.
- Boundary: 4 adjacencies, each `(rFace, nFace)` with `rFace ∈ {0,1}`
  and `nFace ∈ {2..7}`.
- External: 7 adjacencies among `{2..7}`.

In the current `globalLayout`, every adjacency is either a fold (in
some piece's `folds`) or a cut. The octahedron has 1 piece containing
all 8 faces; the cut-removal algorithm accepted 7 folds (V − 1 for a
spanning tree of 8 faces) and rejected 5 (12 − 7 = 5 cuts). Of the 4
boundary adjacencies, the trace must determine how many are folds vs
cuts; the cut-removal sort is edge-length descending, so the breakdown
depends on octahedron edge lengths (all equal for a regular
octahedron) and the iteration tie-break. For a regular octahedron all
edges are equal, so tie-break by adjacency index is deterministic but
arbitrary — say 3 of 4 boundary edges are folds, 1 is a cut. The
algorithm proceeds the same either way.

**Step 2 — Anchor selection.** From `boundaryFolds` (≥1 in this case),
the longest edge — all equal — wins by tie-break: smallest canonical
pair key. Suppose this is `(0, 2)`. The anchor is:
- `anchorEdge = (0, 2)`, `edge = (v_a, v_b)` for the shared 3D vertex
  indices.
- `anchor.p0 = globalLayout.position(v_a in face 0)`,
  `anchor.p1 = globalLayout.position(v_b in face 0)`. These are two
  specific `Vec2` values read from the layout.
- `diagnostics.anchorMode = "boundary-fold"`.

**Step 3 — Region-aware adjacency.** `buildRegionAdjacency(mesh,
{0,1})` returns:
- `dual.adjacencies = [(0, 1, edge_01)]` — only the internal one.
- `openBoundary = [4 adjacencies]` — the boundary edges, each
  recognized as "1 face only in region."

**Step 4 — Region pipeline.**
- Local recut starts with face 0 and face 1 each in their canonical
  frame.
- `regionDual.adjacencies` has 1 entry: `(0, 1)`. Sort by length
  descending — trivial with 1 entry.
- The merge attempts to fold face 1 onto face 0 across edge `(0, 1)`.
  Computes the rigid transform via `buildTransform`, applies the
  reflection check, succeeds (it's an octahedron face pair — by
  construction it has a valid 2D unfolding).
- Local result: 1 piece containing faces {0, 1}.
- Compute the **anchor transform**: face 0's canonical frame has its
  3 vertices at `[(0,0), (len_01, 0), (apex_x, apex_y)]`. The pinned
  anchor in global frame says: the vertex of face 0 corresponding to
  `anchorEdge`'s first vertex sits at `anchor.p0`, second at
  `anchor.p1`. This is a rigid transform — rotation + translation,
  no reflection (the local frame already chose the apex above the
  edge, matching the global frame's apex placement by construction
  of `canonicalLayout`). Apply this transform to all 2 face's
  positions.
- `edgeOrderHash` = sha256 of `"0-1-v_a,v_b"` (the canonical
  serialization of the 1-entry sorted order) — first 32 hex chars.
- `replay.seed = 0` (no RNG consumed).

**Step 5 — Obstacle resolution.** The region's 1 local piece has 2
faces. Check each against the 6 obstacle faces (the other 6 faces of
the octahedron, in their current `globalLayout` 2D positions).
- For the regular octahedron, the unfolded layout is a strip of 8
  triangles; faces 0 and 1 sit at one end of the strip, and the
  obstacle 6 are arrayed away from them. **No overlap** — the
  re-unfold reproduces the existing layout exactly. The diagnostics
  record `rotations: 0, translations: 0, resolved: true`.

**Step 6 — Splice.**
- `globalLayout` has 1 piece on 1 page. The region's faces `{0, 1}`
  are members of that piece.
- Remove faces `{0, 1}` from the piece → piece now has faces `{2..7}`.
- Add the new local piece (with faces `{0, 1}` in their resolved 2D
  positions) to the same page.
- The new full layout has 2 pieces on 1 page, totaling 8 faces.
  Wait — this is a regression from 1 piece to 2 pieces. **That's the
  expected behavior of re-unfolding a sub-region: the boundary
  becomes cuts** (per the v3.5 scope boundary in Step 4(a)). If the
  user re-unfolds region `{0, 1}` on a piece that already contained
  those faces folded into a larger piece, they have implicitly asked
  "detach this region and lay it out independently" — and that's
  what happens.
- `detectOverlaps(splicedLayout)` — runs on 8 faces, the same 8
  triangles in (possibly different) 2D positions. If the local
  re-unfold reproduced face 0 and face 1 at the same positions as
  the original global layout (the trace argues it does, since the
  anchor pinning matches and the rigid transform from canonical to
  global frame matches `buildLayout`'s root-face convention), then
  `detectOverlaps` returns the same answer as on the original
  layout: empty. `OK`.

### What the trace exercises

| Step | Exercised | Note |
|---|---|---|
| 1 (boundary partition) | yes | 1 internal, 4 boundary, 7 external |
| 2 (anchor selection) | yes (boundary-fold tier) | tie-break used (regular octahedron all edges equal) |
| 3 (region adjacency) | yes | `openBoundary.length = 4` |
| 4 (region pipeline) | yes | single-merge happy path |
| 4 (anchor transform) | yes | hand-derived from canonical frame |
| 5 (obstacle resolution) | yes (no-collision case) | rotation/translation NOT exercised |
| 6 (splice + verify) | yes | piece-split-by-region case |

### What the trace does NOT exercise

The two-face octahedron trace deliberately does not exercise:
- **Anchor pinning precondition violation** (Step 2 tier-3). Would
  require a region equal to the whole mesh, or a region entirely
  detached from any pinned face. Both are degenerate and the
  algorithm specifies the fallback behavior; not worth tracing.
- **Obstacle resolution rotation + translation.** Requires a
  configuration where the local re-unfold collides with the pinned
  obstacle in 2D. On the regular octahedron with a 2-face region
  the geometry doesn't produce collision. This is the most important
  thing the **deer-scale demonstration in 0032 must validate** — the
  spike specifies the rotation grid (12 steps × 15°) and translation
  grid (±8 × median-edge-length) but does NOT validate that the grid
  resolution is sufficient for realistic regions. Flagged in
  `findings.md`.
- **Multiple local pieces.** A region with internal overlaps (e.g.
  the largest deer piece, where cut-removal produced multiple folds
  but the region's local recut might produce a different splitting)
  would produce >1 local piece. The algorithm handles this (Step 5
  per-piece obstacle check); the trace does not exercise it.
- **Post-splice overlap.** A configuration where local pieces clear
  the obstacle individually but a pair of local pieces overlap each
  other after the splice. Not expected (local recut is overlap-free
  internally) but the FAIL path exists for robustness.
- **Region straddling multiple pieces.** Possible if the user
  selects a face set that spans multiple recut pieces; Step 6
  handles this by removing region faces from each affected piece
  and adding the new pieces. Not exercised on octahedron (1 piece).

The deer.obj demonstration in 0032 (or as the first concrete
worked-example in promote-to-core) covers the gaps. The spike's
verdict in `findings.md` is informed by this: ALGORITHM-READY for
the structural shape, NEEDS-REVISION for the spec-document layer.

## 7. Resolutions of v4 spec § 7 underspecifications

Cross-reference: the underspecifications enumerated in `findings.md`
§1; each receives a written resolution here. The four resolutions
that require v4 spec § 7 edits (rather than spike-internal filling-in)
are marked **[spec-edit]** and listed again in `findings.md`'s "v4
spec § 7 revisions needed" block.

| Underspec | Resolution | Location |
|---|---|---|
| `pickRegistrationAnchor` behavior with no fold-edge boundary | tier-3 internal anchor + caller hint | §2 Step 2 |
| `pickRegistrationAnchor` with multiple candidates | longest-3D + canonical-pair-key tie-break | §2 Step 2 |
| `resolveObstacle` transformation menu | per-piece rotation + translation; explicit step sizes | §2 Step 5 |
| `resolveObstacle` termination criterion | first-clear; bounded grids; FAIL on exhaustion | §2 Step 5 |
| `layout.replaceRegion` pre-existing pieces straddling region | per-piece removal of region faces; pieces split if necessary | §2 Step 6 |
| `layout.replaceRegion` page assignment | place new pieces on affected pages; repaginate ONLY affected pages | §2 Step 6 |
| `edgeOrderHash` scope | region-only dual edges, sorted by length descending with canonical tie-break | §3 |
| `edgeOrderHash` computation | sha256 over canonical serialization; first 128 bits hex | §3 |
| FAIL handling vs silent rejection | typed `RegionReUnfoldResult.FAIL` with reason enum + diagnostics | §1 contract, §4 |
| `seed: u32` binding to pipeline RNG **[spec-edit]** | v3.5 consumes no RNG; field is forward-compat shape lock; v4 spec § 4 phrasing implies otherwise and should be revised | §3 |
| v4 spec § 7 pseudocode names `buildSpanningTree + flatten + recut` **[spec-edit]** | the v3 default since ADR 0007 is greedy cut-removal; spec § 7's pseudocode is stale | §2 Step 4 |
| v3.5 scope boundary: boundary edges always cuts post-re-unfold **[spec-edit]** | re-unfold cannot fold the boundary into a pinned non-region face; v4 spec § 7 doesn't acknowledge this constraint and v4.3 fix families should reflect it | §2 Step 4 |
| Splice page-awareness **[spec-edit]** | v4 spec § 7's one-line `replaceRegion` implies page-blind replacement; the algorithm requires page-affected repagination contract | §2 Step 6 |
