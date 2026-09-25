import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'

import { inventory, scenarioList } from '../testing/v34-fixtures'
import { MyAgentsPage } from './my-agents'

function InventoryLayout({ entry = '/my-agents' }: { entry?: string }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <MyAgentsPage />
    </MemoryRouter>
  )
}

function handlers(a: number, b: number) {
  const data = structuredClone(inventory)
  for (const side of ['a', 'b'] as const) {
    const count = side === 'a' ? a : b
    data.scenarios[0].sides[side] = Array.from({ length: count }, (_, i) => ({
      agentID: (side === 'a' ? 100 : 200) + i,
      name: `${side === 'a' ? '商鞅' : '甘龙'}方案 ${i + 1}`,
      versionCount: 1,
      entryVersionID: i === count - 1 ? 1000 + i : null,
    }))
    // Archived agents must affect neither the imbalance nor the preview slots.
    data.scenarios[0].sides[side].unshift({
      agentID: side === 'a' ? 900 : 901,
      name: '已归档方案',
      versionCount: 1,
      entryVersionID: null,
      isArchived: true,
    })
  }
  return [
    http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
    http.get('/v1/my/agents', () => HttpResponse.json(data)),
  ]
}

const meta = {
  title: 'Agents/Inventory side layout',
  component: InventoryLayout,
  parameters: { a11y: { test: 'error' } },
} satisfies Meta<typeof InventoryLayout>

export default meta
type Story = StoryObj<typeof meta>

export const UnevenLeftWithEntryAtEnd: Story = {
  parameters: { msw: handlers(13, 2) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const left = within(
      await canvas.findByRole('region', { name: '商鞅智能体' }),
    )
    await expect(left.getAllByTestId('agent-row')).toHaveLength(3)
    await expect(left.getByText('商鞅方案 13')).toBeVisible()
    await expect(canvas.queryByText('已归档方案')).toBeNull()
    const toggle = left.getByRole('button', {
      name: '展开全部 13 个（还有 10 个）',
    })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    await expect(left.getAllByTestId('agent-row')).toHaveLength(13)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(left.getAllByTestId('agent-row')).toHaveLength(3)
    await expect(left.getByText('商鞅方案 13')).toBeVisible()
    await expect(toggle).toHaveFocus()
  },
}

export const UnevenRightWithEmptyLeft: Story = {
  parameters: { msw: handlers(0, 6) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const right = within(
      await canvas.findByRole('region', { name: '甘龙智能体' }),
    )
    await expect(right.getAllByTestId('agent-row')).toHaveLength(3)
    await expect(right.getByText('甘龙方案 6')).toBeVisible()
    await userEvent.click(right.getByRole('button', { name: /展开全部 6 个/ }))
    await expect(right.getAllByTestId('agent-row')).toHaveLength(6)
  },
}

export const BalancedLongLists: Story = {
  parameters: { msw: handlers(8, 8) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('商鞅方案 8')
    await expect(canvas.getAllByTestId('agent-row')).toHaveLength(16)
    await expect(canvas.queryByRole('button', { name: /展开全部/ })).toBeNull()
  },
}

export const FocusedSideShowsAll: Story = {
  args: { entry: '/my-agents?scenario=shangyang-court&side=b' },
  parameters: { msw: handlers(2, 13) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('甘龙方案 13')
    await expect(canvas.getAllByTestId('agent-row')).toHaveLength(13)
    await expect(canvas.queryByRole('button', { name: /展开全部/ })).toBeNull()
    await userEvent.click(
      canvas.getByRole('button', { name: '查看全部智能体' }),
    )
    await expect(canvas.getAllByTestId('agent-row')).toHaveLength(5)
    await expect(canvas.getByRole('button', { name: /展开全部 13 个/ }))
      .toBeVisible()
  },
}
