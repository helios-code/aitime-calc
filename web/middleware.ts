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

const DEFAULT_TITLE = 'aitime-calc — human-equivalent time'
const DEFAULT_DESCRIPTION =
  'How much human progress did that AI release actually compress? aitime-calc converts calendar time into human-equivalent years.'

// Static per-route entries. /leaderboard, /compare and /timeline don't have
// live pages on main yet (still mid-rebase on other branches) — harmless to
// list now since the middleware only ever reads this map, it doesn't assert
// the route exists.
const ROUTE_META: Record<string, RouteMeta> = {
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
}

export function resolveMeta(pathname: string, searchParams: URLSearchParams): RouteMeta {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const staticEntry = ROUTE_META[normalized]
  if (staticEntry) return staticEntry

  // Home ('/') and '/embed' vary by ?tool — same query contract as
  // urlParams.ts's parseInitialState.
  const tool = searchParams.get('tool')
  if (tool) {
    return {
      title: `${tool} vs. classic time — aitime-calc`,
      description: `See how much human-equivalent progress ${tool} compressed since release, per the ATEM model.`,
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
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
  return url.toString()
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const originResponse = await fetch(new URL('/index.html', url))

  const contentType = originResponse.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return originResponse

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
  ]
    .filter(Boolean)
    .join('\n    ')

  const html = await originResponse.text()
  const rewritten = html
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
