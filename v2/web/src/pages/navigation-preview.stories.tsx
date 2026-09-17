import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { delay, http, HttpResponse } from 'msw'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from '../app-router'
import { AuthProvider } from '../context/auth'
import { SoundProvider } from '../context/sound'
import { resetNavigationCache } from '../lib/navigation-cache'
import {
  config,
  finishedMatch,
  inventory,
  notificationsFixture,
  scenario,
  versions,
} from '../testing/v34-fixtures'

function handlers(latency: number) {
  return [
    http.get('/v1/auth/me', () =>
      HttpResponse.json({
        account: {
          id: 'navigation-preview',
          displayName: '演示玩家',
          isAdmin: false,
        },
        elevated: false,
        firstBattleDone: true,
      })),
    http.get('/v1/notifications/bell', () =>
      new HttpResponse(': preview\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })),
    http.get('/v1/*', async ({ request }) => {
      await delay(latency)
      const path = new URL(request.url).pathname
      const json = HttpResponse.json
      if (path === '/v1/scenarios') {
        return json({ scenarios: [scenario.summary] })
      }
      if (path === `/v1/scenarios/${scenario.summary.id}`) return json(scenario)
      if (path.endsWith('/opponents')) return json({ opponents: [] })
      if (path === '/v1/my/agents') return json(inventory)
      if (path === '/v1/config') return json(config)
      if (path === '/v1/models') return json({ models: config.models })
      if (path === '/v1/matches') {
        return json({ matches: [finishedMatch.summary], open: true })
      }
      if (path === '/v1/matches/9001') return json(finishedMatch)
      if (path === '/v1/notifications') return json(notificationsFixture)
      if (path === '/v1/tournaments') {
        return json({
          tournaments: [{
            id: 1,
            scenarioID: scenario.summary.id,
            status: 'finished',
            currentRound: 3,
            totalRounds: 3,
          }],
        })
      }
      if (path === '/v1/tournaments/1/standings') {
        return json({
          entries: [{
            playerID: 'navigation-preview',
            playerName: '演示玩家',
            submissionIDs: [1002],
            wins: 2,
            losses: 1,
            buchholz: 4,
            matchesPlayed: 3,
            winRate: 66.7,
            rank: 1,
          }],
        })
      }
      const agent = /^\/v1\/agents\/(101|102)\/(draft|versions)$/.exec(path)
      if (agent) {
        const side = agent[1] === '101' ? 'a' : 'b'
        return json(
          agent[2] === 'draft'
            ? {
              fields: { prompt: versions[0].prompt },
              scenarioID: scenario.summary.id,
              side,
            }
            : {
              versions: side === 'a'
                ? versions
                : [{ ...versions[0], id: 1003, agentID: 102, isEntry: false }],
              entryVersionID: side === 'a' ? 1002 : null,
            },
        )
      }
      if (path === '/v1/versions/1002/ref') {
        return json({
          versionID: 1002,
          agentID: 101,
          scenarioID: scenario.summary.id,
          side: 'a',
          modelID: versions[0].modelID,
        })
      }
      return HttpResponse.json({
        error: 'preview_unavailable',
        message: '此功能未包含在切页预览中。',
      }, { status: 404 })
    }),
    // Catch every write: the preview never contacts a real account or match API.
    http.all('/v1/*', () =>
      HttpResponse.json({
        error: 'preview_read_only',
        message: '这是只读预览，不保存或发起对战。',
      }, { status: 405 })),
  ]
}

function NavigationPreview({ latency }: { latency: number }) {
  const [instance, setInstance] = useState(0)
  return (
    <>
      <aside className='flex flex-wrap items-center justify-between gap-2 border-b border-(--border-soft) bg-(--surface) px-4 py-3 text-sm text-(--foreground-subtle)'>
        <p>
          切页预览 · 演示数据 · 接口延迟 {latency}ms · 可切换 tab 和打开详情
        </p>
        <button
          type='button'
          className='rounded-md border border-(--border) px-3 py-1.5 text-(--foreground)'
          onClick={() => {
            resetNavigationCache()
            setInstance((value) => value + 1)
          }}
        >
          重置演示
        </button>
      </aside>
      <MemoryRouter key={instance} initialEntries={['/scenarios']}>
        <AuthProvider>
          <SoundProvider>
            <AppRoutes />
          </SoundProvider>
        </AuthProvider>
      </MemoryRouter>
    </>
  )
}

const meta = {
  title: 'Preview/Navigation loading',
  component: NavigationPreview,
  parameters: { fullApp: true, controls: { disable: true } },
} satisfies Meta<typeof NavigationPreview>
export default meta
type Story = StoryObj<typeof meta>

export const NormalNetwork: Story = {
  name: '正常网络 · 50ms',
  args: { latency: 50 },
  parameters: { msw: handlers(50) },
}

export const SlowNetwork: Story = {
  name: '慢网络 · 900ms',
  args: { latency: 900 },
  parameters: { msw: handlers(900) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The fixture itself waits 900ms; allow room for rendering on CI hosts.
    await canvas.findByTestId(`scenario-${scenario.summary.id}`, {}, {
      timeout: 5000,
    })
    const header = canvasElement.querySelector('[data-tm="NAV.header"]')
    const navigation = within(
      canvasElement.querySelector('[data-tm="NAV.desktop-nav"]') as HTMLElement,
    )
    await userEvent.click(navigation.getByRole('link', { name: '历史' }))
    await waitFor(
      () =>
        expect(canvasElement.querySelector('[data-tm="L.match-card"]')).not
          .toBeNull(),
      { timeout: 5000 },
    )
    await userEvent.click(navigation.getByRole('link', { name: '场景' }))
    await expect(canvas.getByTestId(`scenario-${scenario.summary.id}`))
      .toBeVisible()
    await expect(canvasElement.querySelector('[data-tm="D.loading"]'))
      .toBeNull()
    await expect(canvasElement.querySelector('[data-tm="NAV.header"]')).toBe(
      header,
    )
  },
}

export const VerySlowNetwork: Story = {
  name: '很慢网络 · 1800ms',
  args: { latency: 1800 },
  parameters: { msw: handlers(1800) },
}
