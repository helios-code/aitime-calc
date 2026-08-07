import { t } from '../lib/i18n'

interface Props {
  value: string
  onChange: (value: string) => void
}

const MIN_DATE = '2010-01-01'

export function DatePicker({ value, onChange }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="date-picker">
      <label htmlFor="release-date">{t.datePicker.label}</label>
      <input
        id="release-date"
        type="date"
        min={MIN_DATE}
        max={today}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
