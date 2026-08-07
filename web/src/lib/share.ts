import { copyToClipboard } from './clipboard'

// Share a permalink. Prefers the native share sheet (mobile / secure context),
// falls back to the clipboard everywhere else. Never throws — a missing API, an
// insecure context, or a user-cancelled sheet degrades to a result the UI can
// render, not a crash.
export type ShareOutcome = 'shared' | 'copied' | 'failed'

export async function sharePermalink(url: string): Promise<ShareOutcome> {
  const nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ url })
      return 'shared'
    } catch (err) {
      // The user dismissed the native sheet — respect that; treat it as handled
      // rather than silently copying behind their back.
      if (err && (err as { name?: string }).name === 'AbortError') return 'shared'
      // Any other failure (e.g. share not permitted): fall through to clipboard.
    }
  }
  return (await copyToClipboard(url)) ? 'copied' : 'failed'
}
