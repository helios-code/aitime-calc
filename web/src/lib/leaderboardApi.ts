import type { CalcModel, LeaderboardEntry } from '../types'
import { computeCalc } from './atem'
import { FALLBACK_TOOLS } from '../data/tools'

const TIMEOUT_MS = 2000

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export interface LeaderboardResult {
  entries: LeaderboardEntry[]
  source: 'live' | 'mock'
}

function mockLeaderboard(model: CalcModel): LeaderboardEntry[] {
  const asOf = new Date().toISOString().slice(0, 10)
  return FALLBACK_TOOLS.map((tool) => ({
    tool_id: tool.id,
    name: tool.name,
    release_date: tool.release_date,
    human_equiv_years: computeCalc({ release_date: tool.release_date, as_of: asOf, model }).human_equiv_years,
  }))
    .sort((a, b) => b.human_equiv_years - a.human_equiv_years)
    .map((entry, i) => ({ rank: i + 1, ...entry }))
}

export async function fetchLeaderboard(model: CalcModel = 'base'): Promise<LeaderboardResult> {
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard?model=${model}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data?.leaderboard) || data.leaderboard.length === 0) throw new Error('empty leaderboard payload')
    return { entries: data.leaderboard, source: 'live' }
  } catch {
    return { entries: mockLeaderboard(model), source: 'mock' }
  }
}
