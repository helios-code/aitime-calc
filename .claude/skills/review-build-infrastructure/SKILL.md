---
name: review-build-infrastructure
description: Domain review checklist for aitime-calc's build/gate scripts (Bash + npm, scripts/). Currently one load-bearing script — gate-check.sh, the local mirror of the niwa QA gate's fresh-checkout build. Catches gate-parity drift, silent package skips, brittle npm-output greps, exit-code leaks, and unanchored destructive paths. Run against any diff touching scripts/.
paths: scripts/
---

# review-build-infrastructure — aitime-calc scripts review gate

Small domain, high leverage: `scripts/gate-check.sh` is what stands between a dev's warm worktree and the QA gate's clean checkout. shellcheck-class issues (quoting, `set -euo pipefail` basics) are assumed; the items below are where judgment is required. Ranked by blast radius.

## 1. Gate parity is the script's entire reason to exist

`gate-check.sh` must run exactly what the QA gate's fresh checkout runs — clean `npm ci` (after `rm -rf node_modules`), typecheck, test, build, per package — because its one job is surfacing native-dep and missing-asset failures (committed fonts, wasm) locally instead of at review. Any step added to or removed from the real gate must be mirrored here in the same change, and vice versa; a parity gap silently re-creates the exact failure class the script was written to kill. Never let a "speed up the loop" change (skipping the clean install, caching node_modules) survive review — that converts the script into the warm-local run it exists to distrust.

## 2. A new package must be enrolled explicitly, in two places

Packages are gated only if listed in `packages=(api web)`, and the summary uses hardcoded `results_api` / `results_web` variables. A new workspace (e.g. a shared lib) is silently un-gated until added to **both** the array and the summary block — and because a missing directory hits the "(no ${pkg}/ dir, skipping)" branch without failing, a typo'd package name also passes green. Review any repo-layout change for enrollment here, and treat "skipping" output on a package that should exist as a failure of the diff, not an environment quirk.

## 3. The detection greps are contracts on npm/tsconfig formatting

Step selection is inferred, not declared: `grep -q '"references"' tsconfig.json` picks `tsc -b`, and `npm run | grep -qE '^  test($|:)'` (two-space indent, exact script name) decides whether tests/build run at all. This means: renaming the `test` or `build` script in `api/` or `web/` package.json, restructuring tsconfig project references, or an npm major changing `npm run` output all silently change *what the gate executes* without any error. Any diff touching those files must be checked against these greps, and any grep change must be verified against both packages' actual `npm run` output — a detection miss doesn't fail loudly, it skips-and-passes.

## 4. Every failure path must reach the exit code

The niwa daemon and devs trust the script's exit status, nothing else. The failure-capture pattern is: steps run inside the per-package subshell through `run_step`, the subshell's status folds into `pkg_status` via `( ... ) || pkg_status="FAIL"`, and `pkg_status` folds into `overall_status`. A new step added outside this chain — after the subshell, or in a pipeline where only the left side can fail under `pipefail` exemptions like `if`/`||` guards — can fail without flipping the exit code, which turns the gate green on broken code: the worst possible outcome for a gate. Keep `set -euo pipefail`; route every new step through `run_step` inside the subshell.

## 5. Destructive paths stay root-anchored and quoted

The script `rm -rf`s `node_modules` and is invoked from arbitrary `.worktrees/*` checkouts, so every path must derive from the `root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"` anchor and stay double-quoted — a cwd-relative or unquoted path in a delete turns "run the gate from the wrong directory" into data loss. Any new destructive operation gets the same scrutiny: anchored to `root_dir`, scoped to a named package dir, never a bare variable that can expand empty.

## 6. No hidden dependencies beyond the npm registry

The script must succeed in a clean checkout with only npm-registry access — no required env vars, no local services, no network fetches of assets — because the QA gate's environment is exactly that, and anything committed to `api/assets` (fonts, wasm) exists precisely so the build needs no fetch step. A new step that needs a running API, a `VITE_API_URL`, or a downloaded artifact either belongs behind an explicit opt-in flag or the asset belongs in the repo; otherwise the script passes on the author's machine and fails for every other agent in the fleet.
