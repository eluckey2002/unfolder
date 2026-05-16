# Strategist protocol

How the strategist (`/strategist` skill) and Claude Code coordinate. The repo is the relay; chat is ephemeral.

## Principle: repo-as-bus

Everything the strategist needs to know at session start lives in the repo — session logs, handoff blocks, ADRs, queue, open-questions ledger. No verbal-only decisions. If something matters, it commits.

## Handoff status block (session log extension)

Every session log under `docs/sessions/NNNN-*.md` ends with this fixed block:

```markdown
## Handoff

- **Branch / worktree:** `<type>/<descriptor>` at `.claude/worktrees/<type>+<descriptor>/`
- **Commits:** `<subject>` (plus any additional in order)
- **Verification:** `pnpm test:run` <N passing>; `pnpm type-check` clean.
- **Decisions made or deferred:** Each as a one-line summary, linking to the ADR if one was written.
- **Queue / roadmap deltas:** Items added, closed, or moved. Empty list if none.
- **Open questions for the strategist:** Anything that needs follow-up — surfaces into `docs/open-questions.md` on next `/open-questions scan`.
```

Maintenance commit message body should carry the same fields when applicable.

## Skills that codify this protocol

- `/begin-session` — bootstrap worktree per ADR 0006
- `/wrap-session` — verify → commit → PR → squash-merge
- `/strategist` — orientation load + lean-template prompt drafting
- `/red-team-prompt` — stress-test a drafted prompt (owns the preflight checklist)
- `/open-questions` — manage the open-questions ledger
- `/retrospect` — 4-pass phase-boundary retrospective

See `CLAUDE.md` for the operative subset and working agreements.
