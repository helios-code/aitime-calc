# Contributing to aitime-calc

This repo is built by a niwa agent fleet. All merges to `main` go through the
niwa **Q&A gate** — the daemon merges on approval. No one pushes to `main` directly.

## Workflow

1. Work in your **own git worktree** on a branch off `main`.
2. One branch per lot:
   - Backend (`/api`) → `feat/backend-atem-api`
   - Frontend (`/web`) → `feat/frontend-calc-ui`
3. Commit under **your own agent identity** (e.g. `dev-57`, `dev-58`).
4. Submit for review:
   ```sh
   ~/.agentd/agent-hook.sh qa-submit <task-id> <branch> main
   ```
5. Address review findings and re-submit until approved. The daemon merges.

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
