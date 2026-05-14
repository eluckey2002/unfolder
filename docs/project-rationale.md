# Project rationale

This document explains *why* we made the major decisions in `unfolder`. For *what* we decided, see `project-state.md`. For *how the project evolved*, see `project-history.md`. ADRs in `docs/decisions/` will eventually capture some of these decisions formally; this document is the early-stage record before that ADR practice is fully in place.

The structure: each section is one decision, with three subsections — what we chose, what we rejected, and why. Some sections are longer than others; complexity reflects how consequential the decision is.

---

## The project's identity: Pepakura recreation, not pipeline tool

**Chose:** Build a free, browser-based recreation of Pepakura Designer — a real application aimed at feature parity with the existing commercial tool, eventually for public release.

**Rejected:**
- *Build a Python pipeline tool for personal use.* Would have been smaller, faster to a working baseline, and immediately useful for Evan's generative-art-to-fabrication workflow. The original direction we were heading.
- *Build a Blender addon.* PolyZamboni-style. Would have shortcut the UI work by piggybacking on Blender's existing 3D editor.
- *Stop at v2 or v3 of the original phase plan.* Tool that works for personal use, no UI, no parity with Pepakura.

**Why this choice:**
Evan named recreation explicitly as the goal after we walked through what each phase would actually look like. The decision shaped everything downstream: it requires interactivity (so v4 is essential), it requires polish (so v5 matters), it implies eventual public release (so v6 exists at all). The earlier "Python pipeline tool" framing produced a smaller project with a softer landing — recreation produces a larger project with no soft landing before v4.

The cost: recreation is significantly more work than personal-use. Stopping at v3 produces "a worse Pepakura" that nobody would choose over Pepakura. Intermediate states are less independently satisfying than they were under the original plan.

The benefit: a genuinely useful project for the broader community, a deeper learning opportunity (you can't half-build an application without learning what makes applications hard), and an output that matters beyond Evan's personal toolset.

---

## Tech stack: TypeScript + browser-only

**Chose:** TypeScript with strict mode, all logic running in the browser. No server, no backend, no Python. Static deployment.

**Rejected:**
- *Python backend with JS frontend.* Would have let us reuse Python's mature mesh-processing ecosystem (trimesh, OpenMesh, networkx). Easier early development, especially given Evan's Python familiarity.
- *Python-first now, port to TypeScript at v4.* Get to a working baseline fast, pay the rewrite cost later.
- *Rust/C++ core compiled to WASM, called from both Python and JS.* Maximum reuse, language-agnostic core.

**Why this choice:**
Pepakura is a local application. Its feel — drag a mesh in, click around interactively, get instant feedback — depends on everything happening on the user's machine with no network round-trip. A server-backed clone can't reproduce that feel without serious engineering. Browser-only with TypeScript is the cleanest path to matching the local-app experience.

The rewrite cost of Python-first-then-port is real and often underestimated. Algorithm choices that look natural in Python don't always translate cleanly. The interface boundaries you draw in one language aren't always the right ones for another. Better to commit to the target language from the start and live with the smaller library ecosystem.

WASM was tempting for performance, but premature. We can drop to WASM for hot paths in v4+ if we hit performance walls. For v1-v3, pure TypeScript is fast enough and dramatically simpler.

The browser target also has a distribution dividend: static deployment on GitHub Pages or Netlify is free forever. No hosting, no scaling, no ongoing infrastructure cost. Matches Pepakura's "download once, runs forever" model.

---

## When the UI gets built: v4, not v1

**Chose:** v1-v3 is a batch/CLI-style tool with minimal HTML scaffolding. The real interactive UI (3D viewport, 2D layout panel, edge editing, piece dragging) starts at v4. React + react-three-fiber is the UI stack.

**Rejected:**
- *Build the UI from day one.* Would mean v1 is already a real application. More interesting to look at early; much slower to make the algorithms right.
- *Use plain JavaScript / vanilla DOM throughout.* No framework. Smaller dependency footprint.
- *Use Svelte or Vue instead of React.* Either could work; Svelte particularly elegant.

**Why this choice:**
Building algorithms inside a UI loop is hard. You can't see what's wrong because the UI hides the data structures. By keeping v1-v3 "core logic plus a dumb HTML page to trigger it," we get clean algorithm development with visual debugging that doesn't require building an editor first.

React is the default for a real app at v4 scale because the ecosystem is densest. react-three-fiber is the de facto way to combine React's component model with three.js. The resources, tutorials, and Claude Code's familiarity are all better with React than with Svelte or Vue. Svelte is more elegant but smaller; not the right tradeoff when we're targeting feature parity with a 20-year-old commercial product.

Vanilla JS through v4 was rejected because state management for an interactive editor (current mesh, current cut assignments, current layout, undo/redo) is exactly what frameworks solve. Reinventing that costs more than the framework dependency.

---

## Repository structure: core/app split from day one

**Chose:** Two directories under `src/`: `core/` (pure logic, no DOM) and `app/` (UI, application shell). The split is structural and enforced from session one, even though v1 has no UI to speak of.

**Rejected:**
- *Flat `src/` structure, refactor at v4 when the UI arrives.*
- *Monorepo with separate packages (`@unfolder/core`, `@unfolder/app`).*

**Why this choice:**
By v4 we'll want the unfolding engine usable as a standalone library, independent of the React app. If we don't enforce the split early, v4 starts with a refactor. The split costs nothing at v1 (just a directory organization decision) and saves real work later.

Monorepo with separate packages was the more advanced version of this; rejected for v1 as premature. We can promote `core/` to its own package later if we want to publish it on npm independently. For now, conceptual separation is enough.

Matches Evan's existing Ver_dep methodology — contracts between modules, with `core/` and `app/` having clean interfaces.

---

## Working with references before writing code

**Chose:** Before bootstrapping v1, spend a session reading `paperfoldmodels` (a Python reference implementation) and producing a writeup. Same approach for other references when phases need them — PolyZamboni for v3, Takahashi's paper for v3's algorithmic core.

**Rejected:**
- *Bootstrap first, read references later.* Get visible progress sooner; understand references better after feeling the problem ourselves.
- *Skip references entirely and derive the algorithms from scratch.* More learning per hour, but slow and error-prone.
- *Read all four references at once.* Procrastination dressed as research.

**Why this choice:**
Reading one focused reference gives us vocabulary and a mental model before we start naming things in our own codebase. Renaming later is cheap but annoying. Algorithm choices that look elegant in theory often fail in practice; reading a working implementation surfaces those gotchas without us paying for them ourselves.

The "read for understanding, not reuse" framing matters. We're not transcribing `paperfoldmodels` into TypeScript. We're extracting concepts and lessons. Our code is our own, informed by what we've read.

The reading-first choice was specifically Evan's preference after I laid out both orderings. He prioritized correctness of foundation over momentum.

---

## Phase plan: v1-v6 with explicit "useful on its own" requirement

**Chose:** Six phases, each producing something useful in its own right rather than scaffolding for the next. Detailed in `README.md`.

**Rejected:**
- *Looser phasing without clear "done" criteria.* Easier to start, but hard to know if a phase is complete.
- *Time-boxed sprints instead of capability-based phases.* "Spend two weeks, see what shipped."
- *Single-phase plan, defer detailed breakdown until needed.*

**Why this choice:**
Each phase having a clear bar prevents scope creep within the phase and gives a natural decision point at each boundary: do we keep going, or is this enough? Capability-based phases work better than time-boxed ones for this kind of long-arc work, because the time-to-completion of each capability isn't reliably predictable.

The "useful on its own" requirement is what makes intermediate stopping points real options. v2 alone is a useful batch tool. v3 alone produces clean output. v4 alone is a usable application even before texture support. Without this requirement, partial completion feels like failure.

---

## Local git only through v2; public GitHub remote at v3

**Chose, v1–v2:** Initialize git in the project root, commit
frequently, no remote configured. **Revisited at the v2→v3
boundary:** a public GitHub remote at
`github.com/eluckey2002/unfolder`, with CI.

**Rejected:**
- *GitHub remote from day one* (public or private) — at v1.
- *No version control at all early on.*
- *Private remote, public only at v6* — at the v3 revisit. It
  preserved more optionality but forced nothing, and matched a more
  cautious posture than the project's stated identity.

**Why local-only through v2:**
Evan's preference. The benefits of git — history, rollback, clean
session boundaries — come from git itself, not from the remote.
Skipping the GitHub setup early avoided a cluster of decisions —
public vs. private, repo name, a license committed to a
public-facing artifact — that didn't need to be made yet.

**Why public, and why now:**
By the v2→v3 boundary the deferred decisions were due. The codebase
audit had flagged the absence of CI, and CI has nowhere to run
without a remote; v3's PDF-export work and growing test surface make
CI more valuable still. The project's stated identity is eventual
public release for community use — building in the open from v3 is
consistent with that, where private-until-v6 would have been a more
cautious posture than the identity calls for. The repo name
`unfolder` stays the working name; the final-name decision and the
rest remain genuinely deferred to v6. Private→public is a one-click
change, so the cost of having chosen public early is low if the
posture ever needs revisiting.

---

## Conventions: Conventional Commits, ADRs, session logs

**Chose:** Conventional Commits style for messages (`feat:`, `chore:`, `docs:`, etc.). ADRs in `docs/decisions/` with a fixed format (Context / Decision / Consequences). Session logs in `docs/sessions/` with a fixed format (What attempted / What shipped / What's next).

**Rejected:**
- *Looser commit message style.*
- *No ADRs.* Decisions stay in chat or get rederived as needed.
- *No session logs.* The commits themselves are the history.

**Why this choice:**
The discipline of writing things down pays off across many sessions. We have 50+ planned sessions ahead (v1 alone is 8 more); without written decision and session records, drift is inevitable. ADRs let future sessions check "did we already decide this" without re-litigating. Session logs let future sessions check "what state were we in" without re-reading code.

The format constraints (immutable ADRs, fixed sections) prevent these from sprawling into novels. Short and structured is more useful than long and free-form.

Conventional Commits is more discipline than strictly necessary, but it scales well and pairs cleanly with the rest of our structured practices.

---

## Cowork transition

**Chose:** Move strategic conversation from Claude.ai chat to Cowork, which gives Claude direct filesystem access to the project. Claude Code remains the implementation tool.

**Rejected:**
- *Stay in Claude.ai chat* for strategy, continue relaying everything through Evan.
- *Use Claude Code for strategy too* — one tool, two modes (strategic conversation vs implementation sprints).

**Why this choice:**
The chat-based relay had real costs. Every layer (chat → Evan → Claude Code → output → Evan → chat) is a chance for drift, summary loss, and stale state. With Cowork reading the actual repo, the strategist's prompts and reviews are grounded in what actually exists, not paraphrased state.

Cowork and Claude Code are optimized for different things. Cowork is built for longer, more conversational work — planning, drafting, reviewing. Claude Code is built for focused implementation sprints. Using each for what it does best is better than collapsing them.

The transition cost: Cowork-me doesn't have access to the original chat conversation. The three documents (state, rationale, history) are the explicit handoff designed to preserve continuity. Evan's instinct that drift was a real risk drove the creation of these documents — without them, the rationale and history would be lost at the transition.

---

## Working agreements with Evan

A category of decisions about *how* we work, not what we build. Captured in `project-state.md` as current state; the reasoning is below.

**Lead with recommendations, not options.** Decided after Evan said "always provide your recommendations and give your reasoning." Earlier in the conversation I was offering option-lists for his selection; he correctly pointed out this offloaded synthesis work onto him. The shift was: present a concrete recommendation with reasoning, mark uncertainty when it exists, let Evan override.

**Mechanical work goes to Claude Code, not Evan.** Decided after Evan said "I would rather be having claude code do these type of things — the less I have to do the better." I had been asking him to run shell commands; he correctly noted that was offloading mechanical work onto him. The shift was: I prepare prompts, Claude Code does the work (including inspection, file creation, commits), Evan relays and reviews.

**Evan is involved in decisions initially; will signal when to flow through silently.** Decided after Evan said "at first, let me be involved. i will tell you when i trust your reccs." Reasonable: Evan is developing intuition about what the strategist's recommendations look like, and high involvement now becomes lower involvement later as calibration builds.

These three agreements together define the current rhythm. Each came from Evan's explicit feedback, not from a strategist proposal, which is worth noting — the working agreements have been emergent, not designed.

---

## What's been deliberately deferred

Not every decision has been made. A few that are explicitly open:

- **Final project name.** `unfolder` is a working name. Acceptable for v1-v3 internal work; worth revisiting before v6 distribution.
- **GitHub remote and visibility.** Will matter for v6, doesn't matter now.
- **License.** MIT planned, not committed to the repo yet.
- **Template gallery / model sharing infrastructure.** v6 concern.
- **Whether to integrate with Evan's generative art workflows (String Theory, etc.).** Possible v4+ direction; deferred until we have a working unfolder.

Deferring decisions is a feature, not a bug. Making decisions too early locks in choices before we have the information to make them well.

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
