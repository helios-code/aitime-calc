import { describe, expect, it } from 'vitest'
import { getRoute } from './routing'

describe('getRoute', () => {
  it('matches /methodology', () => {
    expect(getRoute('/methodology')).toBe('methodology')
  })

  it('matches /methodology/ with trailing slash', () => {
    expect(getRoute('/methodology/')).toBe('methodology')
  })

  it('treats root as home', () => {
    expect(getRoute('/')).toBe('home')
  })

  it('treats unknown paths as home', () => {
    expect(getRoute('/methodology-typo')).toBe('home')
    expect(getRoute('/other')).toBe('home')
  })

  it('matches /leaderboard', () => {
    expect(getRoute('/leaderboard')).toBe('leaderboard')
  })

  it('matches /leaderboard/ with trailing slash', () => {
    expect(getRoute('/leaderboard/')).toBe('leaderboard')
  })

  it('matches /timeline', () => {
    expect(getRoute('/timeline')).toBe('timeline')
  })

  it('matches /compare', () => {
    expect(getRoute('/compare')).toBe('compare')
  })

  it('matches /compare/ with trailing slash', () => {
    expect(getRoute('/compare/')).toBe('compare')
  })
})
