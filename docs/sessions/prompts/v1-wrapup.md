# v1 wrap-up — retrospective and handoff-doc updates

## Goal

A single maintenance commit that closes out v1 and makes the handoff
package current, so the next Cowork session can pick up the project
cleanly. It: creates the v1 retrospective as a committed artifact,
adds a v1 chapter to `project-history.md`, consolidates and extends
`project-state.md`'s working agreements, updates the re-orientation
prompt, and adds a working-method pointer to `project-rationale.md`.

This is a **maintenance commit, not a numbered session.** No session
log. Largest doc commit of the project — all verbatim content, no
code, no ADR. Direct-`main` is acceptable per the maintenance-commit
rule; a worktree is also fine given the size (pre-merge amendment
room if you spot an issue while filing).

## Pre-work consistency scan

Scan `docs/queue.md` — one open item (working-agreements
consolidation). **This commit closes that item** by performing the
consolidation. After this commit, the queue's open-items section
should be empty (leave a "(none)" placeholder or the section header
with nothing under it — match whatever the file's format expects).

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at
   `a331c82`. If it has advanced, surface it and proceed.

2. **Create `docs/retrospectives/` directory and
   `docs/retrospectives/v1-complete.md`** with the content in
   **Appendix A**, copied verbatim.

3. **Edit `docs/project-history.md`.** Insert the four sections in
   **Appendix B** immediately after the existing "## The Cowork
   transition" section and before the existing "## What this
   history teaches" section. The fourth of those sections,
   "## The current moment," **replaces** the existing
   "## The current moment" section near the end of the file
   (delete the old one — it's stale, it says we're between
   Sessions 0002 and 0003). Net effect: three genuinely new
   sections inserted mid-document, and the stale closing section
   replaced.

4. **Edit `docs/project-state.md`** in two places:

   a. **Replace the entire "Working agreements" section** (from
      the `## Working agreements` header through the last bullet,
      ending just before `## Open questions / things in flight`)
      with the content in **Appendix C.1**, copied verbatim. This
      consolidates ~26 flat bullets into themed subsections and
      folds in three new agreements (prompt-file-copy, no
      test-count prediction, handoff-docs-current-at-phase-
      boundaries) plus the updated re-orientation prompt.

   b. **Replace the "Where to look" section** with the content in
      **Appendix C.2** — adds `docs/retrospectives/`, refreshes
      the stale `docs/sessions/prompts/` parenthetical, and
      updates the ADR line for 0001–0003.

5. **Edit `docs/project-rationale.md`.** Append the section in
   **Appendix D** at the end of the file, after the existing
   "## What's been deliberately deferred" section.

6. **Edit `docs/queue.md`** to clear the one open item (the
   working-agreements consolidation, now done). Leave the format
   and process sections intact; the "Open items" section should
   end with nothing under it, or a "(none currently)" line —
   match the file's existing style.

7. **Stage all changes and commit** with this message:

   ```
   docs: v1 wrap-up — retrospective, handoff-doc updates, working-agreements consolidation
   ```

   Files to stage:
   - `docs/retrospectives/v1-complete.md` (new)
   - `docs/project-history.md` (modified)
   - `docs/project-state.md` (modified)
   - `docs/project-rationale.md` (modified)
   - `docs/queue.md` (modified)
   - `docs/sessions/prompts/v1-wrapup.md` (new — this prompt file,
     per the prompt-cadence rule)

8. **If you worked in a worktree, fast-forward `main`.** If you
   committed directly on `main`, skip. Watch for the prompt-file
   collision pattern if in a worktree.

9. **Report back:** final `main` HEAD hash, confirmation all 6
   files staged correctly, and any factual issues you spotted in
   the verbatim appendix content while filing (flag only — don't
   edit appendix content).

## Notes

- No source code changes — do not run `pnpm` verification
  commands; they'd be no-ops.
- All appendix content is verbatim. If you spot a factual error
  while filing, flag it in your report; the strategist decides
  whether to amend.
- The "## The current moment" section in Appendix B replaces the
  existing same-named section. Don't leave both.

---

## Appendix A — `docs/retrospectives/v1-complete.md` (verbatim)

```markdown
# Retrospective — v1 complete

This is the first phase-boundary retrospective. It is the durable
record of what v1 became and what the working method became — the
lessons that would otherwise live only in a Cowork chat and be lost
at the next context boundary. A new Cowork session should read this
to understand not just *what* the project is but *how* we work and
*why* the method is shaped the way it is.

## What v1 delivered

The tangible: a six-module pure-function pipeline in `src/core/`
(`mesh` -> `parse-stl` -> `adjacency` -> `spanning-tree` ->
`flatten` -> `emit-svg`), 19 passing tests, three ADRs on the
load-bearing decisions, and a browser app showing a 3D platonic
solid beside its unfolded SVG net. Eleven numbered sessions plus
maintenance commits, all legible in git history and session logs.

The intangible, and more valuable: a working method that did not
exist when v1 started. v1 began with the strategist writing
verbatim code into prompts and Claude Code transcribing it. It
ended with spec-style prompts, implementation reports, code-review
subagents, an autonomy framework, a managed queue, a live roadmap
artifact, and a validated session-bundling pattern. Every one of
those came from a mistake or a friction point. The method is as
much a v1 deliverable as the code.

## What worked

The role split held across eleven sessions without breaking down:
strategist plans, Claude Code implements, Evan directs.

The implementation-report pattern was the single biggest win. It
turned Claude Code from a transcriber into a thinking collaborator
that caught real bugs the strategist missed — a shared-array-
reference trap, a tab-versus-space STL parsing issue, a stale
Vitest config pattern.

Spec-style prompts were a genuine improvement: shorter, less
exposed to strategist blind spots, producing code current with the
library API.

Mid-stream retrospectives each produced concrete adjustments rather
than vague good feelings. Documentation discipline kept the repo
legible. ADRs landed when decisions became acute, not prematurely.
The session-bundling experiment (0010 + 0011 in one invocation with
an internal checkpoint) added safety without friction and is
validated for ADR-free mechanical-implementation work.

## What did not work, or cost us

Strategist blind spots from stale knowledge were the recurring
failure. A Vitest config pattern that had changed versions. An
assumption about which binary ships with which package. Worst, a
`renderer.setSize(w, h, false)` call dictated from stale memory
that was wrong — and that one shipped to `main` before it was
caught by eye. Doc-fetch helped but was applied inconsistently.

Test-count miscounting happened twice — flagged after one session,
repeated in a later one.

The live roadmap artifact was built before its constraints were
understood: it hit an architectural wall (artifacts cannot call the
bash tool) and had to be rebuilt as a baked snapshot. The lesson:
probe new tooling before designing around it.

Prompt-file handling in worktrees caused a fast-forward collision
and a lossy reconstruction that required rewriting commits to
resolve.

Work landed outside the Cowork chat without strategist visibility —
a CLAUDE.md addition, a renderer fix, a session-log backfill. And
the handoff documents themselves drifted stale: `project-state.md`
was maintained, but `project-history.md` and `project-rationale.md`
were not, until this wrap-up.

## Lessons carried into v2

1. Doc-fetch-and-probe is reflexive, not optional — and it covers
   method semantics, not just import paths.
2. Specs describe intent; they never dictate library call
   signatures. Dictating a specific call is implementing from
   stale memory.
3. The strategist does not predict cumulative test counts. Claude
   Code counts.
4. Probe new tooling before designing around it.
5. Copy authoritative prompt files into worktrees; never
   reconstruct from the pasted message.
6. `git log` at the start of every Cowork chat, to catch
   outside-chat drift.
7. All handoff docs stay current, not just `project-state.md`.
   Phase boundaries get a retrospective.

## What changes for v2

v2's sessions are larger and more algorithmically demanding —
overlap detection, set-cover recut, dihedral weighting. The
code-review subagent becomes more valuable and should be used more
(v1's two trials showed it earns its keep on fragile or
ADR-bearing work; the stale-content subagent was unreliable and was
dropped — the strategist does that check directly).

v2 needs a richer test corpus than three platonic solids — that is
an early v2 session.

The handoff-doc maintenance discipline has to be real this time,
enforced as a working agreement: history and rationale updated at
phase boundaries, a retrospective per phase.
```

---

## Appendix B — `docs/project-history.md` additions

Insert these four sections after "## The Cowork transition" and
before "## What this history teaches." The final section,
"## The current moment," **replaces** the existing stale section of
that name near the end of the file.

```markdown
## v1 in Cowork: eleven sessions

The Cowork transition held. The three handoff documents carried the
project across the context boundary, and Session 0003 — the first
ADR — opened v1's implementation arc in the new configuration.

v1 ran eleven sessions. Session 0003 wrote ADR 0001, committing the
pipeline as a sequence of pure-function stages. Session 0004 stood
up `docs/queue.md` and the first consolidation of working
agreements. Session 0005 bootstrapped the build — Vite, TypeScript,
pnpm, Vitest. Session 0006 generated the platonic-solid test
corpus. Sessions 0007 through 0011 built the pipeline itself, stage
by stage: STL parsing and a three.js viewport, the face adjacency
graph (ADR 0002), the DFS spanning tree (ADR 0003), the
rigid-unfolding flatten stage, and finally SVG export — at which
point the walking skeleton stood. Load a platonic solid, get a
printable net.

Between the numbered sessions ran maintenance commits — a roadmap
document, a housekeeping pass that cleared the queue and promoted
process learnings, small fixes. The distinction between numbered
sessions and maintenance commits became its own working agreement.

## The working method, forged session by session

The more consequential story of v1 is not the pipeline — it is the
working method, which did not exist when v1 started and was
substantial by the time it ended.

v1 opened with the strategist writing verbatim code into prompts
and Claude Code transcribing it. That pattern concentrated all the
implementation risk in the strategist's knowledge — and the
strategist's knowledge had blind spots. The shift to spec-style
prompts — describe the behavior, let Claude Code write the code
with current API knowledge — came mid-v1, and with it the
implementation-report pattern: Claude Code reporting back its
decisions, deviations, and concerns rather than silently
transcribing. That single change turned Claude Code from a typist
into a thinking collaborator, and it began catching real bugs the
strategist had missed.

Other practices accreted the same way, each from a friction point:
the autonomy framework, after Evan asked the strategist to stop
seeking approval for every small call; active queue management,
after deferred items started accumulating; doc-fetch-and-probe,
after stale library knowledge shipped bugs; the code-review
subagent, tried twice and kept for fragile work; session bundling
with internal checkpoints, validated on the v1-completing
0010+0011 bundle. The live roadmap artifact was built, hit an
architectural wall, and was rebuilt as a baked snapshot. None of
this was designed up front. It emerged.

## What v1's mistakes taught

v1's mistakes were instructive, and most traced to one root: the
strategist's knowledge going stale. A Vitest config pattern that
had changed versions. An assumption about which binary ships with
which package. A three.js renderer call dictated from memory that
was simply wrong — and that one shipped to `main` before anyone
caught it. Test counts mispredicted in prompts, twice. The pattern
was clear enough by the end of v1 that the corrective practices —
doc-fetch-and-probe, specs-describe-intent-not-call-signatures,
don't-predict-test-counts — became working agreements rather than
mere notes.

The other recurring lesson was about continuity. Work landed
outside the Cowork chat without the strategist's awareness; the
handoff documents themselves drifted out of date while everyone
watched `project-state.md` and forgot the other two. The fix —
`git log` at the start of every chat, and a discipline of updating
all the handoff docs at phase boundaries — is why the v1 wrap-up
commit exists, and why v1 closes with a retrospective committed to
the repo rather than a conversation that evaporates.

## The current moment

As of the v1 wrap-up commit, v1 — the walking skeleton — is
complete and merged to `main`. The pipeline runs end to end. Three
ADRs, eleven session logs, a managed queue, a live roadmap
artifact, and a working method documented in
`docs/retrospectives/v1-complete.md` are all in the repo.

The next phase is v2 — the functional unfolder. Its session-level
plan does not exist yet; drafting it is the first task of the next
Cowork session, which will pick up the project fresh, using this
updated handoff package as its entry point. If the package is
good, the new strategist loses nothing. That is the test.

Welcome to v2.
```

---

## Appendix C.1 — `docs/project-state.md` "Working agreements" section (verbatim replacement)

```markdown
## Working agreements

How Evan, the strategist Claude, and Claude Code work together.
These evolved across v1 — treat them as current state, not
eternal. Grouped into themes; the reasoning behind most of them is
in `docs/retrospectives/v1-complete.md`.

### Roles

- **Evan is the director.** He decides what we build and when,
  sets the bar for quality, and makes the call when alternatives
  exist.
- **Strategist Claude is the planner and reviewer.** Drafts
  session prompts, reviews Claude Code output, maintains
  documentation, surfaces decisions with reasoning.
- **Claude Code is the implementer.** Runs prompts the strategist
  drafts, produces code, makes commits, and reports back.

### Decisions and communication

- **Recommendations, not options.** Lead with the recommended
  choice and why; don't offload synthesis onto Evan. He overrides
  when needed.
- **Confidence gets marked.** When a recommendation is uncertain,
  say so.
- **Strategist autonomy is calibrated by stakes.** High-confidence
  prose decisions inside Evan-approved structures flow silently.
  Medium-confidence calls on permanent artifacts (ADR substance,
  commit messages, file names) get surfaced briefly, then
  proceeded with. Low-confidence calls and anything crossing a
  project-shape boundary (conventions, scope, working agreements)
  get surfaced and wait for Evan's input.
- **Evan is involved in most decisions for now.** He signals
  explicitly when he trusts a category of recommendations to flow
  silently.
- **Premature optimization is a watched failure mode.** Naive
  before optimized; push back on cleverness in v1-v2.

### Session and commit mechanics

- **Each session ends with a commit and a session log entry.** No
  exceptions, even for rough sessions.
- **Session done = merged to `main`.** Pre-merge worktree commits
  are drafts; immutability applies once merged.
- **Numbered session vs. maintenance commit.** Work gets a
  numbered session if it matches an entry in a phase's session
  plan, or produces new functionality, code, or substantive
  structural changes. Otherwise it lands as a plain maintenance
  commit — no session log, no number, descriptive prompt filename
  without a numeric prefix.
- **Worktree by default for numbered sessions; direct-`main` OK
  for maintenance commits.** Worktrees exist for the pre-merge
  amendment freedom — bugs caught between commit and merge fold in
  without violating immutability. Maintenance commits don't carry
  that risk surface.
- **Session prompts are saved as files** at
  `docs/sessions/prompts/` before being pasted into Claude Code,
  and commit with the session log (or commit) they describe.
- **Prompt files in worktrees: copy, don't reconstruct.** When a
  numbered session runs in a worktree, Claude Code copies the
  authoritative prompt file from the main checkout into the
  worktree (that path is readable from a worktree) and commits
  that copy. Reconstructing the prompt from the pasted message is
  lossy. At fast-forward, expect a collision with the main
  checkout's untracked copy; resolve by verifying byte-identical
  (`diff -q`) and removing the main copy before the FF.
- **Fresh worktrees lack `node_modules`.** Numbered-session
  prompts include `pnpm install` as the first verification step.

### How the strategist works

- **Mechanical work goes to Claude Code, not Evan.** Inspections,
  file creation, commits, reading file contents — if it's
  mechanical, Claude Code does it.
- **Doc-fetch and probe before writing prompts.** Before a prompt
  that involves new tools, libraries, or restructuring: (a) fetch
  current documentation for any external library used — including
  method semantics, not just import paths; (b) probe the actual
  response shape with a sample call rather than assuming; (c) scan
  related files for cross-references that could go stale.
- **Prompts specify behavior, not code.** Algorithm, render, and
  test code are described as specifications; Claude Code
  implements using current library API knowledge. Specs describe
  intent — they never dictate specific library call signatures
  (that's implementing from stale memory). Verbatim appendix
  content is reserved for type contracts, configuration files,
  and document content where the wording IS the deliverable.
  Claude Code produces an implementation report at session-end:
  decisions made, deviations from spec, library APIs verified,
  concerns worth a strategist eye, stale content noticed.
- **The strategist does not predict cumulative test counts.**
  Stating "N tests should pass" invites off-by-one errors as the
  suite grows. Prompts say the new tests should pass and ask
  Claude Code to report the total.
- **The strategist actively manages deferrals via
  `docs/queue.md`.** No item silently dropped; none left in
  indefinite limbo.
- **The strategist maintains `docs/roadmap.md`.** Status flags
  flip when a session commits; phase descriptions change only
  when a phase's ship-state commitment itself changes.
- **The strategist updates the `unfolder-roadmap` Cowork artifact
  at session-end** — and after maintenance commits that
  materially change displayed state (queue, recent commits,
  HEAD).
- **Handoff docs stay current at phase boundaries.**
  `project-state.md` is kept current continuously;
  `project-history.md` and `project-rationale.md` are updated at
  each phase boundary rather than left to drift. Each completed
  phase produces a retrospective in `docs/retrospectives/` — the
  durable capture of working-method lessons that would otherwise
  live only in a Cowork chat.

### Repo and orientation

- **The repo is the source of truth.** Anything not committed
  effectively doesn't exist for future sessions. Chat is
  ephemeral.
- **When opening a new Cowork chat to resume the project**, paste
  this re-orientation message:
  > Continue the unfolder project — a browser-based papercraft
  > unfolding tool. Read, in order: `docs/project-state.md`,
  > `docs/project-rationale.md`, `docs/project-history.md`, the
  > latest retrospective in `docs/retrospectives/`,
  > `docs/queue.md`, `docs/roadmap.md`, and the two or three most
  > recent session logs in `docs/sessions/`. Then run
  > `git log --oneline -20` to catch anything that landed outside
  > a chat. Then we'll plan the next session.
```

---

## Appendix C.2 — `docs/project-state.md` "Where to look" section (verbatim replacement)

```markdown
## Where to look

- `README.md` — project vision and phase plan
- `docs/roadmap.md` — v1-v6 phase plan and session-level status at a glance
- `docs/project-state.md` — this file (current state, working agreements)
- `docs/project-rationale.md` — why the project decisions were made
- `docs/project-history.md` — narrative arc of how the project evolved
- `docs/retrospectives/` — phase-boundary retrospectives (`v1-complete.md` is the first)
- `docs/decisions/` — ADRs (0001 pipeline architecture, 0002 adjacency-as-stage, 0003 DFS spanning tree)
- `docs/references/` — writeups of external implementations we've studied
- `docs/sessions/` — logs of completed Claude Code sessions
- `docs/sessions/prompts/` — the saved prompt that produced each session or maintenance commit
- `references/` — gitignored clones of external repos for reading
```

---

## Appendix D — `docs/project-rationale.md` addition (verbatim, appended at end of file)

```markdown
---

## Working-method rationale lives in the retrospectives

This document captures the reasoning behind the *project*
decisions — tech stack, phasing, structure. The reasoning behind
the *working method* — spec-style prompts, the implementation-
report pattern, the autonomy framework, the code-review subagent,
session bundling — was developed across v1 and is captured in
`docs/retrospectives/v1-complete.md`.

The split is deliberate. Project decisions are made once and
rarely revisited. The working method evolved continuously across
v1 and will keep evolving; the retrospectives are its running
record, written at each phase boundary. A reader wanting to know
*why we work the way we do* should read the latest retrospective;
this document explains *why the project is shaped the way it is*.
```
