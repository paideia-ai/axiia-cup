import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { finishedMatch } from '../testing/v34-fixtures'
import { MatchDetailPage } from './match-detail'

function MatchReport() {
  return (
    <MemoryRouter initialEntries={['/matches/9001']}>
      <Routes>
        <Route path='/matches/:matchId' element={<MatchDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Match report',
  component: MatchReport,
  parameters: {
    msw: [
      http.get('/v1/matches/9001', () => HttpResponse.json(finishedMatch)),
    ],
  },
} satisfies Meta<typeof MatchReport>

export default meta
type Story = StoryObj<typeof meta>

export const FinishedScored: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const result = await canvas.findByRole('heading', { name: '结果' })
    const dialogue = canvas.getByRole('heading', { name: '对话全文' })
    const inquiry = canvas.getByRole('heading', { name: '问询' })
    const scoring = canvas.getByRole('heading', { name: '计分推导' })

    await expect(result.compareDocumentPosition(dialogue) & 4).toBeTruthy()
    await expect(dialogue.compareDocumentPosition(inquiry) & 4).toBeTruthy()
    await expect(inquiry.compareDocumentPosition(scoring) & 4).toBeTruthy()
    await expect(canvas.queryByText('先立可验证的制度标准。')).toBeNull()
    await expect(canvas.getAllByText('胜方 商鞅')).toHaveLength(2)
    await expect(canvas.getByText(/商鞅 \+7/)).toBeVisible()
    await expect(canvas.getByText(/甘龙 \+5/)).toBeVisible()
  },
}

export const DebugReasoning: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: '结果' })
    await userEvent.click(canvas.getByRole('switch', { name: /调试模式/ }))
    await userEvent.click(canvas.getAllByRole('button', { name: /内心/ })[0])
    await expect(canvas.getByText('先立可验证的制度标准。')).toBeVisible()
  },
}

export const ReplayHidesSpoilers: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: '结果' })
    await userEvent.click(canvas.getByRole('button', { name: '回放' }))
    await expect(canvas.queryByRole('heading', { name: '结果' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '问询' })).toBeNull()
    await expect(canvas.queryByRole('heading', { name: '计分推导' })).toBeNull()
    await expect(canvas.getByRole('heading', { name: '对话重演' }))
      .toBeVisible()
  },
}
