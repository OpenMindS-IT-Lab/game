// import legacy from '@vitejs/plugin-legacy'
// import TurboConsole from 'unplugin-turbo-console/vite'
import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { qrcode } from 'vite-plugin-qrcode'
// import removeConsole from 'vite-plugin-remove-console'

export default defineConfig({
  plugins: [
    qrcode({
      filter: url => url.startsWith('http://192.168'),
    }),
    // TurboConsole({
    //   specifiedEditor: 'code',
    //   extendedPathFileNames: ['index'],
    //   prefix: `\\r\\n[${new Date().toLocaleString()}]`,
    //   suffix: '\\r\\n',
    //   disablePassLogs: true,
    //   disableHighlight: true,
    // silent: true,
    // }),
    nodePolyfills(),
  ],
  appType: 'spa',
  assetsInclude: ['src/**/assets/*'],
  optimizeDeps: {
    include: ['src/app/**/*.ts', 'src/app/*.ts'],
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
    assetsDir: '.',
    rollupOptions: {
      external: ['node_modules'],
      input: {
        app: 'index.html',
        api: 'src/api/api.ts',
      },
      output: {
        esModule: 'if-default-prop',
        entryFileNames: '[name]/index-[hash].js',
        // manualChunks: {
        //   three: ['three'],
        // },
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
  },
  preview: {
    host: true,
    open: true,
  },
} satisfies UserConfig)
