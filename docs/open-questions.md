# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

- [Q-0031-1] Raised 0031 — Strategist read of `findings.md` § "v4 spec § 7 revisions needed" before the 0032 prompt is written. _(carried → session 0032; reason: sanity-check happens naturally during 0032 prompt drafting when the four spec edits get quoted)_
- [Q-0031-2] Raised 0031 — Deer-scale demonstration placement: fold into 0032 promote-to-core (as the first concrete validation task) or split as a separate spike session? _(carried → session 0032 prompt drafting; reason: scope call best made when 0032's full task list is visible)_
- [Q-0031-3] Raised 0031 — Rotation/translation grid resolution (Step 5 of the algorithm; 12 × 15° rotation, ±8 × median-edge translation) is the algorithm's biggest unknown — picked by intent, not tuning. The v4.3 fallback (manual region-pin + full-pipeline-re-run with loading spinner) becomes ship plan if the grid doesn't clear realistic obstacles. _(carried → session 0032; reason: the deer-scale validation IS the observability)_

## Resolved

- [Q-0030-1] Raised 0030 — v4.1 plan-mode bundle-tuning task (code-splitting r3f/drei behind dynamic import); v4.0 lands at 318.86 kB gzipped. Resolved 2026-05-17: queued to `docs/queue.md` as `[enhancement]`.
- [Q-0030-2] Raised 0030 — THREE.Clock deprecation watch; r3f 9.6 still uses `THREE.Clock`, three 0.184 has deprecated in favor of `THREE.Timer`. Console.warn only, non-blocking. Resolved 2026-05-17: queued to `docs/queue.md` as `[watch]`.
- [Q-0026-1] Raised 0026 — Area-based tab placement signal sizing: maint commit on `tabs.ts` or numbered session? Resolved 2026-05-16: queued to `docs/queue.md` as `[enhancement]` (Area-based tab placement signal). Sizing call deferred to whenever the queue item is picked up; entry added retroactively to close the silent carry surfaced during 0028's open-questions scan.
- [Q-0026-2] Raised 0026 — Visual inspection coverage for v3's "visibly competitive with Pepakura" quality bar; should a corpus-wide visual sweep be its own session or fold into another? Resolved 2026-05-16: fold into the v3-close session — the v3-close session already exists to verify the phase shipped its quality bar, and the visual sweep IS that verification. (Originally pointed to slot 0031; renumbered 2026-05-17 to 0029 after the v4 design spec absorbed the original 0029 file-loader UI into v4.0 scope.)
- [Q-0025-1] Raised 0025 — `detectOverlapsTolerant(layout, areaEps)` helper for tolerance-aware verification of Variant C cut-removal output (polygon-clipping throws on near-coincident shared edges). Resolved 2026-05-16: queued to `docs/queue.md` as `[research]`.
- [Q-0025-2] Raised 0025 — Orphan locked subagent worktree at `.claude/worktrees/agent-a2e7d08ff17975096`. Resolved 2026-05-16: PID 35444 died on its own; worktree unlocked then removed via `git worktree remove`; auto-generated `worktree-agent-a2e7d08ff17975096` branch deleted.
- [Q-0025-3] Raised 0025 — `.history/` VS Code Local History directory cleanup. Resolved 2026-05-16: queued to `docs/queue.md` as `[cleanup]`.

(Historical open questions from sessions 0012-0022 are not retroactively migrated. They were either implicitly resolved by subsequent work, addressed in retrospectives, or are no longer relevant.)
