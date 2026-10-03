import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'achievements.real.spec.ts',
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: process.env.AXIIA_ACHIEVEMENTS_URL ?? 'http://127.0.0.1:6248',
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH ?? '/snap/bin/chromium',
      args: ['--no-sandbox'],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
