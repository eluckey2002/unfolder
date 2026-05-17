# Critique — Blind spots and devil's advocate
Reviewer: independent (no spec authorship; no prior conversation context)
Date: 2026-05-17

## Severity scale
- BLOCKER: a missing consideration that changes the spec's premise
- HIGH: significant gap; should be addressed in this round
- MEDIUM: worth surfacing inline; not necessarily gating
- LOW: nit / future consideration

## Issues

### 1. BLOCKER — The mesh-acquisition problem is invisible to the spec, yet it is the actual top-of-funnel for three of five personas

The spec begins where every persona except Sarah and Priya already are: the user *has* an STL/OBJ. But the research is explicit that this is not the user's starting state. Sarah's bottleneck is "*finding* kid-appropriate ones at the right difficulty" (personas P4); Priya "searches 'papercraft fox PDF free' on Google" and only descends into STLs when no PDF exists (P2); Mr. Chen "uses pre-made nets… curriculum vendor doesn't have them" (P5); even Marcus downloads `.pdo` files first (P1). Synthesis JTBD 5 names this directly: model-fit preview "when I'm *choosing or designing* a model." The spec acknowledges this only as a defer-to-preflight on a mesh you already loaded (§5), which is downstream of the actual bounce point.

Concretely missing from §3, §5, §8:
- No discussion of a model-browser surface (Thingiverse / Sketchfab / Printables / Smithsonian Open Access). Even a read-only "import from URL" or a curated starter gallery would intercept the "I quit before I had a file" failure mode that synthesis Theme 1 / Theme 7 imply but never names.
- No mention of `.pdo` import — which the competitive scan (Tool 1) names as "the de-facto papercraft distribution format on the cosplay scene." PaperMaker imports PDO. That's the import surface that connects unfolder to the existing template economy where Marcus and Dan actually live.
- The "primary user is the maker / hobbyist builder" lock (§2) is consistent with this gap but does not justify it: the maker's first job *includes* finding a model, not unfolding one they magically possess.

Why BLOCKER, not HIGH: the spec's JTBD ranking is structurally wrong if half the personas bounce before the loaded-mesh entry point. Either v4's funnel starts earlier (mesh acquisition is a v4 surface) or the spec must explicitly concede that v4 only serves users who already cleared the mesh-acquisition wall — which is a far smaller audience than the synthesis claims.

### 2. HIGH — There is no business model, and the spec contradicts itself on whether one is needed

§10 P1 says "browser-native, no install, no account for the core flow." §13 Q6 opens "Pricing — how strong is 'no subscription'?" These are not the same surface: the principle assumes a free product; the open question assumes there is something to price. The spec never reconciles them.

The synthesis is explicit that users want pay-per-PDF (Priya §8) or one-time license (Mr. Chen §8), and would "pay real money" for the Mac/browser flow (Marcus §8). Yet the spec never describes:
- Whether unfolder is a side project Evan funds indefinitely, or a product with a sustainability model.
- Where the line is between "free core" and "paid X." `.unfolder.json` save? PDF export with tiling? Texture export? Region re-unfold (the headline differentiation)?
- Where Stripe / pay-per-export *physically lives* without violating the "no account" principle. Anonymous Stripe checkout per PDF is feasible (no account, just a card) but is not mentioned. If it can't be done anonymously, the principle and the pricing question are in direct conflict.
- Hosting and bandwidth cost trajectory for a static deploy that absorbs Sketchfab-sized mesh uploads in the browser. Static is cheap; WASM-bundle CDN egress at scale is not free.

Without this, the v4 plan is implicitly "free, forever, side project" — which is a real choice but should be stated. If it's that, defer Q6 from §13 (it can't be answered if we won't act on it); if it's a real product, the spec needs a pricing-surface section before v4.3 design lock, because pricing affects what gets gated and therefore what the UI shows.

### 3. HIGH — Commercial creators are excluded silently, narrowing the market to people who explicitly don't want to pay

Personas covered: Marcus (hobbyist cosplayer), Priya (hobbyist enthusiast), Dan (hobbyist terrain — buys $5–15 PDF packs from DriveThruRPG), Sarah (parent), Mr. Chen (teacher, institutional, will not subscribe). Persona P3 (Dan) is the closest the research gets to a commercial customer — and he is a *buyer* of papercraft, not a *seller*. The five-persona set entirely excludes:
- The creators selling papercraft kits on Etsy / DriveThruRPG (Dan's vendors).
- Designers monetizing original models on Patreon.
- Educational publishers selling pre-unfolded sets (Mr. Chen's "curriculum vendor").

Personas.md §125 names this gap as "professional commercial papercraft designers (different problem)." But the spec internalizes that decision without re-examining it: §8 quietly defers "Generative-art / batch API entry — Evan's posture: maker primary." There is no equivalent line for commercial creators; they are simply absent.

This is the segment with the highest willingness-to-pay (their tools are tax-deductible business expense) and the highest social-graph leverage (they publish models that bring Marcus, Dan, Sarah, and Mr. Chen *to* the platform). If unfolder is going to be free for everyone, fine — say so. If sustainability matters (issue 2), this is the segment that funds it and they have been engineered out of the research before the question was asked.

The defensible answer is "v5+ or never," but it should be a stated answer, with the consequence noted: the v4 design choices (no account, no project library, no batch export) calcify a free-tool architecture that will be hard to retrofit for paying users.

### 4. HIGH — No competitive-response model; the spec assumes incumbents stay still

§4 of competitive-scan lists PaperMaker as "still in early development… near-zero public review volume." The spec treats this as a permanent state. Two scenarios the spec does not even gesture at:

- **Tama Software ships a Pepakura web port during v4 development.** Pepakura Designer 6.1.0 was released 2025-07-12; the cadence is alive, not legacy. Tama already owns the brand, the format (`.pdo`), and the template ecosystem. A "Pepakura Web" announcement at any point during v4.0–v4.3 (12+ months of development implied by the four-release cadence) would consume unfolder's headline differentiation.
- **PaperMaker takes investment and ships fast.** It already has PDO import, public gallery, freemium pricing — three structural advantages unfolder does not currently plan. Its current weakness is review volume, not feature surface; a small marketing push closes that.

The spec's defensible-moat claim is implicit: feedback-driven iterative unfolding (the B+C hybrid) is "unattested" in the competitive scan (synthesis §4 opp 2). But "unattested today" is not "hard to replicate." The hybrid is a UX framing on top of standard pipeline algorithms. If a competitor ships it three months after v4.3, what unfolder retains is open source (per LICENSE: MIT) and… the brand. That's a thin moat for a maker tool.

What the spec should add: an explicit "moat" subsection that names the durable advantages (open source community? data-network from a model gallery? a specific algorithm patent-free contribution like region re-unfold under 1s?) and a kill-criterion for "competitor announced X, unfolder pivots to Y." Right now competitive dynamics don't appear anywhere in the spec.

### 5. HIGH — Accessibility is deferred to "out of scope" but the headline UX *centers on color-coded badges*

§9's failure-handling matrix is comprehensive about technical failures but says nothing about user-side failures. The spec lists "no accessibility audit" as out-of-scope (implicitly — §8's defer list does not include it, but the spec also does not name it as in-scope).

The §7 badge system is **red / yellow / green**. Roughly 8% of men and 0.5% of women have red-green color blindness (deuteranomaly / protanomaly). For Sarah's persona — "kids ages 7 and 10" — and Mr. Chen's classroom segment ("140 nets… 5 sections of 28 kids each"), this is not edge-case statistics; it's a near-certainty that affected users are in the audience.

Specific gaps:
- Badges must carry a non-color signal (icon, shape, position) — the spec specifies color only.
- The bidirectional-highlight "felt magic" move (§6) — does the highlight color contrast in dark mode, in light mode, for low-vision users?
- Keyboard navigation: the §6 keyboard shortcuts (`C`, `T`, `P`) are described, but tab order through the four surfaces (§5) is not. r3f canvases are notoriously screen-reader-hostile by default.
- Text size in the 2D pane: synthesis Theme 6 (Sarah §4: tab labels with tiny font are unreadable for her 7-year-old) is an accessibility issue framed as a hobbyist convenience.

Calling this "deferred" reads as triage; in practice, retrofitting accessibility into a r3f + zustand state model with color-coded primary signals is far more expensive than building it in. At minimum the spec should commit to (a) shape/icon redundancy on badges, (b) WCAG AA contrast on all UI text, (c) a v4.2 audit checkpoint before badge semantics calcify into user expectations.

### 6. MEDIUM — Scale and project-library UX is silent; IndexedDB-by-hash is a footgun at N=50 projects

§4 specifies "Auto-save to IndexedDB on every state change, debounced ~500ms" and "mesh bytes… stash meshes in IndexedDB keyed by content hash." §9 includes "IndexedDB quota… LRU." The spec describes the experience for one user with one mesh. It is silent on:

- **Discovery.** How does a returning user find their old projects? The §5 topbar shows "Mandalorian.obj · ●saved" — singular. There is no "open recent," no project switcher, no library view.
- **Naming.** Project file is `meshHash, meshFilename, …` — meshFilename is the user's filename. If Priya drops three different foxes named `fox.stl` from three different Thingiverse downloads, what does her project list look like?
- **Cross-device.** The "no account" principle means each browser is an island. Mr. Chen's classroom case ("140 nets") presupposes a workflow that survives across the 5 device-section permutations he'll use. IndexedDB is per-origin per-browser per-device.
- **Quota at maker volume.** Marcus builds "2-3 full costumes a year, plus props." Dan does "a 40-building castle complex." Sarah is 6/year. Mr. Chen is roughly 5/year of *templates*, 140 of *prints*. After two years, Dan has ~80 projects, each carrying a mesh blob; the LRU will evict the kept-for-reference projects he goes back to. The spec mentions LRU as an error case (quota event) but does not address the steady-state UX of a user with many projects.

This is MEDIUM not HIGH because none of these block v4.0; but the data model (§4) is locked at v4.0, and adding project-library UX in v4.1 requires a different state shape than "one currentLayout." Either commit to it now or document the v5 migration path.

### 7. MEDIUM — The bidirectional-highlight move addresses the 3D↔2D *spatial* gap, but not the *causal* / cognitive gap

§6: "Hovering or selecting in 3D highlights the corresponding piece in 2D, and vice versa. … reinforces inside/outside invisibly." This is correct as far as it goes. But the cognitive gap surfaced in the research is deeper than spatial correspondence:

- Sarah (P4) doesn't ask "which piece corresponds to which face" — she asks "which model is appropriate for a 7-year-old to build" (mesh-level mental model).
- Priya (P2) doesn't know "which fix is right" when pieces overlap (synthesis Theme 2 evidence). Highlighting the overlap in 3D doesn't teach her *why* it overlapped or *why* one fix is better than another.
- Marcus (P1) has 6 years of intuition he "cannot articulate the rule to friends he's trying to mentor" (personas P1). Highlight shows where; it doesn't show why.

The fix-suggestion drawer (§5, §7) is the spec's nominal answer — ranked suggestions with predicted outcomes. But the spec describes ranking by SCORE (badge-improvements minus regressions); it does not describe explanation. A user who clicks "split island" with score +2 sees a preview of the result; they don't see *why* this fix improves things or *what they'd learn for next time*. The synthesis Theme 2 finding — "the *editing of the unfold is the product*" — implies that explaining is part of the product, not a documentation afterthought.

Specific addition the spec should consider: a one-line "why this fix" string per generated suggestion, sourced from which badge predicate(s) the fix addresses. Cheap to implement, large in trust-surface impact, and partially addresses the §13 Q3 (inside/outside legibility) concern by making the inference visible.

### 8. MEDIUM — The kill-criterion for the differentiation hypothesis is absent

§13 lists 8 open questions for real-user validation. §1 says "v4 ships feedback-driven iterative unfolding… locked." §13 Q1: "Is 'I'd skip the unfolding step entirely if I could' real? … real users may have craft attachment the synthetics traded away too cleanly." Q7: "Does region re-unfold actually save Marcus's time, or is the cognitive overhead higher than the time it saves?"

The spec does not say what happens if real-user validation kills these. Specifically:
- If 4/8 testers say "I'd skip the editor entirely if I could," does that kill the hybrid (which makes the editor the headline)? Or does it just kill one fix family? Or does it confirm Hypothesis B-alone was right and the director's hybrid-pivot was a bias?
- If region re-unfold (§7) takes >1s on the corpus baseline (§4, §11) despite the v3.5 spike, does v4.3 still ship? With what fallback?
- If inside/outside inference fails on >30% of real user meshes (the spec says terrain ruins fail at §7), does the badge "tab on visible face" silently degrade to noise? Is the fallback documented?

The "validation blocks v4.3 design lock (not v4.0–v4.2 ship)" line (§11) is a schedule statement, not a kill-criterion. A defensible version would name: for each open question, a quantified outcome that would force a re-spec, a partial-ship, or a deferral. Otherwise §13 functions as a research-theater list — questions asked but not load-bearing.

---

## What this critique deliberately did NOT cover

The architecture/state-model risks (zustand + immer choice, `appliedFixes` traversal correctness, region re-unfold algorithm soundness) belong to the architecture lens. The four-surface layout, drawer-vs-modal interaction model, and modeless-state choice belong to the UX-alignment lens. The v3.5 spike dependency, v4.0→v4.3 sequencing risk, and CI/test burden of adding Playwright belong to the shipping-risk lens. I have touched accessibility (issue 5) because color-only signaling is a premise-level decision, not a UX polish item.

## Strengths

1. **Sequencing decouples differentiation from time-to-first-use.** §3's v4.0→v4.3 cadence ensures unfolder is "usable" before it is "differentiated." This is genuinely smart and resists the trap of "ship the moonshot or nothing."
2. **`appliedFixes` as an append-only undo log is correct by construction.** §4's "everything visible is derived from (mesh + config + pinned + appliedFixes[:N])" closes a class of bugs that snapshot-based undo systems re-litigate forever. Aligns nicely with the existing pure-function `core/` discipline.
3. **The "accept imperfection" exit (§8) is honest.** Naming it explicitly — Marcus prints despite known imperfections; the badge stays red but does not block — is the kind of detail that prevents a tool from accidentally moralizing at the user. Pepakura does this implicitly; unfolder doing it explicitly is a small but real trust move.
4. **The synthesis's recommendation (B alone) was re-examined rather than rubber-stamped.** §1's reframing of B as "defensive" and the move to a B+C hybrid shows the spec author engaged with the research rather than treating it as oracle. Q7 being elevated as load-bearing (§13) follows that engagement honestly.
