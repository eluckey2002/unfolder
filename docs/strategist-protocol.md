# Strategist / observer protocol

The conventions that govern how Cowork-side strategist Claude and terminal-side
Claude Code coordinate, and what observer-mode sessions are expected to do
without violating their constraints. Evan is the go-between; this doc exists so
the relay stops being lossy.

## Roles, briefly

- **Cowork strategist Claude** — plans sessions, reviews output, maintains
  documentation, surfaces decisions. Reads the repo at session start.
- **Claude Code** — implements. Runs prompts the strategist drafts, edits code,
  commits, reports back via session logs.
- **Observer-mode Claude Code sessions** — a Claude Code session running in
  read-only observation mode. Watches and records, doesn't act. Output is the
  capture, not the side effects.
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
- **Commits:** `<short-sha-1> <subject>` (plus any additional in order)
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

## Observer-mode rules

Observer-mode sessions watch and record — they do not implement. The
repeat-offender failure modes from the Insights report are below; each has the
fix.

### No tool calls when no tools are available

If a continuation session lacks Bash (or any tool), do **not** attempt to use
that tool and then narrate the failure. Report the missing capability once,
then continue with what is available. A continuation session without Bash can
still Read; that is enough for almost all observation work.

If a tool *is* available but produces an error, narrate the error and move on
— do not retry in a loop.

### Don't fabricate facts you can't verify in the current session

If the observation requires running a command that is unavailable, mark the
observation as "unverified" rather than inferring. The strategist will run the
command on the next active session.

### Capture format

> **Note — needs Evan to confirm.** The exact `<observation>` / `<summary>`
> tag schema that observer-mode sessions are expected to emit is not fully
> documented in this repo or in the claude-mem plugin docs available locally.
> The taxonomy below is inferred from the `observations` table (types:
> `bugfix`, `change`, `decision`, `discovery`, `feature`). The auto-capture
> path (Read / Edit / Bash hooks → SQLite) is separate from observer-mode's
> explicit tag emission, and the two should not be conflated. Confirm the
> precise schema before treating any of this as authoritative.

What is reasonably safe to assume from the table schema and existing data:

- An observation has a **type** drawn from `{bugfix, change, decision,
  discovery, feature}`. Pick the most specific match. When uncertain between
  two, prefer `discovery` over `change`.
- An observation has a **title** — one sentence, present tense, what was
  observed. Not a question, not a TODO.
- An observation may have **narrative** (longer-form text) and **facts**
  (concrete claims worth indexing later).
- A **summary** is the end-of-session rollup — what the session accomplished
  taken as a whole, distinct from per-event observations. Use one summary per
  observer-mode session.

When in doubt about whether something is an observation or a summary: if it
narrates a single event, it's an observation. If it abstracts across the
whole session, it's a summary.

## When this doc is consulted

The Cowork re-orientation prompt in `docs/project-state.md` points to this
file as part of the session-start reading order. The strategist reads it once
per chat (it's short); Claude Code reads it when starting an observer-mode
session or when writing a session log's handoff block.

## What this doc does NOT cover

- Implementation conventions (those live in `CLAUDE.md` and the project
  working agreements in `docs/project-state.md`).
- ADR style (already documented by example in `docs/decisions/`).
- The auto-capture pipeline (claude-mem's own behavior — documented in the
  plugin, not here).
