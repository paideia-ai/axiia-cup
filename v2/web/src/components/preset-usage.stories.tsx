import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { resetNavigationCache } from '../lib/navigation-cache'
import { presetUsageKey } from '../lib/preset-usage'
import { InitModes } from './builder-init'
import { Button } from './ui/button'

const accounts = ['preset-test-a', 'preset-test-b']
const scenarios = ['preset-scene-a', 'preset-scene-b']
let activeAccount = accounts[0]
const serverUsage = new Map<string, Set<string>>()
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

function Surface(
  { initialScenario = scenarios[0] }: { initialScenario?: string },
) {
  const [account, setAccount] = useState(accounts[0])
  const [scenario, setScenario] = useState(initialScenario)
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
            setAccount((v) => {
              activeAccount = v === accounts[0] ? accounts[1] : accounts[0]
              return activeAccount
            })}
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
  parameters: {
    a11y: { test: 'error' },
    msw: [
      http.get('*/v1/account/preset-usage', () =>
        HttpResponse.json({
          scenarioIDs: [...(serverUsage.get(activeAccount) ?? [])],
        })),
      http.post('*/v1/account/preset-usage', async ({ request }) => {
        const { scenarioID } = await request.json() as { scenarioID: string }
        const used = serverUsage.get(activeAccount) ?? new Set<string>()
        used.add(scenarioID)
        serverUsage.set(activeAccount, used)
        return HttpResponse.json({ scenarioIDs: [...used] })
      }),
    ],
  },
  beforeEach: () => {
    activeAccount = accounts[0]
    serverUsage.clear()
    for (const account of accounts) {
      for (const scenario of scenarios) {
        localStorage.removeItem(presetUsageKey(account, scenario))
      }
    }
    resetNavigationCache()
  },
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>

export const ConfirmedUseIsScopedToAccountAndScenario: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const direct = () => canvas.getByRole('button', { name: '选择预设策略' })
    await canvas.findByRole('button', { name: '选择预设策略' })
    await userEvent.click(direct())
    let dialog = canvas.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: '依据事实' }),
    )
    await within(dialog).findByRole('button', { name: '取消' })
    await userEvent.click(
      within(dialog).getByRole('button', { name: '取消' }),
    )
    await userEvent.click(
      within(dialog).getByRole('button', { name: '关闭弹窗' }),
    )
    await expect(canvas.getByRole('status')).toHaveTextContent('原有草稿')
    await expect(direct()).toBeVisible()
    await expect(serverUsage.get(accounts[0])).toBeUndefined()

    await userEvent.click(direct())
    dialog = canvas.getByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: '依据事实' }),
    )
    await within(dialog).findByRole('button', { name: '替换当前草稿' })
    await userEvent.click(
      within(dialog).getByRole('button', { name: '替换当前草稿' }),
    )
    const more = await canvas.findByRole('button', { name: '更多构建方式' })
    await waitFor(() => expect(more).toHaveFocus())
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '用可核查的事实回应。',
    )
    await waitFor(() =>
      expect(serverUsage.get(accounts[0])?.has(scenarios[0])).toBe(true)
    )
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
    await waitFor(() => expect(direct()).toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: '切换场景' }))
    await expect(canvas.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换账号' }))
    await waitFor(() => expect(direct()).toBeVisible())
  },
}

export const LegacyBrowserUseMigratesToServer: Story = {
  beforeEach: () => {
    localStorage.setItem(presetUsageKey(accounts[0], scenarios[0]), '1')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const legacyKey = presetUsageKey(accounts[0], scenarios[0])
    const more = await canvas.findByRole('button', {
      name: '更多构建方式',
    })
    await expect(more).toBeVisible()
    await waitFor(() =>
      expect(serverUsage.get(accounts[0])?.has(scenarios[0])).toBe(true)
    )
    await waitFor(() => expect(localStorage.getItem(legacyKey)).toBeNull())

    await userEvent.click(canvas.getByRole('button', { name: '切换智能体' }))
    await expect(canvas.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换场景' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '选择预设策略' }))
        .toBeVisible()
    )
    await userEvent.click(canvas.getByRole('button', { name: '切换场景' }))
    await expect(canvas.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换账号' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '选择预设策略' }))
        .toBeVisible()
    )
  },
}

export const OtherLegacyScenariosMigrateOnFirstVisit: Story = {
  beforeEach: () => {
    localStorage.setItem(presetUsageKey(accounts[0], scenarios[0]), '1')
  },
  render: () => <Surface initialScenario={scenarios[1]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const legacyKey = presetUsageKey(accounts[0], scenarios[0])
    await canvas.findByRole('button', { name: '选择预设策略' })
    await waitFor(() =>
      expect(serverUsage.get(accounts[0])?.has(scenarios[0])).toBe(true)
    )
    await waitFor(() => expect(localStorage.getItem(legacyKey)).toBeNull())
    await userEvent.click(canvas.getByRole('button', { name: '切换场景' }))
    await expect(canvas.getByRole('button', { name: '更多构建方式' }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '切换账号' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '选择预设策略' }))
        .toBeVisible()
    )
  },
}
