import test from 'node:test'
import assert from 'node:assert/strict'
import { parseReceipt, checksumMismatch, formatBytes } from '../src/utils/upgrade-protocol.mjs'
const md5 = 'd41d8cd98f00b204e9800998ecf8427e'
test('parse U-Boot upload receipt with optional layout', () => {
  assert.deepEqual(parseReceipt(`4096 ${md5} default`), { size: 4096, md5, layout: 'default' })
  assert.equal(parseReceipt(`4096 ${md5}`).layout, '')
})
test('reject failures and malformed receipts before any write', () => {
  for (const body of ['fail\ncode:-1\nerror:wrong image', '<html>404</html>', '0 x', '-1 '+md5, 'NaN '+md5, '4096 invalid']) assert.throws(() => parseReceipt(body))
})
test('compare checksum in image filename, case-insensitively', () => {
  assert.equal(checksumMismatch(`image_md5-${md5.toUpperCase()}.bin`, md5), false)
  assert.equal(checksumMismatch('image_md5-00000000000000000000000000000000.bin', md5), true)
  assert.equal(checksumMismatch('image.bin', md5), false)
})
test('format sizes and missing data', () => {
  assert.equal(formatBytes(undefined), '—')
  assert.equal(formatBytes(1024), '1 KiB')
  assert.equal(formatBytes(256 * 1024 ** 2), '256 MiB')
})
