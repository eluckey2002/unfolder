# Maintenance commit — v3-boundary housekeeping

## Context

v2 is complete and merged; v3 (quality output) is about to start. Before the first v3 session, this maintenance commit clears the accumulated housekeeping so v3 starts from a clean base.

This is a maintenance commit, not a numbered session: work directly on `main`, no session log, no session number. The commit message carries the handoff information. This prompt is saved at `docs/sessions/prompts/v3-boundary-housekeeping.md` — include it in the commit.

## Tasks

Six pieces. One `chore:` maintenance commit is the expected shape and keeps the handoff-in-commit-message simple; split into a small number of typed Conventional Commits only if you judge that clearly cleaner — if you split, put the handoff summary in the last commit's body.

### 1. Clear the four housekeeping queue items

From `docs/queue.md`, resolve and delete these four lines:

a. **parseStl negative-path tests.** Add two unit tests for `src/core/parse-stl.ts`'s documented-but-uncovered error paths (see `parse-stl.ts:11-13`): a non-finite coordinate (e.g. `vertex NaN 0 0`) and a mid-triangle truncation (file ends after only 1 or 2 vertex lines). Both should assert the parser throws.

b. **dihedral property test.** Add a property test for `src/core/dihedral.ts`: every computed weight lands in `[0, π]`, and the stage is deterministic (same input → same output). Use the existing `fast-check` setup and arbitraries the other property tests use.

c. **baseline-pipeline paginate mislabel.** In `scripts/baseline-pipeline.ts`, `paginate` currently runs inside the `recut` try-block, so a `paginate` throw is mislabelled "failed at recut". Give `paginate` its own try-block with an accurate label.

d. **Machinery prune** (v2 retrospective Decision 3). In `docs/strategist-protocol.md`: remove the observer-mode content throughout — the clause in the opening paragraph, the bullet in the Roles list, the dedicated "Observer-mode rules" section, and the mention in "When this doc is consulted" — since it went unused for all of v2. Also resolve the `<short-sha>` field in the handoff status block template: **drop it** — handoff blocks carry the commit subject(s) only.

Delete each of these four lines from `docs/queue.md` as it's resolved. Leave the two `[pilot]` lines (live state artifact, role inversion) — those are experiments to schedule, not housekeeping.

### 2. Refresh the stale README

`README.md`'s "Status" and "License" sections are stale. Update Status to reflect v2 complete/merged and v3 current with plan pending (pipeline now ten stages: parse → adjacency → dihedral weights → spanning tree → flatten → overlap detect → recut → tabs → paginate → emit). Change "MIT (planned)" to reflect MIT is committed — `LICENSE` is in the repo.

### 3. Prune the stale worktrees

`git worktree list` shows seven prunable worktrees. Run `git worktree prune`. Then delete each leftover `claude/*` branch only if `git branch --merged main` confirms it's fully merged.

### 4. Gitignore the OBJ-format provenance archive

Add `test/corpus/OBJ format/` to `.gitignore` — it's a provenance archive, not imported by anything (2026-05-14 audit §7.2).

### 5. Log the decisions

Two entries to `docs/decisions-log.md`: the `<short-sha>` field dropped; the `test/corpus/OBJ format/` models gitignored rather than committed.

### 6. Commit

Commit message body carries the handoff info: branch `main`; what the commit does; queue items closed; decisions logged. Include this prompt file in the commit.

## Verification

- `pnpm type-check` clean.
- `pnpm test:run` — new parseStl and dihedral tests pass; report the new total (don't predict it).
- `pnpm build` clean.
- `pnpm baseline` runs clean across all 11 models; output table unchanged.
- `git worktree list` shows only the main checkout; `git status` clean afterward.

## Report back

An implementation report: what landed, the new test total, any deviations, anything that surprised you, anything worth a strategist eye.
