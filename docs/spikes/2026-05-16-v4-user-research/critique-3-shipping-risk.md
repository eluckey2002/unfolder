# Critique — Scope and shipping risk
Reviewer: independent (no spec authorship; no prior conversation context)
Date: 2026-05-17

## Severity scale
- BLOCKER: spec sets up an unachievable scope; rework before commit
- HIGH: significant risk of slipping or splitting under load
- MEDIUM: worth tightening inline; not gating
- LOW: nit / suggestion

## Calibration anchor

Session 0025 (`docs/sessions/0025-optimized-recut.md`) is the most
recent "normal" session: 12 atomic commits, six new `src/core/`
modules, one ADR, baseline regen, +52 tests across +5 files,
~349 line cut-removal module + ~189 line orchestrator. Crucially,
0025 was *promotion of a finished spike into core* — the algorithm
work was done. Even with the algorithm pre-baked, it filled one
session. Any v4 task whose surface area exceeds 0025's needs to be
budgeted as multiple sessions, not "a session."

Two corroborating points: session 0023 (the spike that 0025
promotes) is itself a separate session; session 0024 (strategist
skills, *no algorithm work*, mostly docs + skill scripts) is also a
full session. Pure-doc work fills a session here; full-stack
feature work does not collapse into one.

The project carries an essentially empty `src/app/` (44 LOC `main.ts`
+ 89 LOC `render.ts`, plain three.js + OrbitControls, no React, no
component model, no build wiring beyond Vite's defaults). v4.0's
"React + r3f shell" therefore starts from zero.

## Issues

### Issue 1 — "weeks not months" is undefended; v4.0 alone is multiple sessions of un-budgeted shell work
**Severity:** BLOCKER
**Spec section:** §3 (release sequencing), opening paragraph
**Problem:** §3 promises that the sequencing "collapses time-to-first-use to weeks." The v4.0 line-items hide a large skeleton-build: (a) introduce React + JSX/TSX into a project that currently has no React, no component conventions, no styling system, no routing; (b) introduce react-three-fiber and migrate the bespoke `createViewport(container, mesh)` lifecycle in `src/app/render.ts` (manual scene/camera/renderer/OrbitControls + `requestAnimationFrame` loop + dispose teardown) into r3f's declarative model — not a wrapper; a rewrite; (c) introduce a state store (Zustand per §4, with Immer); (d) introduce a layout system for the four-pane surface shown in §5; (e) introduce React Testing Library + Playwright per §12 ("New for v4 (the v3 app shell was too thin to test)"); (f) the file-loader UI that was sized as full session 0029 in the v3 roadmap is now "absorbed into v4.0" — absorption is not size-reduction; (g) the existing pipeline emit currently dumps `<div class="page-card">` cards directly into `#net` via `innerHTML = emitSvg(pages[i])` — moving this into React with selection/highlight hooks is a rewrite of the 2D pane, not a wrap. None of these are unreasonable individually; collectively they are 4–6 sessions before the user sees an unfolded mesh in the new shell, not "weeks." The spec also commits §12 testing infra as a v4.0 deliverable — adding Playwright to a project that doesn't have it is itself non-trivial (browser bin install, CI matrix changes, smoke harness, fixtures).
**Why this matters:** "Weeks not months" is the headline scope claim. If real elapsed work is 5–8 sessions across v4.0 plus another 8–12 across v4.1, that is months at this project's session cadence, not weeks. The claim sets stakeholder expectations the spec then can't meet, and pushes the implementer to cut corners on the shell — which is precisely where v4.1/v4.2/v4.3 will need it solid.
**Recommended action:** Replace "weeks" with an explicit session count per release. Reframe v4.0 itself into two releases — v4.0a (shell parity: React + r3f + Zustand + test infra, *no UX change vs. today's `main.ts`*) and v4.0b (drop-mesh UI + export + page nav). The shell-parity release ships nothing user-visible; that is fine; it isolates the un-budgeted skeleton work.

### Issue 2 — v4.1 is three releases pretending to be one
**Severity:** HIGH
**Spec section:** §3 (v4.1 line-items)
**Problem:** v4.1 lists six items: bidirectional 3D↔2D highlight; manual piece drag; manual edge cut/fold toggle; undo/redo via `appliedFixes` traversal; save/load `.unfolder.json`; auto-save IndexedDB. Each is non-trivial and several are coupled to open algorithmic problems:
- *Bidirectional highlight* requires r3f `raycaster` plumbing on the 3D side, hit-testing on SVG-in-React on the 2D side, and a face-to-piece mapping that survives the recut stage (the existing `RenderablePiece` has `meshFaceIndices` per critique 1; that contract has to be exposed cleanly to the app layer).
- *Manual piece drag* on SVG-in-React is its own UX work: pointer events, transform handles, collision feedback with pagination, snap-to-page-edges.
- *Manual edge cut/fold toggle* requires that toggling an edge re-run the pipeline — i.e. it *already* depends on incremental re-run, which v3.5 is supposed to provide. The spec puts this in v4.1 while putting v3.5 as a v4.3 prerequisite. Either edge-toggle in v4.1 re-runs the full pipeline (slow; UX disqualified for power users; 1–3s per click on the corpus per ADR 0007), or v3.5 is actually a v4.1 prerequisite too.
- *Undo/redo via appliedFixes* depends on the determinism guarantee that critique 1 flags as broken under cut-removal's iteration-order sensitivity. If undo doesn't reproduce the prior layout, this is a multi-session correctness fight, not a one-task feature.
- *Save/load + auto-save* needs the meshHash + IndexedDB schema + face-index stability contract that critique 1 issue 6 enumerates.

Six items, three of which embed open algorithm/contract decisions the spec has not made.
**Why this matters:** A release with this much hidden dependency will either slip badly or ship with one or two items pulled — at which point v4.1's stated ship-state ("README's stated v4 surface, minus differentiation") is not achieved.
**Recommended action:** Split v4.1 into v4.1 (bidirectional highlight + manual drag + save/load file-only) and v4.2-pre (undo/redo + edge toggle + auto-save), pushing the latter to land after v3.5 is in hand. Or pull edge-toggle and undo to v4.3 alongside region re-unfold, since all three depend on the same incremental-pipeline machinery. Either way, name the dependency chain explicitly in §3.

### Issue 3 — v3.5 incremental-pipeline "spike" is a multi-session re-architecture
**Severity:** HIGH
**Spec section:** §11 (Prerequisites)
**Problem:** §11 budgets v3.5 as a single spike with a perf goal ("region re-unfold under 1s on a 50-face island"). The existing `src/core/cut-removal.ts` (386 LOC), `recut.ts` (260 LOC), `flatten.ts` (190 LOC), `spanning-tree.ts` (119 LOC), `tabs.ts` (282 LOC), `paginate.ts` (187 LOC), `overlap.ts` (73 LOC) — ~1497 LOC of pipeline — are all written under a *global, full-mesh, one-shot* contract. None take a face-subset, a pinned boundary, or an obstacle polygon as input. Making the pipeline incremental at region scope means: introducing a region-subgraph extraction in adjacency; making cut-removal's edge-ordering deterministic under restricted face sets (per critique 1 issue 2); registering the region's flatten output against a global frame; defining the obstacle-aware placement primitive that critique 1 issue 1 flags as missing; producing a splice operator that maintains tab assignments across the region/pinned boundary. That is a re-architecture of `src/core/` at minimum 3–5 sessions of design + implementation, with its own ADR(s), plus a spike to find out where it goes wrong. Session 0023 was a single spike that produced *three* alternative algorithms in their separate files, took a full session, and that work was *bounded* (variant exploration on a fixed contract). v3.5 changes the contract.
**Why this matters:** v4.3 — the headline differentiation — is gated on v3.5. If v3.5 is mis-sized as "a spike" the schedule slips precisely on the differentiating release. There is also no provision for what happens if the spike returns "infeasible at this budget" (critique 1's perf claim concern).
**Recommended action:** Rename v3.5 from "spike" to "v3.5 phase" with at least two budgeted sessions: a real spike (algorithm design + worked example on `deer.obj`) and a promote-to-core session (the 0025 pattern). Make v3.5 a sequenced prerequisite to v4.1 *and* v4.3, not v4.3 alone (see issue 2). Add a fallback branch to §11: "if v3.5 returns infeasible, v4.3 ships *manual* region-pin + full-pipeline-re-run with a loading spinner, accepting the perf hit."

### Issue 4 — Real-user validation has no budget; will collapse into v4.3 launch pressure
**Severity:** HIGH
**Spec section:** §11 (Prerequisites — real-user validation), §13 (Open questions)
**Problem:** §11 lists "5–8 real-recruit interviews against a clickable v4.2 prototype" as blocking v4.3 design lock. The spec accounts for zero of the actual work this entails: producing the clickable prototype (separate from v4.2 itself? or v4.2 *is* the prototype? — undefined); recruiting (channels, screening, scheduling, incentives); conducting (interviewer time, ~1hr per session × 5–8 = 5–8 sessions of pure interview time before synthesis); synthesizing (the *synthetic* round took a multi-document spike). No budget is given. The synthetic round (`docs/spikes/2026-05-16-v4-user-research/`) is large — competitive scan + personas + topic guide + 5 transcripts + synthesis + findings — and represents real strategist effort that the spec implicitly assumes the real-user round will repeat against tight deadline pressure. Q1, Q7, Q3 are flagged as load-bearing for v4.3 design lock; if the answers go against the spec (Q1: real users *do* want to skip the editor; Q7: region re-unfold *doesn't* save Marcus's time) v4.3 has to redesign — but the spec gives no decision rule for "we got the answers; now what?"
**Why this matters:** Two failure modes: (a) the real-user round is silently dropped under v4.3 launch pressure ("we have the synthetic findings; ship") and the load-bearing assumptions go untested; (b) the round happens, produces an inconvenient answer, and the spec has no committed protocol for incorporating it — turning into ad-hoc re-design under deadline. Both have happened in this project's prior phases (cf. ADR 0006's existence at all).
**Recommended action:** Either (a) commit a separate spike *now* (before v4.0 starts) that produces the v4.2 prototype mockup, recruits, and runs the interviews — front-loaded so v4.3 design lock has the data when it is needed, or (b) explicitly downgrade real-user validation from "blocks v4.3 design lock" to "informs v4.3 iteration after ship" and accept the risk in writing. The current middle position ("blocks v4.3 design lock, no budget") is the unworkable one. Recommend (a).

### Issue 5 — Error-handling surface area in §9 is roughly half a release of UX work undercounted
**Severity:** MEDIUM
**Spec section:** §9 (Error handling), implicit allocation across v4.0–v4.3
**Problem:** §9 enumerates 12 distinct failure modes with one-line "user-facing treatment" strings. Each one in practice requires: detection plumbing (e.g., the parse-time line/byte surface for malformed parse needs the parsers to carry position data they may not), a UI surface (modal? inline banner? badge in preflight?), copy that survives review, a recovery flow (the LRU eviction at IndexedDB quota requires a UI to select what to evict, a confirmation, an undo for accidental eviction…), and a test. At ~0.5 session per error mode realistically — and several (mesh hash mismatch, IndexedDB quota, region re-unfold post-fail) require non-trivial design — that's 4–6 sessions of error-handling work that the §3 sequencing does not allocate. The spec implicitly assumes errors get handled inline in each release; in practice they get punted, then become a §9-shaped backlog right before launch.
**Why this matters:** Each release will appear smaller than it is because the error cases are not in the line-items. By v4.3 the cumulative backlog of "we'll do that error case next release" becomes its own release.
**Recommended action:** Annotate each row of §9 with the *release* in which it lands (v4.0, v4.1, v4.2, v4.3), then audit the per-release task lists to verify the error work is line-itemized. A first pass: parse failures + format mismatch + no WebGL → v4.0; mesh hash mismatch + JSON corrupted + IndexedDB quota → v4.1 (with save/load); disconnected components + non-manifold + >50k faces → v4.2 (with preflight); fix-engine errors + region re-unfold post-fail → v4.3. Then check each release plan still fits the session count.

### Issue 6 — Mesh-by-hash IndexedDB design is hand-waved at the user re-attach flow
**Severity:** MEDIUM
**Spec section:** §4 (Persistence), §9 (mesh hash mismatch row)
**Problem:** "Mesh bytes are not embedded (too large); user re-attaches on load, or we stash meshes in IndexedDB keyed by content hash." That sentence does ~three releases of UX work in one comma. The "user re-attaches" flow: how do they know which file? (The save file stores `meshFilename`; what if it was renamed? what if it lives in a Drive folder?). The "stash in IndexedDB" flow: what's the eviction story when IndexedDB is full and the user opens an old project (load fails because mesh was LRU-evicted)? What if the user opens the same project on a different browser or in incognito? The spec section explicitly listed for this — §9 "Save: mesh hash mismatch" → `"expected mesh.obj; this is mesh-v2.obj"` — covers the *wrong file* case; it does not cover the *missing file* case or the *correct file under a different name* case. The interaction with auto-save is also undefined: if every state change auto-saves to IndexedDB and the user's mesh is content-hashed there, what is "save the project" for? Just download a JSON that points at the IndexedDB blob?
**Why this matters:** v4.1 commits to auto-save + save/load in one release; that release has to define the answers to all of the above or it ships a broken core flow (user closes tab, returns, no project; or user emails the `.unfolder.json` to a friend who has no mesh).
**Recommended action:** Either (a) treat the persistence design as a dedicated section in §4 with its own decision points (hashing canonicalization; eviction policy; cross-device story; the `.unfolder.json` ↔ IndexedDB relationship; the "switched browsers" failure copy), or (b) accept that v4.1 ships *file-based* save/load only (the JSON bundles the mesh path or asks the user to re-attach; no IndexedDB), deferring IndexedDB to a later release where it gets its own ADR. The latter is the lower-risk shipping path.

### Issue 7 — Mesh simplification is load-bearing for some real-user meshes; deferring it makes v4 partially unusable
**Severity:** MEDIUM
**Spec section:** §7 (fix families table, mesh simplification DEFERRED), §8 (v4 explicitly defers to v5+)
**Problem:** §7 defers mesh simplification to v5 on trust grounds (destructive on source mesh). The persona work (`personas.md`/`synthesis.md`) explicitly references Marcus-tier Sketchfab dragons in the 287-piece range; Sarah's "kid mode" use case is specifically about decimation. The fix-suggestion engine without mesh simplification will, on a high-poly source, produce no fix with SCORE > 0 because every red badge is rooted in the mesh's polygon density. The §8 "accept imperfection" escape ("user can accept and proceed; the badge stays red; the export still works") is reasonable for Marcus, but the v4 ship state for Sarah/Priya on a high-poly model is "every piece is red; nothing to do but accept; the result is not buildable." That is not "I can use it." A workable interim is the user *manually* reducing polygons in Blender first — which is exactly the "no install" promise §10 P1 says we are not making them do.
**Why this matters:** The deferral is principled, but the *consequence* for a non-trivial slice of expected user-uploaded meshes is that v4.3 is shippable-but-not-useful for them. The synthesis acknowledges this in passing; the spec's release plan does not.
**Recommended action:** Either (a) un-defer a *non-destructive* mesh-simplification preview to v4.2 (preflight reports "this mesh has 12k faces; a 2k-face decimation would unfold cleanly — preview?"), with the actual decimation happening only on explicit user consent and producing a new mesh derivation rather than mutating the source; (b) add an explicit §8 caveat that v4 is shippable only on meshes below an empirically-determined face count, and either gate uploads above that bound or warn loudly in preflight. Option (a) is the maker-respecting move and matches the v4 hypothesis ("constructive resolution"); (b) is the honest "we know we don't cover this" alternative.

### Issue 8 — react-three-fiber + Safari 16 compatibility is asserted not verified
**Severity:** LOW
**Spec section:** §9 (Browser support matrix), §4 (r3f architecture)
**Problem:** "Latest Chrome / Firefox / Safari (16+) / Edge. Chromebook supported. WebGL 2 required." r3f's stability on Safari 16 has known footguns — Safari 16's WebGL 2 has historically had bugs around `OES_texture_float_linear`, ANGLE indirect-draw, and Safari's GPU process restart behavior; r3f's reconciler also depends on React 18+ concurrent features that interact with Safari's main thread differently. The spec asserts the matrix without citing verification. The current `render.ts` uses plain three.js + `WebGLRenderer({ antialias: true })`, which is well-trodden on Safari 16; the migration to r3f introduces a new layer that may or may not be. This isn't necessarily a problem, but it is a verification debt the spec doesn't claim.
**Why this matters:** Cross-browser regressions found at launch are a credibility hit on a tool whose primary promise is "no install." Safari users hitting a blank viewport will not file a bug; they will leave.
**Recommended action:** Add a v4.0 acceptance criterion: drop-mesh-to-export smoke passes on the stated browser matrix in CI (Playwright supports the cross-browser run). If Safari 16 is on the matrix and not in CI, demote it to "best-effort" until verified.

## Realistic effort estimate per release

In sessions (the unit `docs/project-state.md` plans in), using session
0025 (~349 LOC core module + ~189 LOC orchestrator + ADR + baseline +
+52 tests in one session) as the upper bound for "one session of
algorithm + integration work."

```
v3.5 incremental-pipeline phase    4–6 sessions
   ├─ spike: algorithm design +    2–3 sessions
   │   worked example, perf model
   └─ promote-to-core +            2–3 sessions
       region-aware pipeline ADR

v4.0  "I can use it"               5–8 sessions
   ├─ shell parity (React +        2–3 sessions
   │   r3f + Zustand + Playwright
   │   + RTL, no UX change)
   ├─ drop-mesh + SVG export +     2–3 sessions
   │   page nav + viewport
   │   parity to current renderer
   └─ error states (parse, no      1–2 sessions
       WebGL, format) per issue 5

v4.1  "I can edit"                 6–10 sessions
   ├─ bidirectional highlight      1–2 sessions
   │   (after face↔piece contract
   │   exposed)
   ├─ manual piece drag            2 sessions
   ├─ save/load file-only          1–2 sessions
   │   (if IndexedDB deferred)
   ├─ undo/redo                    1–2 sessions
   │   (after determinism contract
   │   in v3.5)
   ├─ edge-toggle                  1–2 sessions
   │   (requires v3.5)
   └─ error states (save/load,     1 session
       hash mismatch)

v4.2  "I get feedback"             4–6 sessions
   ├─ preflight panel              1–2 sessions
   ├─ badge predicates             1–2 sessions
   ├─ inside/outside inference     1 session
   │   + override
   └─ error states                 1 session
       (preflight, mesh hygiene)

v4.3  "I get fixes"                5–8 sessions
   ├─ fix engine + scoring         2 sessions
   ├─ six fix families             2–3 sessions
   ├─ region re-unfold UX          1–2 sessions
   │   (algorithm shipped in v3.5)
   └─ trust-surface + preview      1 session

Real-user validation spike         3–5 sessions
   (recruit + 5–8 interviews +
   synthesis); should run in
   parallel with v4.0 / v4.1,
   not block v4.3 design lock
```

**Total v3.5 + v4 phases: ~24–38 sessions.** At this project's recent
cadence (sessions 0023, 0024, 0025 ≈ one session every 1–3 days when
active), that is months, not weeks. The "weeks not months" framing is
defensible only for v4.0a (shell parity) in isolation, and only if it
actually ships nothing user-visible.

## Strengths

1. **The §3 sequencing is the right *shape*** even if the sizing is
   wrong. Front-loading "user can drop a mesh and see something"
   before differentiation is sound and matches how 0025-style sessions
   actually land (one ship-state at a time). The instinct to *ship v4
   incrementally rather than as one cliff-edge release* is the most
   important shipping discipline in the spec.

2. **v3.5 is correctly identified as blocking, and the blocker is
   correctly scoped to v4.3 only.** Even if v3.5 is mis-sized as a
   spike (issue 3), the *recognition* that the algorithm is the
   bottleneck on the differentiation release — and that v4.0–v4.2 can
   proceed in parallel — is right. This is the kind of dependency
   identification the project's prior phases did *not* always do (cf.
   the v3 phase's "session 0029 file-loader UI" sitting in the roadmap
   for sessions before being absorbed into v4).

3. **§13 names open questions explicitly rather than burying them.**
   The list pre-commits the spec to invalidation conditions — Q1, Q7,
   Q3 — and ranks them by load-bearingness. That's a posture that
   makes the v4.3 design-lock decision auditable later. The risk is in
   the budgeting of the validation work (issue 4), not in the framing.

4. **§8's "accept imperfection" escape hatch** is a real piece of
   product taste — the explicit acknowledgment that "red badge,
   user proceeds anyway" is a valid end state respects how Marcus-tier
   users actually work and prevents the suggestion engine from
   degenerating into a wall the user can't get past. This is the right
   product-design move and it survives even if the suggestion engine
   underperforms.

## Open questions for the spec author

1. **Is v4.0 actually a single release, or is the implicit "shell
   parity" subsumed?** If the implementer is meant to ship shell
   parity (React + r3f + Zustand + test infra, no user-visible
   change) as a separate landing before drop-mesh-UI, the spec should
   say so — and the §3 line should show two sub-releases. If the
   implementer is meant to ship both in one cliff, the session count
   is 5–8, not the implied 1–2.

2. **Is v3.5 a prerequisite to v4.1's edge-toggle and undo/redo, or
   only to v4.3's region re-unfold?** The spec puts edge-toggle and
   undo in v4.1 and the algorithm in v4.3 — but edge-toggle inherently
   requires incremental re-run, and undo requires the determinism
   contract v3.5 is meant to establish. Which release actually pulls
   v3.5 first, and what does the slower release ship with in the
   interim?

3. **What is the decision rule if real-user validation contradicts the
   v4.3 hypothesis?** Specifically: if Q1 ("skip the editor entirely")
   comes back as a real signal in 3+ of 5–8 real interviews, does v4.3
   ship the suggestion engine anyway, ship a parallel "one-click
   acceptable defaults" flow alongside it, or pause v4.3 design lock
   pending a re-framing? §11/§13 commit to running the validation but
   not to acting on it. Naming the action ahead of time prevents the
   "we got the answer; now what?" failure mode under launch pressure.
