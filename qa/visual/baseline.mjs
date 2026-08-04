// Standalone Playwright visual QA harness for aitime-calc.
// Targets the RUNNING app by URL — never imports web/ or api/.
// One-command rerun:  npm run baseline   (or: node baseline.mjs)
// Env overrides: WEB_URL (default http://localhost:5176), API_URL (default http://localhost:3001),
//                OUT (default ./out), LABEL (subfolder tag, default "main").
//
// Reuse on a feature branch: point WEB_URL at that build and diff the reports/screenshots.

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const WEB = (process.env.WEB_URL || 'http://localhost:5176').replace(/\/$/, '')
const API = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
const LABEL = process.env.LABEL || 'main'
const OUT = join(process.env.OUT || './out', LABEL)
const SHOTS = join(OUT, 'screens')
mkdirSync(SHOTS, { recursive: true })

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'timeline', path: '/timeline' },
  { name: 'compare', path: '/compare?tool=gpt-2&vs=gpt-3-api' },
  { name: 'embed', path: '/embed?tool=gpt-2' },
  { name: 'methodology', path: '/methodology' },
]

const THEMES = ['dark', 'light']
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
]

// Console noise that is NOT an app defect — kept explicit so the failure list stays honest.
const IGNORE_CONSOLE = [
  /favicon/i,
  /React DevTools/i,
  /Download the React DevTools/i,
  /\[vite\]/i, // HMR chatter on the dev server
]

function isNoise(text) {
  return IGNORE_CONSOLE.some((re) => re.test(text))
}

const results = []
const errorsByPage = {} // key -> [messages]

async function preflight() {
  const checks = []
  for (const [label, url] of [['web', WEB + '/'], ['api', API + '/api/health']]) {
    try {
      const r = await fetch(url)
      checks.push({ label, url, ok: r.ok, status: r.status })
    } catch (e) {
      checks.push({ label, url, ok: false, status: 0, error: String(e) })
    }
  }
  return checks
}

function attachConsole(page, key) {
  errorsByPage[key] = errorsByPage[key] || []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text()
      if (!isNoise(t)) errorsByPage[key].push(`console.error: ${t}`)
    }
  })
  page.on('pageerror', (err) => {
    errorsByPage[key].push(`pageerror: ${err.message}`)
  })
  page.on('requestfailed', (req) => {
    const f = req.failure()
    const t = `requestfailed: ${req.url()} ${f ? f.errorText : ''}`
    if (!isNoise(t)) errorsByPage[key].push(t)
  })
}

async function sweep(browser) {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        colorScheme: theme,
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      })
      for (const route of ROUTES) {
        const key = `${route.name}__${theme}__${vp.name}`
        const page = await ctx.newPage()
        attachConsole(page, key)
        let status = 'PASS'
        let note = ''
        try {
          const resp = await page.goto(WEB + route.path, { waitUntil: 'networkidle', timeout: 20000 })
          if (resp && resp.status() >= 400) { status = 'FAIL'; note = `http ${resp.status()}` }
          // give client render + count-up a beat to settle before the shot
          await page.waitForTimeout(600)
          await page.screenshot({ path: join(SHOTS, `${key}.png`), fullPage: true })
        } catch (e) {
          status = 'FAIL'
          note = String(e).split('\n')[0]
        }
        const errs = errorsByPage[key] || []
        if (errs.length) { status = 'FAIL'; note = (note ? note + '; ' : '') + `${errs.length} console err` }
        results.push({ kind: 'route', key, route: route.path, theme, viewport: vp.name, status, note, errors: errs })
        await page.close()
      }
      await ctx.close()
    }
  }
}

// ---- click-through (functional interaction), run once on desktop/light ----
async function clickThrough(browser) {
  const ctx = await browser.newContext({ colorScheme: 'light', viewport: { width: 1280, height: 800 }, acceptDownloads: true })

  // 1. Leaderboard: sort toggle changes the caption, exports download real content.
  {
    const key = 'ct-leaderboard'
    const page = await ctx.newPage()
    attachConsole(page, key)
    const steps = []
    try {
      await page.goto(WEB + '/leaderboard', { waitUntil: 'networkidle', timeout: 20000 })
      await page.locator('table.lb-table tbody tr').first().waitFor({ timeout: 10000 })
      const capBefore = await page.locator('caption.lb-caption').textContent()
      await page.getByRole('button', { name: /Human-equiv years/i }).click()
      await page.waitForTimeout(200)
      const capAfter = await page.locator('caption.lb-caption').textContent()
      steps.push({ step: 'sort toggle', ok: capBefore !== capAfter, detail: `"${capBefore?.trim()}" -> "${capAfter?.trim()}"` })

      for (const kind of ['CSV', 'JSON']) {
        const dl = page.waitForEvent('download', { timeout: 10000 })
        await page.getByRole('button', { name: new RegExp(`^${kind}$`) }).click()
        const download = await dl
        const fname = download.suggestedFilename()
        const saveTo = join(OUT, 'downloads', fname)
        mkdirSync(join(OUT, 'downloads'), { recursive: true })
        await download.saveAs(saveTo)
        const body = readFileSync(saveTo, 'utf8')
        let ok = false, detail = ''
        if (kind === 'CSV') {
          ok = /^rank,tool_id,name,/.test(body) && body.split('\r\n').length > 3
          detail = `${body.length} bytes, header=${body.slice(0, 24)}`
        } else {
          const j = JSON.parse(body)
          ok = Array.isArray(j.entries) && j.entries.length > 0 && typeof j.count === 'number'
          detail = `count=${j.count} entries=${j.entries?.length}`
        }
        steps.push({ step: `export ${kind}`, ok, detail: `${fname}: ${detail}` })
      }
    } catch (e) {
      steps.push({ step: 'exception', ok: false, detail: String(e).split('\n')[0] })
    }
    const errs = errorsByPage[key] || []
    const status = steps.every((s) => s.ok) && !errs.length ? 'PASS' : 'FAIL'
    results.push({ kind: 'clickthrough', key, status, steps, errors: errs })
    await page.close()
  }

  // 2. Home tool picker: open combobox, pick an option, hero result updates.
  {
    const key = 'ct-home-picker'
    const page = await ctx.newPage()
    attachConsole(page, key)
    const steps = []
    try {
      await page.goto(WEB + '/', { waitUntil: 'networkidle', timeout: 20000 })
      const combo = page.getByRole('combobox').first()
      await combo.waitFor({ timeout: 10000 })
      await combo.click()
      const listbox = page.locator('ul.tool-listbox')
      await listbox.waitFor({ timeout: 5000 })
      const optCount = await page.getByRole('option').count()
      steps.push({ step: 'listbox opens', ok: optCount > 0, detail: `${optCount} options` })
      const heroBefore = await page.locator('.result-hero, [class*="hero"]').first().textContent().catch(() => '')
      await page.getByRole('option').nth(Math.min(3, optCount - 1)).click()
      await page.waitForTimeout(800)
      const heroAfter = await page.locator('.result-hero, [class*="hero"]').first().textContent().catch(() => '')
      steps.push({ step: 'pick updates hero', ok: !!heroAfter && heroAfter !== heroBefore, detail: `"${(heroBefore||'').trim().slice(0,40)}" -> "${(heroAfter||'').trim().slice(0,40)}"` })
    } catch (e) {
      steps.push({ step: 'exception', ok: false, detail: String(e).split('\n')[0] })
    }
    const errs = errorsByPage[key] || []
    const status = steps.every((s) => s.ok) && !errs.length ? 'PASS' : 'FAIL'
    results.push({ kind: 'clickthrough', key, status, steps, errors: errs })
    await page.close()
  }

  await ctx.close()
}

async function main() {
  const pre = await preflight()
  const preOk = pre.every((c) => c.ok)
  if (!preOk) {
    console.error('PREFLIGHT FAILED — app not reachable:')
    console.error(JSON.stringify(pre, null, 2))
    console.error(`\nStart the app then rerun. web=${WEB} api=${API}`)
    mkdirSync(OUT, { recursive: true })
    writeFileSync(join(OUT, 'report.json'), JSON.stringify({ preflight: pre, results: [] }, null, 2))
    process.exit(2)
  }

  const browser = await chromium.launch()
  try {
    await sweep(browser)
    await clickThrough(browser)
  } finally {
    await browser.close()
  }

  const fails = results.filter((r) => r.status === 'FAIL')
  const report = {
    label: LABEL,
    web: WEB,
    api: API,
    ran_at: new Date().toISOString(),
    preflight: pre,
    totals: { total: results.length, pass: results.length - fails.length, fail: fails.length },
    results,
  }
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  // human summary
  console.log(`\n=== aitime-calc visual baseline [${LABEL}] ===`)
  console.log(`web=${WEB} api=${API}`)
  console.log(`screens: ${SHOTS}`)
  for (const r of results) {
    const mark = r.status === 'PASS' ? 'PASS' : 'FAIL'
    const extra = r.kind === 'clickthrough' ? ` (${r.steps.map((s) => `${s.step}:${s.ok ? 'ok' : 'NO'}`).join(', ')})` : (r.note ? ` — ${r.note}` : '')
    console.log(`[${mark}] ${r.key}${extra}`)
    if (r.errors && r.errors.length) r.errors.forEach((e) => console.log(`         ! ${e}`))
  }
  console.log(`\nTOTAL ${report.totals.pass}/${report.totals.total} PASS, ${report.totals.fail} FAIL`)
  console.log(`report: ${join(OUT, 'report.json')}`)
  process.exit(fails.length ? 1 : 0)
}

main()
