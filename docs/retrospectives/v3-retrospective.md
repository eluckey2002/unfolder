# Retrospective — v3, the working method

This is the companion to `v3-complete.md`. That document records what
v3 *shipped*; this one records *how we worked* to ship it — whether
the working method held, strained, or needs to change. It is the v3
instance of the per-phase convention established in v2-retrospective:
each phase gets a `-complete.md` (what shipped, strategist-authored)
and a `-retrospective.md` (how we worked, joint via `/retrospect`).

It is also the first retrospective produced through the codified
`/retrospect` skill (landed in session 0024). The ceremony no longer
depends on Evan asking for it — that part of the v2 lesson is closed.
What remains is the four-pass structure itself: ground, reframe,
self-lens, converge. That structure held.

## How this retrospective was run

Four passes, with pause-and-direct between each. **Pass 1** — the
strategist grounded in the v3 record: every session log 0021-0029,
ADR 0007, the mid-phase `core-review-2026-05-16.md` audit, the
decisions-log entries, the queue history, the v1 and v2
retrospectives, and the git log for the phase range. Produced a
factual timeline and 24 first-pass observations (observations, not
conclusions). **Pass 2** — clustered the observations into six
proposed decisions, each with context and competing viewpoints, and
walked them one at a time. Evan accepted all six and asked early in
the walk for the strategist to lead with a recommendation rather
than present viewpoints alone — a direct echo of v2-retrospective's
Decision 1 ("AskUserQuestion-style forks are reserved for genuine
either/or decisions; which-approach calls come as a recommendation
Evan can veto, not a fork"). The redirect arrived on the very first
decision; subsequent proposals led with the recommendation.
**Pass 3** — the strategist's honest lens on its own performance.
**Pass 4** — this document.

## What the v3 record showed

1. **The spike pattern earned its place.** Session 0023's
   three-variant comparison turned ADR 0007 into a decision with
   evidence behind every alternative. Without the spike, cut-removal
   adoption would have been "pick by literature read." The spike took
   one session and produced a findings doc that seeded 0025's prompt
   directly.

2. **Skills landed mid-phase, after the spike but before the
   heavy work.** Session 0024 codified six strategist ceremonies as
   executable skills, sequenced between 0023 and the algorithmic
   work. Every subsequent session used `/begin-session`,
   `/red-team-prompt`, `/open-questions`, or `/wrap-session`. The
   code-quality sub-agent review hit 6-for-6 useful findings across
   the six skills — the strongest signal of the phase for
   interpretive sub-agent work.

3. **Two visual gates caught silent bugs the unit suite missed.**
   0027's `reconstructOutline` shared-vertex float drift (~1e-12 mm)
   broke the adjacency walk on real corpus pieces but never appeared
   in synthetic tests, which reused `Vec2` references. 0028's
   `paginate.transformPiece` silently dropped every `RenderablePiece`
   field except `edges` — 0027's `foldability?` survived only because
   `runPipeline` re-assigned it post-paginate. Both were
   gate-pass-side failures; the unit suite couldn't structurally
   catch them.

4. **The mid-phase audit was planned and earned its place.**
   `core-review-2026-05-16.md` was the first deliberate mid-phase
   audit per v2-retrospective Decision 4 (v2's was emergent). Output:
   0 P0, 1 P1 (parse/flatten precision contract — carry-forward from
   May 14; actioned in 0025 via `src/core/eps.ts`), 11 P2. The
   audit's value showed up as much in confirming codebase health as
   in finding new things.

5. **The decisions ledger absorbed 11+ entries and became
   load-bearing.** Cross-references work. Session logs cite it.
   Future-strategist-readable cross-session memory now lives there in
   a way it didn't in v2. The autonomy-calibration mechanism from
   v2-retrospective Decision 3 is operationalized.

6. **The strategist over-predicted implementation behavior in plan
   gates.** v1's "do not predict cumulative test counts" lesson, one
   layer deeper. Session 0026's plan wrote "byte-identical baseline
   after Task 26.3" and "tab overlap (own) = 0 on every row" as hard
   gates; both were wrong against implementation reality, and both
   got reframed mid-session. The red-team-prompt skill catches stale
   refs and structural smells but can't catch implementation-output
   predictions, because the red-team agent has no context.

7. **Sub-agent reliability varies sharply by task type.** Session
   0024's interpretive review (does this skill have a bug?) hit
   6-for-6 useful catches. Session 0029's enumerative count (how
   many `<polygon class="foldability-tint">` elements have which
   hue?) miscounted — reported all 33 tints as `clean` when the
   actual distribution was 7/4/19. The miscount was caught by a grep
   cross-check, but only because the count *looked* surprising.
   Confident sub-agent claims about structurally consequential
   numeric facts cannot be load-bearing without deterministic
   verification.

8. **v3 ran fast with zero outside-chat drift.** Roughly three days
   of wall-clock from 0021 to 0029, vs v2's longer arc. v2 had two
   recorded drift incidents (CLAUDE.md addition, corpus-trigger
   refresh); v3 had zero. The visibility-not-gatekeeping fix from
   v2-retrospective Decision 2 held, but wasn't tested adversarially
   — there was no near-miss this phase.

## The strategist's lens

Four honest gaps. **The strategist delegated synthesis to sub-agents
and let it ride.** The 0029 hue miscount almost shipped a wrong
verdict; the grep cross-check was triggered by surprise, not by
discipline. If the miscount had been less obviously wrong, the
verdict would have shipped. **The strategist over-predicted
implementation behavior in plan gates.** v1's lesson 3 (do not
predict test counts) returned in geometric form — twice in session
0026's plan alone, with the red-team pass unable to catch it.
**The strategist authored `v3-complete.md` unilaterally despite the
v2 warning.** Session 0029's prompt directed me to draft it; I did,
and the sub-agent code-review pass caught five real issues. The
pattern is defensible by the split-with-sub-agent-review framing,
but I didn't propose that framing at plan-time; I just executed the
v2 pattern unchanged. **The strategist didn't notice reusable
patterns until pass 4.** Three sessions ran transient visual-gate
probes; the strategist treated each as session-local rather than as
a shape worth standardizing. The visual-gate tooling decision
should have surfaced at 0027 close, not at v3-retrospective.

What worked, so the account is not lopsided: the 0024 skills'
6-for-6 sub-agent rate; the decisions-log tended into a real
cross-session memory; the red-team-prompt skill used on every
prompt 0026-0029 with material catches; the spike → ADR pipeline as
the working pattern for evidence-based architecture; the mid-phase
audit planned, not emergent, with one P1 fix landed inside the
phase.

## Decisions taken

Six, each resolved.

**1. Subagent reliability calibration.** *Tension:* sub-agents are
labor multipliers but their reliability varies by task type.
*Resolution:* default trust for interpretive sub-agent tasks
(review, critique, find-bugs, score-a-draft); cross-check with
deterministic tooling (grep, jq, scripts) for enumerative claims
before any downstream artifact depends on the count; don't delegate
hard-to-recover state-mutating tasks without a recovery plan.
*Pilot:* when the first v4 sub-agent makes a numeric claim about
the codebase, the strategist verifies once with grep before acting.
If the count was right, drop the cross-check as a habit; if wrong,
the cross-check is durable.

**2. Visual-gate-as-bug-catcher.** *Tension:* unit tests with
synthetic fixtures don't catch float drift or silent field drops;
visual gates do. But each v3 session reinvented its own transient
probe. *Resolution:* every v4 session touching geometric output or
rendering names a visual gate in its plan and runs it before
commit. *Pilot:* early in v4.0 prep, probe Playwright availability
in this environment; if reachable, land `scripts/visual-gate.ts` as
a short reusable harness that any session can `pnpm visual-gate
<input>` against; if not, document the HTML-grid-viewer +
structural-grep pattern from 0029 as the v4 standing fallback.

**3. Strategist plans report, not predict.** *Tension:* plan gates
of the form "X equals N" leak strategist over-confidence into the
plan and produce mid-session reframes. v1's test-count lesson
returned in geometric form. *Resolution:* plan gates cite
measurements with thresholds of concern, not predicted values.
*Pilot:* update `/red-team-prompt`'s checklist with a structural
check ("plan gates of the form 'X equals N' — flag as
predicted-value; suggest report-form rephrasing"). After the first
three v4 plans, score whether the rule held.

**4. Mid-phase process work: budgeted, not unbounded.** *Tension:*
v3 absorbed three parallel process tracks (skills, audit, v4 spec)
without slowing shipping, but the pattern has no natural stopping
rule. *Resolution:* one mid-phase audit per phase (per
v2-retrospective Decision 4, already adopted); skills evolution is
ad-hoc, triggered by friction; forward-looking specs happen at
phase-close by default, mid-phase only when current-phase scope
depends on next-phase shape. *Pilot:* at v4.0 prep, name the v4
mid-phase audit slot explicitly. Track friction signals for skills
evolution. No v5 spec authoring until v4 close.

**5. Retrospective authorship: codify the split.** *Tension:* the
v2 lesson that v2-complete.md was authored unilaterally has been
repeating as an open question; v3 perpetuated the same pattern with
one new element (sub-agent review pass). *Resolution:* codify that
`<phase>-complete.md` is strategist-authored with a mandatory
sub-agent code-review pass, and `<phase>-retrospective.md` is joint
via `/retrospect`. State this explicitly in this retrospective and
in CLAUDE.md so the question stops repeating. The pattern is
correct; the gap was not naming it.

**6. v2 pilots scored; v4 inherits the held ones, drops one, carries
one.** *Tension:* v2-retrospective named seven pilots — five
adopted-as-practice, two experimental. *Resolution:* decisions
ledger, fresh-eyes sub-agent review, red-team-prompt, spike session
type, and mid-phase audit all held strongly and are part of the
working method now. Live state artifact is officially dropped — PR
#10's doc surgery eliminated its motivation. Role inversion carries
to v4 as a still-open one-off: if v4 has a UI session with
high-uncertainty interaction design, that's the natural slot.

## v2's six lessons, scored

All six held.

| Lesson | Verdict | Evidence |
|---|---|---|
| Naive-correct + robust cleanup beats clever-but-fragile core | Held | Cut-removal (naive greedy merge + conservative-reject fallback); smart tabs (score + hard penalty + faceA tie-break); color (Kd-only naive scope) |
| Failure baseline is the best driver a phase can have | Held strongly | `baseline-v3.md` frozen at 0021; every session reported trajectory against it; aggregate trajectory is the v3-complete.md headline |
| A prompt is frozen once handed off | Held | Red-team-revisions land *before* implementer starts on every 0026-0029 prompt; one minor 0029 renumbering of an open-question ID was the only post-handoff edit |
| Mid-phase audit earns its keep | Held | `core-review-2026-05-16.md`; one P1 fix landed inside the phase |
| `git log` at session start | Held | Session-start hook prints cwd, branch, worktree list; zero outside-chat drift this phase |
| ADR for real alternatives; session-log note for naive-first | Held strongly | ADR 0007 (one ADR, three explicit alternatives from spike); smart tabs / audit-viz / color all logged to decisions-log, not ADRs |

Cleanest score yet — v1 had 4 held / 3 partial in v2; v2 has 6 held in v3.

## What v4 pilots

Adopted as practice:

- **Visual-gate-as-bug-catcher** (Decision 2) — every session
  touching geometric output names its gate in the plan.
- **Report-form plan gates** (Decision 3) — predicted-value gates
  are a structural smell; the red-team-prompt checklist catches them.
- **Sub-agent task-type-aware delegation** (Decision 1) — interpretive
  by default; enumerative cross-checked deterministically.
- **`<phase>-complete.md` is strategist-authored with sub-agent
  code-review pass; `<phase>-retrospective.md` is joint via
  `/retrospect`** (Decision 5).
- **Forward-looking specs at phase-close by default; mid-phase only
  when current-phase scope depends on next-phase shape** (Decision
  4).

Flagged as experiments to try in v4:

- **Standing `scripts/visual-gate.ts` harness** — pending Playwright
  availability check; if Playwright is reachable, wire it in;
  otherwise document the HTML-grid-viewer + structural-grep fallback
  as v4 standing pattern.
- **Role inversion** — carried from v2's pilot list, never exercised.
  v4's UI sessions are the natural slot. Evan drafts a prompt, the
  strategist red-teams it, both compare with a strategist-drafted
  version. Once.

## The relationship, as of v3

v3 was high-velocity and high-discipline. Three days of wall-clock
across the phase. Six adopted pilots from v2-retrospective all held.
Zero outside-chat drift. No production bugs shipped — the two silent
bugs both surfaced at visual gates before commit. The phase-close
ceremony ran without scope arguments.

Evan ran as director throughout, with explicit calibration arriving
on the first decision of Pass 2: *what is your recommendation*. That
phrasing tracks v2-retrospective's Decision 1 word for word —
"AskUserQuestion-style forks are reserved for genuine either/or
decisions" — and is the kind of calibration that's load-bearing when
the strategist's authoring habits drift back toward
viewpoints-without-pick. The strategist's job into v4 is to keep
that posture without needing the redirect: lead with the
recommendation, name the viewpoints to ground it, and let Evan veto
rather than choose.

v4 is a different shape than v3. v3 was algorithmic-quality work on
an existing pipeline; v4 is the interactive editor — a React shell
on top of three.js, real UI state, click-to-edit cuts, drag-piece
rearrangement, undo/redo, save/load. The strategist's blind spots
will shift. Visual gates become more central, not less. State
management has its own correctness regime that synthetic unit tests
will miss in different ways than v3's geometric work missed them.
The user-facing-correctness question is genuinely new — v3's quality
bar was *visibly competitive*; v4's quality bar is *interactively
buildable*, which can't be measured from the output alone.

The test of this retrospective is the same as v1's and v2's — if v4
reads it and the working method actually shifted in the right ways,
it worked. If v4 reads the same as v3, it didn't.

Welcome to v4.
