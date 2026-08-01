import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildCrawlerCardMeta, buildCrawlerHtml, buildOgImageUrl } from './crawlerCard'
import type { CalcResult } from '../types'

const API_BASE = 'https://aitime-calc-api.fly.dev'

function mockResult(overrides: Partial<CalcResult> = {}): CalcResult {
  return {
    input: { release_date: '2024-11-01', as_of: '2026-08-01', tool_id: 'cursor-yolo' },
    elapsed: { days: 638, months: 21, human: '1 yr 9 mo' },
    model: 'base',
    params: { d_classic_months: 72, d_ai_months: 4.5, multiplier: 16 },
    ai_doublings: 4.7,
    human_equiv_years: 27.3,
    human_equiv_human: '27.3 years',
    comparison_line: '≈ 4.7 classic software generations',
    methodology_note: 'ATEM base model: ...',
    sources: ['https://example.com'],
    ...overrides,
  }
}

describe('buildOgImageUrl', () => {
  it('builds an /api/og URL carrying tool + model, no trailing extras', () => {
    const url = buildOgImageUrl(API_BASE, 'cursor-yolo', 'base')
    const parsed = new URL(url)
    expect(parsed.origin).toBe(API_BASE)
    expect(parsed.pathname).toBe('/api/og')
    expect(parsed.searchParams.get('tool')).toBe('cursor-yolo')
    expect(parsed.searchParams.get('model')).toBe('base')
  })
})

describe('buildCrawlerCardMeta', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to the generic card in date mode, without calling fetch', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const meta = await buildCrawlerCardMeta(API_BASE, '?date=2022-11-30')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(meta.title).toContain('aitime-calc')
    expect(meta.image).toContain('tool=cursor-yolo')
  })

  it('falls back to the generic card on a bare landing (no params), without calling fetch', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const meta = await buildCrawlerCardMeta(API_BASE, '')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(meta.image).toContain('tool=cursor-yolo')
  })

  it('fetches the live result and builds a per-tool title in tool mode', async () => {
    const result = mockResult()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => result }),
    )
    const meta = await buildCrawlerCardMeta(API_BASE, '?tool=cursor-yolo&model=base')
    expect(meta.title).toContain('27.3')
    expect(meta.title).toContain('Cursor "YOLO mode"')
    expect(meta.image).toContain('tool=cursor-yolo')
    expect(meta.image).toContain('model=base')
  })

  it('falls back when the API responds non-OK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    const meta = await buildCrawlerCardMeta(API_BASE, '?tool=cursor-yolo&model=base')
    expect(meta.image).toContain('tool=cursor-yolo&model=base')
  })

  it('falls back when the API payload is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ oops: true }) }))
    const meta = await buildCrawlerCardMeta(API_BASE, '?tool=cursor-yolo&model=base')
    expect(meta.title).not.toContain('undefined')
    expect(meta.image).toContain('tool=cursor-yolo&model=base')
  })

  it('falls back when fetch throws (network error / timeout)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    )
    const meta = await buildCrawlerCardMeta(API_BASE, '?tool=cursor-yolo&model=base')
    expect(meta.title).toBe('aitime-calc — human-equivalent time')
  })

  it('never throws even for an unknown tool id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'unknown tool' }) }))
    await expect(buildCrawlerCardMeta(API_BASE, '?tool=not-a-real-tool&model=base')).resolves.toBeDefined()
  })
})

describe('buildCrawlerHtml', () => {
  it('embeds og/twitter tags and a self-referencing canonical link', () => {
    const html = buildCrawlerHtml(
      { title: 'T', description: 'D', image: 'https://x.test/card.png' },
      'https://aitime-calc.example/?tool=cursor-yolo',
    )
    expect(html).toContain('<meta property="og:title" content="T" />')
    expect(html).toContain('<meta property="og:image" content="https://x.test/card.png" />')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
    expect(html).toContain('<link rel="canonical" href="https://aitime-calc.example/?tool=cursor-yolo" />')
  })

  it('HTML-escapes title/description so injected content cannot break out of attributes', () => {
    const html = buildCrawlerHtml(
      { title: '"><script>alert(1)</script>', description: 'D & "quoted"', image: 'https://x.test/c.png' },
      'https://x.test/',
    )
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&quot;&gt;&lt;script&gt;')
    expect(html).toContain('D &amp; &quot;quoted&quot;')
  })
})
