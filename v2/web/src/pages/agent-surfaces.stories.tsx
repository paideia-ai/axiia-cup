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

// P11（Yihan 修订）：覆盖确认的武装态——确认行（role=alert）就地长在被点击
// 的 v1 卡内，不再是页面顶部横幅（J4.3：不同屏会被误当按钮失灵）。
export const IterateOverwriteConfirmArmed: Story = {
  args: { page: 'agent' },
  render: () => (
    <VersionList
      versions={versions}
      onSetEntry={() => {}}
      onIterate={() => {}}
      onField={() => {}}
      pendingIterateID={1001}
      onConfirmIterate={() => {}}
      onCancelIterate={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cards = canvas.getAllByTestId('version-card')
    // 最新在前：v1 是最后一张卡；确认行必须在它里面，别的卡没有。
    const v1Card = within(cards[cards.length - 1])
    await expect(v1Card.getByRole('alert')).toHaveTextContent(
      '工作区里有未保存的改动，基于 v1 迭代会覆盖它',
    )
    await expect(v1Card.getByRole('button', { name: '仍要继续' }))
      .toBeVisible()
    await expect(within(cards[0]).queryByRole('alert')).toBeNull()
  },
}
