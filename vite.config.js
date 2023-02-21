import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'Validator',
      fileName: 'validator',
    },
    rollupOptions: {
      input: 'index.ts',
      output: {
        entryFileNames: 'validator.js',
        manualChunks: undefined,
      },
    },
  },
  test: {
    environment: 'jsdom',
    threads: false, // suppresses errors from canvas when starting tests
  }
})
