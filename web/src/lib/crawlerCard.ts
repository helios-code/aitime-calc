import { parseInitialState } from './urlParams'
import { buildShareText } from './shareText'
import { FALLBACK_TOOLS } from '../data/tools'
import type { CalcModel, CalcResult } from '../types'

const SITE_TITLE = 'aitime-calc — human-equivalent time'
const SITE_DESCRIPTION =
  'How much human progress did that AI release actually compress? aitime-calc converts calendar time into human-equivalent years.'
const DEFAULT_TOOL_ID = 'cursor-yolo' // mirrors data/tools.ts DEFAULT_TOOL_ID and index.html's static fallback
const FETCH_TIMEOUT_MS = 1500

export interface CrawlerCardMeta {
  title: string
  description: string
  image: string
}

// Edge-runtime-safe URL builder for the live Fly /api/og PNG. Deliberately separate
// from web/src/lib/headMeta.ts's buildOgImageUrl: that one resolves its API origin from
// api.ts's API_BASE, which is inlined via Vite's import.meta.env at CLIENT build time.
// middleware.ts is bundled by Vercel's own edge builder (not Vite), so it must resolve
// apiBase from process.env at request time instead — same param shape, different runtime.
export function buildOgImageUrl(apiBase: string, toolId: string, model: CalcModel): string {
  const params = new URLSearchParams({ tool: toolId, model })
  return `${apiBase}/api/og?${params}`
}

function fallbackMeta(apiBase: string): CrawlerCardMeta {
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    image: buildOgImageUrl(apiBase, DEFAULT_TOOL_ID, 'base'),
  }
}

// Builds the crawler-facing card for a shared result link. Tool mode fetches the live
// /api/calc so the card's title matches exactly what a human sees (the actual viral
// punch: "Cursor YOLO = ~27 human-equivalent years..."). Any failure — unknown tool,
// unreachable API, timeout, malformed payload — falls back to the generic static card.
// Never throws.
export async function buildCrawlerCardMeta(apiBase: string, search: string): Promise<CrawlerCardMeta> {
  const state = parseInitialState(search)
  if (state.mode !== 'tool' || !state.tool) {
    // date mode / bare landing: /api/og has no way to render a custom release date,
    // same limitation as the client-side card shipped in 9a17c8d8.
    return fallbackMeta(apiBase)
  }
  try {
    const query = new URLSearchParams({ tool_id: state.tool, model: state.model })
    const res = await fetch(`${apiBase}/api/calc?${query}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) return fallbackMeta(apiBase)
    const result: CalcResult = await res.json()
    if (typeof result?.human_equiv_years !== 'number') return fallbackMeta(apiBase)
    const toolName = FALLBACK_TOOLS.find((t) => t.id === state.tool)?.name
    return {
      title: `aitime-calc — ${buildShareText(result, toolName)}`,
      description: result.methodology_note || SITE_DESCRIPTION,
      image: buildOgImageUrl(apiBase, state.tool, state.model),
    }
  } catch {
    return fallbackMeta(apiBase)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildCrawlerHtml(meta: CrawlerCardMeta, canonicalUrl: string): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const image = escapeHtml(meta.image)
  const canonical = escapeHtml(canonicalUrl)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="aitime-calc" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body></body>
</html>
`
}
