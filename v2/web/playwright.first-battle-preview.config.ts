import { defineConfig } from '@playwright/test'
import config from './playwright.config'

// Unlike the intercepted API suites, these tests exercise the preview server
// itself, so an omitted route fails the same way it would in manual review.
export default defineConfig({
  ...config,
  testMatch: 'first-battle-preview.spec.ts',
  timeout: 60_000,
  use: {
    ...config.use,
    baseURL: 'http://127.0.0.1:5237',
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'deno task preview:first-battle',
    url: 'http://127.0.0.1:5237/preview',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
