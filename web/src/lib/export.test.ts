import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadTextFile, escapeCsvField, exportFilename, toCsv, toJson } from './export'
import type { LeaderboardEntry } from '../types'

const ENTRIES: LeaderboardEntry[] = [
  { rank: 1, tool_id: 'gpt-2', name: 'GPT-2', release_date: '2019-02-14', human_equiv_years: 12.345 },
  { rank: 2, tool_id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', release_date: '2025-09-29', human_equiv_years: 1.5 },
]

const META = { model: 'base', as_of: '2026-08-03', source: 'live' } as const

describe('escapeCsvField', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvField('GPT-2')).toBe('GPT-2')
    expect(escapeCsvField(42)).toBe('42')
  })

  it('quotes and doubles embedded quotes, commas and newlines', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"')
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"')
  })

  it('neutralises spreadsheet formula injection', () => {
    expect(escapeCsvField('=1+1')).toBe("'=1+1")
    expect(escapeCsvField('@SUM(A1)')).toBe("'@SUM(A1)")
  })
})

describe('toCsv', () => {
  it('emits a header row plus one CRLF-terminated row per entry', () => {
    const lines = toCsv(ENTRIES, META).split('\r\n')
    expect(lines[0]).toBe('rank,tool_id,name,release_date,human_equiv_years,model,as_of,source')
    expect(lines[1]).toBe('1,gpt-2,GPT-2,2019-02-14,12.35,base,2026-08-03,live')
    expect(lines[2]).toBe('2,claude-sonnet-4-5,Claude Sonnet 4.5,2025-09-29,1.50,base,2026-08-03,live')
    expect(lines[3]).toBe('')
  })

  it('emits header only for an empty leaderboard', () => {
    expect(toCsv([], META)).toBe('rank,tool_id,name,release_date,human_equiv_years,model,as_of,source\r\n')
  })

  it('carries the mock source through so an offline export is not mistaken for live data', () => {
    const csv = toCsv(ENTRIES, { ...META, source: 'mock' })
    expect(csv.split('\r\n')[1].endsWith(',mock')).toBe(true)
  })
})

describe('toJson', () => {
  it('wraps the entries with the calc metadata', () => {
    const parsed = JSON.parse(toJson(ENTRIES, META))
    expect(parsed).toEqual({
      generated_at: '2026-08-03',
      model: 'base',
      source: 'live',
      count: 2,
      entries: ENTRIES,
    })
  })

  it('preserves the order it was given (i.e. the on-screen sort)', () => {
    const reversed = [...ENTRIES].reverse()
    const parsed = JSON.parse(toJson(reversed, META))
    expect(parsed.entries.map((e: LeaderboardEntry) => e.tool_id)).toEqual(['claude-sonnet-4-5', 'gpt-2'])
  })
})

describe('exportFilename', () => {
  it('is date-stamped per kind', () => {
    expect(exportFilename('csv', '2026-08-03')).toBe('aitime-leaderboard-2026-08-03.csv')
    expect(exportFilename('json', '2026-08-03')).toBe('aitime-leaderboard-2026-08-03.json')
  })
})

describe('downloadTextFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a blob URL, clicks a download link, then revokes and cleans up', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn().mockReturnValue('blob:mock')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(downloadTextFile('x.csv', 'a,b', 'text/csv')).toBe(true)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).toBeNull()

    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns false instead of throwing when the blob path is unavailable', () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: () => {
        throw new Error('blocked')
      },
    })

    expect(downloadTextFile('x.csv', 'a,b', 'text/csv')).toBe(false)
    vi.unstubAllGlobals()
  })
})
