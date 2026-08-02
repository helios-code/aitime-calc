---
name: review-api-backend
description: Domain review checklist for the aitime-calc API lane (Fastify 5 + TypeScript + resvg-wasm OG cards, api/). Catches the api-specific gotchas a generic review misses — the dual ATEM implementation, the {status,error} throw contract, dataset-id URL stability, OG font-subset blanks, fail-closed CORS. Run against any diff touching api/.
paths: api/
---

# review-api-backend — aitime-calc API review gate

Judgment-only checklist. `bash scripts/gate-check.sh` already covers typecheck (`tsc`), tests (`vitest`), and a fresh-checkout build — do not re-litigate what it catches mechanically. Work the items in order; they are ranked by blast radius.

## 1. Calc-model parity (the invariant that defines this product)

`api/src/atem.ts` is one of **two** ATEM implementations — `web/src/lib/atem.ts` is the offline fallback the web app silently swaps to when the API is unreachable. Any change to `computeAtem` semantics (formula, `DEFAULT_PARAMS`, accelerating anchors `7→4 @ 2019-01-01`, `AVG_DAYS_PER_MONTH`, rounding) must land in both files in the same change, because the only tell that a user got the other engine is a footer badge — same share URL, different number, no error.

Two divergences are **known and documented** (METHODOLOGY.md "Assumptions and limitations"): the integration method differs (API: 400-step trapezoid; web: per-day sum), and the API's accelerating model ignores `d_ai_months` entirely while the web's uses it as the "now" anchor. Do not silently "fix" either side alone — a diff touching one must either align both or update METHODOLOGY.md's stated inconsistency in the same PR.

## 2. METHODOLOGY.md moves with the math

METHODOLOGY.md restates the constants (72 / 4.5 / 7→4 / 30.4368), the formulas, and a worked GPT-4 numeric example, and declares "the code wins" on drift. Any change to parameters, formulas, or model behavior must update that doc in the same diff, because the product's entire credibility claim is "named, inspectable assumptions" — a stale methodology page converts the calculator from a transparent heuristic into misinformation.

## 3. Response-shape changes must be additive

`web/src/lib/api.ts` validates the calc payload with a single guard (`typeof data?.human_equiv_years !== 'number'`) and its catch-all falls back to mock — so renaming or removing any snake_case response field doesn't error anywhere, it silently locks the deployed web into permanent mock mode. Response changes must be additive; a breaking rename requires updating `web/src/types.ts` + `fetchCalc` in the same change. Also: GET and POST `/api/calc` share `buildCalcResponse` — new validation or fields belong there, never in one route handler, or the two verbs drift.

## 4. Error contract: throw `{status, error}`, return 400 JSON

Expected failures throw plain `{ status, error }` objects that each route catches and returns as a JSON body with that status; anything else escapes as a 500. New endpoints and new validations must use this exact shape, because the web client keys off `res.ok` to trigger fallback and the existing tests assert 400 + `{error}` bodies — a validation that throws an `Error` instead turns a bad query-string into a 500 and pages whoever runs the deploy.

## 5. Input validation: every query/body field is hostile

All inputs arrive as attacker-controlled strings (query or POST body — note `d_classic_months?: string | number`). Dates must go through the `` `${s}T00:00:00Z` `` + `isValidDate` pattern — everything in this codebase is UTC midnight, and a local-time `new Date(s)` shifts results by a day depending on server timezone. Numeric params must pass `Number.isFinite` + `> 0` (the existing guard exists because `d_ai_months=0` divides into `Infinity` human-equivalent years, a nonsense share card). Keep the future-date / as_of-before-release rejections on any new date-consuming path.

## 6. OG cards: escape everything, stay inside the font subset, assert pixels

Every string interpolated into the SVG must pass `escapeXml` — tool names and vendors contain `&` and `/` today, and one raw `&` makes resvg throw while unescaped markup is injection into an image served to third-party unfurlers. New drawn text must stay within the committed DejaVu **subset** (Basic Latin + common punctuation, `api/assets/fonts/*-subset.ttf`) or the subset must be regenerated, because a missing glyph renders as *blank on a perfectly valid PNG*. That is exactly why `renderOgPixels` exists — any new card variant or text line needs a painted-pixels assertion in `og.test.ts`, not just a 200-status check.

## 7. Dataset entries are public URL contracts and factual claims

A tool `id` in `dataset.ts` is embedded in share links (`?tool=`) and OG URLs the moment it ships — ids are add-only; renaming or deleting one breaks every previously shared link with a 400. New entries must carry an accurate `release_date` (it drives the entire output number) and a `sources` entry, because the dataset *is* the product's factual claim and an unsourced date is an invented statistic. The web `FALLBACK_TOOLS` list already uses divergent ids (`cursor-yolo` vs `cursor-yolo-mode`, `claude-3.5-sonnet` vs `claude-3-5-sonnet`) — new additions on either side must reuse the API's id verbatim, not widen the split.

## 8. "Today" is ambient state — pin it in tests

`as_of` and the OG date default to server-now (`new Date()`), so any test of calc or OG output must pass an explicit `as_of`/`date`, or it becomes a flake that starts failing on some future date for whoever touches the file next. Don't add new ambient `new Date()` reads outside the existing default sites — thread the as-of date through instead.

## 9. CORS stays fail-closed; startup assets stay committed

Unset `WEB_ORIGIN` means localhost-only CORS — that is the **designed** deploy sequence (deploy-api.md step 3: API first, then lock CORS to the web origin), not a bug. Never unblock a deployed frontend with `origin: true` or a wildcard; set `WEB_ORIGIN`. Separately: the server reads fonts and the resvg wasm synchronously at import — any new asset must be committed under `api/` and proven by `scripts/gate-check.sh`'s fresh `npm ci`, because a warm local `node_modules` hides missing-file failures until the QA gate.
