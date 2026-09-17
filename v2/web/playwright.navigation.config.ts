import { defineConfig } from '@playwright/test'
import config from './playwright.config'

// Real browser navigation, isolated API fixtures; never contacts a live backend.
export default defineConfig({
  ...config,
  testMatch: ['navigation-links.spec.ts'],
  use: { ...config.use, baseURL: 'http://127.0.0.1:5190' },
  webServer: {
    command: 'deno task dev --host 127.0.0.1 --port 5190',
    url: 'http://127.0.0.1:5190',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
