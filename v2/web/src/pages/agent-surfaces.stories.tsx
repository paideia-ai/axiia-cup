import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  inventory,
  scenario,
  scenarioList,
  versions,
} from '../testing/v34-fixtures'
import { AgentViewPage } from './agent-view'
import { MyAgentsPage } from './my-agents'

function Surface({ page }: { page: 'inventory' | 'agent' }) {
  const entry = page === 'agent' ? '/agents/101' : '/my-agents'
  return (
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path='/my-agents' element={<MyAgentsPage />} />
        <Route path='/agents/:agentId' element={<AgentViewPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const meta = {
  title: 'v3.4/Agent surfaces',
  component: Surface,
  parameters: {
    msw: [
      http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
      http.get('/v1/my/agents', () => HttpResponse.json(inventory)),
      http.get('/v1/agents/101/draft', () =>
        HttpResponse.json({
          fields: {},
          scenarioID: scenario.summary.id,
          side: 'a',
        })),
      http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
      http.get(
        '/v1/agents/101/versions',
        () => HttpResponse.json({ versions, entryVersionID: 1002 }),
      ),
    ],
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const DualSideReadiness: Story = {
  args: { page: 'inventory' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('商鞅庭辩')).toBeVisible()
    await expect(canvas.getByText('商鞅 ✓')).toBeVisible()
    await expect(canvas.getByText('甘龙 未标参赛')).toBeVisible()
    await expect(
      canvas.getByText('参赛资格未就绪：还差 甘龙（未标参赛版本）'),
    ).toBeVisible()
  },
}

export const VersionCards: Story = {
  args: { page: 'agent' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // P1：页头是策略展示名（fixture 无自起名 → 「商鞅 #101」），场景名降为副题。
    await expect(await canvas.findByRole('heading', { name: /商鞅 #101/ }))
      .toBeVisible()
    await expect(canvas.getByText('v2')).toBeVisible()
    await expect(canvas.getByText('★参赛版本')).toBeVisible()
    // #89/#90：版本卡动作＝基于该版本迭代 / 设为参赛版本 / 出战——
    // 「复制为新智能体」已废止，必须不存在。
    await expect(canvas.getByRole('button', { name: '基于 v1 迭代' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: /将 v1 设为.*参赛版本/ }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '用 v1 出战' }))
      .toBeVisible()
    await expect(canvas.queryByRole('button', { name: /复制为新智能体/ }))
      .toBeNull()
    // P12：「保存后将成为 v3」提到段落级，全页一次。
    await expect(canvas.getByText('保存后将成为 v3')).toBeVisible()
  },
}
