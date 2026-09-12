import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { DEFAULT_SOUND_PREFERENCES, updateSoundPreferences } from '../lib/sound'
import { OutputSoundToggle, SoundControls, SoundToggle } from './sound-controls'

function Surface() {
  return (
    <div className='max-w-xl space-y-5 p-5'>
      <div className='flex items-center gap-3'>
        <SoundToggle />
        <OutputSoundToggle />
      </div>
      <SoundControls />
    </div>
  )
}
const meta = {
  title: 'v4/Sound feedback',
  component: Surface,
  beforeEach: () => {
    updateSoundPreferences(DEFAULT_SOUND_PREFERENCES)
    return () => {
      updateSoundPreferences(DEFAULT_SOUND_PREFERENCES)
    }
  },
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>

export const Audition: Story = {}
export const MuteAndOutputPreferences: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const master = canvas.getByRole('switch', { name: '启用音效' })
    const outputs = canvas.getAllByRole('switch', { name: '模型回复提示音' })
    await expect(master).toBeChecked()
    for (const output of outputs) await expect(output).not.toBeChecked()
    await userEvent.click(outputs[0])
    for (const output of outputs) await expect(output).toBeChecked()
    await userEvent.click(canvas.getByRole('button', { name: '关闭音效' }))
    await expect(master).not.toBeChecked()
    for (const output of outputs) await expect(output).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '试听领取奖励' }))
      .toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: '开启音效' }))
    for (const output of outputs) await expect(output).toBeChecked()
    await expect(canvas.getByRole('slider', { name: '音量' })).toHaveValue('25')
  },
}
