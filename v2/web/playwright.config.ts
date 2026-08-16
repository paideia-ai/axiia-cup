import { existsSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

const localChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  (existsSync('/snap/bin/chromium') ? '/snap/bin/chromium' : undefined)

// 对本地真服跑时 5s 足够；对着**远程 dev** 跑（AXIIA_BASE_URL 指向代理到
// axiia-cup-2.isofucius.cn 的 vite）时，单次往返常常十几秒——用环境变量把
// expect 预算调大，而不是在每条断言上撒 timeout。
const expectTimeout = Number(process.env.PLAYWRIGHT_EXPECT_TIMEOUT ?? 5000)

export default defineConfig({
  testDir: './tests/e2e',
  expect: { timeout: expectTimeout },
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
