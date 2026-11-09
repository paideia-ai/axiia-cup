import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import type {
  MeResponse,
  PhoneVerifyRequest,
  SendPhoneCodeRequest,
  SignupRequest,
} from '../api/types'
import { AuthProvider } from '../context/auth'
import { LandingPage } from './landing'
import { LoginPage } from './login'
import { RegisterPage } from './register'

const INVITE = 'axiia_cup'
const PHONE = '13800138000'
const SMS = '123456'
const member: MeResponse = {
  account: {
    id: 'poster-preview',
    displayName: '海报玩家',
    email: 'poster@example.test',
    phone: PHONE,
    isAdmin: false,
    hasTOTP: false,
  },
  elevated: false,
  firstBattleDone: false,
}
let signups: SignupRequest[] = []
let smsRequests: SendPhoneCodeRequest[] = []
let verifications: PhoneVerifyRequest[] = []

function RouteAddress() {
  const location = useLocation()
  return (
    <output data-testid='route-address'>
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  )
}

function Surface({ entry }: { entry: string }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='*' element={<p>已完成模拟认证</p>} />
        </Routes>
        <RouteAddress />
      </AuthProvider>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Poster invite',
  beforeEach: () => {
    signups = []
    smsRequests = []
    verifications = []
  },
  parameters: {
    msw: [
      http.get(
        '/v1/auth/me',
        () =>
          HttpResponse.json({ error: 'unauthorized', message: '未登录' }, {
            status: 401,
          }),
      ),
      http.get('/v1/landing', () =>
        HttpResponse.json({
          demoMatches: [],
          topPlayers: [],
          totalBattles: 0,
        })),
      http.post('/v1/auth/signup', async ({ request }) => {
        const body = await request.json() as SignupRequest
        signups.push(body)
        return body.code ? HttpResponse.json(member) : HttpResponse.json({
          error: 'invalid_code',
          message: '请填写注册码',
        }, {
          status: 403,
        })
      }),
      http.post('/v1/auth/sms/code', async ({ request }) => {
        const body = await request.json() as SendPhoneCodeRequest
        smsRequests.push(body)
        return body.inviteCode
          ? HttpResponse.json({ registered: false })
          : HttpResponse.json({
            error: 'invalid_code',
            message: '请填写注册码',
          }, {
            status: 403,
          })
      }),
      http.post('/v1/auth/sms/verify', async ({ request }) => {
        verifications.push(await request.json() as PhoneVerifyRequest)
        return HttpResponse.json(member)
      }),
      http.post('/v1/auth/login', () => HttpResponse.json(member)),
    ],
  },
} satisfies Meta

export default meta

// An interactive local preview: every request is handled by MSW, including
// simulated signup/SMS. No account is created and no text message is sent.
export const Preview: StoryObj = {
  render: () => <Surface entry='/?invite=axiia_cup' />,
}

async function expectPrefilled(canvas: ReturnType<typeof within>) {
  const email = within(await canvas.findByRole('tabpanel'))
  await expect(email.getByLabelText(/注册码/)).toHaveValue(INVITE)
  await userEvent.click(canvas.getByRole('tab', { name: '手机号' }))
  await expect(
    within(canvas.getByRole('tabpanel')).getByLabelText(/注册码/),
  ).toHaveValue(INVITE)
}

export const HeaderRegistration: StoryObj = {
  ...Preview,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = await canvas.findByRole('link', { name: '注册' })
    await expect(canvas.getByRole('link', { name: '浏览场景' }))
      .toHaveAttribute(
        'href',
        '/scenarios',
      )
    await expect(header).toHaveAttribute('href', '/register?invite=axiia_cup')
    await expect(canvas.getByRole('link', { name: '立即注册' }))
      .toHaveAttribute(
        'href',
        '/register?invite=axiia_cup',
      )
    await userEvent.click(header)
    await expectPrefilled(canvas)
  },
}

export const MainRegistration: StoryObj = {
  ...Preview,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('link', { name: '立即注册' }))
    await expectPrefilled(canvas)
  },
}

function loginRoundTrip(link: string): StoryObj {
  const next = '/scenarios/scene-a/build?side=b#strategy'
  const params = new URLSearchParams({ invite: INVITE, next })
  return {
    render: () => <Surface entry={`/?${params}`} />,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement)
      await userEvent.click(
        await canvas.findByRole('link', { name: link }),
      )
      await expect(canvas.getByTestId('route-address')).toHaveTextContent(
        `/login?${params}`,
      )
      await userEvent.click(canvas.getByRole('link', { name: '去注册' }))
      await expect(canvas.getByTestId('route-address')).toHaveTextContent(
        `/register?${params}`,
      )
      await expectPrefilled(canvas)
      await userEvent.click(canvas.getByRole('link', { name: '去登录' }))
      await expect(canvas.getByTestId('route-address')).toHaveTextContent(
        `/login?${params}`,
      )
      await userEvent.click(canvas.getByRole('link', { name: '去注册' }))
      await expect(canvas.getByTestId('route-address')).toHaveTextContent(
        `/register?${params}`,
      )
      await expectPrefilled(canvas)
    },
  }
}

export const HeaderLoginRoundTrip = loginRoundTrip('登录')

export const LoginKeepsNext: StoryObj = {
  render: () => (
    <Surface entry='/login?invite=axiia_cup&next=%2Fmatches%2F42%23dialogue' />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = within(await canvas.findByRole('tabpanel'))
    await userEvent.type(email.getByLabelText('邮箱'), 'poster@example.test')
    await userEvent.type(email.getByLabelText('密码'), 'poster-password')
    await userEvent.click(email.getByRole('button', { name: '登录' }))
    await waitFor(() =>
      expect(canvas.getByTestId('route-address')).toHaveTextContent(
        '/matches/42#dialogue',
      )
    )
  },
}

function emailSubmission(
  code = INVITE,
  next = '/matches/42',
  destination = '/express',
): StoryObj {
  return {
    render: () => (
      <Surface
        entry={`/register?${new URLSearchParams({ invite: INVITE, next })}`}
      />
    ),
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement)
      let email = within(await canvas.findByRole('tabpanel'))
      const invite = email.getByLabelText(/注册码/)
      await expect(invite).toHaveValue(INVITE)
      if (code !== INVITE) {
        await userEvent.clear(invite)
        if (code) await userEvent.type(invite, code)
      }
      await userEvent.click(canvas.getByRole('tab', { name: '手机号' }))
      await userEvent.click(canvas.getByRole('tab', { name: '邮箱' }))
      email = within(canvas.getByRole('tabpanel'))
      await expect(email.getByLabelText(/注册码/)).toHaveValue(code)
      await userEvent.type(email.getByLabelText('昵称'), '海报玩家')
      await userEvent.type(email.getByLabelText('邮箱'), 'poster@example.test')
      await userEvent.type(email.getByLabelText('密码'), 'poster-password')
      await userEvent.click(email.getByRole('button', { name: '创建账户' }))
      await waitFor(() =>
        expect(signups).toEqual([{
          code,
          displayName: '海报玩家',
          email: 'poster@example.test',
          password: 'poster-password',
          phone: null,
        }])
      )
      if (code) {
        await waitFor(() =>
          expect(canvas.getByTestId('route-address')).toHaveTextContent(
            destination,
          )
        )
      } else {
        await expect(await email.findByText('请填写注册码')).toBeVisible()
        await expect(email.getByLabelText(/注册码/)).toHaveValue('')
      }
    },
  }
}

export const EmailPrefilledRequest = emailSubmission()
export const EmailEditedRequest = emailSubmission('other_invite')
export const EmailClearedRequest = emailSubmission('')
export const EmailKeepsBuildEntry = emailSubmission(
  INVITE,
  '/scenarios/scene-a/build?side=b',
  '/scenarios/scene-a/build?side=b',
)

function phoneSubmission(inviteCode = INVITE): StoryObj {
  return {
    render: () => <Surface entry='/register?invite=axiia_cup' />,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement)
      await userEvent.click(await canvas.findByRole('tab', { name: '手机号' }))
      let phone = within(canvas.getByRole('tabpanel'))
      const invite = phone.getByLabelText(/注册码/)
      await expect(invite).toHaveValue(INVITE)
      if (inviteCode !== INVITE) {
        await userEvent.clear(invite)
        if (inviteCode) await userEvent.type(invite, inviteCode)
      }
      await userEvent.click(canvas.getByRole('tab', { name: '邮箱' }))
      await userEvent.click(canvas.getByRole('tab', { name: '手机号' }))
      phone = within(canvas.getByRole('tabpanel'))
      await expect(phone.getByLabelText(/注册码/)).toHaveValue(inviteCode)
      await userEvent.type(
        phone.getByLabelText('手机号', { selector: 'input' }),
        PHONE,
      )
      await userEvent.click(phone.getByRole('button', { name: '发送验证码' }))
      await waitFor(() =>
        expect(smsRequests).toEqual([{
          phone: PHONE,
          inviteCode: inviteCode || null,
        }])
      )
      if (!inviteCode) {
        await expect(await phone.findByText('请填写注册码')).toBeVisible()
        await expect(phone.getByLabelText(/注册码/)).toHaveValue('')
        await expect(phone.queryByLabelText('验证码')).toBeNull()
        return
      }
      const sms = await phone.findByLabelText('验证码')
      await expect(sms).toHaveValue('')
      await userEvent.type(sms, SMS)
      await userEvent.type(phone.getByLabelText('昵称'), '海报玩家')
      await userEvent.click(phone.getByRole('button', { name: '创建账户' }))
      await waitFor(() =>
        expect(verifications).toEqual([{
          phone: PHONE,
          code: SMS,
          displayName: '海报玩家',
        }])
      )
      await waitFor(() =>
        expect(canvas.getByTestId('route-address')).toHaveTextContent(
          '/express',
        )
      )
    },
  }
}

export const PhonePrefilledRequest = phoneSubmission()
export const PhoneEditedRequest = phoneSubmission('other_invite')
export const PhoneClearedRequest = phoneSubmission('')

function manualEntry(search: string): StoryObj {
  return {
    render: () => <Surface entry={`/register${search}`} />,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement)
      const email = within(await canvas.findByRole('tabpanel'))
      await expect(email.getByLabelText(/注册码/)).toHaveValue('')
      await userEvent.click(canvas.getByRole('tab', { name: '手机号' }))
      await expect(
        within(canvas.getByRole('tabpanel')).getByLabelText(/注册码/),
      ).toHaveValue('')
      await expect(canvas.getByRole('link', { name: '去登录' }))
        .toHaveAttribute(
          'href',
          '/login',
        )
    },
  }
}

export const NoInvite = manualEntry('')
export const EmptyInvite = manualEntry('?invite=')
export const WhitespaceInvite = manualEntry('?invite=%20%20')
