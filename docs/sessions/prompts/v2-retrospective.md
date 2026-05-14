# v2 retrospective — companion doc, working-agreement updates, decision ledger

## Goal

A single maintenance commit that lands the outputs of the v2
retrospective: the process-and-relationship companion document, the
working-agreement changes the retrospective produced, a new decision
ledger, and the queue items it surfaced.

This is a **maintenance commit, not a numbered session.** No session
log — the commit message carries the handoff. All doc content; no
code, no ADR. Direct-`main` is acceptable per the maintenance-commit
rule; a worktree is also fine given the size.

## Context

After v2 closed (session 0019), Evan and the strategist ran a real
four-pass retrospective — distinct from `v2-complete.md`, which the
strategist had drafted unilaterally inside the 0019 prompt. The
retrospective produced four resolved decisions, a set of v3 pilots,
an honest scoring of v1's carried-lessons, and the companion document
in Appendix A. This commit files all of it.

One deliberate scoping note: the retrospective's Decision 3 includes
a "machinery prune" — removing the unused observer-mode protocol from
`docs/strategist-protocol.md` and resolving the `<short-sha>`
handoff-block field. That prune is **not** done in this commit; it is
mechanical follow-up and is filed as a queue item (Appendix D)
instead, to keep this commit focused on the retrospective's own
artifacts.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, check `main`'s HEAD. The
   expected state is `5340db7` (post-session-0019). If the CI /
   GitHub-remote maintenance commit landed first and `main` has
   advanced, that is fine — surface it and proceed.

2. **Create `docs/retrospectives/v2-retrospective.md`** with the
   content in **Appendix A**, copied verbatim.

3. **Create `docs/decisions-log.md`** with the content in
   **Appendix C**, copied verbatim.

4. **Edit `docs/project-state.md`** — six targeted edits to the
   "Working agreements" section, all specified verbatim in
   **Appendix B**. These are additions and one bullet-replacement,
   not a full-section rewrite — place each as directed.

5. **Edit `docs/queue.md`** — replace everything under the
   `## Open items` header with the content in **Appendix D**. The
   `## Format` and `## Process` sections above it are unchanged. Net
   effect: three new items added (the Decision 3 machinery prune, and
   two v3 experiment pilots); the three existing items are unchanged.

6. **Stage all changes and commit** with this message:

   ```
   docs: v2 retrospective — process retro, working-agreement updates, decision ledger
   ```

   Files to stage:
   - `docs/retrospectives/v2-retrospective.md` (new)
   - `docs/decisions-log.md` (new)
   - `docs/project-state.md` (modified)
   - `docs/queue.md` (modified)
   - `docs/sessions/prompts/v2-retrospective.md` (new — this prompt
     file, per the prompt-commits-with-its-commit rule)

7. **Report back:** final `main` HEAD hash, confirmation all five
   files staged correctly, and — flag only, do not self-correct —
   any factual problem spotted in the verbatim appendix content
   while filing.

## Notes

- No source code changes — do not run `pnpm` verification commands;
  they would be no-ops.
- All appendix content is verbatim where the wording is the
  deliverable. If a factual error is spotted while filing, flag it in
  the report; the strategist decides whether to amend.
- The `docs/strategist-protocol.md` prune is intentionally **not** in
  this commit — it is Appendix D's first queue item.

---

## Appendix A — `docs/retrospectives/v2-retrospective.md` (verbatim)

```markdown
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
```

---

## Appendix B — `docs/project-state.md` edits

Six targeted edits to the "Working agreements" section. Each names
its subsection and whether it is an addition or a replacement.

### B.1 — `### Decisions and communication`, add a bullet

Add this bullet immediately after the existing "**Recommendations,
not options.**" bullet:

```markdown
- **Forks are for genuine either/or decisions.** An
  AskUserQuestion-style fork is right when the options are mutually
  exclusive and Evan's input genuinely changes the outcome (page
  size, public vs. private). A "which-approach" question where the
  strategist has a clear pick comes as a recommendation Evan can
  veto — not a fork. Surfacing a fork when a recommendation was
  possible is offloading synthesis onto Evan.
```

### B.2 — `### Session and commit mechanics`, add a bullet

Add this bullet at the end of the "Session and commit mechanics"
subsection (after the "Fresh worktrees lack `node_modules`" bullet):

```markdown
- **Spike sessions for genuinely uncertain work.** A spike is an
  explicitly exploratory session — time-boxed, throwaway code
  permitted, producing a findings doc rather than a shippable stage.
  It is distinct from a numbered session (which ships functionality)
  and a maintenance commit (which does mechanical cleanup). Work
  where the approach itself is in question runs as a spike first.
```

### B.3 — `### How the strategist works`, add a bullet

Add this bullet at the start of the "How the strategist works"
subsection (before the "Mechanical work goes to Claude Code" bullet):

```markdown
- **Strategist effort goes to judgment, not bookkeeping.** The
  strategist's highest-value work is research, triage, and catching
  the forks that matter — not mechanical doc maintenance. Bookkeeping
  gets compressed or automated; it does not expand to fill the time.
  v2's lesson: immaculate roadmap flags are legible but low-leverage.
```

### B.4 — `### How the strategist works`, add a bullet

Add this bullet after the B.3 bullet:

```markdown
- **Fresh-eyes review and prompt red-teaming.** At phase milestones
  the strategist dispatches a no-priming subagent to review the work
  and triages the result — the mid-phase audit's value, made
  routine. Before a session prompt reaches Evan, a subagent
  red-teams it for ambiguity and gaps.
```

### B.5 — `### How the strategist works`, replace the handoff-docs bullet

Replace the existing bullet that begins "**Handoff docs stay current
at phase boundaries.**" — in full — with:

```markdown
- **Handoff docs stay current at phase boundaries.**
  `project-state.md` is kept current continuously;
  `project-history.md` and `project-rationale.md` are updated at each
  phase boundary rather than left to drift. Each completed phase
  produces two retrospectives in `docs/retrospectives/`: a
  `-complete.md` (what shipped) and a `-retrospective.md` (how we
  worked). The phase-boundary retrospective is a joint exercise Evan
  and the strategist run together — not a strategist draft. Each
  phase also gets one lightweight mid-phase checkpoint.
```

### B.6 — `### Repo and orientation`, add a bullet

Add this bullet at the end of the "Repo and orientation" subsection
(after the "Session logs end with a handoff status block" bullet):

```markdown
- **Non-ADR decisions are logged.** The strategist records every
  non-ADR call with cross-session consequence — a convention, a
  scoping call, a process choice — as a one-line entry in
  `docs/decisions-log.md`, so decisions that flow as recommendations
  rather than forks stay visible and reviewable. Outside-chat work is
  legitimate; the strategist surfaces anything that landed outside a
  chat at session start. Visibility, not gatekeeping.
```

---

## Appendix C — `docs/decisions-log.md` (verbatim)

```markdown
# Decisions log

A running record of non-ADR decisions — the calls the strategist
makes that are real but do not rise to an Architecture Decision
Record. ADRs are for architecture choices with lasting structural
consequence; session logs capture per-session decisions; this file
captures the cross-cutting strategist calls that would otherwise live
only in chat.

Its purpose is visibility. Per the v2 retrospective's Decision 1,
more calls flow as strategist recommendations rather than forks to
Evan. This log is how those calls stay reviewable — Evan can scan what
was decided and why, without re-litigating, and flag anything he would
have called differently.

## Format

One entry per decision, newest last:

```
- **YYYY-MM-DD — <one-line decision>.** <Why, in a sentence or two.>
  <Optional: what was rejected, and why.>
```

## Process

- The strategist adds an entry when it makes a non-ADR call with
  cross-session consequence — a convention, a scoping call, a process
  choice. In the moment, not batched.
- Entries are immutable once committed, like ADRs and session logs. A
  reversed decision gets a new entry referencing the old one.
- Evan reviews this file at whatever cadence he chooses; flagging an
  entry for discussion is always open.
- A decision that grows structural consequence gets promoted to a
  real ADR; the log entry then references it.

## Log

- **2026-05-14 — The v2 retrospective is a separate companion doc,
  not a revision of `v2-complete.md`.** `v2-complete.md` stands as the
  phase summary; `v2-retrospective.md` is the process-and-relationship
  retrospective. Establishes the per-phase convention: `-complete.md`
  is what shipped, `-retrospective.md` is how we worked.
- **2026-05-14 — The GitHub remote is public.** The project's stated
  identity is eventual public release; building in the open from v3
  is consistent with it. The repo name `unfolder` stays the working
  name; the final-name decision and others remain deferred to v6.
  Rejected: private-until-later, which preserved more optionality but
  forced nothing and matched a more cautious posture than the
  project's own identity.
```

---

## Appendix D — `docs/queue.md` `## Open items` section (verbatim replacement)

Replace everything under the `## Open items` header with:

```markdown
## Open items

- [cleanup] Add two `parseStl` negative-path tests: non-finite coordinate
  (e.g. `vertex NaN 0 0`) and mid-triangle truncation (file ends after 1
  or 2 vertex lines). Both error paths are documented in
  `src/core/parse-stl.ts:11-13` but currently uncovered by tests.
  Surfaced during test-suite review.
- [test] Add a property test for `dihedral.ts`: weights land in
  `[0, π]` and the stage is deterministic. `src/core/dihedral.ts` has
  no property test. Surfaced by the 2026-05-14 codebase assessment
  (finding A5).
- [cleanup] `scripts/baseline-pipeline.ts` runs `paginate` inside the
  `recut` try-block, so a `paginate` throw is mislabelled "failed at
  recut". Give `paginate` its own try-block or relabel. Surfaced by
  session 0018.
- [cleanup] v2 retrospective Decision 3 — machinery prune: remove the
  unused observer-mode section from `docs/strategist-protocol.md`
  (it went unused for all of v2), and resolve the `<short-sha>`
  handoff-block field (drop it, or fill it via a follow-up step).
  Surfaced by the v2 retrospective.
- [pilot] v3 experiment — a live state artifact that maintains itself
  from git, queue, and test state instead of a hand-synced roadmap
  doc. Try once in v3. Surfaced by the v2 retrospective.
- [pilot] v3 experiment — a one-off role inversion: Evan drafts a
  session prompt and the strategist reviews it, to calibrate whether
  the strategist's prompt-craft adds value or just a layer. Try once
  in v3. Surfaced by the v2 retrospective.
```
