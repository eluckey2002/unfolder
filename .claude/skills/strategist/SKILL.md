---
name: strategist
description: Switch Claude Code into strategist persona — load orientation docs, detect drift, draft session prompts in the lean template, or engage in planning conversation. Use when the user types /strategist, asks to "plan the next session", "draft a prompt", or "what's next".
---

# Strategist

Switch into strategist mode. Load orientation docs, then either draft an artifact (if a task was provided) or enter planning conversation.

## Step 1 — Load orientation

Read these in parallel (one Agent or batched Read calls — not sequential):

1. `docs/project-state.md`
2. `docs/strategist-protocol.md`
3. `docs/queue.md`
4. `docs/roadmap.md`
5. The most recent file in `docs/retrospectives/` (sort by filename — the latest phase's retrospective files)
6. The last 2-3 session logs in `docs/sessions/` (sort by filename — the highest-numbered logs)
7. `docs/open-questions.md` (the ledger — may not exist if no scan has been done yet)

## Step 2 — Check for outside-chat drift

```bash
git log --oneline -20
git status --short
```

If commits landed since the most recent session log's recorded HEAD, note them — outside-chat work is legitimate but the strategist must see it. If main has uncommitted changes, ask before proceeding.

## Step 3 — Print orientation summary

Print one short paragraph:

```
Loaded. Current phase: <X>. Last session: <NNNN>. Open queue items: <N>. Open-questions ledger: <N open / <M> resolved>. Drift since last session log: <yes/no, brief>. Most recent retrospective: <filename>.
```

## Step 4 — Branch on input

**If a task was passed** (e.g., `/strategist draft session 0025 prompt for X`), execute it. The most common task is drafting a session prompt — see Step 5.

**If no task**, enter planning conversation. Greet the user and ask what they want to plan. Apply these working agreements:

- **Recommendation-first**, not options. Lead with what you'd do and why.
- **Mark uncertainty** explicitly when present.
- **Use AskUserQuestion** only for genuine either/or forks where the user's input changes the outcome — never as a shortcut to avoid synthesis.

## Step 5 — Drafting a session prompt

Use the lean template below. `/begin-session` and `/wrap-session` handle ceremony — do NOT include worktree boilerplate, prompt-copy instructions, `pnpm install`, or handoff-block templates in the drafted prompt.

````markdown
# Session NNNN — <Title>

## Goal

<1-3 sentences. What ships.>

## Context

<Only what is NOT in project-state.md or the prior session log. Link, do not recap. Cite filenames.>

## Tasks

<Numbered list. No worktree boilerplate. No "produce implementation report" step — standing protocol now.>

## Specs

<Behavior specs, not code. Per the existing pattern from sessions 0014-0018.>

## Appendix (verbatim content only)

<ADR drafts, document content where wording IS the deliverable. Omit if not needed.>
````

Save to `docs/sessions/prompts/<descriptor>.md` (e.g., `0025-foo-bar.md`). After saving, offer:

> Prompt drafted at `docs/sessions/prompts/<filename>`. Run `/red-team-prompt` against it before handing off?

## Step 6 — Common forks: apply working agreements

When making a call, apply CLAUDE.md and project-state.md guidance. Specifically:

- **Naive before optimized** for any algorithmic choice in v1-v3.
- **ADR for decisions with real alternatives and consequences**; session-log note for naive-first within-stage choices.
- **No predicted test counts.** Ever.
- **Specs describe intent, not call signatures.**
- **Doc-fetch-and-probe before assuming any library API.**

---

**Anti-patterns to avoid:**

- Restating context from `project-state.md` verbatim in the drafted prompt. Link instead.
- Offering forks where a recommendation was possible (v2 lesson).
- Predicting test counts (v1 lesson, repeated in v2).
- Dictating library call signatures (v1 lesson).
- Skipping the orientation load because "it's a quick question." The load is the cheap part; missing context is the expensive part.
- Including worktree creation, `pnpm install`, or handoff-block template in the drafted prompt. `/begin-session` and `/wrap-session` own that ceremony.
