import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { DialogueRow, LiveDialogueRow } from './timeline/dialogue-row'
import { speakerLabels } from './timeline/labels'

const labels = speakerLabels('honnoji-decision', {}, ['chosokabe', 'ashigaru'])
function PortraitStates() {
  return (
    <div className='space-y-4'>
      <LiveDialogueRow
        bubble={{
          seq: 0,
          channel: 'debate',
          speaker: 'chosokabe',
          text: '',
          reasoning: '',
          call: 'say',
        }}
        labels={labels}
        showReasoning={false}
      />
      <DialogueRow
        turn={{
          seq: 1,
          channel: 'debate',
          speaker: 'ashigaru',
          finalText: '请三思。',
          reasoning: null,
          kind: 'dialogue',
        }}
        labels={labels}
        showReasoning={false}
      />
    </div>
  )
}
const meta = {
  title: 'Transcript/Portraits',
  component: PortraitStates,
} satisfies Meta<typeof PortraitStates>
export default meta
type Story = StoryObj<typeof meta>
export const ResponsiveAndFailure: Story = {
  play: async ({ canvasElement }) => {
    // Viewport control belongs to the test runner; the story also renders in
    // ordinary Storybook without importing its runner-only browser module.
    if (!('__vitest_browser_runner__' in globalThis)) return
    const { page } = await import('vitest/browser')
    try {
      for (const width of [390, 899, 900, 1440]) {
        await page.viewport(width, 1000)
        const images = canvasElement.querySelectorAll<HTMLImageElement>(
          '.role-portrait',
        )
        await expect(images.length).toBe(2)
        for (const image of images) {
          await waitFor(() =>
            expect(image.getBoundingClientRect().width).toBe(
              width < 900 ? 48 : 80,
            )
          )
          const speaker = image.closest('.portrait-speaker')!
          const card = image.closest('.portrait-speech')!
          await expect(speaker.getBoundingClientRect().bottom)
            .toBeLessThanOrEqual(card.getBoundingClientRect().bottom)
          await expect(image.alt).toBe('')
        }
        await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
          width,
        )
      }
      const first = canvasElement.querySelector<HTMLImageElement>(
        '.role-portrait',
      )!
      first.dispatchEvent(new Event('error'))
      await waitFor(() =>
        expect(canvasElement.querySelectorAll('.role-portrait')).toHaveLength(1)
      )
      await expect(canvasElement.textContent).toContain('长宗我部元亲的密使')
      await expect(canvasElement.textContent).toContain('正在思考…')
    } finally {
      await page.viewport(1280, 720)
    }
  },
}
