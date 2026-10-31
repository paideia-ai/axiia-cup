import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  testMatch: 'agent-naming.spec.ts',
  workers: 1,
  timeout: 90_000,
  use: { ...config.use, baseURL: 'http://127.0.0.1:6063' },
  webServer: {
    command: 'deno task preview:agent-naming',
    url: 'http://127.0.0.1:6063/preview',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
