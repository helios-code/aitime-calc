// Vercel Edge Middleware, standalone (no framework) — runs before the SPA
// rewrite in web/vercel.json. Crawlers/social bots never execute client-side
// JS, so the per-route title/meta that headMeta.ts sets after mount is
// invisible to them; every route otherwise ships the same generic
// index.html <title>/<meta>. This injects per-route meta into the HTML shell
// itself, unconditionally (cheapest correct option — no UA-sniffing to keep
// in sync), before it ever reaches the browser. Client-side hydration is
// untouched: whatever this sets, headMeta.ts is free to overwrite for real
// users after mount.
//
// It also emits the crawler-only i18n signals bots need but the SPA can't
// give them: hreflang alternates (en/fr/x-default), a self-referencing
// canonical for the active locale, og:locale, and localized title/description
// under ?lang=fr. And it serves /robots.txt + /sitemap.xml (both derive their
// absolute URLs from the request origin, so there is no hardcoded prod host).
//
// Tradeoff: every matched request costs one extra same-origin fetch of
// /index.html (see `middleware` below) instead of serving the static file
// directly. Accepted for now — no caching layer added — since HTML is a tiny
// payload and this only runs for document navigations, not asset requests.

import {
  D_AI_MONTHS_MAX,
  D_AI_MONTHS_MIN,
  D_CLASSIC_MONTHS_MAX,
  D_CLASSIC_MONTHS_MIN,
} from './src/lib/urlParams'

declare const process: { env: Record<string, string | undefined> }

export const config = {
  matcher: ['/((?!api/|assets/|index\\.html$).*)'],
}

interface RouteMeta {
  title: string
  description: string
}

type Locale = 'en' | 'fr'

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', fr: 'fr_FR' }

// The locale a crawler should be served for this request. Mirrors web
// resolveLocale's default: only ?lang=fr opts into FR; everything else (absent,
// 'en', junk) is EN, keeping lang-free URLs canonical. LANG_PARAM ('lang')
// matches web/src/lib/i18n.ts and buildOgImageUrl's forward-only-fr rule.
function resolveLocale(searchParams: URLSearchParams): Locale {
  return searchParams.get('lang') === 'fr' ? 'fr' : 'en'
}

// FR copy is duplicated from web/src/lib/i18n.ts (the source of truth for FR
// strings) — this edge module can't import the locale-resolved `t` map (it
// resolves to EN with no `window`) and the raw en/fr maps aren't route-meta
// shaped. Keep these in sync if the web nav/page copy changes. EN entries are
// unchanged from before this change.
const DEFAULT_META: Record<Locale, RouteMeta> = {
  en: {
    title: 'aitime-calc — human-equivalent time',
    description:
      'How much human progress did that AI release actually compress? aitime-calc converts calendar time into human-equivalent years.',
  },
  fr: {
    title: 'aitime-calc — temps humain équivalent',
    description:
      'Quelle quantité de progrès humain cette sortie IA a-t-elle réellement compressée ? aitime-calc convertit le temps calendaire en années de temps humain équivalent.',
  },
}

// Static per-route entries. /leaderboard, /compare and /timeline don't have
// live pages on main yet (still mid-rebase on other branches) — harmless to
// list now since the middleware only ever reads this map, it doesn't assert
// the route exists.
const ROUTE_META: Record<Locale, Record<string, RouteMeta>> = {
  en: {
    '/methodology': {
      title: 'Methodology — aitime-calc',
      description: 'How the ATEM model converts calendar time into human-equivalent progress years.',
    },
    '/leaderboard': {
      title: 'Leaderboard — aitime-calc',
      description: 'Every AI tool ranked by human-equivalent years compressed since release.',
    },
    '/compare': {
      title: 'Compare — aitime-calc',
      description: 'Compare human-equivalent progress between two AI tools side by side.',
    },
    '/timeline': {
      title: 'Timeline — aitime-calc',
      description: 'Every tool in the dataset plotted on a human-equivalent-time axis.',
    },
  },
  fr: {
    '/methodology': {
      title: 'Méthodologie — aitime-calc',
      description: 'Comment le modèle ATEM convertit le temps calendaire en années de progrès humain équivalent.',
    },
    '/leaderboard': {
      title: 'Classement — aitime-calc',
      description: 'Tous les outils IA classés par années de temps humain équivalent compressées depuis leur sortie.',
    },
    '/compare': {
      title: 'Comparer — aitime-calc',
      description: 'Comparez le progrès humain équivalent entre deux outils IA, côte à côte.',
    },
    '/timeline': {
      title: 'Chronologie — aitime-calc',
      description: 'Tous les outils du jeu de données placés sur un axe de temps humain équivalent.',
    },
  },
}

function toolMeta(tool: string, locale: Locale): RouteMeta {
  if (locale === 'fr') {
    return {
      title: `${tool} vs. temps classique — aitime-calc`,
      description: `Découvrez combien de progrès humain équivalent ${tool} a compressé depuis sa sortie, selon le modèle ATEM.`,
    }
  }
  return {
    title: `${tool} vs. classic time — aitime-calc`,
    description: `See how much human-equivalent progress ${tool} compressed since release, per the ATEM model.`,
  }
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

export function resolveMeta(pathname: string, searchParams: URLSearchParams): RouteMeta {
  const locale = resolveLocale(searchParams)
  const normalized = normalizePath(pathname)
  const staticEntry = ROUTE_META[locale][normalized]
  if (staticEntry) return staticEntry

  // Home ('/') and '/embed' vary by ?tool — same query contract as
  // urlParams.ts's parseInitialState.
  const tool = searchParams.get('tool')
  if (tool) return toolMeta(tool, locale)

  return DEFAULT_META[locale]
}

// The OG card must depict what a visitor actually sees. parseInitialState()
// ignores doubling params outside these bounds and falls back to the defaults,
// and /api/og accepts any positive number — so forwarding a raw out-of-range
// value would unfurl a card that contradicts the page it links to. Drop those
// instead: the card then renders the same defaults the page does.
function boundedParam(raw: string | null, min: number, max: number): string | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < min || n > max) return null
  return raw
}

export function buildOgImageUrl(searchParams: URLSearchParams): string | null {
  const apiOrigin = process.env.VITE_API_URL
  if (!apiOrigin) return null

  // /api/og 400s without a tool id -- omit the tag entirely rather than inject
  // a broken image URL that would duplicate (and could shadow) the correct
  // static default og:image already in index.html for the bare landing.
  const tool = searchParams.get('tool')
  if (!tool) return null

  const url = new URL('/api/og', apiOrigin)
  const model = searchParams.get('model')
  const date = searchParams.get('date')
  const dClassicMonths = boundedParam(searchParams.get('d_classic_months'), D_CLASSIC_MONTHS_MIN, D_CLASSIC_MONTHS_MAX)
  const dAiMonths = boundedParam(searchParams.get('d_ai_months'), D_AI_MONTHS_MIN, D_AI_MONTHS_MAX)
  url.searchParams.set('tool', tool)
  if (model) url.searchParams.set('model', model)
  if (date) url.searchParams.set('date', date)
  if (dClassicMonths) url.searchParams.set('d_classic_months', dClassicMonths)
  if (dAiMonths) url.searchParams.set('d_ai_months', dAiMonths)
  // Forward the active locale so a FR permalink unfurls a FR card. Only 'fr' is
  // forwarded — English is /api/og's default, so an EN page keeps a lang-free
  // image URL (no regression to existing EN og:image tags). ?lang matches the
  // web i18n LANG_PARAM contract; /api/og falls back to EN on anything else.
  if (searchParams.get('lang') === 'fr') url.searchParams.set('lang', 'fr')
  return url.toString()
}

// Absolute URL for `pathname` at `locale`, preserving every other query param.
// EN drops ?lang (lang-free is the canonical EN form); FR sets ?lang=fr. This
// is the single source for both the in-page hreflang/canonical links and the
// sitemap, so the two can never disagree about a locale's URL shape.
function localeUrl(origin: string, pathname: string, searchParams: URLSearchParams, locale: Locale): string {
  const params = new URLSearchParams(searchParams)
  params.delete('lang')
  if (locale === 'fr') params.set('lang', 'fr')
  const qs = params.toString()
  return `${origin}${pathname}${qs ? `?${qs}` : ''}`
}

// Indexable, locale-symmetric surfaces. /embed is deliberately excluded — it's
// a widget frame, not a page we want in a search index, so it gets no hreflang,
// no canonical, and no sitemap entry.
const SITEMAP_ROUTES = ['/', '/methodology', '/leaderboard', '/compare', '/timeline'] as const

function isIndexable(normalizedPath: string): boolean {
  return normalizedPath !== '/embed'
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildRobots(origin: string): string {
  return `User-agent: *
Allow: /
Disallow: /embed

Sitemap: ${origin}/sitemap.xml
`
}

export function buildSitemap(origin: string): string {
  const empty = new URLSearchParams()
  const urls = SITEMAP_ROUTES.map((route) => {
    const en = escapeXml(localeUrl(origin, route, empty, 'en'))
    const fr = escapeXml(localeUrl(origin, route, empty, 'fr'))
    // loc is the x-default (EN); xhtml:link alternates carry both locales so a
    // crawler sees them as one page in two languages, not two pages.
    return `  <url>
    <loc>${en}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${en}" />
    <xhtml:link rel="alternate" hreflang="fr" href="${fr}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${en}" />
  </url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

// hreflang + canonical + og:locale for the active locale of an indexable page.
// EN and FR alternates both point at the SAME path with only ?lang differing,
// so canonical never points across locales (each locale is its own canonical).
export function buildI18nTags(origin: string, normalizedPath: string, searchParams: URLSearchParams, locale: Locale): string {
  const enUrl = escapeAttr(localeUrl(origin, normalizedPath, searchParams, 'en'))
  const frUrl = escapeAttr(localeUrl(origin, normalizedPath, searchParams, 'fr'))
  const canonical = locale === 'fr' ? frUrl : enUrl
  return [
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="fr" href="${frUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[locale]}" />`,
  ].join('\n    ')
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)

  // Crawler discovery files. Served here (not as static assets) so their
  // absolute URLs come from the live request origin — no hardcoded prod host.
  if (url.pathname === '/robots.txt') {
    return new Response(buildRobots(url.origin), {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
  if (url.pathname === '/sitemap.xml') {
    return new Response(buildSitemap(url.origin), {
      headers: { 'content-type': 'application/xml; charset=utf-8' },
    })
  }

  const originResponse = await fetch(new URL('/index.html', url))

  const contentType = originResponse.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return originResponse

  const locale = resolveLocale(url.searchParams)
  const normalized = normalizePath(url.pathname)
  const meta = resolveMeta(url.pathname, url.searchParams)
  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  const ogImage = buildOgImageUrl(url.searchParams)

  const extraTags = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    ogImage ? `<meta property="og:image" content="${escapeAttr(ogImage)}" />` : '',
    ogImage ? `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />` : '',
    // hreflang/canonical only on indexable surfaces (embed excluded).
    isIndexable(normalized) ? buildI18nTags(url.origin, normalized, url.searchParams, locale) : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  const html = await originResponse.text()
  const rewritten = html
    // The static shell ships <html lang="en">; a FR crawler must see lang="fr"
    // so it doesn't index FR copy as English. Client hydration re-syncs this via
    // syncDocumentLang for real users regardless.
    .replace(/(<html\b[^>]*\blang=")[^"]*(")/, locale === 'fr' ? `$1fr$2` : `$1en$2`)
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />\n    ${extraTags}`,
    )

  return new Response(rewritten, {
    status: originResponse.status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
