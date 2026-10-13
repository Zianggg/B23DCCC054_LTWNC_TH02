// Đếm số lần render từng component giống React DevTools Profiler (cờ PerformedWork trên fiber).
// Cách dùng: node measure-renders.mjs <url-không-có-query> <nhãn> [số-lần]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const base = process.argv[2]
const label = process.argv[3] ?? 'run'
const runs = Number(process.argv[4] ?? 3)

// Chạy trong trang, trước mọi script của app.
const HOOK = () => {
  const PERFORMED_WORK = 1
  const COMPONENT_TAGS = new Set([0, 1, 11, 15]) // Function, Class, ForwardRef, SimpleMemo
  const state = { commits: 0, renders: new Map(), durations: [], recording: true }
  window.__renderStats = state
  const nameOf = (fiber) => {
    const type = fiber.type
    if (typeof type === 'function') return type.displayName || type.name || 'Anonymous'
    if (type && typeof type === 'object') return type.displayName || type.render?.displayName || type.render?.name || 'Anonymous'
    return String(type)
  }
  const walk = (next, prev) => {
    if (COMPONENT_TAGS.has(next.tag) && (prev === null || (next.flags & PERFORMED_WORK) === PERFORMED_WORK)) {
      const name = nameOf(next)
      state.renders.set(name, (state.renders.get(name) ?? 0) + 1)
    }
    if (prev !== null && next.child === prev.child) return // bail out: cả nhánh dùng lại, không render
    for (let child = next.child; child; child = child.sibling) walk(child, prev === null ? null : child.alternate)
  }
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(),
    supportsFiber: true,
    isDisabled: false,
    inject(renderer) {
      const id = this.renderers.size + 1
      this.renderers.set(id, renderer)
      return id
    },
    checkDCE() {},
    onScheduleFiberRoot() {},
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onCommitFiberRoot(_id, root) {
      if (!state.recording) return
      state.commits += 1
      const current = root.current
      walk(current, current.alternate)
      if (typeof current.actualDuration === 'number') state.durations.push(current.actualDuration)
    },
  }
  // Độ trễ tương tác (Event Timing API, cơ sở của chỉ số INP).
  state.events = []
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) state.events.push({ name: entry.name, duration: entry.duration })
  }).observe({ type: 'event', durationThreshold: 16, buffered: true })
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function reset(page) {
  await page.evaluate(() => {
    const s = window.__renderStats
    s.commits = 0
    s.renders = new Map()
    s.durations = []
    s.events = []
  })
}

async function read(page) {
  return page.evaluate(() => {
    const s = window.__renderStats
    const durations = s.durations
    const interactions = s.events.filter((e) => ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'click', 'input'].includes(e.name))
    return {
      commits: s.commits,
      renders: Object.fromEntries([...s.renders.entries()].sort((a, b) => b[1] - a[1])),
      renderMsTotal: Math.round(durations.reduce((a, b) => a + b, 0)),
      renderMsMax: Math.round(durations.length ? Math.max(...durations) : 0),
      slowestEventMs: Math.round(interactions.length ? Math.max(...interactions.map((e) => e.duration)) : 0),
      cards: s.renders.get('AssignmentCard') ?? 0,
      dom: document.querySelectorAll('*').length,
      articles: document.querySelectorAll('article').length,
    }
  })
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  protocolTimeout: 600_000,
  args: ['--no-first-run', '--no-default-browser-check'],
})

const results = []
for (let run = 1; run <= runs; run += 1) {
  const page = await browser.newPage()
  page.setDefaultTimeout(600_000)
  await page.setViewport({ width: 1440, height: 900 })
  await page.evaluateOnNewDocument(HOOK)
  await page.evaluateOnNewDocument(() => localStorage.setItem('deadline-tracker-theme', 'light'))
  const consoleWarnings = []
  page.on('console', (msg) => {
    if (msg.type() === 'warn' || msg.type() === 'warning' || msg.type() === 'error') consoleWarnings.push(msg.text().slice(0, 160))
  })

  // 1. Mở trang với 10.000 bài
  await reset(page).catch(() => {})
  const t0 = Date.now()
  await page.goto(`${base}/?stress`, { waitUntil: 'load' })
  await page.waitForFunction(() => document.body.innerText.includes('10.000 bài tập') || document.body.innerText.includes('trên 10.000'))
  await wait(1500)
  const mount = await read(page)
  mount.wallMs = Date.now() - t0

  // 2. Gõ "web" vào ô tìm kiếm, 150 ms mỗi phím
  await reset(page)
  await page.click('input[type="search"]')
  const t1 = Date.now()
  await page.keyboard.type('web', { delay: 150 })
  await page.waitForFunction(() => /1\.250\s*(<\/strong>)?\s*trên/.test(document.body.innerHTML) || document.body.innerText.includes('Hiển thị 1.250'))
  await wait(1200)
  const typing = await read(page)
  typing.wallMs = Date.now() - t1

  // 3. Xoá từ khoá để về đủ 10.000 bài
  await page.click('button[aria-label="Xóa từ khoá"]')
  await page.waitForFunction(() => document.body.innerText.includes('10.000 bài tập') || document.body.innerText.includes('trên 10.000') && !document.body.innerText.includes('Hiển thị 1.250'))
  await wait(1500)

  // 4. Đánh dấu hoàn thành bài thứ hai trong danh sách
  await reset(page)
  const t3 = Date.now()
  const doneButtons = await page.$$('article button[aria-label^="Đánh dấu hoàn thành"]')
  await doneButtons[0].click()
  await wait(1500)
  const complete = await read(page)
  complete.wallMs = Date.now() - t3

  // 5. Ghim bài đầu tiên
  await reset(page)
  const pinButtons = await page.$$('article button[aria-pressed="false"]')
  await pinButtons[1].click()
  await wait(1500)
  const pin = await read(page)

  // 6. Đổi theme
  await reset(page)
  await page.click('button[aria-label^="Chuyển sang giao diện"]')
  await wait(800)
  const theme = await read(page)

  results.push({ run, mount, typing, complete, pin, theme, consoleWarnings: [...new Set(consoleWarnings)].slice(0, 8) })
  await page.close()
  console.error(`[${label}] run ${run}: mount cards=${mount.cards}, typing cards=${typing.cards} (commits ${typing.commits}, render ${typing.renderMsTotal} ms, slowest event ${typing.slowestEventMs} ms), complete cards=${complete.cards}, pin cards=${pin.cards}, theme=${JSON.stringify(theme.renders)}`)
}

await browser.close()
const outDir = process.env.OUT_DIR ?? '.'
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(`${outDir}/renders-${label}.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results.map(({ run, mount, typing, complete, pin, theme }) => ({ run, mount, typing, complete, pin, theme })), null, 1))
