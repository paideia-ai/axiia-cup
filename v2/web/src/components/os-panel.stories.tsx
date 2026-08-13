import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'

import {
  config,
  scenario,
  unlockedScenario,
  versions,
} from '../testing/v34-fixtures'
import { OsPanel } from './os-panel'

const meta = {
  title: 'v3.4/OS Panel',
  component: OsPanel,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/agents/101']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    open: true,
    onClose: () => {},
    scenario,
    side: 'a',
    versions,
    entryVersionID: 1002,
  },
  parameters: {
    msw: [
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get('/v1/scenarios/:id/opponents', () =>
        HttpResponse.json({
          opponents: [{
            agentID: 102,
            displayName: '我的甘龙',
            isSelf: true,
          }],
        })),
    ],
  },
} satisfies Meta<typeof OsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const LockedMobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: /玩家约战/ }))
    await expect(canvas.getByText('每侧各赢 ≥1 场 NPC 练习解锁玩家约战'))
      .toBeVisible()
    await expect(canvas.getByText('商鞅 1/1 ✓')).toBeVisible()
    await expect(canvas.getByText('甘龙 0/1')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '关闭' })).toHaveClass(
      'p-3.5',
    )
  },
}

export const UnlockedDesktop: Story = {
  args: { scenario: unlockedScenario },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: /玩家约战/ }))
    await expect(
      canvas.getByText('已解锁（对手玩家约战将在下一版本上线）'),
    ).toBeVisible()
    await expect(canvas.getByText('商鞅 1/1 ✓')).toBeVisible()
    await expect(canvas.getByText('甘龙 1/1 ✓')).toBeVisible()
  },
}

export const OpponentLoading: Story = {
  parameters: {
    msw: [
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get('/v1/scenarios/:id/opponents', async () => {
        await delay('infinite')
        return HttpResponse.json({ opponents: [] })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: '左右手互搏' }))
    await expect(canvas.getByText('加载中…')).toBeVisible()
  },
}

export const TrialsBlocked: Story = {
  parameters: {
    msw: [
      http.get(
        '/v1/config',
        () => HttpResponse.json({ ...config, trialsBlocked: true }),
      ),
      http.get(
        '/v1/scenarios/:id/opponents',
        () => HttpResponse.json({ opponents: [] }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        '赛事进行中，试炼暂时关闭——请稍后再来',
      ),
    ).toBeVisible()
  },
}
