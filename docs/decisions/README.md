# Architecture Decision Records

This directory holds Architecture Decision Records (ADRs) — short documents that capture significant decisions made during the project.

## Naming

Files are named `NNNN-short-title.md` (zero-padded number, kebab-case title). Example: `0001-use-half-edge-mesh.md`.

## Format

Each ADR has three sections:

- **Context** — what situation or problem prompted the decision
- **Decision** — what we decided to do
- **Consequences** — what becomes easier or harder as a result

Keep them short. A few paragraphs each is enough.

## Immutability

ADRs are immutable once merged to `main`. Pre-merge drafts — for example,
commits sitting in a worktree branch that hasn't been fast-forwarded into
`main` yet — can be amended freely. The strict rule applies only after the
ADR has landed on `main`. If a decision is superseded after that point,
write a new ADR that references the old one; don't edit the original.

The one permitted exception is a **status banner** — a single Markdown
blockquote placed directly under a superseded ADR's title, pointing
forward to the ADR that replaced it (e.g. `> **Status:** Superseded by
ADR 0004`). This is a navigational annotation, not a content edit: the
Context, Decision, and Consequences sections stay frozen. It exists so a
reader who lands on the old ADR is not silently misled into thinking the
decision still stands.
