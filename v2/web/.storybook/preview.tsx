import type { Preview } from '@storybook/react-vite'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'

import '../src/styles.css'

const preview: Preview = {
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledRequest: 'bypass' })
      return worker
    }),
  ],
  parameters: {
    a11y: { test: 'error' },
    controls: { expanded: true },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main className='mx-auto min-h-screen max-w-6xl bg-(--background) px-4 py-8 text-(--foreground) md:px-8'>
        <Story />
      </main>
    ),
  ],
}

export default preview
