import { defineConfig } from '@playwright/test'
import config from './playwright.config'

// These two Gherkin mirrors use isolated HTTP fixtures and need only the real
// web app. Keep the existing real-backend suite and its setup independent.
export default defineConfig({
  ...config,
  testMatch: ['reward-points.spec.ts', 'sound-feedback.spec.ts'],
  use: { ...config.use, baseURL: 'http://127.0.0.1:5189' },
  webServer: {
    command: 'deno task dev --host 127.0.0.1 --port 5189',
    url: 'http://127.0.0.1:5189',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
