import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { delay, http, HttpResponse, type RequestHandler } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { RewardsResponse } from '../api/types'
import { RewardsProvider } from '../context/rewards'
import { refreshRewards } from '../lib/reward-events'

import type { UsageDTO } from '../api/types'
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

// Leave the preview on a selected NPC so the remaining practice flow is visible.
export const NpcPracticeSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await canvas.findByRole('combobox', { name: '选择预设对手' }),
    )
    await userEvent.click(
      await canvas.findByRole('option', { name: '稳健守旧派' }),
    )
    await expect(canvas.getByRole('button', { name: '发起对战' })).toBeEnabled()
  },
}

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
                modelID: 'kimi-k2.6',
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
      canvas.getByRole('button', { name: '指定版本约战' }),
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
function quotaRejectionStory(
  code: 'daily_limit' | 'pvp_daily_limit',
  refreshedUsage: UsageDTO | null,
  expected: string,
  refreshHangs = false,
): Story {
  let rejected = false
  let readsAfterRejection = 0
  const attempts: unknown[] = []
  return {
    args: { scenario: unlockedScenario },
    loaders: [() => {
      rejected = false
      readsAfterRejection = 0
      attempts.length = 0
      return {}
    }],
    parameters: {
      msw: [
        http.get('/v1/config', async () => {
          if (rejected) readsAfterRejection += 1
          if (rejected && refreshHangs) await delay('infinite')
          if (rejected && refreshedUsage === null) {
            return HttpResponse.json({
              error: 'internal',
              message: 'unavailable',
            }, {
              status: 503,
            })
          }
          return HttpResponse.json({
            ...config,
            dailyBattleLimit: 10,
            pvpDailyLimit: 5,
            usage: rejected
              ? refreshedUsage
              : { battlesToday: 4, pvpBattlesToday: 4 },
          })
        }),
        http.get('/v1/versions/367/ref', () =>
          HttpResponse.json({
            versionID: 367,
            agentID: 301,
            scenarioID: unlockedScenario.summary.id,
            side: 'b',
            ownerAccountID: 'acc-301',
            ownerDisplayName: '老对手',
            modelID: 'fixture-model',
          })),
        http.post('/v1/challenges', async ({ request }) => {
          attempts.push(await request.json())
          rejected = true
          return HttpResponse.json({
            error: code,
            message: 'quota rejected',
          }, {
            status: 429,
          })
        }),
        ...UnlockedDesktop.parameters!.msw as RequestHandler[],
      ],
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement.ownerDocument.body)
      await expect(await canvas.findByText('今日已用 4/10（PVP 4/5）'))
        .toBeVisible()
      await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
      await userEvent.click(
        await canvas.findByRole('button', { name: '指定版本约战' }),
      )
      await userEvent.type(
        canvas.getByPlaceholderText('输入对方对侧版本 id（战报页可复制）'),
        '367',
      )
      await userEvent.click(canvas.getByRole('button', { name: '查询' }))
      const confirm = await canvas.findByRole('button', {
        name: '发起约战',
      })
      await expect(confirm).toBeEnabled()
      await userEvent.click(confirm)
      await expect(
        await canvas.findByText(expected, {}, {
          timeout: refreshHangs ? 6000 : 1000,
        }),
      ).toBeVisible()
      await expect(confirm).toBeEnabled()
      expect(readsAfterRejection).toBe(1)
      expect(attempts).toEqual([{
        scenarioID: unlockedScenario.summary.id,
        mine: { a: { versionID: 1002 } },
        opponent: { pinnedVersionID: 367 },
      }])
      expect(canvas.queryByText('已发起约战 · 对局已入队')).toBeNull()
      if (refreshedUsage?.battlesToday !== 4) {
        expect(canvas.queryByText('今日已用 4/10（PVP 4/5）')).toBeNull()
      }
      if (refreshedUsage) {
        await expect(canvas.getByText(
          `今日已用 ${refreshedUsage.battlesToday}/10（PVP ${refreshedUsage.pvpBattlesToday}/5）`,
        )).toBeVisible()
      }
    },
  }
}

export const ExhaustedPvpRefreshesStaleCounts: Story = quotaRejectionStory(
  'pvp_daily_limit',
  { battlesToday: 5, pvpBattlesToday: 5 },
  '今日次数已用完（5/5），明天再来',
)

export const ExhaustedTotalUsesCanonicalCopy: Story = quotaRejectionStory(
  'daily_limit',
  { battlesToday: 10, pvpBattlesToday: 4 },
  '今日次数已用完（10/10），明天再来',
)

export const QuotaRejectionUsesSingleBattleCopy: Story = quotaRejectionStory(
  'pvp_daily_limit',
  { battlesToday: 4, pvpBattlesToday: 4 },
  '今日次数已用完（5/5），明天再来',
)

export const FailedQuotaRefreshDropsStaleNumbers: Story = quotaRejectionStory(
  'pvp_daily_limit',
  null,
  '今日次数已用完，明天再来',
)

export const HangingQuotaRefreshStillShowsRejection: Story =
  quotaRejectionStory(
    'pvp_daily_limit',
    null,
    '今日次数已用完，明天再来',
    true,
  )

function MatchLocation() {
  return <output aria-label='当前路径'>{useLocation().pathname}</output>
}

function singleChallengeStory(side: 'a' | 'b'): Story {
  const attempts: unknown[] = []
  const quotes: URLSearchParams[] = []
  return {
    args: { scenario: unlockedScenario, side, preferVersionID: 1001 },
    decorators: [(Story) => (
      <RewardsProvider>
        <Story />
      </RewardsProvider>
    )],
    render: (args) => (
      <>
        <OsPanel {...args} />
        <MatchLocation />
      </>
    ),
    parameters: {
      msw: [
        http.get(
          '/v1/rewards',
          () => HttpResponse.json({ ...dispatchWallet, balance: 150 }),
        ),
        http.get('/v1/rewards/quote', ({ request }) => {
          quotes.push(new URL(request.url).searchParams)
          return HttpResponse.json({
            cost: 100,
            perBattleCost: 100,
            repeatRoleSurcharge: false,
            battleCosts: [100],
          })
        }),
        http.get('/v1/config', () => HttpResponse.json(config)),
        http.get('/v1/scenarios/:id/opponents', () =>
          HttpResponse.json({
            opponents: [{
              agentID: 301,
              displayName: '对手',
              isSelf: false,
              ownerAccountID: 'rival',
            }],
          })),
        http.post('/v1/challenges', async ({ request }) => {
          attempts.push(await request.json())
          return HttpResponse.json({ challengeID: 701, matchIDs: [701] })
        }),
      ],
    },
    play: async ({ canvasElement }) => {
      attempts.length = 0
      const canvas = within(canvasElement.ownerDocument.body)
      await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
      await expect(
        canvas.getByText(
          side === 'a' ? '我方商鞅 vs 对方甘龙' : '我方甘龙 vs 对方商鞅',
        ),
      ).toBeVisible()
      const dispatch = await canvas.findByRole('button', { name: '发起约战' })
      await waitFor(() => expect(dispatch).toBeEnabled())
      await expect(canvas.getByText('100 积分', { selector: 'strong' }))
        .toBeVisible()
      expect(
        quotes.some((query) =>
          query.get('kind') === 'pvp' && query.get('side') === side
        ),
      ).toBe(true)
      await userEvent.click(
        await canvas.findByRole('button', { name: '发起约战' }),
      )
      await waitFor(() =>
        expect(attempts).toEqual([{
          scenarioID: unlockedScenario.summary.id,
          mine: { [side]: { versionID: 1001 } },
          opponent: { accountID: 'rival' },
        }])
      )
      await waitFor(() =>
        expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
          '/matches/701',
        )
      )
    },
  }
}

export const SingleChallengeFromShangyang: Story = singleChallengeStory('a')
export const SingleChallengeFromGanlong: Story = singleChallengeStory('b')

export const RejectSameSidePinnedVersion: Story = {
  args: { scenario: unlockedScenario },
  parameters: {
    msw: [
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get(
        '/v1/scenarios/:id/opponents',
        () => HttpResponse.json({ opponents: [] }),
      ),
      http.get('/v1/versions/367/ref', () =>
        HttpResponse.json({
          versionID: 367,
          agentID: 301,
          side: 'a',
          scenarioID: unlockedScenario.summary.id,
          ownerAccountID: 'rival',
          ownerDisplayName: '对手',
          modelID: 'fixture',
        })),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
    await userEvent.click(canvas.getByRole('button', { name: '指定版本约战' }))
    await userEvent.type(
      canvas.getByPlaceholderText('输入对方对侧版本 id（战报页可复制）'),
      '367',
    )
    await userEvent.click(canvas.getByRole('button', { name: '查询' }))
    await expect(
      await canvas.findByText('请选择对方的甘龙版本，与当前商鞅对战'),
    ).toBeVisible()
    expect(canvas.queryByRole('button', { name: '发起约战' })).toBeNull()
  },
}
