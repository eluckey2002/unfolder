# Reference: unfolding algorithm survey

## What this is

A scoped survey of the open-source papercraft unfolders and the
research literature, prompted by session 0014's result — the
dihedral-weighted MST made the concave corpus models *worse* on raw
overlap count, which raised the question of whether the project is
on the right algorithmic track.

The short answer: yes. This survey is the evidence.

It is a landscape pass from secondary sources — project pages,
addon docs, paper abstracts and summaries — not a deep read of the
papers or the source. Deep study of specific approaches is a v3
task; this exists to confirm the architecture and give v3 a menu.

## The architecture question — settled

Every serious unfolder, open-source and academic, uses the same
shape:

> build the **dual graph** of the mesh → choose a **spanning tree**
> of it (tree edges are folds, the rest are cuts) → **flatten** by
> walking the tree → **resolve overlaps**.

The research literature states it plainly: the standard method is
to assign weights to the dual-graph edges so that the minimum
spanning tree unfolding has a high probability of not overlapping.
That is exactly the unfolder pipeline — `adjacency → spanning-tree
→ flatten → emit`, with overlap detection and recut still to come.
There is no competing architecture to pivot to. And it is worth
knowing: whether *every* convex polyhedron even *has* a
non-overlapping edge unfolding is an **open problem** — there is no
guaranteed-correct algorithm, so every practical tool runs on
heuristics. Our heuristic approach is not a shortcut around a
known-better method. It is the method.

So 0014's regression is not an architecture signal. The variation
between tools — and where all the real work is — lives in two
places: the **weighting heuristic** and the **overlap-resolution
strategy**.

## The weighting-heuristic landscape

The spanning tree is chosen by weighting dual-graph edges and
taking a spanning tree. The heuristics in use:

- **Edge length** — `paperfoldmodels`. Long 3D edges preferred as
  folds; short edges become the glued cuts.
- **Unsigned dihedral angle** — *us, ADR 0004*. Flat edges
  preferred as folds, sharp creases as cuts. Session 0014 showed
  this is mediocre on highly concave organic shapes.
- **Separated convex / concave dihedral** — the Blender **Export
  Paper Model** addon exposes *Face Angle Convex* and *Face Angle
  Concave* as separate weights. This is exactly the "signed
  dihedral" refinement session 0014's implementer flagged — not
  exotic, it is shipping practice.
- **Blended, tunable weights** — Export Paper Model does not pick
  one heuristic; it sums convex-angle + concave-angle + edge-length
  as tunable terms, and randomly perturbing them to retry is a
  documented tactic. The practical tools blend.
- **Steepest Edge** — from Schlickenrieder's thesis, which proposed
  19 heuristics. Pick a random target direction; cut the "steepest"
  edge at each vertex. It is the research-favored single heuristic:
  empirically it unfolds *arbitrary convex polyhedra* with ~100%
  success. Caveat: that guarantee is **convex-only** — our corpus
  is deliberately non-convex, so Steepest Edge is a strong option,
  not a silver bullet.

The takeaway: our ADR 0004 heuristic sits at the simple end of a
well-explored space. The honest read of 0014 — pure unsigned
dihedral is a weak single heuristic — matches what the field
already knows. The better options (separated convex/concave,
blended weights, Steepest Edge, randomized multi-try) are real and
known. They are the menu for the *post-0016* heuristic decision,
when we can measure final piece count instead of a pre-recut proxy.

## The overlap-resolution landscape

- **MST-first, then greedy recut** — `paperfoldmodels` and our v2
  plan (0015 detect, 0016 recut). Build the tree, flatten, find
  overlapping face pairs, greedily cut fold edges on the overlap
  paths, split into pieces.
- **Greedy cut-addition from connected** — **PolyZamboni**'s "Auto
  Unfold" starts with *no* cuts and greedily *adds* cuts until every
  region unfolds overlap-free. Different control flow, same
  greedy-heuristic spirit, same kind of result.
- **Heavy optimization** — Takahashi's "Optimized Topological
  Surgery" uses a **genetic algorithm** to reach a single connected
  patch with good paper usage; others use **tabu search**, or
  **progressive mesh approximation** (simplify, unfold, un-collapse).
  These target single-patch layouts or optimal paper usage. v3
  work, not v2.

Greedy recut is the standard practical floor — what is planned for
0016 is the right v2 move. The optimization approaches are the v3
ceiling.

## Tools surveyed

- **paperfoldmodels** — already studied in depth
  (`paperfoldmodels.md`). Edge-length MST + greedy set-cover recut.
  The minimal version of the standard architecture.
- **PolyZamboni** (Blender addon, AntonFlorey) — greedy cut-addition
  from a connected start; visual green/red unfoldability feedback;
  manual cut and glue-flap editing. The most polished open-source
  low-poly papercraft tool. Worth a source read for v3/v4 — its
  editing UX is close to what v4 wants.
- **Export Paper Model** (Blender addon, addam) — blended tunable
  weights (convex angle, concave angle, edge length) + SVG export.
  The clearest example of a blended heuristic in practice.
- **rodrigorc/papercraft** — standalone, OBJ input, printable
  output. Another data point on the same architecture.
- **Takahashi "Optimized Topological Surgery" (2011)** and
  riceroll's `unfolding-mesh` implementation — the genetic-
  optimization approach named for v3.

## What it means for the project

- **v2 architecture: no change.** The pipeline shape is the
  universal one. 0014's regression is a heuristic-quality issue,
  not an architecture issue — confirmed.
- **0015 (overlap detection): as planned.** Detection is the easy,
  well-understood part — a geometric predicate over the 2D layout.
  The one piece of received wisdom: O(F²) all-pairs is fine for our
  corpus, but a spatial index is the known scaling path (the
  `paperfoldmodels` writeup flagged this too).
- **0016 (recut): greedy is correct for v2.** Greedy recut /
  set-cover is the standard practical approach; it matches the plan.
- **The heuristic decision is post-0016, and now well-informed.**
  Do not tune the weight function before recut exists — the metric
  that matters, final piece count, is not measurable until then.
  But when that decision comes, the menu is clear: separated
  convex/concave dihedral, blended weights, Steepest Edge,
  randomized multi-try. A future ADR picks from it with data.
- **v3 has a real menu.** Takahashi's topological surgery (genetic,
  single-patch), tabu search, progressive mesh approximation, and
  Steepest Edge are the "quality output" phase's candidates. A
  deeper read of the Takahashi paper and PolyZamboni's source
  belongs in v3's planning.

## Honest uncertainties

- This is a secondary-source survey. The Takahashi paper, the
  Schlickenrieder thesis, and the PolyZamboni / Export Paper Model
  source were not read directly — descriptions come from abstracts,
  addon docs, and summaries. Treat specifics (e.g. Steepest Edge's
  exact cut rule) as directionally right, not verified.
- "Steepest Edge unfolds arbitrary convex polyhedra ~100%" is an
  empirical claim about *convex* inputs. Our corpus is non-convex
  by design; do not assume the guarantee transfers.
- Whether a *blended* heuristic actually beats pure dihedral *on
  our corpus, measured by post-recut piece count* is untested. The
  survey says it is plausible and is what practical tools do; it
  does not say it is proven for us.

## Sources

- PolyZamboni — https://github.com/AntonFlorey/PolyZamboni
- Export Paper Model (Blender) —
  https://extensions.blender.org/add-ons/export-paper-model/
- rodrigorc/papercraft — https://github.com/rodrigorc/papercraft
- Takahashi et al., "Optimized Topological Surgery for Unfolding 3D
  Meshes" (2011) —
  https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8659.2011.02053.x
- riceroll/unfolding-mesh — https://github.com/riceroll/unfolding-mesh
- "Unfolding polyhedra via tabu search" (The Visual Computer,
  2024) — https://link.springer.com/article/10.1007/s00371-024-03395-2
- "Unfolding via Progressive Mesh Approximation" —
  https://arxiv.org/html/2405.07922v1
- Edge unfolding of polyhedra (open-problem context), "Geometric
  Folding Algorithms," Demaine & O'Rourke —
  https://www.cambridge.org/core/books/abs/geometric-folding-algorithms/edge-unfolding-of-polyhedra/FA24B28D99317A1B81A1B6EB8601A40C
