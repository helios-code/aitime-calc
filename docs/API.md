# API reference

Base URL: wherever `aitime-calc-api` is deployed (see `docs/deploy-api.md`). Locally, `npm run dev` in `api/` serves on `http://localhost:3001`; Vite proxies `/api` there in dev (see `web/vite.config.ts`).

All responses are JSON except `GET /api/og`, which returns a PNG image. Error responses are always `{"error": string}` with a `4xx` status.

CORS: without `WEB_ORIGIN` set, only `localhost`/`127.0.0.1` origins are allowed (any port). With `WEB_ORIGIN` set, that origin is allowed in addition to localhost. See `docs/deploy-api.md`.

## GET /api/health

Liveness/version check.

**Response `200`**

```json
{ "ok": true, "version": "0.1.0" }
```

## GET /api/tools

Returns the full curated tool dataset (`api/src/dataset.ts`), the canonical id space — `?tool=`/`?tool_id=` values elsewhere in this API and in shared web links should match an `id` here.

**Response `200`**

```json
{
  "tools": [
    {
      "id": "gpt-2",
      "name": "GPT-2",
      "vendor": "OpenAI",
      "release_date": "2019-02-14",
      "category": "llm",
      "note": "First widely-noted \"too dangerous to release\" language model.",
      "sources": ["OpenAI blog announcement, February 2019"]
    }
  ]
}
```

| field | type | notes |
|---|---|---|
| `id` | string | stable, add-only — used as `tool_id`/`tool` elsewhere |
| `name` | string | display name |
| `vendor` | string | |
| `release_date` | string | `YYYY-MM-DD` |
| `category` | string | e.g. `llm`, `reasoning-llm`, `agentic-coding`, `code-generation`, `code-completion`, `chat`, `multimodal-llm`, `open-weight-llm`, `browser-agent`, `image-gen`, `video-gen`, `science-ai` (kebab-case; see `api/src/dataset.ts` for the current full set) |
| `note` | string | one-line description |
| `sources` | string[] | optional, citation(s) for `release_date` |

A small set of pre-reconciliation ids (e.g. `claude-4.5-sonnet`, `gpt-3`) still resolve via an internal alias map for backward compatibility with old links — always prefer the canonical `id` values returned here for new links.

## GET /api/calc

## POST /api/calc

Computes the ATEM (AI-Time Equivalence Model) result — see `docs/METHODOLOGY.md` for the formulas. GET takes query parameters; POST takes the same fields as a JSON body.

**Params** (one of `tool_id` or `release`/`release_date` is required)

| param | type | required | notes |
|---|---|---|---|
| `tool_id` | string | one-of | must match an `id` from `GET /api/tools` (or a known alias); sets `release_date` from the tool |
| `release` / `release_date` | string (`YYYY-MM-DD`) | one-of | explicit release date; ignored if `tool_id` is set |
| `as_of` | string (`YYYY-MM-DD`) | no | defaults to today (UTC) |
| `model` | `"base"` \| `"accelerating"` | no | defaults to `"base"` |
| `d_classic_months` | number > 0 | no | defaults to `72` |
| `d_ai_months` | number > 0 | no | defaults to `4.5` |

**Response `200`** (`GET /api/calc?tool_id=cursor-yolo-mode&as_of=2026-07-30`)

```json
{
  "input": { "release_date": "2024-11-01", "as_of": "2026-07-30", "tool_id": "cursor-yolo-mode" },
  "elapsed": { "days": 636, "months": 20.9, "human": "1 yr 9 mo" },
  "model": "base",
  "params": { "d_classic_months": 72, "d_ai_months": 4.5, "multiplier": 16 },
  "ai_doublings": 4.644,
  "human_equiv_years": 27.86,
  "human_equiv_human": "27 years 10 months",
  "comparison_line": "≈ 4.6 classic software generations",
  "methodology_note": "ATEM base model: 20.9 elapsed AI-months / D_ai=4.5mo, scaled by D_classic=72mo (16.0x multiplier).",
  "sources": [
    "METR — Measuring AI Ability to Complete Long Tasks (2025-03)",
    "AI Model Law — capability doubling ~3mo",
    "Moore's-law-style classic tech-generation cadence"
  ]
}
```

**Errors `400`**

```json
{ "error": "release (or tool_id) is required" }
{ "error": "unknown tool_id: nope" }
{ "error": "invalid release date: not-a-date" }
{ "error": "d_classic_months must be a positive number" }
```

## GET /api/timeline

Scores every dataset tool against one `as_of`, oldest release first — the batch form of `GET /api/calc?tool_id=…`. No new math: each row matches what `/api/calc` returns for that tool alone.

**Params** (all optional)

| param | type | notes |
|---|---|---|
| `as_of` | string (`YYYY-MM-DD`) | defaults to today (UTC) |
| `model` | `"base"` \| `"accelerating"` | defaults to `"base"`; unlike `/api/calc`, an unrecognized value is a `400` rather than a silent fallback |
| `d_classic_months` | number > 0 | defaults to `72` |
| `d_ai_months` | number > 0 | defaults to `4.5` |

Tools whose `release_date` is after `as_of` are omitted (they would score negative human-equivalent years), so `count` is the number of rows returned, not the dataset size.

**Response `200`** (`GET /api/timeline?as_of=2026-07-30`, first row shown)

```json
{
  "as_of": "2026-07-30",
  "model": "base",
  "params": { "d_classic_months": 72, "d_ai_months": 4.5, "multiplier": 16 },
  "count": 82,
  "tools": [
    {
      "tool_id": "gpt-2",
      "name": "GPT-2",
      "vendor": "OpenAI",
      "category": "llm",
      "release_date": "2019-02-14",
      "elapsed": { "days": 2723, "months": 89.46, "human": "7 yrs 5 mo" },
      "ai_doublings": 19.881,
      "human_equiv_years": 119.29,
      "human_equiv_human": "119 years 3 months"
    }
  ],
  "sources": ["METR — Measuring AI Ability to Complete Long Tasks (2025-03)", "…"]
}
```

**Errors `400`**

```json
{ "error": "invalid as_of date: not-a-date" }
{ "error": "unknown model: sideways" }
{ "error": "d_ai_months must be a positive number" }
```

## GET /api/compare

Scores two tools against the same `as_of` and reports the gap between them.

**Params**

| param | type | required | notes |
|---|---|---|---|
| `tool` | string | yes | tool id or known alias (same resolver as `/api/calc`'s `tool_id`) |
| `vs` | string | yes | the tool to compare against |
| `as_of` | string (`YYYY-MM-DD`) | no | defaults to today (UTC) |
| `model` | `"base"` \| `"accelerating"` | no | defaults to `"base"`; `400` on an unrecognized value |
| `d_classic_months` | number > 0 | no | defaults to `72` |
| `d_ai_months` | number > 0 | no | defaults to `4.5` |

`delta.human_equiv_years` is `a − b` (signed); `delta.ahead` names the tool that has compressed more human-equivalent time, or `null` when the two are level.

**Response `200`** (`GET /api/compare?tool=gpt-4&vs=claude-sonnet-4-5&as_of=2026-07-30`)

```json
{
  "as_of": "2026-07-30",
  "model": "base",
  "params": { "d_classic_months": 72, "d_ai_months": 4.5, "multiplier": 16 },
  "a": {
    "tool_id": "gpt-4",
    "name": "GPT-4",
    "vendor": "OpenAI",
    "category": "llm",
    "release_date": "2023-03-14",
    "elapsed": { "days": 1234, "months": 40.54, "human": "3 yrs 5 mo" },
    "ai_doublings": 9.01,
    "human_equiv_years": 54.06,
    "human_equiv_human": "54 years 1 month"
  },
  "b": {
    "tool_id": "claude-sonnet-4-5",
    "name": "Claude Sonnet 4.5",
    "vendor": "Anthropic",
    "category": "reasoning-llm",
    "release_date": "2025-09-29",
    "elapsed": { "days": 304, "months": 9.99, "human": "10 mo" },
    "ai_doublings": 2.22,
    "human_equiv_years": 13.32,
    "human_equiv_human": "13 years 4 months"
  },
  "delta": { "human_equiv_years": 40.74, "human_equiv_human": "40 years 9 months", "ahead": "gpt-4" },
  "sources": ["METR — Measuring AI Ability to Complete Long Tasks (2025-03)", "…"]
}
```

**Errors `400`**

```json
{ "error": "tool and vs are both required" }
{ "error": "unknown tool: nope" }
{ "error": "gpt-2 was released after as_of 2018-01-01" }
```

## GET /api/og

Renders a `1200×630` PNG social-share card (OpenGraph image). Two modes:

**Tool mode** — `?tool=<id>` (+ optional `&model=base|accelerating` and `&date=<YYYY-MM-DD>` as an `as_of` override, default today)

```
GET /api/og?tool=cursor-yolo-mode&date=2026-07-30
```

**Date mode** — no `tool`, just `&date=<YYYY-MM-DD>` (+ optional `&model=`). Here `date` is the *release/reference* date (`as_of` is implicitly today, not overridable) — the inverse of tool mode's `date`. Renders a card for "today, `date` months/years in" without a tool name/vendor line — used for date-only shares. Errors if `date` is in the future.

```
GET /api/og?date=2025-03-14
```

**Doubling params** — both modes also accept optional `&d_classic_months=<n>` and `&d_ai_months=<n>` (same knobs as `/api/calc`, defaults `72` and `4.5`), so a shared card reflects the same tuning as the page that generated it. Each must be a positive number or the request is a `400`.

```
GET /api/og?tool=cursor-yolo-mode&date=2026-07-30&d_ai_months=3&d_classic_months=60
```

**Response `200`** — `Content-Type: image/png`, binary body.

**Errors `400`** — `{"error": string}`, e.g. `"tool or date is required"`, `"unknown tool: <id>"`, `"unknown model: <value>"`, `"invalid date: <value>"`, `"date <value> is before <tool>'s release date"`, `"date <value> is in the future"` (date-mode only), `"d_classic_months must be a positive number"`, `"d_ai_months must be a positive number"`.

## GET /api/leaderboard

Every tool in the dataset ranked by human-equivalent years compressed since its release — the batch form of `GET /api/calc`, computed server-side with `DEFAULT_PARAMS`.

**Query**

| param | required | default | notes |
| --- | --- | --- | --- |
| `model` | no | `base` | `base` or `accelerating` |
| `as_of` | no | today (UTC) | `YYYY-MM-DD`; the date rankings are computed against |

Tools released *after* `as_of` are omitted (not ranked with negative years). `rank` is `1`-based over the tools that survive that filter, ordered by `human_equiv_years` descending; `human_equiv_years` is rounded to 2 decimals.

```
GET /api/leaderboard?model=accelerating&as_of=2026-01-01
```

**Response `200`** — `as_of` and `model` echo the resolved query (same as `/api/timeline` and `/api/compare`).

```json
{
  "as_of": "2026-01-01",
  "model": "accelerating",
  "leaderboard": [
    {
      "rank": 1,
      "tool_id": "gpt-2",
      "name": "GPT-2",
      "human_equiv_years": 87.84,
      "release_date": "2019-02-14"
    }
  ]
}
```

**Errors `400`** — `{"error": string}`: `"unknown model: <value>"`, `"invalid as_of date: <value>"`.
