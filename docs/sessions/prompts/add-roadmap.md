# Maintenance — add roadmap document

## Goal

Create `docs/roadmap.md` as the consolidated forward view of the
project: v1–v6 phase plan + v1 session plan + current status. Update
`docs/project-state.md` to reference the new doc and add a small
working-agreement bullet about roadmap maintenance. Add two
convention-clarification items to `docs/queue.md`.

This is a maintenance commit, not a numbered session. No session log
required. The prompt is saved at
`docs/sessions/prompts/add-roadmap.md` (no number prefix) per the
emerging convention that maintenance work doesn't take session
numbers.

## Pre-work consistency scan

Scan `docs/queue.md` and `docs/project-state.md` for items or
references that intersect this work. Expected: no items close; two
items get added (see Task 4).

## Tasks

1. **Verify starting state.** From the main checkout, confirm `main`
   is at `1ed6b09`, working tree is clean (untracked at `.claude/`
   and `docs/sessions/prompts/` are expected).

2. **Create `docs/roadmap.md`** with the content in **Appendix A**
   below, copied verbatim.

3. **Edit `docs/project-state.md`** in two places:

   a. In the "Where to look" section, add this bullet immediately
      after the `README.md` bullet:

      ```
      - `docs/roadmap.md` — v1–v6 phase plan and v1 session-level status at a glance
      ```

   b. At the end of the "Working agreements" section, append this
      bullet (preserving the existing bullet formatting):

      ```
      - **The strategist maintains `docs/roadmap.md`.** Status flags
        flip from planned to completed when a session commits; phase
        descriptions only change when a phase's ship-state commitment
        itself changes (an ADR-worthy event).
      ```

4. **Edit `docs/queue.md`** to append two new items at the end of the
   open-items list:

   ```
   - [convention] Clarify worktree-vs-direct-main pattern: should every
     Claude Code session use a worktree branch + ff-merge, or is
     direct-`main` work acceptable when the change is low-risk?
     Surfaced 0006.
   - [convention] Clarify when work warrants session-number ceremony
     (saved prompt, session log, status entry) vs. when it can land as
     a plain maintenance commit. The roadmap-add commit is the first
     precedent for the latter. Surfaced post-0006.
   ```

5. **Stage all changes and commit** with this message:

   ```
   docs: add roadmap and capture related working-agreement updates
   ```

   Files to stage:
   - `docs/roadmap.md` (new)
   - `docs/project-state.md` (modified — two additions)
   - `docs/queue.md` (modified — two new items)

   Do NOT stage `node_modules/`, `dist/`, or anything under
   `docs/sessions/prompts/`.

6. **If you worked in a worktree**, fast-forward `main` to the new
   commit. If you committed directly on `main` (as in Session 0006),
   skip this step.

7. **Report back:** the final `main` HEAD hash, confirmation the
   three files staged correctly, and any drift you spotted during
   the consistency scan that's worth surfacing.

## Notes

- No session log file. This commit is plain maintenance.
- If `docs/queue.md`'s existing open-items list has formatting that
  differs from the snippets above (e.g., indentation), match the
  existing style. The intent is "two items appended at the end."
- The roadmap doc references session status via emoji (`✅`, `⏭`).
  Preserve those exactly.
- The `docs/project-state.md` "Where to look" section currently lists
  files in a specific order. Insert the roadmap bullet immediately
  after the `README.md` bullet to keep it near the top.

---

## Appendix A — `docs/roadmap.md`

```markdown
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

**Phase:** v1 — Walking Skeleton.
**Last completed session:** 0006 (test corpus generation).
**Next planned session:** 0007 — Mesh loading.
**Main HEAD:** `1ed6b09`.

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

Sessions 0001–0011 complete v1. Sessions 0001–0006 are committed to
`main`; 0007–0011 are planned.

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
- **0007 — Mesh loading.** ⏭ Parse STL files; render triangles on a
  canvas via three.js. First `src/core/` and `src/app/` code.
- **0008 — Face adjacency graph.** Build the dual graph (one node
  per face, edges between adjacent faces).
- **0009 — Spanning tree.** DFS over the adjacency graph; classify
  each edge as fold or cut.
- **0010 — Flatten.** Walk the spanning tree to assign 2D
  coordinates to every face.
- **0011 — SVG export.** Emit the flattened layout as printable SVG.
  v1 complete.

## Beyond v1

v2 through v6 don't have session-level plans yet. They will be
drafted when v1 lands, with the v1 experience informing the
granularity and scope of each subsequent session. The phase
descriptions above are the current commitment; the sessions inside
each phase will emerge.

## Maintaining this document

Updated by the strategist at the end of any session whose status
changes. Status flags (`✅`, `⏭`, blank for planned-but-not-active)
live in the v1 session list. Phase descriptions only change when a
phase's ship-state commitment itself changes — a substantive enough
event to warrant its own ADR.
```
