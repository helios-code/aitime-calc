import { afterEach, describe, expect, it, vi } from 'vitest'
import middleware from './middleware'

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function makeRequest(url: string, userAgent: string): Request {
  return new Request(url, { headers: { 'user-agent': userAgent } })
}

describe('middleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('passes real browsers straight through to the SPA (next())', async () => {
    const res = await middleware(makeRequest('https://aitime-calc.example/?tool=cursor-yolo', BROWSER_UA))
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('serves crawlers a param-correct HTML card instead of the SPA shell', async () => {
    const result = {
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
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => result }))

    const res = await middleware(makeRequest('https://aitime-calc.example/?tool=cursor-yolo&model=base', 'Twitterbot/1.0'))

    expect(res.headers.get('x-middleware-next')).toBeNull()
    expect(res.headers.get('content-type')).toContain('text/html')
    const body = await res.text()
    expect(body).toContain('og:image')
    expect(body).toContain('tool=cursor-yolo')
    expect(body).toContain('27.3')
  })
})
