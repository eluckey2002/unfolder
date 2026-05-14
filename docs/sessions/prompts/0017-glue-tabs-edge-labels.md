# Session 0017 — Glue tabs with edge labels

## Goal

Make the pieces *buildable* and take rendering multi-piece. Session
0016's recut produces a set of internally-overlap-free `Piece`s; on
their own they are not yet assemblable — a builder has no glue
flaps and no way to know which cut edge mates with which. 0017 adds
that:

- **Edge labels** — every cut edge gets a number; the two mating
  sides (on whichever pieces their faces landed in) carry the *same*
  number, so the builder knows edge `7` here tapes to edge `7`
  there. (`paperfoldmodels` calls these "glue numbers.")
- **Glue tabs** — a trapezoidal flap on the outside of each
  boundary cut edge, on one of the two mating sides, for the builder
  to put glue on.
- **Multi-piece rendering** — this is where `emitSvg` and the app
  finally go multi-piece. The roadmap anticipated this session
  forcing a refactor of the naive per-face SVG emit; it does.

It is the largest v2 session, and it has a dependency chain:
`recut`'s output must be extended to surface the cut edges, then a
new stage builds a renderable model with tabs and labels, then
`emitSvg` serializes a piece, then the app renders all of them. The
Tasks are ordered to follow that chain. No ADR — the decisions here
(tab shape, label scheme, tab-side rule) are naive within-stage
choices, recorded in the session log.

## How this prompt works

Established spec-based prompt (pattern from 0007/0012–0016). The
prompt describes behavior; you implement against the actual
`src/core/` exports. This prompt is itself the written plan
CLAUDE.md section 5's plan-first rule calls for.

At the end you produce an implementation report (**Appendix A**).
If a concern warrants strategist input before locking it in, stop
short of committing and surface it.

## Pre-work consistency scan

Scan `docs/queue.md`. The one open item — `parseStl` negative-path
tests — does not intersect this session's scope.

This session depends on session 0016 (committed at `ec862e6`):
`src/core/recut.ts` exporting `Piece` and `recut`. Confirm it
exists. If `main` has advanced from parallel work, that is fine —
note the actual HEAD.

## Tasks

1. **Create the worktree and verify starting state.** Create a
   worktree for this numbered session; the SessionStart hook prints
   cwd, branch, and `git worktree list`. Confirm `main` is clean,
   note its HEAD (near `ec862e6`). Run `pnpm install` first.

2. **Copy this prompt file into the worktree** — copy the
   authoritative `docs/sessions/prompts/0017-glue-tabs-edge-labels.md`
   from the main checkout.

3. **Extend `src/core/recut.ts`** per **Spec 1** — `Piece` gains a
   `faces` field; `recut` now returns `RecutResult` instead of
   `Piece[]`. Update every caller: `scripts/baseline-pipeline.ts`
   and `test/unit/recut.test.ts` (grep `recut(` to be sure).

4. **Implement `src/core/tabs.ts`** per **Spec 2** — the renderable
   model: classifies each piece's edges, assigns labels, computes
   tab geometry.

5. **Refactor `src/core/emit-svg.ts`** per **Spec 3** — `emitSvg`
   now serializes one `RenderablePiece` (faces, fold lines, cut
   lines, tabs, labels).

6. **Update `src/app/main.ts` and `index.html`** per **Spec 4** —
   the app runs the full pipeline through recut and tabs, and
   renders every piece.

7. **Tests** per **Spec 5** — new `test/unit/tabs.test.ts`; update
   `test/unit/emit-svg.test.ts` and `test/unit/recut.test.ts` for
   the new shapes.

8. **Verify the toolchain.** Run `pnpm type-check`, `pnpm test:run`,
   `pnpm build` — all must pass. Run `pnpm baseline` to confirm the
   harness still runs after the `recut` return-shape change (its
   numbers should be unchanged — this session touches rendering,
   not the algorithm). Report the cumulative test total; count it.

9. **Produce the implementation report** per **Appendix A**.

10. **Stop-if-concerns gate.** If a concern warrants strategist
    input before committing — a deviation, a geometry question on
    the tab construction, an unexpected baseline shift — stop and
    report. Otherwise proceed.

11. **Update `docs/roadmap.md` and `docs/project-state.md`** for the
    status flip: mark 0017 done (`✅`) and 0018 next (`⏭`) in the
    roadmap's "v2 session plan", advance "Where we are now"; in
    `project-state.md` add a Session 0017 entry to "Sessions
    completed", advance "Sessions planned", update "Current phase".
    Match the surrounding style; do not reformat untouched text.

12. **Create the session log** at
    `docs/sessions/0017-glue-tabs-edge-labels.md` with the content
    in **Appendix B**, copied verbatim. Fill the handoff-block
    placeholders.

13. **Wrap the session — run `/wrap-session`.** Commit message:

    ```
    feat: glue tabs, edge labels, and multi-piece rendering
    ```

    Stage explicitly by name (no `git add -A`):
    - `src/core/recut.ts` (modified)
    - `src/core/tabs.ts` (new)
    - `src/core/emit-svg.ts` (modified)
    - `src/app/main.ts` (modified)
    - `index.html` (modified)
    - `scripts/baseline-pipeline.ts` (modified — caller update)
    - `test/unit/tabs.test.ts` (new)
    - `test/unit/emit-svg.test.ts`, `test/unit/recut.test.ts` (modified)
    - `docs/roadmap.md`, `docs/project-state.md` (modified)
    - `docs/sessions/0017-glue-tabs-edge-labels.md` (new)
    - `docs/sessions/prompts/0017-glue-tabs-edge-labels.md` (new)

    If `/wrap-session`'s rebase hits a doc conflict, stop and report.

14. **Report back:** the final `main` HEAD hash, the verification
    results, and the implementation report from Task 9, in a fenced
    block.

## Notes

- ES module imports with `.js` extensions, consistent with `src/`.
- `recut.ts` and `tabs.ts` are pure `src/core/` stages — no
  three.js, no I/O.
- Keep every piece of this naive. Simple trapezoidal tab; labels are
  just sequential integers; one deterministic tab-side rule. The
  v5 roadmap has "multiple tab shapes" — not now.
- Visual verification (run `pnpm dev`, look at the rendered pieces)
  is deferred to Evan, manually, after the commit — as with the v1
  rendering sessions. The unit tests verify the SVG *structure*; a
  human confirms it *looks* right.
- Do not start `pnpm dev` in this session.

---

## Spec 1 — `src/core/recut.ts` extension

0017 needs two things 0016's `recut` computes internally but does
not return: the per-piece mesh face indices, and the full set of
cut edges.

**Changes:**

- `Piece` gains a `faces: number[]` field — the mesh face indices
  of the piece's faces, parallel-indexed to `layout.faces` (so
  `piece.faces[k]` is the mesh face index of `piece.layout.faces[k]`).
  This is the `components[ci]` array `recut` already builds; just
  carry it through.
- `recut` returns `RecutResult` instead of `Piece[]`:
  `interface RecutResult { pieces: Piece[]; cuts: Adjacency[]; }`.
  `cuts` is **every cut edge in the final unfolding** — the
  original `tree.cuts` plus the fold edges the recut promoted to
  cuts. These are the edges a builder glues. `recut` already
  computes the promoted set internally; combine it with `tree.cuts`.
- Update the callers: `scripts/baseline-pipeline.ts` (use
  `result.pieces` where it used the returned array) and
  `test/unit/recut.test.ts`.

**On ADR 0005:** ADR 0005's Decision section describes
`recut(...): Piece[]`. This extends that return shape. The recut
*decision* — greedy set-cover, one-shot, no re-flatten — is
unchanged; ADR 0005 remains the recut decision of record. The
return-shape extension is a 0017 session-log decision, not a new
ADR — the same way ADR 0004 noted it extended `buildSpanningTree`'s
signature beyond ADR 0003's expectation. Record it in the session
log's "Decisions" section.

---

## Spec 2 — `src/core/tabs.ts`

**Exports:** a `RenderablePiece` type, a `RenderEdge` type, and
`buildRenderablePieces(recut: RecutResult): RenderablePiece[]`.

**Purpose:** turn the recut result into a model emit can serialize
directly — every piece's edges classified fold/cut, cuts carrying a
mating label and (on one side) a glue-tab polygon.

**Imports:** `RecutResult`, `Piece` from `./recut.js`; `Adjacency`
from `./adjacency.js`; `Vec2` from `./flatten.js`.

**Types:**

```ts
type RenderEdge =
  | { kind: "fold"; from: Vec2; to: Vec2 }
  | { kind: "cut"; from: Vec2; to: Vec2; label: number; tab: Vec2[] | null };

interface RenderablePiece {
  edges: RenderEdge[];
}
```

**Behavior:**

- **Labels.** Number the cut edges: `recut.cuts[k]` gets label
  `k + 1`. Build a lookup from a cut edge's canonical vertex-pair
  key to its label (and to its `Adjacency`, for the tab-side
  decision). Because both mating sides of a cut edge share the same
  3D edge, they resolve to the same label — that is the matching
  guarantee.
- **Per-piece, per-face, per-edge.** For each piece, for each face
  `k` — its mesh face index is `piece.faces[k]`, its geometry is
  `piece.layout.faces[k]` — walk the face's three edges. For each
  edge, form its canonical vertex-pair key from the `FlatFace`'s
  `vertices`:
  - If the key is among this piece's `folds` (`piece.folds`, keyed
    the same way) → a `{ kind: "fold", from, to }` edge. (Internal
    fold edges will appear twice, once per adjacent face in the
    piece — harmless, the same as v1's emit.)
  - Otherwise it is a **cut edge**. Look up its `label` and its
    `Adjacency`. The tab goes on this side iff
    `piece.faces[k] === min(cut.faceA, cut.faceB)` — a single
    deterministic rule that works whether the mating face is in
    another piece or the same one. Emit
    `{ kind: "cut", from, to, label, tab }` where `tab` is the tab
    polygon if this side gets it, else `null`.
- **Tab geometry.** For a cut edge `(p0, p1)` on a face whose third
  (apex) position is `pApex`: the tab is a trapezoidal flap on the
  *outside* of the edge — the side away from `pApex`. Construct it:
  the unit perpendicular to `p1 − p0`, oriented away from `pApex`,
  is the outward direction; offset outward by a tab height `h` and
  inset slightly along the edge so the flap tapers. A naive sizing:
  `h` ≈ 0.4 × edge length (you may cap it), inset ≈ 0.25 × edge
  length per end. The result is a closed 4-point polygon
  `[p0, p1, p1 + h·out − inset·along, p0 + h·out + inset·along]`.
  Keep it simple — exact constants are yours to pick; the shape and
  the "outside" rule are what matter.
- Return one `RenderablePiece` per `recut.pieces` entry, in order.

**Decisions for the session log:** the tab-side rule
(lower-face-index); the naive trapezoidal tab and its sizing;
labels as sequential integers; fold edges left double-drawn
(per-face iteration, harmless, matches v1's emit).

---

## Spec 3 — `src/core/emit-svg.ts` refactor

`emitSvg` currently takes `(layout, tree)` and draws one layout.
It is refactored to serialize one `RenderablePiece`.

**New signature:** `emitSvg(piece: RenderablePiece): string`.

**Behavior:**

- Compute the viewBox over **all** edge endpoints *and* all tab
  polygon points — tabs extend outside the faces, so they must be
  inside the viewBox. Keep the existing margin / stroke-width /
  dash scaling approach (derive a `size` from the bounding box).
- Draw each `RenderEdge`:
  - `fold` → a dashed `<line>` (as today).
  - `cut` → a solid `<line>`; if it has a `tab`, a thin-stroked
    `<polygon>` for the flap (no fill, or a very light fill); and a
    small `<text>` label near the edge's midpoint, offset slightly
    toward the face interior so it does not collide with the tab.
- Return the complete `<svg>` string for the one piece.

Keep `emit-svg.ts` serialization-only — no geometry computation
beyond the bounding box; the tab polygons and labels arrive
precomputed in the `RenderablePiece`.

---

## Spec 4 — `src/app/main.ts` and `index.html`

The app currently runs the v1 pipeline and shows a single net. It
goes multi-piece.

- **`main.ts`:** run the full pipeline — `parseStl` →
  `buildAdjacency` → `computeDihedralWeights` → `buildSpanningTree`
  → `buildLayout` → `detectOverlaps` → `recut` →
  `buildRenderablePieces`. Then `emitSvg` each `RenderablePiece` and
  inject them all into `#net` — each piece's SVG in its own small
  container, with a "piece N" caption. Keep the 3D `#viewport`
  exactly as is. Update the console log to report piece count.
- **`index.html`:** `#net` becomes a scrollable container holding
  the piece cards (a simple vertical scroll or wrap-grid). Adjust
  the CSS that currently assumes a single full-bleed SVG. Keep it
  minimal — a readable column of pieces is enough; polished page
  layout is session 0018's job.

This is a dev-server demo, not the real UI (that is v4). Minimal
and functional is the bar.

---

## Spec 5 — tests

**`test/unit/tabs.test.ts` (new)** — validate `buildRenderablePieces`
against hand-built `RecutResult` fixtures:

- **Matching labels.** A cut edge whose two faces land in different
  pieces → the cut edge appears in both pieces' `RenderablePiece`s
  with the *same* `label`.
- **One tab per cut.** For that same cut edge, exactly one of the
  two sides has a non-null `tab` — the lower-face-index side.
- **Tab is on the outside.** For a cut edge on a face with a known
  apex position, assert the tab polygon's points lie on the
  opposite side of the edge from the apex.
- **Fold vs cut classification.** A fold edge → `kind: "fold"`, no
  label, no tab; a cut edge → `kind: "cut"` with a label.

Use hand-built `RecutResult` fixtures (construct `Piece`s with
chosen `faces`, `layout`, `folds`, and a `cuts` list) — small and
exact. You may also run one corpus model end to end as an
integration check (`ginger-bread.obj` through the full pipeline →
`recut` → `buildRenderablePieces`, asserting every cut label
appears exactly twice across all pieces).

**`test/unit/emit-svg.test.ts` (update)** — for `emitSvg(piece:
RenderablePiece)`: well-formed SVG; fold edges produce dashed
`<line>`s; cut edges produce solid `<line>`s; a cut with a tab
produces a `<polygon>` and a `<text>` label.

**`test/unit/recut.test.ts` (update)** — adjust for the
`RecutResult` return shape and the new `Piece.faces` field; the
existing recut assertions (piece counts, internal overlap-freeness)
are unchanged in substance.

---

## Appendix A — Implementation report template

After Task 8's verification passes, produce a report in this exact
structure and include it in your final reply.

````markdown
## Implementation report — Session 0017

### Decisions made within the spec
- **recut.ts:** [how you surfaced `faces` and assembled `cuts`;
  what the caller updates touched]
- **tabs.ts:** [the tab-geometry construction and constants you
  chose, the label lookup structure, anything the spec did not pin
  down]
- **emit-svg.ts:** [how tabs and labels are drawn, viewBox handling]
- **main.ts / index.html:** [how the pieces are laid out in the
  page]

### Deviations from spec
- [Anything that diverged, with reasoning. If nothing: "None."]

### Verification
- `pnpm type-check`: [result]
- `pnpm test:run`: [cumulative total]
- `pnpm build`: [result]
- `pnpm baseline`: [ran / numbers unchanged from 0016, as expected]

### Concerns / second-look candidates
- [Subtle corners worth a strategist eye — the tab geometry on
  thin or oddly-shaped faces, label legibility, the internal-cut
  case. If nothing: "None."]
````

---

## Appendix B — Session log content

Create `docs/sessions/0017-glue-tabs-edge-labels.md` with this
content, verbatim. Fill the handoff-block placeholders; append to
"Decisions made or deferred" only if you made notable choices not
already covered.

````markdown
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
  length. The roadmap's "multiple tab shapes" is v5.
- **Labels are sequential integers**, shared by both mating sides
  via the common 3D edge.

## Handoff

- **Branch / worktree:** `claude/<name>` at
  `.claude/worktrees/<name>/` — fill in.
- **Commits:** `<short-sha> feat: glue tabs, edge labels, and multi-piece rendering`
  — fill in the SHA.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` <N>
  passing; `pnpm build` clean; `pnpm baseline` runs, numbers
  unchanged from 0016.
- **Decisions made or deferred:** recut return-shape extended (not
  an ADR change); tab-side rule lower-face-index; naive trapezoidal
  tab; sequential-integer labels.
- **Queue / roadmap deltas:** Roadmap — 0017 → ✅, 0018 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0017 added to Sessions
  completed; Sessions planned advanced. `docs/queue.md` — unchanged.
- **Open questions for the strategist:** [Anything needing
  Cowork-side follow-up — e.g. tab geometry that looked off on a
  particular model. Otherwise: none.]
````
