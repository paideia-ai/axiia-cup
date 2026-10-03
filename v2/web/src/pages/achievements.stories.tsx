import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { AchievementsProvider } from '../context/achievements'
import { AchievementsPage } from './achievements'
import type { AchievementDTO } from '../api/types'

const rows: AchievementDTO[] = [
  {
    slot: 1,
    tier: '铜',
    id: 'first-word',
    title: '初试锋芒',
    description: '赢得你的第一场对局。',
    flavor: '有人听进去了。',
    earnedAt: 1791020000,
    eventID: 1,
    matchID: 42,
  },
  { slot: 2, tier: '银' },
  { slot: 3, tier: '金' },
]
const meta = {
  title: 'Account/Achievements',
  component: AchievementsPage,
  parameters: {
    a11y: { test: 'error' },
    msw: {
      handlers: [
        http.get(
          '/v1/achievements',
          () => HttpResponse.json({ achievements: rows, cursor: 1 }),
        ),
        http.get(
          '/v1/achievements/events',
          () => HttpResponse.json({ achievements: [], cursor: 1 }),
        ),
      ],
    },
  },
  render: () => (
    <MemoryRouter>
      <AchievementsProvider accountID='achievement-story'>
        <AchievementsPage />
      </AchievementsProvider>
    </MemoryRouter>
  ),
} satisfies Meta<typeof AchievementsPage>
export default meta
type Story = StoryObj<typeof meta>
export const CollectedAndHidden: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement)
    await expect(page.findByRole('heading', { name: '初试锋芒' })).resolves
      .toBeVisible()
    await expect(page.getByText('赢得你的第一场对局。')).toBeVisible()
    await expect(page.getAllByRole('img', { name: '未获得的成就' }))
      .toHaveLength(2)
    await expect(page.getByRole('link', { name: '查看触发对局' }))
      .toHaveAttribute('href', '/matches/42')
    await expect(page.queryByRole('complementary', { name: '获得成就' }))
      .toBeNull()
  },
}
export const FailedRequest: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/v1/achievements', () =>
          HttpResponse.json(
            { error: { code: 'internal', message: 'fixture' } },
            {
              status: 503,
            },
          )),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement)
    await expect(page.findByRole('button', { name: '重试' })).resolves
      .toBeVisible()
    await expect(page.queryByText('未获得')).toBeNull()
  },
}

let delivered = false
export const LiveUnlock: Story = {
  beforeEach: () => {
    delivered = false
    localStorage.removeItem('axiia-achievement-toasts:live-achievement-story')
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/v1/achievements', () =>
          HttpResponse.json({
            achievements: [{ slot: 1, tier: '铜' }],
            cursor: 0,
          })),
        http.get('/v1/achievements/events', () =>
          HttpResponse.json({
            achievements: delivered
              ? [{ ...rows[0], earnedAt: Math.floor(Date.now() / 1000) }]
              : [],
            cursor: delivered ? 1 : 0,
          })),
      ],
    },
  },
  render: () => (
    <MemoryRouter>
      <AchievementsProvider accountID='live-achievement-story'>
        <button
          type='button'
          onClick={() => {
            delivered = true
          }}
        >
          模拟结算
        </button>
        <AchievementsPage />
      </AchievementsProvider>
    </MemoryRouter>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement)
    const { userEvent } = await import('storybook/test')
    await userEvent.click(await page.findByRole('button', { name: '模拟结算' }))
    const toast = await page.findByRole('complementary', { name: '获得成就' }, {
      timeout: 6000,
    })
    const notice = within(toast)
    await expect(notice.getByText('初试锋芒')).toBeVisible()
    await expect(notice.getByText('有人听进去了。')).toBeVisible()
    await expect(notice.queryByText('赢得你的第一场对局。')).toBeNull()
    await expect(notice.getByRole('link')).toHaveAttribute('target', '_blank')
    await expect(notice.getByRole('link')).toHaveAttribute(
      'href',
      '/achievements#first-word',
    )
    await userEvent.click(notice.getByRole('button', { name: '关闭成就提示' }))
    await expect(page.queryByRole('complementary', { name: '获得成就' }))
      .toBeNull()
  },
}
