import {
  D_AI_MONTHS_MAX,
  D_AI_MONTHS_MIN,
  D_CLASSIC_MONTHS_MAX,
  D_CLASSIC_MONTHS_MIN,
  DEFAULT_D_AI_MONTHS,
  DEFAULT_D_CLASSIC_MONTHS,
} from '../lib/urlParams'

interface Props {
  dAiMonths: number
  dClassicMonths: number
  onChangeDAiMonths: (value: number) => void
  onChangeDClassicMonths: (value: number) => void
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function AdvancedParams({ dAiMonths, dClassicMonths, onChangeDAiMonths, onChangeDClassicMonths }: Props) {
  const isDefault = dAiMonths === DEFAULT_D_AI_MONTHS && dClassicMonths === DEFAULT_D_CLASSIC_MONTHS

  return (
    <details className="advanced-params">
      <summary>Advanced assumptions{!isDefault && <span className="advanced-badge">edited</span>}</summary>
      <div className="advanced-fields">
        <div className="advanced-field">
          <label htmlFor="d-ai-months">AI doubling time (months)</label>
          <input
            id="d-ai-months"
            type="number"
            step="0.1"
            min={D_AI_MONTHS_MIN}
            max={D_AI_MONTHS_MAX}
            value={dAiMonths}
            onChange={(e) => onChangeDAiMonths(clamp(e.target.valueAsNumber, D_AI_MONTHS_MIN, D_AI_MONTHS_MAX))}
          />
        </div>
        <div className="advanced-field">
          <label htmlFor="d-classic-months">Classic tech-generation length (months)</label>
          <input
            id="d-classic-months"
            type="number"
            step="1"
            min={D_CLASSIC_MONTHS_MIN}
            max={D_CLASSIC_MONTHS_MAX}
            value={dClassicMonths}
            onChange={(e) =>
              onChangeDClassicMonths(clamp(e.target.valueAsNumber, D_CLASSIC_MONTHS_MIN, D_CLASSIC_MONTHS_MAX))
            }
          />
        </div>
        {!isDefault && (
          <button
            type="button"
            className="advanced-reset"
            onClick={() => {
              onChangeDAiMonths(DEFAULT_D_AI_MONTHS)
              onChangeDClassicMonths(DEFAULT_D_CLASSIC_MONTHS)
            }}
          >
            Reset to defaults
          </button>
        )}
      </div>
    </details>
  )
}
