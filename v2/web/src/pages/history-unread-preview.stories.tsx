import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../app-router'
import { AuthProvider } from '../context/auth'
import { SoundProvider } from '../context/sound'
import {
  config,
  finishedMatch,
  inventory,
  scenarioList,
} from '../testing/v34-fixtures'
import type { MatchSummary } from '../api/types'

const base: MatchSummary = {
  ...finishedMatch.summary,
  initiatorIsMe: true,
  participants: {
    a: { agentID: 101, versionID: 1002, isMine: true },
    b: { agentID: 102, versionID: 1003, isMine: false },
  },
}
const rows: MatchSummary[] = [
  { ...base, id: 9006 },
  { ...base, id: 9005, winner: 'b' },
  { ...base, id: 9004, participants: undefined },
  { ...base, id: 9003, kind: 'pvp', challengeID: 81, challengeLeg: 1 },
  {
    ...base,
    id: 9002,
    kind: 'pvp',
    challengeID: 81,
    challengeLeg: 2,
    winner: 'b',
  },
  { ...base, id: 9001, finished: false, scored: false },
]
const unreadIDs = new Set([9006, 9004, 9003])

let viewed = new Set<number>()
let viewWrites = 0
let detailReads = 0
let rejectWrites = false
let rejectDetail = false
let includeViewed = true
const withViewed = (row: MatchSummary) => ({
  ...row,
  viewed: includeViewed
    ? !unreadIDs.has(row.id) || viewed.has(row.id)
    : undefined,
})

function HistoryUnreadPreview() {
  return (
    <MemoryRouter initialEntries={['/matches']}>
      <AuthProvider>
        <SoundProvider>
          <AppRoutes />
        </SoundProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

const meta = {
  title: 'Preview/History unread',
  component: HistoryUnreadPreview,
  beforeEach: () => {
    viewed = new Set()
    viewWrites = 0
    detailReads = 0
    rejectWrites = false
    rejectDetail = false
    includeViewed = true
  },
  parameters: {
    fullApp: true,
    controls: { disable: true },
    msw: [
      http.get(
        '/v1/auth/me',
        () =>
          HttpResponse.json({
            account: {
              id: 'unread-preview',
              displayName: '演示玩家',
              isAdmin: false,
            },
            elevated: false,
            firstBattleDone: true,
          }),
      ),
      http.get(
        '/v1/notifications/bell',
        () =>
          new HttpResponse(': preview\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
          }),
      ),
      http.get(
        '/v1/matches',
        () => HttpResponse.json({ matches: rows.map(withViewed), open: true }),
      ),
      http.get('/v1/matches/:id', ({ params }) => {
        detailReads++
        if (rejectDetail) {
          return HttpResponse.json(
            { error: 'failed', message: '战报加载失败' },
            { status: 503 },
          )
        }
        return HttpResponse.json({
          ...finishedMatch,
          summary: withViewed(
            rows.find((row) => row.id === Number(params.id)) ?? base,
          ),
        })
      }),
      http.post('/v1/matches/:id/view', ({ params }) => {
        viewWrites++
        if (rejectWrites) {
          return HttpResponse.json({ error: 'failed', message: '保存失败' }, {
            status: 503,
          })
        }
        viewed.add(Number(params.id))
        return HttpResponse.json({ ok: true })
      }),
      http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
      http.get('/v1/my/agents', () => HttpResponse.json(inventory)),
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get(
        '/v1/notifications',
        () => HttpResponse.json({ notifications: [], unreadCount: 0 }),
      ),
      http.all(
        '/v1/*',
        () =>
          HttpResponse.json({
            error: 'preview_only',
            message: '此功能不在样式预览范围内。',
          }, { status: 404 }),
      ),
    ],
  },
} satisfies Meta<typeof HistoryUnreadPreview>
export default meta
type Story = StoryObj<typeof meta>
export const SelectedDesign: Story = {}
export const OpenReportClearsOnlyThatMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const report = await canvas.findByRole('link', { name: /对战 #9006/ })
    await expect(canvas.getAllByRole('img', { name: '没有看过此对局' }))
      .toHaveLength(3)
    await userEvent.hover(report)
    await waitFor(() => expect(detailReads).toBeGreaterThan(0))
    await expect(viewWrites).toBe(0)
    await userEvent.click(report)
    await waitFor(() => expect(viewed.has(9006)).toBe(true))
    const history = canvas.getAllByRole('link', { name: '历史' })
      .find((link) =>
        getComputedStyle(link).display !== 'none' &&
        link.getBoundingClientRect().width > 0
      )!
    await userEvent.click(history)
    await canvas.findByRole('link', { name: /对战 #9006/ })
    await expect(canvas.getAllByRole('img', { name: '没有看过此对局' }))
      .toHaveLength(2)
    await expect(
      within(canvas.getByRole('link', { name: /对战 #9006/ })).queryByRole(
        'img',
      ),
    ).toBeNull()
    await expect(
      within(canvas.getByRole('link', { name: /对战 #9004/ })).getByRole('img'),
    ).toBeVisible()
  },
}

export const FailedWriteKeepsUnreadAndNextVisitRetries: Story = {
  beforeEach: () => {
    rejectWrites = true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('link', { name: /对战 #9006/ }),
    )
    await waitFor(() => expect(viewWrites).toBeGreaterThan(0))
    await expect(viewed.has(9006)).toBe(false)
    const history = canvas.getAllByRole('link', { name: '历史' })
      .find((link) => link.getBoundingClientRect().width > 0)!
    await userEvent.click(history)
    const report = await canvas.findByRole('link', { name: /对战 #9006/ })
    await expect(within(report).getByRole('img', { name: '没有看过此对局' }))
      .toBeVisible()
    rejectWrites = false
    await userEvent.click(report)
    await waitFor(() => expect(viewed.has(9006)).toBe(true))
  },
}
export const FailedReportDoesNotMarkViewed: Story = {
  beforeEach: () => {
    rejectDetail = true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('link', { name: /对战 #9006/ }),
    )
    await canvas.findByText('战报加载失败')
    await expect(viewWrites).toBe(0)
  },
}
export const OldServerDoesNotInventUnreadState: Story = {
  beforeEach: () => {
    includeViewed = false
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const report = await canvas.findByRole('link', { name: /对战 #9006/ })
    await expect(canvas.queryByRole('img', { name: '没有看过此对局' }))
      .toBeNull()
    await userEvent.click(report)
    await canvas.findByRole('heading', { name: /对战 #9006/ })
    await expect(viewWrites).toBe(0)
  },
}
export const BackgroundReportWaitsUntilVisible: Story = {
  beforeEach: () => {
    const original = Object.getOwnPropertyDescriptor(
      document,
      'visibilityState',
    )
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    return () => {
      if (original) Object.defineProperty(document, 'visibilityState', original)
      else Reflect.deleteProperty(document, 'visibilityState')
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('link', { name: /对战 #9006/ }),
    )
    await canvas.findByRole('heading', { name: /对战 #9006/ })
    await expect(viewWrites).toBe(0)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(viewed.has(9006)).toBe(true))
  },
}
