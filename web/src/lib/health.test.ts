import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth } from './api'

describe('fetchHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns the version from a live {status,version,uptime_s} payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', version: 'v1.2.3', uptime_s: 42 }) }),
    )
    expect(await fetchHealth()).toBe('v1.2.3')
  })

  it('returns null when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await fetchHealth()).toBeNull()
  })

  it('returns null on a non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }))
    expect(await fetchHealth()).toBeNull()
  })

  it('returns null when the payload has no version string', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', uptime_s: 1 }) }))
    expect(await fetchHealth()).toBeNull()
  })
})
