---
name: review-web-frontend
description: Domain review checklist for the aitime-calc web lane (Vite + React 19 + TypeScript, web/). Catches the web-specific gotchas a generic review misses — the live/mock dual path, the four-surface URL round-trip, tool-id compatibility with the API dataset, effect races, and the lib/-vs-component split. Run against any diff touching web/.
paths: web/
---

# review-web-frontend — aitime-calc web review gate

Judgment-only checklist. `oxlint`, `tsc -b`, and `vitest` (jsdom) already run in `scripts/gate-check.sh` — skip anything they catch mechanically. Work items in order; ranked by blast radius.

## 1. Every feature must survive the mock path — and label it honestly

The prod web is a static Vercel deploy that outlives API outages and a misconfigured `VITE_API_URL`; `fetchTools`/`fetchCalc` are *designed* to catch everything (including the 2s timeout) and silently serve `FALLBACK_TOOLS` / local `computeCalc`, with the footer `SourceBadge` as the only tell. Any new server-backed feature must either work through this fallback or degrade to an explicit "unavailable" state — never a blank render or a spinner forever — and must set its source badge truthfully, because a silent live/mock swap that changes the numbers without saying so is the one way this product lies to users.

## 2. `web/src/lib/atem.ts` tracks the API engine

The local calc is a second implementation of ATEM, not a cache — a user sees its numbers whenever the API path fails. Any change to formulas, defaults (72 / 4.5), or accelerating anchors must be mirrored against `api/src/atem.ts` in the same change, or the two engines answer the same share URL differently. Two divergences are already documented in METHODOLOGY.md (integration method; the API ignoring `d_ai_months` in accelerating mode where the web uses it) — don't widen them, and don't "fix" one side alone without updating the doc.

## 3. New user-visible state must round-trip all four surfaces

The share URL is the product's distribution mechanism. Any new piece of state that changes the displayed result must be wired through all four surfaces, or explicitly reviewed as excluded: (1) `parseInitialState` — parse with bounds validation via the `parseBoundedNumber` pattern, invalid → `null` → default, never `NaN` into React state; (2) `shareUrl` — serialize **only when non-default** (that keeps old links stable if the default ever moves, and keeps URLs short); (3) the `/api/calc` request params; (4) the `/api/og` params behind the share card. A state that changes the hero but is missing from any surface makes a shared link show the recipient a different number than the sharer saw — the worst failure this app has.

## 4. Tool ids are URL inputs — resolve defensively, converge on API ids

`?tool=` arrives from arbitrary shared links, so id resolution must never crash on an unknown id: keep the existing guards (syntax-only `isPlausibleToolId` before the dataset loads, then the reset-to-`DEFAULT_TOOL_ID` re-validation once `fetchTools` resolves — the dataset grows over time, so membership is the live dataset's call, not a hardcoded list's). `FALLBACK_TOOLS` ids already diverge from `api/src/dataset.ts` ids (`cursor-yolo` vs `cursor-yolo-mode`), which means a link minted offline can silently reset to the default tool when opened live — new fallback entries must reuse the API's id verbatim so the split stops growing.

## 5. Async effects: cancellation flag + timeout, every time

Calc params change rapidly (advanced-param inputs), and two in-flight `/api/calc` responses can resolve out of order — a stale response rendering for the wrong params shows a number that doesn't match the controls on screen. Every effect that sets state from an async result must use the existing `cancelled`-flag cleanup pattern, and every fetch must carry the `AbortSignal.timeout` / 2s budget, because a hung request without a timeout also blocks the fallback path (item 1) from ever engaging.

## 6. Bounds and defaults have one home: `urlParams.ts`

`DEFAULT_D_AI_MONTHS`, `D_AI_MONTHS_MIN/MAX`, and friends live in `web/src/lib/urlParams.ts` and must be imported everywhere a bound or default appears (`AdvancedParams` input attributes, App state init, URL validation). A duplicated literal drifts, and then the URL accepts a value the UI forbids (or vice versa) — the user can't tell why a shared link's params got silently discarded.

## 7. Logic lives in `lib/`, pure and tested; components stay thin

Every behavior worth reviewing (URL parsing, tool filtering, clipboard, the local calc) sits in `web/src/lib` as pure functions with vitest coverage, and components stay presentational — because jsdom tests can't meaningfully exercise fetch races or rendering, but they exercise pure logic perfectly. New decision-carrying logic embedded in a component body is a red flag: extract it to `lib/` with a test, or state why not.

## 8. Copy must present the number as a heuristic, not a measurement

The output is a narrative device built on assumptions (METHODOLOGY.md's own words) — that framing is load-bearing for the product's credibility. New hero/share/tagline copy must not upgrade "human-equivalent time" into a measured fact or invent precision the model doesn't have; the `MethodologyExplainer` and source badges exist precisely to keep the claim honest, so don't ship a surface that outruns them.
