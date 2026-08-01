import type { CalcModel } from '../types'

export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

// Tool ids are shaped like 'gpt-4o' / 'claude-3.5-sonnet' — this is a syntax
// sanity check, NOT a membership check. Whether the id actually exists is the
// live dataset's call (App.tsx re-validates once fetchTools resolves) — the
// dataset grows over time and this module has no way to know its current size.
const TOOL_ID_RE = /^[a-z0-9][a-z0-9.-]*$/i

export function isPlausibleToolId(s: string): boolean {
  return TOOL_ID_RE.test(s)
}

export interface InitialState {
  tool: string | null
  date: string | null
  model: CalcModel
  mode: 'tool' | 'date'
}

export function parseInitialState(search: string): InitialState {
  const params = new URLSearchParams(search)

  const rawTool = params.get('tool')
  const tool = rawTool && isPlausibleToolId(rawTool) ? rawTool : null

  const rawDate = params.get('date')
  const date = rawDate && isValidDateStr(rawDate) ? rawDate : null

  const model: CalcModel = params.get('model') === 'accelerating' ? 'accelerating' : 'base'
  const mode: 'tool' | 'date' = date && !tool ? 'date' : 'tool'

  return { tool, date, model, mode }
}
