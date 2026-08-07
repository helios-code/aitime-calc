import { afterEach, describe, expect, it, vi } from 'vitest'
import { sharePermalink } from './share'

// navigator.share does not exist in jsdom; we define/remove it per test.
const originalShare = (navigator as { share?: unknown }).share
const originalClipboard = navigator.clipboard

function setShare(fn: ((data: { url: string }) => Promise<void>) | undefined) {
  if (fn) Object.defineProperty(navigator, 'share', { value: fn, configurable: true })
  else delete (navigator as { share?: unknown }).share
}

function setClipboard(writeText: ((text: string) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  })
}

describe('sharePermalink', () => {
  afterEach(() => {
    setShare(originalShare as never)
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true })
    vi.restoreAllMocks()
  })

  it('uses navigator.share when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setShare(share)
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    await expect(sharePermalink('https://x.test/?tool=a')).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ url: 'https://x.test/?tool=a' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('treats a cancelled share (AbortError) as handled — no silent copy', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' })
    setShare(vi.fn().mockRejectedValue(abort))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    await expect(sharePermalink('https://x.test/')).resolves.toBe('shared')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to the clipboard when navigator.share throws a non-abort error', async () => {
    setShare(vi.fn().mockRejectedValue(new Error('NotAllowedError')))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    await expect(sharePermalink('https://x.test/')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://x.test/')
  })

  it('copies to the clipboard when navigator.share is unavailable', async () => {
    setShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    await expect(sharePermalink('https://x.test/')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://x.test/')
  })

  it('reports failure when neither share nor clipboard can handle it', async () => {
    setShare(undefined)
    setClipboard(undefined)
    document.execCommand = vi.fn().mockReturnValue(false)

    await expect(sharePermalink('https://x.test/')).resolves.toBe('failed')
  })
})
