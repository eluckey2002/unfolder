# Origami project — Claude guidance

## 1. Session conduct

- **Worktree discipline.** When in a worktree, confirm `pwd` before any Edit/Write — never edit the main repo from a worktree session. The SessionStart hook prints cwd, branch, and `git worktree list` at session start; trust that, not memory.
- **Plan first for multi-file sessions.** Any session touching >2 files or producing new functionality enters plan mode and produces a written plan before implementing. **Implementation plans break down to atomic 5-step TDD per task** (write failing test → run/fail → implement → run/pass → commit), with concrete code blocks and exact commands per the `superpowers:writing-plans` skill format — phase-level or task-level summaries are not enough. For doc/config-only plans (no testable behavior), substitute read → edit → verify-by-reread → commit, with exact `old_string`/`new_string` shown.
- **Plan gates report, never predict.** Plan-time gates of the form "X equals N" or "baseline is byte-identical after Task K" are a structural smell — they leak strategist over-confidence about implementation behavior into the plan and produce mid-session reframes when wrong. Use report-form instead: name the measurement and the threshold of concern, not the predicted value. (Per v3-retrospective Decision 3; `/red-team-prompt` flags the smell.)
- **Three kinds of work:** numbered session / maintenance commit / spike. Spike = explicitly exploratory, time-boxed, throwaway code allowed, produces findings doc rather than shippable stage.
- **Session prompts saved at** `docs/sessions/prompts/<NNNN>-<descriptor>.md` (sessions/spikes) or `docs/sessions/prompts/<descriptor>.md` (maint); commit with the work.
- **Doc-fetch and probe before writing prompts** that involve new tools/libraries — fetch current docs, probe with a sample call.
- **Non-ADR decisions logged in** `docs/decisions-log.md`.
- **Verify UI/CSS against real renders.** Screenshot the running app at the target viewport — do not inject CSS to simulate conditions; that produces false-positive bug reports.
- **Visual gates for geometric and rendering output.** Every session whose plan touches `src/core/emit-svg.ts`, `src/core/paginate.ts`, `src/core/foldability.ts`, or any new rendering surface names a visual gate in its plan and runs it before commit. Synthetic unit-test fixtures structurally cannot catch float drift, silent field drops, or visible-but-undetected artifacts; the visual gate can. (Per v3-retrospective Decision 2; `scripts/visual-gate.ts` is the standing harness when Playwright is reachable.)
- **Read/Grep/Glob for inspection; Bash for side effects.** Reserve Bash for build, test, git, and other commands that change state. Reuse a verification result already obtained this session rather than re-running.
- **`pnpm install` on Windows needs `NODE_OPTIONS="--use-system-ca"`.** Plain `pnpm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` against npmjs.org (the Windows cert store / Node bundled-CA mismatch). Prefix with `NODE_OPTIONS="--use-system-ca"` (PowerShell: `$env:NODE_OPTIONS="--use-system-ca"; pnpm install`). Other pnpm commands (`pnpm test:run`, `pnpm baseline`, `pnpm build`) don't hit the registry and don't need the flag.
- **Parallel Task agents for multi-target exploration.** When the task has independent read-only sub-questions, dispatch parallel sub-agents instead of serial Bash/Read.
- **Worktree cleanup.** Run `git worktree prune` at session start.
  Merged session branches are auto-deleted on the remote; the local
  worktree admin still needs pruning.
- **Phase-artifact authorship is split.** `<phase>-complete.md` is
  strategist-authored inside a phase-close numbered session
  (precedent: 0019 → v2-complete.md, 0029 → v3-complete.md), with a
  mandatory sub-agent code-review pass for factual / tonal /
  structural issues before commit. `<phase>-retrospective.md` is
  joint via `/retrospect`. The split is codified per v3-retrospective
  Decision 5; do not author complete.md unilaterally without the
  sub-agent review layer.

## 2. Development workflow (v3+)

Per ADR 0006. Numbered sessions and spikes land via pull request, not
direct merge.

- **Worktree branch naming:** `<type>/<descriptor>` — type is
  `session`, `maint`, or `spike`; for sessions the descriptor leads
  with the number (`session/0020-dev-flow-setup`). Create the
  worktree with this name; do not accept an auto-generated one.
- **`EnterWorktree` mangles the branch name.** Calling
  `EnterWorktree(name="session/0024-foo")` produces branch
  `worktree-session+0024-foo` and worktree path
  `.claude/worktrees/session+0024-foo`. Immediately after, rename the
  branch in place: `git branch -m worktree-session+0024-foo
  session/0024-foo`, then verify with `git branch --show-current`.
  The worktree directory path stays slightly off-convention (`+`
  instead of `/`) — that's local-only and acceptable; only the branch
  name has to match ADR 0006.
- **Land via PR:** worktree → open a PR → CI must pass → address
  every CI comment and failure (resolve, or reply with a reasoned
  dismissal) → squash-merge. Maintenance commits may still go direct
  to `main`.
- **Fill the PR template** — it is the structural home of the session
  handoff block, and it mirrors the in-repo session log
  (`docs/sessions/NNNN-*.md`), which stays canonical.
- **Reasoning lives in ADR 0006**; the working agreements are in `CLAUDE.md`. This section is the operative subset only.

### Strategist skills (the operative subset)

The repo carries a set of skills that codify the strategist's ceremony.
Use them instead of pasting the ritual into prompts or running it by
hand.

| Skill | Purpose |
|---|---|
| `/begin-session <branch>` | Worktree + prompt-copy + `pnpm install` + queue scan. Replaces Tasks 1-2 of the old prompt template. |
| `/wrap-session` | Verify → commit → push → PR → CI → squash-merge. ADR 0006's PR flow. |
| `/strategist [task]` | Load orientation docs, detect drift, draft session prompts in the lean template, or enter planning conversation. |
| `/red-team-prompt <path>` | Dispatch a no-context subagent to stress-test a drafted prompt before handoff. |
| `/open-questions [subcmd]` | Manage `docs/open-questions.md`. Force explicit disposition on each handoff open-question; no silent carry. |
| `/retrospect <phase>` | Run the 4-pass phase-boundary retrospective; produce `-retrospective.md` (the how-we-worked doc). `-complete.md` is strategist-authored in a phase-close numbered session, not by this skill. |

The lean prompt template (Goal / Context / Tasks / Specs / Appendix)
replaces the old worktree-boilerplate prompt format. `/strategist` uses
the lean template by default.

## 3. Preferences specific to Evan

- Goes by **Evan**.
- Background: PM at Firebrand, maker hobbies, generative-art interests, an existing Ver_dep methodology for agentic repo work. The unfolder project is shaped by his maker practice; v4 onward may eventually integrate with his generative-art generators (e.g. String Theory).
- Prefers **strategic language over technical jargon** in high-level discussion; details when warranted.
- Prefers **paraphrasing over quotation**; cites sources when claims warrant it.
- Strong preference for **fact-based, candid, forward-thinking** collaboration.
- When revising existing content, returns **only the revised section**, not the full document.
- Calls out **when memory is being used or new memory is being saved**.
