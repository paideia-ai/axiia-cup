import { defineConfig } from '@playwright/test'
import config from './playwright.config'

// The fixture supplies only immutable achievement API data. All polling,
// receipt claims, account cleanup and rendered toasts are production code.
export default defineConfig({
  ...config,
  testMatch: ['achievement-delivery.spec.ts'],
  use: { ...config.use, baseURL: 'http://127.0.0.1:5186' },
  webServer: {
    command:
      'deno run -A npm:vite build --config preview/achievement-delivery/vite.config.ts && deno run -A npm:vite preview --config preview/achievement-delivery/vite.config.ts --host 127.0.0.1 --port 5186',
    url: 'http://127.0.0.1:5186',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
