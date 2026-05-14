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
- YYYY-MM-DD — <one-line decision>. <Why, in a sentence or two.> <Optional: what was rejected, and why.>
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
