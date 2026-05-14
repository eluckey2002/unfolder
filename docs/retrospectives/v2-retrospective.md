# Retrospective — v2, the working method

This is the companion to `v2-complete.md`. That document records what
v2 *shipped*; this one records *how we worked* to ship it — and
whether the working method held, strained, or needs to change. It
establishes a per-phase convention: each phase gets a `-complete.md`
(what shipped) and a `-retrospective.md` (how we worked).

It is also, deliberately, the product of an actual retrospective
exercise rather than a strategist draft. `v2-complete.md` was written
unilaterally by the strategist inside session 0019's prompt; that it
took Evan asking for a *real* retrospective to produce this document
is itself one of v2's lessons, and it is why reflection cadence is one
of the four decisions below.

## How this retrospective was run

Four passes. **Pass 1** — the strategist grounded in the v2 record:
every session log 0012–0019, the implementation reports, the queue
history, the ADRs, the codebase audit and its triage, the git
history, and v1's seven carried-lessons. It produced a factual
timeline and a first-pass set of observations — observations, not
conclusions. **Pass 2** — Evan reframed it: rather than answer open
reflection prompts, he asked the strategist to convert its
observations into decisions, each with context and competing
viewpoints, plus novel ideas to pilot. **Pass 3** — the strategist's
honest lens on its own performance. **Pass 4** — convergence into the
concrete changes recorded here.

Worth recording how Evan engaged: as director. He reviewed the
strategist's read of the record, found it accurate, and directed the
full set of changes — approving all four decision recommendations and
all the pilots. That is a legitimate form of the exercise. The point
of a joint retrospective is not that both parties journal equally; it
is that the synthesis is examined and owned rather than
rubber-stamped. It was examined.

## What the v2 record showed

1. **The method was front-loaded, not evolved.** Where v1's working
   method emerged from friction session by session, v2 opened with
   three deliberate process-engineering commits — the insights-report
   implementation — before any feature work. The machinery was built
   up front; whether all of it earned its keep is answered below.
2. **The handoff block worked.** Every 0012–0019 log ends with a
   substantive handoff block, and "Open questions for the strategist"
   surfaced real things — the dihedral regression, a
   case-insensitive-filesystem trap, a session-mechanics flaw. The
   repo-as-bus principle held: the strategist read logs directly and
   did not need Evan to paraphrase.
3. **Open questions had no closure mechanism.** Session 0012's handoff
   raised the `<short-sha>` placeholder problem; it was never
   explicitly resolved and simply became background noise in every
   later log. Things surfaced cleanly but did not always get closed.
4. **The one real strategic fork was handled well.** Session 0014's
   dihedral regression was flagged in its handoff, Evan asked the
   research question, and a survey resolved it — the architecture was
   sound, the heuristic was knowingly mediocre, recut was the real
   fix. The method caught the exact moment v2 could have spun into an
   unnecessary architecture rethink.
5. **Velocity ramped, and the predictable small cracks appeared.**
   Evan deliberately pushed the pace and the structure mostly held —
   but a prompt was edited after handoff (session 0016's ADR baseline
   number) and work landed outside the chat (session 0018 and the
   corpus-triggers refresh both committed between strategist turns).
   Cheap slips, but exactly the ones speed predicts.
6. **The mid-phase audit was unplanned and earned its place.** It was
   not in the v2 plan; it came from Evan pasting a codebase
   assessment. Its value was that it was an outside look — and that
   the strategist's triage of it argued back, recalibrating several
   over-weighted findings rather than acting on all of them.
7. **Evan ran as an active driver, not a passive director.** He
   executed Claude Code sessions himself, pasted reports, green-lit
   fast, and redirected the strategist when it offered bare forks
   instead of a recommendation. The relationship in v2 was high-trust
   and high-velocity, with Evan driving rather than waiting.

## The strategist's lens

Three honest gaps. **The strategist turned recommendations into
forks.** Evan redirected it twice toward "give me your
recommendation" — and that was a habit, not two isolated slips: when
the strategist had a clear pick it sometimes still handed Evan an
either/or, partly leaning on tooling guidance to "ask first," partly
uncertainty-aversion. **The strategist optimized for legible diligence
over leverage.** It kept the documentation immaculate — roadmap flags,
state-doc syncing, bookkeeping — because that work is visible and
tidy. But the two things that actually moved v2 were the research
survey and the audit triage, and those were a thin slice of the
strategist's effort. **The strategist built process and did not tend
it.** The insights-report machinery was front-loaded and then treated
as finished — the observer-mode protocol went unused for the entire
phase, the `<short-sha>` quirk sat unresolved from session 0012, and
the session 0016 post-handoff prompt edit was the strategist's own
error on a supposedly frozen artifact.

What worked, so the account is not lopsided: the research survey was
the right instrument at the right moment; the audit triage's
willingness to argue back rather than rubber-stamp was real value;
and the dependency-chain session plan held from 0012 to 0019 without
needing to be re-cut.

## Decisions taken

Four, each resolved.

**1. Autonomy calibration.** *Tension:* v2 ran on frequent
AskUserQuestion forks; Evan twice redirected toward a recommendation.
v1's agreement had said Evan would signal when categories of decision
could flow without a fork — the redirect was that signal.
*Resolution:* AskUserQuestion-style forks are reserved for genuine
either/or decisions. "Which-approach" calls come as a recommendation
Evan can veto, not a fork. The strategist does the synthesis.

**2. Speed versus rigor.** *Tension:* v2's deliberate pace produced
two cheap slips — a post-handoff prompt edit, outside-chat commits.
*Resolution:* keep the speed; the problem was visibility, not pace.
Outside-chat work is legitimate. The mechanism is the decision ledger
plus a session-start step where the strategist surfaces anything that
landed outside a chat. Gatekeeping is not added; visibility is.

**3. Where the strategist spends effort.** *Tension:* the strategist's
highest-value v2 outputs were the research survey and the audit
triage; its lowest were mechanical doc maintenance. *Resolution:*
strategist effort rebalances toward judgment — research, triage,
catching forks — and away from bookkeeping, which gets compressed or
automated. Paired with a machinery prune: the unused observer-mode
protocol is cut from `strategist-protocol.md`, and the `<short-sha>`
handoff field is resolved.

**4. Reflection cadence.** *Tension:* this retrospective happened only
because Evan asked; v1 had mid-stream retros and v2 had none.
*Resolution:* the phase-boundary retrospective becomes a standing
*joint* ritual, not a strategist draft. Each phase also gets one
lightweight mid-phase checkpoint.

## v1's seven lessons, scored

Honestly: four held, three partial, none failed.

Held — specs describe intent rather than dictating call signatures;
the strategist did not predict cumulative test counts; prompt files
were copied into worktrees rather than reconstructed; all handoff docs
were brought current at the phase boundary. Partial — doc-fetch-and-
probe was reflexive for `polygon-clipping` but the strategist punted
paginate's units question to Evan rather than probing or deciding;
probe-new-tooling, the same; and `git log` at session start *caught*
the outside-chat drift but did not prevent it. The one genuinely
recurring gap is outside-chat drift — and Decision 2's visibility
mechanism is the fix aimed directly at it.

## What v3 pilots

Adopted as practice:

- **A decision ledger** (`docs/decisions-log.md`) — a running,
  one-line record of every non-ADR call the strategist makes and why,
  so Evan can see what flowed silently without re-litigating it. This
  is the enabling mechanism for Decision 1.
- **Fresh-eyes subagent reviews** — at v3 milestones, a no-priming
  subagent reviews the work and the strategist triages the result,
  making the mid-phase audit's value cheap and repeatable.
- **A red-team pass on prompts** — before a prompt reaches Evan, a
  subagent stress-tests it for ambiguity and gaps.
- **A spike session type** — explicitly exploratory, time-boxed,
  throwaway code allowed, producing a findings doc rather than a
  shippable stage. v3's genuinely-uncertain work (Takahashi
  topological surgery) needs a home that is not pretending to be a
  feature session.
- **A mid-phase checkpoint** — Decision 4's lightweight mid-v3
  reflection.

Flagged as experiments to try once in v3, not yet adopted: a **live
state artifact** that maintains itself from git, queue, and test state
rather than being hand-synced by the strategist; and a one-off **role
inversion** where Evan drafts a session prompt and the strategist
reviews it, to calibrate whether the strategist's prompt-craft adds
value or just a layer.

## The relationship, as of v2

v2's working relationship was high-trust and high-velocity, with Evan
as an active driver — running sessions himself, deciding fast,
correcting the strategist's framing when it drifted toward offloading
or ceremony. The strategist's job going into v3 is to match that:
fewer forks and more recommendations, less bookkeeping and more
judgment, process that is tended rather than accumulated. The test of
this retrospective is the same as v1's — if a future session reads it
and the working method actually shifted, it worked. If v3 reads the
same as v2, it didn't.

Welcome to v3.
