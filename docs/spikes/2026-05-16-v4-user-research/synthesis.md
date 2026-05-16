# Synthesis — v4 user research (synthetic round)

Date: 2026-05-16
Inputs: competitive-scan.md; five synthetic interview transcripts (Marcus / Priya / Dan / Sarah / Mr. Chen).
Output: cross-cutting pain themes, JTBD, opportunity space, three differentiation hypotheses (with one recommendation), cross-cutting design principles, open questions for real-user validation.

## 1. Method note

These transcripts are **synthetic** — model-authored interviews against fictional personas, not field recordings of real users. They are useful as a stress-test surface: a way to externalise hypotheses, surface internal contradictions in the product direction, and rank candidate UX moves against a structured pain map. They are not evidence of frequency in the real population, and they cannot reveal pain users feel but never articulate.

What this synthesis is therefore justified in producing:

- A ranked pain map and JTBD list to **prioritise hypothesis testing**.
- A defensible candidate v4 headline, **provisional** on real-user confirmation.
- A list of questions where the synthetic round is silent or "too clean" and which must be closed before any v4 design lock-in.

What it is **not** justified in producing: a final feature set, a UI lock, or a claim that any given pain is the dominant pain in the field. Several transcripts converge a little too cleanly on "the unfolding step is pure tax, ship me a PDF" — a real population would include people who enjoy the editing craft, people whose mesh sources are subtly different, and people whose friction sits in places no one in this set articulated. The competitive scan grounds some of this in third-party forum evidence, which moderates the synthetic-cleanness risk for the themes that overlap. Everything claimed below is traceable to a transcript line, a scan citation, or both.

## 2. Cross-cutting pain themes

### Theme 1 — Platform exclusion is the first wall

**Headline:** The dominant tool runs only on Windows; the cross-platform alternative requires learning Blender. For most non-cosplay-veteran users the install path is the first quit point.

**Evidence:**
- Marcus runs Pepakura in a Parallels VM on a Mac and "die[s] a little" every switch (Marcus §2, §8); explicitly: "If a Mac-native or browser tool existed I would pay real money for it."
- Priya tried Pepakura Viewer, then the paid trial, then Blender — never reached an export. Bounced on the Blender installer before launch (Priya §3).
- Mr. Chen's school issues Chromebooks; Pepakura cannot run there at all (Chen §3, §8).
- Competitive scan: "platform restriction alone drives a long tail of 'Mac/Linux alternative' threads"; PaperMaker exists as a browser entrant but is "still in early development" with near-zero independent review volume (scan TL;DR; Tool 4).

**Frequency × severity:** High × High. Four of five personas hit this wall; the fifth (Dan) absorbed it by buying a license. The scan corroborates with multiple forum threads.

**What would address this:** Browser-native authoring at parity with the desktop incumbents on the core flow (open mesh → unfold → edit → printable). No install, no platform check, no account required for first export.

### Theme 2 — The auto-unfold is never the answer; the edit *is* the product

**Headline:** Every experienced user re-unfolds. Every casual user gets stuck because they cannot edit. The tools treat the auto-unfold as the deliverable; users treat it as a starting draft.

**Evidence:**
- Marcus: "I never trust the original creator's unfold. Ever. … The *editing* of the unfold is the product." (Marcus §2, §8.) Three hours of re-unfolding a Master Chief helmet.
- Dan: "Half my time in Pepakura is *after* the auto-unfold" — flipping tabs, repacking, moving pieces between sheets (Dan §5).
- Priya's only successful Pepakura export had two pieces overlapping on the page; she had no way to choose the "right" cut and split a face with scissors after printing (Priya §4).
- Competitive scan: "Auto-unfold is universally a starting point, never an end state. … PolyZamboni's pitch explicitly leads with 'you no longer need… good faith in some automatic unfolding algorithm.'" (Scan TL;DR.)

**Frequency × severity:** High × High. Universal across experienced users; for casual users the inability to edit *is* what makes the tool unusable.

**What would address this:** Treat unfolding as an iterative editing surface, not a one-shot export. Cheap re-unfold of individual islands under different constraints, preserving edits elsewhere. The scan notes this "partial-re-unfold workflow is unattested" in any surveyed tool.

### Theme 3 — Tabs and seams in the wrong place

**Headline:** Tab placement (which side of an edge, visible vs hidden, on or off the printable) is the single most-cited post-unfold pain across all evidence sources.

**Evidence:**
- Marcus: "Pepakura puts tabs wherever it wants, and probably one third of the time the tab ends up on what'll be a *visible* edge of the finished piece." (Marcus §4.)
- Dan flipped 15–20 tabs per Tudor building, manually, every time; tried writing a Blender script to auto-place tabs on the interior and gave up after six hours (Dan §2, §4). "If I could mark faces as 'visible exterior' once… and have that *follow the mesh* — that would change my life."
- Dan's watchtower cone seam landed on the front face because the tool split it without regard for visibility (Dan §4).
- Mr. Chen: an icosahedron net with tabs on the wrong side ruined a class section's worth of prints (Chen §4).
- Competitive scan: tab overlap is the #1 recurring complaint across Pepakura forums and the Export Paper Model issue tracker (scan TL;DR, Tool 1, Tool 3); the Export Paper Model docs concede tab-overlap "does not work reliably yet."

**Frequency × severity:** High × High. Hits expert and beginner alike; ruins finished builds rather than just slowing the workflow.

**What would address this:** Inside/outside awareness as a first-class concept the user can declare (or the tool infers from the mesh and lets the user correct). Tab placement, seam choice, and texture-register all derive from it.

### Theme 4 — No buildability feedback before commitment

**Headline:** Users learn whether an unfold is buildable only after printing, cutting, and gluing. There is no preview that surfaces "this piece will give you trouble" while it is still cheap to fix.

**Evidence:**
- Marcus's magic-wand answer: "A buildability score per piece. Color-coded, red-yellow-green, with a one-line reason." He has six years of intuition he cannot teach (Marcus §7).
- Mr. Chen's truncated icosahedron failure was invisible at the PDF stage: pentagons looked fine on screen, came out almost-regular, lopsided once assembled. "There's no preview that shows me whether I'm about to waste an afternoon." (Chen §2, §4.)
- Sarah's fox tab "was way too short for the edge it was supposed to glue to" — could not tell if it was her print or the model (Sarah §4).
- Priya printed Pepakura's overlapping-pieces output and guessed at the fix (Priya §4).
- Competitive scan: mesh-quality problems "leak into the user" as UX failure modes; no tool pre-flights the mesh in a way users find legible. PolyZamboni's red/orange/green overlay is "the closest, but it appears *after* the user has tried to unfold."

**Frequency × severity:** High × High. The cost of each failure is hours of work plus material; the synthetic personas converge on this even though their builds differ wildly.

**What would address this:** A pre-print preflight surface — mesh issues, per-piece risk flags, scale/sheet check, visible-tab warnings — all visible *before* printing.

### Theme 5 — Layout, packing, and grouping fight the user

**Headline:** Auto-layout optimises for whitespace efficiency the user did not ask for, breaks the user's batching system, and wastes real money in cardstock and toner.

**Evidence:**
- Dan spends an evening repacking each building's sheets; sometimes Pepakura mixes pieces from two different buildings on the same sheet, "*terrible* for me because my whole batching system depends on cutting all of one building at once." (Dan §2, §4.)
- Marcus drags interior helmet padding pieces onto a separate sheet from exterior pieces, every project (Marcus §5).
- Priya's one Pepakura export "wasn't grouped by, like, body part. So all the head pieces were scattered across three sheets. That made assembly harder." (Priya §4.)
- Mr. Chen had a net tile across two pages because the bounding box was a centimetre too wide for US Letter — twenty-eight wasted sheets (Chen §4).
- Competitive scan: "Pepakura users uniformly trip over the silent fit-to-A4, and the tool refuses single-axis scaling outright"; no tool exposes a "this will print at X cm tall on Y sheets" preview.

**Frequency × severity:** Med-High × Med. Real money for Dan (cents per sheet × thousands of sheets); workflow-breaking for Marcus and Priya; print-wasting for Mr. Chen. Not life-threatening but cumulatively the second-most-cited post-unfold pain after tabs.

**What would address this:** Group-aware packing — user (or tool) declares logical groups (per-building, exterior vs interior, per-body-part), packing respects them. Honest sheet/cost preview before print.

### Theme 6 — Assembly orientation breaks down at session boundaries

**Headline:** Edge IDs work for the current sitting; everyone loses their place when they put a build down for a day or a week. Recovery currently relies on a 3D view on a second device.

**Evidence:**
- Marcus keeps the 3D view on a second monitor while building (Marcus §6); loses his place coming back from a week away.
- Dan uses the iPad with the 3D model next to the craft table; the keep had ~80 pieces and a two-week pause meant he'd forgotten which wall was which (Dan §6).
- Priya keeps her laptop open with the reference image or a YouTube timelapse (Priya §6).
- Sarah holds the half-built thing up and "turns it around" until she finds the next tab (Sarah §6); falls back to the Pinterest pin photo.
- Mr. Chen prints a thumbnail of the assembled solid on the net itself — his own field workaround (Chen §6).
- Competitive scan: "Pepakura's 'Guided Assembly' animation is the high-water mark and is widely reported as awkward." No tool offers turn-by-turn assembly steps grouped into a build plan.

**Frequency × severity:** Med × Med. Universal; recovers without permanent damage; but a measurable source of friction and time loss across every persona.

**What would address this:** Lightweight assembly companion — at minimum a thumbnail-on-the-printable plus a "where am I" view that pairs a piece in hand with its location on the 3D model. Not necessarily an animated guide.

### Theme 7 — Cost / licensing friction

**Headline:** The pricing models in the market do not match how casual and institutional users buy software.

**Evidence:**
- Priya: "Paying $50 or whatever Pepakura is, for software I'd use four times a year, doesn't compute. I'd rather pay per PDF." (Priya §8.)
- Mr. Chen: "Subscription software is essentially impossible for me. A one-time license, free, or pay-per-PDF I can expense — those work. A monthly subscription does not." Plus district privacy review on cloud/account products (Chen §8).
- Marcus would "pay real money" for a Mac-native or browser tool — Pepakura's $38 is fine, but the Windows-VM tax is the real cost (Marcus §8).
- Competitive scan: free-tier save lockout is "the dominant complaint in beginner threads — the work isn't gated, the persistence is" (scan TL;DR).

**Frequency × severity:** Med × Med. Not the loudest pain in any one transcript, but the modal answer when asked "would you pay?" is "not a subscription, and not for something I use four times a year." Will determine reach more than feature depth.

**What would address this:** Free for the core flow (open → unfold → export). No account required for first export. If monetisation is needed, surface it as one-time / per-export, not subscription.

## 3. Jobs-to-be-Done

**JTBD 1 (primary).** *When I have a 3D model I want to make in paper, I want to turn it into a printable, buildable PDF without leaving my browser or installing anything, so I can spend my time on the part I enjoy — the cutting, folding, painting, or teaching.* Grounded in: Marcus §7 ("runs in a browser. On the Mac. Without a VM. That alone would change my life"); Priya §7 ("Drop the STL on a webpage, get a PDF, done"); Sarah §7 (no install, no twenty-five-minute Pepakura confusion); Mr. Chen §7–§8 (Chromebook, no subscription, no account).

**JTBD 2.** *When the auto-unfold puts a seam, tab, or piece where I don't want it, I want to fix only that area without re-unfolding the whole model, so I don't lose two hours of decisions I already made.* Grounded in: Marcus §2, §5 (re-unfolds for hours, saves aggressively to versioned files because undo is unreliable); Dan §5 (saves every ten minutes; "Ctrl-S is a reflex"); also Priya §4 (faced overlapping pieces, no concept of "fix this region only"). Reinforced by competitive scan ("partial-re-unfold workflow is unattested").

**JTBD 3.** *When I'm about to commit cardstock and an afternoon, I want to see what's going to go wrong — too-tiny pieces, tabs on visible faces, seams on the front, scale off — so I can fix it on screen instead of mid-build.* Grounded in: Marcus §7 (per-piece buildability score); Mr. Chen §4 (asymmetric pentagons only visible after building one); Dan §4 (cone seam on the visible face, caught after printing). Reinforced by Sarah §4 (couldn't tell if the fox tab issue was print or model).

**JTBD 4.** *When I sit down to assemble — especially coming back to a half-done build — I want to find my place on the model without re-deriving it from the printed edge IDs alone, so I don't lose ten minutes per restart.* Grounded in: Marcus §6 (second monitor with 3D view); Dan §6 (iPad next to the table; 80-piece keep, two-week pause); Sarah §6 (Pinterest photo on phone). Mr. Chen's thumbnail-on-the-net workaround (§6) is a partial solution this JTBD generalises.

**JTBD 5.** *When I'm choosing or designing a model, I want a credible preview of how hard the build will be — piece count, smallest piece, age-appropriateness, paper required — so I know whether it fits my Saturday, my classroom, or my skill before I commit.* Grounded in: Sarah §7 (the difficulty-slider magic wand) and §8 ("finding the right model is at least half the problem"); Mr. Chen §2 (had to print and build one to discover the pentagons were wrong); Priya §1 ("if it goes past two hours I've lost the kids" — for Sarah; same shape for Priya's binge-y weekend budgeting).

## 4. Opportunity space — where competitors are silent

Cross-referencing pain themes to the competitive scan's "cross-cutting opportunities" section yields four spaces where the existing tools either do not act or act unreliably:

1. **Pre-unfold buildability preview.** Theme 4 maps directly to the scan's "mesh pre-flight as a first-class step" gap: every tool surveyed surfaces mesh problems as failure modes mid-unfold, never as a legible report before it. PolyZamboni's red/orange/green overlay is post-unfold. *No tool previews buildability before committing.*

2. **Partial / region-scoped re-unfold.** Theme 2 + JTBD 2 map to the scan finding that "none of [the tools] treats unfolding as iterative: re-unfold *this island only* with different constraints, while preserving edits to other islands. That partial-re-unfold workflow is unattested." This is the most direct "no competitor here" claim in the scan.

3. **Tab placement that respects inside/outside.** Theme 3 + Dan's exterior-face concept map to the scan's "tab placement that solves overlap by construction" gap. The scan notes no tool guarantees overlap-free tabs, and *additionally* no tool models which side of the mesh is interior. Pepakura's tab flip is per-edge, manual; the Export Paper Model addon offers no control. Pepakura's edge-correspondence checker is praised, but it is read-only — it does not let you constrain placement.

4. **Browser-native parity.** Theme 1 maps to the scan's "browser-native authoring with serious feature parity" gap. PaperMaker exists but is early. The scan is explicit: "the only credible web entrant found, and is self-described as 'still in early development' with near-zero public review volume." The category is open.

Three other themes (layout/grouping, assembly companion, pricing) have partial competitor activity — Pepakura's directional rectangle, Pepakura's Guided Assembly animation, and PaperMaker's freemium tier respectively — but the gaps within those activities are well-documented in the scan. They are differentiation surfaces, not greenfield.

## 5. Differentiation hypotheses

Three candidate v4 headline moves. Each has been written to be evaluable as a single headline UX investment, not as a feature list.

### Hypothesis A — "Browser-native Pepakura, opinionated about tabs"

**Description.** The user drops an STL/OBJ on a web page and within seconds sees a 3D viewport + 2D pattern pane, just like Pepakura. They mark or auto-detect the outside surface of the model. Tabs are placed on the inside by construction; tabs that would cross a visible edge are flagged red. Standard edits — join/disjoin faces, flip tab, move piece between sheets, scale — are present and modeless. Export is PDF/SVG with numbered edges and a thumbnail of the assembled shape on each sheet. No install, no account, free for the core flow.

**Pain themes addressed.** 1 (platform), 3 (tabs), partially 5 (group-aware packing once "outside" is known per face), partially 6 (thumbnail-on-the-net).

**Personas helped most.** Dan (his three explicit asks — cost, interior tabs, grouped sheets — all derive from "the tool knows which side is the outside"); Marcus (browser-native is his stated magic wand); Mr. Chen (Chromebook-compatible, no account, mathematically clean nets if the upstream geometry is clean).

**Personas least helped.** Priya and Sarah still face a "load this 3D file" step they currently never face — their default failure mode is "no PDF exists, I quit." This hypothesis improves their *option* to recover from that failure but does not eliminate the file-finding box at the top of their workflow.

**Honest tradeoffs.** This is the most directly competitive move — it goes head-to-head with Pepakura on the same conceptual model. Risk: we ship a slightly-worse Pepakura in a browser and lose to the muscle memory of the incumbent. The inside/outside concept is novel and unproven; auto-detecting "outside" on partially-closed meshes (Dan's open-edged ruins, terrain half-walls) is hard, and getting it wrong silently is worse than not having it. Cost: deep editor surface area is expensive to build and to keep usable.

**Demo moment.** Drop in a Halo helmet OBJ. Auto-detect outside. The 2D pane shows every tab on the inside, every "tab would be visible" warning lit red. User clicks a face on the 3D model and the corresponding piece highlights on the 2D pattern. Click export, print, fold. The 30-second clip ends on a clean helmet with no visible seams on the outside.

### Hypothesis B — "Buildability-first preview"

**Description.** Before any unfolding happens, the user drops a mesh and gets a *report*: estimated piece count, smallest piece dimension, largest piece dimension vs sheet size, scale preview ("this will print at 23 cm tall across 6 letter sheets"), mesh hygiene flags (non-manifold edges, faces too dense to unfold cleanly), and a difficulty rating with a one-line "what would simplify this." Only then does the user proceed to unfold, with the option to "simplify until easy" — a slider that fuses small faces and reduces piece count. After unfold, each piece has a per-piece risk badge (Marcus's red-yellow-green). Export still exists and is browser-native.

**Pain themes addressed.** 4 (buildability feedback as the headline), 5 (layout/scale check is part of the preview), partially 1 (browser-native).

**Personas helped most.** Sarah (the difficulty slider *is* her literal magic wand); Mr. Chen (mathematical preflight + "this will print on US Letter without tiling" is exactly his pre-build evaluation step); Priya (turns her abandoned Thingiverse fox into a decision she can make — "this'll be 60 pieces, smallest one is 4mm, do you still want to?").

**Personas least helped.** Dan and Marcus already have the intuition this hypothesis externalises. They benefit from the preview but it is not their first pain — they want editor depth, not preview depth.

**Honest tradeoffs.** Buildability prediction is a hard inference problem and a worse experience if it's wrong. If we say "this will be easy" and it isn't, we lose trust faster than Pepakura's mid-build failures, because the user committed to us *because of* the prediction. The "simplify" slider implies mesh decimation, which changes the silhouette — Marcus's Sketchfab dragon collapsed at decimation. We risk shipping a confident wrong answer. Also: this hypothesis can be confused for a thin marketing layer over the same Pepakura-clone underneath. The risk-badge system has to be backed by something real.

**Demo moment.** Drop in a 287-piece Sketchfab dragon. Without unfolding, the page shows: "287 pieces. Smallest 2mm. Largest 31cm — won't fit on letter. Estimated build time 60–90 hours. Three red-flag faces (non-manifold)." The "simplify" slider drops piece count to 84, smallest 8mm, build time 12–18 hours. The 30-second clip is the slider moving and the numbers responding.

### Hypothesis C — "Iterative unfold — edit once, re-unfold the rest"

**Description.** The user unfolds and starts editing in the 2D pattern pane. Crucially, the unfold is *persistent and partial*: the user can pin pieces ("these are right, never touch them"), then re-run the unfold algorithm with different constraints — different seam priority, different smoothness preference, different tab strategy — *only* on unpinned pieces. The unfold becomes a conversation, not a one-shot. Undo is a real undo stack with named checkpoints. Save state lives in the URL or a local file; no account needed.

**Pain themes addressed.** 2 (the auto-unfold is never the answer; this turns it into a conversation), partially 3 (tab strategy is one of the constraint axes), partially 1 (browser-native by construction since this is a stateful editor).

**Personas helped most.** Marcus (three hours of re-unfolding goes to thirty minutes when he can keep the parts he liked and re-run the parts he didn't; his Mandalorian-sternum example is exactly this — split into left/right at the sternum, re-unfold each half); Dan (his cone-roof example — "split along the back, not the front" — is a constraint he can declare and re-run).

**Personas least helped.** Sarah and Priya barely touch the editor; this hypothesis is silent on the platform-exclusion wall (they still need to load a mesh, which is the first quit point for them). Mr. Chen is moderately helped — his "regenerate, press button again" workflow becomes "regenerate with constraints" — but his actual pain is buildability of named polyhedra, not iterative editing.

**Honest tradeoffs.** This is the most ambitious algorithm work and the one with the most unknown UX. "Constraint-driven re-unfold" is conceptually clear but the constraint vocabulary is not — what does a user actually pin, and how do they say what they want different? Risk: we build a powerful tool only the Marcus tier understands. Also: this hypothesis is internally legible to engineers and exciting precisely because it's hard, which is a yellow flag — that bias can push us into building for the smallest persona segment.

**Demo moment.** Marcus's Mandalorian breastplate. The auto-unfold puts a fold down the sternum. He selects the breastplate region, drops a "seam here" pin on the sternum line, hits re-unfold-region. Five seconds later: left and right halves meet at the sternum, the rest of the layout untouched. The 30-second clip is one click producing the result that currently takes ten manual minutes.

### Recommendation — Hypothesis B as v4 headline

**Buildability-first preview** is the recommended v4 headline. Reasoning:

1. **It addresses the pain themes with the highest reach across personas.** Theme 4 (no buildability feedback) and theme 5 (layout/scale surprise) together are cited by five out of five personas; Marcus, Mr. Chen, Sarah, and Priya all volunteered specific magic-wand variants of this idea. The competitive scan's "mesh pre-flight as a first-class step" is the single gap it identifies most explicitly.

2. **It is the move that helps the casual end of the spectrum, which the existing market has abandoned.** Pepakura, Export Paper Model, and PolyZamboni are all built for users who already accept the tool's existence. Priya, Sarah, and Mr. Chen represent the audience that bounces off the tool *before* it gets a chance to help them; a preview surface speaks to them where editor depth does not.

3. **It is differentiating without being identical to the incumbent.** A "browser-native Pepakura" (Hypothesis A) competes on the incumbent's terms. A preview-first product is a different shape — and one that can grow into editor depth in v5 once trust is established. The opposite migration (editor product growing a preview) is harder because the editor's first impression is the editor.

4. **The demo moment is the most legible to a non-user.** A slider moving piece count from 287 to 84 with live build-time estimates is screenshotable. Marcus's re-unfold demo (Hypothesis C) is invisible to anyone who has not unfolded by hand.

5. **It is the lowest-regret bet.** If real-user research kills the buildability hypothesis, the underlying mesh-preflight and layout-preview machinery still benefits whichever direction we pivot to. Hypothesis A's tab-flip cleverness and Hypothesis C's constraint-driven re-unfold are less reusable if they prove unwanted.

Hypotheses A and C are not discarded. A is the natural v5 — once users trust the preview, give them the editor to act on it. C is the natural v6 or a research thread — the most ambitious differentiation move, worth investigating once we have real-user data on whether casual users would even discover it.

## 6. Cross-cutting design principles

These apply to v4 regardless of which hypothesis ships.

**P1 — Browser-native, no install, no account for the core flow.** Theme 1, theme 7. Four of five personas listed install/platform/account as their first quit point; the scan corroborates with the "Mac/Linux alternative" thread cluster. Account-walls and platform-walls are the most expensive form of friction we can ship.

**P2 — Show buildability before commitment.** Theme 4. Cost of a wrong commitment is hours plus material; cost of a preview is screen real estate. Even outside Hypothesis B, every step of the pipeline should surface "what will this cost / what could go wrong" before the user commits to it.

**P3 — Treat unfold output as draft, not deliverable.** Theme 2. Every editing affordance (tab flip, piece move, region re-unfold, scale) should be cheap and reversible. Save state should be trivial — no "did you mean to discard your work" anxiety like Pepakura's selective undo (Marcus §5; Dan §5).

**P4 — The model knows which side is the outside.** Theme 3. Inside/outside is the single concept that unlocks tab placement, seam choice, texture register, and "which face is interior padding" grouping. Even if the v4 headline is the preview, the data model should carry this concept so v5 can act on it.

**P5 — Group preservation is a feature, not a side effect.** Theme 5. The user's logical groups (per-building, exterior vs interior, per-body-part) are more valuable than the algorithm's whitespace-efficiency wins. Sheet packing should respect them by default and offer the efficiency win as an opt-in.

**P6 — Provide an assembly companion, even if minimal.** Theme 6. At minimum: thumbnail of the assembled shape on every sheet (Mr. Chen's field workaround should be standard), edge IDs in a font a twelve-year-old can read (Chen §3, §6; Sarah §4), and "where am I" recovery for builds that span days.

## 7. Open questions for real-user validation

The questions the synthetic round cannot answer and which must be closed before v4 lock-in.

1. **Is the "I would skip the unfolding step entirely if I could" answer real?** All five synthetics say yes; that uniformity is suspicious. Real users — especially the Marcus-tier veteran — may have an unstated craft attachment to the editing process that the synthetic Marcus partially admits to but immediately trades away (Marcus §7: "I can imagine, maybe, missing the feeling…. But I'd trade it"). If the editor-as-craft attachment is real and we ship preview-only, we may underserve the segment that funds papercraft community visibility.

2. **Does the "drop file, get PDF" pitch actually convert Priya-tier users, or do they bounce on the first preview screen?** The synthetic Priya is confident she would use it "the day it ships." Real users in her segment may have lower tolerance for *any* preview surface — even a buildability report could read as another wall.

3. **Is the inside/outside concept legible to non-experts?** Dan articulates it cleanly because he is a Blender user. Sarah and Priya never mentioned it; Mr. Chen mentioned it only via tab orientation. We need to see whether casual users can read or set this concept, or whether it has to be entirely inferred.

4. **What is the real distribution of mesh sources, and what fraction are unfoldable at all?** Marcus's 287-piece Sketchfab dragon is a single anecdote. Priya's Thingiverse fox is uninspected. We have no real data on what percentage of mesh files real users bring in are even structurally sound. The buildability preview's perceived accuracy depends on this.

5. **Will Mr. Chen's "mathematical correctness" requirement be met by mesh-driven unfolding, or does the polyhedra-teacher segment need a parametric primitive path entirely?** Mesh-unfolding a truncated icosahedron from an STL approximates a soccer ball; constructing it from "12 regular pentagons + 20 regular hexagons" gives a mathematically exact net. These may be different products. The synthetic Mr. Chen wanted a "name a polyhedron" input — that's not a mesh-import flow at all.

6. **Pricing — how strong is the synthetic convergence on "no subscription"?** Real-user willingness to pay needs to be probed with concrete prices, not magic-wand statements. We need to know: is the floor pay-per-export? Is one-time-license viable? Is a freemium with credit limits acceptable? Mr. Chen's privacy-review concern adds an institutional axis we cannot model with the consumer synthetics.

7. **Does the partial / region-scoped re-unfold (Hypothesis C) actually save Marcus time, or is the cognitive overhead of "what to pin and what to re-run" higher than the time it saves?** This is the headline test for whether Hypothesis C can become v5. The synthetic Marcus assumes the constraint vocabulary is obvious. A real-user prototype task would tell us whether it is.

8. **What is the assembly companion's minimum viable form?** Theme 6 is real but underspecified — thumbnail-on-net + edge IDs may be sufficient, or users may demand something closer to PolyZamboni's step-numbering. The competitive scan flags Pepakura's animated guide as the high-water mark and notes it is "widely reported as awkward." We need to know if users want the step-by-step guide at all or whether the static thumbnail + 3D-view-on-second-device pattern they already cobble together is preferred.
