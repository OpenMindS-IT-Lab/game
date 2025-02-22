// import legacy from '@vitejs/plugin-legacy'
import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import removeConsole from 'vite-plugin-remove-console'

export default defineConfig({
  plugins: [nodePolyfills()],
  appType: 'spa',
  assetsInclude: ['app/**/assets/*', 'app/**/assets/**/*'],
  optimizeDeps: {
    force: true,
    include: ['node-stdlib-browser'],
    exclude: ['telegraf', 'server/*', 'types/*' /* , 'qs', 'node-stdlib-browser', 'fs/promises' */],
    holdUntilCrawlEnd: false,
  },
  build: {
    modulePreload: {
      polyfill: true,
    },
    target: [
      'esnext',
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
      'es2022',
      'esnext',
    ],
    emptyOutDir: true,
    minify: true,
    assetsDir: 'assets',
    rollupOptions: {
      external: [
        'lodash',
        'three',
        // 'express',
        // 'serverless-http',
        // 'telegraf',
        // 'qs',
        // 'node-stdlib-browser',
        // 'fs/promises',
      ],
      output: {
        esModule: 'if-default-prop',
        entryFileNames: '[name].js',
        chunkFileNames: 'lib/[hash].js',
        assetFileNames: 'assets/[ext]/[hash][extname]',
      },
    },
    copyPublicDir: true,
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    host: true,
    open: false,
    port: 5173,
    strictPort: true,
  },
} satisfies UserConfig)
