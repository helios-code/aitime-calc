import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLeaderboard } from './leaderboardApi'
import { FALLBACK_TOOLS } from '../data/tools'

describe('fetchLeaderboard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns the live payload ranked by the API when the request succeeds', async () => {
    const leaderboard = [
      { rank: 1, tool_id: 'gpt-5', name: 'GPT-5', human_equiv_years: 12.3, release_date: '2025-08-07' },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ leaderboard }) }),
    )

    const { entries, source } = await fetchLeaderboard('base')
    expect(source).toBe('live')
    expect(entries).toEqual(leaderboard)
  })

  it('falls back to a locally computed, fully-ranked leaderboard when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const { entries, source } = await fetchLeaderboard('base')
    expect(source).toBe('mock')
    expect(entries).toHaveLength(FALLBACK_TOOLS.length)
    expect(entries.map((e) => e.rank)).toEqual(Array.from({ length: entries.length }, (_, i) => i + 1))
    // descending by human_equiv_years
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].human_equiv_years).toBeGreaterThanOrEqual(entries[i].human_equiv_years)
    }
  })

  it('falls back when the API returns a malformed payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ leaderboard: [] }) }),
    )

    const { source } = await fetchLeaderboard('base')
    expect(source).toBe('mock')
  })
})
