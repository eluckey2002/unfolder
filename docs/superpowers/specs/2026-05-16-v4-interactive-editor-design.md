# v4 — Interactive editor design spec

**Date:** 2026-05-16
**Status:** Drafted in brainstorming; pending director review, then real-user validation of the open questions in §13 before lock.
**Supersedes:** the v4 phase description in `README.md` (richer, not contradictory).
**Inputs:** user-research spike at `docs/spikes/2026-05-16-v4-user-research/` (competitive scan, 5 personas, 5 synthetic interviews, synthesis, findings).
**Next step after director review:** `superpowers:writing-plans` to produce an atomic 5-step TDD plan per v4.0 task.

---

## 1. Headline UX hypothesis (locked)

v4 ships **feedback-driven iterative unfolding**: a hybrid of synthesis hypotheses B (buildability preview) and C (constraint-driven re-unfold), combined so that buildability signals become the *entry points* for constructive editing rather than warnings against the model the user chose.

The flow: drop mesh → preflight report → unfold → per-piece risk badges → badge-driven fix loop → export. The user keeps the model they wanted; the *unfold* gets engineered until it builds.

**Why this and not the synthesis's recommended hypothesis B alone:** the director's reframe (2026-05-16): B as recommended is *defensive* (warn, then offer a retreat via the simplify slider). The v4 goal is "user reaches an excellent unfold of the model they wanted, quickly and easily." That requires constructive resolution, not retreat. C alone would have been Marcus-tier-only; the hybrid uses B's badges as the entry point that makes C accessible to Sarah and Priya without requiring constraint vocabulary.

## 2. Primary user (locked) and JTBD (ranked)

**Primary user:** maker / hobbyist builder (locked 2026-05-16). Defaults must be excellent; controls discover themselves only when needed; "did it work?" needs a clear yes/no answer.

**Jobs-to-be-Done, in priority order** (full citations in `synthesis.md §3`):

1. **No-install build path.** When I have a 3D model I want to make in paper, I want to turn it into a printable, buildable PDF without leaving my browser or installing anything.
2. **Region-scoped re-unfold.** When the auto-unfold puts a seam, tab, or piece where I don't want it, I want to fix only that area without losing decisions I already made elsewhere.
3. **Pre-commitment preview.** When I'm about to commit cardstock and an afternoon, I want to see what's going to go wrong before printing.
4. **Assembly recovery.** When I sit down to assemble — especially mid-build — I want to find my place on the model without re-deriving it from edge IDs alone.
5. **Model-fit preview.** When choosing or designing a model, I want a credible preview of how hard the build will be so I know whether it fits my Saturday.

JTBDs 1–3 are the v4 headline; 4 ships as a minimum viable companion (thumbnail-on-net + 3D view); 5 ships partially via the preflight panel.

## 3. Release sequencing — v4.0 → v4.3

The director's steer (2026-05-16): get to a usable tool fast; let the differentiation arrive over multiple releases. This sequencing keeps the headline UX hypothesis intact while collapsing the time-to-first-use to weeks.

```
v4.0  "I can use it"                               
      ├─ React + react-three-fiber shell
      ├─ Drop STL/OBJ, run existing v3 pipeline
      ├─ 3D viewport (replaces existing src/app/render.ts)
      ├─ 2D pattern pane (wrap existing SVG emit in React)
      ├─ Export SVG (already works in core/)
      ├─ No badges, no fix loop, no inside/outside, no save/load
      ├─ Absorbs the v3-roadmap "session 0029 — file-loader UI"
      └─ Ship state: a user drops a mesh, sees it unfold, downloads SVG.

v4.1  "I can edit"
      ├─ Bidirectional 3D↔2D highlight (the "felt magic" move)
      ├─ Manual piece drag-to-rearrange
      ├─ Manual edge cut/fold toggle (power-user shortcut, README req)
      ├─ Undo/redo via appliedFixes traversal
      ├─ Save/load .unfolder.json
      ├─ Auto-save to IndexedDB, debounced
      └─ Ship state: README's stated v4 surface, minus differentiation.

v4.2  "I get feedback"
      ├─ Preflight panel (piece count, scale, smallest/largest, hygiene)
      ├─ Per-piece risk badges (the buildability signals from §7)
      ├─ Inside/outside inference + manual override
      └─ Ship state: user sees what will go wrong before committing.

v4.3  "I get fixes"     ← the headline differentiation lands
      ├─ Fix-suggestion drawer (the felt magic of the hybrid)
      ├─ Six fix families: split, flip tab, reposition tab, re-unfold
      │   region, repaginate, reorient piece
      ├─ Region re-unfold (depends on v3.5 incremental-pipeline spike)
      └─ Ship state: feedback-driven iterative unfolding, end to end.
```

**The v3.5 incremental-pipeline spike blocks v4.3 only.** v4.0–v4.2 do not need region re-unfold. This lets the early releases ship without the algorithm work being on the critical path.

## 4. Architecture and state model

**Architecture (mostly inherited).** Structural commitments from `project-state.md` carry forward: React + react-three-fiber for the UI, `src/core/` stays pure-function pipeline, `src/app/` becomes a real React app consuming `core/` as a library. No React imports cross into `core/`. The 3D viewport uses r3f. The 2D pattern pane renders as SVG-in-React (already vector; already the emit format; no canvas needed).

**State store.** Zustand for the app store (small, hooks-native, plays well with r3f). Immer internally for the `appliedFixes` traversal. Both 4–5 kB compressed and stable. Low-confidence call — open to alternatives if a director-level preference exists; documented for the v4.0 implementer.

**State shape — three categories, seven layers:**

```
SOURCE OF TRUTH (persisted, undoable)
  ├─ sourceMesh         — Mesh3D, immutable once loaded
  ├─ pipelineConfig     — weight fn, recut variant, tab strategy, page spec
  ├─ pinnedRegions      — Set<{pieceId | faceIds}>
  └─ appliedFixes       — ordered list; each entry = { regionSelector, constraintChange }

DERIVED (cached, recomputed lazily)
  ├─ currentLayout      — re-run pipeline applying fixes in order
  ├─ preflightReport    — piece count, scale, mesh hygiene, per-piece risk badges
  └─ fixSuggestions     — per-badge ranked fix proposals

UI EPHEMERA (not undoable, not persisted)
  └─ selection, hover, panel state, drawer state
```

**Why this shape.** Each accepted fix is an append to `appliedFixes`. Everything visible is derived from `(mesh + config + pinned + appliedFixes[:N])`. Undo/redo collapses to traversing the list — no layout snapshots; just re-run the pipeline at index N. Cheap to implement, correct by construction.

**Performance constraint — region re-unfold must be sub-second.** Current full pipeline runs ~1–3s on the 200-face corpus. The v4.3 fix loop requires roughly proportional time for region size — split-island on 20 faces should take <500ms. This is real algorithm work; see §11 prerequisites.

**Persistence:**
- `.unfolder.json` project file: `{ meshHash, meshFilename, pipelineConfig, pinnedRegions, appliedFixes }`. **Mesh bytes are not embedded** (too large); user re-attaches on load, or we stash meshes in IndexedDB keyed by content hash.
- Auto-save to IndexedDB on every state change, debounced ~500ms.
- Explicit "Save project" downloads the JSON.
- Shareable URL state — deferred to v5.

## 5. The four surfaces

```
1. 3D viewport — always visible after mesh load. Source mesh; faces
   highlightable from selection elsewhere. Outside/inside inference shown
   subtly (outside faces slightly emphasized in lighting).

2. 2D pattern pane — always visible after first unfold. Current layout,
   page-broken. Each piece carries its risk badge in the corner.
   Drag-to-rearrange, click-to-select.

3. Preflight panel — prominent before first unfold; collapses to compact
   chip after. Displays piece count, scale-on-sheet, smallest/largest piece,
   mesh hygiene flags, difficulty rating with "what would simplify."

4. Fix-suggestion drawer — slides in from right when user clicks a badge.
   Ranked fixes for that piece with preview of each fix's outcome.
```

**Spatial layout (default desktop, 1440+ wide):**

```
┌──────────────────────────────────────────────────────────────┐
│ unfolder · Mandalorian.obj · ●saved · ↶↷ ·    [Export PDF]   │  topbar
├──────────────────────────────────┬───────────────────────────┤
│                                  │  Preflight chip ▼         │  
│                                  │  87pcs · 32cm · 4 sheets  │
│                                  ├───────────────────────────┤
│        3D viewport               │                           │
│     (mesh, hover-highlight)      │      2D pattern pane      │
│                                  │   (pieces, badges, drag)  │
│                                  │                           │
├──────────────────────────────────┴───────────────────────────┤
│ Config ▶ dihedral · cut-removal · US Letter · auto-tabs       │  bottom drawer
└──────────────────────────────────────────────────────────────┘
```

When the user clicks a red badge in the 2D pane, **the fix drawer slides in over the right half of the 2D pane** (not over 3D — the user often references 3D while deciding which fix to apply). Drawer is dismissible without committing.

## 6. Interaction model

**Four states, modeless transitions.** Selection, hover, pan/zoom work identically in every state. Pepakura's modal toolbar is a deliberate inverse-reference.

```
   LOADED                  UNFOLDED                FIX-DRAWER             PRINT PREVIEW
   ──────                  ────────                ──────────             ─────────────
   • mesh visible          • mesh + layout         • everything from      • modal overlay
   • preflight prominent   • bidirectional         •   UNFOLDED, plus     • page-by-page
   • 2D pane: "Unfold       hover/select          • fix list ranked      • scale verify
     with defaults" CTA    • preflight: chip      • per-fix preview      • export buttons
                           • badges on pieces     • Apply / Dismiss

   [Unfold] →             [click badge] →        [Apply] → UNFOLDED      [Export] → file
                                                 [Dismiss] → UNFOLDED
```

**The bidirectional-highlight move (the felt magic).** Hovering or selecting in 3D highlights the corresponding piece in 2D, and vice versa. Drag a piece in 2D, the faces it represents glow in 3D. Click a badge in 2D, the affected region pulses in 3D. Small to implement, large in perceived quality, and reinforces inside/outside invisibly.

**Edge interactions (power-user surface).** Click an edge in 3D → selected in both views → keyboard shortcuts `C` cut/fold, `T` flip tab, `P` pin. The README's "click edges to toggle cut/fold" lives here, demoted from headline to power-user shortcut — most users will accept fix suggestions instead.

## 7. The fix-suggestion engine (v4.3)

**Buildability signals (what each badge means):**

```
SIGNAL                              THRESHOLD              COLOR
─────────────────────────────────────────────────────────────────
Tab on visible (exterior) face      any                    red
Piece exceeds page dimensions       any                    red
Piece causes overlap                any                    red
Smallest edge < paper-craftable     <5mm at print scale    yellow
Acute interior angles               ≥3 below 25°           yellow
Aspect ratio extreme                >12:1 or <1:12         yellow
Dense fold zones                    threshold TBD —        yellow
                                    see note below
None of the above                                          green
```

Each badge maps to one or more fix families; the engine accumulates specific, namable failure signals rather than computing "this piece is hard" abstractly.

**Fix families (the menu of what a click can do):**

```
FIX FAMILY                  MECHANISM                         REVERSIBLE?
────────────────────────────────────────────────────────────────────────
Split island                Add a cut, run recut on region    yes (undo pops)
Flip tab side               Reassign tab to other face        yes
Reposition tab              Move tab along the edge           yes
Re-unfold region            Pin outside, re-run pipeline      yes
  with alt weights          locally with different config
Repaginate                  Rerun paginate with hint          yes
Reorient piece              Rotate within its current page    yes
SIMPLIFY mesh region        Decimate small faces (DEFERRED)   destructive
  (Sarah's "kid mode")                                        on source mesh
```

**v4.3 ships the first six. Mesh simplification is deferred to v5** — destructive on source mesh, trust risk, separate UX (the slider). Keeps the trust surface clean while the suggestion engine proves itself.

The "dense fold zones" threshold above is intentionally TBD: we don't yet have a defensible value. v4.3 calibrates it against the existing corpus baseline (`docs/baseline-v3.md`), tuning until the badge fires on pieces a human classifier independently flags as "too dense to fold cleanly." Until calibrated, the predicate is disabled.

**Region re-unfold mechanism (the algorithm work):**

```
def reUnfoldRegion(layout, region, constraints):
    pinnedFaces  = layout.faces - region.faces
    pinnedLayout = layout.restrict(pinnedFaces)
    pinnedBounds = pinnedLayout.boundingPolygon()

    # Re-run pipeline on region only, with constraints,
    # treating pinnedBounds as a no-overlap obstacle.
    localTree   = buildSpanningTree(region, constraints.weights)
    localLayout = flatten(localTree)
    localLayout = recut(localTree, localLayout, detectOverlaps(localLayout))
    localLayout = positionAroundObstacle(localLayout, pinnedBounds)

    # Splice back, re-verify global non-overlap
    spliced = pinnedLayout.merge(localLayout)
    assert detectOverlaps(spliced).isEmpty
    return spliced
```

**Ranking + "wrong fix" mitigation (the trust surface):**

```
For each generated fix:
  1. PREDICT — re-run badge predicates against the proposed layout
  2. SCORE   — count badge-improvements minus new-badge-regressions
  3. PREVIEW — show side-by-side: current piece + predicted piece + delta
  4. REJECT  if SCORE < 0  (never propose a fix that's strictly worse)
  5. SHOW    ranked by SCORE descending; tie-break by reversibility
```

**Suggestion generation cadence.** Cheap suggestions (split at obvious seam, flip tab) run synchronously when the badge is clicked — visible in <100ms. Expensive suggestions (alt-weight re-unfold) run async — drawer shows "computing alternatives…" and they stream in over 1–3s.

**Inside/outside inference.**
- Watertight mesh: outward normals from face winding + topology.
- Open-edge mesh (terrain ruins): inference fails; UI prompts "pick three exterior faces" → flood-fill the connected exterior region.
- Override: user can always click a face in 3D and toggle interior/exterior. Persisted in pipelineConfig.

Inside/outside drives: the "tab on visible face" badge, tab-side selection in auto-tab, and (in v5) texture register.

## 8. Scope boundaries

**v4 ships (across v4.0–v4.3, as sequenced in §3):**

```
✓ Drop STL/OBJ → preflight → unfold → fix loop → export (SVG, PDF)
✓ Four surfaces + bidirectional highlighting
✓ Six fix families (mesh simplification deferred)
✓ Inside/outside inference + manual override
✓ Undo/redo via appliedFixes
✓ Save/load .unfolder.json; auto-save IndexedDB
✓ Manual edge cut/fold toggle (power-user shortcut)
✓ Manual piece drag-to-rearrange
✓ Thumbnail-on-net assembly companion (minimum viable)
```

**v4 explicitly defers to v5+ (with reason):**

```
✗ Mesh simplification / kid-mode slider — destructive, trust risk
✗ Multiple tab shapes / edge numbering schemes — README v5
✗ 3D fold preview animation — README v5
✗ PDO export, print tiling for huge pieces — README v5
✗ Step-numbered guided assembly — synthesis Q8 open; ship thumbnail
   only in v4, defer guided animation
✗ Shareable URL state — nice-to-have; deferred
✗ Texture/color passthrough — v3 workstream; carries forward if landed
✗ Generative-art / batch API entry — Evan's posture: maker primary
✗ "Name a polyhedron" parametric input — different product (synthesis Q5)
```

**The "accept imperfection" case (Marcus's pattern).** When a red badge has no fix with SCORE > 0, the user can **accept and proceed**. The badge stays red; the export still works. This is a *valid* end state — Marcus prints despite known imperfections he'll fix in foam. Pepakura does this implicitly; we do it explicitly (badge persists as warning, doesn't block).

## 9. Error handling

```
FAILURE                          DETECTION         USER-FACING TREATMENT
──────────────────────────────────────────────────────────────────────
Unsupported format               on file drop      "v4 supports STL/OBJ
                                                   only — convert in
                                                   Blender first"
Malformed parse                  parse stage       surface line/byte;
                                                   no silent fallback
Disconnected components          connectedness     "this mesh has N
                                guard             disconnected parts —
                                                   unfold each separately?"
Non-manifold                     preflight check   orange badge in
                                                   preflight; unfold
                                                   may still work
>50k faces                       preflight         warn but allow;
                                                   performance disclaimer
Polygon-clipping precision       try/catch in      "near-coincident edges
  (0025 known issue)             recut             couldn't be resolved
                                                   — repair externally"
Fix engine: no fix scores > 0    suggestion gen    "no automatic fix
                                                   improves this piece —
                                                   manual edit / accept"
Region re-unfold post-fail       algorithm         revert to previous
  (new overlaps)                 post-condition    state; surface cause
Save: mesh hash mismatch         load check        "expected mesh.obj;
                                                   this is mesh-v2.obj"
Save: corrupted JSON             parse             "project file damaged.
                                                   Start fresh?"
IndexedDB quota                  quota event       "storage full. Remove
                                                   older projects?" + LRU
No WebGL 2                       feature detect    "requires Chrome,
                                                   Firefox, Safari 16+,
                                                   or Edge"
```

**Offline-after-first-load.** Service worker caches JS + WASM. All persistence local. Matters for Mr. Chen's privacy/no-cloud constraint (synthesis Q6) and Priya's "I want to fold paper, not configure things" posture. Network errors never block the core flow.

**Browser support matrix:** latest Chrome / Firefox / Safari (16+) / Edge. Chromebook supported. WebGL 2 required.

## 10. Cross-cutting design principles

Apply to every release (v4.0–v4.3), inherited from `synthesis.md §6`:

- **P1 — Browser-native, no install, no account for the core flow.** Theme 1, theme 7. Four of five personas listed install/platform/account as their first quit point.
- **P2 — Show buildability before commitment.** Theme 4. Cost of a wrong commitment is hours plus material; cost of a preview is screen real estate. Every step of the pipeline should surface "what will this cost / what could go wrong" before the user commits.
- **P3 — Treat unfold output as draft, not deliverable.** Theme 2. Every editing affordance (tab flip, piece move, region re-unfold, scale) should be cheap and reversible. Save state should be trivial — no "did you mean to discard your work" anxiety.
- **P4 — The model knows which side is the outside.** Theme 3. Inside/outside is the single concept that unlocks tab placement, seam choice, texture register, and "which face is interior padding" grouping.
- **P5 — Group preservation is a feature, not a side effect.** Theme 5. The user's logical groups (per-building, exterior vs interior, per-body-part) are more valuable than the algorithm's whitespace-efficiency wins.
- **P6 — Provide an assembly companion, even if minimal.** Theme 6. At minimum: thumbnail of the assembled shape on every sheet, edge IDs in a font a twelve-year-old can read, "where am I" recovery for builds spanning days.

## 11. Prerequisites that must land before v4 commits

```
v3.5 — Incremental-pipeline spike
   Goal: region re-unfold under 1s on a 50-face island.
   Findings doc at docs/spikes/<date>-incremental-pipeline/.
   Blocks v4.3 only; v4.0–v4.2 can proceed in parallel.

Real-user validation of synthesis §13 open questions
   Particularly Q1 (is "skip the editor" real?),
   Q7 (does region re-unfold save Marcus's time?),
   Q3 (is inside/outside legible to non-experts?).
   Approach: clickable v4.2 prototype as the recruit-bait;
   5–8 real-recruit interviews against it; reuse personas.md
   and topic-guide.md as the protocol.
   Blocks v4.3 design lock (not v4.0–v4.2 ship).
```

## 12. Testing strategy

Standard for the codebase, no novel design work:

- **`src/core/` — Vitest unit tests + property tests.** Already in place. The new modules (region re-unfold, badge predicates, fix-suggestion generators, scoring) get full unit coverage. Each fix family is a separate test file with golden-corpus regression.
- **`src/app/` — React Testing Library for component logic, Playwright for end-to-end flows.** New for v4 (the v3 app shell was too thin to test). Smoke tests per release: v4.0 "drop mesh, see unfold, export SVG"; v4.1 "edit, undo, save, reload"; v4.2 "see badges, see preflight"; v4.3 "click badge, see suggestions, apply fix, verify region change."
- **Visual regression on the corpus.** Existing baseline harness (`scripts/baseline-pipeline.ts`) extended to capture screenshots of the rendered SVG output per corpus model. v4 changes that shift the rendered output (badge overlays, e.g.) become visible diffs.
- **Region re-unfold post-conditions.** Every fix that runs region re-unfold asserts: (a) `detectOverlaps(splicedLayout).isEmpty`, (b) pinned faces unchanged, (c) the triggering badge predicate no longer fires.

## 13. Open questions for real-user validation

The synthetic round cannot answer these; they block v4.3 design lock.

1. **Is "I'd skip the unfolding step entirely if I could" real?** All five synthetics said yes. Real users — especially Marcus-tier veterans — may have craft attachment the synthetics traded away too cleanly.
2. **Does "drop file, get PDF" actually convert Priya-tier users**, or do they bounce on the first preview screen?
3. **Is inside/outside legible to non-experts**, or must it be entirely inferred?
4. **What's the real distribution of mesh sources, and what fraction are unfoldable at all?** Affects perceived accuracy of the buildability preview.
5. **Does Mr. Chen's "mathematical correctness" requirement need a separate parametric primitive path?** Mesh-driven unfolding of polyhedra approximates; parametric construction is exact.
6. **Pricing — how strong is "no subscription"?** Real-user WTP needs concrete prices, not magic-wand statements.
7. **Does Hypothesis C-flavored region re-unfold actually save Marcus's time**, or is the cognitive overhead of choosing among suggestions higher than the time it saves? (Promoted to load-bearing by the hybrid.)
8. **Assembly companion minimum viable form** — thumbnail + edge IDs enough, or do users want step-numbered animation?

**Priority changes from synthesis.md §7:** Q7 rises (load-bearing for v4.3); Q3 falls slightly (the hybrid doesn't require the user to understand inside/outside — the tool infers it and surfaces fixes in plain language).

## 14. References

- `docs/spikes/2026-05-16-v4-user-research/findings.md` — spike conclusion (hybrid hypothesis)
- `docs/spikes/2026-05-16-v4-user-research/synthesis.md` — full evidence + JTBD + opportunity space
- `docs/spikes/2026-05-16-v4-user-research/competitive-scan.md` — competitive tool landscape
- `docs/spikes/2026-05-16-v4-user-research/personas.md` + `topic-guide.md` + 5 transcripts — research protocol
- `README.md` — phase plan (v4 description is superseded by this spec, not contradicted)
- `docs/project-state.md` — working agreements, structural commitments
- `docs/decisions/0001-v1-pipeline-architecture.md` through `0007-cut-removal-as-v3-default.md` — pipeline ADRs that v4 builds on
- `docs/roadmap.md` — phase plan; "session 0029 — file-loader UI v4-precursor" is absorbed into v4.0 by this spec
