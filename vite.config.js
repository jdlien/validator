import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    include: ['@jdlien/validator-utils'],
  },
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
  ts: {
    declaration: true,
    declarationDir: 'dist',
    declarationMap: true,
  },
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    threads: false, // suppresses errors from canvas when starting tests
    deps: {
      // external: ['@jdlien/validator-utils'],
      inline: ['@jdlien/validator-utils'],
    },
  }
})
