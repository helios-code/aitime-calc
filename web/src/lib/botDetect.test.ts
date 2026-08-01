import { describe, expect, it } from 'vitest'
import { isCrawlerUserAgent } from './botDetect'

describe('isCrawlerUserAgent', () => {
  it('recognizes the standard unfurl bots', () => {
    expect(isCrawlerUserAgent('Twitterbot/1.0')).toBe(true)
    expect(isCrawlerUserAgent('facebookexternalhit/1.1')).toBe(true)
    expect(isCrawlerUserAgent('Slackbot-LinkedExpanding 1.0')).toBe(true)
    expect(isCrawlerUserAgent('Mozilla/5.0 (compatible; Discordbot/2.0;+https://discordapp.com)')).toBe(true)
    expect(isCrawlerUserAgent('LinkedInBot/1.0')).toBe(true)
    expect(isCrawlerUserAgent('WhatsApp/2.23.20.0')).toBe(true)
    expect(isCrawlerUserAgent('TelegramBot (like TwitterBot)')).toBe(true)
    expect(isCrawlerUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true)
    expect(isCrawlerUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true)
    expect(isCrawlerUserAgent('Applebot/0.1')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(isCrawlerUserAgent('TWITTERBOT/1.0')).toBe(true)
  })

  it('rejects a real browser UA', () => {
    expect(
      isCrawlerUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      ),
    ).toBe(false)
  })

  it('rejects null/undefined/empty', () => {
    expect(isCrawlerUserAgent(null)).toBe(false)
    expect(isCrawlerUserAgent(undefined)).toBe(false)
    expect(isCrawlerUserAgent('')).toBe(false)
  })
})
