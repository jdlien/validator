import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const skipBuild = args.has('--skip-build')

if (!skipBuild) {
  const result = spawnSync('pnpm', ['-s', 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const targetPath = resolve(rootDir, 'dist/validator.js')
const buffer = await readFile(targetPath)

const sizes = {
  raw: buffer.byteLength,
  gzip: gzipSync(buffer, { level: 9 }).byteLength,
  brotli: brotliCompressSync(buffer, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).byteLength,
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  const kib = bytes / 1024
  if (kib < 1024) return `${kib.toFixed(2)} KiB`
  return `${(kib / 1024).toFixed(2)} MiB`
}

console.log(`Target: ${targetPath}`)
console.log(`Raw: ${formatBytes(sizes.raw)}`)
console.log(`Gzip: ${formatBytes(sizes.gzip)}`)
console.log(`Brotli: ${formatBytes(sizes.brotli)}`)
