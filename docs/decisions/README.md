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

ADRs are immutable once merged. If a decision is superseded, write a new ADR that references the old one — don't edit the original.
