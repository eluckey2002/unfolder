# Origami project — Claude guidance

## Claude-mem knowledge corpora

Knowledge corpora are pre-compressed, primed AI sessions you query like a database. They replace re-reading reference repos on every session. Always use them when available.

### Active corpora

| Corpus | Triggers (any topic / file path containing these) | Coverage |
|---|---|---|
| `paperfoldmodels-algorithm` | `paperfoldmodels`, crease pattern, fold mechanics, unfolding, face overlap, dual graph, `references/paperfoldmodels/` | 8 observations, ~13k tokens of algorithm detail |

### Required workflow (apply on every matching prompt)

**Step 1 — Load the MCP tool (once per session).** `query_corpus` is a deferred tool, so before first use:
```
ToolSearch(query="select:mcp__plugin_claude-mem_mcp-search__query_corpus", max_results=1)
```

**Step 2 — Query the corpus BEFORE reading any reference file or spawning any subagent** on a corpus's triggers:
```
query_corpus(name="paperfoldmodels-algorithm", question="<your specific question>")
```

**Step 3 — When spawning a subagent on a corpus's triggers, paste this entire block verbatim into its prompt.** The subagent does NOT see this CLAUDE.md and will read reference files unless told otherwise:
```
A knowledge corpus "paperfoldmodels-algorithm" is primed in claude-mem.
Before reading any reference files, load and query it:
  ToolSearch(query="select:mcp__plugin_claude-mem_mcp-search__query_corpus", max_results=1)
  query_corpus(name="paperfoldmodels-algorithm", question="<your question>")
Only read source files if the corpus lacks needed detail.
```

### Failure handling

If `query_corpus` returns empty / incoherent / clearly-wrong results, **surface this to the user immediately**. Do not silently fall back to `Read`. The likely fix is `rebuild_corpus` + `reprime_corpus`.

## Other rules

- For files >500 lines that aren't covered by a corpus, prefer `smart_outline` and `smart_search` (also deferred MCP tools — load via `ToolSearch` first) over `Read`.
- When you've read the same large file twice in one session, propose building a corpus.
- Long-form corpus inventory and history lives in `~/.claude/projects/-Users-eluckey-Developer-origami/memory/project_corpora.md`. Keep the table above in sync when adding/retiring corpora.
