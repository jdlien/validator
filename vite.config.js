import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: { include: ['@jdlien/validator-utils'] },
  build: {
    lib: { entry: 'index.ts', name: 'Validator', fileName: 'validator' },
    rollupOptions: {
      input: 'index.ts',
      output: { entryFileNames: 'validator.js', manualChunks: undefined },
    },
  },
  ts: { declaration: true, declarationDir: 'dist', declarationMap: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: { reporter: ['text', 'json', 'html'] },
    threads: false, // suppresses errors from canvas when starting tests
    server: {
      deps: { inline: ['@jdlien/validator-utils'] },
    },
  },
})
