import { useEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import './TimelinePage.css'
import { fetchTools } from '../lib/api'
import { buildTimelinePoints } from '../lib/timelineData'
import { appendLang, decodeTimeline, encodeTimeline, syncSearch } from '../lib/urlState'
import { FALLBACK_TOOLS } from '../data/tools'
import { ModelToggle } from '../components/ModelToggle'
import { SourceBadge } from '../components/SourceBadge'
import { SiteNav } from '../components/SiteNav'
import { SiteFooter } from '../components/SiteFooter'
import { ShareLinkButton } from '../components/ShareLinkButton'
import { LOCALE, t } from '../lib/i18n'
import type { CalcModel, Tool } from '../types'

const initialModel = decodeTimeline(window.location.search).model

const TODAY = new Date().toISOString().slice(0, 10)
const WIDTH = 960
const HEIGHT = 440
const MARGIN = { top: 24, right: 24, bottom: 48, left: 60 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom

export function TimelinePage() {
  const [tools, setTools] = useState<Tool[]>(FALLBACK_TOOLS)
  const [source, setSource] = useState<'live' | 'mock'>('mock')
  const [model, setModel] = useState<CalcModel>(initialModel)

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

  // Mirror the model choice into the URL (push per change so Back/Forward walks
  // it), skipping the mount run since the URL already reflects `initialModel`.
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const next = encodeTimeline({ model })
    // Skip when the URL already matches — the change came from Back/Forward
    // (we wrote that URL) or it's a no-op.
    if (next === window.location.search) return
    syncSearch(next, 'push')
  }, [model])

  // Back/Forward restored a prior URL — re-read the model from it.
  useEffect(() => {
    const onPop = () => setModel(decodeTimeline(window.location.search).model)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const shareUrl = useMemo(() => {
    const { origin, pathname } = window.location
    return `${origin}${pathname}${appendLang(encodeTimeline({ model }), LOCALE)}`
  }, [model])

  const points = useMemo(() => buildTimelinePoints(tools, TODAY, model), [tools, model])

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
          <h1 className="tagline">{t.timeline.title}</h1>
          <ModelToggle model={model} onChange={setModel} />
        </header>

        <main className="app-main">
          <div className="timeline-chart-wrap">
            <svg
              className="timeline-chart"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="group"
              aria-label={t.timeline.chartAria}
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
                    aria-label={t.timeline.pointAria(p.tool.name, p.tool.release_date, p.humanEquivYears.toFixed(1))}
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

          <p className="timeline-caption">{t.timeline.caption}</p>

          <div className="share-card">
            <span className="share-card-label">{t.timeline.shareLabel}</span>
            <p className="share-card-text">{shareUrl}</p>
            <div className="share-card-actions">
              <ShareLinkButton url={shareUrl} />
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <SourceBadge source={source} label={t.timeline.toolsLabel} />
        </footer>
        <SiteFooter />
      </div>
    </>
  )
}
