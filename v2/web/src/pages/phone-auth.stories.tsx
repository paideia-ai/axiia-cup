import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'

import type { MeResponse, PhoneVerifyRequest } from '../api/types'
import { AuthProvider } from '../context/auth'
import { LoginPage } from './login'
import { RegisterPage } from './register'
import { SettingsPage } from './settings'

// 手机号验证码这条路的三个页面都挂真 AuthProvider + MSW，与生产同一条数据
// 通路：verify 与 bind 都答完整 me，账号态只经 context 落地。
const PHONE = '13800138000'
const CODE = '123456'

let codeRequest: { phone: string; inviteCode: string | null } | null = null
let verified: PhoneVerifyRequest | null = null

const me: MeResponse = {
  account: {
    id: 'acct-1',
    email: null,
    phone: PHONE,
    displayName: '手机号玩家',
    isAdmin: false,
    hasTOTP: false,
  },
  elevated: false,
  firstBattleDone: false,
}

// 「手机号」这个 label 同时裹住输入框与「发送验证码」按钮（按钮自带可访问
// 名，浏览器只把 input 当被标注控件），testing-library 两个都算——按 selector
// 收敛到 input。
function phoneInput(scope: ReturnType<typeof within>) {
  return scope.getByLabelText('手机号', { selector: 'input' })
}

const anonymous = http.get(
  '/v1/auth/me',
  () =>
    HttpResponse.json(
      { error: 'unauthorized', message: '未登录' },
      { status: 401 },
    ),
)

function surface(Page: () => React.ReactNode) {
  return () => (
    <MemoryRouter>
      <AuthProvider>
        <Page />
      </AuthProvider>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Phone auth',
} satisfies Meta

export default meta

// 已注册号码：发码答 registered=true → 不问昵称，按钮写「登录」，verify 的
// displayName 必须是 null（服务端据此走登录而不是开号）。
export const LoginKnownPhone: StoryObj = {
  render: surface(LoginPage),
  parameters: {
    msw: [
      anonymous,
      http.post('/v1/auth/sms/code', () =>
        HttpResponse.json({
          registered: true,
        })),
      http.post('/v1/auth/sms/verify', async ({ request }) => {
        verified = (await request.json()) as PhoneVerifyRequest
        return HttpResponse.json(me)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    verified = null
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('tab', { name: '手机号' }))

    const send = canvas.getByRole('button', { name: '发送验证码' })
    await expect(send).toBeDisabled()
    await userEvent.type(phoneInput(canvas), PHONE)
    await expect(send).toBeEnabled()
    await userEvent.click(send)

    await expect(await canvas.findByLabelText('验证码')).toBeVisible()
    // 已注册 → 不问昵称。
    await expect(canvas.queryByLabelText('昵称')).toBeNull()
    // 发码后进入 60s 冷却，重发按钮变倒计时。
    await expect(canvas.getByRole('button', { name: /^\d+s$/ }))
      .toBeDisabled()

    await userEvent.type(canvas.getByLabelText('验证码'), CODE)
    await userEvent.click(canvas.getByRole('button', { name: '登录' }))
    await waitFor(() =>
      expect(verified).toEqual({
        phone: PHONE,
        code: CODE,
        displayName: null,
      })
    )
  },
}

// 未注册号码：发码答 registered=false → 追加昵称输入，按钮写「创建账户」，
// 注册码随发码请求上行（服务端先验后扣）。
export const RegisterNewPhone: StoryObj = {
  render: surface(RegisterPage),
  parameters: {
    msw: [
      anonymous,
      http.post('/v1/auth/sms/code', async ({ request }) => {
        codeRequest = (await request.json()) as {
          phone: string
          inviteCode: string | null
        }
        return HttpResponse.json({ registered: false })
      }),
      http.post('/v1/auth/sms/verify', async ({ request }) => {
        verified = (await request.json()) as PhoneVerifyRequest
        return HttpResponse.json(me)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    codeRequest = null
    verified = null
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('tab', { name: '手机号' }))

    // 两栏都有「注册码」，隐藏栏仍在 DOM 里——一律锚到当前可见的面板上。
    const phone = within(canvas.getByRole('tabpanel'))
    await userEvent.type(phone.getByLabelText(/注册码/), 'axiia_cup')
    await userEvent.type(phoneInput(phone), PHONE)
    await userEvent.click(phone.getByRole('button', { name: '发送验证码' }))
    await waitFor(() =>
      expect(codeRequest).toEqual({ phone: PHONE, inviteCode: 'axiia_cup' })
    )

    await expect(await phone.findByLabelText('昵称')).toBeVisible()
    await userEvent.type(phone.getByLabelText('验证码'), CODE)
    await userEvent.type(phone.getByLabelText('昵称'), '新玩家')
    await userEvent.click(phone.getByRole('button', { name: '创建账户' }))
    await waitFor(() =>
      expect(verified).toEqual({
        phone: PHONE,
        code: CODE,
        displayName: '新玩家',
      })
    )
  },
}

// 节流：429 + Retry-After 也起倒计时——服务端已经为这个号算好预算，界面不该
// 再怂恿一次注定被拒的重发；验证码输入框不出现（这次没发出去）。
export const SendCodeThrottled: StoryObj = {
  render: surface(LoginPage),
  parameters: {
    msw: [
      anonymous,
      http.post(
        '/v1/auth/sms/code',
        () =>
          HttpResponse.json(
            { error: 'throttled', message: '请稍后再获取验证码' },
            { status: 429, headers: { 'Retry-After': '45' } },
          ),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('tab', { name: '手机号' }))
    await userEvent.type(phoneInput(canvas), PHONE)
    await userEvent.click(canvas.getByRole('button', { name: '发送验证码' }))

    await expect(await canvas.findByText('请稍后再获取验证码')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^\d+s$/ })).toBeDisabled()
    await expect(canvas.queryByLabelText('验证码')).toBeNull()
  },
}

// 绑定：settings 页的卡片按已绑/未绑换标题，bind 答完整 me，个人资料区的
// 手机号行随 context 即时更新（不重拉 /auth/me）。
export const BindPhoneFromSettings: StoryObj = {
  render: surface(SettingsPage),
  parameters: {
    msw: [
      http.get(
        '/v1/auth/me',
        () =>
          HttpResponse.json({
            ...me,
            account: { ...me.account, phone: null, email: 'p@example.com' },
          }),
      ),
      http.post('/v1/auth/phone/code', () =>
        HttpResponse.json({
          registered: true,
        })),
      http.post(
        '/v1/auth/phone/bind',
        () =>
          HttpResponse.json({
            ...me,
            account: { ...me.account, email: 'p@example.com' },
          }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('绑定手机号')).toBeVisible()

    await userEvent.type(canvas.getByLabelText('手机号'), PHONE)
    await userEvent.click(canvas.getByRole('button', { name: '发送验证码' }))
    await userEvent.type(await canvas.findByLabelText('验证码'), CODE)
    await userEvent.click(canvas.getByRole('button', { name: '确认绑定' }))

    await expect(await canvas.findByText(PHONE)).toBeVisible()
    await expect(canvas.getByText('更换手机号')).toBeVisible()
  },
}
