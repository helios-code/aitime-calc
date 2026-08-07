# 0dc5e1ad-followup-langparam

## Team : dev (niwa)
## Branch : fix/web-appendlang-const (from main)
## Status : 🔵 SUBMITTED

## 1. Product Brief

### Acceptance Criteria
_(untyped ticket — no acceptance criteria)_

## 2. Root cause & decisions

# niwa-decision — appendLang uses LANG_PARAM constant (follow-up on 0dc5e1ad)

ROOT_CAUSE: Gate finding on 0dc5e1ad (merged 862f220f): `urlState.appendLang` hardcoded
the `'lang'` literal instead of importing `LANG_PARAM` from i18n. The read side (i18n
resolves `?lang`) and the write side (share-link builder) could drift silently — rename
`LANG_PARAM` and shared links would carry the wrong param, breaking the lang round-trip
with no compile error.

DECISION: Import `LANG_PARAM` from `./i18n` in urlState and use it in `appendLang`. Single
source of truth for the param name; the original "keep urlState dependency-free" rationale
loses to correctness — it's a plain const import, no cycle (i18n imports nothing from
urlState), and i18n's load-time side effects are already window/document-guarded.

VERIFICATION: `npm run test` 125 passed (17 files) — existing appendLang tests still green,
confirming the literal value is unchanged; `npm run build` green; `oxlint` exit 0.

## 3. Files changed

```
.niwa-decision.md       | 42 ++++++++++++------------------------------
 web/src/lib/urlState.ts | 13 +++++++------
 2 files changed, 19 insertions(+), 36 deletions(-)
```

## 4. QA Log

_(no review round yet)_

## 5. Timeline


---
_Auto-assembled by the niwa scribe from the Q&A gate. Task `0dc5e1ad-followup-langparam`._
