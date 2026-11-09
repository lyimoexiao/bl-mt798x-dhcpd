import test from 'node:test'
import assert from 'node:assert/strict'
import { backupName, parseBackupName, rangeFilename } from '../src/utils/backup-name.ts'
import { restorePlan } from '../src/features/flash/restore-plan.ts'

test('backup name matches old board/date policy without duplicate prefixes', () => {
  const date = new Date(2026, 2, 9)
  assert.equal(backupName('backup_mtd_spi-nand0_Factory_0x0-0x200.bin', 'Test Board', date), 'backup_Test_Board_mtd_spi-nand0_Factory_0x0-0x200_20260309.bin')
  const name = backupName('backup_mtd_Factory_0x0-0x200.bin', 'Test Board', date)
  assert.equal(backupName(name, 'Test Board', date), name)
})
test('identify normal and OOB names, including targets containing underscores', () => {
  assert.deepEqual(parseBackupName('backup_Board_mtd_chip_u_boot_env_oob_0x0-0x42000_20260309.bin', ['mtd:u_boot_env']), { storage: 'mtd', target: 'u_boot_env', start: 0, end: 0x42000, raw: true })
  assert.equal(parseBackupName('backup.bin'), undefined)
  assert.equal(parseBackupName('backup_mtd_a_0x20-0x10.bin'), undefined)
  assert.equal(rangeFilename('mmc:rootfs', 0, 512), 'backup_mmc_rootfs_0x0-0x200.bin')
})
test('OOB restore chunks align to erase blocks and never overlap', () => {
  const target = { size: 0x8400000, raw: true, rawBlockSize: 0x21000 }
  const chunks = restorePlan(target, 0, 0x840000, 0x840000)
  assert.ok(chunks.length > 1)
  for (let index = 0; index < chunks.length; index++) {
    assert.equal(chunks[index].start % target.rawBlockSize, 0)
    assert.equal(chunks[index].limit % target.rawBlockSize, 0)
    if (index) assert.equal(chunks[index].start, chunks[index - 1].limit)
  }
  assert.throws(() => restorePlan(target, 1, 0x21001, 0x21000))
  assert.throws(() => restorePlan({ ...target, rawBlockSize: undefined }, 0, 512, 512))
  assert.throws(() => restorePlan(target, 0, 0x21000, 10))
})
test('normal restore chunks cannot re-erase a prior chunk', () => {
  const chunks = restorePlan({ raw: false, size: 20 * 1024 ** 2, eraseSize: 128 * 1024 }, 0, 10 * 1024 ** 2, 10 * 1024 ** 2)
  assert.equal(chunks.length, 3)
  assert.equal(chunks[1].start, 4 * 1024 ** 2)
})
