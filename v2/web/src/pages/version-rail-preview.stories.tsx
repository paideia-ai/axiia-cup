import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, NavLink } from 'react-router-dom'

import type { AgentVersionDTO } from '../api/types'
import { AppRoutes } from '../app-router'
import { AuthProvider } from '../context/auth'
import { SoundProvider } from '../context/sound'
import { config, scenario } from '../testing/v34-fixtures'
import { navigationVersions } from '../testing/version-navigation-fixtures'

const agents = [
  { id: 101, count: 2, name: '初试' },
  { id: 102, count: 12, name: '推敲' },
  { id: 103, count: 40, name: '迭代' },
]
const models = [{ id: 'glm-5.2', label: 'GLM-5.2' }]
let saved = new Map<number, AgentVersionDTO[]>()

function reset() {
  const now = Math.floor(Date.now() / 1000)
  saved = new Map(agents.map((agent) => [
    agent.id,
    navigationVersions(agent.count, agent.id).map((version, index) => ({
      ...version,
      modelID: models[0].id,
      createdAt: now - (agent.count - index) * 86400,
      isEntry: agent.id === 101 && index === agent.count - 1,
    })),
  ]))
}
reset()

function VersionRailPreview() {
  return (
    <MemoryRouter initialEntries={['/agents/102']}>
      <aside className='border-b border-(--border-soft) bg-(--surface) px-4 py-3 text-(--foreground)'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold'>版本目录 · 交互预览</p>
            <p className='mt-1 text-xs text-(--foreground-subtle)'>
              上下滑动左侧刻度，浏览不同版本。停下后，目录轻轻淡出。
            </p>
          </div>
          <nav aria-label='选择版本数量' className='flex gap-1'>
            {agents.map((agent) => (
              <NavLink
                key={agent.id}
                to={`/agents/${agent.id}`}
                className='inline-flex min-h-11 items-center rounded-full border border-(--border-soft) px-4 text-xs text-(--foreground-subtle) transition-colors aria-[current=page]:border-(--accent) aria-[current=page]:bg-(--accent)/10 aria-[current=page]:text-(--foreground)'
              >
                {agent.count} 个版本
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <AuthProvider>
        <SoundProvider>
          <AppRoutes />
        </SoundProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

const meta = {
  title: 'Preview/Version rail',
  component: VersionRailPreview,
  beforeEach: reset,
  parameters: {
    fullApp: true,
    controls: { disable: true },
    msw: [
      http.get('/v1/auth/me', () =>
        HttpResponse.json({
          account: {
            id: 'version-rail-preview',
            displayName: '演示玩家',
            isAdmin: false,
          },
          elevated: false,
          firstBattleDone: true,
        })),
      http.get(
        '/v1/notifications/bell',
        () =>
          new HttpResponse(': preview\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
          }),
      ),
      http.get(
        '/v1/notifications',
        () => HttpResponse.json({ notifications: [], unreadCount: 0 }),
      ),
      http.get('/v1/config', () => HttpResponse.json({ ...config, models })),
      http.get('/v1/models', () => HttpResponse.json({ models })),
      http.get(
        '/v1/scenarios',
        () => HttpResponse.json({ scenarios: [scenario.summary] }),
      ),
      http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
      http.get('/v1/my/agents', () =>
        HttpResponse.json({
          scenarios: [{
            scenarioID: scenario.summary.id,
            title: scenario.summary.title,
            gateProgress: scenario.summary.gateProgress,
            entryReady: false,
            sides: {
              a: agents.map((agent) => ({
                agentID: agent.id,
                name: agent.name,
                versionCount: agent.count,
                latestVersionID: saved.get(agent.id)!.at(-1)!.id,
                entryVersionID: saved.get(agent.id)!.find((v) => v.isEntry)
                  ?.id ?? null,
              })),
              b: [],
            },
          }],
        })),
      http.get('/v1/agents/:id/draft', () =>
        HttpResponse.json({
          fields: {},
          scenarioID: scenario.summary.id,
          side: 'a',
        })),
      http.get('/v1/agents/:id/versions', ({ params }) => {
        const versions = saved.get(Number(params.id)) ?? []
        return HttpResponse.json({
          versions,
          entryVersionID: versions.find((version) => version.isEntry)?.id ??
            null,
        })
      }),
      http.get('/v1/agents/:id/diff', ({ params, request }) => {
        const query = new URL(request.url).searchParams
        const versions = saved.get(Number(params.id)) ?? []
        return HttpResponse.json({
          base: versions.find((version) =>
            version.id === Number(query.get('base'))
          ),
          head: versions.find((version) =>
            version.id === Number(query.get('head'))
          ),
        })
      }),
      // Entry changes only update this preview's in-memory sample data.
      http.post('/v1/agents/:id/entry/:version', ({ params }) => {
        for (const versions of saved.values()) {
          for (const version of versions) {
            version.isEntry = version.id === Number(params.version)
          }
        }
        return HttpResponse.json({ ok: true })
      }),
      http.get(
        '/v1/matches',
        () => HttpResponse.json({ matches: [], open: true }),
      ),
      http.get(
        '/v1/agents/:id/matches',
        () => HttpResponse.json({ matches: [], open: true }),
      ),
      http.all('/v1/*', () =>
        HttpResponse.json({
          error: 'preview_only',
          message: '此操作不在版本目录预览范围内。',
        }, { status: 403 })),
    ],
  },
} satisfies Meta<typeof VersionRailPreview>
export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: '版本（12）' })
    const directory = canvas.getByRole('navigation', { name: '版本快速导航' })
    await expect(within(directory).getAllByRole('link')).toHaveLength(12)
    // The empty space centering the first tick must not cover sibling-agent
    // links or headings. Only the visible version rows should receive taps.
    const first = within(directory).getAllByRole('link')[0]
    await waitFor(() => {
      const rail = directory.getBoundingClientRect()
      const row = first.getBoundingClientRect()
      expect(row.top - rail.top).toBeGreaterThan(10)
      const x = rail.left + rail.width / 2
      const blank = document.elementFromPoint(x, row.top - 10)
      expect(directory.contains(blank)).toBe(false)
      const tick = document.elementFromPoint(x, row.top + row.height / 2)
      expect(first.contains(tick)).toBe(true)
    })
  },
}
