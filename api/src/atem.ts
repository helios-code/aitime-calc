// AI-Time Equivalence Model (ATEM) — see relay memory 'atem-methodology'.

export type CalcModel = "base" | "accelerating";

export interface AtemParams {
  dClassicMonths: number; // default 72 (6yr classic tech-generation doubling)
  dAiMonths: number; // default 4.5 (AI capability doubling, months)
}

export const DEFAULT_PARAMS: AtemParams = {
  dClassicMonths: 72,
  dAiMonths: 4.5,
};

const MS_PER_DAY = 86_400_000;
const AVG_DAYS_PER_MONTH = 30.4368;

// Accelerating-model interpolation anchors: D_ai(t) goes 7mo @ 2019-01-01 -> 4mo @ asOf ("now").
const ACCEL_D0 = 7;
const ACCEL_D1 = 4;
const ACCEL_EPOCH_START = Date.UTC(2019, 0, 1);

export function elapsedDays(release: Date, asOf: Date): number {
  return (asOf.getTime() - release.getTime()) / MS_PER_DAY;
}

export function elapsedMonths(release: Date, asOf: Date): number {
  return elapsedDays(release, asOf) / AVG_DAYS_PER_MONTH;
}

export function monthsToHuman(months: number): string {
  const totalMonths = Math.round(months);
  const years = Math.floor(totalMonths / 12);
  const rem = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (rem > 0 || years === 0) parts.push(`${rem} mo`);
  return parts.join(" ");
}

export function yearsToHuman(years: number): string {
  const totalMonths = Math.round(years * 12);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const parts: string[] = [];
  parts.push(`${y} year${y === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} month${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

function dAiAt(t: number, asOfMs: number): number {
  const span = asOfMs - ACCEL_EPOCH_START;
  if (span <= 0) return ACCEL_D1;
  const frac = Math.min(1, Math.max(0, (t - ACCEL_EPOCH_START) / span));
  return ACCEL_D0 + (ACCEL_D1 - ACCEL_D0) * frac;
}

// Numeric integration (trapezoidal) of ai_doublings = ∫ dt(months) / D_ai(t) from release to asOf.
function acceleratingDoublings(release: Date, asOf: Date, steps = 400): number {
  const startMs = release.getTime();
  const endMs = asOf.getTime();
  if (endMs <= startMs) return 0;
  const stepMs = (endMs - startMs) / steps;
  let total = 0;
  for (let i = 0; i < steps; i++) {
    const tA = startMs + i * stepMs;
    const tB = startMs + (i + 1) * stepMs;
    const monthsStep = (tB - tA) / MS_PER_DAY / AVG_DAYS_PER_MONTH;
    const rateA = 1 / dAiAt(tA, endMs);
    const rateB = 1 / dAiAt(tB, endMs);
    total += (monthsStep * (rateA + rateB)) / 2;
  }
  return total;
}

export interface AtemResult {
  elapsedDays: number;
  elapsedMonths: number;
  model: CalcModel;
  params: AtemParams & { multiplier: number };
  aiDoublings: number;
  humanEquivYears: number;
}

export function computeAtem(
  release: Date,
  asOf: Date,
  model: CalcModel = "base",
  params: AtemParams = DEFAULT_PARAMS,
): AtemResult {
  const days = elapsedDays(release, asOf);
  const months = elapsedMonths(release, asOf);
  const multiplier = params.dClassicMonths / params.dAiMonths;

  let aiDoublings: number;
  let humanEquivYears: number;

  if (model === "accelerating") {
    aiDoublings = acceleratingDoublings(release, asOf);
    humanEquivYears = (aiDoublings * params.dClassicMonths) / 12;
  } else {
    aiDoublings = months / params.dAiMonths;
    humanEquivYears = (months * multiplier) / 12;
  }

  return {
    elapsedDays: days,
    elapsedMonths: months,
    model,
    params: { ...params, multiplier },
    aiDoublings,
    humanEquivYears,
  };
}
