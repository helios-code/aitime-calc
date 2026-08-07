import type { CalcModel } from '../types'
import { resolveToolId } from '../data/tools'

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

export const DEFAULT_D_AI_MONTHS = 4.5
export const DEFAULT_D_CLASSIC_MONTHS = 72
export const D_AI_MONTHS_MIN = 0.5
export const D_AI_MONTHS_MAX = 36
export const D_CLASSIC_MONTHS_MIN = 6
export const D_CLASSIC_MONTHS_MAX = 240

function parseBoundedNumber(raw: string | null, min: number, max: number): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < min || n > max) return null
  return n
}

export interface InitialState {
  tool: string | null
  date: string | null
  model: CalcModel
  mode: 'tool' | 'date'
  dAiMonths: number | null
  dClassicMonths: number | null
}

export function parseInitialState(search: string): InitialState {
  const params = new URLSearchParams(search)

  const rawTool = params.get('tool')
  const tool = rawTool && isPlausibleToolId(rawTool) ? resolveToolId(rawTool) : null

  const rawDate = params.get('date')
  const date = rawDate && isValidDateStr(rawDate) ? rawDate : null

  const model: CalcModel = params.get('model') === 'accelerating' ? 'accelerating' : 'base'
  const mode: 'tool' | 'date' = date && !tool ? 'date' : 'tool'

  const dAiMonths = parseBoundedNumber(params.get('d_ai_months'), D_AI_MONTHS_MIN, D_AI_MONTHS_MAX)
  const dClassicMonths = parseBoundedNumber(params.get('d_classic_months'), D_CLASSIC_MONTHS_MIN, D_CLASSIC_MONTHS_MAX)

  return { tool, date, model, mode, dAiMonths, dClassicMonths }
}
