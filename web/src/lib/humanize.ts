// Canonical, locale-aware duration humanizer — the ONE source of truth for
// "N years M months" style strings across the web app (task 1f2e786c / visual-QA
// F1/F2). Components format from numbers through here instead of rendering the
// English strings baked into a CalcResult, so FR pages never show mixed-language
// durations.
//
// DUPLICATION POINTER: api/src/server.ts (`yearsToHuman` + the `comparison_line`
// template) and the /api/og renderer produce the EN forms server-side for their
// own payloads. They intentionally mirror the EN output of this module. If the
// EN wording here changes, mirror it there (and vice-versa). Keep THIS module the
// canonical one — the API side is a mirror, not a second source of truth.
import type { Locale } from './i18n'
import type { CalcResult } from '../types'

// Calendar elapsed split (whole years + remaining months) between two UTC dates.
// Mirrors the calendar arithmetic the result "elapsed" line has always used.
export function elapsedYearsMonths(release: Date, asOf: Date): { years: number; months: number } {
  let months = (asOf.getUTCFullYear() - release.getUTCFullYear()) * 12 + (asOf.getUTCMonth() - release.getUTCMonth())
  if (asOf.getUTCDate() < release.getUTCDate()) months -= 1
  if (months < 0) months = 0
  return { years: Math.floor(months / 12), months: months % 12 }
}

// Split a fractional-years figure (e.g. 28.27) into whole years + rounded months,
// carrying a rounded-up 12 back into a year so "28 years 12 months" never renders.
export function splitYears(yearsFloat: number): { years: number; months: number } {
  const years = Math.floor(yearsFloat)
  const months = Math.round((yearsFloat - years) * 12)
  if (months === 12) return { years: years + 1, months: 0 }
  return { years, months }
}

// 'short' → abbreviated EN units (yr/mo) for the terse "elapsed" line.
// 'long'  → spelled EN units (years/months) for the human-equivalent figure.
// FR renders "ans"/"mois" for both styles (mois is invariant; an→ans at >1).
export type DurationStyle = 'short' | 'long'

export function humanizeDuration(
  years: number,
  months: number,
  locale: Locale,
  style: DurationStyle = 'short',
): string {
  if (locale === 'fr') {
    const parts: string[] = []
    if (years > 0) parts.push(`${years} ${years === 1 ? 'an' : 'ans'}`)
    if (months > 0 || years === 0) parts.push(`${months} mois`)
    return parts.join(' ')
  }

  // English. 'long' always shows both units (keeps the human-equivalent figure
  // reading as "X years Y months" even at Y=0); 'short' drops a zero part.
  if (style === 'long') {
    const y = years === 1 ? 'year' : 'years'
    const m = months === 1 ? 'month' : 'months'
    return `${years} ${y} ${months} ${m}`
  }
  const parts: string[] = []
  if (years > 0) parts.push(`${years} yr`)
  if (months > 0 || years === 0) parts.push(`${months} mo`)
  return parts.join(' ')
}

// Result-level convenience: the localized "elapsed since release" line, derived
// from a CalcResult's numeric dates (never its baked EN `elapsed.human`). Kept in
// lib/ so it's unit-tested and the components stay presentational.
export function resultElapsed(result: CalcResult, locale: Locale): string {
  const asOf = result.input.as_of ? new Date(`${result.input.as_of}T00:00:00Z`) : new Date()
  const { years, months } = elapsedYearsMonths(new Date(`${result.input.release_date}T00:00:00Z`), asOf)
  return humanizeDuration(years, months, locale, 'short')
}

// Result-level convenience: the localized human-equivalent figure ("28 years 3
// months" / "28 ans 3 mois"), from the numeric `human_equiv_years`.
export function resultEquiv(result: CalcResult, locale: Locale): string {
  const { years, months } = splitYears(result.human_equiv_years)
  return humanizeDuration(years, months, locale, 'long')
}
