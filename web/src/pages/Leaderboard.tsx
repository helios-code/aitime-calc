import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import './Leaderboard.css'
import { fetchLeaderboard } from '../lib/leaderboardApi'
import { sortEntries, type SortDir, type SortKey } from '../lib/leaderboardSort'
import { downloadTextFile, exportFilename, toCsv, toJson } from '../lib/export'
import { SourceBadge } from '../components/SourceBadge'
import { SiteNav } from '../components/SiteNav'
import { SiteFooter } from '../components/SiteFooter'
import { t } from '../lib/i18n'
import type { CalcModel, LeaderboardEntry } from '../types'

const PAGE_TITLE = t.leaderboard.pageTitle
const PAGE_DESCRIPTION = t.leaderboard.pageDescription
// Single source of truth: the model the table is ranked with is the model the
// export is stamped with.
const LEADERBOARD_MODEL: CalcModel = 'base'

function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevDescription = metaDesc?.getAttribute('content') ?? null
    metaDesc?.setAttribute('content', description)
    return () => {
      document.title = prevTitle
      if (prevDescription !== null) metaDesc?.setAttribute('content', prevDescription)
    }
  }, [title, description])
}

function SortButton({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button type="button" className="lb-sort-btn" onClick={onClick}>
      {label}
      <span className="lb-sort-arrow" aria-hidden="true">
        {active ? (dir === 'asc' ? '▲' : '▼') : ''}
      </span>
    </button>
  )
}

export default function Leaderboard() {
  useDocumentMeta(PAGE_TITLE, PAGE_DESCRIPTION)

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [source, setSource] = useState<'live' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  // Captured on mount, one render before fetchLeaderboard reads its own "today"
  // — so the export stamp matches the date the ranking was computed for.
  const [asOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard(LEADERBOARD_MODEL).then(({ entries, source }) => {
      if (cancelled) return
      setEntries(entries)
      setSource(source)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(() => sortEntries(entries, sortKey, sortDir), [entries, sortKey, sortDir])

  function ariaSortFor(key: SortKey): 'ascending' | 'descending' | undefined {
    if (key !== sortKey) return undefined
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'human_equiv_years' ? 'desc' : 'asc')
    }
  }

  function handleExport(kind: 'csv' | 'json') {
    const meta = { model: LEADERBOARD_MODEL, as_of: asOf, source }
    // Exports exactly what is on screen — same rows, same sort order.
    const contents = kind === 'csv' ? toCsv(sorted, meta) : toJson(sorted, meta)
    const mimeType = kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'
    const ok = downloadTextFile(exportFilename(kind, asOf), contents, mimeType)
    setExportError(ok ? null : t.leaderboard.exportBlocked)
  }

  const canExport = !loading && sorted.length > 0

  return (
    <>
      <SiteNav />
      <div className="app lb-page">
        <header className="app-header">
          <h1 className="tagline">{t.leaderboard.title}</h1>
          <p className="lb-subtitle">{t.leaderboard.subtitle}</p>
        </header>

        <main className="app-main">
          <div className="lb-toolbar">
            <span className="lb-toolbar-label" id="lb-export-label">
              {t.leaderboard.exportLabel}
            </span>
            <div className="lb-toolbar-actions" role="group" aria-labelledby="lb-export-label">
              <button
                type="button"
                className="share-btn share-btn--ghost lb-export-btn"
                onClick={() => handleExport('csv')}
                disabled={!canExport}
              >
                CSV
              </button>
              <button
                type="button"
                className="share-btn share-btn--ghost lb-export-btn"
                onClick={() => handleExport('json')}
                disabled={!canExport}
              >
                JSON
              </button>
            </div>
          </div>
          <p className="lb-export-status" role="status">
            {exportError}
          </p>

          <div className="lb-table-wrap">
            <table className="lb-table">
              <caption className="lb-caption">{t.leaderboard.caption(sortDir, t.leaderboard.sortLabels[sortKey])}</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={ariaSortFor('rank')}>
                    <SortButton label={t.leaderboard.colRank} active={sortKey === 'rank'} dir={sortDir} onClick={() => toggleSort('rank')} />
                  </th>
                  <th scope="col" aria-sort={ariaSortFor('name')}>
                    <SortButton label={t.leaderboard.colTool} active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
                  </th>
                  <th scope="col" aria-sort={ariaSortFor('human_equiv_years')}>
                    <SortButton
                      label={t.leaderboard.colYears}
                      active={sortKey === 'human_equiv_years'}
                      dir={sortDir}
                      onClick={() => toggleSort('human_equiv_years')}
                    />
                  </th>
                  <th scope="col" aria-sort={ariaSortFor('release_date')}>
                    <SortButton
                      label={t.leaderboard.colDate}
                      active={sortKey === 'release_date'}
                      dir={sortDir}
                      onClick={() => toggleSort('release_date')}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="lb-loading">
                      {t.leaderboard.loading}
                    </td>
                  </tr>
                )}
                {!loading &&
                  sorted.map((entry) => (
                    <tr key={entry.tool_id}>
                      <td className="lb-rank">{entry.rank}</td>
                      <td>
                        <a className="lb-tool-link" href={`/?tool=${encodeURIComponent(entry.tool_id)}`}>
                          {entry.name}
                        </a>
                      </td>
                      <td className="lb-years">{entry.human_equiv_years.toFixed(2)}</td>
                      <td className="lb-date">{entry.release_date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <footer className="app-footer">
            <SourceBadge source={source} label={t.leaderboard.sourceLabel} />
          </footer>
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
