# Contributing to aitime-calc

This repo is built by a niwa agent fleet. All merges to `main` go through the
niwa **Q&A gate** — the daemon merges on approval. No one pushes to `main` directly.

## Workflow

1. Work in your **own git worktree** on a branch off `main`:
   ```sh
   git fetch origin
   git worktree add -b <branch> .worktrees/<you>-<slug> origin/main
   ```
   Each worktree has its **own empty `node_modules/`** — run `npm install` in
   the package you touch (`api/` and/or `web/`) before building, testing, or
   linting. A warm root checkout does not share deps with a fresh worktree.
2. One branch per lot:
   - Backend (`/api`) → `feat/backend-atem-api`
   - Frontend (`/web`) → `feat/frontend-calc-ui`
3. Commit under **your own agent identity** (e.g. `dev-57`, `dev-58`).
4. Write a **`.niwa-decision.md`** at the repo root before you submit — the gate
   expects it. Two required lines:
   ```
   ROOT_CAUSE: <the underlying cause you fixed, not the symptom>
   DECISION:   <the approach you chose and why>
   ```
5. Run the **gate-check** locally — it mirrors the gate's fresh-checkout build
   (clean `npm ci` + typecheck + test + build for each of `api/` and `web/`),
   so it catches native-dep / missing-asset failures a warm `node_modules` hides:
   ```sh
   scripts/gate-check.sh
   ```
6. Submit for review (set `AGENT_NAME` to your identity):
   ```sh
   AGENT_NAME=<you> ~/.agentd/agent-hook.sh qa-submit <task-id> <branch> main
   ```
7. Address review findings and re-submit until approved. The daemon merges.
   **Never self-merge.**

## Linting the web app

`web/` uses [oxlint](https://oxc.rs), not ESLint:

```sh
cd web
npm run lint:ox      # → oxlint src : real output, exit 0 clean, non-zero on error
```

> **RTK gotcha.** Under the fleet's RTK proxy, bare `npm run lint` is auto-rewritten
> to `rtk lint` (an ESLint-only filter). Since this repo has no ESLint, that prints
> `ESLint output (JSON parse failed: EOF…)` and swallows the exit code. Use
> `npm run lint:ox` (RTK passes it through) or call the binary directly:
> `./node_modules/.bin/oxlint src`.

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), imperative, scoped:

```
feat(api): ATEM calc endpoint + tools dataset
test(api): Cursor-YOLO anchor guard
feat(web): count-up hero + tool picker
```

Small, logical commits. No `wip` / `fix2` noise.

## Hygiene

`.gitignore` covers `node_modules/`, `dist/`, `.next/`, `.env*`, `.DS_Store`,
`.worktrees/`. Never commit build output, dependencies, or secrets.
Backend lives in `/api`, frontend in `/web` — keep the root clean.
