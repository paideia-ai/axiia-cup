import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import type { RewardsResponse } from '../api/types'
import { RewardsProvider } from '../context/rewards'
import { refreshRewards } from '../lib/reward-events'

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
    // Base UI Dialog portals the modal beside Storybook's canvas root.
    const canvas = within(canvasElement.ownerDocument.body)
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
  parameters: {
    msw: [
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get('/v1/scenarios/:id/opponents', () =>
        HttpResponse.json({
          opponents: [
            { agentID: 102, displayName: '我的甘龙', isSelf: true },
            {
              agentID: 301,
              displayName: '老对手',
              isSelf: false,
              ownerAccountID: 'acc-301',
            },
          ],
        })),
      http.get('/v1/my/agents', () =>
        HttpResponse.json({
          scenarios: [{
            scenarioID: unlockedScenario.summary.id,
            title: unlockedScenario.summary.title,
            sides: {
              a: [{ agentID: 101, versionCount: 2, entryVersionID: 1002 }],
              b: [{ agentID: 102, versionCount: 1, entryVersionID: 2001 }],
            },
            gateProgress: unlockedScenario.summary.gateProgress,
            entryReady: true,
          }],
        })),
      http.get(
        '/v1/agents/:id/versions',
        ({ params }) =>
          params.id === '101'
            ? HttpResponse.json({ versions, entryVersionID: 1002 })
            : HttpResponse.json({
              versions: [{
                id: 2001,
                agentID: 102,
                prompt: '乙侧策略',
                modelID: 'deepseek-v4-pro',
                isEntry: true,
                ordinal: 1,
                // 同样的非线性诱饵：按 snapshotSeq 渲染会显示 v3。
                snapshotSeq: 3,
              }],
              entryVersionID: 2001,
            }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('tab', { name: /玩家约战/ }))
    // 解锁态＝真约战 UI：双子模式切换 + 按侧达标徽章。
    await expect(
      await canvas.findByRole('button', { name: '对手玩家' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '按 id 约战' }),
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
    const canvas = within(canvasElement.ownerDocument.body)
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
      await within(canvasElement.ownerDocument.body).findByText(
        '赛事进行中，试炼暂时关闭——请稍后再来',
      ),
    ).toBeVisible()
  },
}

// U18-C24: exercise the real provider and dispatch surface against a wallet
// response. Exactly one battle's cost is sufficient; one point less is not.
const dispatchWallet: RewardsResponse = {
  balance: 100,
  battleCost: 100,
  dailyAllowance: 2000,
  dailyRuns: 20,
  pveWinRefundPercent: 50,
  pvpWinRefundPercent: 75,
  pointsPerYuan: 100,
  nextGrantAt: 1789228800,
  claimableRewards: [],
}
const dispatchFundsWorld = { balance: 100, dispatches: 0 }

export const DispatchBalanceBoundary: Story = {
  decorators: [(Story) => (
    <RewardsProvider>
      <Story />
    </RewardsProvider>
  )],
  loaders: [() => {
    dispatchFundsWorld.balance = 100
    dispatchFundsWorld.dispatches = 0
    return {}
  }],
  parameters: {
    msw: [
      http.get(
        '/v1/rewards/quote',
        () =>
          HttpResponse.json({
            cost: 100,
            perBattleCost: 100,
            repeatRoleSurcharge: false,
            battleCosts: [100],
          }),
      ),
      http.get('/v1/rewards', () =>
        HttpResponse.json({
          ...dispatchWallet,
          balance: dispatchFundsWorld.balance,
        })),
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get(
        '/v1/scenarios/:id/opponents',
        () => HttpResponse.json({ opponents: [] }),
      ),
      http.post('/v1/matches/pve', () => {
        dispatchFundsWorld.dispatches++
        return HttpResponse.json({ matchID: 401 })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    const dispatch = await canvas.findByRole('button', { name: '发起对战' })
    await expect(await canvas.findByText(/余额 100/)).toBeVisible()
    await userEvent.click(
      canvas.getByRole('combobox', { name: '选择预设对手' }),
    )
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole('option', {
        name: '稳健守旧派',
      }),
    )
    await expect(dispatch).toBeEnabled()

    dispatchFundsWorld.balance = 99
    refreshRewards()
    await expect(
      await canvas.findByText('积分不足，可领取胜利奖励或等待每日积分。'),
    ).toBeVisible()
    await expect(dispatch).toBeDisabled()
    dispatch.click()
    await expect(dispatchFundsWorld.dispatches).toBe(0)

    dispatchFundsWorld.balance = 100
    refreshRewards()
    await expect(await canvas.findByText(/余额 100/)).toBeVisible()
    await expect(dispatch).toBeEnabled()
    await userEvent.click(dispatch)
    await waitFor(() => expect(dispatchFundsWorld.dispatches).toBe(1))
  },
}
