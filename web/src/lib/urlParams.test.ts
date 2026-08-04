import { describe, expect, it } from 'vitest'
import { isPlausibleToolId, isValidDateStr, parseCompareState, parseInitialState } from './urlParams'

describe('isValidDateStr', () => {
  it('accepts a real calendar date', () => {
    expect(isValidDateStr('2023-03-14')).toBe(true)
  })

  it('rejects an out-of-range date', () => {
    expect(isValidDateStr('2022-13-45')).toBe(false)
  })

  it('rejects garbage', () => {
    expect(isValidDateStr('lol')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidDateStr('')).toBe(false)
  })

  it('rejects a date that rolls over (e.g. Feb 30)', () => {
    expect(isValidDateStr('2023-02-30')).toBe(false)
  })
})

describe('isPlausibleToolId', () => {
  it('accepts hyphenated ids', () => {
    expect(isPlausibleToolId('cursor-yolo')).toBe(true)
  })

  it('accepts ids with dots (version numbers)', () => {
    expect(isPlausibleToolId('claude-3.5-sonnet')).toBe(true)
    expect(isPlausibleToolId('gpt-4.5')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isPlausibleToolId('')).toBe(false)
  })

  it('rejects ids containing markup/whitespace', () => {
    expect(isPlausibleToolId('<script>')).toBe(false)
    expect(isPlausibleToolId('gpt 4')).toBe(false)
    expect(isPlausibleToolId('../etc/passwd')).toBe(false)
  })
})

describe('parseInitialState', () => {
  it('accepts any syntactically plausible ?tool= id, even one the module has never seen', () => {
    // this is the whole point: the live dataset can grow past whatever tools
    // this bundle shipped with, and a shared link for a brand-new tool must
    // still parse — App.tsx re-validates against the live dataset once it loads.
    const state = parseInitialState('?tool=gpt-6-not-yet-released')
    expect(state.tool).toBe('gpt-6-not-yet-released')
    expect(state.mode).toBe('tool')
  })

  it('rejects a syntactically invalid ?tool=', () => {
    const state = parseInitialState('?tool=%3Cscript%3E')
    expect(state.tool).toBeNull()
  })

  it('treats an empty ?tool= as absent', () => {
    expect(parseInitialState('?tool=').tool).toBeNull()
  })

  it('accepts a valid ?date= and switches mode to date when no tool is set', () => {
    const state = parseInitialState('?date=2022-11-30')
    expect(state.date).toBe('2022-11-30')
    expect(state.mode).toBe('date')
  })

  it('rejects an invalid ?date= instead of crashing downstream', () => {
    const state = parseInitialState('?date=foo')
    expect(state.date).toBeNull()
    expect(state.mode).toBe('tool')
  })

  it('treats an empty ?date= as absent, not a literal empty string', () => {
    const state = parseInitialState('?date=')
    expect(state.date).toBeNull()
  })

  it('resolves an old pre-reconciliation tool id to its canonical id', () => {
    // FALLBACK_TOOLS used to ship 'cursor-yolo'; the api canonical dataset
    // uses 'cursor-yolo-mode'. Old shared links must still resolve.
    const state = parseInitialState('?tool=cursor-yolo')
    expect(state.tool).toBe('cursor-yolo-mode')
  })

  it('leaves an id with no known alias untouched', () => {
    const state = parseInitialState('?tool=claude-sonnet-4-5')
    expect(state.tool).toBe('claude-sonnet-4-5')
  })

  it('prefers tool mode when both tool and date are present', () => {
    const state = parseInitialState('?tool=gpt-4&date=2022-11-30')
    expect(state.mode).toBe('tool')
  })

  it('defaults model to base unless explicitly accelerating', () => {
    expect(parseInitialState('').model).toBe('base')
    expect(parseInitialState('?model=accelerating').model).toBe('accelerating')
    expect(parseInitialState('?model=bogus').model).toBe('base')
  })

  it('parses valid ?d_ai_months and ?d_classic_months within range', () => {
    const state = parseInitialState('?d_ai_months=3&d_classic_months=60')
    expect(state.dAiMonths).toBe(3)
    expect(state.dClassicMonths).toBe(60)
  })

  it('treats absent d_ai_months/d_classic_months as null (caller applies default)', () => {
    const state = parseInitialState('')
    expect(state.dAiMonths).toBeNull()
    expect(state.dClassicMonths).toBeNull()
  })

  it('rejects out-of-range or non-numeric d_ai_months/d_classic_months instead of crashing downstream', () => {
    expect(parseInitialState('?d_ai_months=0').dAiMonths).toBeNull()
    expect(parseInitialState('?d_ai_months=100').dAiMonths).toBeNull()
    expect(parseInitialState('?d_ai_months=lol').dAiMonths).toBeNull()
    expect(parseInitialState('?d_classic_months=1').dClassicMonths).toBeNull()
    expect(parseInitialState('?d_classic_months=99999').dClassicMonths).toBeNull()
  })
})

describe('parseCompareState', () => {
  it('reads ?tool= as side a and ?vs= as side b', () => {
    const state = parseCompareState('?tool=gpt-4&vs=claude-3')
    expect(state.a).toBe('gpt-4')
    expect(state.b).toBe('claude-3')
  })

  it('treats a missing ?vs= as absent', () => {
    expect(parseCompareState('?tool=gpt-4').b).toBeNull()
  })

  it('rejects a syntactically invalid ?vs=', () => {
    expect(parseCompareState('?vs=%3Cscript%3E').b).toBeNull()
  })

  it('defaults model to base unless explicitly accelerating', () => {
    expect(parseCompareState('').model).toBe('base')
    expect(parseCompareState('?model=accelerating').model).toBe('accelerating')
  })

  it('resolves legacy aliases on both sides, like parseInitialState', () => {
    const state = parseCompareState('?tool=cursor-yolo&vs=gpt-3')
    expect(state.a).toBe('cursor-yolo-mode')
    expect(state.b).toBe('gpt-3-api')
    expect(state.a).toBe(parseInitialState('?tool=cursor-yolo').tool)
  })
})
