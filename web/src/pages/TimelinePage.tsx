import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import './TimelinePage.css'
import { fetchTools } from '../lib/api'
import { buildTimelinePoints } from '../lib/timelineData'
import { FALLBACK_TOOLS } from '../data/tools'
import { SourceBadge } from '../components/SourceBadge'
import { SiteNav } from '../components/SiteNav'
import type { Tool } from '../types'

const TODAY = new Date().toISOString().slice(0, 10)
const WIDTH = 960
const HEIGHT = 440
const MARGIN = { top: 24, right: 24, bottom: 48, left: 60 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom

export function TimelinePage() {
  const [tools, setTools] = useState<Tool[]>(FALLBACK_TOOLS)
  const [source, setSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    let cancelled = false
    fetchTools().then(({ tools, source }) => {
      if (cancelled) return
      setTools(tools)
      setSource(source)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const points = useMemo(() => buildTimelinePoints(tools, TODAY), [tools])

  const minMs = points[0]?.releaseMs ?? 0
  const maxMs = points[points.length - 1]?.releaseMs ?? 1
  const maxYears = points.reduce((max, p) => Math.max(max, p.humanEquivYears), 1)
  const logMax = Math.log10(maxYears + 1)

  const scaleX = (ms: number) => (maxMs === minMs ? 0 : ((ms - minMs) / (maxMs - minMs)) * PLOT_W)
  const scaleY = (years: number) => (logMax === 0 ? PLOT_H : PLOT_H - (Math.log10(years + 1) / logMax) * PLOT_H)

  const yTicks = useMemo(() => {
    const raw = [0, maxYears * 0.1, maxYears * 0.5, maxYears]
    const rounded = raw.map((v) => Math.round(v))
    return Array.from(new Set(rounded)).sort((a, b) => a - b)
  }, [maxYears])

  const xTicks = useMemo(() => {
    const years = new Set(points.map((p) => new Date(p.releaseMs).getUTCFullYear()))
    return Array.from(years).map((year) => ({ year, ms: Date.UTC(year, 0, 1) }))
  }, [points])

  return (
    <>
      <SiteNav />
      <div className="app timeline-page">
        <header className="app-header">
          <h1 className="tagline">Every tool in the dataset, on one human-equivalent-time axis</h1>
        </header>

        <main className="app-main">
          <div className="timeline-chart-wrap">
            <svg
              className="timeline-chart"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="group"
              aria-label="Human-equivalent years compressed since each tool's release, plotted against release date. Older releases show more compressed human-equivalent time."
            >
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {yTicks.map((yr) => (
                  <g key={yr} className="timeline-gridline" transform={`translate(0,${scaleY(yr)})`}>
                    <line x1={0} x2={PLOT_W} y1={0} y2={0} />
                    <text x={-10} y={4} textAnchor="end">
                      {yr}y
                    </text>
                  </g>
                ))}

                {xTicks.map(({ year, ms }) => (
                  <text key={year} className="timeline-x-label" x={scaleX(ms)} y={PLOT_H + 28} textAnchor="middle">
                    {year}
                  </text>
                ))}

                <line className="timeline-axis" x1={0} y1={PLOT_H} x2={PLOT_W} y2={PLOT_H} aria-hidden="true" />
                <line className="timeline-axis" x1={0} y1={0} x2={0} y2={PLOT_H} aria-hidden="true" />

                {points.length > 1 && (
                  <path
                    className="timeline-curve"
                    d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.releaseMs)} ${scaleY(p.humanEquivYears)}`).join(' ')}
                    aria-hidden="true"
                  />
                )}

                {points.map((p) => (
                  <a
                    key={p.tool.id}
                    href={`/?tool=${encodeURIComponent(p.tool.id)}`}
                    className="timeline-point"
                    aria-label={`${p.tool.name}, released ${p.tool.release_date}: ${p.humanEquivYears.toFixed(1)} human-equivalent years compressed since. Open this result.`}
                  >
                    {/* transparent, wider hit circle so the tap area clears the
                        6px visual dot; the visible .timeline-dot stays small. */}
                    <circle className="timeline-hit" cx={scaleX(p.releaseMs)} cy={scaleY(p.humanEquivYears)} r={12} />
                    <circle className="timeline-dot" cx={scaleX(p.releaseMs)} cy={scaleY(p.humanEquivYears)} r={6} />
                    <title>{`${p.tool.name} — ${p.humanEquivYears.toFixed(1)}y`}</title>
                  </a>
                ))}
              </g>
            </svg>
          </div>

          <p className="timeline-caption">
            Y-axis (log scale): human-equivalent years compressed since each tool shipped, as of today. X-axis: release date. Click a
            point to open that tool's full result.
          </p>
        </main>

        <footer className="app-footer">
          <SourceBadge source={source} label="Tools" />
        </footer>
      </div>
    </>
  )
}
