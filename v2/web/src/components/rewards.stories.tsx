import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'

import type { MatchRewardResponse, RewardsResponse } from '../api/types'
import { RewardsProvider } from '../context/rewards'
import { RewardsPage } from '../pages/rewards'
import { BattleCostNotice, PointsIndicator, RewardClaimCard } from './rewards'
import { Button } from './ui/button'

const wallet: RewardsResponse = {
  balance: 1900,
  battleCost: 100,
  dailyAllowance: 2000,
  dailyRunsPerScenario: 5,
  pveWinRefundPercent: 50,
  pvpWinRefundPercent: 75,
  pointsPerYuan: 100,
  nextGrantAt: 1789228800,
  claimableRewards: [{ matchID: 42, points: 50, kind: 'pve' }],
}

function Surface() {
  const [visit, setVisit] = useState(0)
  return (
    <MemoryRouter>
      <RewardsProvider>
        <div className='space-y-6'>
          <PointsIndicator />
          <BattleCostNotice kind='pvp' />
          <RewardClaimCard key={visit} matchID={42} />
          <Button
            variant='secondary'
            onClick={() => setVisit((value) => value + 1)}
          >
            重新打开战报
          </Button>
          <RewardsPage />
        </div>
      </RewardsProvider>
    </MemoryRouter>
  )
}

const meta = { title: 'v4/Rewards', component: Surface } satisfies Meta<
  typeof Surface
>
export default meta
type Story = StoryObj<typeof meta>

function handlers(
  {
    status = 'claimable',
    loseFirstResponse = false,
    failRefresh = false,
    balance = wallet.balance,
  }: {
    status?: MatchRewardResponse['status']
    loseFirstResponse?: boolean
    failRefresh?: boolean
    balance?: number
  } = {},
) {
  let claimed = status === 'claimed'
  let first = true
  return [
    http.get(
      '/v1/rewards',
      () =>
        claimed && failRefresh
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({
            ...wallet,
            balance: balance + (claimed ? 50 : 0),
            claimableRewards: claimed || status !== 'claimable'
              ? []
              : wallet.claimableRewards,
          }),
    ),
    http.get('/v1/rewards/matches/42', () =>
      HttpResponse.json({
        matchID: 42,
        points: 50,
        kind: 'pve',
        status: claimed ? 'claimed' : status,
      })),
    http.post('/v1/rewards/matches/42/claim', () => {
      const alreadyClaimed = claimed
      claimed = true
      if (first && loseFirstResponse) {
        first = false
        return HttpResponse.error()
      }
      return HttpResponse.json({
        matchID: 42,
        creditedPoints: alreadyClaimed ? 0 : 50,
        alreadyClaimed,
        balance: balance + 50,
      })
    }),
  ]
}

export const ClaimAndRevisit: Story = {
  parameters: { msw: handlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: '领取奖励' }),
    )
    await expect(await canvas.findByText('已领取 · +50 积分')).toBeVisible()
    await expect(
      await canvas.findByRole('link', { name: '1950 积分，查看积分与奖励' }),
    ).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '领取奖励' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: '重新打开战报' }))
    await expect(await canvas.findByText('已领取 · +50 积分')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '领取奖励' })).toBeNull()
  },
}

export const LostResponseRetry: Story = {
  parameters: { msw: handlers({ loseFirstResponse: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: '领取奖励' }),
    )
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      '领取未确认',
    )
    await userEvent.click(canvas.getByRole('button', { name: '领取奖励' }))
    await expect(await canvas.findByText('已领取 · +50 积分')).toBeVisible()
    await expect(
      await canvas.findByRole('link', { name: '1950 积分，查看积分与奖励' }),
    ).toBeVisible()
  },
}

export const ClaimSurvivesRefreshFailure: Story = {
  parameters: { msw: handlers({ failRefresh: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('link', { name: '1900 积分，查看积分与奖励' }),
    ).toBeVisible()
    await userEvent.click(
      await canvas.findByRole('button', { name: '领取奖励' }),
    )
    await expect(await canvas.findByText('积分更新失败，请重试')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '1950 积分，查看积分与奖励' }),
    ).toBeVisible()
    await expect(canvas.getByText('已领取 · +50 积分')).toBeVisible()
  },
}

export const IneligibleAndInsufficient: Story = {
  parameters: { msw: handlers({ status: 'ineligible', balance: 150 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('200 积分')).toBeVisible()
    await expect(
      await canvas.findByText('积分不足，可领取胜利奖励或等待每日积分。'),
    ).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '领取奖励' })).toBeNull()
  },
}

export const OldServer: Story = {
  parameters: {
    msw: [
      http.get('/v1/rewards', () => new HttpResponse(null, { status: 404 })),
      http.get(
        '/v1/rewards/matches/42',
        () => new HttpResponse(null, { status: 404 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('积分功能暂未开放')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '领取奖励' })).toBeNull()
    await expect(canvas.queryByText('可用积分')).toBeNull()
  },
}

export const LoadFailureRetry: Story = {
  parameters: {
    msw: (() => {
      let first = true
      return [
        ...handlers(),
        http.get('/v1/rewards/matches/42', () => {
          if (first) {
            first = false
            return new HttpResponse(null, { status: 503 })
          }
          return HttpResponse.json({
            matchID: 42,
            points: 50,
            status: 'claimable',
            kind: 'pve',
          })
        }),
      ].reverse()
    })(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('奖励加载失败，请重试')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '重试' }))
    await expect(await canvas.findByRole('button', { name: '领取奖励' }))
      .toBeVisible()
  },
}
