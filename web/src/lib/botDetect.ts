// Standard unfurl/crawler User-Agent substrings. New crawlers occasionally need adding
// here; a missed one just falls through to the normal SPA (never a broken response).
const BOT_UA_SUBSTRINGS = [
  'twitterbot',
  'facebookexternalhit',
  'slackbot',
  'discordbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'googlebot',
  'bingbot',
  'applebot',
]

export function isCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BOT_UA_SUBSTRINGS.some((pattern) => ua.includes(pattern))
}
