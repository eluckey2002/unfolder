# Go public — GitHub remote, CI workflow, MIT license, doc reconciliation

## Goal

A single maintenance commit plus a push that takes `unfolder` public:
add the MIT `LICENSE`, add a minimal CI workflow, reconcile the
handoff docs that still say "no remote yet," wire the
`github.com/eluckey2002/unfolder` remote, and push `main`.

This is a **maintenance commit, not a numbered session.** No session
log — the commit message carries the handoff. No ADR — this is infra;
the rationale lives in `project-rationale.md` (Appendix C).
**Direct-`main`** is the right path: there is no pre-merge amendment
risk surface here, and the remote-wiring is cleaner on `main` than
through a worktree.

## Context

The repo `github.com/eluckey2002/unfolder` was created public per the
v2-retrospective's going-public decision (already recorded in
`docs/decisions-log.md`). This commit does the wiring and the
consequent doc updates.

It also folds in four cross-reference fixes the v2-retrospective
commit (`f3f0456`) left behind, flagged in that session's report.
They are tiny, all live in `project-state.md`, and bundling them here
— one trip into the file rather than a separate commit for three
sentence-edits — is the compression the retrospective's Decision 3
asks for. They are Appendix B edits B.3–B.6.

## Tasks

1. **Verify starting state.** From the main checkout at
   `/Users/eluckey/Developer/origami`, confirm `main` is at `f3f0456`
   (the v2-retrospective commit). If it has advanced, surface it and
   proceed.

2. **Create `LICENSE`** at the repo root with the content in
   **Appendix A**, copied verbatim. Note: the copyright holder line
   reads `Evan Luckey`, inferred from the GitHub handle `eluckey2002`.
   If that is not the name Evan wants on the license, it should be
   corrected before this commits — flag it in the report if unsure;
   do not guess further.

3. **Create `.github/workflows/ci.yml`.** A minimal CI workflow,
   specified here as behavior — **write the YAML using current
   GitHub Actions versions, verified, not pinned from memory.** The
   project's tooling is ahead of the strategist's knowledge cutoff
   (Vite 8, Vitest 4, TypeScript 6, `@types/node` 25), so the
   workflow's action versions and Node version should be current,
   confirmed by you. The workflow:
   - is named `CI`;
   - triggers on `push` to `main` and on `pull_request` targeting
     `main`;
   - has one job, `verify`, on `ubuntu-latest`;
   - steps: check out the repo; set up pnpm; set up Node on a current
     LTS with pnpm caching; install with the lockfile frozen
     (`pnpm install --frozen-lockfile`); then run `pnpm type-check`,
     `pnpm test:run`, and `pnpm build`, in that order.
   - `pnpm audit` is deliberately **not** included — naive-first; it
     can be added later.

4. **Edit `docs/project-state.md`** — six targeted edits, all
   specified verbatim in **Appendix B** (B.1–B.6). B.1–B.2 reflect
   the remote and the committed license; B.3 resolves the
   open-questions remote bullet; B.4–B.6 are the v2-retrospective
   cross-reference fixes.

5. **Edit `docs/project-rationale.md`** — replace the
   `## Local git only, no GitHub remote` section in full with the
   revised section in **Appendix C**, copied verbatim.

6. **Stage and commit.** Files to stage:
   - `LICENSE` (new)
   - `.github/workflows/ci.yml` (new)
   - `docs/project-state.md` (modified)
   - `docs/project-rationale.md` (modified)
   - `docs/sessions/prompts/go-public.md` (new — this prompt file)

   Commit message:

   ```
   chore: go public — GitHub remote, CI workflow, MIT license

   Wires the public remote at github.com/eluckey2002/unfolder, adds a
   minimal CI workflow (install, type-check, test, build on push and
   PR), and commits the MIT license. Reconciles the handoff docs that
   still described local-git-only, and folds in four doc
   cross-reference fixes the v2-retrospective commit left behind.
   No ADR — infra; rationale is in project-rationale.md.
   ```

7. **Wire the remote, with a precondition gate.**
   - `git remote add origin https://github.com/eluckey2002/unfolder.git`
   - Run `git ls-remote origin`. **If it returns any refs**, the
     remote is not empty — Evan may have initialized it with a
     README, license, or `.gitignore`. **Stop. Do not force-push, do
     not auto-rebase.** Report what's on the remote and let Evan
     decide (re-create the repo empty, or explicitly authorize a
     different resolution).
   - If `git ls-remote origin` returns nothing, the remote is empty —
     proceed.

8. **Push.** `git push -u origin main`. **If the push fails for
   authentication reasons** (no cached credentials, token prompt),
   do not retry or hang — stop and report that Evan should run
   `git push -u origin main` himself. If it succeeds, note that the
   CI workflow will run on this push; Evan can check the Actions tab.

9. **Report back:** final `main` HEAD hash; confirmation all five
   files staged; whether the remote was empty and the push
   succeeded (or why it didn't); and — flag only, do not
   self-correct — any factual problem spotted in the verbatim
   appendix content while filing.

## Notes

- No source code changes — do not run `pnpm` verification commands;
  they would be no-ops. (CI will run the real verification on the
  push.)
- The CI workflow's YAML is specified as behavior, not given
  verbatim, on purpose — action-version pins are exactly the kind of
  stale-knowledge trap v1's lessons warn about. Verify current
  versions.
- All appendix content is verbatim. If a factual error is spotted
  while filing, flag it in the report; the strategist decides
  whether to amend.

---

## Appendix A — `LICENSE` (verbatim)

```
MIT License

Copyright (c) 2026 Evan Luckey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Appendix B — `docs/project-state.md` edits

Six targeted edits. Each gives the exact existing text and its
replacement.

### B.1 — "Key decisions made so far": the remote bullet

Replace:

```
- **Local git only** for now; no GitHub remote yet
```

with:

```
- **Public GitHub remote** at `github.com/eluckey2002/unfolder` — wired at the v2→v3 boundary; the project builds in the open from v3 onward
```

### B.2 — "Key decisions made so far": the license bullet

Replace:

```
- **MIT license** (planned, not yet committed to the repo)
```

with:

```
- **MIT license** — committed to the repo as `LICENSE`
```

### B.3 — "Open questions / things in flight": remove the resolved remote bullet

Delete this bullet in full (it is resolved by this commit):

```
- No GitHub remote yet. This is now a live decision at the v2→v3 boundary: CI has nowhere to run without a remote, and v3's PDF-export work, growing test surface, and the new end-to-end integration test all make CI more valuable. Settle it at the boundary or early in v3.
```

Leave the project-name bullet above it unchanged.

### B.4 — "Where to look": the retrospectives entry

Replace:

```
- `docs/retrospectives/` — phase-boundary retrospectives (`v1-complete.md`, `v2-complete.md`)
```

with:

```
- `docs/retrospectives/` — per-phase retrospectives: a `-complete.md` (what shipped) and a `-retrospective.md` (how we worked). v1: `v1-complete.md`. v2: `v2-complete.md`, `v2-retrospective.md`.
```

### B.5 — "Repo and orientation": the re-orientation message

Inside the re-orientation blockquote, replace this fragment:

```
  > `docs/project-history.md`, the latest retrospective in
  > `docs/retrospectives/`, `docs/queue.md`, `docs/roadmap.md`,
```

with:

```
  > `docs/project-history.md`, the latest phase's retrospectives in
  > `docs/retrospectives/` (both the `-complete.md` and the
  > `-retrospective.md`), `docs/queue.md`, `docs/roadmap.md`,
```

### B.6 — "Session and commit mechanics": the numbered-vs-maintenance bullet

Replace this bullet in full:

```
- **Numbered session vs. maintenance commit.** Work gets a
  numbered session if it matches an entry in a phase's session
  plan, or produces new functionality, code, or substantive
  structural changes. Otherwise it lands as a plain maintenance
  commit — no session log, no number, descriptive prompt filename
  without a numeric prefix.
```

with:

```
- **Three kinds of work: numbered session, maintenance commit,
  spike.** Work gets a numbered session if it matches an entry in a
  phase's session plan, or produces new functionality, code, or
  substantive structural changes. Exploratory work where the
  approach itself is in question runs as a spike session (see
  "Spike sessions for genuinely uncertain work" below). Everything
  else lands as a plain maintenance commit — no session log, no
  number, descriptive prompt filename without a numeric prefix.
```

---

## Appendix C — `docs/project-rationale.md`: revised "Local git only" section (verbatim replacement)

Replace the entire `## Local git only, no GitHub remote` section
(from its `##` header through the line ending "...eventual community
use (v6).") with:

```markdown
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
```
