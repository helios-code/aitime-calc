import { describe, expect, it } from 'vitest'
import { commitBoundedNumber } from './boundedNumber'

const MIN = 0.5
const MAX = 36
const CURRENT = 4.5

describe('commitBoundedNumber', () => {
  it('commits an in-range value as typed', () => {
    expect(commitBoundedNumber('3', MIN, MAX, CURRENT)).toBe(3)
    expect(commitBoundedNumber('0.5', MIN, MAX, CURRENT)).toBe(0.5)
    expect(commitBoundedNumber('36', MIN, MAX, CURRENT)).toBe(36)
  })

  it('clamps an out-of-range value to the nearest bound', () => {
    expect(commitBoundedNumber('0.001', MIN, MAX, CURRENT)).toBe(MIN)
    expect(commitBoundedNumber('999', MIN, MAX, CURRENT)).toBe(MAX)
    expect(commitBoundedNumber('-5', MIN, MAX, CURRENT)).toBe(MIN)
  })

  it('keeps the current value when the field is emptied or unparseable', () => {
    // Clamping these to min would commit 0.5 -- a 144x multiplier the user
    // never asked for, which then rides along in the share URL.
    for (const text of ['', '   ', 'abc', '-', '.', 'NaN', 'Infinity']) {
      expect(commitBoundedNumber(text, MIN, MAX, CURRENT)).toBe(CURRENT)
    }
  })

  it('parses a trailing-dot value the way a mid-edit buffer produces it', () => {
    expect(commitBoundedNumber('4.', MIN, MAX, CURRENT)).toBe(4)
  })
})
