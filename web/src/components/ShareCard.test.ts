import { describe, expect, it } from 'vitest'
import { buildShareText } from './ShareCard'
import { computeCalc } from '../lib/atem'

// Deterministic result: fixed release + as_of so the elapsed duration is stable.
const result = computeCalc({ release_date: '2019-02-14', as_of: '2020-11-14', tool_id: 'gpt-2' })

describe('buildShareText', () => {
  it('EN carries English phrasing', () => {
    const text = buildShareText(result, 'GPT-2', 'en')
    expect(text).toContain('human-equivalent years')
    expect(text).toContain('classic software generations')
  })

  it('FR is fully French — no English fragments (F1/F2 in share text)', () => {
    const text = buildShareText(result, 'GPT-2', 'fr')
    expect(text).toContain('années de temps humain équivalent')
    expect(text).toContain('générations de logiciels classiques')
    // elapsed localized: 1 an 9 mois, not "1 yr 9 mo"
    expect(text).toContain('mois')
    expect(text).not.toMatch(/classic software|human-equivalent years/)
    expect(text).not.toMatch(/\b(yr|yrs|mo|year|years|month|months)\b/)
  })
})
