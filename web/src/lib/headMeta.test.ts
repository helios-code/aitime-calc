import { afterEach, describe, expect, it } from 'vitest'
import { buildOgImageUrl, updateShareMeta } from './headMeta'

describe('buildOgImageUrl', () => {
  it('builds an /api/og URL carrying tool, model and date', () => {
    const url = buildOgImageUrl('cursor-yolo', 'base', '2025-06-01')
    expect(url).toContain('/api/og?')
    const parsed = new URL(url, 'http://placeholder')
    expect(parsed.searchParams.get('tool')).toBe('cursor-yolo')
    expect(parsed.searchParams.get('model')).toBe('base')
    expect(parsed.searchParams.get('date')).toBe('2025-06-01')
  })
})

describe('updateShareMeta', () => {
  afterEach(() => {
    document.head.querySelectorAll('meta').forEach((el) => el.remove())
  })

  it('creates og/twitter meta tags on first call', () => {
    updateShareMeta({ title: 'T', description: 'D', url: 'https://x.test/', image: 'https://x.test/card.png' })
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('T')
    expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://x.test/card.png')
    expect(document.head.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe('https://x.test/card.png')
  })

  it('updates existing tags in place rather than duplicating them', () => {
    updateShareMeta({ title: 'T1', description: 'D1', url: 'https://x.test/1' })
    updateShareMeta({ title: 'T2', description: 'D2', url: 'https://x.test/2' })
    const titles = document.head.querySelectorAll('meta[property="og:title"]')
    expect(titles).toHaveLength(1)
    expect(titles[0].getAttribute('content')).toBe('T2')
  })

  it('leaves og:image untouched when no image is provided (date mode)', () => {
    updateShareMeta({ title: 'T', description: 'D', url: 'https://x.test/', image: 'https://x.test/card.png' })
    updateShareMeta({ title: 'T2', description: 'D2', url: 'https://x.test/2' })
    expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://x.test/card.png')
  })
})
