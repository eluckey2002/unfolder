# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

- [Q-0025-2] Raised 0025 — Orphan locked subagent worktree at `.claude/worktrees/agent-a2e7d08ff17975096`. Carried: PID 35444 (claude.exe, 475MB) is still alive as of 2026-05-16; user to confirm process dead before `git worktree remove --force`.

## Resolved

- [Q-0025-1] Raised 0025 — `detectOverlapsTolerant(layout, areaEps)` helper for tolerance-aware verification of Variant C cut-removal output (polygon-clipping throws on near-coincident shared edges). Resolved 2026-05-16: queued to `docs/queue.md` as `[research]`.
- [Q-0025-3] Raised 0025 — `.history/` VS Code Local History directory cleanup. Resolved 2026-05-16: queued to `docs/queue.md` as `[cleanup]`.

(Historical open questions from sessions 0012-0022 are not retroactively migrated. They were either implicitly resolved by subsequent work, addressed in retrospectives, or are no longer relevant.)
