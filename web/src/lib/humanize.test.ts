import { describe, expect, it } from 'vitest'
import { elapsedYearsMonths, humanizeDuration, splitYears } from './humanize'

describe('humanizeDuration — EN', () => {
  it('short style uses abbreviated units and drops a zero month once years>0', () => {
    expect(humanizeDuration(7, 6, 'en', 'short')).toBe('7 yr 6 mo')
    expect(humanizeDuration(1, 9, 'en', 'short')).toBe('1 yr 9 mo')
    expect(humanizeDuration(2, 0, 'en', 'short')).toBe('2 yr')
    expect(humanizeDuration(0, 0, 'en', 'short')).toBe('0 mo')
  })

  it('long style always spells both units (and pluralizes)', () => {
    expect(humanizeDuration(28, 3, 'en', 'long')).toBe('28 years 3 months')
    expect(humanizeDuration(1, 1, 'en', 'long')).toBe('1 year 1 month')
    expect(humanizeDuration(28, 0, 'en', 'long')).toBe('28 years 0 months')
  })
})

describe('humanizeDuration — FR', () => {
  it('renders ans/mois; an is singular at 1; mois is invariant; style-agnostic', () => {
    expect(humanizeDuration(1, 9, 'fr', 'short')).toBe('1 an 9 mois')
    expect(humanizeDuration(28, 3, 'fr', 'long')).toBe('28 ans 3 mois')
    expect(humanizeDuration(7, 6, 'fr', 'short')).toBe('7 ans 6 mois')
    expect(humanizeDuration(2, 0, 'fr', 'short')).toBe('2 ans')
    expect(humanizeDuration(0, 1, 'fr', 'short')).toBe('1 mois')
    expect(humanizeDuration(0, 0, 'fr', 'short')).toBe('0 mois')
  })

  it('carries no English unit tokens', () => {
    const out = humanizeDuration(3, 4, 'fr', 'long')
    expect(out).not.toMatch(/\b(yr|mo|year|month)s?\b/)
  })
})

describe('splitYears', () => {
  it('splits fractional years into whole years + rounded months', () => {
    expect(splitYears(28.27)).toEqual({ years: 28, months: 3 })
    expect(splitYears(4.0)).toEqual({ years: 4, months: 0 })
  })

  it('carries a rounded-up 12 back into a year', () => {
    expect(splitYears(27.99)).toEqual({ years: 28, months: 0 })
  })
})

describe('elapsedYearsMonths', () => {
  it('computes calendar years+months between UTC dates, floored at zero', () => {
    const rel = new Date('2019-02-14T00:00:00Z')
    expect(elapsedYearsMonths(rel, new Date('2020-11-14T00:00:00Z'))).toEqual({ years: 1, months: 9 })
    // day-of-month not yet reached rolls the partial month back
    expect(elapsedYearsMonths(rel, new Date('2019-03-10T00:00:00Z'))).toEqual({ years: 0, months: 0 })
    // asOf before release clamps to zero
    expect(elapsedYearsMonths(rel, new Date('2018-01-01T00:00:00Z'))).toEqual({ years: 0, months: 0 })
  })
})
