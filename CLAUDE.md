# Origami project — Claude guidance

All claude-mem tools are deferred MCP. Each section's load step must run before first use.

## 1. Knowledge corpora

| Corpus | Triggers (topic words / path fragments) | Coverage |
|---|---|---|
| `paperfoldmodels-algorithm` | `paperfoldmodels`, crease pattern, fold mechanics, unfolding, face overlap, dual graph, `references/paperfoldmodels/` | 8 observations, ~13k tokens |

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

## 3. Other rules

- When you've read the same large file twice in one session, propose building a corpus.
- Long-form corpus inventory: `~/.claude/projects/-Users-eluckey-Developer-origami/memory/project_corpora.md`. Keep the table in section 1 in sync when adding or retiring corpora.
