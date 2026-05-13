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

## What this history teaches

Three patterns worth noting for future sessions:

**The project's scope tightened through explicit narrowings, not through gradual scope creep.** Each pivot — toward building, toward recreation, toward web app — was a deliberate choice with reasoning. Don't assume current commitments are arbitrary; they're the result of specific decisions, and reopening them requires engaging with the reasoning, not just preference.

**Working agreements emerged from Evan's feedback, not from strategist design.** The strategist proposes; Evan corrects. The current rhythm is the result of three explicit corrections (recommendations not options, mechanical work to Claude Code, drift-prevention via three documents). This pattern is likely to continue — when Evan signals, the strategist should update.

**Documentation pays off across many sessions.** The instinct to write things down — phase plan in the README, reasoning in this rationale doc, narrative here — is what makes the project resilient to context loss. Multi-session projects without written records drift. Multi-session projects with thorough records can survive arbitrary handoffs.

---

## The current moment

As of the writing of this document, we are between Session 0002 and Session 0003. v1 is in progress. We've completed the project skeleton and the `paperfoldmodels` reading. The next session is the first ADR, deciding the v1 algorithm and data structures based on what we learned.

The strategist is also transitioning from chat to Cowork. This document is part of that handoff. After Cowork is set up, Session 0003 will be the first session in the new working configuration.

The project arc ahead is long — five more v1 sessions, then v2-v6. But the foundation is set: clear vision, explicit reasoning, documented working agreements, and a record of how we got here.

Welcome to the project.
