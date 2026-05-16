# ADR 0006: PR-based development flow and CI safeguards

## Context

v2 closed and the project went public with CI. But the CI workflow
runs on push to `main` — it fires *after* the merge, so it cannot
gate anything. Numbered sessions merge straight from a worktree into
`main` with no check between the work and the branch everyone builds
on.

Separately, the working method is a large and growing body of
agreements that live in prose — `strategist-protocol.md`,
`CLAUDE.md` — and depend on being remembered. v1 and v2's recurring failures are all the same shape:
discipline that decayed because nothing structural held it. Work
landed on `main` outside a chat. A prompt was edited after handoff.
A branch-naming rule was discussed and never written, so it "didn't
exist." The CLAUDE.md corpus table drifted two whole corpora out of
sync with the inventory it is meant to mirror.

The motivation is to make the discipline load-bearing structure
rather than recalled etiquette: catch problems before `main`, give
the implementing agent a structured reflection channel, and make
doc-coherence and branch cleanup mechanical instead of remembered.

## Decision

v3 adopts a pull-request-based development flow with CI as the
safeguard layer.

- **Numbered sessions and spikes land via pull request.** Worktree →
  PR → CI → review → squash-merge. Maintenance commits may still go
  direct to `main` — they carry no pre-merge amendment risk surface.
- **Branch protection on `main`.** A PR and a passing CI `verify` job
  are required to merge; squash-merge keeps `main` linear and
  one-commit-per-session; the repo admin is the explicit override.
  Branch protection is a GitHub *setting*, applied once by Evan — not
  a repo artifact.
- **Descriptive branch names.** `<type>/<descriptor>`, where type is
  `session`, `maint`, or `spike`; for sessions the descriptor leads
  with the number — `session/0020-dev-flow-setup`. The worktree is
  created with this name, not an auto-generated one.
- **The PR template is the structural home of the handoff block.**
  `.github/pull_request_template.md` carries the verification
  checklist, the spec-adherence and scope section, decisions with
  autonomy-tier tags, the reflection channel (concerns,
  uncertainties, questions), a doc-coherence checkline, queue/roadmap
  deltas, links, and a paste-ready squash-commit message. It mirrors
  the in-repo session log, which stays canonical.
- **CI gains a baseline guard.** `pnpm baseline` runs in CI; the
  baseline document must be byte-identical unless the PR explicitly
  flags an intentional regeneration.
- **A prompt-preflight checklist.** Every session prompt is
  red-teamed against the known v1/v2 failure classes before it
  reaches Evan.

A linter and further CI checks — diff-aware nudges, a size-threshold
warning, a process-lint — are adopted in principle but deliberately
held as a *fast-follow*, not built in the setup session, so the
initial flow is used before it grows.

## Consequences

What becomes easier:

- CI catches regressions before `main`, not after.
- The handoff block becomes a form that is hard to skip, and the
  reflection channel gives the implementing agent a first-class place
  to surface concerns and uncertainties.
- Doc-coherence becomes a checklist line on every PR.
- `main` stays linear; branch and worktree clutter stops
  regenerating, because merged branches are auto-deleted and worktree
  pruning becomes routine.

What becomes harder / the costs:

- Every numbered session gains a PR step. It is mechanical — a
  `gh pr create` in the session prompt — but it is a step.
- The setup session that builds this flow (0020) runs under the
  *old* flow; it cannot run under a flow it is still creating. 0021
  is the first session to run PR-style.

The doc-ownership map — so the same fact stops drifting across docs:

- **ADR 0006** is the decision record — the *why*.
- **`CLAUDE.md`** holds the working agreements and the operative
  subset the implementing agent acts on at session start. One
  canonical home per fact; the rest point to it.

What this does NOT do — parked future work:

- The agent-orchestration rung — autonomous agents picking up work
  from issues — is not built here. It needs this safeguard substrate
  first, and when it lands it gets its own ADR, with a **two-key
  merge** (two independent agent sign-offs plus green CI, or an
  explicit human override) as the safeguard that makes autonomy
  safe.
- A full worktree-cleanup-on-merge mechanism beyond auto-deleting the
  remote branch is left to a fast-follow.

Follow-on ADRs likely:

- The relay-into-repo move — prompt-via-commit, report-via-PR — once
  the PR flow has been used enough to inform it.
- The autonomous-orchestration ADR noted above.
