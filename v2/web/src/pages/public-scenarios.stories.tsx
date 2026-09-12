import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { AppRoutes } from '../app-router'
import type {
  MeResponse,
  ScenarioDetail,
  ScenarioScoringDTO,
  ScenarioSummary,
} from '../api/types'
import { AuthProvider } from '../context/auth'
import { scenarioModule } from '../scenarios'
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
    await expect(canvas.getByText('难度 简单', { exact: false })).toBeVisible()
    await expect(canvas.getByText('适合新手', { exact: true })).toBeVisible()
    const card = within(canvas.getByTestId('scenario-shangyang-court'))
    const introduction = card.getByText(
      '五轮朝堂对辩定国策：说动秦孝公只是明线，把真请求悄悄送过关、再看穿甘龙所图，才是全部胜负。',
      { exact: true },
    )
    await expect(introduction).toBeVisible()
    await expect(card.getByText(scenario.summary.subject, { exact: true }))
      .toBeVisible()
    expect(introduction).not.toBe(
      card.getByText(scenario.summary.subject, { exact: true }),
    )
    await userEvent.click(canvas.getByTestId('scenario-shangyang-court'))
    await expect(
      await canvas.findByRole('heading', { name: '商鞅变法 · 朝堂辩法' }),
    ).toBeVisible()
    await expect(await canvas.findByText('数据积累中', { exact: true }))
      .toBeVisible()
    expect(canvas.queryByText(/对局数不足/)).toBeNull()
    await expect(canvas.getByText('难度 简单', { exact: false })).toBeVisible()
    await expect(canvas.getByText('适合新手', { exact: true })).toBeVisible()
    await expect(canvas.getByTestId('build-agent-b')).toBeEnabled()
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
    expect(canvas.getByTestId('route-address')).toHaveTextContent(
      '/scenarios/shangyang-court',
    )
  },
}

export const PublicDifficultyLevels: Story = {
  args: { path: '/scenarios' },
  parameters: {
    msw: [
      http.get('/v1/scenarios', () =>
        HttpResponse.json({
          scenarios: [
            publicScenario.summary,
            {
              ...publicScenario.summary,
              id: 'honnoji-decision',
              title: '本能寺',
            },
            {
              ...publicScenario.summary,
              id: 'fengyiting-real',
              title: '凤仪亭',
            },
            {
              ...publicScenario.summary,
              id: 'trolley-problem',
              title: '电车难题',
            },
            {
              ...publicScenario.summary,
              id: 'legal-harbor-murder-jury',
              title: '港口谋杀案陪审团',
            },
          ],
        })),
      http.get('/v1/scenarios/:id', ({ params }) =>
        HttpResponse.json({
          ...publicScenario,
          summary: {
            ...publicScenario.summary,
            id: params.id,
            title: '难度检查',
          },
        })),
      ...handlers.filter((handler) =>
        !handler.info.path.toString().startsWith('/v1/scenarios')
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (
      const [id, label, novice] of [
        ['shangyang-court', '简单', true],
        ['honnoji-decision', '中等', false],
        ['fengyiting-real', '困难', false],
        ['trolley-problem', '简单', true],
        ['legal-harbor-murder-jury', '困难', false],
      ] as const
    ) {
      const card = within(await canvas.findByTestId(`scenario-${id}`))
      await expect(card.getByText(`难度 ${label}`, { exact: false }))
        .toBeVisible()
      expect(card.queryByText('适合新手', { exact: true }) !== null).toBe(
        novice,
      )
      const hook = scenarioModule(id)?.education?.hook
      expect(hook).toBeTruthy()
      await expect(card.getByText(hook!, { exact: true })).toBeVisible()
      await expect(
        card.getByText(publicScenario.summary.subject, { exact: true }),
      )
        .toBeVisible()
    }
    await userEvent.click(canvas.getByTestId('scenario-honnoji-decision'))
    await expect(await canvas.findByText('难度 中等', { exact: false }))
      .toBeVisible()
    expect(canvas.queryByText('适合新手', { exact: true })).toBeNull()
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
  },
}

// The public API can describe scenarios without any local editorial module.
function publicScenarioHandlers(
  summaries: ScenarioSummary[],
  scoring?: ScenarioScoringDTO,
) {
  return [
    http.get('/v1/scenarios', ({ request }) => {
      expect(request.credentials).toBe('omit')
      return HttpResponse.json({ scenarios: summaries })
    }),
    http.get('/v1/scenarios/:id', ({ params, request }) => {
      expect(request.credentials).toBe('omit')
      const summary = summaries.find((item) => item.id === params.id)
      expect(summary).toBeDefined()
      return HttpResponse.json({
        ...publicScenario,
        summary,
        presets: [],
        scoring,
      })
    }),
    ...handlers.filter((handler) =>
      !handler.info.path.toString().startsWith('/v1/scenarios')
    ),
  ]
}

export const ServerMetadataAndEditorialFallbacks: Story = {
  args: { path: '/scenarios' },
  parameters: {
    msw: publicScenarioHandlers([
      {
        ...publicScenario.summary,
        id: 'server-guidance',
        title: '服务端场景',
        difficulty: 'hard',
        beginnerFriendly: true,
        estimatedMinutes: 17,
      },
      {
        ...publicScenario.summary,
        difficulty: 'medium',
        beginnerFriendly: false,
        estimatedMinutes: 23,
      },
      {
        ...publicScenario.summary,
        id: 'trolley-problem',
        title: '电车难题',
        beginnerFriendly: false,
      },
    ]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (
      const [id, difficulty, minutes, novice] of [
        ['server-guidance', '困难', 17, true],
        ['shangyang-court', '中等', 23, false],
        ['trolley-problem', '简单', 12, false],
      ] as const
    ) {
      const cardElement = await canvas.findByTestId(`scenario-${id}`)
      const card = within(cardElement)
      await expect(card.getByText(`难度 ${difficulty}`, { exact: false }))
        .toBeVisible()
      await expect(card.getByText(`约 ${minutes} 分钟`, { exact: true }))
        .toBeVisible()
      expect(card.queryByText('适合新手', { exact: true }) !== null).toBe(
        novice,
      )
      await expect(card.getByText('数据积累中', { exact: true })).toBeVisible()
      expect(card.queryByText(/侧方胜率|对局数不足/)).toBeNull()
      await userEvent.click(cardElement)
      const overview = within(
        (await canvas.findAllByTestId('scenario-intro-card')).find((card) =>
          card.dataset.tm === 'DA.overview-card'
        )!,
      )
      await expect(overview.getByText(`难度 ${difficulty}`, { exact: false }))
        .toBeVisible()
      await expect(
        overview.getByText(`一场约 ${minutes} 分钟`, { exact: true }),
      )
        .toBeVisible()
      expect(overview.queryByText('适合新手', { exact: true }) !== null).toBe(
        novice,
      )
      await expect(overview.getByText('数据积累中', { exact: true }))
        .toBeVisible()
      expect(overview.queryByText(/侧方胜率|对局数不足/)).toBeNull()
      expect(canvas.getByTestId('route-address')).toHaveTextContent(
        `/scenarios/${id}`,
      )
      await userEvent.click(canvas.getByRole('link', { name: 'AXIIA CUP' }))
    }
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
  },
}

export const MissingMetadataDoesNotInventGuidance: Story = {
  args: { path: '/scenarios' },
  parameters: {
    msw: publicScenarioHandlers([{
      ...publicScenario.summary,
      id: 'unannotated-scenario',
      title: '未附导读的场景',
    }]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cardElement = await canvas.findByTestId(
      'scenario-unannotated-scenario',
    )
    const card = within(cardElement)
    await expect(card.getByText('数据积累中', { exact: true })).toBeVisible()
    expect(card.queryByText(/难度|分钟|适合新手|侧方胜率|对局数不足/))
      .toBeNull()
    expect(card.queryByText(/五轮朝堂对辩/)).toBeNull()
    await userEvent.click(cardElement)
    const overview = within(
      (await canvas.findAllByTestId('scenario-intro-card')).find((card) =>
        card.dataset.tm === 'DA.overview-card'
      )!,
    )
    await expect(overview.getByText('数据积累中', { exact: true }))
      .toBeVisible()
    await expect(overview.getByText('场景导读整理中', { exact: true }))
      .toBeVisible()
    expect(overview.queryByText(/难度|分钟|适合新手|侧方胜率|对局数不足/))
      .toBeNull()
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
  },
}

const customScoring: ScenarioScoringDTO = {
  summary: '逐项累计本场得分。',
  items: [
    { id: 'evidence', label: '证据闭环', points: 2.75 },
    { id: 'repetition', label: '重复论证', points: -1.125 },
    { id: 'unused', label: '未使用机会', points: 0 },
  ],
  notes: ['分数相同时比较证据完整性。', '每项仅计入一次。'],
}
const obsoleteWeights = /\+0\.5|[−-]0\.25|[−-]0\.75|\+1(?![\d.])|[−-]1(?![\d.])/

export const PublicScoringUsesExactServerItems: Story = {
  args: { path: '/scenarios' },
  parameters: {
    msw: publicScenarioHandlers([
      {
        ...publicScenario.summary,
        id: 'server-scoring',
        title: '公开计分场景',
      },
      publicScenario.summary,
      { ...publicScenario.summary, id: 'honnoji-decision', title: '本能寺' },
      { ...publicScenario.summary, id: 'trolley-problem', title: '电车难题' },
    ], customScoring),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (
      const id of [
        'server-scoring',
        'shangyang-court',
        'honnoji-decision',
        'trolley-problem',
      ]
    ) {
      await userEvent.click(await canvas.findByTestId(`scenario-${id}`))
      await expect(
        await canvas.findByText('逐项累计本场得分。', { exact: true }),
      )
        .toBeVisible()
      const rows = canvasElement.querySelectorAll<HTMLElement>(
        '[data-tm="DA.score-rule-row"]',
      )
      expect(rows).toHaveLength(3)
      for (
        const [index, label, points] of [
          [0, '证据闭环', '+2.75'],
          [1, '重复论证', '−1.125'],
          [2, '未使用机会', '0'],
        ] as const
      ) {
        const row = within(rows[index])
        await expect(row.getByText(label, { exact: true })).toBeVisible()
        await expect(row.getByText(points, { exact: true })).toBeVisible()
      }
      await expect(
        canvas.getByText('分数相同时比较证据完整性。', { exact: true }),
      )
        .toBeVisible()
      await expect(canvas.getByText('每项仅计入一次。', { exact: true }))
        .toBeVisible()
      expect(canvas.queryByText('计分规则整理中', { exact: true })).toBeNull()
      expect(canvasElement.querySelector('[data-tm="DA.page"]')!.textContent)
        .not.toMatch(obsoleteWeights)
      await userEvent.click(canvas.getByRole('link', { name: 'AXIIA CUP' }))
    }
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
  },
}

export const MissingPublicScoringDoesNotInventWeights: Story = {
  args: { path: '/scenarios' },
  parameters: {
    msw: publicScenarioHandlers([
      publicScenario.summary,
      { ...publicScenario.summary, id: 'honnoji-decision', title: '本能寺' },
      { ...publicScenario.summary, id: 'trolley-problem', title: '电车难题' },
    ]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (
      const id of ['shangyang-court', 'honnoji-decision', 'trolley-problem']
    ) {
      await userEvent.click(await canvas.findByTestId(`scenario-${id}`))
      await expect(await canvas.findByText('计分规则整理中', { exact: true }))
        .toBeVisible()
      expect(canvasElement.querySelectorAll('[data-tm="DA.score-rule-row"]'))
        .toHaveLength(0)
      expect(canvasElement.querySelector('[data-tm="DA.page"]')!.textContent)
        .not.toMatch(obsoleteWeights)
      await userEvent.click(canvas.getByRole('link', { name: 'AXIIA CUP' }))
    }
    expect(personalRequests).toEqual([])
    expect(ensures).toEqual([])
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
