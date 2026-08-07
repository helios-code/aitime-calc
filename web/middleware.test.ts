import { afterEach, describe, expect, it } from 'vitest'
import { buildI18nTags, buildOgImageUrl, buildRobots, buildSitemap, resolveMeta } from './middleware'

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

  it('returns the FR static entry under ?lang=fr', () => {
    expect(resolveMeta('/methodology', new URLSearchParams('lang=fr'))).toEqual({
      title: 'Méthodologie — aitime-calc',
      description: 'Comment le modèle ATEM convertit le temps calendaire en années de progrès humain équivalent.',
    })
  })

  it('builds FR per-tool meta on home when ?lang=fr', () => {
    const meta = resolveMeta('/', new URLSearchParams('tool=gpt-4o&lang=fr'))
    expect(meta.title).toBe('gpt-4o vs. temps classique — aitime-calc')
    expect(meta.description).toContain('gpt-4o')
    expect(meta.description).toContain('progrès humain équivalent')
  })

  it('falls back to the FR default meta on home with only ?lang=fr', () => {
    expect(resolveMeta('/', new URLSearchParams('lang=fr')).title).toBe('aitime-calc — temps humain équivalent')
  })

  it('treats an unknown lang as English (lang-free is canonical EN)', () => {
    expect(resolveMeta('/methodology', new URLSearchParams('lang=de')).title).toBe('Methodology — aitime-calc')
  })
})

describe('buildI18nTags', () => {
  const ORIGIN = 'https://aitime-calc.example'

  it('emits self-canonical + en/fr/x-default alternates for an EN page', () => {
    const tags = buildI18nTags(ORIGIN, '/methodology', new URLSearchParams(), 'en')
    expect(tags).toContain('<link rel="canonical" href="https://aitime-calc.example/methodology" />')
    expect(tags).toContain('<link rel="alternate" hreflang="en" href="https://aitime-calc.example/methodology" />')
    expect(tags).toContain('<link rel="alternate" hreflang="fr" href="https://aitime-calc.example/methodology?lang=fr" />')
    expect(tags).toContain('<link rel="alternate" hreflang="x-default" href="https://aitime-calc.example/methodology" />')
    expect(tags).toContain('<meta property="og:locale" content="en_US" />')
  })

  it('canonicalizes a FR page to its own ?lang=fr URL, never across locales', () => {
    const tags = buildI18nTags(ORIGIN, '/methodology', new URLSearchParams('lang=fr'), 'fr')
    expect(tags).toContain('<link rel="canonical" href="https://aitime-calc.example/methodology?lang=fr" />')
    expect(tags).toContain('<meta property="og:locale" content="fr_FR" />')
    // x-default is the EN (lang-free) URL.
    expect(tags).toContain('<link rel="alternate" hreflang="x-default" href="https://aitime-calc.example/methodology" />')
  })

  it('preserves non-lang query params in every alternate URL', () => {
    const tags = buildI18nTags(ORIGIN, '/', new URLSearchParams('tool=gpt-4o&lang=fr'), 'fr')
    // EN alternate keeps the tool but drops lang; FR alternate keeps both.
    expect(tags).toContain('<link rel="alternate" hreflang="en" href="https://aitime-calc.example/?tool=gpt-4o" />')
    expect(tags).toContain('<link rel="alternate" hreflang="fr" href="https://aitime-calc.example/?tool=gpt-4o&amp;lang=fr" />')
  })
})

describe('buildRobots', () => {
  it('allows crawling, disallows /embed, and points at the origin sitemap', () => {
    const robots = buildRobots('https://aitime-calc.example')
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Disallow: /embed')
    expect(robots).toContain('Sitemap: https://aitime-calc.example/sitemap.xml')
  })
})

describe('buildSitemap', () => {
  const sitemap = buildSitemap('https://aitime-calc.example')

  it('lists both locale URLs via xhtml:link alternates for each route', () => {
    expect(sitemap).toContain('<loc>https://aitime-calc.example/methodology</loc>')
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://aitime-calc.example/methodology" />')
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="fr" href="https://aitime-calc.example/methodology?lang=fr" />')
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://aitime-calc.example/methodology" />')
  })

  it('includes the home route and excludes /embed', () => {
    expect(sitemap).toContain('<loc>https://aitime-calc.example/</loc>')
    expect(sitemap).not.toContain('/embed')
  })

  it('declares the sitemaps + xhtml namespaces', () => {
    expect(sitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
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

  it('forwards doubling params that are inside the UI bounds', () => {
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    const url = buildOgImageUrl(new URLSearchParams('tool=gpt-4o&d_ai_months=3&d_classic_months=96'))
    expect(url).toBe('https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o&d_classic_months=96&d_ai_months=3')
  })

  it('drops doubling params the page itself would ignore, so the card matches the page', () => {
    // parseInitialState() rejects these (out of bounds / non-numeric) and renders
    // the defaults -- forwarding them would unfurl a card contradicting the page.
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    for (const query of [
      'tool=gpt-4o&d_ai_months=0.001',
      'tool=gpt-4o&d_ai_months=99',
      'tool=gpt-4o&d_ai_months=abc',
      'tool=gpt-4o&d_classic_months=1',
      'tool=gpt-4o&d_classic_months=5000',
    ]) {
      expect(buildOgImageUrl(new URLSearchParams(query))).toBe('https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o')
    }
  })

  it('forwards lang=fr so a French permalink unfurls a French card', () => {
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    const url = buildOgImageUrl(new URLSearchParams('tool=gpt-4o&lang=fr'))
    expect(url).toBe('https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o&lang=fr')
  })

  it('leaves the EN image URL lang-free (en is the api default — no regression)', () => {
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    expect(buildOgImageUrl(new URLSearchParams('tool=gpt-4o&lang=en'))).toBe(
      'https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o',
    )
    // An unknown lang is likewise not forwarded.
    expect(buildOgImageUrl(new URLSearchParams('tool=gpt-4o&lang=de'))).toBe(
      'https://aitime-calc-api.fly.dev/api/og?tool=gpt-4o',
    )
  })

  it('returns null when tool is absent, even with VITE_API_URL set', () => {
    // /api/og 400s without a tool id -- must not inject a broken og:image
    // that would duplicate/shadow the correct static default in index.html.
    process.env.VITE_API_URL = 'https://aitime-calc-api.fly.dev'
    expect(buildOgImageUrl(new URLSearchParams())).toBeNull()
    expect(buildOgImageUrl(new URLSearchParams('model=accelerating'))).toBeNull()
  })
})
