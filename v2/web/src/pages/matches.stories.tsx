import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'

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
