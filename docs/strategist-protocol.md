# Strategist protocol

The conventions that govern how Cowork-side strategist Claude and terminal-side
Claude Code coordinate. Evan is the go-between; this doc exists so the relay
stops being lossy.

## Roles, briefly

- **Cowork strategist Claude** — plans sessions, reviews output, maintains
  documentation, surfaces decisions. Reads the repo at session start.
- **Claude Code** — implements. Runs prompts the strategist drafts, edits code,
  commits, reports back via session logs.
- **Evan** — director. Goes between the two as needed. The goal of this doc
  is to make that "going between" as deterministic and lossless as possible.

## Principle: repo-as-bus

The repo is the relay. Chat is ephemeral; the repo is durable.

This means: when Claude Code finishes a session, **everything the strategist
needs to know lives in the session log committed to the repo**. The strategist
reads it directly at session start (already in the re-orientation prompt). Evan
does not paraphrase. If the strategist needs something that isn't in the log,
the log is incomplete — fix the log, don't compensate via chat.

Practically:

- Session logs MUST end with the handoff status block defined below.
- Maintenance commits don't need a session log, but their commit message
  carries the handoff information instead.
- Decisions get ADRs in `docs/decisions/`. Queue changes go in `docs/queue.md`.
  Roadmap state changes in `docs/roadmap.md`. Each in the same commit as the
  session log.
- If a decision was made on Cowork's side that has no artifact in the repo,
  the strategist drafts the artifact in the same session that surfaces the
  decision. No verbal-only decisions.

## Handoff status block (session log extension)

Every session log under `docs/sessions/NNNN-*.md` ends with this fixed block.
The strategist consumes it deterministically — no paraphrasing required.

```markdown
## Handoff

- **Branch / worktree:** `claude/<name>` at `.claude/worktrees/<name>/`
- **Commits:** `<subject>` (plus any additional in order)
- **Verification:** `pnpm test:run` <N passing>; `pnpm type-check` clean.
  (If skipped, say why — e.g. "docs-only change, no verification needed".)
- **Decisions made or deferred:** Each as a one-line summary, linking to the
  ADR if one was written. Use "deferred to <session>" or "deferred to queue"
  when applicable.
- **Queue / roadmap deltas:** Items added, closed, or moved. Empty list if
  none.
- **Open questions for the strategist:** Anything that needs Cowork-side
  follow-up. Empty list if clean.
```

The block lives at the end of the log because that's where it's most useful for
the strategist's session-start pass — the most recent log is read last.

Maintenance commit message body should contain the same fields when applicable
(branch/worktree usually `main`; commits is the commit being made; decisions
are usually trivial or absent for maintenance work).

## When this doc is consulted

The Cowork re-orientation prompt in `docs/project-state.md` points to this
file as part of the session-start reading order. The strategist reads it once
per chat (it's short); Claude Code reads it when writing a session log's
handoff block.

## What this doc does NOT cover

- Implementation conventions (those live in `CLAUDE.md` and the project
  working agreements in `docs/project-state.md`).
- ADR style (already documented by example in `docs/decisions/`).
- The auto-capture pipeline (claude-mem's own behavior — documented in the
  plugin, not here).

## Prompt preflight checklist

Before a session prompt reaches Evan, it is red-teamed against the
failure classes v1 and v2 actually hit. A subagent runs this; the
strategist triages the result.

- **No call signatures from memory.** The prompt describes algorithm,
  render, and test behavior as intent — it does not dictate specific
  library call signatures. (v1 shipped a wrong three.js call this
  way.)
- **No predicted test counts.** The prompt says the new tests should
  pass and asks Claude Code to report the total; it never predicts a
  cumulative count.
- **Formal syntax is exact, not paraphrased.** Where the prompt
  specifies gitignore patterns, regexes, globs, YAML, or config, the
  syntax is given exactly — not described. (Session 0001's gitignore
  bug.)
- **Verification steps are named.** The prompt names the exact
  verification commands the session must run.
- **Files and merge strategy are named.** The prompt lists the files
  to create or modify and the commit/merge path.
- **New tooling is probed, not assumed.** For any new library or
  external tool, the prompt requires doc-fetch-and-probe rather than
  assuming the API.
- **Self-contained.** The prompt reads completely to an agent with no
  chat context — prompts are pasted fresh.
- **Work type and branch name declared.** The prompt states whether
  the work is a numbered session, maintenance commit, or spike, and
  the branch name to use.
- **Frozen.** This is the final version. A change after handoff is a
  new prompt or an explicit, flagged amendment — not a silent edit.
