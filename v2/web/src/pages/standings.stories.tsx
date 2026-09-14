import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'

import { StandingsPage } from './standings'
import { VersionAgentPage } from './version-agent'

function Destination() {
  const { agentId } = useParams()
  return <h1>智能体 {agentId}</h1>
}

function Surface({ path = '/tournaments/2' }: { path?: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='/tournaments/:tournamentId' element={<StandingsPage />} />
        <Route path='/versions/:versionId' element={<VersionAgentPage />} />
        <Route path='/agents/:agentId' element={<Destination />} />
      </Routes>
    </MemoryRouter>
  )
}

const entry = {
  playerID: 'standings-player',
  playerName: '参赛选手',
  submissionIDs: [360, 361],
  wins: 1,
  losses: 1,
  buchholz: 2,
  matchesPlayed: 2,
  winRate: 50,
  rank: 1,
}
const reference = { versionID: 360, agentID: 224 }

const meta = {
  title: 'v3.4/Standings navigation',
  component: Surface,
  parameters: {
    msw: [
      http.get(
        '/v1/tournaments/2/standings',
        () => HttpResponse.json({ entries: [entry] }),
      ),
      http.get('/v1/versions/360/ref', () => HttpResponse.json(reference)),
      http.get(
        '/v1/versions/361/ref',
        () => HttpResponse.json({ versionID: 361, agentID: 225 }),
      ),
    ],
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const SubmittedVersionOpensOwningAgent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByRole('link', {
      name: '查看版本 #360 的智能体',
    })
    // Both responsive layouts must keep each submitted version navigable.
    for (
      const selector of [
        '[data-tm="G.standings-mobile-list"]',
        '[data-tm="G.standings-row"]',
      ]
    ) {
      const layout = canvasElement.querySelector(selector)!
      await expect(layout.querySelector('a[href="/versions/360"]'))
        .not.toBeNull()
      await expect(layout.querySelector('a[href="/versions/361"]'))
        .not.toBeNull()
    }
    await userEvent.click(link)
    await expect(await canvas.findByRole('heading', { name: '智能体 224' }))
      .toBeVisible()
  },
}

export const OtherSubmittedVersionOpensItsOwnAgent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('link', {
        name: '查看版本 #361 的智能体',
      }),
    )
    await expect(await canvas.findByRole('heading', { name: '智能体 225' }))
      .toBeVisible()
  },
}

let failedRequests = 0
export const FailedReferenceCanRetry: Story = {
  args: { path: '/versions/360' },
  beforeEach: () => {
    failedRequests = 0
  },
  parameters: {
    msw: [
      http.get('/v1/versions/360/ref', () => {
        failedRequests++
        return failedRequests === 1
          ? HttpResponse.json(
            { error: 'unavailable', message: '暂不可用' },
            { status: 503 },
          )
          : HttpResponse.json(reference)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toBeVisible()
    await expect(canvas.queryByRole('heading')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: '重试' }))
    await expect(await canvas.findByRole('heading', { name: '智能体 224' }))
      .toBeVisible()
    await expect(failedRequests).toBe(2)
  },
}

let stalledRequests = 0
export const StalledReferenceCanRetry: Story = {
  args: { path: '/versions/360' },
  beforeEach: () => {
    stalledRequests = 0
  },
  parameters: {
    msw: [
      http.get('/v1/versions/360/ref', async () => {
        stalledRequests++
        if (stalledRequests === 1) await delay('infinite')
        return HttpResponse.json(reference)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 }))
      .toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '重试' }))
    await expect(await canvas.findByRole('heading', { name: '智能体 224' }))
      .toBeVisible()
    await expect(stalledRequests).toBe(2)
  },
}
