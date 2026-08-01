#!/usr/bin/env bash
# Mirrors the QA gate's fresh-checkout build: clean install + typecheck + test + build,
# for each of api/ and web/. Run this before qa-submit to catch native-dep / missing-asset
# failures that only show up in a clean checkout, not in a warm local node_modules.
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
packages=(api web)
overall_status=0
results_api="SKIP"
results_web="SKIP"

run_step() {
  local label="$1"
  shift
  echo "  -> ${label}..."
  if "$@"; then
    echo "  -> ${label}: PASS"
  else
    echo "  -> ${label}: FAIL"
    return 1
  fi
}

for pkg in "${packages[@]}"; do
  pkg_dir="${root_dir}/${pkg}"
  echo "=== ${pkg} ==="

  if [[ ! -d "${pkg_dir}" ]]; then
    echo "  (no ${pkg}/ dir, skipping)"
    continue
  fi

  pkg_status="PASS"
  (
    cd "${pkg_dir}"

    echo "  -> clean install..."
    rm -rf node_modules
    npm ci

    if [[ -f tsconfig.json ]] && grep -q '"references"' tsconfig.json; then
      run_step "typecheck (tsc -b --noEmit)" npx tsc -b --noEmit
    elif [[ -f tsconfig.json ]]; then
      run_step "typecheck (tsc --noEmit)" npx tsc --noEmit
    else
      echo "  -> typecheck: SKIP (no tsconfig.json)"
    fi

    if npm run | grep -qE '^  test($|:)'; then
      run_step "test (npm test)" npm test
    else
      echo "  -> test: SKIP (no test script)"
    fi

    if npm run | grep -qE '^  build($|:)'; then
      run_step "build (npm run build)" npm run build
    else
      echo "  -> build: SKIP (no build script)"
    fi
  ) || pkg_status="FAIL"

  if [[ "${pkg}" == "api" ]]; then
    results_api="${pkg_status}"
  else
    results_web="${pkg_status}"
  fi
  if [[ "${pkg_status}" == "FAIL" ]]; then
    overall_status=1
  fi
done

echo
echo "=== gate-check summary ==="
echo "  api: ${results_api}"
echo "  web: ${results_web}"

exit "${overall_status}"
