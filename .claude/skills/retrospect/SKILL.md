---
name: retrospect
description: Run the 4-pass phase-boundary retrospective. Produces -complete.md (what shipped) and -retrospective.md (how we worked) per the v2 pattern. Use when the user types /retrospect, "retrospect on v3", or "phase retrospective".
---

# Retrospect

Run the 4-pass retrospective ritual for a completed phase. Each pass pauses for the user's direction — this is the joint exercise pattern, not a strategist draft.

## Step 1 — Validate phase and prior state

The first argument is the phase (e.g., `v3`).

**Phase completion check:** Read `docs/roadmap.md` to verify all sessions in the phase range are marked done. If not, stop and surface — do not start a retrospective on an in-flight phase.

**Prior-state check:** Look for three files that may exist from a prior run:
- `docs/retrospectives/<phase>-complete-draft.md` (Pass 1 draft, session died mid-pass) → offer to resume from Pass 2 or restart from Pass 1
- `docs/retrospectives/<phase>-complete.md` (Pass 4 completed for the what-shipped doc) → warn before overwriting
- `docs/retrospectives/<phase>-retrospective.md` (Pass 4 completed for the how-we-worked doc) → warn before overwriting

If both final files exist, confirm with the user before proceeding. If only the draft exists, offer the resume choice. If none exist, proceed normally.

## Step 2 — Gather phase artifacts

Read these in parallel (use parallel Read/Grep calls):

- Session logs whose number falls in the phase range (read `docs/roadmap.md` to determine the range — each phase has explicit session number boundaries)
- ADRs created during the phase (`docs/decisions/`)
- Queue items added/closed in the phase (`docs/queue.md` history via `git log -p docs/queue.md`)
- Audit findings in the phase (`docs/audits/`)
- Prior phase retrospectives (`docs/retrospectives/*.md` for phases before this one) — used for trend comparison and scoring carried lessons
- `git log --oneline` for the phase range

Hold the artifacts in working memory. The user will not paraphrase — the read is from the repo directly.

## Step 3 — Pass 1: Ground

Produce a factual timeline and first-pass observations (observations, not conclusions). Save to `docs/retrospectives/<phase>-complete-draft.md`. Surface to the user.

Prompt:

> Pass 1 draft saved to `docs/retrospectives/<phase>-complete-draft.md`. Review the timeline and observations. Anything missed or mischaracterized? When ready, say "Pass 2" and we'll move on.

Wait for user response.

## Step 4 — Pass 2: Reframe

Per the v2 pattern: convert observations into decisions. Each decision has context, competing viewpoints, and (optionally) novel ideas to pilot.

Prompt:

> Pass 2 — for each observation from Pass 1, I'll propose a decision with viewpoints. Accept, redirect, or skip each.

Walk the observations one by one. For each: present the proposed decision with viewpoints, wait for the user's "accept", "redirect <how>", or "skip", and only then move to the next. Record accepted decisions and pilots; mark rejected ones.

## Step 5 — Pass 3: Self-lens

Produce an honest assessment of the Claude Code agent acting as strategist (and the Cowork strategist if any was in use) during the phase. Where it over-weighted bookkeeping, where it offloaded synthesis, what habits showed.

Prompt:

> Pass 3 — here's my honest read of how I performed this phase:
>
> <draft assessment>
>
> Add to or push back on anything.

## Step 6 — Pass 4: Converge

Write both files:

- `docs/retrospectives/<phase>-complete.md` — what shipped (use `v2-complete.md` as the structural reference)
- `docs/retrospectives/<phase>-retrospective.md` — how we worked (use `v2-retrospective.md` as the structural reference)

Delete the Pass 1 draft (`docs/retrospectives/<phase>-complete-draft.md`).

## Step 7 — Suggest follow-ups

Print a list of follow-up actions the retrospective implies:
- Handoff doc updates (`project-state.md`, `project-history.md`, `project-rationale.md`)
- Queue additions
- Working agreement changes (`CLAUDE.md`, `strategist-protocol.md`)

Do not apply automatically. The user decides which to act on.

---

**Anti-patterns to avoid:**

- Producing a strategist-draft retrospective unilaterally. The 4-pass pause-and-direct between passes is the point — that's the v2 lesson.
- Compressing the 4 passes into one.
- Auto-applying follow-ups. The user decides.
- Starting before the phase is actually done. Step 1 enforces this — do not bypass.
