# Origami project — Claude guidance

All claude-mem tools are deferred MCP. Each section's load step must run before first use.

## 1. Knowledge corpora

The corpora are inventoried in
`~/.claude/projects/-Users-eluckey-Developer-origami/memory/project_corpora.md`
— **that file is canonical for what exists** (scope, sources, the
exact subagent paste-blocks). This section carries only the
*when-to-query triggers*; do not duplicate the inventory here.

| Corpus | Triggers (topic words / path fragments) |
|---|---|
| `paperfoldmodels-algorithm` | `paperfoldmodels`, crease pattern, fold mechanics, unfolding, face overlap, dual graph, `references/paperfoldmodels/` |
| `origami-v1-pipeline` | STL/OBJ parse, mesh, face adjacency, spanning tree, flatten, overlap, recut, glue tabs, paginate, SVG export, `src/core/`, `src/app/`, pipeline architecture, three.js renderer |
| `origami-process` | queue, roadmap, project-state, session log, working agreement, ADR discipline, handoff, cowork, `docs/sessions/`, housekeeping |
| `origami-decisions` | ADRs, architectural decisions, design tradeoffs, "why did we do it this way", `docs/decisions/` |
| `umat-lessons` | retrospectives, lessons learned from earlier project iterations |

**Workflow on any trigger match:**

1. Load once per session:
   ```
   ToolSearch(query="select:mcp__plugin_claude-mem_mcp-search__query_corpus", max_results=1)
   ```
2. Call:
   ```
   query_corpus(name="<corpus-name>", question="...")
   ```
3. Spawning a subagent on triggers? `project_corpora.md` holds the
   exact paste-block per corpus — subagents do not see CLAUDE.md.

Empty / incoherent / clearly-wrong corpus results → surface to user
immediately. Do NOT silently fall back to `Read`.

## 2. Smart-explore (use BEFORE Read / find / grep on large or unfamiliar code)

**Triggers:** "show me the structure of X", "what's in directory X", "find X across the codebase", "extract exports from X", any file >500 lines.

**Workflow on any trigger match:**

1. Load once per session:
   ```
   ToolSearch(query="select:mcp__plugin_claude-mem_mcp-search__smart_outline,mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_unfold", max_results=3)
   ```
2. Pick the right tool:

   | Goal | Tool |
   |---|---|
   | Find symbols / files across a directory | `smart_search(query="...", path="./src")` |
   | Structural skeleton of one file | `smart_outline(file_path="...")` |
   | Full source of one specific symbol | `smart_unfold(file_path="...", symbol_name="...")` |

3. Only `Read` after smart-explore has narrowed to a specific small region you actually need.

**Anti-pattern to avoid:** chaining `find` / `ls` / `grep` / `Read` on a large unfamiliar file. The first tool call for structural questions should be `ToolSearch` for smart-explore, then `smart_outline` / `smart_search`.

## 3. When to build or rebuild corpora (use the `/corpus` skill)

The `/corpus` skill handles the mechanics. These rules tell you *when* to invoke it.

**Propose `/corpus build "<description>"` when:**
- A file appears in ≥3 observations across ≥2 sessions and isn't covered by any existing corpus.
- A subagent reads ≥5 files from the same directory that isn't covered by any corpus.
- You've read the same large file twice in one session.

**Propose `/corpus rebuild <name>` when:**
- A corpus query returns wrong / incoherent results.
- ≥5 new observations relevant to a corpus's scope have been recorded since it was built.

**Suggest `/corpus audit` at the start of a session that:**
- Touches a domain you haven't worked in for weeks.
- Precedes a refactor where decisions need to be checked.

Always propose, then wait for user confirmation. Never auto-build.

## 4. Other rules

- Long-form corpus inventory: `~/.claude/projects/-Users-eluckey-Developer-origami/memory/project_corpora.md`. Keep the table in section 1 in sync when adding or retiring corpora.

## 5. Session conduct

- **Worktree discipline.** When in a worktree, confirm `pwd` before any Edit/Write — never edit the main repo from a worktree session. The SessionStart hook prints cwd, branch, and `git worktree list` at session start; trust that, not memory.
- **Plan first for multi-file sessions.** Any session touching >2 files or producing new functionality enters plan mode and produces a written plan before implementing. **Implementation plans break down to atomic 5-step TDD per task** (write failing test → run/fail → implement → run/pass → commit), with concrete code blocks and exact commands per the `superpowers:writing-plans` skill format — phase-level or task-level summaries are not enough. For doc/config-only plans (no testable behavior), substitute read → edit → verify-by-reread → commit, with exact `old_string`/`new_string` shown. Full agreement in `docs/project-state.md` → "Session and commit mechanics".
- **Verify UI/CSS against real renders.** Screenshot the running app at the target viewport — do not inject CSS to simulate conditions; that produces false-positive bug reports.
- **Read/Grep/Glob for inspection; Bash for side effects.** Reserve Bash for build, test, git, and other commands that change state. Reuse a verification result already obtained this session rather than re-running. Complements section 2's smart-explore guidance, doesn't replace it.
- **`pnpm install` on Windows needs `NODE_OPTIONS="--use-system-ca"`.** Plain `pnpm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` against npmjs.org (the Windows cert store / Node bundled-CA mismatch). Prefix with `NODE_OPTIONS="--use-system-ca"` (PowerShell: `$env:NODE_OPTIONS="--use-system-ca"; pnpm install`). Other pnpm commands (`pnpm test:run`, `pnpm baseline`, `pnpm build`) don't hit the registry and don't need the flag.
- **Parallel Task agents for multi-target exploration.** When the task has independent read-only sub-questions, dispatch parallel sub-agents instead of serial Bash/Read. Use section 1's corpus-priming paste-block for any dispatched agent.
- **Worktree cleanup.** Run `git worktree prune` at session start.
  Merged session branches are auto-deleted on the remote; the local
  worktree admin still needs pruning.

## 6. Development workflow (v3+)

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
- **Reasoning lives in ADR 0006**; the working agreements are in
  `docs/project-state.md`. This section is the operative subset only.

### Strategist skills (the operative subset)

The repo carries a set of skills that codify the strategist's ceremony.
Use them instead of pasting the ritual into prompts or running it by
hand.

| Skill | Purpose |
|---|---|
| `/begin-session <branch>` | Worktree + prompt-copy + `pnpm install` + queue scan. Replaces Tasks 1-2 of the old prompt template. |
| `/wrap-session` | Verify → commit → push → PR → CI → squash-merge. ADR 0006's PR flow. |
| `/strategist [task]` | Load 8-doc orientation, detect drift, draft session prompts in the lean template, or enter planning conversation. |
| `/red-team-prompt <path>` | Dispatch a no-context subagent to stress-test a drafted prompt before handoff. |
| `/open-questions [subcmd]` | Manage `docs/open-questions.md`. Force explicit disposition on each handoff open-question; no silent carry. |
| `/retrospect <phase>` | Run the 4-pass phase-boundary retrospective; produce `-complete.md` + `-retrospective.md`. |

The lean prompt template (Goal / Context / Tasks / Specs / Appendix)
replaces the old worktree-boilerplate prompt format. `/strategist` uses
the lean template by default.
