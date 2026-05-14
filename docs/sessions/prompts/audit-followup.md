# Audit follow-up — commit the 2026-05-14 assessment, queue findings, mark ADR 0003 superseded

## Goal

A single maintenance commit that closes out the 2026-05-14 codebase
assessment:

1. Commits the assessment doc (`docs/audits/codebase-assessment-2026-05-14.md`)
   — already written into the working tree, untracked.
2. Queues the four genuine act-on findings (A1, A4, A5, A6) in
   `docs/queue.md` for future sessions.
3. Resolves finding B10 directly: amends `docs/decisions/README.md` to
   permit a supersession status banner, then adds that banner to
   `docs/decisions/0003-spanning-tree-algorithm.md`.

This is a **maintenance commit, not a numbered session.** No session
log. Doc-only — no source code touched, no ADR content edited (the ADR
0003 change is a metadata banner, see Task 5). Per the
worktree-vs-direct-main working agreement, **direct-`main` is the
correct path** for this work.

## Context

Evan ran a four-axis read-only codebase audit on 2026-05-14, mid-v2,
between sessions 0016 (automatic recut) and 0017 (glue tabs). The
assessment doc is already in the working tree. Its **§12 — Strategist
triage** is the disposition of record: it verifies the audit's
load-bearing claims, recalibrates several P1s the audit over-weighted,
and names the genuine act-on set. This commit executes §12. Zero P0
findings; nothing here blocks v2.

The B10 disposition is the one judgment call worth flagging. The audit
flagged ADR 0003 as lacking a "Superseded by 0004" marker. The
decisions README currently says "don't edit the original." Resolution:
a status banner is navigational metadata, not a content edit — the
Context/Decision/Consequences sections stay frozen. The README gets one
sentence carving this out explicitly so the banner and the immutability
rule are coherent. B10 is resolved in this commit rather than queued
because it is a one-line doc change and resolving it *is* maintenance
work.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at `c24b291`
   (the 0017 commit). The working tree has two untracked paths:
   `docs/audits/` and `test/corpus/OBJ format/`. **Only `docs/audits/`
   is part of this commit** — `test/corpus/OBJ format/` is Evan's
   working content and must not be staged. Use explicit `git add`
   paths, never `git add -A`.

2. **Stage the assessment doc as-is.** `docs/audits/codebase-assessment-2026-05-14.md`
   is already written. **Do not modify it.** Just stage it.

3. **Edit `docs/queue.md`.** Append the four items in **Appendix A**,
   verbatim, to the end of the "Open items" section (after the existing
   `parseStl` negative-path item). Nothing else in the file changes.

4. **Replace `docs/decisions/README.md`** with the full content in
   **Appendix B**, copied verbatim. The only change versus the current
   file is a new paragraph at the end of the "Immutability" section
   permitting a supersession status banner.

5. **Edit `docs/decisions/0003-spanning-tree-algorithm.md`.** Insert the
   status banner in **Appendix C** immediately after the H1 title line
   (line 1), with a blank line before and after, so it sits between the
   title and `## Context`. **Nothing else in the file changes** — the
   Context, Decision, and Consequences sections are frozen.

6. **Stage and commit.** Use the commit message in **Appendix D**.
   Files to stage:
   - `docs/audits/codebase-assessment-2026-05-14.md` (new)
   - `docs/queue.md` (modified)
   - `docs/decisions/README.md` (modified)
   - `docs/decisions/0003-spanning-tree-algorithm.md` (modified)
   - `docs/sessions/prompts/audit-followup.md` (new — this prompt file,
     per the prompt-commits-with-its-commit rule)

7. **Report back:** final `main` HEAD hash and confirmation that all 5
   files staged correctly — and that `test/corpus/OBJ format/` was *not*
   staged. **No implementation report needed** — this is mechanical doc
   work; all decisions were already triaged in the assessment's §12.

## Notes

- Do not run `pnpm type-check`, `pnpm test:run`, or `pnpm build` — no
  source code changes; these would be no-ops.
- A1 / A4 / A5 / A6 are *queued*, not resolved here — they are code and
  test work for future sessions. B10 is the only finding resolved
  in-commit.
- If you spot a factual problem in any appendix while applying it, flag
  it in your report; don't edit appendix content on your own.

---

## Appendix A — `docs/queue.md` "Open items" additions (append verbatim)

```markdown
- [robustness] Disconnected dual graph is silently mishandled: Kruskal
  produces a forest, non-root component faces get `parent[i] === -1`
  (ambiguous with the root marker), and `buildLayout` then reads
  undefined positions for unreachable faces. Needs an explicit
  connectedness check — a throw-guard in `buildSpanningTree`, or a
  formal ADR 0006 if the contract deserves one.
  `src/core/spanning-tree.ts`, `src/core/flatten.ts`. Surfaced by the
  2026-05-14 codebase assessment (finding A1).
- [test] Promote the overlap-free invariant from `it.todo` to a real
  property test. It is v2's headline guarantee (ADR 0005) and is
  currently only checked by the baseline harness on the corpus.
  `test/property/pipeline.test.ts`. Surfaced by the 2026-05-14 codebase
  assessment (finding A4).
- [test] Add a property test for `dihedral.ts`: weights land in
  `[0, π]` and the stage is deterministic. `src/core/dihedral.ts` has
  no property test. Surfaced by the 2026-05-14 codebase assessment
  (finding A5).
- [test] Assert `Piece` structure in `recut.test.ts` — the pipeline's
  output type currently has zero test references. `src/core/recut.ts`.
  Surfaced by the 2026-05-14 codebase assessment (finding A6).
```

---

## Appendix B — `docs/decisions/README.md` (full file, verbatim)

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

The one permitted exception is a **status banner** — a single Markdown
blockquote placed directly under a superseded ADR's title, pointing
forward to the ADR that replaced it (e.g. `> **Status:** Superseded by
ADR 0004`). This is a navigational annotation, not a content edit: the
Context, Decision, and Consequences sections stay frozen. It exists so a
reader who lands on the old ADR is not silently misled into thinking the
decision still stands.
```

---

## Appendix C — `docs/decisions/0003-spanning-tree-algorithm.md` status banner

Insert this line between the H1 title and `## Context`, with a blank
line on each side:

```markdown
> **Status:** Superseded by [ADR 0004](0004-dihedral-weighting.md) — the v2 dihedral-weighted MST. The decision recorded below (plain DFS for v1) is preserved as historical record; it is no longer the live algorithm.
```

After the edit, the top of the file reads:

```markdown
# ADR 0003: Plain DFS spanning tree for v1, weighted MST deferred to v2

> **Status:** Superseded by [ADR 0004](0004-dihedral-weighting.md) — the v2 dihedral-weighted MST. The decision recorded below (plain DFS for v1) is preserved as historical record; it is no longer the live algorithm.

## Context
```

---

## Appendix D — commit message

```
docs: audit follow-up — commit 2026-05-14 assessment, queue findings, mark ADR 0003 superseded

Commits the four-axis codebase assessment conducted mid-v2 between
sessions 0016 and 0017. The doc's section 12 carries the strategist
triage of its findings and is the disposition of record.

Acted on here:
- ADR 0003 gets a "Superseded by 0004" status banner. The decisions
  README is amended to permit such banners as navigational metadata —
  not a content edit, so consistent with ADR immutability. Resolves
  audit finding B10.

Queued in docs/queue.md for future sessions:
- A1 — disconnected dual graph silently mishandled (connectedness guard)
- A4 — promote the overlap-free invariant from it.todo to a property test
- A5 — add a dihedral.ts property test
- A6 — assert Piece structure in recut.test.ts

Not acted on, with reasoning in section 12: D2/A8 (vite-node — verified
non-finding, it is in devDeps), A2 (winding — already owned by ADR
0004), A3 (manifold guard — unreachable through the type system), A7
(CI — gated on the GitHub-remote decision), B12 (phase docs — by
design). No P0 findings; nothing blocks v2.
```
