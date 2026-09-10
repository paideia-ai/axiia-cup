import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { SoundProvider } from '../context/sound'
import { SoundDemo } from './sound-demo'
import './sound-demo.css'

const meta = {
  title: 'Sound/Interactive preview',
  component: SoundDemo,
  decorators: [(Story) => (
    <SoundProvider>
      <Story />
    </SoundProvider>
  )],
} satisfies Meta<typeof SoundDemo>

export default meta
type Story = StoryObj<typeof meta>

export const SaveThenDispatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: '发起对战' }))
      .toBeDisabled()
    await userEvent.click(
      canvas.getByRole('button', { name: '保存版本' }),
    )
    await expect(await canvas.findByText('版本 v1 已保存')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '发起对战' }),
    )
    const battle = within(canvas.getByRole('tabpanel', { name: '对战实况' }))
    await expect(await battle.findByText('对战进行中')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '中止演示' }))
    await expect(canvas.getByText('对战已中止。没有播放完成音效。'))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '重置演示' }))
    await expect(canvas.getByRole('button', { name: '发起对战' }))
      .toBeDisabled()
  },
}
