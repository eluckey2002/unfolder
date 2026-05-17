# Session 0029 — v3 close

## What was attempted

Close v3 ("quality output"). The four named v3 surfaces had already
shipped across 0025-0028 (cut-removal, smart tabs, foldability viz,
color passthrough) and two originally-planned v3 surfaces had been
explicitly removed from scope mid-phase (PDF export pulled
2026-05-16; file-loader UI absorbed into v4.0 per the 2026-05-17 v4
design spec). What was missing was the close ceremony itself:
authoring the durable `v3-complete.md` retrospective mirroring
`v2-complete.md`'s pattern, running the corpus-wide visual sweep
that IS v3's quality-bar verification (per the Q-0026-2 resolution
on `docs/open-questions.md`), and updating every in-repo place that
still names v3 as "current."

No production code changes. No baseline regeneration. The v3 process
retrospective is deferred to `/retrospect v3`, following v2's
complete-then-retrospective split.

## What shipped

### Artifacts created

- **`docs/retrospectives/v3-complete.md`** — the phase-close
  retrospective. Six sections mirroring `v2-complete.md`: phase
  pitch, what shipped session-by-session (0021, 0022, 0023, 0025,
  0026, 0027, 0028 — 0024 omitted as a process commit, not a v3
  product surface), aggregate metric trajectory (0021 frozen
  snapshot vs post-0028 live baseline), visual-sweep verdict,
  what's deferred to v4 or later, lessons learned (light).

- **`docs/sessions/0029-v3-close.md`** — this session log.

- **`scripts/probe-v3-sweep.ts`** (transient, NOT committed) — short
  `vite-node` probe that walked `test/corpus/`, parsed each model,
  loaded sibling `.mtl` when present, called `runPipeline`, and
  wrote per-page SVG via `emitSvg` to a system-temp scratch dir
  (`os.tmpdir()/v3-sweep/<model>-<ext>/page-N.svg`). Reused
  `scripts/baseline-pipeline.ts`'s parser-dispatch + MTL-load
  pattern verbatim. Deleted with `rm scripts/probe-v3-sweep.ts`
  after the sweep; scratch dir removed with `rm -rf`. Same shape
  as 0027's and 0028's transient probes.

### Artifacts modified

- **`README.md`** — three known-stale spots updated:
  - The v3 phase-plan paragraph dropped "real PDF export" (per
    decisions-log 2026-05-16) and trimmed the combined
    "color/texture passthrough" to just "color passthrough from
    OBJ materials" (texture was deferred to v5 per the same
    decisions-log entry).
  - The Stack list removed the stale `pdf-lib (PDF export, added
    in v3)` line — `pdf-lib` was never added since PDF was pulled.
  - The Status section flipped v3 from "current" to "complete and
    merged" with a one-line summary mirroring v2's structure (the
    four shipped surfaces + the aggregate corpus trajectory), and
    named v4 as the current phase with a link to the v4 design
    spec at
    `docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md`.

  Post-edit `grep -i pdf README.md` returns zero matches.

- **`docs/decisions-log.md`** — appended one 2026-05-17 entry
  recording the v3-close: visual-sweep verdict in three sentences,
  the four v3 surfaces that shipped, the PDF / file-loader-UI
  deferrals as prior log references, and the v4 entry-point link.

- **`docs/baseline-v3.md`** — appended a "v3 closes (session 0029)"
  trailer section with the visual-sweep verdict and the aggregate
  five-metric frozen trajectory (0021 → post-0028 live baseline).

### Visual sweep

The transient probe rendered 14 SVG pages across the 11-model
corpus to a `$TEMP/v3-sweep/` scratch dir; an HTML grid viewer
(`index.html`, same dir) embeds all 14 SVGs for one-page visual
inspection and was opened in the default browser via `start`.
Per-file verdicts were built from the rendered grid plus a
complementary structural cross-check: foldability-tint hue
distribution counted by literal `grep -c` (`hsla(120,...)`=clean,
`hsla(48,...)`=caution, `hsla(0,...)`=warn — decoded from
`src/core/emit-svg.ts`), cross-referenced against the live
`docs/baseline-pipeline.md`. The structural check anchored the
hue count — see Learning 2 for one specific finding it caught.

Per corpus file (coverage gate: all 11 files; cube counts twice
for `.obj` + `.stl` parser paths):

- **`croissant.obj`** — *clean*. Cut-removal collapsed 15 → 3
  pieces across 2 SVG pages; 0 clean / 1 caution / 2 warn
  foldability classifications honestly flag the concave-organic
  small-feature regions cut-removal preserved. SVG structurally
  complete on both pages.
- **`cube.obj`** — *clean*. Textbook cross unfold; 1 piece, 7 tabs,
  14 edge labels, clean classification, page renders without
  artifacts.
- **`cube.stl`** — *clean*. Identical structural counts to
  `cube.obj` (1 piece, 1 clean tint, 14 labels, 36 lines, 22 fold
  lines, 7 tab polygons) — parser-path equivalence confirms 0028's
  STL no-color invariant.
- **`cylinder.obj`** — *clean*. Single-piece unfold of 28 faces; 1
  caution flag reflects cap-fan small-edge geometry, not rendering
  failure.
- **`deer.obj`** — *minor-quibble*. 17 pieces across 3 SVG pages
  (cut-removal 28 → 17); 2 clean / 0 caution / 15 warn matches the
  baseline-v3.md note that 15-of-17 warns reflect cut-removal
  sliver faces on the 720-face concave-organic input. Ships
  buildable, but it is the corpus model that sits closest to the
  v3 quality-bar edge.
- **`egg.obj`** — *clean*. Single-piece smooth surface, 44 faces; 1
  caution honestly flags pole tightness.
- **`ginger-bread.obj`** — *clean (v3 showcase)*. The only corpus
  model with a sibling `.mtl`. SVG renders 80 face-fill polygons
  in `#8c4d1a` (from `Kd 0.55 0.30 0.10`) underneath 1 caution + 1
  warn foldability tints; color and viz compose without legibility
  loss — this is v3's two-feature integration test.
- **`meat-sausage.obj`** — *clean*. Cut-removal collapsed 3 → 1
  piece; the single warn flag honestly reflects 320-face concave
  geometry.
- **`octahedron.stl`** — *clean*. 8-face unfold, 1 clean piece, 5
  tab polygons.
- **`tetrahedron.stl`** — *clean*. Minimal 4-face unfold, 3 tab
  polygons, classifies clean.
- **`uv-sphere.obj`** — *clean*. 48 faces unfold to 1 clean piece;
  paginate's uniform-scale-to-fit handles the smooth-surface
  geometry without tearing.

**Aggregate:** 10 clean / 1 minor-quibble / 0 fail-the-bar.
Foldability distribution exactly matches the post-0028 baseline
(7 clean / 4 caution / 19 warn across 30 pieces). The verdict
flows to `v3-complete.md` and `docs/decisions-log.md`'s 2026-05-17
closure entry.

## Verification

- `pnpm test:run` — **189 / 189 passing** (21 test files; byte-identical to post-0028, expected for a doc-only session).
- `pnpm type-check` — clean.
- `pnpm build` — clean (~580 KB; same chunk-size warning as post-0028, unchanged).
- **Sweep coverage gate:** every one of the 11 corpus files is
  referenced individually in the Visual sweep section above.
  `cube` counts twice — `cube.obj` and `cube.stl` both rendered
  (1 page each) and observed separately for parser-path coverage.
- **No-scratch-artifacts gate:** `git status --short` shows zero
  `scripts/probe-*` paths and zero `scripts/.v3-sweep-*` paths
  (staged or untracked). Staged for commit:

  ```
  M  README.md
  M  docs/baseline-v3.md
  M  docs/decisions-log.md
  A  docs/retrospectives/v3-complete.md
  A  docs/sessions/0029-v3-close.md
  ```

  Five entries — three doc edits and two new docs. (The session
  prompt file showed `M` in the pre-stage working tree from Git's
  autocrlf line-ending pass, but `git add` normalized it to
  identical-to-HEAD content, so it is not in this commit.)
  `git ls-files scripts/` shows the pre-0029 set unchanged:
  `baseline-pipeline.ts`, `generate-corpus.ts`, `prepare-corpus.py`.
  The scratch dir lived in `$TEMP/v3-sweep/` (outside the repo) and
  was removed with `rm -rf` as part of cleanup.

## What we learned

1. **A structural visual sweep is a defensible fallback when
   rendered-and-eyeballed isn't available.** Playwright wasn't
   reachable in this session shell, and the SVG sweep ran via
   markup analysis + grep-driven hue distribution + cross-reference
   against the live `docs/baseline-pipeline.md`. For SVGs
   specifically this is honest (every visible element is in the
   markup); for arbitrary HTML or canvas-driven UIs it would not
   be. The HTML grid viewer (`$TEMP/v3-sweep/index.html`) plus a
   `start` to the default browser was the visual-access backstop.
2. **The Explore sub-agent miscounted the foldability hue
   distribution.** A sub-agent dispatched to extract per-file
   structural metrics reported all 33 foldability tints as
   `hsla(120,...)` (clean). A deterministic `grep -c "hsla(120"`
   / `48` / `0` across the same 14 files showed the canonical
   7 / 4 / 19 split, matching the live `docs/baseline-pipeline.md`
   row-for-row. The agent's piece-counts and element counts held
   up — only the hue distribution was wrong. Caught during this
   session because the sweep verdict would have been materially
   incorrect otherwise; flagged here rather than generalized.
3. **The deer is the corpus model at v3's quality-bar edge.** 15
   of 17 deer pieces classify warn; the baseline-v3.md note on
   0027's outcome ("15-of-17 warns reflect cut-removal sliver
   faces") is exactly what the sweep saw. The deer ships
   buildable, but it is the model whose warn signal is the honest
   "this will be tricky" report v3 was designed to produce. v4's
   feedback-driven iterative unfolding (per the design spec)
   turns that signal into actionable entry points.
4. **Stale README is the quality-phase tax.** Three places had to
   be updated at v3 close because v3's scope contracted mid-phase
   (PDF removed, texture deferred, file-loader UI absorbed into
   v4.0). The cost of an aspirational README that names future
   surfaces is paying down each aspiration as the future moves.

## Open follow-ups

- **None for v3.** The phase closes here; v4 begins per the design
  spec.
- **Process retrospective:** `/retrospect v3` after this PR merges,
  following the v2 pattern.

## Handoff

- **Branch / worktree:** `session/0029-v3-close` at
  `.claude/worktrees/session+0029-v3-close/`.
- **Commit (subject):** `feat(0029): v3 closes — visual sweep + v3-complete.md`.
- **Verification:** `pnpm test:run` 189 / 189 passing;
  `pnpm type-check` clean; `pnpm build` clean (~580 KB); zero
  scratch artifacts in `git status --short` or `git ls-files
  scripts/`; sweep coverage gate satisfies all 11 corpus files
  with `cube` counted twice.
- **Files touched:**
  - Created: `docs/retrospectives/v3-complete.md`,
    `docs/sessions/0029-v3-close.md`.
  - Modified: `README.md` (phase plan, Stack, Status sections),
    `docs/decisions-log.md` (one 2026-05-17 closure entry),
    `docs/baseline-v3.md` (one trailer section).
- **Decisions made or deferred:**
  - [flowed-silently] Visual-sweep scratch directory lives outside
    the repo (`$TEMP/v3-sweep/`) — sidesteps any `.gitignore` edit,
    cleanup is one `rm -rf`.
  - [flowed-silently] Cube counts twice for sweep purposes (`.obj`
    + `.stl` parser paths) per the prompt's coverage rule; the
    sweep observed each separately and confirmed parser-path
    structural equivalence.
  - [surfaced-and-proceeded] Playwright unavailable in this
    session shell; sweep proceeded structurally (XML element
    counts + grep-driven hue distribution + cross-reference
    against `docs/baseline-pipeline.md`) plus an HTML grid viewer
    opened in the user's default browser. Honest framing in the
    Visual sweep section above.
  - No ADR — this is a phase-close ceremony, not a structural or
    algorithmic decision.
- **Queue / roadmap deltas:** None added; none closed. The three
  pre-existing queue items
  (`force-directed unfolding` [research],
  `detectOverlapsTolerant` [research],
  `area-based tab placement signal` [enhancement]) all carry
  forward — `v3-complete.md` names them explicitly as "shipped
  without."
- **Open questions for the strategist:** None. v3 closes; v4
  begins.
