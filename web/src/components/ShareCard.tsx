import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '../lib/clipboard'
import type { CalcResult } from '../types'

interface Props {
  result: CalcResult
  toolName?: string
  shareUrl: string
}

function buildShareText(result: CalcResult, toolName?: string): string {
  const subject = toolName ?? result.input.release_date
  return `${subject} = ~${result.human_equiv_years.toFixed(1)} human-equivalent years compressed into ${result.elapsed.human}. ${result.comparison_line}`
}

type CopyState = 'idle' | 'copied-text' | 'copied-link' | 'failed'

export function ShareCard({ result, toolName, shareUrl }: Props) {
  const [state, setState] = useState<CopyState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function copy(kind: 'text' | 'link') {
    const value = kind === 'text' ? buildShareText(result, toolName) : shareUrl
    const ok = await copyToClipboard(value)
    clearTimeout(timerRef.current)
    setState(ok ? (kind === 'text' ? 'copied-text' : 'copied-link') : 'failed')
    timerRef.current = setTimeout(() => setState('idle'), 1800)
  }

  return (
    <div className="share-card">
      <p className="share-card-label">Share this result</p>
      <p className="share-card-text">{buildShareText(result, toolName)}</p>
      <div className="share-card-actions">
        <button type="button" className="share-btn" onClick={() => copy('text')}>
          {state === 'copied-text' ? 'Copied ✓' : 'Copy result'}
        </button>
        <button type="button" className="share-btn share-btn--ghost" onClick={() => copy('link')}>
          {state === 'copied-link' ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>
      {state === 'failed' && (
        <p className="share-card-status" role="status" aria-live="polite">
          Couldn't copy — select the text above and copy manually.
        </p>
      )}
    </div>
  )
}
