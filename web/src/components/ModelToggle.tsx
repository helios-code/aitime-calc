import type { CalcModel } from '../types'
import { t } from '../lib/i18n'

interface Props {
  model: CalcModel
  onChange: (model: CalcModel) => void
}

export function ModelToggle({ model, onChange }: Props) {
  return (
    <div className="model-toggle" role="tablist" aria-label={t.modelToggle.ariaLabel}>
      <button
        role="tab"
        aria-selected={model === 'base'}
        className={model === 'base' ? 'model-btn active' : 'model-btn'}
        onClick={() => onChange('base')}
      >
        {t.modelToggle.base}
      </button>
      <button
        role="tab"
        aria-selected={model === 'accelerating'}
        className={model === 'accelerating' ? 'model-btn active' : 'model-btn'}
        onClick={() => onChange('accelerating')}
      >
        {t.modelToggle.accelerating}
      </button>
    </div>
  )
}
