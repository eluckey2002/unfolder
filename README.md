# unfolder

A browser-based papercraft unfolding tool. Open a 3D mesh, get a printable flat pattern out.

## What this is

`unfolder` takes a 3D model (STL, OBJ) and produces a 2D layout of its faces, connected along shared edges, that can be printed, cut, scored, folded, and glued back into the original 3D form. It's a from-scratch implementation in the same family as Pepakura Designer and similar papercraft tools.

The long-term goal is feature parity with Pepakura, in the browser, cross-platform, free.

## Why build this

Two reasons:

1. Pepakura is Windows-only, commercial, and not extensible. A free, cross-platform, browser-based alternative would have real value.
2. The unfolding problem is genuinely interesting — discrete differential geometry, graph theory, computational topology — and building it is the best way to understand it.

## Approach

Built as a static web app — no server, no backend. Users drop a mesh onto a page and everything runs in their browser. The mesh never leaves their machine.

Implementation in TypeScript on top of `three.js`, with a clean separation between the unfolding engine (pure logic, no UI) and the application shell (UI, interactivity, export). The engine is designed to be usable as a standalone library; the UI is one consumer of it.

## Phase plan

Each phase produces something useful on its own, not scaffolding for the next.

**v1 — Walking skeleton.** Loads a mesh, runs a naive depth-first unfolding, renders the result as SVG. Works correctly on platonic solids. No tabs, no overlaps, no UI to speak of.

**v2 — Functional unfolder.** Dihedral-weighted spanning tree, overlap detection and automatic recut, glue tabs with edge labels, multi-page layout. Output is buildable for low-poly meshes (faceted animal heads, geometric busts).

**v3 — Quality output.** Takahashi-style topological surgery for optimized cuts, smart tab placement, audit visualization (color-coded regions by foldability), and color passthrough from OBJ materials.

**v4 — Interactive editor.** This is where the project changes character — from a batch tool to an application. Real UI with a 3D viewport and 2D layout panel. Click edges to toggle cut/fold. Drag pieces to rearrange. Live feedback on overlaps. Undo/redo. Save/load project state. React + react-three-fiber.

**v5 — Feature parity.** Texture mapping, 3D fold preview, multiple tab shapes, edge numbering schemes, PDO export, print tiling for large pieces. The long polish phase.

**v6 — Distribution.** Static deploy, documentation, eventual template gallery, eventual public release.

## Stack

- TypeScript, strict mode
- Vite (dev server, build)
- pnpm (package manager)
- Vitest (unit tests)
- three.js (3D rendering, mesh loading)
- polygon-clipping (2D overlap detection, added in v2)
- React + react-three-fiber (UI, added in v4)

## Repository layout

```
/                       — project root
  README.md             — this file
  docs/
    decisions/          — ADRs (architecture decision records)
    sessions/           — session logs from Claude Code work
  src/
    core/               — unfolding engine (pure logic, no DOM)
    app/                — UI / DOM / application shell
  test/
    corpus/             — test meshes (platonic solids, low-poly examples)
    unit/               — unit tests
  package.json
  tsconfig.json
  vite.config.ts
```

The `core/` vs `app/` split is structural and important. `core/` is the library; `app/` is one consumer. Future consumers (CLI, headless batch tool) would import `core/` directly.

## Conventions

- **Decisions get logged.** Any non-obvious choice (algorithm, library, structural) gets a short ADR in `docs/decisions/` — title, context, decision, consequences. Keep them short.
- **Sessions get logged.** Each Claude Code session leaves a brief writeup in `docs/sessions/` — what was attempted, what shipped, what's next.
- **Commits are frequent.** Working state at the end of each session, even if marked WIP. History is cheap; rollback is expensive without it.
- **Visual debugging is first-class.** Every module that touches geometry has a way to render its current state to an image. Built in from day one.
- **Naive before optimized.** Pick the simplest correct algorithm first. Watch it fail. Then optimize.

## Status

v2 — the functional unfolder — is complete and merged. v3 — quality output —
is complete and merged: Takahashi-style cut-removal as the default unfolder
(ADR 0007), score-driven smart tab placement, per-piece foldability
classification with SVG tint overlay, and per-face color passthrough from
OBJ materials. Aggregate trajectory across the eleven-model corpus:
58 → 30 pieces, 18 → 14 pages, 18.8 m → 15.6 m total cut length. v4 —
interactive editor — is current; design spec at
`docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md`.

## License

MIT. See `LICENSE`.
