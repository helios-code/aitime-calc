import type { CalcModel, CalcParams, CalcResult } from '../types'

const MS_PER_DAY = 86_400_000
const AVG_MONTH_DAYS = 30.436875
const ACCEL_ANCHOR_START = new Date('2019-01-01T00:00:00Z').getTime()
const ACCEL_D_AI_START = 7

const SOURCES = [
  'METR "Measuring AI Ability to Complete Long Tasks" (2025-03)',
  'AI Model Law (capability doubling ~3mo)',
  'Moore/classic tech-generation cadence',
]

function parseDate(s: string): Date {
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${s}`)
  return d
}

function humanElapsed(release: Date, asOf: Date): { years: number; months: number; label: string } {
  let months = (asOf.getUTCFullYear() - release.getUTCFullYear()) * 12 + (asOf.getUTCMonth() - release.getUTCMonth())
  if (asOf.getUTCDate() < release.getUTCDate()) months -= 1
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} yr`)
  if (remMonths > 0 || years === 0) parts.push(`${remMonths} mo`)
  return { years, months, label: parts.join(' ') || '0 mo' }
}

function acceleratingDoublings(releaseMs: number, asOfMs: number, dAiNow: number): number {
  const span = asOfMs - ACCEL_ANCHOR_START
  const dAiAt = (t: number) => {
    const frac = span <= 0 ? 1 : (t - ACCEL_ANCHOR_START) / span
    const clamped = Math.min(1, Math.max(0, frac))
    return ACCEL_D_AI_START - (ACCEL_D_AI_START - dAiNow) * clamped
  }
  const stepMs = MS_PER_DAY
  let doublings = 0
  for (let t = releaseMs; t < asOfMs; t += stepMs) {
    const dMonths = dAiAt(t)
    const dDays = dMonths * AVG_MONTH_DAYS
    doublings += 1 / dDays
  }
  return doublings
}

export function computeCalc(params: CalcParams): CalcResult {
  const releaseDate = parseDate(params.release_date)
  const asOf = params.as_of ? parseDate(params.as_of) : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  const model: CalcModel = params.model ?? 'base'
  const dClassic = params.d_classic_months ?? 72
  const dAi = params.d_ai_months ?? 4.5

  const days = Math.max(0, Math.round((asOf.getTime() - releaseDate.getTime()) / MS_PER_DAY))
  const monthsFloat = days / AVG_MONTH_DAYS
  const multiplier = dClassic / dAi
  const elapsed = humanElapsed(releaseDate, asOf)

  let aiDoublings: number
  let humanEquivYears: number

  if (model === 'accelerating') {
    aiDoublings = acceleratingDoublings(releaseDate.getTime(), asOf.getTime(), dAi)
    humanEquivYears = (aiDoublings * dClassic) / 12
  } else {
    aiDoublings = monthsFloat / dAi
    humanEquivYears = (monthsFloat * multiplier) / 12
  }

  const humanEquivWhole = Math.floor(humanEquivYears)
  const humanEquivMonths = Math.round((humanEquivYears - humanEquivWhole) * 12)
  const humanEquivHuman = `${humanEquivWhole} years ${humanEquivMonths} months`

  return {
    input: { release_date: params.release_date, as_of: asOf.toISOString().slice(0, 10), tool_id: params.tool_id },
    elapsed: { days, months: Number(monthsFloat.toFixed(2)), human: elapsed.label },
    model,
    params: { d_classic_months: dClassic, d_ai_months: dAi, multiplier: Number(multiplier.toFixed(2)) },
    ai_doublings: Number(aiDoublings.toFixed(2)),
    human_equiv_years: Number(humanEquivYears.toFixed(2)),
    human_equiv_human: humanEquivHuman,
    comparison_line: `≈ ${aiDoublings.toFixed(1)} classic software generations`,
    methodology_note:
      model === 'accelerating'
        ? 'Accelerating model: AI capability doubling time shrinks from ~7mo (2019) toward its current pace, so older releases compound more human-equivalent time per calendar month.'
        : 'Base model: constant doubling cadence. Elapsed calendar time is scaled by (classic tech-generation length ÷ AI doubling time) to get human-equivalent progress.',
    sources: SOURCES,
  }
}
