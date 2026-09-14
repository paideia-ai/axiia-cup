import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { useEffect } from 'react'

import {
  DEFAULT_SOUND_PREFERENCES,
  installSoundListeners,
  playButtonHover,
  playSound,
  unlockAudio,
  updateSoundPreferences,
} from '../lib/sound'
import { TypingFeedback } from './typing-feedback'
import { SoundControls, SoundToggle } from './sound-controls'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

function Surface() {
  return (
    <div className='max-w-xl space-y-5 p-5'>
      <div className='flex items-center gap-3'>
        <SoundToggle />
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

export const Settings: Story = {}

function PromptFeedbackSurface() {
  useEffect(installSoundListeners, [])
  return (
    <div className='max-w-xl space-y-4 p-5'>
      <SoundToggle />
      <TypingFeedback />
      <div>
        <Textarea id='prompt-input' aria-label='策略提示词' />
      </div>
      <Button
        onPointerEnter={playButtonHover}
        onClick={() => {
          unlockAudio()
          playSound('click')
        }}
      >
        保存反馈示例
      </Button>
    </div>
  )
}

// Storybook's synthetic userEvent does not grant browser autoplay activation.
// This story remains interactive for audition; native playback is asserted in
// the Playwright BDD, while this interaction verifies editing stays usable.
export const PromptAndButtonFeedback: Story = {
  render: () => <PromptFeedbackSurface />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const prompt = canvas.getByLabelText('策略提示词')
    await userEvent.type(prompt, '策略a')
    await expect(prompt).toHaveValue('策略a')
    await userEvent.keyboard('{Backspace}')
    await expect(prompt).toHaveValue('策略')
    const button = canvas.getByRole('button', { name: '保存反馈示例' })
    await userEvent.hover(button)
    await userEvent.click(button)
    await userEvent.click(canvas.getByRole('button', { name: '关闭音效' }))
    await expect(canvas.getByRole('button', { name: '开启音效' })).toBeVisible()
    await userEvent.type(prompt, '静音')
    await expect(prompt).toHaveValue('策略静音')
    await userEvent.click(button)
    await expect(button).toBeEnabled()
  },
}

export const MasterSoundPreferences: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const master = canvas.getByRole('switch', { name: '启用音效' })
    await expect(canvas.getAllByRole('switch')).toHaveLength(1)
    await expect(master).toBeChecked()
    await userEvent.click(canvas.getByRole('button', { name: '关闭音效' }))
    await expect(master).not.toBeChecked()
    await expect(canvas.getByRole('slider', { name: '音量' })).toBeDisabled()
    await expect(canvas.queryAllByRole('button', { name: /试听/ }))
      .toHaveLength(0)
    await userEvent.click(canvas.getByRole('button', { name: '开启音效' }))
    await expect(canvas.getByRole('slider', { name: '音量' })).toHaveValue('25')
  },
}
