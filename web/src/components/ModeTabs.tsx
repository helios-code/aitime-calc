interface Props {
  mode: 'tool' | 'date'
  onChange: (mode: 'tool' | 'date') => void
}

export function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Input mode">
      <button
        role="tab"
        aria-selected={mode === 'tool'}
        className={mode === 'tool' ? 'mode-tab active' : 'mode-tab'}
        onClick={() => onChange('tool')}
      >
        Pick a known tool
      </button>
      <button
        role="tab"
        aria-selected={mode === 'date'}
        className={mode === 'date' ? 'mode-tab active' : 'mode-tab'}
        onClick={() => onChange('date')}
      >
        Enter a release date
      </button>
    </div>
  )
}
