# DX: fix web lint wrapper + document contributor gate flow

## Team : dev-2 (niwa)
## Branch : dx/web-lint-ox (from main)
## Relay task : 4cead7da-bac4-4364-a88b-dde5d9b66270
## Status : 🔵 SUBMITTED

## 1. Product Brief

### Acceptance Criteria
_(untyped ticket — no acceptance criteria)_

## 2. Root cause & decisions

ROOT_CAUSE: `web/npm run lint` prints garbage for agents not because the package.json wrapper is broken, but because the fleet's global RTK proxy hook (`rtk hook claude`, PreToolUse on Bash) rewrites the exact command `npm run lint` to `rtk lint` — an ESLint-only filter. This repo lints with oxlint and has no ESLint, so `rtk lint` runs an absent eslint binary, emits `ESLint output (JSON parse failed: EOF…)`, and swallows the exit code. RTK discards the package.json script entirely, so editing the `lint` script content cannot fix it. Only a differently-named script (e.g. `lint:ox`) escapes the rewrite (RTK routes it to the `rtk npm run …` passthrough, which prints real oxlint output).
DECISION: Keep `lint` unchanged (works fine in any non-RTK contributor env) and add `"lint:ox": "oxlint src"`, which RTK passes through cleanly — verified: clean tree exits 0 with real warnings, an introduced rules-of-hooks error exits 1. Align CONTRIBUTING.md with the real contributor flow (worktree-local `npm install`, required `.niwa-decision.md` ROOT_CAUSE/DECISION lines, `scripts/gate-check.sh` before submit, `AGENT_NAME=… qa-submit`, never self-merge) and document the RTK lint gotcha so fresh agents use `npm run lint:ox`. No product/UX changes. Amended AC approved by cto (thread 14b79df9).

## 3. Files changed

```
.niwa-decision.md                                  | 35 +---------------
 CONTRIBUTING.md                                    | 43 ++++++++++++++++++--
 features/4cead7da-bac4-4364-a88b-dde5d9b66270.md   | 37 +++++++++++++++++
 ...-lint-wrapper-document-contributor-gate-flow.md | 47 ++++++++++++++++++++++
 web/package.json                                   |  1 +
 5 files changed, 126 insertions(+), 37 deletions(-)
```

## 4. QA Log

### Round 1 — ✅ APPROVED by review-4cead7da-bac4-4364-a88b-dde5d9b66270 @ `6baa3ae9d`
clean — DX-only: lint:ox script + CONTRIBUTING; oxlint src verified exit 0, no product code touched

### Round 2 — ✅ APPROVED by review-4cead7da-bac4-4364-a88b-dde5d9b66270 @ `a04046fa1`
clean — DX-only: lint:ox + CONTRIBUTING; oxlint/build/105 tests verified
- 🟢 AC1: oxlint (npm run lint) prints real warnings, exit 0 on clean tree
- 🟢 AC2: injected redeclare error exits 1; revert exits 0
- 🟢 AC3: CONTRIBUTING.md documents gate-check.sh, .niwa-decision ROOT_CAUSE/DECISION, worktree node_modules note
- 🟢 AC4: build exit 0; vitest 105 pass 0 fail

## 5. Timeline

- round 1 → **approve** (review-4cead7da-bac4-4364-a88b-dde5d9b66270)
- round 2 → **approve** (review-4cead7da-bac4-4364-a88b-dde5d9b66270)

---
_Auto-assembled by the niwa scribe from the Q&A gate. Task `4cead7da-bac4-4364-a88b-dde5d9b66270`._
