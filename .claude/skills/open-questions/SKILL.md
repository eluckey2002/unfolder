---
name: open-questions
description: Manage the docs/open-questions.md ledger. Force explicit disposition (close/carry/queue/drop) on each open question from session handoffs — no silent carry. Use when the user types /open-questions, "scan open questions", or "review session handoff questions".
---

# Open questions

Manage the ledger at `docs/open-questions.md`. Default subcommand is `scan`.

## Subcommands

- `scan` (default) — read last session log's open-questions block, walk each item
- `list` — show current ledger contents
- `add <text>` — add a new entry directly
- `close <id> <resolution>` — close with resolution note
- `carry <id> <reason> <target-session>` — carry forward with reason + target
- `queue <id> <reason>` — promote to `docs/queue.md`
- `drop <id> <reason>` — drop with reason

## Step 1 — Read the ledger (or create it)

If `docs/open-questions.md` doesn't exist, create with this header:

```markdown
# Open questions ledger

Tracks unresolved questions from session handoffs. Every entry has an explicit disposition — no silent carry. Closed items kept for traceability.

## Open

## Resolved
```

## Step 2 — Execute the subcommand

### scan (default)

1. Find the most recent session log in `docs/sessions/` (sorted by filename — works because numbers are zero-padded).
2. Extract the "Open questions for the strategist" block. If missing, print `No open questions in <filename>. Ledger unchanged.` and stop.
3. For each item, prompt the user with the question text and these options: **close** / **carry** / **queue** / **drop** / **skip-for-now**.
4. Each item gets an ID using the scheme `[Q-<session>-<n>]` where `<session>` is the session number parsed from the log filename (e.g., `0024` from `0024-strategist-skills.md`) and `<n>` increments from 1 for each item in that log. Apply chosen disposition by editing `docs/open-questions.md` (entries always carry their ID):
   - close → add entry to `## Resolved` with resolution + today's date
   - carry → add to `## Open` with reason + target session
   - queue → add a line to `docs/queue.md` with appropriate category tag AND add to `## Resolved` noting "queued <date>"
   - drop → add to `## Resolved` with drop reason
   - skip-for-now → no change; will resurface next scan

### list

Print the contents of `docs/open-questions.md`. If empty (only headers), print `Ledger empty.`

### add <text>

Add a new entry to `## Open` with ID `[Q-<session>-<n>]` where `<session>` is the current session number from the most recent log, and `<n>` is one greater than the highest existing `<n>` for that session prefix across both `## Open` and `## Resolved` sections (scan the ledger to determine).

### close <id> <resolution>

Move the entry from `## Open` to `## Resolved` with resolution text and today's date.

### carry <id> <reason> <target-session>

Update the entry in `## Open` with new reason and target. Format: `- [Q-<session>-<n>] <text> _(carried → session <target-session>; reason: <reason>)_`

### queue <id> <reason>

Two-file update. Do in this order: first add a line to `docs/queue.md` with the entry text + an appropriate category tag (`decision`, `cleanup`, `process`, `convention`, etc.); second, mark the ledger entry resolved with disposition `queued <date>`. If either step fails, surface the partial state to the user before stopping — do not leave one file updated and the other not.

### drop <id> <reason>

Move to `## Resolved` with drop reason.

## Step 3 — Print summary

After any state change, print: `Ledger updated. Open: <N>. Resolved this run: <M>.`

---

**Anti-patterns to avoid:**

- Silently carrying any item. Disposition must be explicit.
- Modifying a session log to change its open-questions block. The log is immutable; the ledger is the working surface.
- Auto-resolving items from context. The user decides each disposition.
