import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'Validator',
      fileName: 'index.js',
    },
    rollupOptions: {
      input: 'index.ts',
      output: {
        entryFileNames: 'index.js',
        manualChunks: undefined,
      },
    },
  },
  test: {
    environment: 'jsdom',
    threads: false, // suppresses errors from canvas when starting tests
  }
})
