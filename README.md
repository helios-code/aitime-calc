# aitime-calc

Calculateur de temps humain équivalent écoulé depuis la sortie d'un modèle/outil IA — accélération perçue du progrès IA vs cycle de maturation classique (ex: packages npm).

Exemple: Cursor YOLO mode sorti en 2024 → ressenti comme ~27 ans de temps humain aujourd'hui.

Fleet: `founder` (console) → `cto` (lead) → `dev` × backend/frontend, orchestrée via [niwa](https://github.com/) + agent-relay.

## Status

En cours de conception — le CTO de la fleet fait la recherche sur le concept avant implémentation. Chaque lead commit sous son propre nom.

## API reference

See [`docs/API.md`](docs/API.md) for the JSON endpoints.

## Development / gate parity

Run `bash scripts/gate-check.sh` before `qa-submit` — it mirrors the reviewer's clean checkout (fresh `npm ci` for `api/` and `web/`, then typecheck, test, build) so native-dep / missing-asset failures surface locally instead of at the gate.

## Gate smoke test

This line was added to exercise the QA gate end to end: PR creation, the
reviewer verdict mirrored onto the PR, and the merge gated on GitHub checks.
