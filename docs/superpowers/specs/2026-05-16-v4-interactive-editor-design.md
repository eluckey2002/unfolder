# v4 — Interactive editor design spec

**Date:** 2026-05-16 (draft 1); 2026-05-17 (revised after critique round 1)
**Status:** Drafted; revised against `critique-synthesis.md`; pending final director review then commit. Real-user validation per §13 informs v4.3 iteration but does not block design lock per the H10 downgrade.
**Supersedes:** the v4 phase description in `README.md` (richer, not contradictory).
**Inputs:** user-research spike at `docs/spikes/2026-05-16-v4-user-research/` (competitive scan, 5 personas, 5 synthetic interviews, synthesis, findings, four critique docs, critique synthesis).
**Next step after director review:** `superpowers:writing-plans` to produce an atomic 5-step TDD plan per v4.0 task.

---

## 1. Headline UX hypothesis (locked)

v4 ships **feedback-driven iterative unfolding**: a hybrid of synthesis hypotheses B (buildability preview) and C (constraint-driven re-unfold), combined so that buildability signals become the *entry points* for constructive editing rather than warnings against the model the user chose.

The flow: drop mesh → preflight report → unfold → per-piece risk badges → badge-driven fix loop → export. The user keeps the model they wanted; the *unfold* gets engineered until it builds.

**Why this and not the synthesis's recommended hypothesis B alone:** the director's reframe (2026-05-16): B as recommended is *defensive* (warn, then offer a retreat via the simplify slider). The v4 goal is "user reaches an excellent unfold of the model they wanted, quickly and easily." That requires constructive resolution, not retreat. C alone would have been Marcus-tier-only; the hybrid uses B's badges as the entry point that makes C accessible to Sarah and Priya without requiring constraint vocabulary.

## 2. Primary user (locked), JTBD (ranked), and what v4 does NOT serve

**Primary user:** maker / hobbyist builder (locked 2026-05-16). Defaults must be excellent; controls discover themselves only when needed; "did it work?" needs a clear yes/no answer.

**Jobs-to-be-Done, in priority order** (full citations in `synthesis.md §3`):

1. **No-install build path.** When I have a 3D model I want to make in paper, I want to turn it into a printable, buildable PDF without leaving my browser or installing anything.
2. **Region-scoped re-unfold.** When the auto-unfold puts a seam, tab, or piece where I don't want it, I want to fix only that area without losing decisions I already made elsewhere.
3. **Pre-commitment preview.** When I'm about to commit cardstock and an afternoon, I want to see what's going to go wrong before printing.
4. **Assembly recovery.** When I sit down to assemble — especially mid-build — I want to find my place on the model without re-deriving it from edge IDs alone.
5. **Model-fit preview.** When choosing or designing a model, I want a credible preview of how hard the build will be so I know whether it fits my Saturday.

**What v4 does NOT serve** (deferral with stated calcification cost):

- **Upstream mesh acquisition** beyond `.pdo` import + a curated starter gallery. Three of five personas (Sarah, Priya, Mr. Chen) bounce *before* having a mesh — their bottleneck is *finding* a model. v4 ships `.pdo` import in v4.2 (the de-facto papercraft distribution format) but does not integrate Thingiverse / Sketchfab / Printables. v4 is for users who have a mesh OR can pick from the starter gallery; users who quit upstream of that wall are not v4's audience. (Critique B2.)
- **Commercial creators** (Etsy/DriveThruRPG sellers, Patreon designers, educational publishers). Deferred to v5+. The v4 architecture choices (no account, no project library, no batch export) calcify a free-tool shape that will be hard to retrofit for paying users; this is accepted. (Critique H12.)
- **Accessibility audit** (WCAG AA + shape-redundancy on badges). Deferred to v5+ with stated cost: retrofitting after badge semantics calcify will be expensive; ~8% of men with red-green color blindness will not have a usable badge system until v5. (Critique H14.)

## 3. Release sequencing — v3.5 → v4.3

The director's posture (2026-05-17): v4.0 is an **internal milestone** (no user-visible change), not a user release. v4.1 is the first user-facing release. Sessions counted at this project's cadence (cf. session 0025 = one full session of algorithm-promotion-plus-integration).

```
v3.5 incremental-pipeline PHASE                 ~4–6 sessions
   Note: was "spike" in draft 1; renamed to "phase" per critique H9.
   ├─ Spike: algorithm design + worked example  2–3 sessions
   │  on deer.obj, perf cost model. Produces
   │  written algorithm before measuring perf.
   └─ Promote-to-core + ADR for region-aware    2–3 sessions
       pipeline contract (face-subset
       extraction, deterministic edge ordering
       under restriction, obstacle-aware
       placement, splice operator).
   Blocks v4.1 (edge-toggle, undo) AND v4.3
   (region re-unfold). Fallback: if v3.5
   returns infeasible at <1s, v4.3 ships
   manual region-pin + full-pipeline-re-run
   with a loading spinner.

v4.0  Shell parity (INTERNAL milestone)         ~2–3 sessions
   No user-visible change vs current pipeline
   output. The work is the foundation that
   v4.1–v4.3 ship on top of.
   ├─ React + react-three-fiber app shell
   ├─ Zustand store with the §4 state shape
   │  (regionSelector, pinnedRegions, appliedFixes
   │  are v4.0 IN-MEMORY ONLY — no persistence
   │  format committed yet)
   ├─ Migrate src/app/render.ts from imperative
   │  three.js to declarative r3f
   ├─ Wrap existing emitSvg output in React
   │  component (the 2D pane)
   ├─ Playwright + React Testing Library infra
   └─ Ship state: dev-only build that runs the
      v3 pipeline and renders the same output
      as today, behind a new React shell.

v4.1  "I can use it"                            ~6–10 sessions
   First user-facing release. The features
   that get a single hobbyist through one
   complete build.
   Subset A — independent of v3.5:
   ├─ Drop STL/OBJ + run pipeline + render     1–2 sessions
   │  (the absorbed "session 0029 file-loader UI")
   ├─ PDF export with numbered edges            1–2 sessions
   ├─ Thumbnail of assembled shape on every     1 session
   │  sheet (Mr. Chen's field workaround;
   │  unanimous JTBD 4 signal)
   ├─ Manual piece drag-to-rearrange            1–2 sessions
   ├─ File-based save/load (.unfolder.json      1–2 sessions
   │  bundles mesh path; no IndexedDB,
   │  no auto-save yet — critique M10)
   └─ Error states (parse, no WebGL, format     1 session
      mismatch, save/load failures)
   Subset B — requires v3.5 to land first:
   ├─ Manual edge cut/fold toggle (requires     1–2 sessions
   │  incremental re-run from v3.5)
   └─ Undo/redo via appliedFixes traversal      1–2 sessions
      (requires v3.5's determinism contract)

v4.2  "I get feedback"                          ~5–7 sessions
   ├─ Preflight panel                           1–2 sessions
   ├─ Six buildability badge predicates         1–2 sessions
   ├─ Inside/outside inference + parity check   1 session
   │  + open-edge default + manual override
   ├─ Output-side non-destructive simplification 1–2 sessions
   │  preview ("this mesh would unfold cleanly
   │  at 2k faces; preview?") — does NOT mutate
   │  source mesh (critique H6 / M11)
   ├─ Read-only QR-to-phone 3D companion        1 session
   │  (critique H5 — JTBD 4 load-bearing)
   ├─ .pdo import (critique B2)                 1 session
   └─ Auto-save to IndexedDB + project library  1–2 sessions
       skeleton (open recent, switch project)

v4.3  "I get fixes"                             ~5–8 sessions
   Headline differentiation lands.
   ├─ Fix-suggestion engine: PREDICT → SCORE   2 sessions
   │  → PREVIEW → REJECT pipeline
   ├─ Six fix families: split, flip tab,        2–3 sessions
   │  reposition tab, re-unfold region,
   │  repaginate, reorient piece
   ├─ Region re-unfold UX wiring (algorithm     1–2 sessions
   │  shipped in v3.5)
   └─ Trust-surface: per-fix predicted          1 session
      outcome + "why this fix" one-line
      explanation
```

**Total v3.5 + v4 phases: ~22–34 sessions.** At session-0025-cadence (one session every 1–3 active days), this is months, not weeks. The "weeks not months" framing from draft 1 is retracted as undefended. (Critique H7.)

**Real-user validation downgraded** per critique H10 from "blocks v4.3 design lock" to "informs v4.3 iteration after ship." Rationale: budget for a 5–8-interview round + recruiting + synthesis is its own multi-session effort the spec was implicitly assuming free; given the "free side project" posture, the simpler path is to ship v4.3 against the synthetic findings, gather real-user signal from real users hitting the deployed v4.3, and iterate in a v4.4 follow-on if signal warrants. The 8 open questions in §13 become "things to watch for in v4.3 telemetry and feedback," not gating items.

## 4. Architecture and state model

**Architecture (mostly inherited).** Structural commitments from `project-state.md` carry forward: React + react-three-fiber for the UI, `src/core/` stays pure-function pipeline, `src/app/` becomes a real React app consuming `core/` as a library. No React imports cross into `core/`. The 3D viewport uses r3f. The 2D pattern pane renders as SVG-in-React (already vector; already the emit format; no canvas needed).

**State store.** Zustand for the app store (small, hooks-native, plays well with r3f). Immer internally for the `appliedFixes` traversal. Both 4–5 kB compressed and stable. Low-confidence call — open to alternatives if a director-level preference exists; documented for the v4.0 implementer.

**State shape — three categories, seven layers:**

```
SOURCE OF TRUTH (persisted from v4.1; v4.0 in-memory only)
  ├─ sourceMesh         — Mesh3D, immutable once loaded
  ├─ pipelineConfig     — weight fn, recut variant, tab strategy, page spec
  ├─ pinnedRegions      — Set<{pieceId | faceIds}>
  └─ appliedFixes       — ordered list; each entry =
                          { regionSelector, constraintChange,
                            seed: u32, edgeOrderHash: string }

DERIVED (cached, recomputed lazily)
  ├─ currentLayout      — re-run pipeline applying fixes in order
  ├─ preflightReport    — piece count, scale, mesh hygiene, per-piece risk badges
  └─ fixSuggestions     — per-badge ranked fix proposals

UI EPHEMERA (not undoable, not persisted)
  └─ selection, hover, panel state, drawer state
```

**Determinism contract (critique H1).** Each `appliedFixes` entry pins (a) an RNG seed and (b) a hash of the edge-length ordering used by cut-removal on the affected region. Replay at index N re-derives `currentLayout` bit-exactly by re-applying fixes 0..N with their captured seeds and orderings. The pipeline's existing iteration-order dependence (ADR 0007) is made deterministic by *pinning* the ordering per fix, not by changing the algorithm. Property test required: "applying fixes 0..N from scratch matches the cached layout at step N for all N up to the current append-point on a fixed corpus." Without this test passing, undo-via-derivation is not safe and the spec's "no layout snapshots" claim is dropped.

**Why this shape.** Each accepted fix is an append to `appliedFixes`. Everything visible is derived from `(mesh + config + pinned + appliedFixes[:N])` *given the determinism contract above*. Undo/redo collapses to traversing the list — no layout snapshots stored; just re-run the pipeline at index N. Cheap to implement, correct by construction *if* the determinism contract holds.

**Performance cost model (critique H2).** Region re-unfold has two cost categories that scale differently:

- **Region-local work** (proportional to region face count): subgraph extraction, local spanning tree, local flatten, local recut.
- **Global checks** (NOT proportional to region size): post-condition `detectOverlaps(spliced)` runs on the entire layout; obstacle-aware placement cost depends on pinned-set complexity, not region size.

The v3.5 phase's first deliverable is a measured cost model on the corpus — specifically on `deer.obj`, picking the largest internal piece as the 50-face-region benchmark. Sub-second total is the v4.3 target; if v3.5 returns "infeasible," v4.3 ships the manual-pin + full-rerun fallback (loading spinner) per §3.

**Core/app boundary (critique L1).** The fix-suggestion engine in `src/core/` returns a structured `FixProposal { kind, params, predictedLayout, predictedBadges }`. Human-readable copy, drawer ordering, preview rendering, "why this fix" text — all live in `src/app/`. Code-review checkpoint: any `Suggestion` or `FixProposal` shape that carries UI hints into `core/` fails review.

**Persistence — three-stage rollout:**

- **v4.0:** all state in-memory only. No persistence format committed. No mesh hashing, no IndexedDB schema, no `.unfolder.json`. Closing the tab loses the project.
- **v4.1:** file-based `.unfolder.json` save/load. JSON bundles the mesh BYTES directly (not by hash) — accept the file size cost in exchange for round-trip robustness and no IndexedDB dependency. No auto-save yet.
- **v4.2:** IndexedDB auto-save (debounced ~500ms) + project library (open recent, switch project). At this stage we commit `meshHash` canonicalization (SHA-256 over the parsed `Mesh3D`'s vertex-deduped representation, not raw bytes — survives whitespace differences in OBJ/STL but is sensitive to vertex-dedup tolerance, which is fixed at this stage as an ADR).

This staging avoids draft 1's "v4.0 commits the state shape that *implies* save/load but ships nothing" trap. (Critique M2 + M10.)

## 5. The four surfaces

```
1. 3D viewport — always visible after mesh load. Source mesh; faces
   highlightable from selection elsewhere. Outside/inside inference shown
   subtly in lighting; visualization is legible enough that silent
   inversion (Blender export glitch) is spot-able. (Critique M1.)

2. 2D pattern pane — always visible after first unfold. Current layout,
   page-broken. Each piece carries its risk badge in the corner — badge
   is color + icon/shape (icon ships in v4.2; v5 audit promotes to
   WCAG AA per the accessibility deferral).

3. Preflight panel — prominent before first unfold; collapses to compact
   chip after. Displays piece count, scale-on-sheet, smallest/largest piece,
   mesh hygiene flags, difficulty rating with "what would simplify."
   In v4.2: includes non-destructive output-side simplification preview
   ("this mesh has 12k faces; a 2k-face decimation would unfold cleanly —
   preview?") with explicit user consent and no source-mesh mutation.

4. Fix-suggestion drawer — slides in from right when user clicks a badge.
   Ranked fixes for that piece with preview of each fix's outcome plus
   a one-line "why this fix" explanation. (Critique M8.)
```

**Plus one v4.2-introduced surface:**

5. **Read-only QR-to-phone 3D companion** (critique H5). Every printed sheet includes a QR code linking to a read-only 3D view of the assembled shape, hosted as static state in a URL fragment. No account, no server, no persistence (the URL contains the mesh hash + camera state). Addresses unanimous JTBD 4 pain: three transcripts describe needing a second device with the 3D model during build.

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

When the user clicks a badge in the 2D pane, **the fix drawer slides in over the right half of the 2D pane** (not over 3D — the user often references 3D while deciding which fix to apply). Drawer is dismissible without committing.

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
                                                  • dismiss reveals
                                                    selected edges for
                                                    direct manipulation

   [Unfold] →             [click badge] →        [Apply] → UNFOLDED      [Export] → file
                                                 [Dismiss] → UNFOLDED
```

**Bidirectional 3D ↔ 2D highlight is polish, not headline** (critique M3). Hovering or selecting in 3D highlights the corresponding piece in 2D, and vice versa. No persona named this as a pain point; demoting it from draft 1's "felt magic" label to a polish detail. v4.1's ship state is re-anchored around features personas asked for: PDF export, edge numbering, thumbnail, piece drag, save/load.

**Edge-click direct manipulation is first-class, not power-user-only** (critique M4). Marcus and Dan articulate fixes in direct-manipulation vocabulary ("split this edge here," "tab on the other side"). The fix drawer is *one* entry point; edge-click is *another* equal entry point. Specifically: clicking a badge opens the drawer AND selects the affected edges in both 3D and 2D; the user can dismiss the drawer and act directly with keyboard shortcuts (`C` cut/fold, `T` flip tab, `P` pin) or further direct manipulation. The badge entry serves Priya/Sarah ("what's wrong here?"); the edge entry serves Marcus/Dan ("I know what's wrong; let me fix it directly").

## 7. The fix-suggestion engine (v4.3)

This is the load-bearing piece. It's where v4 stops being a Pepakura clone and starts being feedback-driven.

**Buildability signals (what each badge color means):**

```
SIGNAL                              THRESHOLD              COLOR + ICON
─────────────────────────────────────────────────────────────────────────
Tab on visible (exterior) face      any                    red + ⚠
Piece exceeds page dimensions       any                    red + ⤢
Piece causes overlap                any                    red + ⊠
Smallest edge < paper-craftable     <5mm at print scale    yellow + ⚲
Acute interior angles               ≥3 below 25°           yellow + ◢
Aspect ratio extreme                >12:1 or <1:12         yellow + ▭
Dense fold zones                    threshold TBD —        yellow + ▦
                                    see note below                       
None of the above                                          green + ✓
```

Each badge maps to one or more fix families; the engine accumulates specific, namable failure signals rather than computing "this piece is hard" abstractly.

**Icon redundancy ships in v4.2** (alongside badges) to provide a non-color signal for users at the boundary of the accessibility deferral. Full WCAG AA contrast audit deferred to v5+ per §2.

**The "dense fold zones" threshold is intentionally TBD.** v4.3 calibrates it against the existing corpus baseline (`docs/baseline-v3.md`), tuning until the badge fires on pieces a human classifier independently flags as "too dense to fold cleanly." Until calibrated, the predicate is disabled.

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
SIMPLIFY mesh region        Deferred to v5 (destructive)      n/a
  (Sarah's "kid mode")                                        
OUTPUT-SIDE simplification  v4.2 preview only; merges         yes (preview)
                            near-coplanar near-equilateral
                            triangles in OUTPUT layout;
                            never mutates source mesh
```

**v4.3 ships the first six.** Output-side simplification (v4.2) addresses Sarah's segment without the trust-risk of source-mesh decimation per critique H6/M11.

**Region re-unfold algorithm — concrete specification (critique B1):**

```
def reUnfoldRegion(layout, region, constraints, seed):
    # region = set of face indices forming a connected sub-graph.
    # The region's boundary edges (edges shared with non-region faces)
    # are partitioned: some are FOLDS (continuous with the pinned layout),
    # some are CUTS (region detaches at those edges).

    # 1. Extract obstacle: the set of face polygons in the layout for
    #    faces NOT in `region`. This is an OBSTACLE SET, not a single
    #    bounding polygon — preserves concavities and disconnection.
    obstacleSet = [layout.poly(f) for f in layout.faces if f not in region]

    # 2. Pick a registration anchor: one fold edge on the region/pinned
    #    boundary. The region's local layout MUST share this edge with
    #    the pinned layout (i.e., that edge's two endpoints are fixed).
    #    If no fold edge exists on the boundary (region detaches
    #    entirely), pick any region edge as a free anchor.
    anchor = pickRegistrationAnchor(region, layout)

    # 3. Run pipeline on region, with the deterministic seed and the
    #    edge ordering captured in the fix entry. Output is in the
    #    region's local frame.
    localTree    = buildSpanningTree(region, constraints.weights, seed)
    localLayout  = flatten(localTree, anchor)
    localLayout  = recut(localTree, localLayout, detectOverlaps(localLayout))

    # 4. Register to global frame using the anchor edge.
    globalLayout = registerLocal(localLayout, anchor, layout)

    # 5. Resolve obstacle: if any region piece overlaps the obstacle
    #    set, rotate/translate that piece in the plane around its
    #    anchor (preserving the anchor edge) until clear. If no
    #    rotation/translation resolves, the fix FAILS and is rejected
    #    at the SCORE stage.
    globalLayout = resolveObstacle(globalLayout, obstacleSet)

    # 6. Splice: replace region pieces in the global layout with
    #    globalLayout's region pieces. Re-verify.
    spliced = layout.replaceRegion(region, globalLayout)
    if not detectOverlaps(spliced).isEmpty:
        return FAIL

    return spliced
```

**Fallback when the algorithm returns FAIL or exceeds the time budget:** the fix is marked "could not apply automatically" and surfaced in the suggestion drawer as such. The user can still manual-pin and full-rerun (v3.5 fallback per §3).

**Ranking + "wrong fix" mitigation (the trust surface) — with cost-side terms:**

```
For each generated fix:
  1. PREDICT — re-run badge predicates against the proposed layout
  2. SCORE   — count badge-improvements minus new-badge-regressions
               PLUS cost-side terms (critique H3):
                 +1 weight × Δpieces
                 +1 weight × Δtabs
                 +1 weight × Δpages
                 +0.5 weight × Δreoriented-pieces
               Cost-side weights tunable empirically.
  3. PREVIEW — show side-by-side: current piece + predicted piece +
               delta in badges + delta in costs (Δpieces, Δtabs, Δpages)
  4. REJECT if SCORE < 0  (never propose a fix that's strictly worse
               on the combined badge + cost scoring)
  5. SHOW    ranked by SCORE descending; tie-break by reversibility
  6. EXPLAIN — generate a one-line "why this fix" string from the
               triggering badge predicate(s) and the cost deltas
               (critique M8 — explanation builds user mental model)
```

**Suggestion generation cadence.** Cheap suggestions (split at obvious seam, flip tab) run synchronously when the badge is clicked — visible in <100ms. Expensive suggestions (alt-weight re-unfold) run async — drawer shows "computing alternatives…" and they stream in over 1–3s.

**Inside/outside inference (critique M1 + L2):**

- **Watertight mesh:** outward normals from face winding + topology. **Parity check:** verify outward normals point away from mesh centroid for ≥50% of faces; if not, preflight surfaces a warning ("mesh appears inverted — was it exported with reversed winding?") with a one-click flip.
- **Open-edge mesh** (terrain ruins): inference fails. Surface a "pick three exterior faces" prompt with a **"skip — pick sensible default" path** that flood-fills the largest connected outward-normal-coherent face cluster. After the first flood, walk all unclassified faces; if any remain unclassified, prompt for additional seeds.
- **Override:** user can always click a face in 3D and toggle interior/exterior. Persisted in pipelineConfig.

## 8. Scope boundaries

**v4 ships (across v3.5, v4.0–v4.3, as sequenced in §3):**

```
✓ Drop STL/OBJ + .pdo import → preflight → unfold → fix loop → export (SVG, PDF)
✓ Curated starter gallery (10-20 community models, MIT/CC0)
✓ Four surfaces + the QR-to-phone read-only companion
✓ Bidirectional 3D↔2D highlight (polish, not headline)
✓ Six fix families (mesh simplification deferred; output-side preview in v4.2)
✓ Inside/outside inference + parity check + manual override
✓ Undo/redo via appliedFixes traversal with determinism contract
✓ File-based save/load (.unfolder.json with embedded mesh bytes) — v4.1
✓ IndexedDB auto-save + project library — v4.2
✓ Edge-click direct manipulation (first-class, not demoted)
✓ Manual piece drag-to-rearrange
✓ Thumbnail-on-net + QR-to-phone (the v4.2 assembly companion)
✓ Output-side non-destructive simplification preview (v4.2)
```

**v4 explicitly defers to v5+ (with reason and stated calcification cost):**

```
✗ Mesh simplification (source-mesh decimation) — destructive, trust risk
✗ Multiple tab shapes / numbering schemes — README v5; not load-bearing
✗ 3D fold preview animation — README v5
✗ PDO EXPORT (import is in v4.2) — README v5
✗ Print tiling for huge pieces — README v5
✗ Step-numbered guided assembly animation — synthesis Q8; thumbnail +
   QR-to-phone is the v4 minimum
✗ Texture/color passthrough — v3 workstream; carries forward if landed
✗ Generative-art / batch API entry — Evan's posture: maker primary
✗ Parametric polyhedron input (Mr. Chen) — different product; synthesis Q5
✗ Thingiverse / Sketchfab / Printables integration — upstream of v4 scope
✗ Commercial-creator features (project library sharing, batch export,
   account/billing) — calcifies free-tool architecture; v5+ retrofit
   accepted as expensive
✗ Accessibility (full WCAG AA audit, screen-reader paths) — v4.2 ships
   icon redundancy on badges; full audit deferred to v5+; calcification
   cost accepted
```

**The "accept and proceed" vs "tool gave up" distinction (critique M6).** Two different end states, surfaced differently in UI:

- **Accept and proceed.** User has read the badge reason and chooses to ship anyway (Marcus's pattern: "I'll fix it in foam"). Badge dims to gray; the fix is logged as an intentional acceptance.
- **Tool can't fix automatically.** No fix has SCORE > 0. Badge stays red. Export still works but surfaces a warning banner ("this build has unresolved issues — see piece N").

Draft 1 collapsed these; the user research evidence is that Sarah and Priya can't distinguish them without UI help.

## 9. Error handling

Each row annotated with the release in which it lands (critique M9):

```
FAILURE                          RELEASE   USER-FACING TREATMENT
──────────────────────────────────────────────────────────────────────
Unsupported format               v4.0      "v4 supports STL/OBJ/PDO —
                                            convert in Blender first"
Malformed parse                  v4.0      surface line/byte; no silent
                                            fallback
Disconnected components          v4.0      "this mesh has N disconnected
                                            parts — unfold each separately?"
Non-manifold                     v4.2      orange badge in preflight;
                                            unfold may still work
>50k faces                       v4.2      warn but allow; performance
                                            disclaimer; suggest output-
                                            side simplification preview
Polygon-clipping precision       v4.0      "near-coincident edges couldn't
  (0025 known issue)                        be resolved — repair externally"
Fix engine: no fix scores > 0    v4.3      "no automatic fix improves —
                                            manual edit / accept"
Region re-unfold post-fail       v4.3      revert to previous state;
                                            surface cause; offer manual-pin
                                            + full-rerun fallback (loading)
Save: corrupted JSON             v4.1      "project file damaged. Start
                                            fresh?"
IndexedDB quota                  v4.2      "storage full. Remove older
                                            projects?" + LRU list with
                                            cross-device caveat
Save: mesh hash mismatch         v4.2      "expected mesh.obj; this is
                                            mesh-v2.obj" (mesh hash only
                                            lands in v4.2 with IndexedDB)
No WebGL 2                       v4.0      "requires Chrome, Firefox,
                                            Safari 16+, or Edge"
```

**Browser support matrix:** latest Chrome / Firefox / Edge. Safari 16+ is **best-effort, not promised** until verified in Playwright CI (critique M12). r3f's stability on Safari 16's WebGL 2 has known footguns; the v4.0 acceptance criterion is "drop-mesh-to-export smoke passes on Chrome, Firefox, Edge in CI." Safari coverage is added when verified.

**Offline-after-first-load.** Service worker caches JS + WASM. All persistence local. Matters for Priya's "I want to fold paper, not configure things" posture. Network errors never block the core flow.

## 10. Cross-cutting design principles

Apply to every release (v3.5–v4.3), inherited from `synthesis.md §6` with one explicit deferral note:

- **P1 — Browser-native, no install, no account, free for the core flow.** Theme 1 + theme 7 + the "free side project" posture (locked 2026-05-17). No payment surface anywhere in v4.
- **P2 — Show buildability before commitment.** Theme 4. Every step of the pipeline should surface "what will this cost / what could go wrong" before the user commits.
- **P3 — Treat unfold output as draft, not deliverable.** Theme 2. Every editing affordance cheap and reversible.
- **P4 — The model knows which side is the outside.** Theme 3. Inside/outside is the single concept that unlocks tab placement, seam choice, texture register.
- **P5 — Group preservation is a feature, not a side effect.** Theme 5.
- **P6 — Provide an assembly companion, even if minimal.** Theme 6. Thumbnail-on-net + QR-to-phone in v4.2.
- **P7 — `src/core/` returns structured data; `src/app/` shapes it for users.** Pure-function discipline per ADR 0001. `FixProposal` is core; human copy is app. (Critique L1.)
- **P8 — Accessibility is deferred to v5+ with stated cost.** v4 ships color + icon on badges from v4.2 as the minimum forward-compatible move; everything else (WCAG AA contrast, keyboard nav audit, screen-reader paths, tab-order) is v5+ work the spec explicitly accepts as a calcification cost.

## 11. Prerequisites that must land before v4 commits

```
v3.5 — Incremental-pipeline PHASE (renamed from "spike" per critique H9)
   Goal: produce a written, worked-example algorithm for region re-unfold
   AND a measured perf cost model on deer.obj. Sub-second on a 50-face
   region is the TARGET; failure mode is the v4.3 fallback.
   ~4–6 sessions:
   ├─ Spike: algorithm design + worked example  2–3 sessions
   ├─ Promote-to-core + region-aware ADR       2–3 sessions
   Blocks BOTH v4.1 (edge-toggle, undo) AND v4.3 (region re-unfold).
   Fallback: if "infeasible at <1s" returned, v4.3 ships manual region-pin
   + full-pipeline-re-run with loading spinner.

Real-user validation — DOWNGRADED (critique H10)
   From draft 1's "blocks v4.3 design lock" to "informs v4.3 iteration
   after ship." Rationale: budget for recruiting + 5–8 interviews +
   synthesis is its own multi-session effort that doesn't fit the "free
   side project" posture. Ship v4.3 against the synthetic findings;
   gather real-user signal from deployed v4.3; iterate in v4.4 if needed.
   The 8 open questions in §13 become "things to watch for in v4.3
   telemetry and user feedback," not gating items.
```

## 12. Testing strategy

Standard for the codebase, no novel design work:

- **`src/core/` — Vitest unit tests + property tests.** Already in place. The new modules (region re-unfold, badge predicates, fix-suggestion generators, scoring, determinism contract) get full unit coverage. Each fix family is a separate test file with golden-corpus regression.
- **Determinism property test** (load-bearing for the undo claim per §4). "Applying fixes 0..N from scratch matches the cached layout at step N for all N up to the current append-point." Runs on every corpus model in CI; failure here blocks the release.
- **`src/app/` — React Testing Library for component logic, Playwright for end-to-end flows.** New for v4. Smoke tests per release: v4.0 "shell loads, pipeline runs, output renders"; v4.1 "drop mesh, see unfold, export PDF, save, reload, edit, undo"; v4.2 "see badges, see preflight, view QR companion"; v4.3 "click badge, see suggestions, apply fix, verify region change."
- **Cross-browser CI smoke (critique M12).** Playwright runs the v4.1 PDF-export smoke on Chrome, Firefox, Edge per release. Safari added when verified; until then, Safari is best-effort.
- **Visual regression on the corpus.** Existing baseline harness (`scripts/baseline-pipeline.ts`) extended to capture screenshots of the rendered SVG output per corpus model. v4 changes that shift the rendered output (badge overlays, etc.) become visible diffs.
- **Region re-unfold post-conditions.** Every fix that runs region re-unfold asserts: (a) `detectOverlaps(splicedLayout).isEmpty`, (b) pinned faces unchanged, (c) the triggering badge predicate no longer fires.

## 13. Open questions — things to watch for in v4.3 (not blockers)

The synthetic round cannot answer these. **Per the §11 downgrade, they do NOT block v4.3 design lock**; they are things to watch for in v4.3 user signal and iterate in v4.4 if warranted.

Q6 (pricing) from draft 1 is **closed**: unfolder is a free side project; no pricing surface to design.

| # | Question | Best testable against |
|---|---|---|
| Q1 | Is "I'd skip the unfolding step entirely if I could" real in the wild, or a synthetic-cleanness artifact? | v4.1 telemetry (do users complete the build without entering any editor flow?) + v4.3 user feedback |
| Q2 | Does "drop file, get PDF" convert Priya-tier users, or do they bounce on the first preview screen? | v4.1 funnel telemetry (drop-mesh → PDF download rate) |
| Q3 | Is inside/outside legible to non-experts, or must it be entirely inferred? | v4.2 — does the override surface get used at all? |
| Q4 | What's the real distribution of mesh sources, and what fraction are unfoldable at all? | v4.1 + v4.2 — mesh-source telemetry (drag-drop vs starter gallery vs .pdo import) + preflight-pass-rate |
| Q5 | Does Mr. Chen's "mathematical correctness" requirement need a separate parametric primitive path? | Out-of-scope; deferred to v5+ alongside polyhedron-name input |
| Q7 | Does region re-unfold actually save Marcus's time, or is the cognitive overhead higher than the time saved? | v4.3 — region-re-unfold completion rate + time-per-fix telemetry |
| Q8 | Assembly companion minimum viable form — thumbnail + QR enough, or do users want step-numbered animation? | v4.2 telemetry — QR scan rate from printed sheets |

## 13a. Moat and competitive response

**Durable advantages (per critique H13):**

- **MIT-licensed open source.** A Pepakura Web port would not be open source; unfolder's source survives competitive replication. Forks and extensions accrue value to unfolder's ecosystem, not Tama Software's.
- **No-account, no-server, no-cloud architecture.** Mr. Chen's institutional segment cannot adopt cloud-dependent tools (privacy review). A competitor with the same UX but cloud-only does not displace unfolder for that segment.
- **The `appliedFixes` derivation model.** Once published as ADR + algorithm, this is a contribution to the papercraft-tool design space that competitors can adopt but unfolder is the canonical source for.

**Kill-criterion / pivot trigger.** If a competitor (Tama Software or PaperMaker or new entrant) announces a feature-comparable web port during v4.0–v4.3, the response is:

- **Stay the course on UX hypothesis** (feedback-driven iterative unfolding survives because no other tool has it).
- **Accelerate the open-source moat** (publish ADRs, accept community contributions, document the algorithm).
- **Do NOT compete on feature parity** with Pepakura's 20-year template ecosystem; rely on the no-install + open-source + free posture for users who can't or won't adopt the commercial alternative.

Per the "free side project" posture, unfolder does not need to win against Pepakura commercially — it needs to exist for the users Pepakura excludes.

## 14. References

- `docs/spikes/2026-05-16-v4-user-research/findings.md` — spike conclusion (hybrid hypothesis)
- `docs/spikes/2026-05-16-v4-user-research/synthesis.md` — full evidence + JTBD + opportunity space
- `docs/spikes/2026-05-16-v4-user-research/competitive-scan.md` — competitive tool landscape
- `docs/spikes/2026-05-16-v4-user-research/personas.md` + `topic-guide.md` + 5 transcripts — research protocol
- `docs/spikes/2026-05-16-v4-user-research/critique-1-architecture.md` through `critique-4-blind-spots.md` — independent review round
- `docs/spikes/2026-05-16-v4-user-research/critique-synthesis.md` — issue ledger driving this revision
- `README.md` — phase plan (v4 description is superseded by this spec)
- `docs/project-state.md` — working agreements, structural commitments
- `docs/decisions/0001-v1-pipeline-architecture.md` through `0007-cut-removal-as-v3-default.md` — pipeline ADRs that v4 builds on
- `docs/roadmap.md` — phase plan; "session 0029 — file-loader UI v4-precursor" is absorbed into v4.1 by this spec
