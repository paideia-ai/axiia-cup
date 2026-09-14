import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import type { AgentVersionDTO, DispatchPVERequest } from '../api/types'
import { config, finishedMatch, scenario } from '../testing/v34-fixtures'
import { BuilderPage } from './builder'
import { MatchDetailPage } from './match-detail'
import { AuthProvider, useAuth } from '../context/auth'

const saved: AgentVersionDTO = {
  id: 9001,
  agentID: 101,
  ordinal: 1,
  snapshotSeq: 0,
  isEntry: true,
  prompt: '已保存策略：先核对证据。',
  modelID: 'fixture-model',
}
let versions: AgentVersionDTO[] = []
let draft = ''
let saves = 0
let posts: DispatchPVERequest[] = []
let releasePost: (() => void) | null = null
let releaseMutation: (() => void) | null = null
let mutationGate: Promise<void> | null = null
let releaseSave: (() => void) | null = null
let failMutations = false

function BuilderHost() {
  const [generation, setGeneration] = useState(0)
  const location = useLocation()
  return (
    <>
      <button type='button' onClick={() => setGeneration((value) => value + 1)}>
        重新打开构建器
      </button>
      <Link to='/scenarios'>离开构建器</Link>
      <Link
        to={`${location.pathname}${location.search}${
          location.hash === '#same-agent' ? '#same-agent-again' : '#same-agent'
        }`}
      >
        切换构建器位置
      </Link>
      <BuilderPage key={generation} />
    </>
  )
}

function Destination() {
  const location = useLocation()
  return (
    <p data-testid='destination'>
      {location.pathname}:{JSON.stringify(location.state)}
    </p>
  )
}

function Surface() {
  return (
    <MemoryRouter initialEntries={['/agents/101/build?express=1']}>
      <Routes>
        <Route path='/agents/:agentId/build' element={<BuilderHost />} />
        <Route path='/matches/:matchId' element={<Destination />} />
        <Route path='/scenarios' element={<Destination />} />
      </Routes>
    </MemoryRouter>
  )
}

const handlers = [
  http.get('/v1/config', () => HttpResponse.json(config)),
  http.get(
    '/v1/models',
    () =>
      HttpResponse.json({
        models: [{ id: 'fixture-model', label: 'Fixture' }],
      }),
  ),
  http.get('/v1/my/agents', () => HttpResponse.json({ scenarios: [] })),
  http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
  http.get(
    '/v1/agents/101/draft',
    () =>
      HttpResponse.json({
        fields: { prompt: draft },
        scenarioID: scenario.summary.id,
        side: 'a',
      }),
  ),
  http.get('/v1/agents/101/versions', () => HttpResponse.json({ versions })),
  http.get(
    '/v1/agents/101/stream',
    () =>
      new HttpResponse('', {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
  ),
  http.post('/v1/agents/101/mutate', async ({ request }) => {
    draft = (await request.json() as { value: string }).value
    return HttpResponse.json({ ok: true })
  }),
  http.post('/v1/agents/101/save', async ({ request }) => {
    saves += 1
    const value = { ...saved, ...await request.json() as object }
    versions = [value]
    return HttpResponse.json(value)
  }),
  http.post('/v1/matches/pve', async ({ request }) => {
    posts.push(await request.json() as DispatchPVERequest)
    await new Promise<void>((resolve) => {
      releasePost = resolve
    })
    return HttpResponse.json({ matchID: 7001 })
  }),
]

const meta = {
  title: 'A3/Save then explicitly start',
  component: Surface,
  beforeEach: () => {
    localStorage.clear()
    sessionStorage.clear()
    versions = []
    draft = ''
    saves = 0
    posts = []
    releasePost = null
    releaseMutation = null
    mutationGate = null
    releaseSave = null
    failMutations = false
    return () => {
      releasePost?.()
      releaseMutation?.()
      releaseSave?.()
    }
  },
  parameters: { msw: handlers },
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>

export const SaveReloadAndExplicitStart: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    expect(canvas.getByRole('button', { name: 'MCQ' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: '元提示词' }))
    expect(canvas.getByLabelText('策略构建提示词内容')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '直接编写' }))
    await userEvent.type(input, saved.prompt)
    await userEvent.click(canvas.getByRole('button', { name: '保存版本' }))
    expect(await canvas.findByText('已保存版本 v1（#9001）')).toBeVisible()
    expect(saves).toBe(1)
    expect(posts).toHaveLength(0)
    await userEvent.click(
      canvas.getByRole('button', { name: '重新打开构建器' }),
    )
    await canvas.findByText('已保存版本 v1（#9001）')
    await waitFor(() =>
      expect(canvas.getByTestId('start-first-battle')).toBeEnabled()
    )
    await userEvent.type(
      canvas.getByLabelText('策略提示词'),
      '尚未保存的追加内容',
    )
    expect(canvas.getByText(/工作区有未保存修改/)).toBeVisible()
    const start = canvas.getByTestId('start-first-battle')
    await userEvent.dblClick(start)
    await waitFor(() => expect(posts).toHaveLength(1))
    expect(posts[0]).toEqual({
      versionID: saved.id,
      presetKey: 'ganlong-steady',
    })
    expect(saves).toBe(1)
    releasePost?.()
    expect(await canvas.findByTestId('destination')).toHaveTextContent(
      '/matches/7001:{"express":true}',
    )
  },
}

export const RejectedStartRetriesSavedVersion: Story = {
  beforeEach: () => {
    versions = [saved]
    draft = saved.prompt
  },
  parameters: {
    msw: [
      http.post('/v1/matches/pve', async ({ request }) => {
        posts.push(await request.json() as DispatchPVERequest)
        return posts.length === 1
          ? HttpResponse.json({
            error: 'daily_limit',
            message: 'quota rejected',
          }, { status: 429 })
          : HttpResponse.json({ matchID: 7002 })
      }),
      ...handlers.filter((handler) =>
        !handler.info.path?.toString().includes('/matches/pve')
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = await canvas.findByTestId('start-first-battle')
    await waitFor(() => expect(start).toBeEnabled())
    await userEvent.click(start)
    expect(await canvas.findByText(/版本已保存，可再次点击/)).toBeVisible()
    await waitFor(() => expect(start).toBeEnabled())
    await userEvent.click(start)
    expect(await canvas.findByTestId('destination')).toHaveTextContent(
      '/matches/7002',
    )
    expect(saves).toBe(0)
    expect(posts).toEqual([{ versionID: 9001, presetKey: 'ganlong-steady' }, {
      versionID: 9001,
      presetKey: 'ganlong-steady',
    }])
  },
}

export const AmbiguousStartSurvivesReload: Story = {
  beforeEach: () => {
    versions = [saved]
    draft = saved.prompt
  },
  parameters: {
    msw: [
      http.post('/v1/matches/pve', async ({ request }) => {
        posts.push(await request.json() as DispatchPVERequest)
        return HttpResponse.error()
      }),
      ...handlers.filter((handler) =>
        !handler.info.path?.toString().includes('/matches/pve')
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = await canvas.findByTestId('start-first-battle')
    await waitFor(() => expect(start).toBeEnabled())
    await userEvent.click(start)
    await canvas.findByText(/首战请求结果尚未确认，请到/)
    await userEvent.click(
      canvas.getByRole('button', { name: '重新打开构建器' }),
    )
    await canvas.findByText(/不会自动重新派发/)
    expect(canvas.queryByTestId('start-first-battle')).toBeNull()
    expect(canvas.getByRole('link', { name: '查看我的对局' })).toHaveAttribute(
      'href',
      '/matches',
    )
    expect(posts).toHaveLength(1)
    expect(saves).toBe(0)
  },
}

export const LateDispatchCannotTakeOverAnotherRoute: Story = {
  beforeEach: () => {
    versions = [saved]
    draft = saved.prompt
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = await canvas.findByTestId('start-first-battle')
    await waitFor(() => expect(start).toBeEnabled())
    await userEvent.click(start)
    await waitFor(() => expect(posts).toHaveLength(1))
    await userEvent.click(canvas.getByRole('link', { name: '离开构建器' }))
    releasePost?.()
    await waitFor(() =>
      expect(
        sessionStorage.getItem('axiia:first-battle-attempt:v1:anonymous:101'),
      ).toContain('accepted')
    )
    expect(canvas.getByTestId('destination')).toHaveTextContent('/scenarios')
    expect(posts).toHaveLength(1)
  },
}

export const SameAgentNavigationReconcilesCompletedRequests: Story = {
  beforeEach: () => {
    versions = [saved]
    draft = saved.prompt
    failMutations = true
  },
  parameters: {
    msw: [
      http.post('/v1/agents/101/mutate', async ({ request }) => {
        if (!failMutations) {
          draft = (await request.json() as { value: string }).value
          return HttpResponse.json({ ok: true })
        }
        mutationGate ??= new Promise<void>((resolve) => {
          releaseMutation = resolve
        })
        await mutationGate
        return HttpResponse.json({ error: 'unavailable' }, { status: 503 })
      }),
      http.post('/v1/agents/101/save', async ({ request }) => {
        saves += 1
        const next = {
          ...saved,
          ...await request.json() as object,
          id: 9002,
          ordinal: 2,
        }
        await new Promise<void>((resolve) => {
          releaseSave = resolve
        })
        versions = [...versions, next]
        return HttpResponse.json(next)
      }),
      http.post('/v1/matches/pve', async ({ request }) => {
        posts.push(await request.json() as DispatchPVERequest)
        await new Promise<void>((resolve) => {
          releasePost = resolve
        })
        return posts.length === 1
          ? HttpResponse.json({ error: 'daily_limit' }, { status: 429 })
          : HttpResponse.json({ matchID: 7003 })
      }),
      ...handlers.filter((handler) =>
        !['/matches/pve', '/mutate', '/save'].some((path) =>
          handler.info.path?.toString().includes(path)
        )
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    await userEvent.type(input, '修改')
    const save = canvas.getByRole('button', { name: '保存版本' })
    await userEvent.click(save)
    await waitFor(() => expect(releaseMutation).not.toBeNull())
    expect(save).toBeDisabled()
    await userEvent.click(canvas.getByRole('link', { name: '切换构建器位置' }))
    releaseMutation?.()
    // The same mounted builder must release both its render and synchronous
    // Save guards even though this location no longer owns the failed flush.
    await waitFor(() => expect(save).toBeEnabled())
    expect(saves).toBe(0)
    expect(posts).toHaveLength(0)
    await userEvent.click(save)
    await canvas.findByText('草稿暂存失败，请检查网络后重试；尚未创建新版本。')
    await waitFor(() => expect(save).toBeEnabled())

    failMutations = false
    await userEvent.click(save)
    await waitFor(() => expect(releaseSave).not.toBeNull())
    await userEvent.click(canvas.getByRole('link', { name: '切换构建器位置' }))
    releaseSave?.()
    await canvas.findByText('已保存版本 v2（#9002）')
    await waitFor(() => expect(save).toBeEnabled())
    expect(canvas.queryByTestId('destination')).toBeNull()
    expect(saves).toBe(1)
    expect(posts).toHaveLength(0)

    const start = canvas.getByTestId('start-first-battle')
    await userEvent.click(start)
    await waitFor(() => expect(posts).toHaveLength(1))
    await userEvent.click(canvas.getByRole('link', { name: '切换构建器位置' }))
    releasePost?.()
    await canvas.findByText(/版本已保存，可再次点击/)
    await waitFor(() => expect(start).toBeEnabled())
    expect(canvas.queryByTestId('destination')).toBeNull()
    expect(
      sessionStorage.getItem('axiia:first-battle-attempt:v1:anonymous:101'),
    ).toBeNull()

    await userEvent.click(start)
    await waitFor(() => expect(posts).toHaveLength(2))
    await userEvent.click(canvas.getByRole('link', { name: '切换构建器位置' }))
    releasePost?.()
    expect(await canvas.findByRole('button', { name: '继续首战 #7003' }))
      .toBeEnabled()
    expect(canvas.queryByTestId('destination')).toBeNull()
    expect(saves).toBe(1)
    expect(posts).toEqual([
      { versionID: 9002, presetKey: 'ganlong-steady' },
      { versionID: 9002, presetKey: 'ganlong-steady' },
    ])
  },
}

export const CompletedJourneyOpensEachActualTool: Story = {
  beforeEach: () => {
    versions = [saved]
    draft = saved.prompt
  },
  render: () => (
    <MemoryRouter
      initialEntries={[{ pathname: '/matches/9001', state: { express: true } }]}
    >
      <Link to='/matches/9001' state={{ express: true }}>返回首战</Link>
      <Routes>
        <Route path='/matches/:matchId' element={<MatchDetailPage />} />
        <Route path='/agents/:agentId/build' element={<BuilderPage />} />
      </Routes>
    </MemoryRouter>
  ),
  parameters: {
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(finishedMatch)),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (
      const [name, tool] of [['MCQ', 'mcq'], ['直接编写', 'raw'], [
        '元提示词',
        'meta',
      ]] as const
    ) {
      const link = await canvas.findByRole('link', { name })
      expect(link).toHaveAttribute('href', `/agents/101/build?init=${tool}`)
      await userEvent.click(link)
      const input = await canvas.findByLabelText('策略提示词')
      await waitFor(() => expect(input).toBeEnabled())
      expect(input).toHaveValue(saved.prompt)
      if (tool === 'raw') {
        await waitFor(() => expect(input).toHaveFocus())
        expect(canvas.queryByRole('dialog')).toBeNull()
      } else {
        const dialog = await canvas.findByRole('dialog', {
          name: tool === 'mcq' ? '选择预设策略' : '让你的AI帮你想策略',
        })
        expect(dialog).toBeVisible()
        if (tool === 'meta') {
          expect(within(dialog).getByLabelText('策略构建提示词内容'))
            .toBeVisible()
        } else {expect(within(dialog).getByRole('region', { name: '拼装预览' }))
            .toBeVisible()}
        await userEvent.click(
          within(dialog).getByRole('button', { name: '关闭弹窗' }),
        )
      }
      expect(saves).toBe(0)
      expect(posts).toHaveLength(0)
      await userEvent.click(canvas.getByRole('link', { name: '返回首战' }))
    }
  },
}

function IdentitySurface() {
  const auth = useAuth()
  if (auth.isLoading) return <p>身份加载中</p>
  return (
    <>
      <p data-testid='identity'>{auth.account?.id}</p>
      <button
        type='button'
        onClick={() =>
          void auth.login({
            email: 'second@example.test',
            password: 'test-only-password',
          })}
      >
        切换测试身份
      </button>
      <Surface />
    </>
  )
}

export const LateDispatchCannotTakeOverAnotherIdentity: Story = {
  beforeEach: () => {
    versions = [saved]
    draft = saved.prompt
  },
  render: () => (
    <AuthProvider>
      <IdentitySurface />
    </AuthProvider>
  ),
  parameters: {
    msw: [
      http.get('/v1/auth/me', () =>
        HttpResponse.json({
          account: {
            id: 'first-owner',
            displayName: 'First',
            isAdmin: false,
            hasTOTP: false,
          },
          firstBattleDone: false,
          elevated: false,
        })),
      http.post('/v1/auth/login', () =>
        HttpResponse.json({
          account: {
            id: 'second-owner',
            displayName: 'Second',
            isAdmin: false,
            hasTOTP: false,
          },
          firstBattleDone: false,
          elevated: false,
        })),
      ...handlers,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = await canvas.findByTestId('start-first-battle')
    await waitFor(() => expect(start).toBeEnabled())
    await userEvent.click(start)
    await waitFor(() => expect(posts).toHaveLength(1))
    await userEvent.click(canvas.getByRole('button', { name: '切换测试身份' }))
    await waitFor(() =>
      expect(canvas.getByTestId('identity')).toHaveTextContent('second-owner')
    )
    releasePost?.()
    await waitFor(() =>
      expect(
        sessionStorage.getItem('axiia:first-battle-attempt:v1:first-owner:101'),
      ).toContain('accepted')
    )
    expect(
      sessionStorage.getItem('axiia:first-battle-attempt:v1:second-owner:101'),
    ).toBeNull()
    expect(canvas.queryByTestId('destination')).toBeNull()
    expect(posts).toHaveLength(1)
  },
}
