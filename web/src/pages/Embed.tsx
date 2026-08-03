import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import './Embed.css'
import { fetchCalc, fetchTools } from '../lib/api'
import { parseInitialState } from '../lib/urlParams'
import { DEFAULT_TOOL_ID, FALLBACK_TOOLS } from '../data/tools'
import type { CalcResult, Tool } from '../types'
import { ResultHero } from '../components/ResultHero'
import { SourceBadge } from '../components/SourceBadge'

const TODAY = new Date().toISOString().slice(0, 10)

const initial = parseInitialState(window.location.search)

export default function Embed() {
  useEffect(() => {
    document.title = 'aitime-calc — embedded result'
  }, [])

  const [tools, setTools] = useState<Tool[]>(FALLBACK_TOOLS)
  const [selectedToolId, setSelectedToolId] = useState(initial.tool ?? DEFAULT_TOOL_ID)
  const [result, setResult] = useState<CalcResult | null>(null)
  const [source, setSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    if (initial.mode === 'date') return
    let cancelled = false
    fetchTools().then(({ tools }) => {
      if (cancelled) return
      setTools(tools)
      setSelectedToolId((id) => (tools.some((t) => t.id === id) ? id : DEFAULT_TOOL_ID))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedTool = useMemo(
    () => (initial.mode === 'tool' ? tools.find((t) => t.id === selectedToolId) : undefined),
    [tools, selectedToolId],
  )
  const releaseDate =
    initial.mode === 'date' ? initial.date! : (selectedTool?.release_date ?? tools[0]?.release_date)

  useEffect(() => {
    if (!releaseDate) return
    let cancelled = false
    fetchCalc({ release_date: releaseDate, as_of: TODAY, model: initial.model }).then(({ result, source }) => {
      if (cancelled) return
      setResult(result)
      setSource(source)
    })
    return () => {
      cancelled = true
    }
  }, [releaseDate])

  return (
    <div className="embed-page">
      {result ? (
        <>
          <ResultHero result={result} toolName={selectedTool?.name} />
          <SourceBadge source={source} label="Calc" />
        </>
      ) : (
        <div className="result-skeleton embed-skeleton" aria-hidden="true" />
      )}
      <a className="embed-attribution" href="/" target="_blank" rel="noopener noreferrer">
        aitime-calc
      </a>
    </div>
  )
}
