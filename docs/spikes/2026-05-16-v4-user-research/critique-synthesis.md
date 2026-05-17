# Critique synthesis — v4 spec review round 1

**Date:** 2026-05-17
**Inputs:** four parallel critique agents, each fresh-context, with distinct lens. Outputs at `critique-1-architecture.md`, `critique-2-ux-alignment.md`, `critique-3-shipping-risk.md`, `critique-4-blind-spots.md`.
**Purpose:** roll up the four critiques into a single decision surface for the spec author; identify what can be revised inline vs. what requires strategic director-level calls; propose a path to a revised, commitable spec.

## TL;DR

The spec's **headline hypothesis** (feedback-driven iterative unfolding — B+C hybrid) **survives all four critiques as a strength**. The spec's **execution-level details do not**: the four reviewers independently surface 2 BLOCKERs, 9 HIGH, 8 MEDIUM, and 2 LOW issues.

The blocker pattern is consistent: **the spec asserts capabilities (sub-second region re-unfold, deterministic undo, a usable v4.0, weeks-to-ship) that the underlying algorithms, mesh-acquisition reality, and project session cadence don't currently support.** Three of four critiques flag the same `appliedFixes` log as the spec's strongest architectural choice — but the determinism contract that makes it work isn't yet defined.

Four critiques converge on four strategic decisions the spec defers but that affect what gets revised: (1) is v4.0 a user release or an internal milestone? (2) is unfolder a free side project or a sustainable product? (3) are commercial creators in v4's market? (4) is accessibility v4-scope or deferred?

**Recommendation: revise the spec in place** (not from scratch) — the hypothesis survives; the issues are addressable by tightening, not redesigning. Director resolves the four strategic calls; spec author addresses the architecture/UX/shipping issues inline; we commit revised spec and proceed to writing-plans.

## Issue ledger

Aggregated across all four critiques. Severity uses each critique's scale; spec-section column maps to the v4 spec under review.

### BLOCKER-tier (spec cannot ship as written)

| # | Critique | Spec § | Issue | Action category |
|---|---|---|---|---|
| B1 | Arch §1 | §7 | Region re-unfold pseudocode hand-waves `pinnedBounds`, `positionAroundObstacle`, splice registration. The algorithm is closer to constrained packing than the spec admits; v3.5 spike target floats free of any actual design. | **Inline rewrite of §7** — define the obstacle data structure (face polygons not bounding polygon), the registration anchor, the fallback when no placement exists. Promote v3.5 spike's first deliverable to "produce a written algorithm with worked example on `deer.obj`," not "hit a perf number." |
| B2 | Blind §1 | §3, §5, §8 | Spec begins where 3 of 5 personas have already bounced. Sarah scrolls Pinterest; Priya Googles for PDFs; Mr. Chen relies on curriculum vendors. JTBD ranking is structurally wrong if half the funnel quits upstream. No `.pdo` import (the de-facto papercraft distribution format), no Thingiverse/Sketchfab integration, no starter gallery. | **Strategic call + inline addition** — either (a) v4 funnel starts earlier (mesh acquisition is a v4 surface; .pdo import in v4.1, starter gallery in v4.2), or (b) spec explicitly concedes v4 only serves users past the mesh-acquisition wall and revises the persona-coverage claims accordingly. |

### HIGH-tier (real risk; revise before commit)

| # | Critique | Spec § | Issue | Action category |
|---|---|---|---|---|
| H1 | Arch §2 | §4, §7 | `appliedFixes` derivation is broken by cut-removal's iteration-order dependence and polygon-clipping's nondeterminism. Replaying fixes 0..N can produce a layout that diverges from what the user accepted — silent undo corruption. | **Inline §4 revision** — either store layout deltas in fix entries (memory cost) or pin RNG seed + edge order per fix (bit-exact replay). Add property test "applying fixes 0..N from scratch matches the cached layout at step N." |
| H2 | Arch §3 | §4, §11 | Sub-second perf claim assumes region-size proportional, but `detectOverlaps(spliced)` is global, the post-condition assert is O(n²) on global face count, and obstacle-aware placement cost depends on pinned set complexity. 50-face budget is unsourced. | **Inline §4 + §11 revision** — replace "roughly proportional" with explicit cost model (region-local work vs. global checks). Make v3.5's first deliverable a cost-measurement of global checks. Name the corpus benchmark (specific piece in deer.obj). |
| H3 | Arch §4 | §7 | Fix scoring gameable — SCORE counts piece-level badge improvements but ignores assembly cost (piece count delta, tab count delta, page count delta, reorientation cost). Split-island fix that triples piece count scores +1 and ships. | **Inline §7 revision** — add cost-side terms to SCORE (Δpieces, Δtabs, Δpages) and surface them in the preview alongside badge deltas. |
| H4 | UX §1 | §3, §2 | v4.0 ship state solves no real persona's problem. No PDF, no edge numbering, no thumbnail, no badges. It's a developer milestone wearing user-release clothing. Priya needs PDF; Sarah needs the slider deferred to v5; Marcus needs fix or tab control. | **Strategic call + inline §3 rewrite** — either reshape v4.0 to deliver PDF export + edge numbering + thumbnail-on-net (pull from v4.2), or reframe v4.0 explicitly as internal-only and let v4.1 be the first user-facing version. |
| H5 | UX §2 | §2, §5, §8 | JTBD 4 (assembly recovery) silently downgraded. Three transcripts describe needing 3D-on-second-device during build; Mr. Chen invented thumbnail-on-net himself (proving it's insufficient). "Shareable URL state" deferred to v5 as "nice-to-have" — that's wrong; it's load-bearing. | **Inline §3 + §5 + §8 revision** — promote read-only "scan QR → 3D model on phone" companion to v4.2. State-shape already supports it. |
| H6 | UX §3 | §3, §7 | JTBD 5 (model-fit preview) hollowed out for Sarah by mesh-simplification deferral. v4.2 ships diagnostic ("287 pieces, 2mm smallest") with no action — exactly the "B as defensive retreat" pattern §1 rejects for the headline. Sarah's v4.2 = "pick a different model," which is what she does today. | **Inline §3 + §7 revision** — either acknowledge v4.2 unserves Sarah's segment until v5, or ship a non-destructive output-side simplification (merge near-equilateral co-planar triangles in the unfold, never touch source mesh) in v4.2. Second option is cheap and constructive. |
| H7 | Ship §1 | §3, opening | "Weeks not months" is undefended. v4.0 alone hides full React + r3f + Zustand + RTL + Playwright shell migration on top of 44-LOC `main.ts`. Realistic: 5–8 sessions for v4.0; total v3.5 + v4.0–v4.3 phases ~24–38 sessions. | **Inline §3 revision** — replace "weeks" with explicit session counts per release. Split v4.0 into v4.0a (shell parity, no UX change) and v4.0b (drop-mesh + export). Reframe the timeline honestly. |
| H8 | Ship §2 | §3 | v4.1 is three releases pretending to be one. Six items each non-trivial; three embed open algorithm/contract decisions (edge-toggle requires incremental pipeline; undo requires determinism contract; save/load requires IndexedDB schema). | **Inline §3 revision** — split v4.1. Bidirectional highlight + manual drag + save/load file-only → v4.1. Undo/redo + edge-toggle + auto-save IndexedDB → v4.2-pre (after v3.5 lands). Or pull edge-toggle and undo to v4.3 alongside region re-unfold. |
| H9 | Ship §3 | §11 | v3.5 "spike" is a multi-session re-architecture (~1500 LOC pipeline currently written under global one-shot contract; needs region-subgraph extraction, deterministic ordering under restriction, obstacle-aware placement primitive, splice operator). Budget as 4–6 sessions, not "a spike." | **Inline §11 revision** — rename "v3.5 spike" to "v3.5 phase" with at least 2 budgeted sessions. Make v3.5 a prerequisite for v4.1 (edge-toggle, undo) AND v4.3 (region re-unfold), not v4.3 alone. Add fallback: "if v3.5 returns infeasible, v4.3 ships manual region-pin + full-pipeline-re-run with loading spinner." |
| H10 | Ship §4 | §11, §13 | Real-user validation has no budget. Recruiting + 5–8 interviews + synthesis is its own multi-session effort. No decision rule for "we got the answers; now what?" — Q1 going against the spec doesn't have a stated consequence. | **Strategic call + inline §11 revision** — commit a separate spike NOW (before v4.0) that produces v4.2 prototype mockup + recruits + runs interviews. Or downgrade real-user validation from "blocks v4.3 design lock" to "informs v4.3 iteration after ship" — but commit one in writing. |
| H11 | Blind §2 | §10 P1, §13 Q6 | Spec contradicts itself on business model. P1 says "no account, free for core flow"; Q6 asks "how strong is no subscription?" Synthesis says users want pay-per-PDF or one-time license. Spec never reconciles. | **Strategic call** — either commit "unfolder is a free side project" explicitly (drop Q6 from §13), or commit "unfolder is a product; pricing surface designed by v4.3" (add pricing section, reconcile with no-account principle, identify what's gated). |
| H12 | Blind §3 | §8 | Commercial creators silently excluded (Etsy/DriveThruRPG sellers, Patreon designers, educational publishers). Highest-WTP segment, highest social-graph leverage; engineered out of research before the question was asked. v4 architecture calcifies a free-tool shape hard to retrofit for paying users. | **Strategic call** — either acknowledge in §8 with stated consequence ("v5+ or never; v4 architecture calcifies free-tool decisions"), or expand persona coverage in a future real-user round before v4.3 commits. |
| H13 | Blind §4 | implicit | No competitive-response model. Spec assumes Tama Software / PaperMaker stay still through v4 development. If Pepakura Web ships during the 12+ months of v4.0–v4.3, the headline differentiation is consumed. Implicit moat: MIT license + brand — thin. | **Inline new section** — add "moat" subsection naming durable advantages (open source community, model gallery, specific algorithm contributions) and kill-criterion ("competitor announced X → unfolder pivots to Y"). |
| H14 | Blind §5 | §7, §9 | Accessibility deferred. Color-only badges (red/yellow/green) fail ~8% of men. Sarah's "kids ages 7 and 10" and Mr. Chen's classroom segment make this near-certain in audience. Retrofitting accessibility into r3f + color-coded primary signals later is far more expensive than building in. | **Strategic call + inline addition** — commit at minimum (a) shape/icon redundancy on badges, (b) WCAG AA contrast on UI text, (c) v4.2 audit checkpoint before badge semantics calcify. |

### MEDIUM-tier (worth fixing inline)

| # | Critique | Spec § | Issue | Action category |
|---|---|---|---|---|
| M1 | Arch §5 | §7 | Inside/outside inference fallback for open-edge meshes assumes simply-connected exterior. Watertight-but-inverted meshes (Blender export glitch) silently classify inside as outside. | Inline §7 — add parity check (outward normals point away from mesh centroid for ≥50% of faces); walk all unclassified faces after first flood; make inside/outside visualization legible. |
| M2 | Arch §6 | §3, §4 | Persistence design choices in v4.0 will need rework when v4.1 lands save/load. meshHash canonicalization, IndexedDB schema, face-index stability across parser changes — all unsaid. | Inline §4 — either commit meshHash + schema + face-index stability as v4.0 contract, or mark regionSelector/pinnedRegions/appliedFixes as v4.0 in-memory-only. |
| M3 | UX §4 | §3, §6 | Bidirectional-highlight "felt magic" claim not in transcripts. No persona asks for or describes pain that bidirectional editor-view linking solves. Universal pain is assembly-time recovery, not editor-time linking. | Inline §6 — demote highlight from "felt magic" to "polish detail," re-anchor v4.1 ship state around persona-validated features. Or add Q9 to §13. |
| M4 | UX §5 | §6, §7 | Fix-suggestion flow imposes "pick from menu" path on users who articulate fixes in their own vocabulary. Marcus and Dan describe direct-manipulation fixes; spec demotes edge-click to keyboard shortcut. | Inline §6 + §7 — promote edge-click direct manipulation back to first-class. Badge entry stays for casual; edge-click stays for power-users. |
| M5 | UX §6 | §11, §13 | Open questions ledger doesn't translate into research plan. 8 questions all routed to one v4.2 prototype; some need a v4.0 prototype + parallel v4.3 prototype; some only testable post-v4.3. | Inline §11 + §13 — add table: per question, against-what-artifact, with-which-personas, blocking-which-release. |
| M6 | UX §7 | §8 | "Accept imperfection" end state serves Marcus but produces decision paralysis for Sarah and Priya — they can't distinguish "intentional craft acceptance" from "tool gave up." | Inline §8 — differentiate (a) "Accept and proceed" (intentional; badge dims to gray) from (b) "Tool can't fix automatically" (badge stays red; export warns). |
| M7 | Blind §6 | §4 | Project-library UX silent. IndexedDB-by-hash quota at maker volume (Dan's ~80 projects in 2 years) breaks the LRU model. No discovery, naming, cross-device, project-switcher described. | Inline §4 or new section — either commit project-library UX to a release, or document migration path explicitly. |
| M8 | Blind §7 | §6, §7 | Bidirectional highlight addresses spatial gap but not cognitive gap. Suggestions ranked by SCORE without explanation. Marcus's "can't articulate the rule" pain (P1) implies explaining IS the product. | Inline §7 — add "why this fix" one-line string per suggestion, sourced from triggering badge predicate. |
| M9 | Ship §5 | §9 | Error-handling surface area roughly half a release of UX work undercounted. 12 failure modes, ~0.5 session each. | Inline §9 — annotate each row with the release in which it lands. Audit per-release task lists to verify error work is line-itemized. |
| M10 | Ship §6 | §4, §9 | Mesh-by-hash IndexedDB design hand-waves user re-attach flow. Missing file, renamed file, switched browser, different filename, auto-save vs. save/load relationship — all undefined. | Inline §4 — either elevate persistence to dedicated decision section, or ship file-based save/load only in v4.1 and defer IndexedDB. Second is lower risk. |
| M11 | Ship §7 | §7, §8 | Mesh simplification deferral makes v4 partially unusable on high-poly meshes. Marcus's 287-piece dragon, Sarah's typical Thingiverse find — every piece red, "accept" the only path. | Inline §7 — non-destructive output-side simplification as preview in v4.2 (preflight: "this mesh has 12k faces; a 2k-face decimation would unfold cleanly — preview?") with explicit user consent. |
| M12 | Ship §8 | §9 | r3f + Safari 16 compatibility asserted not verified. Cross-browser regressions found at launch are credibility hit on "no install" promise. | Inline §9 — add v4.0 acceptance criterion: drop-mesh-to-export smoke passes on stated browser matrix in CI (Playwright). Demote Safari 16 to "best-effort" until verified. |

### LOW-tier

| # | Critique | Spec § | Issue | Action category |
|---|---|---|---|---|
| L1 | Arch §7 | §4 | `src/core/` boundary risk on fix-suggestion engine — naive impl will define `Suggestion` types carrying UI hints. | Inline §4 — name `FixProposal` (core: action kind + params + predicted layout + predicted badges) vs. human copy + drawer ordering (app). Code-review checkpoint. |
| L2 | UX §8 | §7 | Inside/outside override surface is power-user trap for casual users who hit "pick three exterior faces" prompt with no concept frame. | Inline §7 — add "skip — pick a sensible default" path; tool guesses (largest connected outer-normal-coherent region). |

## Strengths the critiques agreed on (preserve in revision)

All four critiques independently flagged:

- **`appliedFixes` as append-only undo log** — correct by construction, eliminates snapshot-undo bugs, aligns with `core/`'s pure-function discipline. (Modulo H1 determinism caveat.)
- **The B+C hybrid hypothesis itself** — `synthesis.md` recommendation of B-alone was re-examined rather than rubber-stamped; the hybrid framing serves both editor-attached experts (Marcus, Dan) and casual users (Sarah, Priya).
- **Sequencing decouples differentiation from time-to-first-use** — v4.0 → v4.3 staging is the right shape even if sizing is wrong.
- **"Accept imperfection" as an explicit end state** — honest product taste; respects how Marcus-tier users actually work.
- **v3.5 correctly identified as the algorithm bottleneck** and correctly scoped to v4.3-only (modulo H8/H9).
- **§13 open-questions ledger** — pre-commits the spec to invalidation conditions, makes the design-lock decision auditable. (Modulo H10/M5 budget concerns.)

## Strategic decisions needed before revision

These are director-level calls that affect what gets revised. Cannot be resolved by spec author alone.

1. **v4.0 reshape (H4 + B2):** is v4.0 a *user release* (then PDF export + edge numbering + thumbnail-on-net must move forward, and the mesh-acquisition wall (B2) is in scope) or an *internal milestone* (then v4.1 is the first user-facing release and v4.0 ships nothing user-visible)?

2. **Business model (H11):** is unfolder a free side project Evan funds indefinitely, or a sustainable product? If product, what's the pricing surface, and how does it reconcile with the no-account principle?

3. **Commercial creators (H12):** in v4's market or deferred to v5+? If deferred, the architecture decisions should bake in that they can be retrofitted (project library, sharing, account-or-no-account).

4. **Accessibility commitment (H14):** WCAG AA + shape redundancy on badges committed in v4, or deferred? Retrofitting after badge semantics calcify is far more expensive than building in.

## Recommendation

**Revise the spec in place** (not from scratch). The hypothesis survives all four critiques as a strength. The issues are addressable by tightening, not redesigning. Three steps:

**Step 1 — Director resolves the four strategic calls above.** This unblocks the revision pass. Each can be a one-sentence commitment in writing; no need to design the full pricing surface today, but committing "free side project" vs. "product with pricing surface by v4.3" is necessary.

**Step 2 — Spec author addresses all BLOCKER + HIGH + MEDIUM issues inline.** No issue requires rewriting the headline hypothesis. Several require rewriting individual sections (§3 sequencing, §4 state model, §7 fix engine, §11 prerequisites). The action-category column above is the work list.

**Step 3 — Commit revised spec; proceed to writing-plans for v4.0.** Skip a second critique round; the issues are mostly mechanical now. If a second round is wanted, run it against the v4.0 implementation plan, not against the spec.

**Estimate:** Step 1 — 1 short conversation. Step 2 — 1–2 hours of focused revision work. Step 3 — proceed to writing-plans skill.

## Alternative paths considered and rejected

- **Re-spec from scratch.** Tempting given the issue count, but the hypothesis and structure survive; rewriting throws away what works. Reject.
- **Pause for full second research round before any revision.** The synthetic round + this critique round is enough to commit a revised v4.0; real-user validation can run in parallel and block v4.3 design lock (per H10 fix). Pause is over-correction.
- **Ship v4.0 against the current spec and revise as we go.** v4.0's BLOCKER (region re-unfold pseudocode) doesn't gate v4.0 implementation, but H4 (v4.0 doesn't help users) does — without resolving it the implementer will build the wrong thing first. Reject.
