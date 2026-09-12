import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { AppRoutes } from '../app-router'
import type { MeResponse, ScenarioDetail } from '../api/types'
import { AuthProvider } from '../context/auth'
import { config, scenario } from '../testing/v34-fixtures'

const member: MeResponse = {
  account: {
    id: 'public-reader',
    displayName: '场景读者',
    email: 'reader@example.test',
    phone: null,
    isAdmin: false,
    hasTOTP: false,
  },
  elevated: false,
  firstBattleDone: false,
}
const publicScenario: ScenarioDetail = {
  ...scenario,
  summary: { ...scenario.summary, gateProgress: undefined },
}
let authenticated = false
const personalRequests: string[] = []
const ensures: unknown[] = []

function RouteAddress() {
  const location = useLocation()
  return (
    <output data-testid='route-address'>
      {location.pathname}
      {location.search}
    </output>
  )
}

function Surface({ path }: { path: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <StrictMode>
        <AuthProvider>
          <AppRoutes />
          <RouteAddress />
        </AuthProvider>
      </StrictMode>
    </MemoryRouter>
  )
}

const handlers = [
  http.get(
    '/v1/auth/me',
    () =>
      authenticated
        ? HttpResponse.json(member)
        : HttpResponse.json({ error: 'unauthorized', message: '未登录' }, {
          status: 401,
        }),
  ),
  http.post('/v1/auth/login', () => {
    authenticated = true
    return HttpResponse.json(member)
  }),
  http.post('/v1/auth/signup', () => {
    authenticated = true
    return HttpResponse.json(member)
  }),
  http.get(
    '/v1/scenarios',
    ({ request }) => {
      expect(request.credentials).toBe(authenticated ? 'include' : 'omit')
      return HttpResponse.json({ scenarios: [publicScenario.summary] })
    },
  ),
  http.get('/v1/scenarios/:id', ({ request }) => {
    expect(request.credentials).toBe(authenticated ? 'include' : 'omit')
    return HttpResponse.json(publicScenario)
  }),
  http.get('/v1/my/agents', () => {
    personalRequests.push('inventory')
    return HttpResponse.json({ scenarios: [] })
  }),
  http.get('/v1/matches', () => {
    personalRequests.push('matches')
    return HttpResponse.json({ matches: [] })
  }),
  http.get('/v1/notifications/bell', () => {
    personalRequests.push('bell')
    return new HttpResponse('', {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }),
  http.post('/v1/agents/ensure', async ({ request }) => {
    expect(authenticated).toBe(true)
    ensures.push(await request.json())
    return HttpResponse.json({ agentID: 902 })
  }),
  http.get('/v1/agents/902/draft', () =>
    HttpResponse.json({
      fields: { prompt: '' },
      scenarioID: scenario.summary.id,
      side: 'b',
    })),
  http.get(
    '/v1/agents/902/versions',
    () => HttpResponse.json({ versions: [] }),
  ),
  http.get('/v1/agents/902/stream', () =>
    new HttpResponse('', {
      headers: { 'Content-Type': 'text/event-stream' },
    })),
  http.get('/v1/models', () => HttpResponse.json({ models: config.models })),
  http.get('/v1/config', () => HttpResponse.json(config)),
]

const meta = {
  title: 'v3.4/Public scenario browsing',
  component: Surface,
  parameters: { msw: handlers },
  loaders: [() => {
    authenticated = false
    personalRequests.length = 0
    ensures.length = 0
    localStorage.removeItem('axiia:tm')
    return {}
  }],
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const GuestCatalogAndDetail: Story = {
  args: { path: '/scenarios' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: '场景' }),
    ).toBeVisible()
    await expect(await canvas.findByText('数据积累中', { exact: true }))
      .toBeVisible()
    expect(canvas.queryByText(/对局数不足/)).toBeNull()
    expect(canvas.queryByRole('link', { name: '通知' })).toBeNull()
    expect(canvas.queryByTestId('logout')).toBeNull()
    expect(canvas.queryByText(/PVP 解锁|PVE 练习解锁/)).toBeNull()
    await userEvent.click(canvas.getByTestId('scenario-shangyang-court'))
    await expect(
      await canvas.findByRole('heading', { name: '商鞅变法 · 朝堂辩法' }),
    ).toBeVisible()
    await expect(await canvas.findByText('数据积累中', { exact: true }))
      .toBeVisible()
    expect(canvas.queryByText(/对局数不足/)).toBeNull()
    await expect(canvas.getByTestId('build-agent-b')).toBeEnabled()
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
    expect(canvas.getByTestId('route-address')).toHaveTextContent(
      '/scenarios/shangyang-court',
    )
  },
}

export const BuildAfterLoginKeepsChosenSide: Story = {
  args: { path: '/scenarios/shangyang-court' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('build-agent-b'))
    const destination = '/scenarios/shangyang-court/build?side=b'
    await waitFor(() =>
      expect(canvas.getByTestId('route-address')).toHaveTextContent(
        `/login?${new URLSearchParams({ next: destination })}`,
      )
    )
    expect(ensures).toEqual([])
    expect(personalRequests).toEqual([])
    const form = within(canvas.getByRole('tabpanel'))
    await userEvent.type(
      form.getByLabelText('邮箱', { selector: 'input' }),
      'reader@example.test',
    )
    await userEvent.type(form.getByLabelText('密码'), 'fixture-password')
    await userEvent.click(
      canvas.getByRole('button', { name: '登录' }),
    )
    await expect(await canvas.findByLabelText('策略提示词')).toBeVisible()
    expect(canvas.getByTestId('route-address')).toHaveTextContent(
      '/agents/902/build?scenario=shangyang-court&side=b',
    )
    expect(ensures).toEqual([{ scenarioID: 'shangyang-court', side: 'b' }])
  },
}

export const BuildAfterRegistrationKeepsChosenSide: Story = {
  args: { path: '/scenarios/shangyang-court/build?side=b' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('link', { name: '去注册' }))
    expect(canvas.getByTestId('route-address')).toHaveTextContent(
      '/register?next=',
    )
    expect(ensures).toEqual([])
    const form = within(canvas.getByRole('tabpanel'))
    await userEvent.type(
      form.getByLabelText(/注册码/, { selector: 'input' }),
      'fixture-invite',
    )
    await userEvent.type(form.getByLabelText('昵称'), '场景读者')
    await userEvent.type(
      form.getByLabelText('邮箱', { selector: 'input' }),
      'reader@example.test',
    )
    await userEvent.type(form.getByLabelText('密码'), 'fixture-password')
    await userEvent.click(canvas.getByRole('button', { name: '创建账户' }))
    await expect(await canvas.findByLabelText('策略提示词')).toBeVisible()
    expect(canvas.getByTestId('route-address')).toHaveTextContent(
      '/agents/902/build?scenario=shangyang-court&side=b',
    )
    expect(ensures).toEqual([{ scenarioID: 'shangyang-court', side: 'b' }])
  },
}
