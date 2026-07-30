interface Props {
  source: 'live' | 'mock'
  label: string
}

export function SourceBadge({ source, label }: Props) {
  return (
    <span className={`source-badge source-badge--${source}`} title={source === 'live' ? 'Served by the aitime-calc API' : 'API unreachable — showing local ATEM calculation'}>
      <span className="source-dot" />
      {label}: {source === 'live' ? 'live API' : 'offline calc'}
    </span>
  )
}
