import { t } from '../lib/i18n'

interface Props {
  mode: 'tool' | 'date'
  onChange: (mode: 'tool' | 'date') => void
}

export function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className="mode-tabs" role="tablist" aria-label={t.modeTabs.ariaLabel}>
      <button
        role="tab"
        aria-selected={mode === 'tool'}
        className={mode === 'tool' ? 'mode-tab active' : 'mode-tab'}
        onClick={() => onChange('tool')}
      >
        {t.modeTabs.pickTool}
      </button>
      <button
        role="tab"
        aria-selected={mode === 'date'}
        className={mode === 'date' ? 'mode-tab active' : 'mode-tab'}
        onClick={() => onChange('date')}
      >
        {t.modeTabs.enterDate}
      </button>
    </div>
  )
}
