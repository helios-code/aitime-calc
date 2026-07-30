import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchCalc, fetchTools } from './lib/api'
import { DEFAULT_TOOL_ID, FALLBACK_TOOLS } from './data/tools'
import type { CalcModel, CalcResult, Tool } from './types'
import { ModeTabs } from './components/ModeTabs'
import { ToolPicker } from './components/ToolPicker'
import { DatePicker } from './components/DatePicker'
import { ModelToggle } from './components/ModelToggle'
import { ResultHero } from './components/ResultHero'
import { MethodologyExplainer } from './components/MethodologyExplainer'
import { SourceBadge } from './components/SourceBadge'

const TODAY = new Date().toISOString().slice(0, 10)

function App() {
  const [tools, setTools] = useState<Tool[]>(FALLBACK_TOOLS)
  const [toolsSource, setToolsSource] = useState<'live' | 'mock'>('mock')
  const [mode, setMode] = useState<'tool' | 'date'>('tool')
  const [selectedToolId, setSelectedToolId] = useState(DEFAULT_TOOL_ID)
  const [customDate, setCustomDate] = useState('2022-11-30')
  const [model, setModel] = useState<CalcModel>('base')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [calcSource, setCalcSource] = useState<'live' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTools().then(({ tools, source }) => {
      if (cancelled) return
      setTools(tools)
      setToolsSource(source)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const releaseDate = useMemo(() => {
    if (mode === 'date') return customDate
    return tools.find((t) => t.id === selectedToolId)?.release_date ?? tools[0]?.release_date
  }, [mode, customDate, selectedToolId, tools])

  const selectedTool = useMemo(
    () => (mode === 'tool' ? tools.find((t) => t.id === selectedToolId) : undefined),
    [mode, selectedToolId, tools],
  )

  useEffect(() => {
    if (!releaseDate) return
    let cancelled = false
    setLoading(true)
    fetchCalc({ release_date: releaseDate, as_of: TODAY, model }).then(({ result, source }) => {
      if (cancelled) return
      setResult(result)
      setCalcSource(source)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [releaseDate, model])

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand">aitime-calc</span>
        <p className="tagline">How much human progress did that AI release actually compress?</p>
      </header>

      <main className="app-main">
        <section className="controls">
          <ModeTabs mode={mode} onChange={setMode} />
          {mode === 'tool' ? (
            <ToolPicker tools={tools} selectedId={selectedToolId} onChange={setSelectedToolId} />
          ) : (
            <DatePicker value={customDate} onChange={setCustomDate} />
          )}
          <ModelToggle model={model} onChange={setModel} />
        </section>

        <section className={loading ? 'result-panel result-panel--loading' : 'result-panel'}>
          {result && <ResultHero result={result} toolName={selectedTool?.name} />}
        </section>

        {result && <MethodologyExplainer result={result} />}
      </main>

      <footer className="app-footer">
        <SourceBadge source={toolsSource} label="Tools" />
        <SourceBadge source={calcSource} label="Calc" />
      </footer>
    </div>
  )
}

export default App
