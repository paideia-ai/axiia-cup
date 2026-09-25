import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useState } from 'react'
import { presetUsageKey } from '../lib/preset-usage'
import { InitModes } from './builder-init'
import { Button } from './ui/button'

const accounts = ['preset-test-a', 'preset-test-b']
const scenarios = ['preset-scene-a', 'preset-scene-b']
const deck = {
  title: '策略选择',
  role: '辩手',
  assembly: { perQuestion: '<sectionHeading>：\n<fragment>', joiner: '\n' },
  questions: [{
    id: 'approach',
    sectionHeading: '策略',
    prompt: '选择论证方式',
    options: [{
      id: 'evidence',
      label: '依据事实',
      fragment: '用可核查的事实回应。',
    }],
  }],
}

function Surface() {
  const [account, setAccount] = useState(accounts[0])
  const [scenario, setScenario] = useState(scenarios[0])
  const [agent, setAgent] = useState(1)
  const [prompt, setPrompt] = useState('原有草稿')
  return (
    <div className='space-y-6'>
      <div className='flex gap-2'>
        <Button variant='secondary' onClick={() => setAgent((v) => v + 1)}>
          切换智能体
        </Button>
        <Button
          variant='secondary'
          onClick={() =>
            setScenario((v) =>
              v === scenarios[0] ? scenarios[1] : scenarios[0]
            )}
        >
          切换场景
        </Button>
        <Button
          variant='secondary'
          onClick={() =>
            setAccount((v) => v === accounts[0] ? accounts[1] : accounts[0])}
        >
          切换账号
        </Button>
      </div>
      <InitModes
        key={`${account}:${scenario}:${agent}`}
        accountID={account}
        scenarioID={scenario}
        deck={deck}
        metaPrompt='请帮助我完善论证。'
        currentPrompt={prompt}
        onFill={setPrompt}
        promptUnitLimit={null}
      />
      <p role='status'>{prompt}</p>
    </div>
  )
}

const meta = {
  title: 'Agents/Preset first use',
  component: Surface,
  parameters: { a11y: { test: 'error' } },
  beforeEach: () => {
    for (const account of accounts) {
      for (const scenario of scenarios) {
        localStorage.removeItem(presetUsageKey(account, scenario))
      }
    }
  },
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>

export const ConfirmedUseIsScopedToAccountAndScenario: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const direct = () => canvas.getByRole('button', { name: '选择预设策略' })
    await userEvent.click(direct())
    let dialog = canvas.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: '依据事实' }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: '填入工作区' }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: '取消' }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: '关闭弹窗' }),
    )
    await expect(canvas.getByRole('status')).toHaveTextContent('原有草稿')
    await expect(direct()).toBeVisible()
    await expect(
      localStorage.getItem(presetUsageKey(accounts[0], scenarios[0])),
    ).toBeNull()

    await userEvent.click(direct())
    dialog = canvas.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: '依据事实' }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: '填入工作区' }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: '替换当前草稿' }),
    )
    const more = canvas.getByRole('button', { name: '更多构建方式' })
    await waitFor(() => expect(more).toHaveFocus())
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '用可核查的事实回应。',
    )
    await expect(
      localStorage.getItem(presetUsageKey(accounts[0], scenarios[0])),
    ).toBe('1')
    more.focus()
    await userEvent.keyboard('{ArrowDown}')
    const item = await body.findByRole('menuitem', { name: '选择预设策略' })
    await waitFor(() => expect(item).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(more).toHaveFocus())

    await userEvent.click(canvas.getByRole('button', { name: '切换智能体' }))
    await expect(canvas.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换场景' }))
    await expect(direct()).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换场景' }))
    await expect(canvas.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换账号' }))
    await expect(direct()).toBeVisible()
  },
}
