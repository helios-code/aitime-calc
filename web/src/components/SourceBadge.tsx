import { t } from '../lib/i18n'

interface Props {
  source: 'live' | 'mock'
  label: string
}

export function SourceBadge({ source, label }: Props) {
  return (
    <span
      className={`source-badge source-badge--${source}`}
      title={source === 'live' ? t.source.liveTitle : t.source.mockTitle}
    >
      <span className="source-dot" />
      {label}: {source === 'live' ? t.source.live : t.source.offline}
    </span>
  )
}
