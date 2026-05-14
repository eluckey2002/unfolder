# Housekeeping — address retrospective items

## Goal

A single maintenance commit that addresses every open queue item plus
the stale-content cleanup that Session 0007's implementation report
surfaced. After this commit lands, the queue should be effectively
empty (one new item is added — see Task 7), `project-state.md`
should reflect actual project state through Session 0007, ADR
immutability is properly scoped in `docs/decisions/README.md`, and
the missing Session 0002 session log is backfilled.

This is a **maintenance commit, not a numbered session.** No session
log file. Prompt is saved with a descriptive non-numbered name
(`housekeeping-retrospective.md`) per the convention being
formalized in this very commit.

## Pre-work consistency scan

Scan `docs/queue.md` for items intersecting this work. **All 7
existing items** intersect — that's the point of this commit.
They're either acted on directly (immutability scope, stale
reference, 0002 backfill, 0001/0002 cleanup) or promoted to
working agreements in `project-state.md` (the rest). One new item
gets added (Task 7).

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at
   `a69dcf3`. Working tree may have untracked files at `.claude/`
   and `docs/sessions/prompts/` — expected. **Per the new
   worktree-vs-direct-main rule being formalized in this commit,
   direct-`main` is the correct path for this maintenance work.**
   If you've defaulted to a worktree, fast-forward as usual at the
   end.

2. **Replace `docs/decisions/README.md`** with the content in
   **Appendix A**, copied verbatim. The change scopes ADR
   immutability to "once merged to `main`" and adds a sentence
   about pre-merge drafts being amendable.

3. **Replace `docs/queue.md`** with the content in **Appendix B**,
   copied verbatim. The format and process sections stay; the
   "Open items" section is cleared except for one new item.

4. **Edit `docs/project-state.md`** with three structural updates.
   The exact replacements are in **Appendix C**:

   a. Replace the entire "Sessions completed" section (current
      lines 17–20).
   b. Replace the entire "Sessions planned" section (current
      lines 22–40).
   c. In the "Open questions / things in flight" section (current
      lines 107–111), remove the bullet that reads
      `- Test corpus is currently empty. Will be populated in Session 6.`
      Leave the other two bullets unchanged.
   d. Replace the existing re-orientation prompt bullet (current
      lines 92–97) with the updated version in Appendix C — adds
      `git log --oneline -20` to the orientation steps.
   e. Append the five new working-agreement bullets in
      **Appendix C** to the end of the "Working agreements"
      section. They land after the artifact-maintenance bullet
      (lines 102–105).

5. **Edit `docs/roadmap.md`** to update the Main HEAD line in the
   "Where we are now" section. Change `**Main HEAD:** \`1ed6b09\`.`
   to `**Main HEAD:** \`a69dcf3\`.` (the HEAD prior to this
   housekeeping commit). The strategist owns this line; one-commit
   staleness after housekeeping is acceptable and gets resolved
   at next session-end.

6. **Create `docs/sessions/0002-read-paperfoldmodels.md`** with the
   content in **Appendix D**, copied verbatim. This is a backfilled
   session log for Session 0002, which completed pre-Cowork-transition
   without leaving a log in `main`.

7. *(Already specified in Appendix B — listed here for clarity.)*
   The single new queue item added in Task 3 is:

   > `[convention] Consolidate the working-agreements section in
   > project-state.md into themed subsections when it starts feeling
   > unwieldy. Currently at ~22 bullets after this housekeeping
   > commit. Surfaced post-0007 housekeeping.`

   This goes into `docs/queue.md`'s "Open items" section as the only
   open item.

8. **Stage all changes and commit** with this message:

   ```
   docs: housekeeping — close queue items, promote process learnings, cleanup
   ```

   Files to stage:
   - `docs/decisions/README.md` (modified)
   - `docs/queue.md` (modified — replacement)
   - `docs/project-state.md` (modified — multiple sections)
   - `docs/roadmap.md` (modified — one line)
   - `docs/sessions/0002-read-paperfoldmodels.md` (new)
   - `docs/sessions/prompts/housekeeping-retrospective.md` (new —
     this prompt file, per the new prompt-commit-cadence rule)

9. **If you worked in a worktree**, fast-forward `main`. If you
   committed directly on `main` per the new rule, skip.

10. **Report back:** final `main` HEAD hash and confirmation that
    all 6 files staged correctly. **No implementation report
    needed** — this is mechanical doc cleanup with no decisions to
    surface.

## Notes

- Verbatim content in appendices; no specs needed since this is
  all doc text where wording IS the deliverable.
- Do not run `pnpm type-check`, `pnpm test:run`, or `pnpm build` —
  no source code changes in this commit; these would be no-ops.
- If you spot factual problems in any appendix while applying it
  (e.g., a session log entry that doesn't match what really
  happened), flag in your report. Don't edit appendix content.
- The 0002 session log backfill is intentionally reconstructive — it
  fills a gap, marked as backfilled. Future readers will see it
  exists with the "backfilled" note and can trace original details
  in the commit history if needed.

---

## Appendix A — `docs/decisions/README.md` (full file, verbatim)

```markdown
# Architecture Decision Records

This directory holds Architecture Decision Records (ADRs) — short documents that capture significant decisions made during the project.

## Naming

Files are named `NNNN-short-title.md` (zero-padded number, kebab-case title). Example: `0001-use-half-edge-mesh.md`.

## Format

Each ADR has three sections:

- **Context** — what situation or problem prompted the decision
- **Decision** — what we decided to do
- **Consequences** — what becomes easier or harder as a result

Keep them short. A few paragraphs each is enough.

## Immutability

ADRs are immutable once merged to `main`. Pre-merge drafts — for example,
commits sitting in a worktree branch that hasn't been fast-forwarded into
`main` yet — can be amended freely. The strict rule applies only after the
ADR has landed on `main`. If a decision is superseded after that point,
write a new ADR that references the old one; don't edit the original.
```

---

## Appendix B — `docs/queue.md` (full file, verbatim)

```markdown
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
`cleanup`, `process`). Add new tags as needed.

## Process

- The strategist adds items when a session surfaces a deferral, in the
  moment, and calls it out in chat — no silent additions.
- The strategist reads this file at the start of every session and
  surfaces anything that intersects scope.
- When items naturally cluster, the strategist proposes a small
  housekeeping commit to clear them. Likely every 3–5 implementation
  sessions, or sooner if items accumulate.
- Items unaddressed for ~5 sessions get re-evaluated. Schedule or drop;
  no indefinite limbo.
- When a session resolves an item, the session deletes the line here
  and the session log records what closed. Housekeeping commits clear
  items the same way.

## Open items

- [convention] Consolidate the working-agreements section in
  `project-state.md` into themed subsections when it starts feeling
  unwieldy. Currently at ~22 bullets after this housekeeping commit.
  Surfaced post-0007 housekeeping.
```

---

## Appendix C — `docs/project-state.md` edits

### C.1 — Replace "Sessions completed" section (lines 17–20)

Replace with:

```markdown
## Sessions completed

- **Session 0001 — Project skeleton.** Directory structure, gitignore, three commits. Log: `docs/sessions/0001-project-skeleton.md`.
- **Session 0002 — Read `paperfoldmodels`.** Reference-implementation writeup at `docs/references/paperfoldmodels.md`. Log: `docs/sessions/0002-read-paperfoldmodels.md` (backfilled).
- **Session 0003 — First ADR.** ADR 0001 — v1 pipeline architecture (staged pure functions). Log: `docs/sessions/0003-first-adr.md`.
- **Session 0004 — Queue and working agreements.** `docs/queue.md` established; first working-agreement consolidation. Log: `docs/sessions/0004-queue-and-working-agreements.md`.
- **Session 0005 — Bootstrap the build.** Vite + TypeScript + pnpm + Vitest toolchain. Log: `docs/sessions/0005-bootstrap-the-build.md`.
- **Session 0006 — Generate the test corpus.** Three.js-generated ASCII STL files for tetrahedron, cube, octahedron. Log: `docs/sessions/0006-generate-test-corpus.md`.
- **Session 0007 — Mesh loading.** ASCII STL parser in `src/core/` with vertex dedup; three.js viewport in `src/app/` with OrbitControls. First `src/core/` and `src/app/` code. Log: `docs/sessions/0007-mesh-loading.md`.
```

### C.2 — Replace "Sessions planned" section (lines 22–40)

Replace with:

```markdown
## Sessions planned

Sessions 0008 through 0011 complete v1. Detailed plan in `docs/roadmap.md`.

- **Session 0008** — Face adjacency graph (dual graph).
- **Session 0009** — Spanning tree (cut/fold edge classification).
- **Session 0010** — Flatten — 2D coordinates for every triangle by walking the spanning tree.
- **Session 0011** — SVG export. v1 complete: end-to-end pipeline on platonic solids.
```

### C.3 — "Open questions / things in flight" cleanup (lines 107–111)

Remove this bullet (the corpus is now populated):

```
- Test corpus is currently empty. Will be populated in Session 6.
```

Leave the other two bullets (project name, GitHub remote) unchanged.

### C.4 — Replace the re-orientation prompt bullet (lines 92–97)

Replace the existing bullet with:

```markdown
- **When opening a new Cowork chat to resume the project**, paste this
  re-orientation message: "Continue the unfolder project. Read
  `docs/project-state.md`, `docs/project-rationale.md`, and
  `docs/project-history.md` in that order, then `docs/queue.md` and the
  two most recent session logs in `docs/sessions/`. Then run
  `git log --oneline -20` to catch any work that landed outside this
  chat. Then we'll plan Session NNNN."
```

### C.5 — Append five new working-agreement bullets

Append at the very end of the "Working agreements" section (after the
existing artifact-maintenance bullet on lines 102–105):

```markdown
- **Before writing a prompt that involves new tools, libraries, or
  restructuring**, the strategist does three things: (a) fetches current
  documentation for any external library used, (b) probes the actual
  response shape with a sample call rather than assuming, and (c) scans
  related files for cross-references that could go stale after the
  change. All three, not any one in isolation.
- **Worktree by default for numbered sessions; direct-`main` OK for
  maintenance commits.** The pre-merge amendment freedom that worktrees
  enable is the actual reason for the rule — bugs caught between commit
  and merge can be folded in without violating immutability. Maintenance
  commits don't carry that risk surface and can land directly.
- **Work gets a numbered session if it matches an entry in the v1 (or
  later) session plan, or produces new functionality, code, or
  substantive structural changes.** Otherwise it lands as a plain
  maintenance commit — no session log, no number, descriptive prompt
  filename without numeric prefix, clear conventional-commit message.
- **Prompt files commit with the session log (or commit) they describe**,
  in the same commit. Amendment/merge sub-prompts get swept in by the
  next session's commit if they weren't part of the original.
- **Prompts specify behavior, not code, for implementation work.**
  Algorithm code, render code, and test bodies are described as
  specifications; Claude Code writes the implementation using current
  library API knowledge. Verbatim content in appendices is reserved for
  type contracts, configuration files, and document content where the
  wording IS the deliverable. Claude Code produces an implementation
  report at session-end naming decisions made, deviations from spec,
  library APIs verified, and concerns worth a strategist eye.
```

---

## Appendix D — `docs/sessions/0002-read-paperfoldmodels.md` (full file, verbatim)

```markdown
# Session 0002 — Read paperfoldmodels

*Backfilled session log. Session 0002 was completed pre-Cowork-transition;
this log is reconstructed from project history and the resulting commits.*

## What was attempted

Read `paperfoldmodels` — a Python reference implementation of a papercraft
unfolding algorithm — and produce a writeup of how it works, what we'd
reuse, and what we'd intentionally do differently. Reading was ordered
before bootstrapping the codebase, by Evan's preference, so we'd have
vocabulary and a mental model before naming things in our own code.

## What shipped

`docs/references/paperfoldmodels.md` — a structured writeup covering:
what `paperfoldmodels` is, the algorithm in plain English (the three-step
structure: MST → flatten → cut overlaps), data structures used by the
reference (OpenMesh `TriMesh`, NetworkX dual graph, parallel arrays for
visualization metadata), non-obvious choices in the implementation
(length-weighted MST, half-edge bookkeeping, greedy set-cover for cut
placement), what we'd apply to our work, what we'd intentionally do
differently in TypeScript, and honest uncertainties about the original
code's correctness in edge cases.

## What's next

Session 0003 — first ADR. Based on what we learned from `paperfoldmodels`,
decide and document the v1 algorithm and data structures.

## Decisions made or deferred

- **Reading-before-bootstrapping** prioritized correctness of foundation
  over momentum. Evan accepted the slower path knowing the cost.
- **Read for understanding, not reuse.** We extracted concepts and lessons
  rather than transcribing the Python implementation.
- **Future references** — PolyZamboni (v3), Takahashi's paper (v3
  algorithmic core), others as relevant — deferred until the relevant
  phase needs them.

## Queue updates

No items added or closed in this session. The queue itself didn't exist
until Session 0004.

---

*Backfilled in the housekeeping commit following Session 0007.*
```
