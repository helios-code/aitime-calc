import type { CalcModel } from '../types'

interface Props {
  model: CalcModel
  onChange: (model: CalcModel) => void
}

export function ModelToggle({ model, onChange }: Props) {
  return (
    <div className="model-toggle" role="tablist" aria-label="Calculation model">
      <button
        role="tab"
        aria-selected={model === 'base'}
        className={model === 'base' ? 'model-btn active' : 'model-btn'}
        onClick={() => onChange('base')}
      >
        Base
      </button>
      <button
        role="tab"
        aria-selected={model === 'accelerating'}
        className={model === 'accelerating' ? 'model-btn active' : 'model-btn'}
        onClick={() => onChange('accelerating')}
      >
        Accelerating
      </button>
    </div>
  )
}
