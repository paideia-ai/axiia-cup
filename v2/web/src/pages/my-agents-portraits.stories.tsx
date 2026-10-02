import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import type { MyAgentsResponse } from '../api/types'
import {
  portraitInventory,
  portraitScenarios,
} from '../testing/agent-portrait-fixtures'
import { MyAgentsPage } from './my-agents'

function Page({ entry = '/my-agents' }: { entry?: string }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <MyAgentsPage />
    </MemoryRouter>
  )
}
const honnojiOf = (data: MyAgentsResponse) =>
  data.scenarios.find((scene) => scene.scenarioID === 'honnoji-decision')!

function handlers(inventory: MyAgentsResponse | null = portraitInventory) {
  return [
    http.get(
      '/v1/scenarios',
      () =>
        HttpResponse.json({
          scenarios: portraitScenarios.map((s) => s.summary),
        }),
    ),
    http.get(
      '/v1/my/agents',
      () =>
        inventory
          ? HttpResponse.json(inventory)
          : new HttpResponse(null, { status: 503 }),
    ),
  ]
}
const meta = {
  title: 'Agents/Inventory portraits',
  component: Page,
  parameters: { msw: handlers(), a11y: { test: 'error' } },
} satisfies Meta<typeof Page>
export default meta
type Story = StoryObj<typeof meta>
export const AllScenarios: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('四国安堵')
    await expect(canvasElement.querySelectorAll('[data-agent-role-group]'))
      .toHaveLength(4)
    await expect(canvasElement.querySelectorAll('[data-role-portrait]'))
      .toHaveLength(12)
    const envoy = canvasElement.querySelector(
      '[data-agent-role-group="yoshiaki"]',
    )!
    await expect(within(envoy as HTMLElement).getAllByTestId('agent-row'))
      .toHaveLength(2)
    await expect(
      canvas.getByRole('link', { name: /长宗我部元亲的密使 · #164/ }),
    ).toHaveAttribute('href', '/agents/164')
  },
}
const legacy = structuredClone(portraitInventory)
honnojiOf(legacy).sides.a.push(
  { agentID: 299, versionCount: 1, name: '足利义昭的使者' },
  {
    agentID: 300,
    versionCount: 1,
    role: { key: 'hosokawa', side: 'b', name: '细川藤孝' },
  },
  {
    agentID: 301,
    versionCount: 1,
    isArchived: true,
    role: { key: 'chosokabe', side: 'a', name: '长宗我部元亲的密使' },
  },
)
honnojiOf(legacy).sides.b = honnojiOf(legacy).sides.b.slice(0, 2)
export const UnresolvedAndEmptyRole: Story = {
  parameters: { msw: handlers(legacy) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: /角色待确认/ })
    const group = canvasElement.querySelector(
      '[data-agent-role-group="unknown"]',
    ) as HTMLElement
    await expect(within(group).getAllByTestId('agent-row')).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: /展开全部 7 个/ }))
    await expect(within(group).getAllByTestId('agent-row')).toHaveLength(2)
    await expect(group.querySelector('img')).toBeNull()
    await expect(canvasElement.querySelector('[data-agent-id="301"]'))
      .toBeNull()
    await expect(canvas.getByText('还没有这个角色的智能体')).toBeVisible()
  },
}
const long = structuredClone(portraitInventory)
honnojiOf(long).sides.a = Array.from(
  { length: 13 },
  (_, i) => ({
    ...honnojiOf(portraitInventory).sides.a[i < 10 ? 0 : 3],
    agentID: 400 + i,
    name: null,
    entryVersionID: i === 12 ? 5000 : null,
  }),
)
honnojiOf(long).sides.b = honnojiOf(long).sides.b.slice(0, 2)
export const LongRoleLists: Story = {
  parameters: { msw: handlers(long) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const side = within(
      await canvas.findByRole('region', { name: '主张袭击本能寺阵营' }),
    )
    await expect(side.getAllByTestId('agent-row')).toHaveLength(3)
    await expect(side.getByText('#412')).toBeVisible()
    await expect(side.getByText('#400')).toBeVisible()
    const toggle = side.getByRole('button', { name: /展开全部 13 个/ })
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    await expect(side.getAllByTestId('agent-row')).toHaveLength(13)
    await expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(side.getAllByTestId('agent-row')).toHaveLength(3)
    await expect(side.getByText('#412')).toBeVisible()
  },
}
export const FocusedSide: Story = {
  args: { entry: '/my-agents?scenario=honnoji-decision&side=a' },
  parameters: { msw: handlers(long) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('#412')
    await expect(canvas.getAllByTestId('agent-row')).toHaveLength(13)
    await expect(canvasElement.querySelectorAll('[data-agent-role-group]'))
      .toHaveLength(2)
    await expect(canvas.queryByRole('button', { name: /展开全部/ })).toBeNull()
  },
}
const empty = structuredClone(portraitInventory)
honnojiOf(empty).sides = { a: [], b: [] }
honnojiOf(empty).entryReady = false
export const EmptySides: Story = {
  parameters: { msw: handlers(empty) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('还没有袭击本能寺智能体')
    await expect(canvasElement.querySelectorAll('[data-agent-role-group]'))
      .toHaveLength(0)
  },
}
export const UnavailableInventory: Story = {
  parameters: { msw: handlers(null) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(
      '智能体清单暂时不可用。你仍可打开场景，或新建某一侧智能体。',
    )
    await expect(canvasElement.querySelectorAll('[data-agent-role-group]'))
      .toHaveLength(0)
    await expect(canvasElement.querySelectorAll('[data-role-portrait]'))
      .toHaveLength(8)
  },
}
