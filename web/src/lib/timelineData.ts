import type { Tool } from '../types'
import { computeCalc } from './atem'

export interface TimelinePoint {
  tool: Tool
  humanEquivYears: number
  releaseMs: number
}

/** Per-tool human-equivalent-years (base model) vs release date, oldest first. */
export function buildTimelinePoints(tools: Tool[], asOf: string): TimelinePoint[] {
  return tools
    .map((tool) => ({
      tool,
      humanEquivYears: computeCalc({ release_date: tool.release_date, as_of: asOf, model: 'base' }).human_equiv_years,
      releaseMs: new Date(`${tool.release_date}T00:00:00Z`).getTime(),
    }))
    .sort((a, b) => a.releaseMs - b.releaseMs)
}
