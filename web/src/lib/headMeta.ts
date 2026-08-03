import type { CalcModel } from '../types'
import { API_BASE } from './api'

// /api/og can only render a card for a known tool id (buildOgSvg throws
// "tool is required" otherwise) — it has no way to render an arbitrary
// custom release date. So a param-aware card is only possible in tool mode;
// date mode has no dynamic image to point at (falls back to the static tag).
export function buildOgImageUrl(toolId: string, model: CalcModel, asOf: string): string {
  const params = new URLSearchParams({ tool: toolId, model, date: asOf })
  return `${API_BASE}/api/og?${params}`
}

type MetaAttr = 'name' | 'property'

function upsertMeta(attr: MetaAttr, key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export interface ShareMeta {
  title: string
  description: string
  url: string
  image?: string
}

// Updates the live document head so humans-with-JS (and any JS-executing
// crawler) see per-result tags. Classic unfurl bots (Twitter/Slack/FB) fetch
// the initial static HTML and never run this — they only ever see
// web/index.html's static tags. This is a best-effort enhancement layered on
// top of that static fallback, not a replacement for it.
export function updateShareMeta(meta: ShareMeta) {
  upsertMeta('property', 'og:title', meta.title)
  upsertMeta('property', 'og:description', meta.description)
  upsertMeta('property', 'og:url', meta.url)
  upsertMeta('name', 'twitter:title', meta.title)
  upsertMeta('name', 'twitter:description', meta.description)
  if (meta.image) {
    upsertMeta('property', 'og:image', meta.image)
    upsertMeta('name', 'twitter:image', meta.image)
  }
}
