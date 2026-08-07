import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isLocale, resolveLocale, syncDocumentLang } from './i18n'

describe('resolveLocale precedence: param > stored > navigator > en', () => {
  it('honours a valid ?lang param above everything else', () => {
    expect(resolveLocale({ param: 'fr', stored: 'en', navigator: 'en-US' })).toBe('fr')
    expect(resolveLocale({ param: 'en', stored: 'fr', navigator: 'fr-FR' })).toBe('en')
  })

  it('falls back to the stored choice when no param', () => {
    expect(resolveLocale({ param: null, stored: 'fr', navigator: 'en-US' })).toBe('fr')
    expect(resolveLocale({ param: undefined, stored: 'en', navigator: 'fr-FR' })).toBe('en')
  })

  it('falls back to navigator language when no param and no stored choice', () => {
    expect(resolveLocale({ navigator: 'fr-FR' })).toBe('fr')
    expect(resolveLocale({ navigator: 'FR' })).toBe('fr')
    expect(resolveLocale({ navigator: 'en-GB' })).toBe('en')
  })

  it('defaults to English when nothing is set or nothing is recognised', () => {
    expect(resolveLocale({})).toBe('en')
    expect(resolveLocale({ navigator: 'de-DE' })).toBe('en')
  })

  it('ignores invalid param/stored values and moves down the chain', () => {
    expect(resolveLocale({ param: 'de', stored: 'fr', navigator: 'en' })).toBe('fr')
    expect(resolveLocale({ param: 'xx', stored: 'yy', navigator: 'fr-CA' })).toBe('fr')
    expect(resolveLocale({ param: '', stored: '', navigator: '' })).toBe('en')
  })
})

describe('syncDocumentLang', () => {
  it('sets document.documentElement.lang for both locales', () => {
    syncDocumentLang('fr')
    expect(document.documentElement.lang).toBe('fr')
    syncDocumentLang('en')
    expect(document.documentElement.lang).toBe('en')
  })
})

describe('document lang syncs at module load', () => {
  beforeEach(() => {
    vi.resetModules()
    document.documentElement.lang = 'en'
    localStorage.clear()
  })
  afterEach(() => {
    window.history.replaceState({}, '', '/')
    localStorage.clear()
  })

  it('sets <html lang> to fr on a ?lang=fr permalink load', async () => {
    window.history.replaceState({}, '', '/?lang=fr')
    await import('./i18n')
    expect(document.documentElement.lang).toBe('fr')
  })

  it('sets <html lang> to en on a ?lang=en permalink load', async () => {
    window.history.replaceState({}, '', '/?lang=en')
    await import('./i18n')
    expect(document.documentElement.lang).toBe('en')
  })
})

describe('isLocale', () => {
  it('accepts only the supported locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(null)).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})
