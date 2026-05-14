# Project history

This document tells the story of how `unfolder` came to be the project it is. For *what* the project currently is, see `project-state.md`. For *why* each major decision was made, see `project-rationale.md`. This is the narrative arc — the order things happened, the pivots, the moments that shaped the project's identity.

History matters because the current shape of the project isn't arbitrary. Each narrowing of scope was a deliberate choice. Without this record, a future session might propose something we already considered and rejected, or miss why a current commitment matters.

---

## Origins: an open question

The project began as an open exploration, not a defined product. Evan came in asking about algorithms or applications that could take a 3D model and produce origami-style folding instructions, or take a 2D paper and indicate how to fold it into a 3D shape. The original framing didn't distinguish between true origami (single sheet, no cuts), papercraft (cuts allowed), or developable-surface decomposition (smooth shapes segmented into flat patches). All three were on the table.

The first move was orientation: laying out the landscape of approaches without committing to any. The strategist sketched the categories — origami proper, papercraft/unfolding, developable surfaces — with the major tools in each (TreeMaker and Origamizer for origami; Pepakura, Dunreeb, the Blender Paper Model addon for papercraft; Rhino+Grasshopper for developable surfaces).

Evan's first explicit choice was to stay in comparison mode rather than commit. The second was to ask for a comparison of the three main papercraft tools — Pepakura, Blender addon, Dunreeb — at which point the strategist had to do real research and corrected an earlier inaccuracy: Dunreeb is a Maya plugin, not a standalone tool, so the practical comparison is really Blender addon vs Pepakura.

---

## The first pivot: toward building, not buying

After the tool comparison, Evan asked how Claude Code could be used for this work, and whether there were existing algorithms to reuse. The strategist's first answer leaned heavily on existing implementations — `paperfoldmodels`, `PolyZamboni`, `unfolding-mesh`, `osresearch/papercraft` — framing Claude Code as a glue layer between off-the-shelf tools.

Evan corrected this: he wanted to know how Claude Code could *itself* be the tool or the algorithm, not just glue between Blender and Pepakura. That was the first meaningful pivot — away from "use Pepakura, automate it" and toward "build the unfolder ourselves."

The strategist responded with the first version of a phased plan (v1-v3 with v4+ as open-ended directions). At this point the target was a tool Evan would use himself — not a Pepakura competitor, just a working unfolder shaped to his pipeline.

---

## The second pivot: toward Pepakura recreation

Evan then said directly: "i want to build towards recreating Pepakura."

This was a much bigger commitment than the original phased plan accounted for. The strategist had to retune everything: v3 was no longer the natural stopping point; the work didn't really feel complete before v4 (interactive editor). The plan had to extend through v5 (feature parity) and v6 (distribution), and the implications of those phases — building a real application, eventual public release — had to be made explicit.

The strategist named the costs honestly: significantly more work, no soft landing before v4, intermediate states (v3 only) that wouldn't be independently satisfying. Evan accepted those costs, knowing them. That deliberate eyes-open commitment is what makes recreation the project's true identity rather than a casual aspiration.

---

## The third pivot: web app, not Python tool

With recreation as the target, the next decision was tech stack. The strategist asked Evan to choose between three options for the v4 UI shell: web app (HTML/JS, three.js), Python desktop GUI (PyQt-style), or Blender as the UI shell. Evan chose web app.

This decision had retroactive consequences. v1-v3 had been assumed to be a Python pipeline that would later be wrapped in a UI. With "web app" as the v4 target, the right call was to build v1-v3 in TypeScript from the start, so the engine the UI consumes is the engine we've already built — no rewrite at the v3→v4 boundary.

This was the moment the project became what it is now: a browser-based TypeScript implementation of a papercraft unfolder, aimed at eventual feature parity with Pepakura.

---

## Defining the working relationship

In parallel with the technical decisions, the working relationship between Evan and the strategist took shape through several explicit moments:

**Evan asked to be guided through what to give Claude Code.** The strategist proposed a session-based structure (one focused task per session), with explicit roles: Evan as director, Claude Code as implementer, strategist Claude as planner and reviewer. Evan accepted this framing.

**Evan committed to local git only, no GitHub remote yet, no skill scaffolding from his Ver_dep methodology.** Simple setup, room to upgrade later.

**Evan said: trust your recommendations for the rest.** This was meant as a one-time delegation of the setup decisions, not a permanent stance.

**On the first concrete decision, Evan corrected the previous instruction:** "at first, let me be involved. i will tell you when i trust your reccs." This was the actual working agreement: high involvement now, calibrating over time. The strategist updated its behavior accordingly.

**Evan said: always provide your recommendations and give your reasoning.** A small but consequential instruction. Earlier the strategist had been offering option-lists for Evan's selection; this nudge moved the relationship to "strategist commits to a recommendation, Evan overrides when wrong." It removed synthesis work from Evan.

**Evan said: I would rather be having Claude Code do these type of things — the less I have to do the better.** This was triggered by the strategist asking Evan to run shell commands. Evan correctly observed that any mechanical task should be Claude Code's job, not his. The strategist updated to: prep prompts, Claude Code does the work, Evan relays output. Even inspection became a Claude Code task.

These four moments — involvement preference, recommendation preference, mechanical-task delegation, and the larger "let Claude Code be the tool" framing — together define the current working rhythm. Each came from Evan's explicit signal, not from strategist proposal.

---

## The sessions begin

After all the planning and reframing, actual work started in earnest with the project skeleton.

**Session 0001** created the directory structure, the docs READMEs, the gitignore, and the initial commit. Mid-session, Claude Code caught a gitignore anchor bug — the unanchored `references/` pattern was excluding `docs/references/`, which we wanted tracked. Claude Code fixed it independently and made a clean second commit. This was the first concrete demonstration that Claude Code as implementer was working well: catching real bugs, fixing them at the root, committing with clear scope.

The strategist used this as a learning moment: the original prompt had paraphrased the gitignore pattern instead of giving exact syntax. Going forward, prompts that specify formal syntax (gitignore, regex, glob) need to use exact patterns, not intent-level descriptions.

**Session 0002** was the read of `paperfoldmodels` — the first reference implementation. The strategist had originally proposed bootstrapping first and reading references when relevant; Evan's "fine with as many sessions as needed" disposition let the strategist flip the order to "read first, then bootstrap." Reading gives vocabulary and naming before we start naming things in our own codebase. Renaming later is annoying.

---

## The Cowork transition

After Session 2, Evan proposed moving from chat-based collaboration to Cowork — giving the strategist direct filesystem access to the project. The strategist endorsed this enthusiastically: the chat-based relay had real costs (drift across summary layers, stale state) that Cowork's direct access would eliminate.

The transition raised a serious problem: Cowork-me wouldn't have access to the original chat conversation. The strategist initially proposed a single state document for handoff, but Evan correctly pushed back: he wanted to preserve "as much of you" as possible, not just the bare decisions. He named drift explicitly as the risk.

In response, the strategist proposed three handoff documents instead of one: `project-state.md` (what we're doing), `project-rationale.md` (why we made the choices we made, including discarded alternatives), and `project-history.md` (this document — the narrative arc).

The reasoning: state documents alone strip context. Rationale documents preserve the reasoning behind each decision. History documents preserve the arc of how decisions came to be. Together they give a new session (or a new strategist instance) layered context that no single document could provide.

That three-document handoff is the artifact you (a new Claude session, or future Evan, or anyone joining the project) are now reading. It exists because Evan caught a problem the strategist initially underestimated.

---

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

---

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

---

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

---

## v2: the functional unfolder

v2 turned the walking skeleton into a tool that produces buildable
papercraft. It ran eight sessions, 0012 through 0019, and unlike v1 its
session order was not a matter of preference — the pipeline's
dependency chain fixed it.

Session 0012 added the OBJ parser, so the corpus could be more than
three.js-generated STL solids. Session 0013 built that corpus: eleven
models, four from a CC0 Kenney pack, a low-poly deer, two procedurally
generated convex baselines, every one verified a closed two-manifold —
and, more importantly, a baseline showing only 5 of the 11 unfolded
cleanly under v1's plain DFS. That failure baseline drove the rest of
the phase. Session 0014 replaced the DFS with a dihedral-weighted
minimum spanning tree (ADR 0004) and moved the baseline to 7 of 11 —
with regressions on the most concave shapes that prompted a research
survey to confirm the architecture was sound. Session 0015 added
overlap detection on top of `polygon-clipping`. Session 0016 added
automatic recut — greedy set-cover over the overlap tree-paths (ADR
0005) — and that was the payoff: every piece of every model now
internally overlap-free. Sessions 0017 and 0018 made the output
buildable and printable — glue tabs with matched edge labels, then
multi-page bin-packing onto physical Letter pages at one consistent
scale. Session 0019 closed the phase: an end-to-end integration test
that codifies v2's ship-state guarantee, a guard against the one latent
bug a mid-phase audit had found, and the v2 retrospective.

---

## A mid-phase audit

Something new happened in the middle of v2. Between sessions 0016 and
0017, a full four-axis codebase audit was run — architecture, tech
debt, test coverage, roadmap-versus-reality — as a read-only
assessment. It found no critical bugs but one genuine latent P1: a
disconnected input mesh would be silently mishandled rather than
rejected. It surfaced real test gaps. And the strategist's triage of it
did something worth recording: it argued back. Several findings the
audit rated P1 were recalibrated — already owned by an ADR, or
unreachable through the type system, or gated on a decision not yet due
— and only the genuine items were queued. The audit became a committed
artifact (`docs/audits/`), and the practice — a mid-phase audit,
triaged rather than rubber-stamped — is one v3 should repeat.

---

## What this history teaches

Three patterns worth noting for future sessions:

**The project's scope tightened through explicit narrowings, not through gradual scope creep.** Each pivot — toward building, toward recreation, toward web app — was a deliberate choice with reasoning. Don't assume current commitments are arbitrary; they're the result of specific decisions, and reopening them requires engaging with the reasoning, not just preference.

**Working agreements emerged from Evan's feedback, not from strategist design.** The strategist proposes; Evan corrects. The current rhythm is the result of three explicit corrections (recommendations not options, mechanical work to Claude Code, drift-prevention via three documents). This pattern is likely to continue — when Evan signals, the strategist should update.

**Documentation pays off across many sessions.** The instinct to write things down — phase plan in the README, reasoning in this rationale doc, narrative here — is what makes the project resilient to context loss. Multi-session projects without written records drift. Multi-session projects with thorough records can survive arbitrary handoffs.

---

## The current moment

As of the v2 wrap-up, v2 — the functional unfolder — is complete and
merged to `main`. The pipeline runs ten stages end to end and produces
buildable papercraft for real low-poly meshes: every piece overlap-free,
tabbed, labelled, and packed onto printable pages. Five ADRs, nineteen
session logs, two phase retrospectives, a managed queue, and an
end-to-end integration test that guards the ship state are all in the
repo.

The next phase is v3 — quality output: optimized cuts, audit
visualization, color and texture passthrough, real PDF export. Its
session-level plan does not exist yet; drafting it is the first task of
the next Cowork session, which will pick up the project using this
updated handoff package as its entry point. The test is the same as it
was at the v1 boundary: if the package is good, the next strategist
loses nothing.

Welcome to v3.
