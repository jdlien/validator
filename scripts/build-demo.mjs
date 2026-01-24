import { build } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const cssEntry = path.join(root, 'demo', 'demo-css.ts')
const cssOutput = path.join(root, 'demo', 'demo-css.js')
const devHtmlPath = path.join(root, 'demo', 'index.dev.html')
const outHtmlPath = path.join(root, 'demo', 'index.html')

await build({
  configFile: false,
  root,
  plugins: [tailwindcss()],
  logLevel: 'warn',
  build: {
    outDir: 'demo',
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: cssEntry,
      name: 'DemoStyles',
      fileName: () => 'demo-css',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'demo.css',
        entryFileNames: 'demo-css.js',
      },
    },
  },
})

if (existsSync(cssOutput)) {
  await unlink(cssOutput)
}

const devHtml = await readFile(devHtmlPath, 'utf8')

let outHtml = devHtml
  .replace(/demo-src\.css/g, 'demo.css')
  .replace(/form-field\.ts/g, 'form-field.js')
  .replace(/dark-toggle\.ts/g, 'dark-toggle.js')

outHtml = outHtml.replace(
  /^\s*import Validator from ['"]..\/index\.ts['"];?\s*\n/m,
  ''
)

outHtml = outHtml.replace(
  /^(\s*)<script type="module">/m,
  '$1<script src="../dist/validator.js"></script>\n$1<script type="module">'
)

await writeFile(outHtmlPath, outHtml)
