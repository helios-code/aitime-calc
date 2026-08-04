// Objective layout-break probe: horizontal overflow (off-screen / clipped content)
// and offscreen interactive elements. Complements baseline.mjs.
// Run:  npm run overflow   (or: WEB_URL=http://localhost:5176 node overflow.mjs)
//
// Note: a horizontally-scrollable container (overflow-x:auto) legitimately produces
// "bleeders" wider than the viewport (wide tables, charts). docOverflow>2 means the
// PAGE itself scrolls sideways (a real break); offscreen interactive elements mean a
// control is unreachable without scrolling. Read both, not just the CHECK flag.
import { chromium } from 'playwright'

const WEB = (process.env.WEB_URL || 'http://localhost:5176').replace(/\/$/, '')
const ROUTES = ['/', '/leaderboard', '/timeline', '/compare?tool=gpt-2&vs=gpt-3-api', '/embed?tool=gpt-2', '/methodology']
const VPS = [{ name: 'desktop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }]

const browser = await chromium.launch()
const out = []
for (const theme of ['dark', 'light']) {
  for (const vp of VPS) {
    const ctx = await browser.newContext({ colorScheme: theme, viewport: { width: vp.width, height: vp.height } })
    for (const route of ROUTES) {
      const page = await ctx.newPage()
      await page.goto(WEB + route, { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(500)
      const data = await page.evaluate((vw) => {
        const de = document.documentElement
        const docOverflow = de.scrollWidth - de.clientWidth
        const bleeders = []
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > vw + 2 || r.left < -2) {
            bleeders.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40), right: Math.round(r.right), left: Math.round(r.left) })
          }
        }
        const offscreen = []
        for (const el of document.querySelectorAll('a,button,[role=button],[role=tab],[role=option],input,select')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) continue
          if (r.right < 0 || r.left > vw || r.bottom < 0) offscreen.push((el.tagName + '.' + (el.className || '')).slice(0, 40))
        }
        return { docOverflow, bleeders: bleeders.slice(0, 8), bleederCount: bleeders.length, offscreen: offscreen.slice(0, 6) }
      }, vp.width)
      const bad = data.docOverflow > 2 || data.offscreen.length > 0
      out.push({ route, theme, vp: vp.name, ...data, verdict: bad ? 'CHECK' : 'ok' })
      await page.close()
    }
    await ctx.close()
  }
}
await browser.close()
for (const r of out) {
  console.log(`[${r.verdict}] ${r.route} ${r.theme}/${r.vp} docOverflow=${r.docOverflow} bleeders=${r.bleederCount} offscreen=${r.offscreen.length}`)
  if (r.verdict === 'CHECK') {
    if (r.bleeders.length) console.log('     bleeders:', JSON.stringify(r.bleeders))
    if (r.offscreen.length) console.log('     offscreen:', JSON.stringify(r.offscreen))
  }
}
const checks = out.filter((r) => r.verdict === 'CHECK')
console.log(`\n${out.length - checks.length}/${out.length} clean, ${checks.length} to CHECK (docOverflow>2 or an interactive control offscreen)`)
process.exit(0)
