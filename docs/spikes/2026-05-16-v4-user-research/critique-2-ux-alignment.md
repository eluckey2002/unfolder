# Critique — UX and user-research alignment
Reviewer: independent (no spec authorship; no prior conversation context)
Date: 2026-05-17

## Severity scale
- BLOCKER: spec cannot ship as written; rework required before commit
- HIGH: real misalignment with research evidence
- MEDIUM: worth fixing inline; not gating
- LOW: nit / suggestion

## Issues

### 1. v4.0 ship state solves no real persona's problem — it's a developer milestone wearing UX clothing
**Severity:** HIGH
**Spec sections:** §3 (release sequencing), §2 (JTBDs)

**Problem.** v4.0 ships "drop mesh → unfold → SVG, no badges, no fixes, no inside/outside, no save/load." The spec's own §2 ranks JTBD 1 as "no-install build path" and frames v4.0 as "I can use it." But none of the five personas can productively use v4.0 as defined:
- Priya (§7) wants "drop the STL on a webpage, get a *PDF*, done." v4.0 exports SVG; her workflow ends at a printer dialog, not Inkscape. Priya §3: she bounced off Pepakura's UI in 40 minutes — she will bounce off "your unfold is an SVG, figure out the rest" in five.
- Sarah (§4, §7) needs the difficulty slider *and* tab numbers a 7-year-old can read. v4.0 ships neither. The auto-unfold without badges is exactly the Pepakura-trial output she already abandoned ("the model fell apart on screen into a hundred pieces… I just closed it" — Sarah §3).
- Marcus (§7, §8) needs re-unfolding or buildability scores; v4.0 has neither. He will use v3-via-CLI faster than v4.0-via-web.
- Dan (§7) needs tab control and group-aware packing; v4.0 has neither.
- Mr. Chen (§7) needs edge labels in legible font and US-Letter scale verification; v4.0 ships generic SVG.

**Why.** The spec implicitly assumes "running in browser" alone is enough value to constitute a release. The research evidence is the opposite: every persona is currently *capable* of finding pre-made PDFs or running Pepakura-in-VM; the wall is workflow fit, not platform. v4.0 ships principle P1 (browser-native) without principles P2, P3, P5, or P6 — which the synthesis itself says "apply to every release."

**Recommended action.** Either (a) move PDF export, edge numbering, and thumbnail-on-net forward from v4.2/v4.3 into v4.0 so Priya's flow actually completes, or (b) reframe v4.0 explicitly as an *internal* milestone (no user release) and let v4.1 be the first user-facing version. The current framing as "I can use it" overpromises against the evidence.

### 2. JTBD 4 (assembly recovery) is silently downgraded against unanimous evidence
**Severity:** HIGH
**Spec sections:** §2 (JTBD 4 listed), §5 (surfaces — no 3D-on-second-device support), §8 (thumbnail-on-net as "minimum viable companion")

**Problem.** The spec ships only "thumbnail-on-net" for assembly. But three transcripts describe a more specific pattern — *a second device with the 3D model open during build*:
- Marcus §6: "I keep the 3D view of the model open on a second monitor while I build."
- Dan §6: "I'll pull up the 3D view on my iPad next to the craft table."
- Priya §6: "once in a while I'll rotate the 3D model on the source page on my phone."
- Mr. Chen §6 invented thumbnail-on-net as his own field workaround; he is the *evidence* that thumbnail alone is *insufficient* — he'd already have it if it were enough.

The spec correctly notes thumbnail is minimum viable, but the persona evidence is that users have *already* invented thumbnail-on-net and *still* need the 3D-on-second-device pattern. The spec ships only what users already have.

**Why.** The architecture (§4 — Zustand store, project file with mesh hash + config) already supports a read-only "view this project's 3D model on phone" mode. Shipping a shareable read-only URL or print-the-QR-code-on-the-sheet flow is cheap and addresses unanimous pain. The spec defers "shareable URL state" to v5 as "nice-to-have" (§8) — that classification is wrong against the evidence; it's load-bearing for JTBD 4.

**Recommended action.** Promote a read-only "scan QR on net → 3D model loads on phone" companion to v4.2 (lands with thumbnails). Or, at minimum, list it explicitly in the §13 open-questions ledger as something to validate, rather than deferring it silently to v5.

### 3. JTBD 5 (model-fit preview) is hollowed out for Sarah by the simplify-slider deferral
**Severity:** HIGH
**Spec sections:** §7 (mesh simplification deferred to v5), §3 (v4.2 = preflight panel)

**Problem.** JTBD 5 is "credible preview of how hard the build will be so I know whether it fits my Saturday." Sarah's magic wand (§7) was *literally* a difficulty slider that fuses small triangles. The spec keeps JTBD 5 in v4.2 but defers the actual mechanism (mesh simplification) to v5. v4.2 ships the *diagnostic* (piece count, smallest piece, hygiene flags) but not the *action* Sarah needs.

The diagnostic-without-action surface is exactly the "B as defensive retreat" pattern the spec §1 explicitly rejects for the headline — yet ships it for Sarah's segment. v4.2's preflight tells Sarah "this is 287 pieces, smallest is 2mm" and offers her no recourse except "pick a different model" — which is what she already does today (Sarah §2: "Honestly? I pick a different model").

**Why.** The deferral reason in §7 is reasonable ("destructive on source mesh, trust risk, separate UX") but the consequence — Sarah gets no value from v4.2 — isn't acknowledged. The spec frames this as a clean release boundary; it's actually a persona-segment abandonment.

**Recommended action.** Either (a) acknowledge in §3 that v4.2 ships the casual-user JTBD diagnostically only, and Sarah's segment is unserved until v5, or (b) ship a *non-destructive* fit-preview that takes the simplification as an output-side filter (merge co-planar near-equilateral triangles in the unfold; never touch the source mesh). The second is cheap, non-destructive, and gives Sarah a partial slider in v4.2.

### 4. The bidirectional-highlight "felt magic" claim isn't grounded in the transcripts
**Severity:** MEDIUM
**Spec sections:** §6 (interaction model — "felt magic"), §3 (v4.1 ship state)

**Problem.** The spec calls bidirectional 3D↔2D highlight "felt magic" and headlines v4.1 around it. Reading all five transcripts: *no persona asks for this and no persona describes a current pain it solves*. Marcus §6 keeps a 3D view on a second monitor while *building*, not while editing. Dan §6 uses the iPad during build, not during layout. Priya, Sarah, Mr. Chen never mention wanting cross-view linking.

The pain that *is* universal in §6 of every transcript is "I lose my place coming back to a half-done build" — i.e., assembly-time recovery, not editor-time linking. Bidirectional highlight in the editor doesn't address that.

**Why.** The spec is calling a designer-side intuition "magic" without research backing. That's allowed in design work, but the spec frames it as "small to implement, large in perceived quality" — both claims are unverified. It's a hypothesis dressed as a conclusion, and it's load-bearing for v4.1's ship state.

**Recommended action.** Either (a) demote the highlight from "felt magic" to "polish detail" and re-anchor v4.1's ship state around something a persona did ask for (Dan's tab-flip, Marcus's piece-to-sheet drag, Priya's PDF export with numbered edges), or (b) add it explicitly to §13 as Q9 ("Does bidirectional highlight matter to real users, or is it designer-side?") and validate in the v4.2 prototype recruit.

### 5. Fix-suggestion flow imposes a "pick from menu" path on users who articulate fixes in their own vocabulary
**Severity:** MEDIUM
**Spec sections:** §7 (fix-suggestion engine), §6 (edge interactions demoted to keyboard shortcuts)

**Problem.** Marcus §4 articulates his Mandalorian fix with high specificity: "Pepakura wanted to make the whole front breastplate one big piece with a fold line running right down the sternum… I split it into a left half and a right half meeting at the sternum." That is *not* a "click a red badge, pick from suggestions" flow — that is direct manipulation: "this edge, cut here." Dan §4 same pattern: "split along the back, not the front."

The spec's primary fix flow is: click badge → see ranked suggestions → click Apply. The direct-manipulation path (click an edge, hit `C` to cut) is *demoted* to a power-user keyboard shortcut (§6). Marcus and Dan — the two personas whose problem the fix loop most directly serves — will navigate to the shortcut and never use the suggestion drawer.

That's not fatal — the surface still works for them — but the spec's claim that suggestions are the "default path" and direct manipulation is the "override" inverts the actual user behavior the transcripts predict. The risk is that fix-suggestion ranking is tuned for a usage pattern that the heavy users skip, while the casual users (Priya, Sarah) who *would* use the suggestions don't have the context to evaluate them.

**Why.** The synthesis flagged this in Q7 ("does region re-unfold actually save Marcus time, or is the cognitive overhead of choosing among suggestions higher?") and the spec carries Q7 forward, but doesn't translate it into a design hedge. If Q7 is real, the suggestion-drawer-first flow is wrong for the heaviest users.

**Recommended action.** Promote edge-click direct manipulation back to first-class (alongside, not below, the suggestion drawer). The badge can still be the entry point for Priya/Sarah ("click red badge to see what's wrong"); the edge-click stays available for Marcus/Dan without modal switching. Specifically: the badge-click opens the drawer *and* selects the affected edges in both views; the user can dismiss the drawer and act directly.

### 6. The §13 open-questions ledger doesn't translate into a research plan
**Severity:** MEDIUM
**Spec sections:** §13 (open questions for real-user validation), §11 (prerequisites)

**Problem.** §11 says "real-user validation of synthesis §13 open questions" is a prerequisite for v4.3 design lock, and names the approach as "clickable v4.2 prototype as the recruit-bait; 5–8 real-recruit interviews against it." That's a sketch, not a plan. Specifically missing:
- Which questions get answered against the v4.2 prototype, and which can only be answered against v4.3 (or earlier)?
- Q1 ("is 'skip the editor' real?") — a v4.2 prototype that has badges but no fix loop is *exactly the wrong artifact* to test Q1 against; the user has nothing to skip *to*. Q1 needs a v4.0 prototype + a parallel v4.3 prototype.
- Q3 (inside/outside legibility) — testable against v4.2 if the inference + override surface is in v4.2.
- Q7 (does region re-unfold save Marcus time?) — only testable against v4.3 since region re-unfold lands there.

**Why.** The spec lists 8 questions and routes them all to one prototype. They can't all be answered against one artifact, and some have to be answered *before* the artifact ships (Q1 affects whether v4.3 should ship at all).

**Recommended action.** Add a research plan table in §11 or §13: per question, against-what-artifact, with-which-personas, blocking-which-release. The personas.md + topic-guide.md reuse is correct; the question-to-artifact mapping is what's missing.

### 7. The "accept imperfection" end state serves Marcus but produces decision paralysis for Sarah and Priya
**Severity:** MEDIUM
**Spec sections:** §8 (Marcus's pattern — proceed with red badge), §7 (no-fix-scores-above-zero failure mode)

**Problem.** §8 lifts Marcus's "print despite known imperfections, fix in foam" workflow into the universal end state: badge stays red, export still works. For Marcus this is correct (Marcus §4: "I just use them to hold the rough shape together with painter's tape long enough to confirm the fit"). For Sarah and Priya it's the opposite of what they need.

Sarah §4: "either I printed it wrong, or the model was wrong, and I genuinely could not tell." She's already in a state where she can't tell signal from error. Giving her an export button next to a red badge that says "no automatic fix improves this piece — manual edit / accept" (§9) makes the situation strictly worse — she doesn't know whether "accept" means "this is fine actually" or "this will fail and that's your problem."

Priya §4 same pattern: she got Pepakura's overlapping output, "didn't know which fix is 'right,'" and split with scissors after printing. A red-badge-but-still-exports flow is exactly her current pain restated in a different UI.

**Why.** The spec correctly notes Pepakura's implicit "ship anyway" as bad UX (§8: "Pepakura does this implicitly; we do it explicitly") but the explicit framing doesn't actually distinguish "this is intentional craft acceptance" from "the tool gave up." Marcus knows the difference because he has six years of context; Sarah and Priya don't.

**Recommended action.** Differentiate two end states in the UI: (a) "Accept and proceed" — user has read the badge reason and chooses to ship; logged as an intentional acceptance, badge dims to gray. (b) "Tool can't fix this automatically" — badge stays red, export warns. The current spec collapses these; the personas need them separated.

### 8. Inside/outside override surface is a power-user trap as currently scoped
**Severity:** LOW
**Spec sections:** §7 (inside/outside inference + manual override), synthesis Q3

**Problem.** The spec asserts the tool infers inside/outside, then exposes a manual override ("user can always click a face in 3D and toggle interior/exterior"). Synthesis Q3 flagged whether inside/outside is legible to non-experts as open. Dan §7 articulates it cleanly because he's a Blender user; Sarah and Priya never mention the concept.

The override surface as scoped is invisible-until-needed (good) but undiscoverable when it *is* needed (bad for the open-edge mesh case — "pick three exterior faces" prompt). For Sarah's "papercraft fox from Thingiverse" workflow, an open-edge mesh hits this prompt and Sarah has no concept frame to answer it.

**Why.** The spec defers Q3's resolution but ships a UI that depends on Q3 being resolved favorably. The fallback for "user can't answer the prompt" isn't designed.

**Recommended action.** Add a "skip — pick a sensible default" path on the open-edge-mesh prompt. Tool guesses (largest connected outer-normal-coherent region) and lets the user proceed; the override only appears for users who notice the tabs are wrong. Aligns with the spec's own P-defaults principle (§2: "defaults must be excellent").

## Strengths

1. **The hybrid framing is genuinely well-grounded.** §1's reasoning for hybrid-over-B-alone — "B as recommended is defensive, hypothesis is excellent unfold of the model they wanted" — directly serves Marcus and Dan's stated preferences (every-rebuild re-unfolding) while still giving Sarah and Priya the badge as an entry point. This is a synthesis the research supports.

2. **The buildability badge predicates are correctly grounded.** §7's specific signals (tab on visible face, piece exceeds page, smallest edge < craftable, acute interior angles) map directly to specific transcript moments: Marcus §4 (visible tab), Mr. Chen §4 (lopsided pentagons compound at seams), Sarah §4 ("tab way too short"), Dan §4 (cone seam on front face). These are not invented signals.

3. **The §10 cross-cutting design principles are correctly carried forward without dilution.** P1 (browser-native, no account), P3 (unfold as draft, not deliverable), P5 (group preservation) all map to evidence and are stated as constraints on every release.

4. **Honest acknowledgment of incremental-pipeline risk.** §11 names the v3.5 spike as a hard prerequisite for v4.3 and explicitly decouples v4.0–v4.2 from it. That's correct sequencing — the algorithm risk is contained.

## Open questions for the spec author

1. **What does a "user" of v4.0 actually do with the SVG?** If they import it into Inkscape, add tabs, number edges, and export PDF, then v4.0's value is "browser-based v3 with no user-facing feature parity with finished tools." Is that the intended pre-product release for collecting telemetry, or is it expected to support real builds? The answer changes whether v4.0 needs PDF export and edge numbering.

2. **Is the v4.2 prototype meant to validate Q1 (skip-the-editor) or only Q3/Q7?** If Q1, it needs a parallel "v4.0-flow user gets PDF with no editor exposure" prototype to compare against. Without that comparison, Q1 isn't testable.

3. **For the casual segment (Sarah, Priya), what's the v4.0 → v4.3 path that doesn't ask them to wait 6+ months for usable value?** Either the release sequencing changes, or the spec needs to name them as "served in v4.3, not before" — both are valid; silent deferral is not.
