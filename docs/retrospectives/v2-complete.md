# Retrospective — v2 complete

This is the second phase-boundary retrospective. Like the first, it is
the durable record of what v2 became and what the working method
became across it — the lessons that would otherwise live only in a
Cowork chat and evaporate at the next context boundary. Read
`v1-complete.md` first; this one assumes it.

## What v2 delivered

The tangible: the pipeline grew from v1's six pure-function modules to
ten. New stages — `parse-obj`, `dihedral`, `overlap`, `recut`, `tabs`,
`paginate` — and meaningful evolution of `spanning-tree` (DFS replaced
by a dihedral-weighted Kruskal MST), `flatten`, and `emit-svg`. Two new
ADRs on the load-bearing algorithm decisions: 0004 (dihedral-weighted
MST) and 0005 (greedy set-cover recut). A real test corpus replaced the
three platonic solids — eleven models, sourced CC0 and procedurally
generated, every one verified a closed two-manifold. An end-to-end
ship-state integration test and a promoted overlap-free property test.
The pipeline now runs parse -> adjacency -> dihedral weights ->
spanning tree -> flatten -> overlap detect -> recut -> tabs -> paginate
-> emit, and on the full corpus it produces buildable papercraft: every
piece internally overlap-free, labelled, tabbed, and packed onto Letter
pages at one consistent scale.

The intangible: where v1 *invented* the working method, v2
*stress-tested* it. v2's sessions were bigger, the algorithms were real
(set-cover, MST, bin-packing, polygon clipping), two of them were
ADR-bearing, and a mid-phase codebase audit was run against the whole
thing. The method held under that load — and it picked up speed.

## What worked

The dependency-chain plan. v2's stages had a hard one-directional
dependency order — corpus before the heuristic that needs it,
detection before recut, recut before tabs, tabs before pagination —
and the session plan simply followed it. Each session consumed the
previous session's output across a stable type contract. The "first
three detailed, the rest a deliberate sketch" planning decision paid
off: the sketched sessions were refined as the early ones landed and
informed them.

The failure baseline. Session 0013 didn't just build a corpus — it
produced a baseline showing 5 of 11 models unfoldable under v1's plain
DFS. That number became v2's north star. Every later session was
measured against it: dihedral weighting moved it to 7 of 11, recut
moved it to every-piece-clean. Success was a number that changed, not
a feeling.

Spec-style prompts held up for genuinely algorithmic work. Describing
set-cover recut or shelf bin-packing as behavior — not code — and
letting Claude Code implement against current library knowledge
produced clean implementations, and the implementation reports kept
catching real things: a `polygon-clipping` import that crashed under
vite-node, a recut return-shape that needed extending for downstream
rendering.

ADR discipline got exercised and held. ADRs landed when the decision
was acute and had real alternatives — 0004 (dihedral vs. length
weighting), 0005 (greedy set-cover). They were correctly *not* written
when the decision was a naive-first within-stage choice — overlap
detection, tabs, pagination all recorded their choices in session
logs, not ADRs. The line between "decision worth a durable record" and
"session-log note" got tested across six sessions and stayed legible.

The mid-phase codebase audit was new this phase and earned its place.
A four-axis read-only assessment, run between sessions 0016 and 0017,
caught a latent P1 bug (a disconnected input mesh silently mishandled),
surfaced concrete test gaps, and — importantly — the strategist's
triage of it recalibrated several findings the audit over-weighted
rather than reflexively acting on all of them. An audit you partly
argue with is more useful than one you rubber-stamp.

And v2 found a faster rhythm. Evan asked for it directly — "i want to
get to the good stuff and start to move faster" — and the method
adapted: less sequential gating of non-blocking work, prompts drafted
and run in quicker succession, sessions allowed to land without every
one waiting on a full strategist review loop. The structure didn't
break under the higher speed.

## What did not work, or cost us

The dihedral heuristic was mediocre on concave organic shapes. Session
0014 was a genuine partial regression — croissant, deer, and
meat-sausage came out with *worse* overlap counts than plain DFS. That
prompted a real strategic doubt — should we be researching a better
algorithm? — answered with a research survey that concluded the
architecture was sound and the heuristic was a known-mediocre naive
choice. The actual fix was recut (0016), not a cleverer tree. The
lesson is not that 0014 failed; it is that a heuristic which regresses
some inputs is normal, the survey was the right response to the doubt,
and "naive tree plus robust recut" beat "chase the perfect tree."

The corpus sourcing was a detour. Sourcing versus generating models
went back and forth; the Kenney Food Kit pack had a doubled-faces
export quirk that broke the first `prepare-corpus.py`; the low-poly
deer arrived as three disconnected components. It resolved into a clean
verified eleven-model corpus, but it cost more cycles than the plan
budgeted.

A prompt was edited after it had been handed off. The 0016 prompt's
draft of ADR 0005 carried a baseline number the strategist corrected
*after* the prompt was already available to run, so the committed ADR
carried the pre-edit number. Immaterial in substance — ADRs are
immutable and the reasoning holds either way — but the rule it teaches
is real: once a prompt is handed off, it is frozen; a change is a new
prompt or an explicit flagged amendment.

Outside-chat drift recurred. Work landed on `main` without the
strategist in the loop — a session ran and a corpus-trigger refresh
committed between strategist turns. `git log` at session start caught
it, which is exactly why that discipline exists — but the recurrence
says the discipline has to stay conscious, not assumed to have been
internalized.

## Lessons carried into v3

1. Naive-correct plus a robust cleanup beats a clever-but-fragile core.
   Dihedral weighting is mediocre; recut makes the output buildable
   anyway. v3's optimized-cut work should remember which half did the
   real work.
2. A failure baseline is the best driver a phase can have. v3 should
   establish its own: against what does "quality output" visibly fall
   short today?
3. A prompt is frozen once handed off. Amend explicitly or write a new
   one.
4. The mid-phase audit earns its keep — schedule one mid-v3.
5. `git log` at the start of every chat. Outside-chat drift recurred in
   v2; it will recur again if the check lapses.
6. ADR for a decision with real alternatives and consequences;
   session-log note for a naive-first within-stage choice. The line
   held in v2 — keep it.

## What changes for v3

v3 — quality output — is a different kind of work than v2. v2 *built*
the pipeline stages; v3 *improves* them. Takahashi-style topological
surgery for better cuts, smart tab placement, audit visualization,
color and texture passthrough, real PDF export. The work shifts from
"make the stage exist" to "make the stage good," which means more of it
is refactoring inside modules the audit already flagged as the
cognitive-load hotspots — `recut.ts`, `flatten.ts`. The code-review
subagent matters more here than it did in v2.

v3 also introduces the first real external-format output — PDF, via
`pdf-lib` — and the first visualization work, the foldability audit
view. That is closer to UI than anything v2 touched. Probe `pdf-lib`
before designing around it; v1's lesson about probing new tooling
applies directly.

And the GitHub-remote question, deferred since v1, is now genuinely
live. v2 left it parked because CI has nowhere to run without a remote
— but v3's PDF output, growing test surface, and the integration test
built in session 0019 all make CI more valuable. It should be settled
at the v2->v3 boundary or early in v3.

v3's session-level plan does not exist yet. Drafting it is the first
task of the next Cowork session — the same way v2's plan was drafted
fresh after v1. This retrospective, the updated handoff documents, and
the integration test that now guards v2's ship state are its entry
point.

Welcome to v3.
