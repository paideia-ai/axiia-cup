import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { MemoryRouter } from 'react-router-dom'
import { HistoryBar } from './history-bar'
import {
  historyFixtures,
  historyScenarios,
} from '../../testing/history-fixtures'

function Surface() {
  return (
    <MemoryRouter>
      <div className='space-y-2'>
        {historyFixtures().map((m) => {
          const scene = historyScenarios.find((s) => s.id === m.scenarioID)
          return (
            <HistoryBar
              key={m.id}
              match={m}
              roles={scene ? { a: scene.sideAName, b: scene.sideBName } : null}
            />
          )
        })}
      </div>
    </MemoryRouter>
  )
}
const meta = {
  title: 'v3.4/Compact history bars',
  component: Surface,
  parameters: { a11y: { test: 'error' } },
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>
export const MixedHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('对局异常')).toHaveLength(2)
    await expect(canvas.getAllByText('左右互搏')).toHaveLength(2)
    await expect(canvas.getAllByText('平局')).toHaveLength(2)
    for (
      const [label, color] of [
        ['进行中', 'rgb(96, 165, 250)'],
        ['排队中', 'rgb(251, 191, 36)'],
        ['未计分', 'rgb(251, 191, 36)'],
      ]
    ) {
      const status = canvas.getByText(label)
      await expect(status).toBeVisible()
      await expect(getComputedStyle(status).color).toBe(color)
      const clock = status.querySelector('svg')!
      await expect(clock).not.toBeNull()
      await expect(getComputedStyle(clock).color).toBe(color)
    }
    await expect(canvas.getAllByRole('img', { name: '没有看过此对局' }))
      .toHaveLength(3)
    await expect(canvasElement.querySelectorAll('.hbr-result > span'))
      .toHaveLength(0)
    await expect(
      canvasElement.querySelectorAll('.lucide-check, .lucide-x, a a'),
    ).toHaveLength(0)
    await expect(
      canvasElement.querySelectorAll('.hbr-avatar img[src*="yoshiaki-envoy"]'),
    ).toHaveLength(3)
    const errorRows = [...canvasElement.querySelectorAll('[data-tone="error"]')]
      .map((e) => e.parentElement!)
    for (const row of errorRows) {
      await expect(row.querySelector('[data-outcome]')).toBeNull()
    }
    await expect(
      canvasElement.querySelector(
        'a[href="/scenarios/fengyiting-real/npcs/lvbu-default?match=468"]',
      ),
    ).not.toBeNull()
    await expect(
      canvasElement.querySelector(
        'a[href="/agents/409/identity?version=4009&match=474"]',
      ),
    ).not.toBeNull()
  },
}

export const AgentNamesAtMatchStart: Story = {
  render: () => (
    <MemoryRouter>
      <div className='space-y-2'>
        {['旧名称', '新名称', null].map((name, i) => {
          const match = historyFixtures()[0]
          return (
            <HistoryBar
              key={i}
              match={{
                ...match,
                id: 800 + i,
                participants: {
                  a: {
                    agentID: 400,
                    versionID: 4000 + i,
                    agentName: name,
                    isMine: true,
                  },
                  b: {
                    agentID: 401,
                    versionID: 4005,
                    agentName: '对手策略',
                    ownerDisplayName: '另一位玩家',
                    isMine: false,
                  },
                },
              }}
              roles={{ a: '董卓', b: '吕布' }}
            />
          )
        })}
      </div>
    </MemoryRouter>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText('旧名称')).toBeVisible()
    await expect(c.getByText('新名称')).toBeVisible()
    await expect(c.getByText('#400')).toBeVisible()
    await expect(c.getAllByText('另一位玩家 · 对手策略')).toHaveLength(3)
    await expect(c.getByRole('link', { name: /我的智能体 · 旧名称/ }))
      .toHaveAttribute('href', '/agents/400?version=4000&match=800')
    await expect(c.queryByText('#401')).toBeNull()
  },
}
