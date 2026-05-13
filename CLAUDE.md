# Origami project guidance

## Claude-mem corpora

Active corpora and their context blocks live in:
`~/.claude/projects/-Users-eluckey-Developer-origami/memory/project_corpora.md`

### Rules

1. Before reading a reference file in a corpus's domain, call `query_corpus` first. Fall through to Read only if the corpus lacks the needed detail.
2. For files >500 lines not in any corpus, prefer `smart_outline` / `smart_search` over Read.
3. When spawning a subagent on a corpus's domain, paste the corpus context block from `project_corpora.md` into the subagent prompt. Subagents do not see that file.
4. When you've read the same large file twice in one session, propose building a corpus.
5. If a corpus query returns empty or incoherent results, surface it to the user. Do not silently fall back to Read.
