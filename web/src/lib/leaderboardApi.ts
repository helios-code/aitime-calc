import type { CalcModel, LeaderboardEntry, Tool } from '../types'
import { computeCalc } from './atem'
import { fetchTools } from './api'

export interface LeaderboardResult {
  entries: LeaderboardEntry[]
  source: 'live' | 'mock'
}

function isValidTool(t: unknown): t is Tool {
  const tool = t as Partial<Tool> | null | undefined
  return (
    !!tool &&
    typeof tool === 'object' &&
    typeof tool.id === 'string' &&
    typeof tool.name === 'string' &&
    typeof tool.release_date === 'string'
  )
}

// The web client ranks client-side on purpose: it fetches the tool dataset via
// fetchTools() (live /api/tools, falling back to FALLBACK_TOOLS) and applies the
// same computeCalc math the rest of the app uses, so the 'live' badge stays
// honest — it reflects whether the dataset itself came from the API.
// api/src/server.ts DOES now expose a batch-ranking GET /api/leaderboard (see
// docs/API.md), but it is for API consumers; switching this page over to it is a
// separate change, since it would move the ranking math server-side and give the
// badge a different meaning.
export async function fetchLeaderboard(model: CalcModel = 'base'): Promise<LeaderboardResult> {
  const { tools, source } = await fetchTools()
  const asOf = new Date().toISOString().slice(0, 10)

  const entries: LeaderboardEntry[] = tools
    .filter(isValidTool)
    .flatMap((tool) => {
      try {
        return [
          {
            tool_id: tool.id,
            name: tool.name,
            release_date: tool.release_date,
            human_equiv_years: computeCalc({ release_date: tool.release_date, as_of: asOf, model }).human_equiv_years,
          },
        ]
      } catch {
        // Malformed entry (e.g. unparsable release_date) — skip it rather than
        // crash the whole page to a white screen.
        return []
      }
    })
    .sort((a, b) => b.human_equiv_years - a.human_equiv_years)
    .map((entry, i) => ({ rank: i + 1, ...entry }))

  return { entries, source }
}
