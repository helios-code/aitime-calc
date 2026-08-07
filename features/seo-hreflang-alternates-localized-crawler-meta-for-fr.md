# SEO: hreflang alternates + localized crawler meta for FR

## Team : anonymous (aitime-calc)
## Branch : feat/web-hreflang-crawler-meta (from main)
## Relay task : 8b28ecd3-a562-43b2-b0d9-5eb4de51a080
## Status : 🔵 SUBMITTED

## 1. Product Brief

### Acceptance Criteria
- [ ] 1. Crawler meta middleware emits link rel=alternate hreflang=en/fr (+x-default=en) with correct ?lang URLs on every indexable surface (embed excluded)
- [ ] 2. FR requests (?lang=fr) get FR title/description meta; EN output unchanged when lang absent
- [ ] 3. og:locale set per locale (en_US/fr_FR) alongside existing og tags
- [ ] 4. Canonical URL logic stays consistent with hreflang (no canonical pointing at the other locale)
- [ ] 5. Sitemap (if present; add if trivially absent) lists both locale URLs or uses xhtml:link alternates — pick, justify in .niwa-decision.md
- [ ] 6. api+web tests green + new middleware tests for hreflang/meta both locales; gate-check PASS

## 2. Root cause & decisions

# niwa-decision — hreflang alternates + localized crawler meta for FR (task 8b28ecd3)

ROOT_CAUSE: UI i18n (3b8fb68c) and OG cards (28a49ed4) are localized, but crawlers
had zero i18n signal. Every route shipped EN `<title>`/`<meta>` and no hreflang, so the
FR variant (`?lang=fr`) risked dupe-content treatment or wrong-locale serving. The fix
lives entirely in `web/middleware.ts` (the crawler-meta edge middleware) — no framework,
runs before the SPA rewrite.

DECISION:

**Locale.** `resolveLocale(searchParams)` = `fr` iff `?lang=fr`, else `en` — mirrors web
`resolveLocale`'s default and `buildOgImageUrl`'s forward-only-fr rule. Lang-free URLs
stay the canonical EN form.

**Localized meta.** `ROUTE_META`/`DEFAULT_META`/`toolMeta` are now per-locale. FR copy is
duplicated from `web/src/lib/i18n.ts` (source of truth) with a sync comment — same tactic
as the API's `OG_STRINGS`: this edge module can't import the locale-resolved `t` (no
`window` → resolves EN) and the raw en/fr maps aren't route-meta shaped. **EN entries are
byte-unchanged**; `resolveMeta(path, params)` signature is unchanged (locale derived from
params), so existing tests and callers are untouched. Under `?lang=fr` the page gets FR
title/description; `<html lang>` is rewritten `en`→`fr` for FR crawlers.

**hreflang + canonical (`buildI18nTags`).** Every indexable surface emits
`link rel=canonical` (self, active locale), `link rel=alternate hreflang=en|fr` and
`hreflang=x-default=en`, plus `og:url` (canonical) and `og:locale` (`en_US`/`fr_FR`).
EN and FR alternates are the SAME path differing only in `?lang`, so **canonical never
points across locales** — each locale is its own canonical. `/embed` is excluded (widget
frame, not an indexable page): no hreflang, no canonical, no sitemap entry.

**Sitemap — CHOICE: add a dynamic sitemap + robots, xhtml:link alternates.**
None existed. Justification for *dynamic* (served by the middleware, not a static
`public/` file): there is **no hardcoded prod origin anywhere in the repo** — the
middleware already derives everything from the live request origin. A static
`sitemap.xml`/`robots.txt` would have to bake in a prod host (brittle, wrong on
previews). So `/sitemap.xml` and `/robots.txt` are special-cased at the top of the
middleware and built from `url.origin`. Sitemap lists the 5 indexable routes, each with
`xhtml:link` alternates (en/fr/x-default) — chosen over per-locale `<url>` entries so a
crawler treats each as one page in two languages. `robots.txt` allows all, disallows
`/embed`, and advertises the sitemap. `localeUrl()` is the single URL builder shared by
the in-page links AND the sitemap, so they can't drift.

TESTS: `web/middleware.test.ts` extended — FR resolveMeta (static/tool/default + unknown
lang → EN), `buildI18nTags` both locales (self-canonical, no cross-locale canonical,
query-param preservation), `buildRobots`, `buildSitemap` (both locale URLs, namespaces,
embed excluded). 24 pass. `tsc -b` clean.

SCOPE: `web/middleware.ts`, `web/middleware.test.ts` only. API untouched.

## 3. Files changed

```
.niwa-decision.md      |  84 +++++++++----------
 web/middleware.test.ts |  82 ++++++++++++++++++-
 web/middleware.ts      | 213 ++++++++++++++++++++++++++++++++++++++++++-------
 3 files changed, 310 insertions(+), 69 deletions(-)
```

## 4. QA Log

_(no review round yet)_

## 5. Timeline


---
_Auto-assembled by the niwa scribe from the Q&A gate. Task `8b28ecd3-a562-43b2-b0d9-5eb4de51a080`._
