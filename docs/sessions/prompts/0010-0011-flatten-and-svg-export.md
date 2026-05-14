# Sessions 0010 + 0011 — Flatten and SVG export (bundled)

## Goal

This is a **bundled prompt covering two pipeline stages** — the last
two of v1. Completing both means v1 is done: load a platonic solid,
run the full pipeline, see its unfolded net rendered as SVG in the
browser.

- **Part A — Session 0010, Flatten.** Walk the spanning tree from
  the root face, placing each face on the 2D plane. Output: a
  `Layout2D` — for each face, the 2D positions of its three
  vertices. Rigid unfolding: every triangle keeps its original
  size and shape; only dihedral angles flatten to 180°.
- **Part B — Session 0011, SVG export.** Serialize the `Layout2D`
  to an SVG string (fold edges dashed, cut edges solid), and wire
  the full pipeline into `src/app/` so the unfolded net displays
  in the browser alongside the 3D viewport. v1 walking skeleton
  complete.

## How this prompt works

Spec-based for implementation. Verbatim for type definitions,
session-log content, and doc edits. Math formulas in specs are
given precisely (they're not version-dependent library APIs —
specifying the geometry exactly is correct and helpful). Library
*interactions* are described as intent, not dictated call
signatures.

**This prompt has an internal checkpoint between Part A and Part
B.** Part A is implemented, verified, and committed first. Only
if Part A's verification is green AND its mini-report surfaces no
correctness concerns do you proceed to Part B. If either fails,
stop at the checkpoint and report — Part B must not build on an
unverified flatten stage.

Two commits land in this one invocation: `0010` after Part A,
`0011` after Part B. Fast-forward `main` once at the very end.

## Pre-work consistency scan

Scan `docs/queue.md` — one open item (working-agreements
consolidation), does not intersect this work. Scan
`docs/project-state.md` and `docs/roadmap.md` for stale content;
surface anything in the final report. No queue items close.

## Starting state

From the main checkout at `/Users/eluckey/Developer/origami`,
confirm `main` is at `2745764` (Session 0009's commit). If `main`
has advanced, surface it and proceed — verification hashes will
just differ.

Work in a fresh worktree branch (worktree-by-default for numbered
sessions). Run `pnpm install` in the worktree before any
verification commands — fresh worktrees lack `node_modules`.

---

# PART A — Session 0010: Flatten

## Tasks (Part A)

A1. **Create `src/core/flatten.ts`** per **Spec A** below. Type
    definitions are in **Appendix A1**, verbatim.

A2. **Implement `test/unit/flatten.test.ts`** per **Spec B** below.

A3. **Verify Part A.** From the worktree:

    ```
    pnpm install
    pnpm type-check
    pnpm test:run
    pnpm build
    ```

    All should succeed. Tests should report 15 passing total
    (1 sanity + 4 parser + 3 adjacency + 3 spanning-tree + 4
    flatten). If any fails, stop and report — do not proceed to
    the checkpoint.

A4. **Create the Session 0010 session log** at
    `docs/sessions/0010-flatten.md` with the content in
    **Appendix A2**, verbatim.

A5. **Update `docs/roadmap.md` and `docs/project-state.md` for
    Session 0010** per **Appendix A3**.

A6. **Commit Part A** with this message:

    ```
    feat: flatten stage — 2D layout from spanning tree
    ```

    Files: `src/core/flatten.ts`, `test/unit/flatten.test.ts`,
    `docs/sessions/0010-flatten.md`, `docs/roadmap.md`,
    `docs/project-state.md`, and this prompt file
    `docs/sessions/prompts/0010-0011-flatten-and-svg-export.md`
    (per the prompt-cadence rule — the bundled prompt commits
    with the first of its two sessions).

## CHECKPOINT

After A6, produce a **Part A mini-report**:

```
## Part A checkpoint — Flatten

- Verification: [green / red — details if red]
- Decisions made within Spec A: [brief]
- Concerns / second-look candidates: [list, or "None"]
- Proceeding to Part B: [yes / no — and why if no]
```

**Decision rule:** proceed to Part B only if verification is
green AND there are no correctness concerns. A correctness
concern is anything suggesting the flatten geometry might be
wrong — a degenerate case, an unsure side-selection, a test you
weren't confident really exercises the invariant. Style nits or
informational notes are not correctness concerns; proceed past
those.

If proceeding: continue to Part B, include this mini-report's
content in the final combined report.

If stopping: report the mini-report to Evan and await direction.
Part A is already committed (A6), so the flatten work is safely
landed regardless.

---

# PART B — Session 0011: SVG export

## Tasks (Part B)

B1. **Create `src/core/emit-svg.ts`** per **Spec C** below. Type
    note in **Appendix B1**.

B2. **Implement `test/unit/emit-svg.test.ts`** per **Spec D**.

B3. **Wire the full pipeline into `src/app/`** per **Spec E** —
    `index.html` gets a split layout, `main.ts` runs the whole
    pipeline and displays the SVG net.

B4. **Verify Part B.** From the worktree:

    ```
    pnpm type-check
    pnpm test:run
    pnpm build
    ```

    Tests should report 18 passing total (15 from Part A + 3
    emit-svg). If any fails, stop and report.

B5. **Create the Session 0011 session log** at
    `docs/sessions/0011-svg-export.md` with the content in
    **Appendix B2**, verbatim.

B6. **Update `docs/roadmap.md` and `docs/project-state.md` for
    Session 0011** per **Appendix B3**. This is the v1-complete
    update.

B7. **Commit Part B** with this message:

    ```
    feat: SVG export — v1 walking skeleton complete
    ```

    Files: `src/core/emit-svg.ts`, `test/unit/emit-svg.test.ts`,
    `src/app/main.ts`, `index.html`,
    `docs/sessions/0011-svg-export.md`, `docs/roadmap.md`,
    `docs/project-state.md`.

B8. **Fast-forward `main`** from the worktree branch (both
    commits land). If a collision with the prompt file in the
    main checkout occurs, the resolution is the documented
    pattern: verify byte-identical via `diff -q`, remove the
    main copy, then FF.

B9. **Report back:** final `main` HEAD hash, both commits'
    hashes, all verification results, final test count, and the
    **combined implementation report** per **Appendix C**.

## Notes

- Visual verification (`pnpm dev`, open browser, see the 3D
  shape and its unfolded net side by side) is deferred to Evan,
  manually, after both commits land.
- `getThirdPoint` is pure math — the spec gives the formula
  precisely. Implement it faithfully; it's the crux of flatten's
  correctness.
- The side-selection logic is the historically fragile part
  (the paperfoldmodels writeup flagged it). Spec A describes it
  as an explicit geometric side test — implement exactly that
  approach, do not substitute a halfedge-convention method.
- ES module imports with `.js` extensions throughout.
- Do not start `pnpm dev` in this session.
- roadmap.md Main HEAD line: Part A sets it to `2745764`; Part B
  leaves it (one-commit staleness is the convention).

---

## Spec A — `src/core/flatten.ts`

**Exports:**
- `getThirdPoint(p0: Vec2, p1: Vec2, d0: number, d1: number): [Vec2, Vec2]`
- `buildLayout(mesh: Mesh3D, tree: SpanningTree): Layout2D`
- the `Vec2`, `FlatFace`, `Layout2D` types from Appendix A1.

**Imports:** `Mesh3D`, `Vec3` from `./mesh.js`; `SpanningTree`
from `./spanning-tree.js`; `Adjacency` from `./adjacency.js` if
needed.

### `getThirdPoint`

Given two 2D points `p0`, `p1` and the distances `d0` (from `p0`
to an unknown point) and `d1` (from `p1` to that point), return
the **two** possible positions of the unknown point — the
circle-circle intersection.

Formula:
- Let `(dx, dy) = p1 - p0`, and `L = sqrt(dx² + dy²)` the distance
  between the centers.
- If `L` is 0 (coincident points), throw — degenerate input.
- `a = (d0² - d1² + L²) / (2 * L)` — signed distance from `p0`
  along the `p0→p1` direction to the foot of the perpendicular.
- `h² = d0² - a²`. If `h²` is slightly negative from float error,
  clamp to 0. (A meaningfully negative `h²` means the circles
  don't intersect — for valid mesh input this shouldn't happen;
  clamping handles only the float-epsilon case.)
- `h = sqrt(h²)`.
- Foot point `pm = p0 + (a / L) * (dx, dy)`.
- The perpendicular direction is `(-dy, dx) / L`.
- The two solutions: `pm + h * perp` and `pm - h * perp`.
- Return both, as a `[Vec2, Vec2]` tuple.

### `buildLayout`

Walk `tree` from its root, placing each face in 2D.

**3D edge length helper:** for two vertex indices into
`mesh.vertices`, the 3D Euclidean distance between them. You'll
need this repeatedly.

**Place the root face.** `root = tree.root`. Its three vertex
indices are `mesh.faces[root] = [a, b, c]`.
- Vertex `a` → `(0, 0)`.
- Vertex `b` → `(len3D(a, b), 0)`.
- Vertex `c` → `getThirdPoint((0,0), (len3D(a,b),0), len3D(a,c),
  len3D(b,c))`, picking the solution with the **larger y**
  (the `+y` half-plane). This is an arbitrary but consistent
  choice for the root.
- Record `layout.faces[root]` with `vertices: [a, b, c]` and
  `positions` the three 2D points in that same order.

**Place each non-root face.** Derive a traversal order where
every face is visited after its parent — a BFS from `root` using
`tree.parent` (build a children list from `parent`, then BFS).
For each non-root face `f` with parent `p = tree.parent[f]`:

- **Find the shared edge.** It's the `edge` of the fold
  `Adjacency` in `tree.folds` that connects `f` and `p`. Build a
  lookup once (keyed by the unordered face pair) so this is O(1)
  per face. The shared edge is two vertex indices `(s0, s1)`,
  both of which appear in `mesh.faces[f]` and `mesh.faces[p]`.
- **Get the shared vertices' 2D positions** from the parent's
  already-placed `layout.faces[p]`. (Look up which of the
  parent's three `vertices` entries equal `s0` and `s1`, take
  the matching `positions`.) Call these `P_s0` and `P_s1`.
- **Identify the child's apex** — the one vertex of
  `mesh.faces[f]` that is neither `s0` nor `s1`. Call it
  `apexV`.
- **Compute apex candidates:** `getThirdPoint(P_s0, P_s1,
  len3D(apexV, s0), len3D(apexV, s1))` — two positions.
- **Side selection.** The apex must land on the *opposite* side
  of the shared-edge line from the parent's apex. The parent's
  apex is the parent vertex that is neither `s0` nor `s1`; its
  2D position is in `layout.faces[p]`. Compute the side of a
  point relative to the directed line `P_s0 → P_s1` using the
  2D cross product: `side(P) = cross(P_s1 - P_s0, P - P_s0)`,
  where `cross((ux,uy),(vx,vy)) = ux*vy - uy*vx`. The sign of
  `side(parentApex)` tells you which side the parent's apex is
  on. Pick the `getThirdPoint` candidate whose `side(...)` has
  the **opposite sign**. (If a candidate's side is ~0 — on the
  line — that's degenerate; pick the other candidate.)
- **Record `layout.faces[f]`** with `vertices: mesh.faces[f]`
  and `positions` assigning `P_s0` to wherever `s0` sits in the
  vertex triple, `P_s1` to `s1`, and the chosen apex candidate
  to `apexV`.

Return the `Layout2D`. Pure function, no I/O.

---

## Spec B — `test/unit/flatten.test.ts`

**Imports:** `parseStl`, `buildAdjacency`, `buildSpanningTree`,
`buildLayout`, `getThirdPoint` from the respective `src/core/`
modules; vitest `describe`/`it`/`expect`; `node:fs`/`node:path`/
`node:url` as in the prior test files.

**Setup:** a `layoutFromCorpus(name)` helper running the full
parse → adjacency → tree → layout chain.

**Tests** (single `describe("flatten")`):

- `getThirdPoint: known 3-4-5 triangle` — for `p0 = (0,0)`,
  `p1 = (4,0)`, `d0 = 5`, `d1 = 3`: one of the two returned
  points should be `(4, 3)` and the other `(4, -3)` (within a
  small epsilon). Asserts the circle-circle math directly.
- `tetrahedron: every face's 2D triangle is congruent to its
  3D triangle` — for each face, the three 2D edge lengths
  (between consecutive `positions`) match the three 3D edge
  lengths (between the corresponding `mesh.vertices`) within
  epsilon. This catches `getThirdPoint` errors.
- `tetrahedron: child apexes land opposite their parent apexes`
  — for each fold adjacency, confirm the two faces' non-shared
  apex points lie on opposite sides of the shared-edge line
  (opposite cross-product signs). This catches side-selection
  bugs (a triangle folded back onto its parent).
- `cube and octahedron: congruence holds` — same congruence
  check as the tetrahedron test, run for `cube.stl` and
  `octahedron.stl`. (One `it` covering both is fine.)

Epsilon: use something like `1e-9` for these comparisons;
coordinates derive from the integer-coordinate corpus so error
stays tiny.

---

## Spec C — `src/core/emit-svg.ts`

**Exports:** `emitSvg(layout: Layout2D, tree: SpanningTree): string`

**Imports:** `Layout2D`, `Vec2` from `./flatten.js`;
`SpanningTree` from `./spanning-tree.js`.

**Purpose:** serialize a `Layout2D` to a complete SVG document
string. Fold edges dashed, cut edges solid. Pure function.

**Behavior:**

- **Bounding box.** Scan every `Vec2` across every face's
  `positions`. Compute `minX, minY, maxX, maxY`. Add a margin
  (e.g. 5% of the larger dimension, or a small fixed value).
- **viewBox.** The SVG's `viewBox` is
  `"${minX-margin} ${minY-margin} ${width+2*margin}
  ${height+2*margin}"`. The SVG opening tag includes
  `xmlns="http://www.w3.org/2000/svg"` and the `viewBox`.
- **Fold-edge set.** Build a `Set` of canonical fold-edge keys
  from `tree.folds` — each fold `Adjacency` has an `edge`
  `[v0, v1]`; canonicalize as `"${min},${max}"`.
- **Draw edges.** For each face in `layout.faces`, for each of
  its three edges (vertex pairs `(vertices[0],vertices[1])`,
  `(vertices[1],vertices[2])`, `(vertices[2],vertices[0])` with
  their corresponding `positions`): emit an SVG `<line>` element
  from one position to the other. If the vertex pair's canonical
  key is in the fold-edge set, the line is a **fold** — give it
  a dashed stroke (e.g. `stroke-dasharray`). Otherwise it's a
  **cut** — solid stroke. Use a thin stroke width and a visible
  color; the exact styling is your call, just make fold vs. cut
  visually distinct.
- Per-face-per-edge drawing means fold edges get drawn twice at
  the same coordinates (harmless) and cut edges get drawn twice
  at different coordinates (correct — both sides of a cut).
- **Return** the complete SVG document string: `<svg ...>` …
  `</svg>`.

---

## Spec D — `test/unit/emit-svg.test.ts`

**Imports:** the full chain (`parseStl` … `buildLayout`) plus
`emitSvg`; vitest; node fs/path/url.

**Setup:** an `svgFromCorpus(name)` helper running the full
chain through `emitSvg`.

**Tests** (single `describe("emitSvg")`):

- `produces a well-formed SVG document` — the string starts with
  `<svg` and ends with `</svg>`, and contains a `viewBox=`
  attribute.
- `tetrahedron: one line per face-edge` — the tetrahedron's SVG
  contains exactly 12 `<line` substrings (4 faces × 3 edges).
- `cube and octahedron: line counts match face-edge totals` —
  cube SVG has 36 `<line` substrings (12 × 3), octahedron has
  24 (8 × 3).

---

## Spec E — `src/app/` wiring

**`index.html`:** replace the single full-viewport `#viewport`
with a **split layout** — two regions side by side (or stacked
on narrow viewports): `#viewport` for the 3D mesh (as today) and
`#net` for the unfolded SVG. Keep the dark background. Each
region roughly half the space. Minimal CSS — flexbox or grid.

**`src/app/main.ts`:** after parsing the tetrahedron and
creating the 3D viewport (as today), run the rest of the
pipeline — `buildAdjacency`, `buildSpanningTree`, `buildLayout`,
`emitSvg` — and inject the resulting SVG string into the `#net`
element (`element.innerHTML = svg` is fine; the string is our
own trusted output). Keep the existing `console.log` of the
parsed mesh stats; optionally add a similar log line for the
layout (face count).

Do not over-specify the three.js or DOM calls — describe the
intent (split layout, inject the SVG net) and implement with
current API knowledge.

---

## Appendix A1 — Type definitions for `src/core/flatten.ts` (verbatim)

```ts
import type { Mesh3D } from "./mesh.js";
import type { SpanningTree } from "./spanning-tree.js";

/** A 2D point. */
export type Vec2 = [number, number];

/**
 * One face placed in the 2D plane. `vertices` are the mesh vertex
 * indices (same as Mesh3D.faces[i]); `positions` are their 2D
 * placements, in the same order.
 */
export interface FlatFace {
  vertices: [number, number, number];
  positions: [Vec2, Vec2, Vec2];
}

/**
 * The unfolded 2D layout. `faces` is indexed parallel to
 * Mesh3D.faces — `faces[i]` is the planar placement of
 * `Mesh3D.faces[i]`. The same 3D vertex may appear at different
 * 2D positions in different faces; that is the nature of an
 * unfolding.
 */
export interface Layout2D {
  faces: FlatFace[];
}
```

---

## Appendix A2 — `docs/sessions/0010-flatten.md` (verbatim)

````markdown
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
````

---

## Appendix A3 — Session 0010 doc edits

**`docs/roadmap.md`:**
- `**0010 — Flatten.** ⏭ Walk the spanning tree...`
  → `**0010 — Flatten.** ✅ Walk the spanning tree...`
- `**0011 — SVG export.** Emit the flattened layout...`
  → `**0011 — SVG export.** ⏭ Emit the flattened layout...`
- "Where we are now": `**Last completed session:** 0009
  (spanning tree).` → `**Last completed session:** 0010
  (flatten).`; `**Next planned session:** 0010 — Flatten.` →
  `**Next planned session:** 0011 — SVG export.`; set
  `**Main HEAD:**` to `\`2745764\``.
- Section intro prose: `Sessions 0001–0009 are committed to
  \`main\`; 0010–0011 are planned.` → `Sessions 0001–0010 are
  committed to \`main\`; 0011 is planned.`

**`docs/project-state.md`:**
- Append to "Sessions completed":
  `- **Session 0010 — Flatten.** Rigid unfolding in \`src/core/flatten.ts\` — \`getThirdPoint\` primitive and \`buildLayout\` walking the spanning tree, with an explicit geometric side test for apex placement. Log: \`docs/sessions/0010-flatten.md\`.`
- In "Sessions planned", remove the Session 0010 bullet and
  update the intro to "Session 0011 completes v1."

---

## Appendix B1 — Type note for `src/core/emit-svg.ts`

`emit-svg.ts` defines no new exported types — it imports
`Layout2D` and `Vec2` from `./flatten.js` and `SpanningTree`
from `./spanning-tree.js`, and exports the single function
`emitSvg`.

---

## Appendix B2 — `docs/sessions/0011-svg-export.md` (verbatim)

````markdown
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
````

---

## Appendix B3 — Session 0011 doc edits

**`docs/roadmap.md`:**
- `**0011 — SVG export.** ⏭ Emit the flattened layout...`
  → `**0011 — SVG export.** ✅ Emit the flattened layout...
  v1 complete.`
- "Where we are now": `**Phase:** v1 — Walking Skeleton.` may
  stay or be annotated complete — set `**Last completed
  session:** 0011 (SVG export).` and change `**Next planned
  session:**` to something like `v2 planning (session plan
  to be drafted).` Leave the Main HEAD line as Part A set it
  (one-commit staleness is the convention).
- Section intro prose: `Sessions 0001–0010 are committed to
  \`main\`; 0011 is planned.` → `Sessions 0001–0011 are
  committed to \`main\`. v1 is complete.`

**`docs/project-state.md`:**
- Append to "Sessions completed":
  `- **Session 0011 — SVG export.** \`emitSvg\` in \`src/core/emit-svg.ts\`; full pipeline wired into the browser app with a split 3D/net layout. v1 walking skeleton complete. Log: \`docs/sessions/0011-svg-export.md\`.`
- "Sessions planned": replace the section's remaining content
  with a note that v1 is complete and v2's session-level plan
  is the next strategist task.
- "Current phase" section: annotate that v1 is complete and v2
  is the next phase (keep it brief — the strategist will do a
  fuller pass when planning v2).

---

## Appendix C — Combined implementation report template

After B4's verification, produce this combined report in the
final reply:

````markdown
## Implementation report — Sessions 0010 + 0011

### Part A — Flatten (Session 0010)

**Decisions made within Spec A:**
- [getThirdPoint implementation choices; buildLayout traversal
  approach; side-selection details; helper names]

**Deviations from Spec A:** [or "None."]

**Concerns / second-look candidates:** [or "None."]

### Part B — SVG export (Session 0011)

**Decisions made within Spec C / Spec E:**
- [emitSvg structure; SVG styling choices; app wiring approach]

**Deviations from Spec C/D/E:** [or "None."]

**Concerns / second-look candidates:** [or "None."]

### Library APIs / patterns verified
- [Anything checked against current docs — three.js or DOM APIs
  touched by the app wiring, SVG attribute correctness, etc.]

### Stale content discovered (adjacent files)
- [Anything stale in project-state.md / roadmap.md / queue.md.
  Or "None."]

### Test output
- Total: N passed / N failed / N skipped
- New this bundle: N flatten + N emit-svg
- Commits: 0010 = <hash>, 0011 = <hash>
````
