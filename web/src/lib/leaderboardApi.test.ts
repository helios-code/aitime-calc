import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLeaderboard } from './leaderboardApi'
import { FALLBACK_TOOLS } from '../data/tools'

describe('fetchLeaderboard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('ranks the live /api/tools dataset when the request succeeds', async () => {
    const tools = [
      { id: 'gpt-5', name: 'GPT-5', vendor: 'OpenAI', release_date: '2025-08-07', category: 'LLM' },
      { id: 'gpt-2', name: 'GPT-2', vendor: 'OpenAI', release_date: '2019-02-14', category: 'LLM' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tools }) }))

    const { entries, source } = await fetchLeaderboard('base')
    expect(source).toBe('live')
    expect(entries).toHaveLength(2)
    expect(entries.map((e) => e.rank)).toEqual([1, 2])
    // older release -> more elapsed time -> more human-equiv years -> ranked first
    expect(entries[0].tool_id).toBe('gpt-2')
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

  it('falls back when the API returns an empty tools payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tools: [] }) }))

    const { source } = await fetchLeaderboard('base')
    expect(source).toBe('mock')
  })

  it('skips a malformed live entry instead of crashing the whole page', async () => {
    const tools = [
      { id: 'gpt-5', name: 'GPT-5', vendor: 'OpenAI', release_date: '2025-08-07', category: 'LLM' },
      { id: 'bad-tool', name: 'Bad Tool', vendor: 'X', release_date: 'not-a-date', category: 'LLM' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tools }) }))

    const { entries, source } = await fetchLeaderboard('base')
    expect(source).toBe('live')
    expect(entries).toHaveLength(1)
    expect(entries[0].tool_id).toBe('gpt-5')
  })
})
