import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import './Leaderboard.css'
import { fetchLeaderboard } from '../lib/leaderboardApi'
import { SORT_LABELS, sortEntries, type SortDir, type SortKey } from '../lib/leaderboardSort'
import { SourceBadge } from '../components/SourceBadge'
import type { LeaderboardEntry } from '../types'

const PAGE_TITLE = 'AI tool leaderboard — human-equivalent years compressed | aitime-calc'
const PAGE_DESCRIPTION =
  'Every AI tool ranked by how much human-equivalent time it compressed, from GPT-2 to the present.'

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

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard('base').then(({ entries, source }) => {
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

  return (
    <div className="app lb-page">
      <header className="app-header">
        <span className="brand">aitime-calc</span>
        <h1 className="tagline">AI tool leaderboard</h1>
        <p className="lb-subtitle">Every tool ranked by human-equivalent years compressed.</p>
      </header>

      <main className="app-main">
        <div className="lb-table-wrap">
          <table className="lb-table">
            <caption className="lb-caption">
              {`Sorted ${sortDir === 'asc' ? 'ascending' : 'descending'} by ${SORT_LABELS[sortKey]} (base model)`}
            </caption>
            <thead>
              <tr>
                <th scope="col" aria-sort={ariaSortFor('rank')}>
                  <SortButton label="Rank" active={sortKey === 'rank'} dir={sortDir} onClick={() => toggleSort('rank')} />
                </th>
                <th scope="col" aria-sort={ariaSortFor('name')}>
                  <SortButton label="Tool" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
                </th>
                <th scope="col" aria-sort={ariaSortFor('human_equiv_years')}>
                  <SortButton
                    label="Human-equiv years"
                    active={sortKey === 'human_equiv_years'}
                    dir={sortDir}
                    onClick={() => toggleSort('human_equiv_years')}
                  />
                </th>
                <th scope="col" aria-sort={ariaSortFor('release_date')}>
                  <SortButton
                    label="Release date"
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
                    Loading…
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
          <SourceBadge source={source} label="leaderboard" />
          <a className="lb-back-link" href="/">
            ← back to calculator
          </a>
        </footer>
      </main>
    </div>
  )
}
