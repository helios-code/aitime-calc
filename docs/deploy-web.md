# Deploying the web app (Vercel)

The frontend (`/web`) is a static Vite/React build. It ships as a static
site on Vercel with a client-side rewrite for SPA routing.

## Deploy order

**Deploy the API first** (see `docs/deploy-api.md`), get its public origin
(e.g. `https://aitime-calc-api.fly.dev`), then deploy the web app with that
origin as `VITE_API_URL`. Once the web app has its own URL, hand it to
dev-57 so the API's `WEB_ORIGIN` (CORS allow-list) can be set to it.

1. Deploy API -> get API origin URL.
2. Deploy web with `VITE_API_URL=<api origin>` -> get web URL.
3. Set the API's `WEB_ORIGIN` to the web URL (dev-57 / API owner).

## One-time project setup

From the repo root, with the [Vercel CLI](https://vercel.com/docs/cli) installed and
logged in (`vercel login`):

```sh
cd web
vercel link          # create/link the Vercel project, set root directory to `web`
```

When prompted, set the project's **Root Directory** to `web` (or run `vercel link`
from inside `web/` as above) so Vercel picks up `web/vercel.json`, `web/package.json`,
and builds `web/dist`.

## Environment variable

Set in the Vercel project (Settings -> Environment Variables), for all
environments that should talk to a live API:

| Name            | Value                              |
|------------------|-------------------------------------|
| `VITE_API_URL`   | Public origin of the deployed API, e.g. `https://aitime-calc-api.fly.dev` (no trailing slash) |

`VITE_API_URL` is read **at build time** (Vite inlines it into the bundle), so
it must be set before the build runs, not just at request time. If unset, the
app falls back to relative `/api/...` calls, which only work behind the local
Vite dev proxy — in prod that means every request 404s and the app silently
switches to its built-in mock dataset (`source: 'mock'` in the UI). The app
never hard-crashes either way; it always renders something.

## Deploy

```sh
cd web
vercel --prod
```

Vercel builds via `npm run build` (`tsc -b && vite build`) into `web/dist`
and serves it as static assets, with all routes rewritten to `/index.html`
per `web/vercel.json` so deep links (e.g. `/tool/claude-code`) don't 404.

## Verify

- `npm run build` locally must stay clean (currently ~204KB / ~64KB gz JS).
- After deploy, load the site and confirm the result banner shows `source: live`
  (not `mock`) once `VITE_API_URL` points at a reachable API.
- If the API is down or `VITE_API_URL` is unset/misconfigured, the app must
  still render using the mock dataset — never a blank page or hard error.

## Human step (not automated here)

The actual `vercel link` + `vercel --prod` + setting `VITE_API_URL` in the
Vercel dashboard needs founder/human credentials and is **not** run by this
task. This doc is the runbook for whoever runs it.
