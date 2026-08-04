# Visual QA harness (`qa/visual`)

Standalone Playwright harness that drives the **running** aitime-calc app over HTTP and
checks the surfaces the unit tests can't: live console errors, dark mode, mobile viewport,
and click-through (leaderboard sort, CSV/JSON exports, home tool picker).

It **never imports or modifies `web/` or `api/`** — it only talks to the app by URL, and its
Playwright dependency is scoped to this folder's own `package.json` so it can't collide with
`web/package.json`. Screenshots and downloads are git-ignored (nothing binary is committed).

## Prerequisites

The app must already be running. From the repo root, in two shells:

```bash
cd api && npm run dev      # api on :3001
cd web && npm run dev      # web on :5173+ (Vite picks the next free port)
```

## Setup (once)

```bash
cd qa/visual
npm install
npm run install:browser    # downloads Chromium into the local Playwright cache
```

## Run

```bash
# point WEB_URL at whatever port Vite actually bound (see its startup line)
WEB_URL=http://localhost:5176 npm run check
```

`check` runs both scripts:

- **`npm run baseline`** — 6 routes × light/dark × desktop(1280)/mobile(390) screenshots,
  live console-error capture, and click-through. Writes `out/<LABEL>/report.json` +
  `out/<LABEL>/screens/*.png`. Exits non-zero if anything FAILs.
- **`npm run overflow`** — objective layout probe: page-level horizontal overflow and
  offscreen interactive controls, per route/theme/viewport.

## Env overrides

| var | default | use |
|-----|---------|-----|
| `WEB_URL` | `http://localhost:5176` | app URL (match Vite's bound port) |
| `API_URL` | `http://localhost:3001` | api URL (preflight health check) |
| `LABEL`   | `main` | subfolder under `out/` — tag a run to diff branches |
| `OUT`     | `./out` | output root |

## Compare a branch against main

```bash
LABEL=main     WEB_URL=http://localhost:5176 npm run baseline   # main
LABEL=redesign WEB_URL=http://localhost:5175 npm run baseline   # a feature branch's dev server
# then diff out/main/report.json vs out/redesign/report.json and eyeball the screenshots
```

## Reading the results

- `baseline` FAIL = a real problem: HTTP error, a non-noise console error, a broken
  click-through step. Vite/favicon/React-DevTools chatter is filtered out.
- `overflow` **CHECK** is a *look here*, not a failure: a wide table or chart in an
  `overflow-x:auto` container legitimately trips it. `docOverflow > 2` (the page itself
  scrolls sideways) or an offscreen interactive control is the part that usually matters.
