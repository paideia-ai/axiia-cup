import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { delay, http, HttpResponse, type RequestHandler } from 'msw'
import { MemoryRouter } from 'react-router-dom'

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

function quotaRejectionStory(
  code: 'daily_limit' | 'pvp_daily_limit',
  refreshedUsage: UsageDTO | null,
  expected: string,
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
        http.get('/v1/config', () => {
          if (rejected) readsAfterRejection += 1
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
        await canvas.findByRole('button', { name: '按 id 约战' }),
      )
      await userEvent.type(
        canvas.getByPlaceholderText('输入对方任一版本 id（战报页可复制）'),
        '367',
      )
      await userEvent.click(canvas.getByRole('button', { name: '查询' }))
      const confirm = await canvas.findByRole('button', {
        name: '发起双侧约战',
      })
      await expect(confirm).toBeEnabled()
      await userEvent.click(confirm)
      await expect(await canvas.findByText(expected)).toBeVisible()
      await expect(confirm).toBeEnabled()
      expect(readsAfterRejection).toBe(1)
      expect(attempts).toEqual([{
        scenarioID: unlockedScenario.summary.id,
        mine: { a: { versionID: 1002 }, b: { versionID: 2001 } },
        opponent: { pinnedVersionID: 367 },
      }])
      expect(canvas.queryByText('已发起双侧约战 · 两场对局已入队')).toBeNull()
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

export const OnePvpSlotStillExplainsPairedQuota: Story = quotaRejectionStory(
  'pvp_daily_limit',
  { battlesToday: 4, pvpBattlesToday: 4 },
  'PVP 配额不足一整对——一次约战计 2 场（上限 5/日），明天再来',
)

export const FailedQuotaRefreshDropsStaleNumbers: Story = quotaRejectionStory(
  'pvp_daily_limit',
  null,
  'PVP 配额不足一整对——一次约战计 2 场，明天再来',
)
