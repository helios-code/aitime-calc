# Deploying the ATEM API (`/api`)

Fastify + TS backend, deployed as a container on Fly.io. This is deploy
plumbing only — no product/contract changes. See the `api-contract` and
`atem-methodology` relay memories for what the API actually does.

## Deploy order (read this first)

**API deploys first.** The frontend (`/web`) needs the API's public origin
to set `VITE_API_URL` at its own build time, and this API needs the
frontend's origin to lock down CORS. Sequence:

1. Deploy this API → get its public URL, e.g. `https://aitime-calc-api.fly.dev`.
2. Hand that URL to the frontend owner (dev-58) → they set `VITE_API_URL`
   and deploy `/web` → get the web app's public URL.
3. Come back here and set `WEB_ORIGIN` on the API to that web URL (see
   below), then redeploy/restart so CORS locks to it.

Until step 3, the API's `WEB_ORIGIN` secret is unset, which means CORS
only allows `localhost` origins — the deployed frontend will be blocked
from calling the API until you set it. This is intentional (fail closed,
not wide-open).

## Prerequisites (human step — do not attempt to run these)

The live deploy needs Fly.io credentials/org access. A human must:

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. `fly auth login`
3. Have (or create) the Fly org this app should live in.

## One-time app creation

```bash
cd api
fly apps create aitime-calc-api   # or let `fly launch` create it interactively
```

If the app name `aitime-calc-api` is taken, pick another and update the
`app` field in `fly.toml` to match.

## Environment / secrets

| Var          | Where           | Value                                              |
|--------------|-----------------|-----------------------------------------------------|
| `PORT`       | `fly.toml` env  | `3001` (already set, matches `internal_port`)       |
| `WEB_ORIGIN` | Fly secret      | The deployed frontend's origin, e.g. `https://aitime-calc.vercel.app` (no trailing slash) |

Set the secret (after the frontend has a URL — see deploy order above):

```bash
fly secrets set WEB_ORIGIN=https://<the-web-app-origin>
```

Without `WEB_ORIGIN` set, CORS only allows `http://localhost:*` /
`http://127.0.0.1:*` origins (dev-safe default, never wide-open in prod).

## Deploy

```bash
cd api
fly deploy
```

This builds `Dockerfile` (multi-stage: `npm ci` + `npm run build` in a
builder stage, `npm ci --omit=dev` + compiled `dist/` in the runtime
stage) and ships it. Fly's health check hits `GET /api/health` (see
`[[http_service.checks]]` in `fly.toml`) before routing traffic to a new
machine.

## Verify

```bash
curl https://<app>.fly.dev/api/health
# {"ok":true,"version":"0.1.0"}

curl https://<app>.fly.dev/api/tools
# {"tools":[...]}
```

## Local production-mode smoke test (no Fly needed)

```bash
cd api
npm run build
PORT=3001 WEB_ORIGIN=http://localhost:5173 node dist/server.js
```

## Why Fly.io

Org precedent (see relay memory `deploy-runbook`, prior Fly.io deploy for
another Node backend): cheap shared-cpu-1x with auto-stop/auto-start
machines for a low-traffic API, straightforward Docker-based deploys, and
already-familiar tooling. Render/Railway would also work for this
workload but there's no reason to diverge from the established pattern.

## Rollback

```bash
fly releases           # list past releases
fly deploy --image <previous-image-ref>   # or:
fly releases rollback <version>
```
