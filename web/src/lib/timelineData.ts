import type { Tool } from '../types'
import { computeCalc } from './atem'

export interface TimelinePoint {
  tool: Tool
  humanEquivYears: number
  releaseMs: number
}

/**
 * Per-tool human-equivalent-years (base model) vs release date, oldest first.
 *
 * fetchTools() only checks that /api/tools returned a non-empty array, so rows here
 * are untrusted: a missing or malformed release_date makes computeCalc throw, which
 * would blow up the whole page render. Such rows are skipped instead.
 */
export function buildTimelinePoints(tools: Tool[], asOf: string): TimelinePoint[] {
  const points: TimelinePoint[] = []
  for (const tool of tools) {
    if (!tool || typeof tool.release_date !== 'string') continue
    const releaseMs = new Date(`${tool.release_date}T00:00:00Z`).getTime()
    if (!Number.isFinite(releaseMs)) continue
    let humanEquivYears: number
    try {
      humanEquivYears = computeCalc({ release_date: tool.release_date, as_of: asOf, model: 'base' }).human_equiv_years
    } catch {
      continue
    }
    if (!Number.isFinite(humanEquivYears)) continue
    points.push({ tool, humanEquivYears, releaseMs })
  }
  return points.sort((a, b) => a.releaseMs - b.releaseMs)
}
