import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'

import { notificationsFixture, scenarioList } from '../testing/v34-fixtures'
import { CatalogPage } from './catalog'
import { NotificationsPage } from './notifications'

function Surface({ page }: { page: 'catalog' | 'notifications' }) {
  return (
    <MemoryRouter>
      {page === 'catalog' ? <CatalogPage /> : <NotificationsPage />}
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Loading empty error states',
  component: Surface,
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const CatalogGateAndHonestStats: Story = {
  args: { page: 'catalog' },
  parameters: {
    msw: [
      http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('PVP 解锁 1/1·0/1')).toBeVisible()
    await expect(canvas.getByText('侧方胜率 · 对局数 — 数据积累中'))
      .toBeVisible()
    await expect(canvas.queryByText(/0%/)).toBeNull()
  },
}

export const NotificationsPopulated: Story = {
  args: { page: 'notifications' },
  parameters: {
    msw: [
      http.get(
        '/v1/notifications',
        () => HttpResponse.json(notificationsFixture),
      ),
      http.post(
        '/v1/notifications/:id/read',
        () => HttpResponse.json({ ok: true }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('1 条未读')).toBeVisible()
    await expect(canvas.getAllByText('对战结束')).toHaveLength(2)
    await userEvent.click(canvas.getByRole('button', { name: '标为已读' }))
    // F3：乐观已读——重取不再卸载列表：不闪「加载中…」，行原地留存，
    // 未读徽章与该行按钮就地消失。
    await expect(canvas.queryByText('加载中…')).toBeNull()
    await expect(canvas.getAllByText('对战结束')).toHaveLength(2)
    await expect(canvas.queryByText('1 条未读')).toBeNull()
    await expect(canvas.queryByRole('button', { name: '标为已读' })).toBeNull()
  },
}

export const NotificationsEmpty: Story = {
  args: { page: 'notifications' },
  parameters: {
    msw: [
      http.get(
        '/v1/notifications',
        () => HttpResponse.json({ notifications: [], unreadCount: 0 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('暂无通知。'))
      .toBeVisible()
  },
}

export const NotificationsLoading: Story = {
  args: { page: 'notifications' },
  parameters: {
    msw: [
      http.get('/v1/notifications', async () => {
        await delay('infinite')
        return HttpResponse.json({ notifications: [], unreadCount: 0 })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('加载中…')).toBeVisible()
  },
}

export const NotificationsError: Story = {
  args: { page: 'notifications' },
  parameters: {
    msw: [
      http.get('/v1/notifications', () =>
        HttpResponse.json(
          { error: 'upstream_unavailable', message: '通知服务暂不可用' },
          { status: 503 },
        )),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('通知服务暂不可用'))
      .toBeVisible()
  },
}
