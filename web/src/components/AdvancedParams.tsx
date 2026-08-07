import { useEffect, useState } from 'react'
import { commitBoundedNumber } from '../lib/boundedNumber'
import { t } from '../lib/i18n'
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

// A plain controlled `<input type="number">` re-snaps its displayed value on
// every keystroke, which fights the user mid-edit (typing "4." reads as NaN,
// clamps to min, and erases what they just typed). This keeps its own text
// buffer and only resolves it on blur (commitBoundedNumber: clamp what parses,
// keep the current value for what doesn't), syncing back from the prop only
// when it changes from outside (e.g. Reset).
function BoundedNumberInput({
  id,
  step,
  min,
  max,
  value,
  onCommit,
}: {
  id: string
  step: string
  min: number
  max: number
  value: number
  onCommit: (value: number) => void
}) {
  const [text, setText] = useState(String(value))

  // Deliberately depends on `value` only: re-syncing on `text` too would
  // clobber the buffer on every keystroke, reintroducing the bug this fixes.
  useEffect(() => {
    if (Number(text) !== value) setText(String(value))
  }, [value])

  return (
    <input
      id={id}
      type="number"
      step={step}
      min={min}
      max={max}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const committed = commitBoundedNumber(text, min, max, value)
        setText(String(committed))
        onCommit(committed)
      }}
    />
  )
}

export function AdvancedParams({ dAiMonths, dClassicMonths, onChangeDAiMonths, onChangeDClassicMonths }: Props) {
  const isDefault = dAiMonths === DEFAULT_D_AI_MONTHS && dClassicMonths === DEFAULT_D_CLASSIC_MONTHS

  return (
    <details className="advanced-params">
      <summary>
        {t.advanced.summary}
        {!isDefault && <span className="advanced-badge">{t.advanced.edited}</span>}
      </summary>
      <div className="advanced-fields">
        <div className="advanced-field">
          <label htmlFor="d-ai-months">{t.advanced.aiLabel}</label>
          <BoundedNumberInput
            id="d-ai-months"
            step="0.1"
            min={D_AI_MONTHS_MIN}
            max={D_AI_MONTHS_MAX}
            value={dAiMonths}
            onCommit={onChangeDAiMonths}
          />
        </div>
        <div className="advanced-field">
          <label htmlFor="d-classic-months">{t.advanced.classicLabel}</label>
          <BoundedNumberInput
            id="d-classic-months"
            step="1"
            min={D_CLASSIC_MONTHS_MIN}
            max={D_CLASSIC_MONTHS_MAX}
            value={dClassicMonths}
            onCommit={onChangeDClassicMonths}
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
            {t.advanced.reset}
          </button>
        )}
      </div>
    </details>
  )
}
