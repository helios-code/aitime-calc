import { describe, expect, it } from 'vitest'
import { sortEntries } from './leaderboardSort'
import type { LeaderboardEntry } from '../types'

const entries: LeaderboardEntry[] = [
  { rank: 2, tool_id: 'b', name: 'Beta', human_equiv_years: 5, release_date: '2024-01-01' },
  { rank: 1, tool_id: 'a', name: 'Alpha', human_equiv_years: 10, release_date: '2023-01-01' },
  { rank: 3, tool_id: 'c', name: 'Gamma', human_equiv_years: 1, release_date: '2025-01-01' },
]

describe('sortEntries', () => {
  it('sorts by name ascending / descending', () => {
    expect(sortEntries(entries, 'name', 'asc').map((e) => e.tool_id)).toEqual(['a', 'b', 'c'])
    expect(sortEntries(entries, 'name', 'desc').map((e) => e.tool_id)).toEqual(['c', 'b', 'a'])
  })

  it('sorts by release_date ascending / descending', () => {
    expect(sortEntries(entries, 'release_date', 'asc').map((e) => e.tool_id)).toEqual(['a', 'b', 'c'])
    expect(sortEntries(entries, 'release_date', 'desc').map((e) => e.tool_id)).toEqual(['c', 'b', 'a'])
  })

  it('sorts by human_equiv_years ascending / descending', () => {
    expect(sortEntries(entries, 'human_equiv_years', 'asc').map((e) => e.tool_id)).toEqual(['c', 'b', 'a'])
    expect(sortEntries(entries, 'human_equiv_years', 'desc').map((e) => e.tool_id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by rank ascending / descending', () => {
    expect(sortEntries(entries, 'rank', 'asc').map((e) => e.tool_id)).toEqual(['a', 'b', 'c'])
    expect(sortEntries(entries, 'rank', 'desc').map((e) => e.tool_id)).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the input array', () => {
    const copy = [...entries]
    sortEntries(entries, 'name', 'asc')
    expect(entries).toEqual(copy)
  })
})
