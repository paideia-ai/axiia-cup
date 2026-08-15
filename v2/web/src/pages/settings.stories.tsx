import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'

import type { MeResponse } from '../api/types'
import { AuthProvider } from '../context/auth'
import { SettingsPage } from './settings'

// SettingsPage 全部账户态来自 AuthProvider，因此故事里挂真 Provider、用 MSW
// 供 /v1/auth/me——与生产完全同一条数据通路，不 mock context。
const me: MeResponse = {
  account: {
    id: 'acct-1',
    email: 'player@example.com',
    displayName: '旧昵称',
    isAdmin: false,
    hasTOTP: false,
  },
  elevated: false,
  firstBattleDone: true,
}

function Surface() {
  return (
    <MemoryRouter>
      <AuthProvider>
        <SettingsPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Settings account self-service',
  component: Surface,
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

// 昵称就地编辑：编辑 → 预填当前名（此时保存禁用）→ 改名 → 保存 → 服务端答
// 完整 me → 页面显示新名 + 「已保存」确认。
export const ProfileEditFlow: Story = {
  parameters: {
    msw: [
      http.get('/v1/auth/me', () => HttpResponse.json(me)),
      http.patch('/v1/account/profile', async ({ request }) => {
        const body = (await request.json()) as { displayName: string }
        return HttpResponse.json({
          ...me,
          account: { ...me.account, displayName: body.displayName },
        })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('旧昵称')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '编辑' }))

    const input = canvas.getByLabelText('昵称')
    await expect(input).toHaveValue('旧昵称')
    // 未改动时保存不可点。
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled()

    await userEvent.clear(input)
    await expect(canvas.getByRole('button', { name: '保存' })).toBeDisabled()
    await userEvent.type(input, '新昵称')
    await userEvent.click(canvas.getByRole('button', { name: '保存' }))

    await expect(await canvas.findByText('新昵称')).toBeVisible()
    await expect(canvas.getByText('已保存')).toBeVisible()
    await expect(canvas.queryByText('旧昵称')).toBeNull()
  },
}

// 改密：当前密码错 → 服务端 401 invalid_credentials → 前端映射成产品文案
// 「当前密码不正确」；字段不清空，玩家改完当前密码可直接重试。
export const PasswordChangeInvalidCredentials: Story = {
  parameters: {
    msw: [
      http.get('/v1/auth/me', () => HttpResponse.json(me)),
      http.post(
        '/v1/account/password',
        () =>
          HttpResponse.json(
            {
              error: 'invalid_credentials',
              message: 'current password is incorrect',
            },
            { status: 401 },
          ),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('修改密码', { selector: 'h2' }))
      .toBeVisible()

    await userEvent.type(canvas.getByLabelText('当前密码'), 'wrong-pass')
    await userEvent.type(canvas.getByLabelText('新密码'), 'newpass123')
    await userEvent.type(canvas.getByLabelText('确认新密码'), 'newpass123')
    await userEvent.click(canvas.getByRole('button', { name: '修改密码' }))

    await expect(await canvas.findByText('当前密码不正确')).toBeVisible()
    await expect(canvas.queryByText('密码已修改，其他设备已退出登录'))
      .toBeNull()
  },
}

// 客户端先挡：两次新密码不一致时不发请求（无 handler 也不会 500）。
export const PasswordChangeMismatchBlockedLocally: Story = {
  parameters: {
    msw: [
      http.get('/v1/auth/me', () => HttpResponse.json(me)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('修改密码', { selector: 'h2' }))
      .toBeVisible()

    await userEvent.type(canvas.getByLabelText('当前密码'), 'old-pass-123')
    await userEvent.type(canvas.getByLabelText('新密码'), 'newpass123')
    await userEvent.type(canvas.getByLabelText('确认新密码'), 'newpass124')
    await userEvent.click(canvas.getByRole('button', { name: '修改密码' }))

    await expect(await canvas.findByText('两次输入的新密码不一致'))
      .toBeVisible()
  },
}
