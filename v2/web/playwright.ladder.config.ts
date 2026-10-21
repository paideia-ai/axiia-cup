import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  testDir: './e2e',
  testMatch: 'ladder-browser.spec.ts',
  use: {
    ...config.use,
    baseURL: 'http://127.0.0.1:6060',
    reducedMotion: 'reduce',
  },
  webServer: {
    command:
      'deno task build --outDir build/ladder-test && deno run -A npm:vite preview --outDir build/ladder-test --host 127.0.0.1 --port 6060',
    url: 'http://127.0.0.1:6060',
    reuseExistingServer: false,
    timeout: 60000,
  },
})
