import type { Tool } from '../types'

interface Props {
  tools: Tool[]
  selectedId: string
  onChange: (id: string) => void
}

export function ToolPicker({ tools, selectedId, onChange }: Props) {
  const selected = tools.find((t) => t.id === selectedId)

  return (
    <div className="tool-picker">
      <select
        className="tool-select"
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Known AI tool"
      >
        {tools.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {t.release_date}
          </option>
        ))}
      </select>
      {selected?.note && <p className="tool-note">{selected.note}</p>}
    </div>
  )
}
