import type { LeaderboardEntry } from '../types'

export type SortKey = 'rank' | 'name' | 'human_equiv_years' | 'release_date'
export type SortDir = 'asc' | 'desc'

export const SORT_LABELS: Record<SortKey, string> = {
  rank: 'rank',
  name: 'tool name',
  human_equiv_years: 'human-equivalent years',
  release_date: 'release date',
}

export function sortEntries(entries: LeaderboardEntry[], sortKey: SortKey, sortDir: SortDir): LeaderboardEntry[] {
  const dirMul = sortDir === 'asc' ? 1 : -1
  return [...entries].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name) * dirMul
    if (sortKey === 'release_date') return a.release_date.localeCompare(b.release_date) * dirMul
    return (a[sortKey] - b[sortKey]) * dirMul
  })
}
