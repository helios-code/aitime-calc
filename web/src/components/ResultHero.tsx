import { useCountUp } from '../hooks/useCountUp'
import type { CalcResult } from '../types'

interface Props {
  result: CalcResult
  toolName?: string
}

const MAX_DOUBLING_CHIPS = 20

export function ResultHero({ result, toolName }: Props) {
  const years = useCountUp(result.human_equiv_years)
  const doublings = useCountUp(result.ai_doublings, 1200)

  const elapsedYears = result.elapsed.months / 12
  const humanYears = result.human_equiv_years
  const elapsedPct = Math.max(2, Math.min(100, (elapsedYears / humanYears) * 100))

  const wholeDoublings = Math.floor(result.ai_doublings)
  const chipCount = Math.min(wholeDoublings, MAX_DOUBLING_CHIPS)
  const overflow = wholeDoublings - chipCount

  return (
    <div className="result-hero">
      <p className="result-eyebrow">
        {toolName ? <>Since <strong>{toolName}</strong> shipped</> : <>Since {result.input.release_date}</>} — {result.elapsed.human} ago
      </p>

      <h1 className="result-figure">
        <span className="result-number">{years.toFixed(1)}</span>
        <span className="result-unit">human-equivalent years</span>
      </h1>

      <p className="result-comparison">{result.comparison_line}</p>

      <div className="contrast-bars" aria-label="Calendar time vs human-equivalent time">
        <div className="contrast-row">
          <span className="contrast-label">Calendar time</span>
          <div className="contrast-track">
            <div className="contrast-fill contrast-fill--calendar" style={{ width: `${elapsedPct}%` }} />
          </div>
          <span className="contrast-value">{result.elapsed.human}</span>
        </div>
        <div className="contrast-row">
          <span className="contrast-label">Human-equivalent</span>
          <div className="contrast-track">
            <div className="contrast-fill contrast-fill--human" style={{ width: '100%' }} />
          </div>
          <span className="contrast-value">{result.human_equiv_human}</span>
        </div>
      </div>

      <div className="doublings-block">
        <p className="doublings-label">
          <span className="doublings-count">{doublings.toFixed(1)}</span> AI capability doublings compressed into that window
        </p>
        <div className="doublings-chips" aria-hidden="true">
          {Array.from({ length: chipCount }).map((_, i) => (
            <span key={i} className="doubling-chip" style={{ animationDelay: `${i * 30}ms` }}>
              2×
            </span>
          ))}
          {overflow > 0 && <span className="doubling-chip doubling-chip--overflow">+{overflow}</span>}
        </div>
      </div>
    </div>
  )
}
