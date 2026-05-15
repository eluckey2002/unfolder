# Session 0020 — Development flow setup

## Goal

Stand up the v3 development flow: a PR-based merge path with CI as the
safeguard layer. This session creates ADR 0006, the PR template, a CI
baseline guard, the descriptive branch-naming convention, the
prompt-preflight checklist, and the doc-coherence updates that keep
`CLAUDE.md`, `project-state.md`, and `roadmap.md` in sync with the new
flow.

This is a **numbered session** — new functionality and substantive
structural change. It runs in a **worktree** and ends with a session
log. But it runs under the *old* flow (worktree → fast-forward to
`main`): it is building the PR flow, so it cannot run under it. Session
0021 is the first to run PR-style.

## Context

v2 closed and the project went public with CI, but the CI workflow
runs on push to `main` — it fires *after* the merge, so it gates
nothing. And the working method lives in prose that depends on being
remembered; v1/v2's recurring failures (outside-chat drift, a prompt
edited after handoff, an unwritten branch-naming rule, the CLAUDE.md
corpus table drifted two corpora out of sync) are all that same shape.
ADR 0006 — created in this session — records the decision and the
reasoning. This session implements its minimum-viable slice. The
linter, diff-aware nudges, size-threshold warning, and process-lint
named in ADR 0006 are a deliberate fast-follow and are **not** in this
session's scope.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at `3e33524`
   (the v3-boundary housekeeping commit). If it has advanced, surface
   it and proceed. Create the worktree as `session/0020-dev-flow-setup`
   — use that exact branch name, not an auto-generated one. Run
   `pnpm install` (fresh worktrees lack `node_modules`).

2. **Create `docs/decisions/0006-pr-based-development-flow.md`** with
   the content in **Appendix A**, copied verbatim.

3. **Create `.github/pull_request_template.md`** with the content in
   **Appendix B**, copied verbatim.

4. **Extend `.github/workflows/ci.yml`.** Add a baseline-guard step to
   the existing `verify` job, after the `pnpm build` step. Specified
   as behavior — **write the YAML using current action/tool
   conventions, not pinned from memory**; the existing workflow is the
   style reference. The new step:
   - runs `pnpm baseline`;
   - then fails the job if `docs/baseline-pipeline.md` is no longer
     byte-identical to its committed state (`git diff --exit-code
     docs/baseline-pipeline.md`) — **unless** the PR carries a label
     named `baseline-change`, in which case an intentional
     regeneration is allowed. Read the label from the standard GitHub
     Actions pull-request event context; write the YAML with current
     conventions, not pinned from memory. The `baseline-change` label
     is the single mechanism — the PR template (Appendix B)
     references it; do not introduce an alternative.
   - Leave the existing `push: main` trigger in place — it becomes a
     post-merge backstop; a failure there means something bypassed the
     PR flow.

5. **Edit `docs/strategist-protocol.md`** — add the prompt-preflight
   checklist as a new section, content in **Appendix C**. It belongs
   in `strategist-protocol.md` because it is a strategist/Claude Code
   coordination convention, alongside the handoff-block definition.
   Add it as the **final section** of the doc — do not Replace
   existing text, only append. (The doc was edited by the v3-boundary
   housekeeping commit; appending as the last section sidesteps any
   drift.)

6. **Edit `CLAUDE.md`** — three changes, all in **Appendix D**:
   - D.1 — replace section 1 (`## 1. Knowledge corpora` through the
     line before `## 2.`) in full.
   - D.2 — in section 3, delete one bullet.
   - D.3 — add a new `## 6. Development workflow (v3+)` section, and
     add one bullet to section 5.

7. **Edit `docs/project-state.md`** — two edits in **Appendix E**:
   add the PR-flow working agreement to "Session and commit
   mechanics", and add ADR 0006 to the "Where to look" ADR list. Each
   gives exact existing text and its replacement; if the existing text
   has drifted, surface it and proceed.

8. **Edit `docs/roadmap.md`** — two edits in **Appendix F**: update
   "Where we are now", and add a `## v3 session plan` section. Same
   drift-safety note.

9. **Write the session log** at `docs/sessions/0020-dev-flow-setup.md`
   — the project's standard "What was attempted / What shipped /
   What's next / Decisions made or deferred" format, ending with the
   handoff status block defined in `strategist-protocol.md` under
   `## Handoff status block (session log extension)`.

10. **Stage and commit.** Files:
    - `docs/decisions/0006-pr-based-development-flow.md` (new)
    - `.github/pull_request_template.md` (new)
    - `.github/workflows/ci.yml` (modified)
    - `docs/strategist-protocol.md` (modified)
    - `CLAUDE.md` (modified)
    - `docs/project-state.md` (modified)
    - `docs/roadmap.md` (modified)
    - `docs/sessions/0020-dev-flow-setup.md` (new)
    - `docs/sessions/prompts/0020-dev-flow-setup.md` (new — this
      prompt file; copy it from the main checkout into the worktree,
      do not reconstruct it)

    Commit message:

    ```
    feat: PR-based development flow and CI safeguards (ADR 0006)

    Adds ADR 0006, the PR template, a CI baseline guard, the
    descriptive branch-naming convention, the prompt-preflight
    checklist, and the doc-coherence updates that bring CLAUDE.md,
    project-state.md, and roadmap.md in line with the new flow.
    The linter, diff-aware nudges, size threshold, and process-lint
    named in ADR 0006 are a deliberate fast-follow, not in this
    session.
    ```

## Verification

- `pnpm install`, then `pnpm type-check` clean, `pnpm test:run`
  passing (report the total — do not predict it), `pnpm build` clean.
- `pnpm baseline` runs clean and `docs/baseline-pipeline.md` is
  unchanged — this session touches no pipeline code, so the baseline
  must not move.
- The CI workflow YAML is valid (parses; the new step is well-formed).
- `.github/pull_request_template.md` renders as Markdown.
- No source code under `src/` was changed — this is a docs-and-infra
  session.

## GitHub settings — for Evan, not Claude Code

Two one-time settings that are not repo artifacts and cannot be
committed. Claude Code should **not** attempt these; list them in the
report as outstanding:

- **Branch protection on `main`:** require a PR and a passing CI
  `verify` check to merge; require squash-merge; admin override
  allowed.
- **Automatically delete head branches on merge:** the repo setting
  that stops merged session branches from accumulating.

## Report back

An implementation report: files landed; the test total; any drift
found in the verbatim-edit appendices (flag, do not self-correct);
the two GitHub settings still outstanding; and anything worth a
strategist eye.

---

## Appendix A — `docs/decisions/0006-pr-based-development-flow.md` (verbatim)

```markdown
# ADR 0006: PR-based development flow and CI safeguards

## Context

v2 closed and the project went public with CI. But the CI workflow
runs on push to `main` — it fires *after* the merge, so it cannot
gate anything. Numbered sessions merge straight from a worktree into
`main` with no check between the work and the branch everyone builds
on.

Separately, the working method is a large and growing body of
agreements that live in prose — `project-state.md`,
`strategist-protocol.md`, `CLAUDE.md` — and depend on being
remembered. v1 and v2's recurring failures are all the same shape:
discipline that decayed because nothing structural held it. Work
landed on `main` outside a chat. A prompt was edited after handoff.
A branch-naming rule was discussed and never written, so it "didn't
exist." The CLAUDE.md corpus table drifted two whole corpora out of
sync with the inventory it is meant to mirror.

The motivation is to make the discipline load-bearing structure
rather than recalled etiquette: catch problems before `main`, give
the implementing agent a structured reflection channel, and make
doc-coherence and branch cleanup mechanical instead of remembered.

## Decision

v3 adopts a pull-request-based development flow with CI as the
safeguard layer.

- **Numbered sessions and spikes land via pull request.** Worktree →
  PR → CI → review → squash-merge. Maintenance commits may still go
  direct to `main` — they carry no pre-merge amendment risk surface.
- **Branch protection on `main`.** A PR and a passing CI `verify` job
  are required to merge; squash-merge keeps `main` linear and
  one-commit-per-session; the repo admin is the explicit override.
  Branch protection is a GitHub *setting*, applied once by Evan — not
  a repo artifact.
- **Descriptive branch names.** `<type>/<descriptor>`, where type is
  `session`, `maint`, or `spike`; for sessions the descriptor leads
  with the number — `session/0020-dev-flow-setup`. The worktree is
  created with this name, not an auto-generated one.
- **The PR template is the structural home of the handoff block.**
  `.github/pull_request_template.md` carries the verification
  checklist, the spec-adherence and scope section, decisions with
  autonomy-tier tags, the reflection channel (concerns,
  uncertainties, questions), a doc-coherence checkline, queue/roadmap
  deltas, links, and a paste-ready squash-commit message. It mirrors
  the in-repo session log, which stays canonical.
- **CI gains a baseline guard.** `pnpm baseline` runs in CI; the
  baseline document must be byte-identical unless the PR explicitly
  flags an intentional regeneration.
- **A prompt-preflight checklist.** Every session prompt is
  red-teamed against the known v1/v2 failure classes before it
  reaches Evan.

A linter and further CI checks — diff-aware nudges, a size-threshold
warning, a process-lint — are adopted in principle but deliberately
held as a *fast-follow*, not built in the setup session, so the
initial flow is used before it grows.

## Consequences

What becomes easier:

- CI catches regressions before `main`, not after.
- The handoff block becomes a form that is hard to skip, and the
  reflection channel gives the implementing agent a first-class place
  to surface concerns and uncertainties.
- Doc-coherence becomes a checklist line on every PR.
- `main` stays linear; branch and worktree clutter stops
  regenerating, because merged branches are auto-deleted and worktree
  pruning becomes routine.

What becomes harder / the costs:

- Every numbered session gains a PR step. It is mechanical — a
  `gh pr create` in the session prompt — but it is a step.
- The setup session that builds this flow (0020) runs under the
  *old* flow; it cannot run under a flow it is still creating. 0021
  is the first session to run PR-style.

The doc-ownership map — so the same fact stops drifting across docs:

- **ADR 0006** is the decision record — the *why*.
- **`project-state.md`** holds the working agreements — the
  canonical *what*.
- **`CLAUDE.md`** carries the operative subset the implementing
  agent acts on at session start, and points to the other two. One
  canonical home per fact; the rest point to it.

What this does NOT do — parked future work:

- The agent-orchestration rung — autonomous agents picking up work
  from issues — is not built here. It needs this safeguard substrate
  first, and when it lands it gets its own ADR, with a **two-key
  merge** (two independent agent sign-offs plus green CI, or an
  explicit human override) as the safeguard that makes autonomy
  safe.
- A full worktree-cleanup-on-merge mechanism beyond auto-deleting the
  remote branch is left to a fast-follow.

Follow-on ADRs likely:

- The relay-into-repo move — prompt-via-commit, report-via-PR — once
  the PR flow has been used enough to inform it.
- The autonomous-orchestration ADR noted above.
```

---

## Appendix B — `.github/pull_request_template.md` (verbatim)

```markdown
<!--
This template is the structural home of the session handoff block.
Fill every section. It mirrors the in-repo session log
(docs/sessions/NNNN-*.md), which stays the canonical record.
-->

## Summary

_What shipped, 2–4 lines, plain declarative._

## Verification

- [ ] `pnpm type-check` clean
- [ ] `pnpm test:run` passing — total: _N_ (reported, not predicted)
- [ ] `pnpm build` clean
- [ ] `pnpm baseline` — baseline doc unchanged _(or check the next box)_
- [ ] baseline intentionally regenerated _(add the `baseline-change` label)_

## Spec adherence & scope

_Requirements met in full? Anything missed? Anything touched outside
the plan? Deviations from spec, and why._

## Decisions

_Each decision made or deferred, tagged with its autonomy tier:
`[flowed-silently]` / `[surfaced-and-proceeded]` / `[needs-Evan]`.
ADR written? Decisions-log entry made?_

## Concerns, uncertainties, questions

_Open questions for the strategist. Confidence, with reasoning — not
a bare "high". Roadblocks. Anything that felt fragile._

## Doc coherence

_Did this change a working agreement, convention, or the pipeline
contract? If so, which docs were updated (CLAUDE.md /
project-state.md / roadmap.md / ADRs)? "No" is a valid answer._

## Queue / roadmap deltas

_Items added, closed, or moved. "None" is a valid answer._

## Links

_Prompt file, session log, ADR (if any), closed issues._

## Squash commit message

_The Conventional Commits message to paste into the squash-merge box:_

```
type: subject

body
```

## Merge-readiness

- [ ] all CI checks green
- [ ] all CI comments answered (resolved, or replied with a reasoned dismissal)
```

---

## Appendix C — `docs/strategist-protocol.md` new section (verbatim, add — do not Replace)

```markdown
## Prompt preflight checklist

Before a session prompt reaches Evan, it is red-teamed against the
failure classes v1 and v2 actually hit. A subagent runs this; the
strategist triages the result.

- **No call signatures from memory.** The prompt describes algorithm,
  render, and test behavior as intent — it does not dictate specific
  library call signatures. (v1 shipped a wrong three.js call this
  way.)
- **No predicted test counts.** The prompt says the new tests should
  pass and asks Claude Code to report the total; it never predicts a
  cumulative count.
- **Formal syntax is exact, not paraphrased.** Where the prompt
  specifies gitignore patterns, regexes, globs, YAML, or config, the
  syntax is given exactly — not described. (Session 0001's gitignore
  bug.)
- **Verification steps are named.** The prompt names the exact
  verification commands the session must run.
- **Files and merge strategy are named.** The prompt lists the files
  to create or modify and the commit/merge path.
- **New tooling is probed, not assumed.** For any new library or
  external tool, the prompt requires doc-fetch-and-probe rather than
  assuming the API.
- **Self-contained.** The prompt reads completely to an agent with no
  chat context — prompts are pasted fresh.
- **Work type and branch name declared.** The prompt states whether
  the work is a numbered session, maintenance commit, or spike, and
  the branch name to use.
- **Frozen.** This is the final version. A change after handoff is a
  new prompt or an explicit, flagged amendment — not a silent edit.
```

---

## Appendix D — `CLAUDE.md` edits

### D.1 — replace section 1 in full

Replace the entire `## 1. Knowledge corpora` section (from its `##`
header through the blank line before `## 2. Smart-explore`) with:

```markdown
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
```

### D.2 — section 3, delete one bullet

Under `## 3. When to build or rebuild corpora`, in the
`**Propose `/corpus build "<description>"` when:**` list, delete this
bullet in full:

```
- You just recorded a decision-type observation and ≥5 decisions exist project-wide without a `decisions-corpus`.
```

(The `origami-decisions` corpus now exists; keeping it fresh is
covered by the existing rebuild rules.)

### D.3 — add a development-workflow section, and one bullet to section 5

Append a new section at the end of the file:

```markdown
## 6. Development workflow (v3+)

Per ADR 0006. Numbered sessions and spikes land via pull request, not
direct merge.

- **Worktree branch naming:** `<type>/<descriptor>` — type is
  `session`, `maint`, or `spike`; for sessions the descriptor leads
  with the number (`session/0020-dev-flow-setup`). Create the
  worktree with this name; do not accept an auto-generated one.
- **Land via PR:** worktree → open a PR → CI must pass → address
  every CI comment and failure (resolve, or reply with a reasoned
  dismissal) → squash-merge. Maintenance commits may still go direct
  to `main`.
- **Fill the PR template** — it is the structural home of the session
  handoff block, and it mirrors the in-repo session log
  (`docs/sessions/NNNN-*.md`), which stays canonical.
- **Reasoning lives in ADR 0006**; the working agreements are in
  `docs/project-state.md`. This section is the operative subset only.
```

And in `## 5. Session conduct`, add this bullet:

```
- **Worktree cleanup.** Run `git worktree prune` at session start.
  Merged session branches are auto-deleted on the remote; the local
  worktree admin still needs pruning.
```

---

## Appendix E — `docs/project-state.md` edits

### E.1 — "Session and commit mechanics": add the PR-flow agreement

Replace this bullet in full:

```
- **Worktree by default for numbered sessions; direct-`main` OK
  for maintenance commits.** Worktrees exist for the pre-merge
  amendment freedom — bugs caught between commit and merge fold in
  without violating immutability. Maintenance commits don't carry
  that risk surface.
```

with that bullet plus a new one immediately after it:

```
- **Worktree by default for numbered sessions; direct-`main` OK
  for maintenance commits.** Worktrees exist for the pre-merge
  amendment freedom — bugs caught between commit and merge fold in
  without violating immutability. Maintenance commits don't carry
  that risk surface.
- **Numbered sessions and spikes land via pull request.** Per ADR
  0006: worktree → PR → passing CI → review → squash-merge, with
  branch protection on `main` enforcing it. Maintenance commits may
  still go direct to `main`. Branches follow `<type>/<descriptor>`
  (`session/0020-dev-flow-setup`, `maint/...`, `spike/...`); the PR
  template is the structural home of the handoff block.
```

### E.2 — "Where to look": the ADR list

Replace:

```
- `docs/decisions/` — ADRs (0001 pipeline architecture, 0002 adjacency-as-stage, 0003 DFS spanning tree, 0004 dihedral-weighted MST, 0005 greedy set-cover recut)
```

with:

```
- `docs/decisions/` — ADRs (0001 pipeline architecture, 0002 adjacency-as-stage, 0003 DFS spanning tree, 0004 dihedral-weighted MST, 0005 greedy set-cover recut, 0006 PR-based development flow and CI safeguards)
```

---

## Appendix F — `docs/roadmap.md` edits

### F.1 — "Where we are now"

Replace:

```
**Phase:** v3 — Quality Output. Not yet started; session plan pending.
**Last completed session:** 0019 — v2 integration and retrospective.
**Next planned session:** v3 session-level plan, drafted at the start
of the next Cowork session.
```

with:

```
**Phase:** v3 — Quality Output. In progress.
**Last completed session:** 0019 — v2 integration and retrospective
(plus the v3-boundary housekeeping maintenance commit, `3e33524`).
**Next planned session:** 0020 — development flow setup.
```

### F.2 — add a v3 session plan section

After the `## v2 session plan` section (and before
`## Maintaining this document`), insert:

```markdown
## v3 session plan

v3 — Quality Output — moves the pipeline from *buildable* to *good*:
output that's visibly competitive with Pepakura's for non-interactive
use. Five workstreams; per the planning convention, the first
sessions are detailed and the rest are a deliberate sketch, refined
as the early ones land.

**Workstreams:**

1. **Baseline & foundation** — define the v3 quality metric set,
   instrument the harness, capture the v3 "before" snapshot.
2. **The cut-quality core** — Takahashi reference read, a
   topological-surgery spike, optimized recut.
3. **Output fidelity** — color/texture passthrough, real PDF export.
4. **Builder-facing quality** — smart tab placement, audit
   visualization.
5. **Phase close** — v3 integration test, retrospectives, one
   mid-phase checkpoint.

**Sessions:**

- **0020 — Development flow setup.** ⏭ PR-based merge flow, CI
  safeguards, the doc-coherence updates (ADR 0006).
- **0021 — v3 quality baseline.** Define the metric set, instrument
  the harness, capture `docs/baseline-v3.md`. First session under the
  PR flow.
- **0022 — Takahashi reference read.** Study the topological-surgery
  literature and PolyZamboni; produce a reference writeup.
- **0023 — Topological-surgery spike.** Time-boxed, exploratory;
  produces a findings doc, not a shippable stage.
- **0024+ — sketched:** optimized recut, PDF export, color/texture
  passthrough, smart tab placement, audit visualization, v3
  integration and retrospective. Refined as 0021–0023 land.
```
