import type { CalcModel, LeaderboardEntry } from '../types'

export interface LeaderboardExportMeta {
  /** Calc model the ranking was computed with. */
  model: CalcModel
  /** YYYY-MM-DD the ranking was computed "as of". */
  as_of: string
  /** Whether the underlying dataset came from the API or the bundled fallback. */
  source: 'live' | 'mock'
}

// `source` rides along in every row: an exported file outlives the page, and a
// CSV that doesn't say whether the numbers came from the live dataset or the
// bundled fallback is the same silent live/mock swap the SourceBadge exists to
// prevent.
const CSV_COLUMNS = [
  'rank',
  'tool_id',
  'name',
  'release_date',
  'human_equiv_years',
  'model',
  'as_of',
  'source',
] as const

// A cell starting with one of these is interpreted as a formula by Excel /
// Sheets. The dataset is ours, but it can arrive from the live API, so prefix
// the value rather than trust it.
const FORMULA_PREFIX = /^[=+\-@\t\r]/

export function escapeCsvField(value: string | number): string {
  const raw = String(value)
  const safe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** RFC 4180 CSV: CRLF line endings, header row, one row per entry. */
export function toCsv(entries: LeaderboardEntry[], meta: LeaderboardExportMeta): string {
  const rows = [CSV_COLUMNS.join(',')]
  for (const entry of entries) {
    rows.push(
      [
        entry.rank,
        entry.tool_id,
        entry.name,
        entry.release_date,
        entry.human_equiv_years.toFixed(2),
        meta.model,
        meta.as_of,
        meta.source,
      ]
        .map(escapeCsvField)
        .join(','),
    )
  }
  return `${rows.join('\r\n')}\r\n`
}

export function toJson(entries: LeaderboardEntry[], meta: LeaderboardExportMeta): string {
  return `${JSON.stringify(
    {
      generated_at: meta.as_of,
      model: meta.model,
      source: meta.source,
      count: entries.length,
      entries,
    },
    null,
    2,
  )}\n`
}

export function exportFilename(kind: 'csv' | 'json', date: string): string {
  return `aitime-leaderboard-${date}.${kind}`
}

/**
 * Client-side download of already-in-memory data — no network, no deps.
 * Returns false instead of throwing when the browser blocks the blob path.
 */
export function downloadTextFile(filename: string, contents: string, mimeType: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([contents], { type: mimeType }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Revoke after the click has been dispatched, otherwise Safari can cancel
    // the download mid-flight.
    setTimeout(() => URL.revokeObjectURL(url), 0)
    return true
  } catch {
    return false
  }
}
