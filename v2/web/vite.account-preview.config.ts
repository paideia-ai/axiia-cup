import { defineConfig, mergeConfig } from 'vite'
import appConfig from './vite.config'

// Reuse the product's same-origin API proxy and HttpOnly cookie handling.
export default mergeConfig(
  appConfig,
  defineConfig({
    cacheDir: 'node_modules/.vite-account-preview',
    plugins: [{
      name: 'account-style-preview',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) =>
          html
            .replace('/src/main.tsx', '/src/demo/account-preview.tsx')
            .replace(
              '<title>Axiia Cup</title>',
              '<title>Axiia Cup · 账户预览</title>',
            ),
      },
    }],
    server: {
      host: '127.0.0.1',
      port: 5200,
      strictPort: true,
      open: false,
    },
    build: { outDir: 'build/account-preview' },
  }),
)
