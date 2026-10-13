// Chạy Lighthouse 3 lần mỗi bản, xen kẽ trước/sau. Cách dùng: node lh-run.mjs <outDir> [số-lần]
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const cli = path.join(here, 'node_modules', 'lighthouse', 'cli', 'index.js')
const outDir = path.resolve(process.argv[2] ?? '../lighthouse')
const runs = Number(process.argv[3] ?? 3)
fs.mkdirSync(outDir, { recursive: true })

const variants = [
  ['before', 'http://localhost:4174/?stress'],
  ['after', 'http://localhost:4173/?stress'],
]

for (let run = 1; run <= runs; run += 1) {
  for (const [name, url] of variants) {
    const started = Date.now()
    execFileSync(
      process.execPath,
      [
        cli,
        url,
        '--only-categories=performance',
        '--output=json',
        '--output=html',
        `--output-path=${path.join(outDir, `${name}-${run}`)}`,
        '--chrome-flags=--headless=new --no-first-run --no-default-browser-check',
        '--max-wait-for-load=120000',
        '--quiet',
      ],
      { stdio: 'inherit', env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' } },
    )
    console.log(`${name}-${run}: ${Math.round((Date.now() - started) / 1000)} s`)
  }
}
