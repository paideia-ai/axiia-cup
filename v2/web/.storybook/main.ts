import tailwindcss from '@tailwindcss/vite'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    'msw-storybook-addon',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Storybook runs its own Vite, which does not inherit vite.config.ts plugins.
  // Without this every story rendered with zero Tailwind utilities, so component
  // stories looked nothing like the app and no style regression could be caught.
  viteFinal: (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    // 看板凭据来自构建期环境变量，storybook 没有 .env——给一个假端点，导测
    // 故事才能对着 msw 打真实的 fetch，而不是撞上「未配置」的短路。
    config.define = {
      ...config.define,
      'import.meta.env.VITE_TM_BOARD_URL': JSON.stringify(
        process.env.VITE_TM_BOARD_URL ?? 'https://board.storybook.test',
      ),
      'import.meta.env.VITE_TM_BOARD_ANON_KEY': JSON.stringify(
        process.env.VITE_TM_BOARD_ANON_KEY ?? 'storybook-anon-key',
      ),
    }
    return config
  },
}

export default config
