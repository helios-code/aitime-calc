import { describe, expect, it } from 'vitest'
import {
  decodeCompare,
  decodeTimeline,
  encodeCompare,
  encodeTimeline,
} from './urlState'

describe('compare url state', () => {
  it('round-trips selected tools through encode/decode', () => {
    const search = encodeCompare({ a: 'gpt-4o', b: 'claude-opus-4', model: 'base' })
    const decoded = decodeCompare(search)
    expect(decoded.a).toBe('gpt-4o')
    expect(decoded.b).toBe('claude-opus-4')
    expect(decoded.model).toBe('base')
    expect(decoded.asOf).toBeNull()
  })

  it('encodes model only when accelerating (base is the default, kept out of the URL)', () => {
    expect(encodeCompare({ a: 'gpt-4o', b: 'gpt-4', model: 'base' })).toBe('?tool=gpt-4o&vs=gpt-4')
    expect(encodeCompare({ a: 'gpt-4o', b: 'gpt-4', model: 'accelerating' })).toBe(
      '?tool=gpt-4o&vs=gpt-4&model=accelerating',
    )
  })

  it('encodes + round-trips as_of only when set', () => {
    expect(encodeCompare({ a: 'gpt-4o', b: 'gpt-4', model: 'base', asOf: null })).not.toContain('as_of')
    const search = encodeCompare({ a: 'gpt-4o', b: 'gpt-4', model: 'base', asOf: '2026-01-01' })
    expect(decodeCompare(search).asOf).toBe('2026-01-01')
  })

  it('resolves aliased tool ids the same as the single-tool contract', () => {
    // 'claude-4.5-sonnet' is an alias for the canonical 'claude-sonnet-4-5'.
    expect(decodeCompare('?tool=claude-4.5-sonnet&vs=gpt-4o').a).toBe('claude-sonnet-4-5')
  })

  it('degrades unknown/invalid params to defaults, never throws', () => {
    const decoded = decodeCompare('?tool=&vs=%20%20&model=bogus&as_of=not-a-date')
    expect(decoded.a).toBeNull()
    expect(decoded.b).toBeNull()
    expect(decoded.model).toBe('base')
    expect(decoded.asOf).toBeNull()
  })

  it('reads an empty search as all-defaults', () => {
    expect(decodeCompare('')).toEqual({ a: null, b: null, model: 'base', asOf: null })
  })
})

describe('timeline url state', () => {
  it('round-trips the model param', () => {
    expect(decodeTimeline(encodeTimeline({ model: 'accelerating' })).model).toBe('accelerating')
    expect(decodeTimeline(encodeTimeline({ model: 'base' })).model).toBe('base')
  })

  it('keeps base out of the URL and degrades a bogus model to base', () => {
    expect(encodeTimeline({ model: 'base' })).toBe('')
    expect(decodeTimeline('?model=nope').model).toBe('base')
  })
})
