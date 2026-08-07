import { useEffect, useState } from 'react'
import { fetchHealth } from '../lib/api'
import { t } from '../lib/i18n'
import './SiteFooter.css'

// Shared page footer for every SiteNav surface. Self-fetches the running API
// version from /api/health; renders an em-dash if the API is unreachable so the
// footer never crashes or blocks on a live backend.
export function SiteFooter() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHealth().then((v) => {
      if (!cancelled) setVersion(v)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="site-footer">
      <span className="site-footer-brand">aitime-calc</span>
      <span
        className="site-footer-version"
        title={version ? t.footer.versionKnownTitle : t.footer.versionUnknownTitle}
      >
        API {version ?? '—'}
      </span>
    </footer>
  )
}
