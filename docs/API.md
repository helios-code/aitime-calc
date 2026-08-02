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
| `category` | string | free-form, e.g. `llm`, `coding agent`, `image gen` |
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

## GET /api/og

Renders a `1200×630` PNG social-share card (OpenGraph image). Two modes:

**Tool mode** — `?tool=<id>` (+ optional `&model=base|accelerating` and `&date=<YYYY-MM-DD>` as an `as_of` override, default today)

```
GET /api/og?tool=cursor-yolo-mode&date=2026-07-30
```

**Date mode** — no `tool`, just `&date=<YYYY-MM-DD>` (+ optional `&model=`). Renders a card for "as of `date`" without a tool name/vendor line — used for date-only shares.

```
GET /api/og?date=2025-03-14
```

**Response `200`** — `Content-Type: image/png`, binary body.

**Errors `400`** — `{"error": string}`, e.g. `"tool or date is required"`, `"unknown tool: <id>"`, `"unknown model: <value>"`, `"invalid date: <value>"`, `"date <value> is before <tool>'s release date"`, `"date <value> is in the future"` (date-mode only).

## Not yet implemented

There is no batch/ranking endpoint (`/api/leaderboard` does not exist on `main`) — the web app's leaderboard page computes rankings client-side from `GET /api/tools` instead. If a batch endpoint ships later, document it here.
