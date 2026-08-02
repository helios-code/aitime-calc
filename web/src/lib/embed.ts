import type { CalcModel } from '../types'

export function buildEmbedSnippet(origin: string, toolId: string, model: CalcModel): string {
  const url = new URL('/embed', origin)
  url.searchParams.set('tool', toolId)
  url.searchParams.set('model', model)
  return `<iframe src="${url.toString()}" width="480" height="640" style="border:0" loading="lazy"></iframe>`
}
