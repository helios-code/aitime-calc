# Branch & Worktree Audit — aitime-calc

**Date:** 2026-08-07
**Author:** dev (niwa fleet)
**Scope:** read-only git archaeology. **ZERO deletions performed** — recommendations only.
**Base:** `origin/main` @ `999d569` (42 commits).

## Method

This repo merges through **two** independent paths, so GitHub PR state alone is not
authoritative:

1. **GitHub PRs** — squash-merged, commit tagged `... (#NN)`.
2. **niwa daemon gate** — merged server-side, commit tagged
   `qa: merge <uuid> (<branch> round N, approved by review-...)`.

Several branches were merged via the daemon while their GitHub PR was left **OPEN** —
those PRs are stale, not unmerged. Verdicts below combine: GitHub PR merge state
(`gh pr list`), daemon `qa: merge` commits in `origin/main`, and `git cherry`
patch-equivalence. `git cherry` alone is unreliable here because both merge paths
squash, which rewrites patch-ids.

**Legend:** MERGED = content is in `origin/main` (evidence commit given).
UNMERGED = unique content not in main. DEAD = throwaway/closed, never intended to land.

---

## Remote-only branches (26)

| # | Branch | Verdict | Evidence (merge commit) | Notes |
|---|--------|---------|-------------------------|-------|
| 1 | docs/api-reference | **MERGED** | `1a01f2c` PR#13 | |
| 2 | feat/api-health-shape | **MERGED** | `dcdd9bf` PR#28 | |
| 3 | feat/crawler-meta-middleware | **MERGED** | `33cf47c` daemon r1 | **GitHub PR#12 still OPEN — stale, close it** |
| 4 | feat/dataset-expansion | **MERGED** | `ebf03df` daemon r2 | No GitHub PR; merged via gate only |
| 5 | feat/dataset-refresh-2026 | **MERGED** | `7d02e35` PR#17 | |
| 6 | feat/leaderboard-export | **MERGED** | `33ec261` PR#16 | |
| 7 | feat/methodology-page | **MERGED** | `3d76800` PR#1 | |
| 8 | feat/og-crawler-unfurl | **UNMERGED (superseded)** | — | 2 unique commits; client-side `headMeta.ts` approach NOT adopted — main took the `web/middleware.ts` crawler approach via #3. No PR opened. |
| 9 | feat/og-date-mode-image | **MERGED** | `03bdc87` daemon r1 | **GitHub PR#2 still OPEN — stale, close it** |
| 10 | feat/og-meta-tags | **UNMERGED (superseded)** | — | Shares the unadopted `headMeta.ts` commit with #8. GitHub PR#11 OPEN. |
| 11 | feat/og-share-image | **MERGED** | `20d9b3a` daemon r3 | No GitHub PR; `api/src/og` identical in main |
| 12 | feat/qa-visual-harness | **MERGED** | `489d996` PR#26 | |
| 13 | feat/timeline-viz | **MERGED** | `a6d7d76` PR#5 | |
| 14 | feat/web-footer-version | **MERGED** | `999d569` PR#29 | current main tip |
| 15 | feat/web-leaderboard-page | **MERGED** | `f0cc24c` daemon r2 | **GitHub PR#4 still OPEN — stale, close it** |
| 16 | feat/web-uiux-2026-tokens | **MERGED** | `63c766b` PR#15 | |
| 17 | feat/web-uiux-pass-2 | **MERGED** | `c8f3c66` PR#25 | |
| 18 | fix/accelerating-dai-months | **MERGED** | `67f846f` daemon r3 | **GitHub PR#10 still OPEN — stale, close it** |
| 19 | fix/api-calc-reject-unreleased | **MERGED** | `51be1bd` PR#24 | |
| 20 | fix/dataset-id-reconcile | **MERGED** | `5492510` PR#9 | |
| 21 | fix/og-wasm-memory-leak | **MERGED** | `c9e1b0c` PR#14 | |
| 22 | fix/recovery-orphan-fixes | **MERGED** | `735414d` PR#23 | |
| 23 | test/pr-gate-demo | **MERGED** | `0b66c0d` PR#21 | gate-test artifact |
| 24 | test/pr-gate-honest | **DEAD** | — | GitHub PR#20 CLOSED unmerged; throwaway gate test |
| 25 | test/pr-gate-smoke | **MERGED** | `70f01c7` daemon r1 | GitHub PR#19 CLOSED but daemon-merged the content |
| 26 | test/scribe-smoke | **DEAD** | — | GitHub PR#27 CLOSED unmerged; throwaway smoke test |

**Tally:** 22 MERGED · 2 UNMERGED (superseded) · 2 DEAD.

---

## Orphaned worktrees (3)

All under `.worktrees/`. All **clean** (no uncommitted changes). Owners `dev-57` / `dev-61`
are dead agents.

| Worktree | Branch | Tip | State | Branch verdict | Safe to remove? |
|----------|--------|-----|-------|----------------|-----------------|
| `.worktrees/dev-57-web-ui-polish` | feat/web-ui-polish | `b8806a7` | clean | **MERGED** (daemon `8e8bd91` r5) | **YES** |
| `.worktrees/dev-61-uiux` | feat/web-uiux-pass-2 | `ff066b2` | clean | **MERGED** (PR#25 `c8f3c66`) | **YES** |
| `.worktrees/og-meta-tags` | feat/og-meta-tags | `f194e3c` | clean | **UNMERGED** (superseded, see #10) | Hold until the OG decision below |

Plus the **audit worktree** `.worktrees/dev-branch-audit` (this task, branch
`chore/branch-audit`) — remove after this report merges.

`.claude/worktrees/` — empty, nothing to inventory.

### Stray non-git files in `.worktrees/`
Not git-tracked; resume artifacts left by dead agents:
- `.worktrees/dev-checkpoint.md`
- `.worktrees/dev-2-checkpoint.md`

Recommend deleting both (housekeeping, no history impact).

---

## Local branches (3)

| Branch | Tip | Upstream | Verdict |
|--------|-----|----------|---------|
| feat/web-ui-polish | `b8806a7` | none (local-only) | **MERGED** via daemon `8e8bd91` — safe to delete |
| feat/web-uiux-pass-2 | `ff066b2` | origin/main | **MERGED** PR#25 — safe to delete |
| feat/og-meta-tags | `f194e3c` | origin/feat/og-meta-tags | **UNMERGED** (local tip diverges from remote `f300a9f`) |

---

## Recommendations for cto (execute-list — NOT run by this task)

**A. Delete now — content confirmed in main (22 remote + 2 dead + 3 local + 2 worktrees):**

- Remote merged (22): docs/api-reference, feat/api-health-shape, feat/crawler-meta-middleware,
  feat/dataset-expansion, feat/dataset-refresh-2026, feat/leaderboard-export,
  feat/methodology-page, feat/og-date-mode-image, feat/og-share-image, feat/qa-visual-harness,
  feat/timeline-viz, feat/web-footer-version, feat/web-leaderboard-page, feat/web-uiux-2026-tokens,
  feat/web-uiux-pass-2, fix/accelerating-dai-months, fix/api-calc-reject-unreleased,
  fix/dataset-id-reconcile, fix/og-wasm-memory-leak, fix/recovery-orphan-fixes,
  test/pr-gate-demo, test/pr-gate-smoke.
- Remote dead (2): test/pr-gate-honest, test/scribe-smoke.
- Local branches (2 merged): feat/web-ui-polish, feat/web-uiux-pass-2.
- Worktrees (2, clean + merged): `.worktrees/dev-57-web-ui-polish`, `.worktrees/dev-61-uiux`.
- Stray files (2): `.worktrees/dev-checkpoint.md`, `.worktrees/dev-2-checkpoint.md`.

**B. Decide before deleting — genuinely unmerged (2 branches + 1 worktree + 1 local branch):**

- feat/og-crawler-unfurl & feat/og-meta-tags carry a **client-side `headMeta.ts`** OG approach
  that was **never adopted** — main shipped the middleware approach instead. Confirm nothing in
  `headMeta.ts` / `crawlerCard.ts` is still wanted, then delete both; else cherry-pick.
- `.worktrees/og-meta-tags` worktree + local `feat/og-meta-tags` branch hang off that unmerged
  work — remove together with the decision above.

**C. Close stale GitHub PRs left OPEN after daemon-merge:** #12, #2, #4, #10.
(#19 is already CLOSED and its content merged — no action.)

**Deletion commands are intentionally omitted — this task is report-only.**
