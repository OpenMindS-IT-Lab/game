import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: [
      'chrome58',
      'firefox57',
      'safari11',
      'edge79',
      'ios11.2',
      'node8',
      'es2015',
      'es2016',
      'es2017',
      'es2018',
      'es2019',
      'es2020',
    ],
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
    open: true,
  },
} satisfies UserConfig)
