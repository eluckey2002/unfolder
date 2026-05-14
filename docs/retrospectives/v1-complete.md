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
