import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type {
  AchievementDTO,
  AchievementEventDTO,
  EarnedAchievementDTO,
  NotificationDTO,
} from '../api/types'
import { AchievementToast } from '../components/achievement-toast'
import { AuthProvider, useAuth } from '../context/auth'
import { invalidateNavigation } from '../lib/navigation-cache'
import { AchievementCollection, AchievementsPage } from './achievements'
import { NotificationsPage } from './notifications'
import { SettingsPage } from './settings'

const earned: EarnedAchievementDTO = {
  id: 'first-word',
  tier: 'bronze',
  unlocked: true,
  title: '初试锋芒',
  flavor: '有人听进去了。',
  description: '赢得你的第一场对局。',
  iconURL: '/achievements/first-word.webp',
  unlockedAt: 1791028800,
  matchID: 101,
}
const allRoles: EarnedAchievementDTO = {
  ...earned,
  id: 'all-roles',
  tier: 'gold',
  title: '众生皆我',
  flavor: '随便给我一边。',
  description: '用首发五个场景的全部 12 个角色，各赢得一场 PvP 对局。',
  iconURL: '/achievements/all-roles.webp',
}
const hundredLosses: EarnedAchievementDTO = {
  ...earned,
  id: 'hundred-losses',
  title: '百折，尚未不挠',
  flavor: '',
  description: '累计输掉 100 场对局。',
  iconURL: '/achievements/hundred-losses.webp',
  matchID: null,
}
const collection: AchievementDTO[] = [
  earned,
  { id: 'opaque-gold-1', tier: 'gold', unlocked: false },
  { id: 'opaque-gold-2', tier: 'gold', unlocked: false },
  { id: 'opaque-silver-1', tier: 'silver', unlocked: false },
  { id: 'opaque-bronze-1', tier: 'bronze', unlocked: false },
]

const meta = {
  title: 'Achievements/Collection and delivery',
  component: AchievementCollection,
  args: { achievements: collection },
  render: (args) => (
    <MemoryRouter>
      <AchievementCollection {...args} />
    </MemoryRouter>
  ),
  parameters: { a11y: { test: 'error' } },
} satisfies Meta<typeof AchievementCollection>
export default meta
type Story = StoryObj<typeof meta>

export const EarnedDetailsAndPrivateLockedSlots: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getAllByRole('heading', { level: 2 }).map((element) =>
        element.textContent
      ),
    )
      .toEqual(['金级成就', '银级成就', '铜级成就'])
    await expect(canvas.getAllByRole('img', { name: '未解锁成就' }))
      .toHaveLength(4)
    await expect(canvas.getByText('赢得你的第一场对局。')).toBeVisible()
    await expect(canvas.getByText('“有人听进去了。”')).toBeVisible()
    await expect(canvasElement.querySelectorAll('img')).toHaveLength(1)
    await expect(canvasElement.querySelector('[id^="opaque-"]')).toBeNull()
  },
}

export const EmptyFlavorAndNativeDateLinks: Story = {
  render: () => (
    <MemoryRouter>
      <Routes>
        <Route
          path='/'
          element={
            <AchievementCollection achievements={[earned, hundredLosses]} />
          }
        />
        <Route path='/matches/101' element={<h1>对战 #101</h1>} />
      </Routes>
    </MemoryRouter>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const noMatch = canvas.getByRole('heading', { name: '百折，尚未不挠' })
      .closest('li')!
    await expect(within(noMatch).getByText('累计输掉 100 场对局。'))
      .toBeVisible()
    await expect(within(noMatch).getByText(/获得$/)).toBeVisible()
    await expect(within(noMatch).queryByRole('link')).toBeNull()
    await expect(
      [...noMatch.querySelectorAll('p')].every((paragraph) =>
        paragraph.textContent?.trim()
      ),
    ).toBe(true)
    await expect(canvas.queryByText('“”')).toBeNull()
    const dateLink = canvas.getByRole('link', { name: /获得$/ })
    await expect(dateLink).toHaveAttribute('href', '/matches/101')
    await expect(dateLink).not.toHaveAttribute('target')
    await expect(dateLink.querySelector('time')).toHaveAttribute(
      'datetime',
      new Date(earned.unlockedAt * 1000).toISOString(),
    )
    await userEvent.click(dateLink)
    await expect(canvas.getByRole('heading', { name: '对战 #101' }))
      .toBeVisible()
  },
}

function ToastQueue() {
  const [next, setNext] = useState(0)
  const rows: AchievementEventDTO[] = [earned, allRoles, hundredLosses].map((
    achievement,
    index,
  ) => ({
    id: 9100 + index,
    achievement,
    source: 'live',
    notificationID: index,
    occurredAt: Date.now() / 1000,
  }))
  return (
    <MemoryRouter>
      <h1 className='text-xl'>进行中的对局</h1>
      {rows[next]
        ? (
          <AchievementToast
            key={next}
            accountID='toast-story'
            event={rows[next]}
            onDismiss={() => setNext((value) => value + 1)}
          />
        )
        : null}
    </MemoryRouter>
  )
}

export const ToastOnlyTitleAndFlavor: Story = {
  render: () => <ToastQueue />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByRole('link', { name: /初试锋芒/ })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(link).toHaveAttribute(
      'href',
      '/settings/achievements#first-word',
    )
    await expect(canvas.queryByText('赢得你的第一场对局。')).toBeNull()
    await waitFor(() =>
      expect(canvas.getByText('“有人听进去了。”')).toBeVisible()
    )
    await userEvent.click(canvas.getByRole('button', { name: '关闭成就提示' }))
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: /众生皆我/ })).toBeVisible()
    )
    await expect(canvas.getByRole('heading', { name: '进行中的对局' }))
      .toBeVisible()
    await expect(canvas.getByText('“随便给我一边。”')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '关闭成就提示' }))
    const emptyFlavor = canvas.getByRole('link', {
      name: '百折，尚未不挠，在新标签页打开成就中心',
    })
    await waitFor(() => expect(emptyFlavor).toBeVisible())
    await expect(emptyFlavor).toHaveTextContent('百折，尚未不挠')
    await expect(emptyFlavor.querySelector('[aria-live]')?.children)
      .toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: '关闭成就提示' }))
    await expect(canvas.queryByRole('complementary')).toBeNull()
  },
}

function AccountRoutes() {
  const { account } = useAuth()
  if (!account) return <p>正在恢复会话…</p>
  return (
    <Routes>
      <Route path='/settings' element={<SettingsPage />} />
      <Route path='/settings/achievements' element={<AchievementsPage />} />
    </Routes>
  )
}

export const AccountCardOpensCollection: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/settings']}>
      <AuthProvider>
        <AccountRoutes />
      </AuthProvider>
    </MemoryRouter>
  ),
  parameters: {
    msw: [
      http.get('/v1/auth/me', () =>
        HttpResponse.json({
          account: {
            id: 'achievement-reader',
            displayName: '成就读者',
            isAdmin: false,
            hasTOTP: false,
            phone: '+8613800000000',
            email: 'reader@example.test',
          },
          elevated: false,
          firstBattleDone: true,
        })),
      http.get(
        '/v1/achievements',
        () => HttpResponse.json({ achievements: collection, eventCursor: 1 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = await canvas.findByRole('link', { name: /成就中心/ })
    await expect(card).toHaveAttribute('href', '/settings/achievements')
    await expect(card).not.toHaveAttribute('target')
    await userEvent.click(card)
    await expect(await canvas.findByRole('heading', { name: '成就中心' }))
      .toBeVisible()
    await expect(await canvas.findByText('已获得 1 / 5')).toBeVisible()
    await expect(canvas.getByText('赢得你的第一场对局。')).toBeVisible()
    await expect(canvas.queryByText('每一次突破，都在这里留下印记。'))
      .toBeNull()
  },
}

function notification(id: number): NotificationDTO {
  const achievement = [earned, allRoles, hundredLosses][(id - 1) % 3]
  return {
    id,
    kind: 'achievement_unlocked',
    read: false,
    title: achievement.title,
    body: achievement.flavor,
    link: `/settings/achievements#${achievement.id}`,
  }
}
const notificationWorld = {
  rows: [notification(1)],
  nextID: 2,
  clearDone: false,
}
function NotificationsWithArrival() {
  return (
    <MemoryRouter>
      <button
        type='button'
        onClick={() => {
          notificationWorld.rows.push(notification(notificationWorld.nextID++))
          invalidateNavigation('/notifications')
        }}
      >
        收到新的成就
      </button>
      <NotificationsPage />
    </MemoryRouter>
  )
}

export const ArrivalAfterReadAllAndClear: Story = {
  beforeEach: () => {
    notificationWorld.rows = [notification(1)]
    notificationWorld.nextID = 2
    notificationWorld.clearDone = false
  },
  render: () => <NotificationsWithArrival />,
  parameters: {
    msw: [
      http.get(
        '/v1/notifications',
        () =>
          HttpResponse.json({
            notifications: notificationWorld.rows,
            unreadCount: notificationWorld.rows.filter((item) =>
              !item.read
            ).length,
          }),
      ),
      http.post('/v1/notifications/read-all', () => {
        notificationWorld.rows = notificationWorld.rows.map((item) => ({
          ...item,
          read: true,
        }))
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/v1/notifications', () => {
        notificationWorld.rows = []
        notificationWorld.clearDone = true
        return HttpResponse.json({ ok: true })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('成就达成')).toBeVisible()
    await expect(canvas.getByText('“有人听进去了。”')).toBeVisible()
    await expect(canvas.getByRole('link', { name: '查看成就 →' }))
      .toHaveAttribute('href', '/settings/achievements#first-word')
    await userEvent.click(canvas.getByRole('button', { name: '全部已读' }))
    await expect(canvas.getByRole('button', { name: '全部已读' }))
      .toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: '收到新的成就' }))
    await expect(await canvas.findByText('众生皆我')).toBeVisible()
    await expect(await canvas.findByText('1 条未读')).toBeVisible()
    const confirm = globalThis.confirm
    globalThis.confirm = () => true
    try {
      await userEvent.click(canvas.getByRole('button', { name: '清除' }))
      await expect(await canvas.findByText('暂无通知。')).toBeVisible()
      await waitFor(() => expect(notificationWorld.clearDone).toBe(true))
    } finally {
      globalThis.confirm = confirm
    }
    await userEvent.click(canvas.getByRole('button', { name: '收到新的成就' }))
    await expect(await canvas.findByText('百折，尚未不挠')).toBeVisible()
    await expect(canvas.queryByText('“”')).toBeNull()
    await expect(canvas.queryByText('“有人听进去了。”')).toBeNull()
    await expect(
      [...canvasElement.querySelectorAll('p')].every((paragraph) =>
        paragraph.textContent?.trim()
      ),
    ).toBe(true)
    await expect(canvas.getByText('1 条未读')).toBeVisible()
  },
}
