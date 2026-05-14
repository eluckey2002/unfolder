# Session 0004 — Establish queue and update working agreements

## Goal

Create `docs/queue.md` (a managed list of deferred items the strategist
will actively maintain), populate it with the four items deferred during
Session 0003, and update `docs/project-state.md` to capture three new
working agreements that emerged in Session 0003: the autonomy framework,
the merge-to-main session-completion criterion, and the queue-management
process.

This is a small docs-only session. It takes the Session 0004 slot;
build bootstrapping (originally planned as Session 0004) shifts to
Session 0005, and every subsequent planned session shifts by one. The
`project-state.md` "Sessions planned" list needs that shift applied.

## Tasks

1. **Create `docs/queue.md`** with the content in **Appendix A** below,
   copied verbatim.

2. **Edit `docs/project-state.md`** to add the new working agreements
   listed in **Appendix B**. Insert them into the existing "Working
   agreements" section, after the last existing bullet. Do not modify
   any other content in `project-state.md`.

3. **Edit `docs/project-state.md`'s "Open questions / things in flight"
   section** to remove items that have been resolved or relocated. See
   **Appendix C** for the specific cleanup.

4. **Edit `docs/project-state.md`'s "Sessions planned" list** to shift
   every entry by one (Session 4 → 5, Session 5 → 6, …, Session 10 →
   11). See **Appendix C** for the exact list to write.

5. **Create `docs/sessions/0004-queue-and-working-agreements.md`** with
   the content in **Appendix D**, copied verbatim.

6. **Stage all files and commit** with this message:

   ```
   docs: establish queue.md and capture working-agreement updates
   ```

7. **Report the commit hash back.**

## Notes

- The queue items listed in Appendix A reflect what was deferred during
  Session 0003 — surface any additional items you notice while making
  these edits before adding them to the queue. Do not silently add
  items not listed here.
- Do not touch `docs/sessions/prompts/` (still pending convention).
- Do not delete the worktree from Session 0003.

---

## Appendix A — `docs/queue.md` content

````markdown
# Queue

This file tracks deferred items the strategist actively manages between
sessions: small documentation updates, convention decisions awaiting a
natural moment, discovered issues that don't justify their own session
yet, and follow-up edits queued during work on something else.

This file is for *tactical* follow-ups. *Strategic* unknowns (final
project name, GitHub remote visibility, license commitment) live in
`project-state.md`'s "Open questions / things in flight" section.

## Format

Each item is one or two lines:

```
- [category-tag] One-line description. Surfaced NNNN.
```

Category tags are free-form (current ones: `convention`, `docs`,
`cleanup`). Add new tags as needed.

## Process

- The strategist adds items when a session surfaces a deferral, in the
  moment, and calls it out in chat — no silent additions.
- The strategist reads this file at the start of every session and
  surfaces anything that intersects scope.
- When items naturally cluster, the strategist proposes a small
  housekeeping session to clear them. Likely every 3–5 implementation
  sessions, or sooner if items accumulate.
- Items unaddressed for ~5 sessions get re-evaluated. Schedule or drop;
  no indefinite limbo.
- When a session resolves an item, the session deletes the line here
  and the session log records what closed.

## Open items

- [convention] Decide commit cadence for strategist prompt files at
  `docs/sessions/prompts/`. Currently untracked. Surfaced 0003.
- [docs] Update `docs/decisions/README.md` to scope ADR immutability to
  "once merged to `main`"; add a sentence noting pre-merge drafts can
  be amended. Surfaced 0003.
- [cleanup] Backfill Session 0001 and 0002 session-log files in `main`.
  They exist in worktrees but never landed. Surfaced 0003.
- [docs] Add a "standard re-orientation prompt" snippet to
  `project-state.md` for opening a new Cowork chat (tells the new
  strategist instance which docs to read to get up to speed). Surfaced
  0003.
````

---

## Appendix B — Additions to `project-state.md` working agreements

Add these four bullets to the end of the "Working agreements" section,
preserving the existing bullet formatting style:

````markdown
- **Strategist autonomy is calibrated by stakes.** High-confidence prose
  decisions inside Evan-approved structures flow silently. Medium-
  confidence calls on permanent artifacts (ADR substance, commit
  messages, file names) get surfaced briefly then proceeded with. Low-
  confidence calls and anything crossing a project-shape boundary
  (conventions, scope, working agreements) get surfaced and wait for
  Evan's input.
- **Session done = merged to `main`.** Each session ends with the work
  merged to `main`, not just committed somewhere. Pre-merge worktree
  commits are still drafts; immutability applies once merged.
- **The strategist actively manages deferrals via `docs/queue.md`.** No
  item is silently dropped; no item lingers indefinitely. See the
  process in `docs/queue.md`.
- **When opening a new Cowork chat to resume the project**, paste this
  re-orientation message: "Continue the unfolder project. Read
  `docs/project-state.md`, `docs/project-rationale.md`, and
  `docs/project-history.md` in that order, then `docs/queue.md` and the
  two most recent session logs in `docs/sessions/`. Then we'll plan
  Session NNNN."
````

---

## Appendix C — `project-state.md` edits

### "Open questions / things in flight" cleanup

Remove these two bullets (Session 0003 is complete):

- `Session 3 (first ADR) is the next session.`
- `The paperfoldmodels writeup may benefit from Evan skimming it before
  Session 3. If he hasn't, suggest he does.`

The remaining bullets in that section (test corpus, GitHub remote,
project name) stay as-is. Do not edit them.

### "Sessions planned" list — shift all entries by one

Replace the existing bullets in the "Sessions planned" section with
exactly this list (the planned numbers all advance by one because the
queue/working-agreements work takes the Session 0004 slot):

````markdown
Sessions 4 through 11 complete v1. Detailed plan:

- **Session 4** — Establish queue and working-agreement updates. (This
  session.)
- **Session 5** — Bootstrap the build (Vite + TypeScript + pnpm). Dev
  server, hello world.
- **Session 6** — Mesh generation script. Generate STL files for the
  test corpus (tetrahedron, cube, octahedron) programmatically.
- **Session 7** — Mesh loading. Parse STL, render triangles on a canvas
  via three.js.
- **Session 8** — Face adjacency graph (dual graph).
- **Session 9** — Depth-first spanning tree (cut/fold edge
  classification).
- **Session 10** — Unfolding rotation math (2D coordinates for every
  triangle).
- **Session 11** — SVG export. v1 complete: end-to-end pipeline on
  platonic solids.
````

Note: the introductory line changes from "Sessions 3 through 10 complete
v1" to "Sessions 4 through 11 complete v1."

---

## Appendix D — Session log content

````markdown
# Session 0004 — Establish queue and update working agreements

## What was attempted

Stand up `docs/queue.md` as the strategist's managed list of tactical
deferrals, and capture three working-agreement updates that emerged
during Session 0003 (autonomy framework, merge-to-main as session
completion, queue-management process) plus a re-orientation prompt
convention for new Cowork chats.

## What shipped

`docs/queue.md` with its format and process documented, plus four open
items inherited from Session 0003. `docs/project-state.md` updated with
four new working agreements and cleaned-up open-questions section. No
ADRs or code changes.

## What's next

Session 0005 — bootstrap the build: Vite + TypeScript + pnpm + Vitest,
dev server, hello world. First session that lands code.

## Decisions made or deferred

- Format for `docs/queue.md`: flat list with category tags, no statuses,
  no per-item files. Chosen for project size — heavier ceremony would
  outweigh value at two collaborators and ~5–10 typical open items.
- The strategist owns queue management; items get added in the moment,
  reviewed at session start, and bundled into housekeeping sessions
  when they cluster.
````
