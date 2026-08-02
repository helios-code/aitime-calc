import { afterEach, describe, expect, it } from 'vitest'
import { buildOgImageUrl, resolveMeta } from './middleware'

describe('resolveMeta', () => {
  it('returns the static entry for /methodology', () => {
    expect(resolveMeta('/methodology', new URLSearchParams())).toEqual({
      title: 'Methodology — aitime-calc',
      description: 'How the ATEM model converts calendar time into human-equivalent progress years.',
    })
  })

  it('strips trailing slashes before lookup', () => {
    expect(resolveMeta('/methodology/', new URLSearchParams())).toEqual(
      resolveMeta('/methodology', new URLSearchParams()),
    )
  })

  it('builds per-tool meta on home when ?tool is present', () => {
    const meta = resolveMeta('/', new URLSearchParams('tool=cursor-yolo'))
    expect(meta.title).toContain('cursor-yolo')
    expect(meta.description).toContain('cursor-yolo')
  })

  it('falls back to the default meta on home with no query', () => {
    expect(resolveMeta('/', new URLSearchParams())).toEqual({
      title: 'aitime-calc — human-equivalent time',
      description:
        'How much human progress did that AI release actually compress? aitime-calc converts calendar time into human-equivalent years.',
    })
  })

  it('falls back to the default meta for an unknown path', () => {
    expect(resolveMeta('/nonsense', new URLSearchParams()).title).toBe('aitime-calc — human-equivalent time')
  })
})

describe('buildOgImageUrl', () => {
  const ORIGINAL_ENV = process.env.VITE_API_URL

  afterEach(() => {
    process.env.VITE_API_URL = ORIGINAL_ENV
  })

  it('returns null when VITE_API_URL is unset', () => {
    delete process.env.VITE_API_URL
    expect(buildOgImageUrl(new URLSearchParams('tool=gpt-4o'))).toBeNull()
  })

  it('builds an absolute /api/og URL with the forwarded query params', () => {
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    const url = buildOgImageUrl(new URLSearchParams('tool=gpt-4o&model=accelerating&date=2024-01-01'))
    expect(url).toBe(
      'https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o&model=accelerating&date=2024-01-01',
    )
  })

  it('omits params that are absent from the query string', () => {
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    const url = buildOgImageUrl(new URLSearchParams('tool=gpt-4o'))
    expect(url).toBe('https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o')
  })

  it('returns null when tool is absent, even with VITE_API_URL set', () => {
    // /api/og 400s without a tool id -- must not inject a broken og:image
    // that would duplicate/shadow the correct static default in index.html.
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    expect(buildOgImageUrl(new URLSearchParams())).toBeNull()
    expect(buildOgImageUrl(new URLSearchParams('model=accelerating'))).toBeNull()
  })
})
