# Spike findings — v4 user research

**Date:** 2026-05-16
**Inputs:** `competitive-scan.md`, `personas.md`, `topic-guide.md`, 5 interview transcripts (Marcus / Priya / Dan / Sarah / Mr. Chen), `synthesis.md`.

## Decision

The v4 headline UX move is **"Feedback-driven iterative unfolding"** — a hybrid of synthesis hypotheses B (buildability preview) and C (constraint-driven re-unfold), combined so that buildability signals become the entry points for constructive editing rather than warnings against the model the user chose.

## Why the hybrid, not B-alone

The synthesis recommended B because it had the highest reach across personas and the most legible demo. The director's reframe (2026-05-16, brainstorming session): B as recommended is *defensive* — it tells the user their model is bad and offers a retreat (the "simplify" slider reduces piece count by decimating the source mesh). The director's goal for v4 is the user reaching an *excellent unfold of the model they wanted*, quickly and easily. That requires constructive resolution, not retreat.

C alone has the inverse problem: it gives experts the power to fix unfolds iteratively, but the synthesis flagged a real risk of "building a powerful tool only the Marcus tier discovers." The constraint vocabulary is unproven; casual users would never invoke it.

The hybrid resolves both:

- **Buildability signals from B** make problems visible *before* commitment (theme 4 / JTBD 3 / 5-of-5 persona convergence).
- **Fix-suggestion entry points** turn each red badge into one or more actionable proposals ranked by impact. The user is never staring at a blank editor wondering what to do.
- **Region re-unfold from C** (the mechanism behind each suggestion) preserves the rest of the layout so the user does not lose decisions they already made (theme 2 / JTBD 2).
- **The "simplify" slider survives** as one fix among many — Sarah's kid-friendly mode lives there — but it is not the only path forward.

## What this means for v4 ship state

- **The core flow:** drop mesh → preflight report → unfold → per-piece risk badges → badge-driven fix loop → export.
- **The default user posture is acceptance, not authorship.** Click a red badge, see suggested fixes ranked, click "apply." Region re-unfold runs; badge updates. No requirement to learn pin/constraint vocabulary unless the user wants the power-user override.
- **Power users get the override.** Manual pin/constrain/re-unfold for Marcus and Dan.
- **All six cross-cutting design principles from `synthesis.md §6` apply unchanged.**

## Risks that survive into v4 design

1. **Region re-unfold is the hardest algorithm work.** C's biggest risk imported wholesale. Will likely need a v3.5 algorithm spike before v4 commits.
2. **"Wrong fix suggestion" is a new failure mode.** If the suggested fix makes things worse, trust collapses fast. The suggestion engine has to be either very conservative (recommend only fixes that provably reduce some metric) or very transparent (show predicted outcome of each fix before commit).
3. **Bigger v4 than B-alone.** May need to ship an MVP without all four fix-suggestion families enabled.

## Risks that the hybrid eases

- C's "what does the user pin?" UX problem largely dissolves. The default path is "accept a suggestion," not "compose a constraint." Manual pinning is power-user-only.
- B's "confident wrong prediction" risk eases because predictions come *paired with proposed fixes*, not as a discouraging warning.

## Open questions still owed to real-user validation

All 8 open questions in `synthesis.md §7` remain open. The hybrid changes the priority order:

- **Q7 (Hypothesis C usefulness for Marcus)** rises: region re-unfold is now load-bearing for the v4 headline, not a "research thread."
- **Q3 (inside/outside legibility to non-experts)** falls slightly: the hybrid does not require the user to understand inside/outside themselves — the tool infers it and surfaces fix suggestions in plain language.
- **Q1 (is "skip the editor entirely" real?)** stays open and load-bearing — if real users in Priya's segment actually want zero editor interaction even when a red badge appears, the hybrid is wrong for them and we need a separate "one-click acceptable defaults" flow.

## Hand-off

This findings file is the spike deliverable. The v4 design spec, drafted in the in-flight brainstorming session, will be written to `docs/superpowers/specs/2026-05-16-v4-interactive-editor-design.md` with this hybrid as its locked headline. The synthesis remains the supporting evidence base; this file is the conclusion.
