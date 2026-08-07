import { useEffect, useMemo, useRef, useState } from 'react'
import '../App.css'
import './Compare.css'
import { fetchCalc, fetchTools } from '../lib/api'
import { copyToClipboard } from '../lib/clipboard'
import { decodeCompare, encodeCompare, syncSearch } from '../lib/urlState'
import { DEFAULT_TOOL_ID, FALLBACK_TOOLS } from '../data/tools'
import type { CalcResult, Tool } from '../types'
import { ToolPicker } from '../components/ToolPicker'
import { SourceBadge } from '../components/SourceBadge'
import { SiteNav } from '../components/SiteNav'
import { SiteFooter } from '../components/SiteFooter'
import { t } from '../lib/i18n'

const TODAY = new Date().toISOString().slice(0, 10)
const FALLBACK_B = FALLBACK_TOOLS.find((t) => t.id !== DEFAULT_TOOL_ID)?.id ?? DEFAULT_TOOL_ID

const initial = decodeCompare(window.location.search)
// Compare has no as_of picker; a permalink may still carry one, and it must
// round-trip. Absent → today.
const AS_OF = initial.asOf ?? TODAY

interface Side {
  toolId: string
  result: CalcResult | null
  source: 'live' | 'mock'
}

function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])
}

function ResultColumn({
  tools,
  selectedId,
  side,
  onChange,
  pickerLabel,
}: {
  tools: Tool[]
  selectedId: string
  side: Side
  onChange: (id: string) => void
  pickerLabel: string
}) {
  const tool = tools.find((t) => t.id === selectedId)
  return (
    <div className="cmp-col">
      <ToolPicker tools={tools} selectedId={selectedId} onChange={onChange} label={pickerLabel} />
      <div className="cmp-result">
        {side.result && side.toolId === selectedId ? (
          <>
            <div className="cmp-figure">{side.result.human_equiv_years.toFixed(1)}</div>
            <div className="cmp-unit">{t.compare.unit}</div>
            <p className="cmp-comparison">{side.result.comparison_line}</p>
            <dl className="cmp-meta">
              <div>
                <dt>{t.compare.released}</dt>
                <dd>{tool?.release_date ?? '—'}</dd>
              </div>
              <div>
                <dt>{t.compare.elapsed}</dt>
                <dd>{side.result.elapsed.human}</dd>
              </div>
              <div>
                <dt>{t.compare.aiDoublings}</dt>
                <dd>{side.result.ai_doublings.toFixed(1)}</dd>
              </div>
            </dl>
            <SourceBadge source={side.source} label={t.compare.calcLabel} />
          </>
        ) : (
          <div className="cmp-skeleton" />
        )}
      </div>
    </div>
  )
}

export default function Compare() {
  useDocumentTitle(t.compare.docTitle)

  const [tools, setTools] = useState<Tool[]>(FALLBACK_TOOLS)
  const [toolsSource, setToolsSource] = useState<'live' | 'mock'>('mock')
  const [idA, setIdA] = useState(initial.a ?? DEFAULT_TOOL_ID)
  const [idB, setIdB] = useState(initial.b ?? FALLBACK_B)
  const [resultA, setResultA] = useState<Side>({ toolId: idA, result: null, source: 'mock' })
  const [resultB, setResultB] = useState<Side>({ toolId: idB, result: null, source: 'mock' })

  useEffect(() => {
    let cancelled = false
    fetchTools().then(({ tools, source }) => {
      if (cancelled) return
      setTools(tools)
      setToolsSource(source)
      setIdA((id) => (tools.some((t) => t.id === id) ? id : DEFAULT_TOOL_ID))
      setIdB((id) => (tools.some((t) => t.id === id) ? id : FALLBACK_B))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const tool = tools.find((t) => t.id === idA)
    if (!tool) return
    let cancelled = false
    fetchCalc({ release_date: tool.release_date, as_of: AS_OF, model: initial.model, tool_id: tool.id }).then(
      ({ result, source }) => {
        if (cancelled) return
        setResultA({ toolId: idA, result, source })
      },
    )
    return () => {
      cancelled = true
    }
  }, [idA, tools])

  useEffect(() => {
    const tool = tools.find((t) => t.id === idB)
    if (!tool) return
    let cancelled = false
    fetchCalc({ release_date: tool.release_date, as_of: AS_OF, model: initial.model, tool_id: tool.id }).then(
      ({ result, source }) => {
        if (cancelled) return
        setResultB({ toolId: idB, result, source })
      },
    )
    return () => {
      cancelled = true
    }
  }, [idB, tools])

  const shareUrl = useMemo(() => {
    const { origin, pathname } = window.location
    return `${origin}${pathname}${encodeCompare({ a: idA, b: idB, model: initial.model, asOf: initial.asOf })}`
  }, [idA, idB])

  // Keep the address bar in lockstep with the current pair so what's shown is
  // always the copy-pasteable permalink, and push one history entry per change
  // so Back/Forward walks the comparisons the user viewed. Skip the mount run:
  // the URL already reflects `initial`, so pushing there would add a duplicate
  // entry that swallows one Back press.
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const next = encodeCompare({ a: idA, b: idB, model: initial.model, asOf: initial.asOf })
    // Skip when the URL already matches — the change came from Back/Forward
    // (we wrote that exact URL), or it's a no-op. Pushing there would strand
    // the user by re-forwarding the state they just left.
    if (next === window.location.search) return
    syncSearch(next, 'push')
  }, [idA, idB])

  // Back/Forward restored a prior URL — re-read the pair from it. Unknown ids
  // degrade to the same defaults as a cold load.
  useEffect(() => {
    const onPop = () => {
      const s = decodeCompare(window.location.search)
      setIdA(s.a ?? DEFAULT_TOOL_ID)
      setIdB(s.b ?? FALLBACK_B)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const delta = useMemo(() => {
    if (!resultA.result || !resultB.result) return null
    if (resultA.toolId !== idA || resultB.toolId !== idB) return null
    return resultA.result.human_equiv_years - resultB.result.human_equiv_years
  }, [resultA, resultB, idA, idB])

  return (
    <>
      <SiteNav />
      <div className="app cmp-page">
        <header className="app-header">
          <h1 className="tagline">{t.compare.title}</h1>
          <p className="cmp-subtitle">{t.compare.subtitle}</p>
        </header>

        <main className="app-main">
          <div className="cmp-columns">
            <ResultColumn
              tools={tools}
              selectedId={idA}
              side={resultA}
              onChange={setIdA}
              pickerLabel={t.compare.pickerA}
            />
            <div className="cmp-vs" aria-hidden="true">
              {t.compare.vs}
            </div>
            <ResultColumn
              tools={tools}
              selectedId={idB}
              side={resultB}
              onChange={setIdB}
              pickerLabel={t.compare.pickerB}
            />
          </div>

          {delta !== null && (
            <p className="cmp-delta" role="status">
              {t.compare.delta(
                Math.abs(delta).toFixed(1),
                delta >= 0,
                tools.find((tool) => tool.id === idA)?.name ?? idA,
                tools.find((tool) => tool.id === idB)?.name ?? idB,
              )}
            </p>
          )}

          <div className="share-card">
            <span className="share-card-label">{t.compare.shareLabel}</span>
            <p className="share-card-text">{shareUrl}</p>
            <div className="share-card-actions">
              <button type="button" className="share-btn" onClick={() => void copyToClipboard(shareUrl)}>
                {t.compare.copyLink}
              </button>
            </div>
          </div>

          <footer className="app-footer">
            <SourceBadge source={toolsSource} label={t.compare.toolsLabel} />
          </footer>
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
