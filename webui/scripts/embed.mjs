import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../../', import.meta.url))
const output = resolve(root, 'uboot-mtk-20250711/failsafe/embedded/fsdata-bootstrap/vue')
await mkdir(output, { recursive: true })
// Prebuild both Kconfig variants; firmware compilation still needs no npm toolchain.
execFileSync(process.execPath, [resolve(root, 'webui/node_modules/vite/bin/vite.js'), 'build', '--outDir', 'dist-no-i18n'], { cwd: resolve(root, 'webui'), env: { ...process.env, WEBUI_I18N: '0' }, stdio: 'inherit' })
await copyFile(resolve(root, 'webui/dist-no-i18n/app.js'), resolve(output, 'app-no-i18n.js'))
for (const file of ['index.html', 'app.js', 'app.css']) {
  await copyFile(resolve(root, 'webui/dist', file), resolve(output, file))
  const data = await readFile(resolve(output, file))
  console.log(`${file}: ${data.length} bytes / ${gzipSync(data, { level: 9 }).length} bytes gzip`)
}
