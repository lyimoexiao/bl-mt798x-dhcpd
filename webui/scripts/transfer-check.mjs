import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
const browser = await chromium.launch()
const page = await browser.newPage({ locale: 'zh-CN' })
await page.goto('http://localhost:5173/?demo=1')
const result = await page.evaluate(async () => {
  const { downloadBackup } = await import('/src/services/transfer.ts')
  const oldFetch = window.fetch
  let requested = 0, closed = 0, aborted = 0, written = 0
  window.fetch = async () => { requested++; return new Response(new Uint8Array([1, 2, 3, 4]), { headers: { 'Content-Length': '4' } }) }
  window.showSaveFilePicker = async () => { throw new DOMException('cancel', 'AbortError') }
  const cancelled = await downloadBackup({ path: '/test', values: {}, fallback: 'backup.bin', board: 'Test', progress() {} })
  const requestsAfterCancel = requested
  window.showSaveFilePicker = async () => ({ async createWritable() { return { async write(data) { written += data.length }, async close() { closed++ }, async abort() { aborted++ } } } })
  let percent = 0
  await downloadBackup({ path: '/test', values: {}, fallback: 'backup.bin', board: 'Test', progress(value) { percent = value.percent } })
  window.showSaveFilePicker = async () => ({ async createWritable() { return { async write() { throw new Error('Disk full') }, async close() { closed++ }, async abort() { aborted++ } } } })
  let diskError = false
  try { await downloadBackup({ path: '/test', values: {}, fallback: 'backup.bin', board: 'Test', progress() {} }) } catch { diskError = true }
  window.fetch = oldFetch
  return { cancelled, requestsAfterCancel, written, closed, aborted, percent, diskError }
})
assert.deepEqual(result, { cancelled: false, requestsAfterCancel: 0, written: 4, closed: 1, aborted: 1, percent: 100, diskError: true })
console.log('Streaming tests passed: picker cancellation sends no request; bytes go directly to writer; disk errors abort the writer.')
await browser.close()
