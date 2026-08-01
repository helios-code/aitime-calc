import { describe, expect, it } from 'vitest'
import { isPlausibleToolId, isValidDateStr, parseInitialState } from './urlParams'

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

  it('prefers tool mode when both tool and date are present', () => {
    const state = parseInitialState('?tool=gpt-4&date=2022-11-30')
    expect(state.mode).toBe('tool')
  })

  it('defaults model to base unless explicitly accelerating', () => {
    expect(parseInitialState('').model).toBe('base')
    expect(parseInitialState('?model=accelerating').model).toBe('accelerating')
    expect(parseInitialState('?model=bogus').model).toBe('base')
  })
})
