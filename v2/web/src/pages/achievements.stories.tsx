import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, waitFor, within } from 'storybook/test'

import { AuthProvider } from '../context/auth'
import { AchievementsPage } from './achievements'

const meta = {
  title: 'Account/Achievements',
  component: AchievementsPage,
  parameters: { a11y: { test: 'error' } },
  decorators: [(Story) => (
    <MemoryRouter>
      <AuthProvider>
        <Story />
      </AuthProvider>
    </MemoryRouter>
  )],
} satisfies Meta<typeof AchievementsPage>
export default meta
type Story = StoryObj<typeof meta>

const me = http.get(
  '/v1/auth/me',
  () =>
    HttpResponse.json({
      account: { id: 'achievement-story', displayName: '选手', isAdmin: false },
      elevated: false,
      firstBattleDone: true,
    }),
)

export const UnlockedAndUnknown: Story = {
  parameters: {
    msw: {
      handlers: [
        me,
        http.get('/v1/achievements', () =>
          HttpResponse.json({
            cursor: 1,
            achievements: [
              {
                slot: 0,
                tier: '铜',
                unlocked: true,
                id: 'first-word',
                title: '初试锋芒',
                description: '赢得你的第一场对局。',
                flavor: '有人听进去了。',
                image: '/achievements/first-word.webp',
                unlockedAt: 1791000000,
              },
              { slot: 1, tier: '金', unlocked: false },
              { slot: 2, tier: '银', unlocked: false },
              {
                slot: 3,
                tier: '铜',
                unlocked: true,
                id: 'hundred-losses',
                title: '百折，尚未不挠',
                description: '累计输掉 100 场对局。',
                flavor: '',
                image: '/achievements/hundred-losses.webp',
                unlockedAt: 1791000000,
              },
            ],
          })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: '成就中心' }))
      .toBeVisible()
    await expect(canvas.getByText('赢得你的第一场对局。')).toBeVisible()
    await expect(canvas.getByText('有人听进去了。')).toBeVisible()
    await expect(canvas.getAllByRole('img', { name: '尚未获得的成就' }))
      .toHaveLength(2)
    await expect(canvas.queryByText('大哲学家')).toBeNull()
    await expect(canvasElement.querySelector('#hundred-losses .italic'))
      .toBeNull()
  },
}

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        me,
        http.get('/v1/achievements', () =>
          HttpResponse.json({
            cursor: 0,
            achievements: Array.from(
              { length: 31 },
              (_, slot) => ({
                slot,
                tier: ['金', '银', '铜'][slot % 3],
                unlocked: false,
              }),
            ),
          })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('已获得 0 / 31')).toBeVisible()
    await expect(canvas.getAllByRole('img', { name: '尚未获得的成就' }))
      .toHaveLength(31)
  },
}

export const Unavailable: Story = {
  parameters: {
    msw: {
      handlers: [
        me,
        http.get('/v1/achievements', () =>
          HttpResponse.json({
            error: { code: 'unavailable', message: '暂时无法读取成就' },
          }, { status: 503 })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '重试' })).toBeVisible()
    )
    await expect(canvas.queryByText('已获得 0 / 31')).toBeNull()
  },
}
