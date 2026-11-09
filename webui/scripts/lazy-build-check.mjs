import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'

const browser = await chromium.launch()
for (const [index, outDir] of ['dist', 'dist-no-i18n'].entries()) {
  const port = 5174 + index
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', outDir, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  try {
    for (let retry = 0; retry < 40; retry++) {
      try { if ((await fetch(`http://localhost:${port}`)).ok) break } catch {}
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const page = await browser.newPage({ locale: 'zh-CN' })
    const requests = [], errors = []
    page.on('request', request => requests.push(new URL(request.url()).pathname))
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`http://localhost:${port}/?demo=1`)
    await page.getByRole('heading', { name: '固件更新', exact: true }).waitFor()
    assert.equal(requests.some(path => /ConsolePage|FlashPage|UbiPage/.test(path)), false)
    assert.ok(gzipSync(await readFile(`${outDir}/app.js`)).length < 190000, 'Recovery entry gzip budget exceeded')
    await page.getByRole('menuitem', { name: 'U-Boot 终端', exact: true }).click()
    await page.locator('.xterm').waitFor()
    assert.equal(requests.some(path => /ConsolePage/.test(path)), true)
    await page.getByRole('menuitem', { name: 'Flash 工具', exact: true }).click()
    await page.getByRole('heading', { name: 'Flash 工具', exact: true, level: 1 }).waitFor()
    assert.equal(requests.some(path => /FlashPage/.test(path)), true)
    assert.deepEqual(errors, [])
    if (index) assert.equal(await page.getByRole('button', { name: 'Language / 语言' }).count(), 0)
    const allowlist = await readFile('../uboot-mtk-20250711/failsafe/embedded/fsdata-bootstrap/vue/assets.h', 'utf8')
    for (const path of requests.filter(path => path.startsWith('/assets/'))) assert.ok(allowlist.includes(`"${path}"`), `Missing embedded route: ${path}`)
    await page.close()
    console.log(`${outDir}: recovery entry budget, lazy console/flash, firmware asset allowlist passed.`)
  } finally { server.kill() }
}
await browser.close()
