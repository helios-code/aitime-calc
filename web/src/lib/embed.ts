import type { CalcModel } from '../types'

// Mirrors the two modes parseInitialState understands: '/embed?tool=' and
// '/embed?date='. Never set both — parseInitialState resolves tool+date to
// tool mode, which would silently ignore the date.
export type EmbedTarget = { mode: 'tool'; toolId: string } | { mode: 'date'; date: string }

export function buildEmbedSnippet(origin: string, target: EmbedTarget, model: CalcModel): string {
  const url = new URL('/embed', origin)
  if (target.mode === 'tool') {
    url.searchParams.set('tool', target.toolId)
  } else {
    url.searchParams.set('date', target.date)
  }
  url.searchParams.set('model', model)
  return `<iframe src="${url.toString()}" width="480" height="640" style="border:0" loading="lazy"></iframe>`
}
