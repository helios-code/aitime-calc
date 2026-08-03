import type { CalcResult } from '../types'

export function buildShareText(result: CalcResult, toolName?: string): string {
  const subject = toolName ?? result.input.release_date
  return `${subject} = ~${result.human_equiv_years.toFixed(1)} human-equivalent years compressed into ${result.elapsed.human}. ${result.comparison_line}`
}
