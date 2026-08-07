import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '../lib/clipboard'
import { LOCALE, stringsFor, t } from '../lib/i18n'
import type { Locale } from '../lib/i18n'
import { resultElapsed } from '../lib/humanize'
import type { CalcResult } from '../types'

interface Props {
  result: CalcResult
  toolName?: string
  shareUrl: string
  embedSnippet?: string
}

// Pure + locale-explicit so the FR share text is testable without the module
// `LOCALE`. Elapsed + comparison are re-derived locale-aware from the numbers,
// so the FR share string carries no English fragments.
export function buildShareText(result: CalcResult, toolName: string | undefined, locale: Locale): string {
  const s = stringsFor(locale)
  const subject = toolName ?? result.input.release_date
  const elapsed = resultElapsed(result, locale)
  const comparison = s.result.comparisonLine(result.ai_doublings.toFixed(1))
  return s.share.shareText(subject, result.human_equiv_years.toFixed(1), elapsed, comparison)
}

type CopyState = 'idle' | 'copied-text' | 'copied-link' | 'copied-embed' | 'failed'

export function ShareCard({ result, toolName, shareUrl, embedSnippet }: Props) {
  const [state, setState] = useState<CopyState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function copy(kind: 'text' | 'link' | 'embed') {
    const value = kind === 'text' ? buildShareText(result, toolName, LOCALE) : kind === 'link' ? shareUrl : (embedSnippet ?? '')
    const ok = await copyToClipboard(value)
    clearTimeout(timerRef.current)
    setState(ok ? (kind === 'text' ? 'copied-text' : kind === 'link' ? 'copied-link' : 'copied-embed') : 'failed')
    timerRef.current = setTimeout(() => setState('idle'), 1800)
  }

  return (
    <div className="share-card">
      <p className="share-card-label">{t.share.label}</p>
      <p className="share-card-text">{buildShareText(result, toolName, LOCALE)}</p>
      <div className="share-card-actions">
        <button type="button" className="share-btn" onClick={() => copy('text')}>
          {state === 'copied-text' ? t.share.copied : t.share.copyResult}
        </button>
        <button type="button" className="share-btn share-btn--ghost" onClick={() => copy('link')}>
          {state === 'copied-link' ? t.share.copied : t.share.copyLink}
        </button>
        {embedSnippet && (
          <button type="button" className="share-btn share-btn--ghost" onClick={() => copy('embed')}>
            {state === 'copied-embed' ? t.share.copied : t.share.copyEmbed}
          </button>
        )}
      </div>
      {state === 'failed' && (
        <p className="share-card-status" role="status" aria-live="polite">
          {t.share.failed}
        </p>
      )}
    </div>
  )
}
