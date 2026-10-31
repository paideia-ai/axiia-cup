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
    await expect(canvas.getByText('未计分')).toBeVisible()
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
