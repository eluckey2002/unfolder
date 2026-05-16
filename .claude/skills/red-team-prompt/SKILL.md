---
name: red-team-prompt
description: Stress-test a drafted session prompt for ambiguity, stale APIs, predicted test counts, and other failure modes before it reaches the director. Use when the user types /red-team-prompt or asks to "red-team", "review", or "sanity-check" a prompt.
---

# Red-team prompt

Dispatch a no-context subagent to stress-test a drafted prompt against the preflight checklist embedded below. The skill reports findings; it does not auto-fix.

## Step 1 — Validate input

The first argument is a path to a `.md` file. Verify it exists with the Read tool. If a `--write` flag is present, the report will be saved alongside the prompt at `<prompt-path-stem>-redteam.md`.

## Step 2 — Read the prompt

Read the full prompt file. Capture the line count — the subagent will cite by line number.

## Step 3 — Dispatch the subagent

Use the Agent tool with `subagent_type: Plan`. Do **NOT** prime the agent with project context, working agreements, or CLAUDE.md content — the fresh-eyes property is the whole point.

Subagent prompt (literal — paste exactly with the prompt content inlined at the bottom):

> I am red-teaming a draft session prompt for a software engineering project. The prompt is intended for a Claude Code agent to implement. Identify issues against this checklist:
>
> 1. **Ambiguity** — any instruction with two reasonable interpretations
> 2. **Stale API references** — paraphrased function signatures, version-specific syntax that may have changed
> 3. **Predicted test counts** — any "tests should pass with N total" or similar. The prompt should ask the implementer to report the count, never predict it
> 4. **Dictated library call signatures** — specific function calls written in the prompt rather than described as behavior to implement
> 5. **Cross-file inconsistencies** — referenced files, commits, SHAs that don't match the actual repo state (you can verify these if a repo is mounted)
> 6. **Missing verification steps** — code-modification tasks without an explicit verification command
> 7. **Verbatim-vs-spec mismatch** — content marked verbatim that should be a behavior spec, or spec content where wording IS the deliverable
>
> Format your response in three sections:
> - **Blocking** — issues that would produce wrong work if left
> - **Suggestions** — issues that would degrade output quality
> - **Nits** — wording or style issues
>
> Cite by prompt line number for every finding. If a category has nothing, write "(none)".
>
> Prompt content follows:
>
> ---
>
> <paste full prompt file content here>

## Step 4 — Print findings

Output the subagent's response to the user verbatim. Do not edit, summarize, or filter.

## Step 5 — Optionally write the report

If `--write` was passed, save the subagent's output to `<prompt-path-without-.md>-redteam.md` (e.g., `0023-foo.md` → `0023-foo-redteam.md`) alongside the prompt file.

---

**Anti-patterns to avoid:**

- Priming the subagent with the project's working agreements or CLAUDE.md. Defeats the fresh-eyes property.
- Auto-fixing issues. The skill reports; the strategist decides what to fix.
- Filtering the subagent's findings. The user sees everything, including nits.
- Skipping the skill because "the prompt looks fine to me." The skill exists because the strategist's self-review has known blind spots.
