import { describe, expect, it } from 'vitest'
import { computeCalc } from './atem'

describe('computeCalc accelerating model d_ai_months', () => {
  it('changes human_equiv_years when d_ai_months changes', () => {
    const base = computeCalc({
      release_date: '2020-01-01',
      as_of: '2025-01-01',
      model: 'accelerating',
      d_ai_months: 4.5,
    })
    const faster = computeCalc({
      release_date: '2020-01-01',
      as_of: '2025-01-01',
      model: 'accelerating',
      d_ai_months: 2,
    })
    expect(faster.human_equiv_years).toBeGreaterThan(base.human_equiv_years)
    expect(faster.params.d_ai_months).toBe(2)
    expect(base.params.d_ai_months).toBe(4.5)
  })
})
