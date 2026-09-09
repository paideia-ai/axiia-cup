import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { VersionList } from '../components/version-list'
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
  title: 'Agents/Keso low-high-low surfaces',
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

export const MinimalInventoryWithReadiness: Story = {
  args: { page: 'inventory' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('商鞅庭辩')).toBeVisible()
    const readiness = canvas.getByLabelText('两侧参赛状态')
    await expect(within(readiness).getByText(/商鞅/)).toHaveTextContent(
      '商鞅 ✓',
    )
    await expect(within(readiness).getByText(/甘龙/)).toHaveTextContent(
      '甘龙 未标参赛',
    )
    await expect(
      canvas.getByText('参赛资格未就绪：还差 甘龙（未标参赛版本）'),
    ).toBeVisible()
    await expect(canvas.getAllByTestId('agent-row')).toHaveLength(2)
    await expect(canvas.queryByRole('button', { name: /重命名|删除/ }))
      .toBeNull()
  },
}

export const HighFunctionAgentHome: Story = {
  args: { page: 'agent' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: /商鞅 #101/ }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '智能体更多操作' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '新建版本' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '新建商鞅智能体' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '复制 v1 提示词' }))
      .toBeVisible()
    await expect(
      canvas.getByRole('button', { name: /将 v1 设为商鞅参赛版本/ }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: '用 v1 出战' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '版本对比' }))
      .toBeVisible()
    await expect(canvas.queryByRole('button', { name: /基于 v1 迭代/ }))
      .toBeNull()
  },
}

export const CompactVersionControls: Story = {
  args: { page: 'agent' },
  render: () => (
    <VersionList
      versions={versions}
      sideName='商鞅'
      onSetEntry={() => {}}
      onField={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('版本（2）')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '复制 v2 提示词' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '用 v2 出战' }))
      .toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '将 v2 设为商鞅参赛版本' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}
