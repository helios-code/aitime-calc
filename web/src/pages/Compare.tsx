import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import './Compare.css'
import { fetchCalc, fetchTools } from '../lib/api'
import { copyToClipboard } from '../lib/clipboard'
import { parseCompareState } from '../lib/urlParams'
import { DEFAULT_TOOL_ID, FALLBACK_TOOLS } from '../data/tools'
import type { CalcResult, Tool } from '../types'
import { ToolPicker } from '../components/ToolPicker'
import { SourceBadge } from '../components/SourceBadge'

const TODAY = new Date().toISOString().slice(0, 10)
const FALLBACK_B = FALLBACK_TOOLS.find((t) => t.id !== DEFAULT_TOOL_ID)?.id ?? DEFAULT_TOOL_ID

const initial = parseCompareState(window.location.search)

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
            <div className="cmp-unit">human-equiv years</div>
            <p className="cmp-comparison">{side.result.comparison_line}</p>
            <dl className="cmp-meta">
              <div>
                <dt>Released</dt>
                <dd>{tool?.release_date ?? '—'}</dd>
              </div>
              <div>
                <dt>Elapsed</dt>
                <dd>{side.result.elapsed.human}</dd>
              </div>
              <div>
                <dt>AI doublings</dt>
                <dd>{side.result.ai_doublings.toFixed(1)}</dd>
              </div>
            </dl>
            <SourceBadge source={side.source} label="Calc" />
          </>
        ) : (
          <div className="cmp-skeleton" />
        )}
      </div>
    </div>
  )
}

export default function Compare() {
  useDocumentTitle('Compare AI tools — human-equivalent time | aitime-calc')

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
    fetchCalc({ release_date: tool.release_date, as_of: TODAY, model: initial.model, tool_id: tool.id }).then(
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
    fetchCalc({ release_date: tool.release_date, as_of: TODAY, model: initial.model, tool_id: tool.id }).then(
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
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('tool', idA)
    url.searchParams.set('vs', idB)
    if (initial.model === 'accelerating') url.searchParams.set('model', initial.model)
    return url.toString()
  }, [idA, idB])

  const delta = useMemo(() => {
    if (!resultA.result || !resultB.result) return null
    if (resultA.toolId !== idA || resultB.toolId !== idB) return null
    return resultA.result.human_equiv_years - resultB.result.human_equiv_years
  }, [resultA, resultB, idA, idB])

  return (
    <div className="app cmp-page">
      <header className="app-header">
        <span className="brand">aitime-calc</span>
        <h1 className="tagline">Compare two tools</h1>
        <p className="cmp-subtitle">Side-by-side human-equivalent time.</p>
      </header>

      <main className="app-main">
        <div className="cmp-columns">
          <ResultColumn
            tools={tools}
            selectedId={idA}
            side={resultA}
            onChange={setIdA}
            pickerLabel="Search the first AI tool to compare"
          />
          <div className="cmp-vs" aria-hidden="true">
            vs
          </div>
          <ResultColumn
            tools={tools}
            selectedId={idB}
            side={resultB}
            onChange={setIdB}
            pickerLabel="Search the second AI tool to compare"
          />
        </div>

        {delta !== null && (
          <p className="cmp-delta" role="status">
            {Math.abs(delta).toFixed(1)} human-equiv years {delta >= 0 ? 'more' : 'fewer'} for{' '}
            {tools.find((t) => t.id === idA)?.name ?? idA} than {tools.find((t) => t.id === idB)?.name ?? idB}
          </p>
        )}

        <div className="share-card">
          <span className="share-card-label">Share this comparison</span>
          <p className="share-card-text">{shareUrl}</p>
          <div className="share-card-actions">
            <button type="button" className="share-btn" onClick={() => void copyToClipboard(shareUrl)}>
              Copy link
            </button>
          </div>
        </div>

        <footer className="app-footer">
          <SourceBadge source={toolsSource} label="tools" />
          <a className="cmp-back-link" href="/">
            ← back to calculator
          </a>
        </footer>
      </main>
    </div>
  )
}
