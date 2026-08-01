import { describe, expect, it } from 'vitest'
import { buildTimelinePoints } from './timelineData'
import type { Tool } from '../types'

const TOOLS: Tool[] = [
  { id: 'gpt-4o', name: 'GPT-4o', vendor: 'OpenAI', release_date: '2024-05-13', category: 'LLM' },
  { id: 'gpt-2', name: 'GPT-2', vendor: 'OpenAI', release_date: '2019-02-14', category: 'LLM' },
  { id: 'gpt-4', name: 'GPT-4', vendor: 'OpenAI', release_date: '2023-03-14', category: 'LLM' },
]

describe('buildTimelinePoints', () => {
  it('sorts points by release date, oldest first', () => {
    const points = buildTimelinePoints(TOOLS, '2026-01-01')
    expect(points.map((p) => p.tool.id)).toEqual(['gpt-2', 'gpt-4', 'gpt-4o'])
  })

  it('computes human-equivalent-years matching the base-model calc directly', () => {
    const points = buildTimelinePoints([TOOLS[1]], '2026-01-01')
    // gpt-2 shipped 2019-02-14; ~6.88yr elapsed * (72/4.5)/12 multiplier
    expect(points[0].humanEquivYears).toBeGreaterThan(0)
    expect(points[0].humanEquivYears).toBeCloseTo(110.09, 1)
  })

  it('gives a tool released on the as_of date zero elapsed human-equivalent years', () => {
    const points = buildTimelinePoints([TOOLS[0]], '2024-05-13')
    expect(points[0].humanEquivYears).toBe(0)
  })

  it('returns an empty array for an empty tool list', () => {
    expect(buildTimelinePoints([], '2026-01-01')).toEqual([])
  })
})
