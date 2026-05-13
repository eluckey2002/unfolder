# Session 0001: Project skeleton

## What was attempted

Initial scaffolding for the unfolder project. Created the directory
structure (docs/decisions, docs/references, docs/sessions, src/core,
src/app, test/corpus, test/unit), README files for the three docs
subdirectories, a .gitignore, and initialized git with the first commit.

## What shipped

Two commits on main:
- `c90e770` — initial skeleton (directories, README files, .gitignore,
  all files except docs/references/)
- `a3b371f` — fixed a .gitignore anchor bug and added docs/references/

The bug: the `.gitignore` pattern `references/` matched any directory
named `references` anywhere in the tree, including the
intended-to-be-tracked `docs/references/`. Changed to `/references/`
(leading slash to anchor to project root). Caught and fixed by Claude
Code mid-session.

## Decisions / observations

- The session prompt referenced a README.md that didn't yet exist in
  the project root. Resolved by user manually placing the file before
  Claude Code continued. Future session prompts will explicitly list
  preconditions.
- Prompts that specify gitignore/glob/regex patterns need to use exact
  syntax, not paraphrased intent. The unanchored pattern in the prompt
  was the source of the bug Claude Code caught.

## What's next

Session 2: Read `paperfoldmodels` end-to-end and produce a writeup in
`docs/references/paperfoldmodels.md`.
