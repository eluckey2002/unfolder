# Doc surgery (maint)

## Goal

Delete the four-doc orientation layer (`project-state.md`, `roadmap.md`, `project-history.md`, `project-rationale.md`) and the Cowork/dashboard framing they encode. Migrate ~30 lines of orphan content to `CLAUDE.md`. Strip `claude-mem` references from `CLAUDE.md` (not available on this machine). Update the strategist skills to reflect the new doc surface.

Net result: ~960 lines deleted, ~30 lines migrated, ~50 lines removed from `CLAUDE.md`. Meta-process surface drops from ~1500 lines to ~500.

## Context

Strategist-skills work (session 0024) made the four orientation docs strictly redundant. Every continuity function they served is now served by something more durable: ADRs (rationale), retrospectives (history + phase summaries), session logs (state + recent decisions), `/strategist` orientation load (what to read at session start), `README.md` (phase plan), `docs/decisions-log.md` (non-ADR decisions), `docs/queue.md` + `docs/open-questions.md` (deferrals + handoff questions). The four docs aren't just redundant — they're now actively misleading because they age while their replacements stay fresh.

Audit findings from the prompt-drafting conversation:

- **`project-rationale.md`** (229 lines): nothing genuinely orphan. All decision rationales captured in README, ADRs, or retrospectives. Delete entirely.
- **`project-history.md`** (251 lines): nothing load-bearing. The "3 pivots" narrative is interesting color but reconstructible from commit history + READMEs + retrospectives. Delete entirely.
- **`project-state.md`** (286 lines): ~30 lines worth migrating; everything else duplicates README/CLAUDE.md/protocol.md/retrospectives/skills.
- **`roadmap.md`** (256 lines): phase plan already in README; status flags derivable from session logs + `git log`. Delete entirely.

Plus: `claude-mem` is not installed on this machine — `CLAUDE.md` sections 1-4 (knowledge corpora, smart-explore, `/corpus` skill, claude-mem inventory) and one stray reference in section 5 (corpus-priming for parallel agents) are dead surface.

User decisions locked: full surgery in one PR; `strategist-protocol.md` kept but slimmed to ~30 lines.

## Tasks

1. **Migrate orphan content to `CLAUDE.md`** (~30 lines added):
   - **New section: "Preferences specific to Evan"** — verbatim from `project-state.md` lines 278-287 (goes-by name, background, communication style, paraphrasing preference, fact-based-and-candid preference, revision-style preference, memory-usage callouts).
   - **Section 5 additions** (working agreements not yet captured):
     - "Three kinds of work: numbered session / maintenance commit / spike. Spike = explicitly exploratory, time-boxed, throwaway code allowed, produces findings doc rather than shippable stage."
     - "Session prompts saved at `docs/sessions/prompts/<NNNN>-<descriptor>.md` (sessions/spikes) or `docs/sessions/prompts/<descriptor>.md` (maint); commit with the work."
     - "Doc-fetch and probe before writing prompts that involve new tools/libraries — fetch current docs, probe with a sample call."
     - "Non-ADR decisions logged in `docs/decisions-log.md`."

2. **Remove `CLAUDE.md` sections 1-4** (claude-mem):
   - Section 1: "Knowledge corpora"
   - Section 2: "Smart-explore"
   - Section 3: "When to build or rebuild corpora"
   - Section 4: "Other rules" (just the corpus inventory pointer)
   - In Section 5, remove the bullet that references "section 1's corpus-priming paste-block for any dispatched agent" — drop the parenthetical or rewrite the bullet without it.
   - Renumber remaining sections (formerly 5, 6 → now 1, 2).

3. **Update `/strategist` SKILL.md orientation list (Step 1)**:
   - Drop: `docs/project-state.md`, `docs/roadmap.md`, `docs/project-history.md` (if referenced), `docs/project-rationale.md` (if referenced).
   - Keep: `CLAUDE.md`, `docs/strategist-protocol.md`, `docs/queue.md`, latest retrospective, last 2-3 session logs, `docs/open-questions.md`.
   - Add: `README.md` (phase plan + project pitch).
   - Update Step 3 summary template to remove "Open queue items / phase" pointers that came from the deleted docs (derive from README + git log + retrospective).

4. **Update `/retrospect` SKILL.md** (phase-range source):
   - Step 1 currently reads `docs/roadmap.md` to determine phase ranges. Change to: read `README.md`'s phase plan + the most recent session log to determine which sessions fall in the phase being retrospected. If session numbers per phase aren't explicit in README, infer from session log filenames (e.g., v3 sessions = those numbered 0020+ until v3 retrospective lands).

5. **Slim `docs/strategist-protocol.md` to ~30 lines**:
   - Kill Cowork framing: "Cowork-side strategist Claude" role description → just "strategist (the `/strategist` skill)". "Cowork's side" → just internal-vs-repo distinction.
   - Update handoff-block template branch pattern from `claude/<name>` to `<type>/<descriptor>` per ADR 0006.
   - Keep: repo-as-bus principle (one paragraph), handoff status block template (updated), pointer to skills section.
   - Drop: "Roles, briefly" Cowork-strategist line; "Cowork re-orientation prompt" reference; chat-relay language.

6. **`git rm`** the four docs:
   - `docs/project-state.md`
   - `docs/roadmap.md`
   - `docs/project-history.md`
   - `docs/project-rationale.md`

7. **Sweep cross-references** to the deleted files in remaining live docs:
   - `README.md` — check for links to deleted docs.
   - `CLAUDE.md` — check for references in the post-migration version.
   - `docs/queue.md` — check for references.
   - ADRs (`docs/decisions/0001-*.md` through `0007-*.md`) — check for cross-references.
   - Retrospectives (`docs/retrospectives/v1-complete.md`, `v2-complete.md`, `v2-retrospective.md`) — these are immutable, but verify they're internally coherent without the four docs.
   - SKILL.md files — already handled in tasks 3 and 4, but verify no stragglers.

8. **Close two queue items** in `docs/queue.md`:
   - `[docs] Prune project-state.md Sessions-completed list` — done by full deletion.
   - `[pilot] v3 experiment — a live state artifact` — no longer relevant; the four-doc surface that motivated it is gone.

9. **Verify**:
   - `pnpm type-check` — clean (no source changes).
   - `pnpm test:run` — all tests pass (no source changes; expect same 149 passing across 19 files as session 0025).
   - `pnpm build` — clean.
   - No `pnpm baseline` regeneration expected (no algorithm changes).

10. **Wrap as maint commit** — maintenance commits don't get a numbered session log; the commit message body carries the handoff fields (verification, decisions, queue/roadmap deltas) per `docs/strategist-protocol.md`. Then `/wrap-session` → PR (branch protection requires it even for maint) → CI → squash-merge.

## Specs

Behavior specs for the migrations (verbatim where wording IS the deliverable):

### CLAUDE.md "Preferences specific to Evan" — verbatim from `project-state.md` lines 278-287

```markdown
## Preferences specific to Evan

- Goes by **Evan**.
- Background: PM at Firebrand, maker hobbies, generative-art interests, an existing Ver_dep methodology for agentic repo work. The unfolder project is shaped by his maker practice; v4 onward may eventually integrate with his generative-art generators (e.g. String Theory).
- Prefers **strategic language over technical jargon** in high-level discussion; details when warranted.
- Prefers **paraphrasing over quotation**; cites sources when claims warrant it.
- Strong preference for **fact-based, candid, forward-thinking** collaboration.
- When revising existing content, returns **only the revised section**, not the full document.
- Calls out **when memory is being used or new memory is being saved**.
```

### `strategist-protocol.md` slim version (target structure)

```markdown
# Strategist protocol

How the strategist (`/strategist` skill) and Claude Code coordinate. The repo is the relay; chat is ephemeral.

## Principle: repo-as-bus

Everything the strategist needs to know at session start lives in the repo — session logs, handoff blocks, ADRs, queue, open-questions ledger. No verbal-only decisions. If something matters, it commits.

## Handoff status block (session log extension)

Every session log under `docs/sessions/NNNN-*.md` ends with this fixed block:

\`\`\`markdown
## Handoff

- **Branch / worktree:** `<type>/<descriptor>` at `.claude/worktrees/<type>+<descriptor>/`
- **Commits:** `<subject>` (plus any additional in order)
- **Verification:** `pnpm test:run` <N passing>; `pnpm type-check` clean.
- **Decisions made or deferred:** Each as a one-line summary, linking to the ADR if one was written.
- **Queue / roadmap deltas:** Items added, closed, or moved. Empty list if none.
- **Open questions for the strategist:** Anything that needs follow-up — surfaces into `docs/open-questions.md` on next `/open-questions scan`.
\`\`\`

Maintenance commit message body should carry the same fields when applicable.

## Skills that codify this protocol

- `/begin-session` — bootstrap worktree per ADR 0006
- `/wrap-session` — verify → commit → PR → squash-merge
- `/strategist` — orientation load + lean-template prompt drafting
- `/red-team-prompt` — stress-test a drafted prompt (owns the preflight checklist)
- `/open-questions` — manage the open-questions ledger
- `/retrospect` — 4-pass phase-boundary retrospective

See `CLAUDE.md` for the operative subset and working agreements.
```

### `/strategist` SKILL.md Step 1 updated list

```markdown
1. `CLAUDE.md` (project-root)
2. `README.md` (phase plan + project pitch)
3. `docs/strategist-protocol.md`
4. `docs/queue.md`
5. The most recent file in `docs/retrospectives/` (sort by filename)
6. The last 2-3 session logs in `docs/sessions/` (sort by filename)
7. `docs/open-questions.md` (may not exist if no scan has been done yet)
```

(Drops the two deleted-doc entries; adds README.)

### Verification commands (Task 9)

```bash
pnpm --dir .claude/worktrees/maint+doc-surgery type-check
pnpm --dir .claude/worktrees/maint+doc-surgery test:run
pnpm --dir .claude/worktrees/maint+doc-surgery build
```

All three must pass clean.

## Appendix

(none — no verbatim ADR drafts or external content needed)
