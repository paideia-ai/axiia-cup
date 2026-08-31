import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const localChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  (existsSync('/snap/bin/chromium') ? '/snap/bin/chromium' : undefined)

export default defineConfig({
  optimizeDeps: {
    // react-dom：测试模式用 createPortal；不预打包的话第一次跑到它会触发重新优化、React 双份。
    include: ['msw-storybook-addon/csf3', 'react-dom'],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: localChromium
                ? { executablePath: localChromium }
                : {},
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
