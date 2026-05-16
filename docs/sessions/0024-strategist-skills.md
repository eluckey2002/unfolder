# Session 0024 — Strategist skills

## What was attempted

Move the high-leverage strategist ceremony into Claude Code skills so ritual lives in
code rather than in pasted prose. The design spec identified six skill-shaped functions
that appear boilerplate-verbatim across v2 and v3 session prompts: worktree bootstrap,
prompt red-teaming, strategist orientation, phase retrospectives, open-question ledger
management, and session wrap. The session implemented all six per the design spec and
plan in `docs/superpowers/`, using subagent-driven-development with a two-stage review
per skill (spec reviewer + code-quality reviewer).

The session also updated CLAUDE.md section 6 to document the new skills and removed
the preflight checklist from `docs/strategist-protocol.md` (now owned by
`/red-team-prompt`). The session was bootstrapped manually — the `/begin-session` skill
it was creating did not yet exist, a deliberate chicken-and-egg that the plan called out
explicitly.

## What shipped

### The 6 skills

**`/begin-session`** — Replaces Tasks 1–2 boilerplate (worktree creation, prompt copy,
`pnpm install`) that appeared verbatim in 11 numbered-session prompts. Validates branch
name against ADR 0006's regex, verifies main is clean, creates the worktree at the
canonical `../<branch-name>` path, copies the authoritative prompt file into the
worktree, runs `pnpm install`, and surfaces queue items that intersect the session scope.
Prints a status report on completion.

**`/red-team-prompt`** — Stress-tests a drafted prompt before it reaches Evan. Dispatches
a Plan subagent with no chat context, the prompt content, and the preflight checklist
from `docs/strategist-protocol.md`. The subagent flags blocking issues, suggestions, and
nits with prompt-line citations. Optional `--write` flag saves the report alongside the
prompt. Now owns the preflight checklist; `docs/strategist-protocol.md` delegates to
this skill rather than maintaining a separate list.

**`/strategist`** — Switches Claude Code into strategist persona. Loads orientation docs
in order (project-state, protocol, queue, roadmap, latest retrospective, last 2-3
session logs), checks `git log` for drift, and prints a one-line summary. With a task,
acts immediately — typically drafts a session prompt using the lean template (Goal /
Context / Tasks / Specs / Appendix) and offers to `/red-team-prompt` the result. Without
a task, enters a recommendation-first planning conversation.

**`/retrospect`** — Codifies the 4-pass retrospective ritual from v2-retrospective.md as
a standing skill. Gathers phase artifacts (session logs, ADRs, queue deltas, git log),
runs four structured passes (Ground → Reframe → Self-lens → Converge) with a
pause-and-direct between each, and produces `<phase>-complete.md` and
`<phase>-retrospective.md`. The pause-and-direct between passes is explicitly load-bearing
— the skill warns before compressing them.

**`/open-questions`** — Manages a new `docs/open-questions.md` ledger with explicit
disposition on every entry (close / carry / queue / drop). Subcommands: `scan` reads the
last session log's open-questions block and walks each item; `list` shows the ledger;
`add`, `close`, `carry`, `queue`, `drop` manage entries directly. The file was seeded as
part of this session. The anti-pattern it eliminates: 8-session silent carry.

**`/wrap-session`** (updated) — Updated the existing skill for ADR 0006's PR flow.
Branch validation now checks `^(session|maint|spike)/[a-z0-9-]+$`. For `session/` and
`spike/` branches: push, open PR, monitor CI, surface to user for merge decision. For
`maint/` or direct-to-main: simpler fast-forward path. Removed the "until WI-4 lands"
hedge; `docs/strategist-protocol.md` is canonical.

### Supporting changes

- `CLAUDE.md` section 6 updated to document the skills and their invocation patterns.
- `docs/strategist-protocol.md` preflight checklist section replaced with a reference to
  `/red-team-prompt` (the skill now owns the checklist).
- `docs/open-questions.md` seeded with the initial ledger structure.
- `docs/superpowers/specs/2026-05-16-strategist-skills-design.md` updated post-implementation
  to reflect how the skills actually landed (lean template, composition decisions,
  lessons from implementation).

## Implementation pattern

Each skill used a consistent subagent-driven-development cycle: feat commit (implementer
subagent), spec reviewer pass, code-quality reviewer pass, fix-per-review commit,
re-verify. The code-quality reviewer caught a real bug on every single skill — 6-for-6
useful-finding rate. The bugs ranged from worktree path construction errors in
`/begin-session`, to checklist parity gaps and substitution clarity issues in
`/red-team-prompt`, to orientation and drift handling defects in `/strategist`, to
pause-and-direct and partial-state handling in `/retrospect`, to ID handling and queue
atomicity issues in `/open-questions`, to PR template filling and path clarity in
`/wrap-session`. The 6-for-6 rate documents that two-stage review (spec + code quality,
separate subagents) materially improves output quality even for skill files — which are
short prose, not code.

## Deferred items

- **Smoke tests** — deferred to first real use. Skills are discoverable via the Skill
  tool (confirmed in the system reminder); running them on a toy session to verify
  behavior was judged as delivering less signal than the first production invocation.
- **Doc surgery** — killing the "Sessions completed" list, merging roadmap/state,
  pruning duplicate working agreements — explicitly out of scope per the design spec.
  Queued separately.
- **Portable skills** — these skills are unfolder-specific (they reference project docs
  and ADR 0006's PR flow). Cross-project portability is a non-goal per the spec.
- **Automating decisions** — skills accelerate ritual; humans still decide forks. No
  automation of the judgment calls was added.

## Verification

- `pnpm type-check` — clean.
- `pnpm test:run` — **97 tests passing across 14 test files.** Source code unchanged;
  this session touched only `.claude/skills/`, `docs/`, and `CLAUDE.md`. Verification
  confirms nothing broke.

## Doc coherence

- `CLAUDE.md` section 6 updated — new skills documented with invocation patterns.
- `docs/strategist-protocol.md` — preflight checklist section now delegates to
  `/red-team-prompt`; the checklist items remain but are labeled as owned by the skill.
- `docs/open-questions.md` — new file, seeded as empty-but-structured ledger.
- `docs/superpowers/specs/2026-05-16-strategist-skills-design.md` — updated
  post-implementation to reflect actual behavior and lessons.
- `docs/sessions/0024-strategist-skills.md` — this file.
- `docs/sessions/prompts/0024-strategist-skills.md` — brief pointer to design artifacts,
  noting the manual bootstrap.

No ADR written — this is protocol-level work, not an architectural decision for the
pipeline. The design spec and session log are the artifacts.

## Queue / roadmap deltas

- `docs/open-questions.md` seeded (new file). No entries yet; this session produced no
  open questions that need carrying.
- Queue: no changes.
- Roadmap: no changes (this session is infrastructure / tooling, not a v3 pipeline
  advancement).

## Handoff

- **Branch / worktree:** `session/0024-strategist-skills` at `.claude/worktrees/session+0024-strategist-skills/`
- **Commits:** 16 in order:
  1. `fbf749a feat(skills): add /begin-session skill`
  2. `739fc48 fix(skills): /begin-session worktree paths and cd-persistence`
  3. `b591e53 chore(skills): update /wrap-session for ADR 0006 PR flow`
  4. `79bfe8c fix(skills): /wrap-session PR template and path clarity`
  5. `41191bd feat(skills): add /red-team-prompt skill`
  6. `57cd371 fix(skills): /red-team-prompt checklist parity and substitution clarity`
  7. `227ab13 feat(skills): add /open-questions skill and seed ledger`
  8. `b4c48cc fix(skills): /open-questions ID handling and queue atomicity`
  9. `0808063 feat(skills): add /retrospect skill`
  10. `56d3332 fix(skills): /retrospect pause-and-direct, partial state, and gather list`
  11. `3cf41d8 feat(skills): add /strategist skill`
  12. `c5ac1cd fix(skills): /strategist orientation, drift, template extensibility`
  13. `ff90817 docs(spec): update strategist-skills design spec to match implementation`
  14. `860e10a docs(claude-md): document strategist skills in section 6`
  15. `909d77e docs(protocol): remove preflight checklist, add skill references`
  16. `(this commit) docs(session 0024): strategist-skills session log and prompt`
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 97 passing / 14 files.
  (Source code unchanged; verification confirms nothing broke.)
- **Decisions made or deferred:**
  - Architecture: independent skills with optional composition (no orchestrator). `[flowed-silently]`
  - Lean prompt template (Goal/Context/Tasks/Specs/Appendix) — load-bearing experiment, deliberately minimal. `[flowed-silently]`
  - Smoke testing batched, then ultimately deferred to first real use (skills ARE discoverable via Skill tool per system reminder). `[flowed-silently]`
  - Plan file deliberately left unrefreshed as historical audit trail of corrections made during implementation. `[flowed-silently]`
  - 6 per-skill fix-per-review commits — each catching a real bug the spec missed. Pattern documented in spec's "Lessons from implementation" section.
  - All deferred items (doc surgery, portable skills, decision automation) listed in spec's "Out of scope" section.
- **Queue / roadmap deltas:** `docs/open-questions.md` seeded. Otherwise none (doc surgery still queued separately).
- **Open questions for the strategist:** Recommend running `/open-questions scan` against this log after merge to seed the first ledger entries (if any open-questions content surfaces). Otherwise none.
