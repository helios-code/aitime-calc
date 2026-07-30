export interface Tool {
  id: string
  name: string
  vendor: string
  release_date: string // YYYY-MM-DD
  category: string
  note?: string
  sources?: string[]
}

export type CalcModel = 'base' | 'accelerating'

export interface CalcParams {
  release_date: string
  as_of?: string
  tool_id?: string
  model?: CalcModel
  d_classic_months?: number
  d_ai_months?: number
}

export interface CalcResult {
  input: { release_date: string; as_of: string; tool_id?: string }
  elapsed: { days: number; months: number; human: string }
  model: CalcModel
  params: { d_classic_months: number; d_ai_months: number; multiplier: number }
  ai_doublings: number
  human_equiv_years: number
  human_equiv_human: string
  comparison_line: string
  methodology_note: string
  sources: string[]
}
