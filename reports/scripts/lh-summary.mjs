// Tóm tắt các report Lighthouse: điểm, chỉ số chính, trung vị theo TBT. Cách dùng: node lh-summary.mjs <dir>
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve(process.argv[2] ?? '../lighthouse')
const files = fs.readdirSync(dir).filter((f) => /^(before|after)-\d+\.report\.json$/.test(f)).sort()

const pick = (lhr, id) => lhr.audits[id]
const rows = files.map((file) => {
  const lhr = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const [variant, run] = file.replace('.report.json', '').split('-')
  const num = (id) => pick(lhr, id)?.numericValue
  return {
    file,
    variant,
    run: Number(run),
    score: Math.round((lhr.categories.performance.score ?? 0) * 100),
    fcp: num('first-contentful-paint'),
    lcp: num('largest-contentful-paint'),
    tbt: num('total-blocking-time'),
    cls: num('cumulative-layout-shift'),
    si: num('speed-index'),
    tti: num('interactive'),
    domSize: num('dom-size') ?? num('dom-size-insight'),
    mainThread: num('mainthread-work-breakdown'),
    bootup: num('bootup-time'),
    bytes: num('total-byte-weight'),
    runtimeError: lhr.runtimeError?.message,
    warnings: lhr.runWarnings,
    lighthouseVersion: lhr.lighthouseVersion,
    formFactor: lhr.configSettings.formFactor,
    throttling: lhr.configSettings.throttlingMethod,
  }
})

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const summary = {}
for (const variant of ['before', 'after']) {
  const list = rows.filter((r) => r.variant === variant)
  if (!list.length) continue
  const medianTbt = median(list.map((r) => r.tbt))
  summary[variant] = {
    runs: list.map(({ run, score, fcp, lcp, tbt, cls, si, tti, domSize, mainThread, bootup, bytes, runtimeError }) => ({
      run, score, fcp: Math.round(fcp), lcp: Math.round(lcp), tbt: Math.round(tbt), cls, si: Math.round(si),
      tti: tti && Math.round(tti), domSize, mainThread: Math.round(mainThread), bootup: Math.round(bootup), bytes, runtimeError,
    })),
    medianRunByTbt: list.find((r) => r.tbt === medianTbt)?.file,
    median: Object.fromEntries(['score', 'fcp', 'lcp', 'tbt', 'cls', 'si', 'tti', 'domSize', 'mainThread', 'bootup', 'bytes'].map((k) => [k, median(list.map((r) => r[k] ?? 0))])),
  }
}
summary.meta = { lighthouseVersion: rows[0]?.lighthouseVersion, formFactor: rows[0]?.formFactor, throttling: rows[0]?.throttling, warnings: [...new Set(rows.flatMap((r) => r.warnings ?? []))] }
console.log(JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2))
