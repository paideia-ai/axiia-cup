import { defineConfig } from '@playwright/test'
import config from './playwright.config'

// Test the shipped bundle: no dev dependency optimizer/HMR reloads while tabs
// open and close. API fixtures never contact a live backend.
export default defineConfig({
  ...config,
  testMatch: ['navigation-links.spec.ts'],
  use: {
    ...config.use,
    // Native tabs/windows need the full browser implementation used by users,
    // not Playwright's default, separate chromium-headless-shell executable.
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:5190',
  },
  webServer: {
    command:
      'deno task build && deno run -A npm:vite preview --host 127.0.0.1 --port 5190',
    url: 'http://127.0.0.1:5190',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
