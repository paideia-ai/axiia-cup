import { existsSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  (existsSync('/snap/bin/chromium') ? '/snap/bin/chromium' : undefined)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.AXIIA_BASE_URL ?? 'http://127.0.0.1:5173',
    launchOptions: localChromium ? { executablePath: localChromium } : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
