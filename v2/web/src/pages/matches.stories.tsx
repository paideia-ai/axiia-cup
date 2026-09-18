import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'

import type { MatchSummary } from '../api/types'
import { finishedMatch, scenarioList } from '../testing/v34-fixtures'
import { MatchesPage } from './matches'

function Destination() {
  const { agentId, matchId } = useParams()
  return <h1>{agentId ? `智能体 ${agentId}` : `战报 ${matchId}`}</h1>
}

function Surface() {
  return (
    <MemoryRouter initialEntries={['/matches']}>
      <Routes>
        <Route path='/matches' element={<MatchesPage />} />
        <Route path='/matches/:matchId' element={<Destination />} />
        <Route path='/agents/:agentId' element={<Destination />} />
      </Routes>
    </MemoryRouter>
  )
}

const summary = {
  ...finishedMatch.summary,
  participants: {
    a: { agentID: 224, versionID: 359, isMine: true },
    b: { agentID: 225, versionID: 361, isMine: false },
  },
}
const meta = {
  title: 'v3.4/Match history navigation',
  component: Surface,
  parameters: {
    msw: [
      http.get(
        '/v1/matches',
        () => HttpResponse.json({ matches: [summary], open: false }),
      ),
      http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
    ],
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const OwnedAgentOpensDirectly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByRole('link', {
      name: /我的智能体 #224/,
    })
    await expect(link).toHaveAttribute('href', '/agents/224')
    await expect(canvas.queryByRole('link', { name: /我的智能体 #225/ }))
      .toBeNull()
    await expect(canvasElement.querySelector('a a')).toBeNull()
    await userEvent.click(link)
    await expect(await canvas.findByRole('heading', { name: '智能体 224' }))
      .toBeVisible()
  },
}

export const ReportEntryStillOpensReport: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByRole('link', { name: /对战 #9001/ })
    await userEvent.click(link)
    await expect(await canvas.findByRole('heading', { name: '战报 9001' }))
      .toBeVisible()
  },
}

export const BothOwnedSidesRemainReachable: Story = {
  parameters: {
    msw: [
      http.get('/v1/matches', () =>
        HttpResponse.json({
          matches: [{
            ...summary,
            participants: {
              ...summary.participants,
              b: { ...summary.participants.b, isMine: true },
            },
          }],
          open: false,
        })),
      http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('link', { name: /我的智能体 #224/ }))
      .toBeVisible()
    const other = canvas.getByRole('link', { name: /我的智能体 #225/ })
    await userEvent.click(other)
    await expect(await canvas.findByRole('heading', { name: '智能体 225' }))
      .toBeVisible()
  },
}

export const CompactHistorySurface: Story = {
  parameters: {
    msw: [
      http.get('/v1/matches', () =>
        HttpResponse.json({
          matches: [
            { ...summary, participants: undefined },
            { ...summary, id: 9002 },
          ],
          open: false,
        })),
      http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = await canvas.findAllByRole('link', { name: /对战 #900[12]/ })
    const mobile = canvasElement.ownerDocument.defaultView!.innerWidth <= 767
    for (const link of links) {
      const surface = link.parentElement!
      const content = link.firstElementChild!
      const description = content.firstElementChild!
      // Check the outer card and inner row independently: checking only the
      // marked link missed the old CSS styling the wrong nesting level.
      await expect(getComputedStyle(surface).boxShadow).toBe('none')
      await expect(getComputedStyle(surface).borderRadius).toBe('10px')
      await expect(getComputedStyle(surface).borderTopWidth).toBe('1px')
      await expect(getComputedStyle(content).borderTopWidth).toBe('0px')
      await expect(getComputedStyle(content).paddingTop).toBe(
        mobile ? '18px' : '20px',
      )
      await expect(getComputedStyle(description).padding).toBe('0px')
    }
    const plainContent = links[0].firstElementChild!
    await expect(getComputedStyle(plainContent).paddingBottom).toBe(
      mobile ? '18px' : '20px',
    )
    await expect(getComputedStyle(links[1].firstElementChild!).paddingBottom)
      .toBe('8px')
    await expect(canvas.getByRole('link', { name: /我的智能体 #224/ }))
      .toBeVisible()
    await expect(canvasElement.querySelector('a a')).toBeNull()
    await userEvent.click(canvas.getByRole('checkbox', { name: '仅自己对局' }))
    // Closed history already belongs to the viewer, even without metadata.
    await expect(canvas.getAllByRole('link', { name: /对战 #900[12]/ }))
      .toHaveLength(2)
  },
}

const otherMatch: MatchSummary = {
  ...summary,
  id: 9003,
  participants: {
    a: { ...summary.participants.a, isMine: false },
    b: { ...summary.participants.b, isMine: false },
  },
}

const openHistory = (rows: MatchSummary[]) => ({
  msw: [
    http.get(
      '/v1/matches',
      () => HttpResponse.json({ matches: rows, open: true }),
    ),
    http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
  ],
})

export const OnlyOwnGames: Story = {
  parameters: openHistory([
    { ...summary, challengeID: 81, challengeLeg: 1 },
    {
      ...summary,
      id: 9002,
      challengeID: 81,
      challengeLeg: 2,
      participants: {
        a: { ...summary.participants.a, isMine: false },
        b: { ...summary.participants.b, isMine: true },
      },
    },
    otherMatch,
    { ...otherMatch, id: 9004, participants: undefined, initiatorIsMe: true },
    { ...otherMatch, id: 9005, participants: undefined },
  ]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('link', { name: /对战 #9005/ })
    const checkbox = canvas.getByRole('checkbox', { name: '仅自己对局' })
    await expect(checkbox).not.toBeChecked()
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      5,
    )
    // Clicking the caption toggles the native checkbox as well.
    await userEvent.click(canvas.getByText('仅自己对局'))
    await expect(checkbox).toBeChecked()
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      3,
    )
    for (const id of [9001, 9002, 9004]) {
      await expect(
        canvas.getByRole('link', { name: new RegExp(`对战 #${id}`) }),
      )
        .toBeVisible()
    }
    await expect(canvas.queryByRole('link', { name: /对战 #9003/ })).toBeNull()
    await expect(canvas.queryByRole('link', { name: /对战 #9005/ })).toBeNull()
    await expect(canvas.getByText(/^约战 #81：/)).toBeVisible()
    await expect(canvas.getByText('你的全部对战记录。')).toBeVisible()
    checkbox.focus()
    await userEvent.keyboard('[Space]')
    await expect(checkbox).not.toBeChecked()
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      5,
    )
    await expect(canvas.getByText('全部对战记录。')).toBeVisible()
  },
}

export const NoOwnGames: Story = {
  parameters: openHistory([otherMatch]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('link', { name: /对战 #9003/ })
    const checkbox = canvas.getByRole('checkbox', { name: '仅自己对局' })
    await userEvent.click(checkbox)
    await expect(canvas.queryByRole('link', { name: /对战 #/ })).toBeNull()
    await expect(
      canvas.getByText(
        '还没有你的对战记录。取消勾选「仅自己对局」可查看全部对战。',
      ),
    ).toBeVisible()
    await userEvent.click(checkbox)
    await expect(canvas.getByRole('link', { name: /对战 #9003/ })).toBeVisible()
  },
}

const scenarioHistory: MatchSummary[] = [
  { ...summary, challengeID: 81, challengeLeg: 1 },
  { ...summary, id: 9002, challengeID: 81, challengeLeg: 2 },
  otherMatch,
  {
    ...summary,
    id: 9004,
    scenarioID: 'legal-harbor',
    scenarioTitle: '疑案港湾',
  },
  {
    ...otherMatch,
    id: 9005,
    scenarioID: 'archived-scenario',
    scenarioTitle: '已归档场景',
  },
]

export const ScenarioFilterPreview: Story = {
  parameters: openHistory(scenarioHistory),
}

export const RetiredScenarioHistoryRemainsVisible: Story = {
  parameters: openHistory([
    summary,
    {
      ...summary,
      id: 9006,
      scenarioID: 'sanguo-chain-stratagem',
      scenarioTitle: '三国连环计',
    },
    {
      ...summary,
      id: 9007,
      scenarioID: 'sanguo-chain-stratagem-advanced',
      scenarioTitle: '三国连环计（进阶版）',
    },
  ]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByRole('link', { name: /对战 #9007/ })
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      3,
    )
    const filter = canvas.getByRole('combobox', { name: '全部场景' })
    await userEvent.click(filter)
    await body.findByRole('option', { name: '商鞅庭辩' })
    await expect(body.queryByRole('option', { name: '三国连环计' })).toBeNull()
    await expect(body.queryByRole('option', { name: '三国连环计（进阶版）' }))
      .toBeNull()
    await userEvent.click(body.getByRole('option', { name: '商鞅庭辩' }))
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      1,
    )
    await userEvent.click(filter)
    await userEvent.click(await body.findByRole('option', { name: '全部场景' }))
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      3,
    )
    const retiredReport = canvas.getByRole('link', { name: /对战 #9007/ })
    await userEvent.click(retiredReport)
    await expect(await canvas.findByRole('heading', { name: '战报 9007' }))
      .toBeVisible()
  },
}

export const ScenarioAndOwnershipFilters: Story = {
  parameters: openHistory(scenarioHistory),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByRole('link', { name: /对战 #9005/ })
    const filter = canvas.getByRole('combobox', { name: '全部场景' })
    const checkbox = canvas.getByRole('checkbox', { name: '仅自己对局' })
    const choose = async (name: string) => {
      await userEvent.click(filter)
      await userEvent.click(
        await body.findByRole('option', { name }),
      )
    }
    await waitFor(() => expect(filter).toHaveTextContent('全部场景'))
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      5,
    )
    await userEvent.click(filter)
    // Repeated matches create one option per scenario, not one per match.
    await expect(await body.findAllByRole('option')).toHaveLength(4)
    await userEvent.click(body.getByRole('option', { name: '商鞅庭辩' }))
    await expect(filter).toHaveTextContent('商鞅庭辩')
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      3,
    )
    await userEvent.click(checkbox)
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      2,
    )
    await expect(canvas.getByText(/^约战 #81：/)).toBeVisible()
    await choose('已归档场景')
    await expect(canvas.queryByRole('link', { name: /对战 #/ })).toBeNull()
    await expect(
      canvas.getByText(
        '没有符合筛选条件的对战。试试切换场景或取消「仅自己对局」。',
      ),
    )
      .toBeVisible()
    await expect(filter).toHaveTextContent('已归档场景')
    await userEvent.click(checkbox)
    await expect(canvas.getByRole('link', { name: /对战 #9005/ })).toBeVisible()
    await choose('疑案港湾')
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      1,
    )
    await expect(canvas.getByRole('link', { name: /对战 #9004/ })).toBeVisible()
    await userEvent.click(checkbox)
    await choose('全部场景')
    await expect(checkbox).toBeChecked()
    await expect(filter).toHaveTextContent('全部场景')
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      3,
    )
    await userEvent.click(checkbox)
    await expect(canvas.getAllByRole('link', { name: /对战 #/ })).toHaveLength(
      5,
    )
  },
}

export const ScenarioFilterWithoutCatalog: Story = {
  ...ScenarioAndOwnershipFilters,
  parameters: {
    msw: [
      http.get(
        '/v1/matches',
        () => HttpResponse.json({ matches: scenarioHistory, open: true }),
      ),
      http.get('/v1/scenarios', () => new HttpResponse(null, { status: 503 })),
    ],
  },
}

export const EmptyHistory: Story = {
  parameters: openHistory([]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('还没有任何对战。到场景页构建智能体并发起对战。')
    await expect(canvas.getByRole('combobox', { name: '全部场景' }))
      .toBeDisabled()
  },
}
