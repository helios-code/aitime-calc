import { useEffect, useRef, useState } from 'react'
import { sharePermalink } from '../lib/share'
import { t } from '../lib/i18n'

interface Props {
  // Absolute permalink to share (state params + lang already encoded).
  url: string
  className?: string
}

type Feedback = 'idle' | 'copied' | 'failed'

// Copy-link / native-share affordance. On mobile it opens the OS share sheet;
// elsewhere it copies the permalink and confirms inline. Label + feedback are
// localized via the existing t() strings.
export function ShareLinkButton({ url, className }: Props) {
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function onShare() {
    const outcome = await sharePermalink(url)
    clearTimeout(timerRef.current)
    // 'shared' → the native sheet was its own feedback; stay idle.
    if (outcome === 'shared') {
      setFeedback('idle')
      return
    }
    setFeedback(outcome === 'copied' ? 'copied' : 'failed')
    timerRef.current = setTimeout(() => setFeedback('idle'), 1800)
  }

  return (
    <>
      <button type="button" className={className ?? 'share-btn'} onClick={() => void onShare()}>
        {feedback === 'copied' ? t.share.copied : t.share.copyLink}
      </button>
      {feedback === 'failed' && (
        <p className="share-card-status" role="status" aria-live="polite">
          {t.share.failed}
        </p>
      )}
    </>
  )
}
