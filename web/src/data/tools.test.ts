import { describe, expect, it } from 'vitest'
import { DEFAULT_TOOL_ID, FALLBACK_TOOLS, resolveToolId, TOOL_ID_ALIASES } from './tools'

describe('TOOL_ID_ALIASES', () => {
  const canonicalIds = new Set(FALLBACK_TOOLS.map((t) => t.id))

  it('every alias target is a real FALLBACK_TOOLS id', () => {
    for (const [oldId, canonicalId] of Object.entries(TOOL_ID_ALIASES)) {
      expect(canonicalIds.has(canonicalId), `alias "${oldId}" -> "${canonicalId}" is not a known id`).toBe(true)
    }
  })

  it('no alias key shadows a real canonical id', () => {
    for (const oldId of Object.keys(TOOL_ID_ALIASES)) {
      expect(canonicalIds.has(oldId), `"${oldId}" is both an alias key and a live canonical id`).toBe(false)
    }
  })
})

describe('resolveToolId', () => {
  it('maps a known old id to its canonical id', () => {
    expect(resolveToolId('claude-4.5-sonnet')).toBe('claude-sonnet-4-5')
  })

  it('passes through an id with no alias unchanged', () => {
    expect(resolveToolId('gpt-4o')).toBe('gpt-4o')
  })
})

it('DEFAULT_TOOL_ID is a real FALLBACK_TOOLS id', () => {
  expect(FALLBACK_TOOLS.some((t) => t.id === DEFAULT_TOOL_ID)).toBe(true)
})
