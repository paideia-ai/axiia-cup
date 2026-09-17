import { defineConfig, devices } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  testMatch: 'navigation-scroll.spec.ts',
  use: { ...config.use, baseURL: 'http://127.0.0.1:5225' },
  projects: [
    { name: 'desktop' },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'deno task build && deno run -A npm:vite preview --host 127.0.0.1 --port 5225 --strictPort',
    url: 'http://127.0.0.1:5225',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
