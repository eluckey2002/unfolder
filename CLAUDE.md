# Origami project — Claude guidance

All claude-mem tools are deferred MCP. Each section's load step must run before first use.

## 1. Knowledge corpora

| Corpus | Triggers (topic words / path fragments) | Coverage |
|---|---|---|
| `paperfoldmodels-algorithm` | `paperfoldmodels`, crease pattern, fold mechanics, unfolding, face overlap, dual graph, `references/paperfoldmodels/` | 33 observations, ~18k tokens |
| `origami-v1-pipeline` | STL/OBJ parse, mesh, face adjacency, spanning tree (dihedral-weighted MST), flatten, overlap, recut, glue tabs, paginate, SVG export, `src/core/`, `src/app/`, `docs/decisions/`, pipeline architecture, three.js renderer | 56 observations, ~28k tokens |
| `origami-process` | queue, roadmap, project-state, session log, working agreement, ADR discipline, handoff, cowork, sessions 0012–0018, `docs/sessions/`, housekeeping | 53 observations, ~31k tokens |

**Workflow on any trigger match:**

1. Load once per session:
   ```
   ToolSearch(query="select:mcp__plugin_claude-mem_mcp-search__query_corpus", max_results=1)
   ```
2. Call:
   ```
   query_corpus(name="<corpus-name>", question="...")
   ```
3. Spawning a subagent on triggers? Paste this verbatim — subagents do not see CLAUDE.md:
   ```
   The corpus "paperfoldmodels-algorithm" is primed in claude-mem.
   First: ToolSearch(query="select:mcp__plugin_claude-mem_mcp-search__query_corpus", max_results=1)
   Then: query_corpus(name="paperfoldmodels-algorithm", question="...")
   Read source files only if the corpus lacks needed detail.
   ```

Empty / incoherent / clearly-wrong corpus results → surface to user immediately. Do NOT silently fall back to `Read`.

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
- You just recorded a decision-type observation and ≥5 decisions exist project-wide without a `decisions-corpus`.
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
- **Plan first for multi-file sessions.** Any session touching >2 files or producing new functionality enters plan mode and produces a written plan before implementing. Full agreement in `docs/project-state.md` → "Session and commit mechanics".
- **Verify UI/CSS against real renders.** Screenshot the running app at the target viewport — do not inject CSS to simulate conditions; that produces false-positive bug reports.
- **Read/Grep/Glob for inspection; Bash for side effects.** Reserve Bash for build, test, git, and other commands that change state. Reuse a verification result already obtained this session rather than re-running. Complements section 2's smart-explore guidance, doesn't replace it.
- **Parallel Task agents for multi-target exploration.** When the task has independent read-only sub-questions, dispatch parallel sub-agents instead of serial Bash/Read. Use section 1's corpus-priming paste-block for any dispatched agent.
