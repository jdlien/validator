import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const isCompatBuild = mode === 'compat'

  return {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['@jdlien/validator-utils'] },
    build: {
      emptyOutDir: !isCompatBuild,
      lib: {
        entry: isCompatBuild ? 'index.umd.ts' : 'index.ts',
        name: 'Validator',
        formats: isCompatBuild ? ['cjs', 'umd'] : ['es'],
        fileName: (format) => {
          if (format === 'es') return 'validator.mjs'
          if (format === 'cjs') return 'validator.cjs'
          return 'validator.js'
        },
      },
      rollupOptions: {
        output: {
          exports: isCompatBuild ? 'default' : 'named',
          manualChunks: undefined,
        },
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
  }
})
