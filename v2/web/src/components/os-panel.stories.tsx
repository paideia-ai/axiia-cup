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

export const NpcPracticeSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await expect(
      await canvas.findByRole('button', { name: '与稳健守旧派对战' }),
    ).toBeEnabled()
    expect(canvas.queryByRole('combobox')).toBeNull()
    expect(canvas.queryByRole('button', { name: '更换版本' })).toBeNull()
    expect(canvas.queryByRole('button', { name: '开始对战' })).toBeNull()
    expect(canvas.queryByRole('radio')).toBeNull()
    await expect(canvas.getAllByRole('tab').map((tab) => tab.textContent))
      .toEqual(['NPC 练习', '玩家约战', '左右手互搏'])
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
    await expect(await canvas.findByRole('button', { name: '与老对手对战' }))
      .toBeEnabled()
    await expect(canvas.getByRole('button', { name: '指定版本 ID' }))
      .toBeVisible()
    expect(canvas.queryByText('商鞅 1/1 ✓')).toBeNull()
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
    const dispatch = await canvas.findByRole('button', {
      name: '与稳健守旧派对战',
    })
    await waitFor(() => expect(dispatch).toBeEnabled())
    dispatchFundsWorld.balance = 99
    refreshRewards()
    await expect(
      await canvas.findByText('积分不足'),
    ).toBeVisible()
    await expect(dispatch).toBeDisabled()
    dispatch.click()
    await expect(dispatchFundsWorld.dispatches).toBe(0)

    dispatchFundsWorld.balance = 100
    refreshRewards()
    await waitFor(() => expect(dispatch).toBeEnabled())
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
      await waitFor(() =>
        expect(canvas.getByRole('tab', { name: '玩家约战' })).toBeEnabled()
      )
      await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
      await userEvent.click(
        await canvas.findByRole('button', { name: '指定版本 ID' }),
      )
      await userEvent.type(
        canvas.getByPlaceholderText('输入对方版本 ID'),
        '367',
      )
      await userEvent.click(canvas.getByRole('button', { name: '查询' }))
      const confirm = await canvas.findByRole('button', {
        name: '与老对手对战',
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
      const dispatch = await canvas.findByRole('button', { name: '与对手对战' })
      await waitFor(() => expect(dispatch).toBeEnabled())
      expect(canvas.queryByText(/消耗|余额|返还/)).toBeNull()
      expect(
        quotes.some((query) =>
          query.get('kind') === 'pvp' && query.get('side') === side
        ),
      ).toBe(true)
      await userEvent.click(
        await canvas.findByRole('button', { name: '与对手对战' }),
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
    await userEvent.click(canvas.getByRole('button', { name: '指定版本 ID' }))
    await userEvent.type(
      canvas.getByPlaceholderText('输入对方版本 ID'),
      '367',
    )
    await userEvent.click(canvas.getByRole('button', { name: '查询' }))
    await expect(
      await canvas.findByText('请选择对方的甘龙版本，与当前商鞅对战'),
    ).toBeVisible()
    expect(canvas.queryByRole('button', { name: '与对手对战' })).toBeNull()
  },
}

const rowAttempts: unknown[] = []
export const DirectNpcRow: Story = {
  args: {
    preferVersionID: 1001,
    agentName: '以理服人',
    scenario: {
      ...scenario,
      presets: [...scenario.presets, {
        key: 'ganlong-second',
        side: 'b',
        label: '第二个对手',
        modelID: 'fixture-model',
      }],
    },
  },
  render: (args) => (
    <>
      <OsPanel {...args} />
      <MatchLocation />
    </>
  ),
  loaders: [() => {
    rowAttempts.length = 0
    return {}
  }],
  parameters: {
    msw: [
      ...meta.parameters.msw,
      http.post('/v1/matches/pve', async ({ request }) => {
        rowAttempts.push(await request.json())
        await delay(150)
        return HttpResponse.json({ matchID: 901 })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    const row = await canvas.findByRole('button', { name: '与第二个对手对战' })
    await expect(canvas.getByText('v1', { exact: true })).toBeVisible()
    await waitFor(() => expect(row).toBeEnabled())
    // Two same-turn native clicks cannot dispatch two matches.
    row.click()
    row.click()
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '与稳健守旧派对战' }))
        .toBeDisabled()
    )
    await expect(canvas.getByRole('button', { name: '关闭' })).toBeDisabled()
    await waitFor(() =>
      expect(rowAttempts).toEqual([{
        versionID: 1001,
        presetKey: 'ganlong-second',
      }])
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
        '/matches/901',
      )
    )
  },
}

export const DirectOwnAgentRow: Story = {
  args: { preferVersionID: 1001 },
  render: (args) => (
    <>
      <OsPanel {...args} />
      <MatchLocation />
    </>
  ),
  loaders: [() => {
    rowAttempts.length = 0
    return {}
  }],
  parameters: {
    msw: [
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get('/v1/scenarios/:id/opponents', () =>
        HttpResponse.json({
          opponents: [
            {
              agentID: 102,
              displayName: '同一玩家',
              name: '稳守',
              isSelf: true,
            },
            {
              agentID: 103,
              displayName: '同一玩家',
              name: '反击',
              isSelf: true,
            },
          ],
        })),
      http.post('/v1/matches/pvp', async ({ request }) => {
        rowAttempts.push(await request.json())
        return HttpResponse.json({ matchID: 902 })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('tab', { name: '左右手互搏' }))
    await userEvent.click(
      await canvas.findByRole('button', { name: '与反击对战' }),
    )
    await waitFor(() =>
      expect(rowAttempts).toEqual([{ versionID: 1001, opponentAgentID: 103 }])
    )
    await waitFor(() =>
      expect(canvas.getByLabelText('当前路径')).toHaveTextContent(
        '/matches/902',
      )
    )
  },
}

let opponentReads = 0
export const OpponentFailureRetry: Story = {
  args: { scenario: unlockedScenario },
  loaders: [() => {
    opponentReads = 0
    return {}
  }],
  parameters: {
    msw: [
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get(
        '/v1/scenarios/:id/opponents',
        () =>
          ++opponentReads === 1 ? HttpResponse.error() : HttpResponse.json({
            opponents: [{
              agentID: 301,
              displayName: '重试对手',
              isSelf: false,
              ownerAccountID: 'retry',
            }],
          }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
    await waitFor(() =>
      expect(canvas.getByRole('tabpanel', { name: '玩家约战' }))
        .toHaveTextContent('对手暂时没有加载出来')
    )
    expect(canvas.queryByText('暂无可约战的对手玩家')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: '重新加载' }))
    await expect(await canvas.findByRole('button', { name: '与重试对手对战' }))
      .toBeEnabled()
  },
}

let pinnedAttempts = 0
export const PinnedResultInvalidated: Story = {
  args: { scenario: unlockedScenario },
  loaders: [() => {
    pinnedAttempts = 0
    return {}
  }],
  parameters: {
    msw: [
      ...meta.parameters.msw,
      http.get('/v1/versions/367/ref', () =>
        HttpResponse.json({
          versionID: 367,
          agentID: 301,
          scenarioID: scenario.summary.id,
          side: 'b',
          ownerAccountID: 'rival',
          ownerDisplayName: '指定对手',
          modelID: 'fixture-model',
        })),
      http.post('/v1/challenges', () => {
        pinnedAttempts++
        return HttpResponse.json({ challengeID: 1, matchIDs: [1] })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
    await userEvent.click(canvas.getByRole('button', { name: '指定版本 ID' }))
    const input = canvas.getByRole('textbox', { name: '对方版本 ID' })
    await userEvent.type(input, '367')
    await userEvent.click(canvas.getByRole('button', { name: '查询' }))
    await expect(await canvas.findByRole('button', { name: '与指定对手对战' }))
      .toBeEnabled()
    await userEvent.type(input, '8')
    expect(canvas.queryByRole('button', { name: '与指定对手对战' })).toBeNull()
    expect(pinnedAttempts).toBe(0)
  },
}

export const PinnedParticipantRoles: Story = {
  args: {
    agentName: '使者',
    scenario: {
      ...unlockedScenario,
      summary: { ...unlockedScenario.summary, id: 'honnoji-decision' },
    },
    versions: versions.map((version) => ({
      ...version,
      role: { key: 'chosokabe', name: '长宗我部元亲的密使', side: 'a' },
    })),
  },
  parameters: {
    msw: [
      ...meta.parameters.msw,
      http.get('/v1/versions/367/ref', () =>
        HttpResponse.json({
          versionID: 367,
          agentID: 301,
          scenarioID: 'honnoji-decision',
          side: 'b',
          role: { key: 'hosokawa', name: '细川藤孝', side: 'b' },
          ownerAccountID: 'rival',
          ownerDisplayName: '指定对手',
          modelID: 'fixture-model',
        })),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await expect(canvas.getByText('长宗我部元亲的密使', { exact: true }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('tab', { name: '玩家约战' }))
    await userEvent.click(canvas.getByRole('button', { name: '指定版本 ID' }))
    await userEvent.type(
      canvas.getByRole('textbox', { name: '对方版本 ID' }),
      '367',
    )
    await userEvent.click(canvas.getByRole('button', { name: '查询' }))
    await expect(await canvas.findByRole('button', { name: '与指定对手对战' }))
      .toHaveTextContent('细川藤孝')
  },
}
