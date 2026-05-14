# Session 0014 — Dihedral-weighted spanning tree

## What was attempted

Replace v1's plain DFS spanning tree with a dihedral-weighted
minimum spanning tree, per ADR 0004 — the first v2 algorithm
session. Weight every shared edge by the angle between its two
faces' normals (flat edges cheap, sharp creases expensive), build
an MST over those weights, and re-run the corpus baseline to
measure what changes versus plain DFS.

## What shipped

- `docs/decisions/0004-dihedral-weighting.md` — ADR 0004, committing
  the dihedral-weighted MST and the weighting heuristic.
- `src/core/dihedral.ts` — `computeDihedralWeights(mesh, dual)`, a
  pure stage producing one fold-weight per adjacency: the angle
  between adjacent faces' outward unit normals.
- `src/core/spanning-tree.ts` — `buildSpanningTree` is now a
  minimum spanning tree over the dihedral weights, replacing the
  plain DFS. The `SpanningTree` output contract is unchanged; the
  input signature gains a `weights` parameter.
- Updated callers (`src/app/main.ts`, `scripts/baseline-pipeline.ts`,
  the affected tests) for the new signature.
- `test/unit/dihedral.test.ts` and updated
  `test/unit/spanning-tree.test.ts`, including a behavioral test
  that the MST selects the minimum-weight fold set.
- `docs/baseline-pipeline.md` — the baseline doc, renamed from
  `baseline-v1-pipeline.md` and regenerated with the
  dihedral-weighted MST in place.

## Baseline change

Plain DFS (0013) → dihedral-weighted MST (0014), overlapping face
pairs per model:

- croissant 259 → 388 (regression)
- deer 795 → 841 (regression)
- meat-sausage 166 → 172 (regression)
- ginger-bread 60 → 45 (improvement)
- egg 2 → 0 (improvement)
- cylinder 1 → 0 (improvement)
- cube.obj / cube.stl / octahedron / tetrahedron / uv-sphere — all
  stayed at 0.

Net: 5 → 7 overlap-free models. The improvements cluster on shapes
whose natural panels are relatively clear (the procedural egg and
cylinder, the gently-faceted ginger-bread); the regressions cluster
on highly concave organic shapes where sharp creases concentrate
folds in a way that produces more swing-overlap. The code-review
subagent verified the algorithm is correct — this is heuristic
mediocrity on those shapes, not a bug, and is consistent with ADR
0004's stated expectation of "reduce, not eliminate" overlaps.
0015 (overlap detection) and 0016 (recut) are what drive overlaps
to zero.

## What's next

Session 0015 — Overlap detection. A proper `polygon-clipping`-based
overlap-detection stage in `src/core/`, replacing the baseline
harness's naive measurement check. The remaining overlaps this
session's baseline records are what 0015 detects and 0016 recuts.

## Decisions made or deferred

- **Dihedral weighting, not edge-length weighting** — ADR 0004. The
  reference (`paperfoldmodels`) weights by edge length; v2
  deliberately weights by dihedral fold angle.
- **MST algorithm: Kruskal with union-find** (path compression +
  union by rank). Simpler than Prim for this shape — sort edges
  once, no priority queue — and corpus size makes complexity
  irrelevant.
- **Unsigned dihedral** — the weight does not distinguish
  mountain from valley creases. Signed weighting is a deferred
  refinement (ADR 0004).
- **`computeDihedralWeights` assumes consistent winding** —
  corpus-guaranteed; a winding-robust formula is the refinement
  path. Recorded in ADR 0004.

## Handoff

- **Branch / worktree:** `claude/nifty-goldwasser-8cb336` at
  `.claude/worktrees/nifty-goldwasser-8cb336/`.
- **Commits:** `<short-sha>` `feat: dihedral-weighted MST spanning tree (ADR 0004)`
  — SHA filled in by `/wrap-session`.
- **Verification:** `pnpm type-check` clean; `pnpm test:run` 48
  passing + 1 todo (49 total); `pnpm build` clean; `pnpm baseline`
  regenerated `docs/baseline-pipeline.md`.
- **Decisions made or deferred:** dihedral (not edge-length)
  weighting — ADR 0004; MST algorithm choice (Kruskal) — this
  session log; unsigned dihedral and the consistent-winding
  assumption — both deferred refinements noted in ADR 0004.
- **Queue / roadmap deltas:** Roadmap — 0014 → ✅, 0015 → ⏭, "Where
  we are now" advanced. `project-state.md` — 0014 added to Sessions
  completed; Sessions planned advanced (0014 entry replaced with
  0015); ADR list updated to include 0004. `docs/queue.md` —
  unchanged.
- **Open questions for the strategist:** The baseline regressions
  on highly concave organic shapes (croissant 259→388, deer
  795→841, meat-sausage 166→172) are worth a deliberate
  conversation. The algorithm is verified correct (code-review
  subagent verdict: "code looks correct"), so this is heuristic
  mediocrity on shapes where the dihedral signal genuinely
  misleads. Question: is signed mountain/valley dihedral
  weighting worth promoting from "deferred refinement" (ADR 0004)
  to a near-term ADR, or do we expect 0015/0016 (overlap detection
  + recut) to subsume the issue? Honest expectation is recut
  handles it — but worth deciding before 0016 commits.
