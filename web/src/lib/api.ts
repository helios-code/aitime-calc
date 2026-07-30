import type { CalcParams, CalcResult, Tool } from '../types'
import { computeCalc } from './atem'
import { FALLBACK_TOOLS } from '../data/tools'

const TIMEOUT_MS = 2000

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await promise
  } finally {
    clearTimeout(timer)
  }
}

export interface ToolsResult {
  tools: Tool[]
  source: 'live' | 'mock'
}

export async function fetchTools(): Promise<ToolsResult> {
  try {
    const res = await withTimeout(fetch('/api/tools', { signal: AbortSignal.timeout(TIMEOUT_MS) }))
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data?.tools) || data.tools.length === 0) throw new Error('empty tools payload')
    return { tools: data.tools, source: 'live' }
  } catch {
    return { tools: FALLBACK_TOOLS, source: 'mock' }
  }
}

export interface CalcResultWithSource {
  result: CalcResult
  source: 'live' | 'mock'
}

export async function fetchCalc(params: CalcParams): Promise<CalcResultWithSource> {
  try {
    const query = new URLSearchParams()
    query.set('release', params.release_date)
    if (params.as_of) query.set('as_of', params.as_of)
    if (params.tool_id) query.set('tool_id', params.tool_id)
    if (params.model) query.set('model', params.model)
    if (params.d_classic_months) query.set('d_classic_months', String(params.d_classic_months))
    if (params.d_ai_months) query.set('d_ai_months', String(params.d_ai_months))

    const res = await withTimeout(fetch(`/api/calc?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) }))
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    if (typeof data?.human_equiv_years !== 'number') throw new Error('malformed calc payload')
    return { result: data, source: 'live' }
  } catch {
    return { result: computeCalc(params), source: 'mock' }
  }
}
