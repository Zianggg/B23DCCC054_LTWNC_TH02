// Ghi lại log redux-logger khi thêm, hoàn thành và xoá một bài (bản dev). Cách dùng: node capture-logger.mjs <url>
import puppeteer from 'puppeteer-core'

const base = process.argv[2] ?? 'http://localhost:5173'
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const lines = []
let depth = 0
page.on('console', async (msg) => {
  const type = msg.type()
  if (type === 'endGroup') {
    depth = Math.max(0, depth - 1)
    return
  }
  const args = msg.args()
  const format = args.length ? String(await args[0].jsonValue().catch(() => '')) : msg.text()
  if (!format.includes('%c') && !/action|state/.test(format)) return
  // Bỏ %c và các tham số CSS đi kèm; giữ phần chữ và object (nếu có).
  const cssCount = (format.match(/%c/g) ?? []).length
  const label = format.replace(/%c/g, '').trim()
  const rest = args.slice(1 + cssCount)
  let payload = ''
  if (rest.length) {
    const value = await rest[0].jsonValue().catch(() => undefined)
    if (value && typeof value === 'object') {
      payload = value.type
        ? JSON.stringify(value)
        : JSON.stringify({ assignments: { ...value.assignments, items: `[${value.assignments?.items?.length} bài]` } })
    }
  }
  lines.push(`${'  '.repeat(depth)}${label}${payload ? ' ' + payload : ''}`)
  if (type === 'startGroupCollapsed' || type === 'startGroup') depth += 1
})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await page.goto(base + '/', { waitUntil: 'networkidle0' })
await page.waitForSelector('article')
await wait(500)
lines.push('--- (thêm bài) ---')
const [addButton] = await page.$$('xpath/.//button[normalize-space()="Thêm bài tập"]')
await addButton.click()
await page.waitForSelector('[role="dialog"]')
await page.type('[role="dialog"] input[name="course"]', 'Hệ điều hành')
await page.type('[role="dialog"] input[name="title"]', 'Bài tập lập lịch CPU')
await page.$eval('[role="dialog"] input[name="dueDate"]', (el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, '2026-10-20')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
const [submit] = await page.$$('xpath/.//div[@role="dialog"]//button[@type="submit"]')
await submit.click()
await wait(600)
lines.push('--- (hoàn thành bài) ---')
await page.click('button[aria-label="Đánh dấu hoàn thành Bài tập lập lịch CPU"]')
await wait(600)
lines.push('--- (xoá bài) ---')
await page.click('button[aria-label="Xóa Bài tập lập lịch CPU"]')
await wait(600)
await browser.close()
console.log(lines.join('\n'))
