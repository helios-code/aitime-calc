import type { CalcModel } from '../types'

// Mirrors the two modes parseInitialState understands: '/embed?tool=' and
// '/embed?date='. Never set both — parseInitialState resolves tool+date to
// tool mode, which would silently ignore the date.
export type EmbedTarget = { mode: 'tool'; toolId: string } | { mode: 'date'; date: string }

// The snippet is pasted verbatim into third-party pages, so anything we
// interpolate into an attribute has to be escaped there — the URL is escaped by
// URL.toString(), the title is not.
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildEmbedSnippet(origin: string, target: EmbedTarget, model: CalcModel): string {
  const url = new URL('/embed', origin)
  let title: string
  if (target.mode === 'tool') {
    url.searchParams.set('tool', target.toolId)
    title = `aitime-calc result for ${target.toolId}`
  } else {
    url.searchParams.set('date', target.date)
    title = `aitime-calc result since ${target.date}`
  }
  url.searchParams.set('model', model)
  // title= is required for WCAG 4.1.2 (frame-title): a screen reader announces
  // it as the frame's name. It stays in the host page forever once copied.
  return `<iframe src="${url.toString()}" title="${escapeAttr(title)}" width="480" height="640" style="border:0" loading="lazy"></iframe>`
}
