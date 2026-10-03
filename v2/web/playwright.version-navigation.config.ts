import { defineConfig, devices } from '@playwright/test'

// The real production bundle with isolated, in-memory preview accounts.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'version-navigation.spec.ts',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5237',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    {
      name: 'small-phone',
      use: { ...devices['Pixel 7'], viewport: { width: 320, height: 720 } },
    },
  ],
  webServer: {
    command: 'deno task preview:product-meeting',
    url: 'http://127.0.0.1:5237',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
