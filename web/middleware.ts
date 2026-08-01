import { next } from '@vercel/edge'
import { isCrawlerUserAgent } from './src/lib/botDetect'
import { buildCrawlerCardMeta, buildCrawlerHtml } from './src/lib/crawlerCard'

// Root only: this SPA has a single route ('/'), shared links only ever carry query
// params on it. Static assets (/assets/*) and any future non-root path never match,
// so this middleware only ever runs on the one path that can carry share params.
export const config = {
  matcher: '/',
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent')
  if (!isCrawlerUserAgent(userAgent)) {
    return next()
  }

  const url = new URL(request.url)
  const apiBase = (process.env.VITE_API_URL ?? '').replace(/\/$/, '')
  const meta = await buildCrawlerCardMeta(apiBase, url.search)
  const html = buildCrawlerHtml(meta, url.toString())

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
