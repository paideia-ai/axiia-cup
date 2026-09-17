import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { VersionList } from '../components/version-list'
import {
  inventory,
  scenario,
  scenarioList,
  versions as baseVersions,
} from '../testing/v34-fixtures'
import { AgentViewPage } from './agent-view'
import { MyAgentsPage } from './my-agents'

const versions = baseVersions.map((version, index) => ({
  ...version,
  note: index === 0 ? '  澄清争点  ' : '回应最强论点',
}))
const modelsHandler = http.get(
  '/v1/models',
  () =>
    HttpResponse.json({ models: [{ id: 'fixture-model', label: '策略模型' }] }),
)

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
      modelsHandler,
      http.get('/v1/agents/101/diff', ({ request }) => {
        const query = new URL(request.url).searchParams
        return HttpResponse.json({
          base: versions.find((v) => v.id === Number(query.get('base'))),
          head: versions.find((v) => v.id === Number(query.get('head'))),
        })
      }),
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

export const ActionMenuKeyboard: Story = {
  args: { page: 'agent' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = await canvas.findByRole('button', {
      name: '智能体更多操作',
    })
    await userEvent.click(trigger)
    await expect(await body.findByRole('menuitem', { name: '重命名' }))
      .toBeVisible()
    await expect(body.getByRole('menuitem', { name: '归档智能体' }))
      .not.toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Escape}')
    await expect(trigger).toHaveFocus()
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
    await expect(canvas.getByRole('link', { name: '新建版本' })).toBeVisible()
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

export const VersionComparison: Story = {
  args: { page: 'agent' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: '版本对比' }),
    )
    const oldText = await canvas.findByLabelText('v1 策略正文')
    const newText = canvas.getByLabelText('v2 策略正文')
    await expect(oldText.textContent).toBe(versions[0].prompt)
    await expect(newText.textContent).toBe(versions[1].prompt)
    await expect(oldText.querySelector('del')).not.toBeNull()
    await expect(oldText.querySelector('ins')).toBeNull()
    await expect(newText.querySelector('ins')).not.toBeNull()
    await expect(newText.querySelector('del')).toBeNull()
    await expect(canvas.getByRole('combobox', { name: '选择基准版本' }))
      .toHaveTextContent(/^v1$/)
    await expect(canvas.getByRole('combobox', { name: '选择对比版本' }))
      .toHaveTextContent(/^v2$/)
    const titles = canvasElement.querySelectorAll(
      '[data-tm="EA.diff-column-title"]',
    )
    await expect(within(titles[0] as HTMLElement).getByText('澄清争点'))
      .toBeVisible()
    await expect(within(titles[1] as HTMLElement).getByText('回应最强论点'))
      .toBeVisible()
    for (const title of titles) {
      await expect(within(title as HTMLElement).getByText('策略模型'))
        .toBeVisible()
      await expect(title).not.toHaveTextContent('fixture-model')
    }
    await userEvent.click(
      canvas.getByRole('combobox', { name: '选择基准版本' }),
    )
    const option = await within(document.body).findByRole('option', {
      name: /v1/,
    })
    await expect(within(option).getByText('策略模型')).toBeVisible()
    await expect(option).toHaveTextContent('澄清争点')
    await expect(option).not.toHaveTextContent('fixture-model')
    await userEvent.keyboard('{Escape}')
    const prompt = canvasElement.querySelector('[data-version-prompt]')!
    await expect(getComputedStyle(prompt).color).toBe('rgb(222, 222, 222)')
  },
}

const identicalHandlers = [
  http.get('/v1/models', () => new HttpResponse(null, { status: 503 })),
  http.get('/v1/agents/101/draft', () =>
    HttpResponse.json({
      fields: {},
      scenarioID: scenario.summary.id,
      side: 'a',
    })),
  http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
  http.get('/v1/my/agents', () => HttpResponse.json(inventory)),
  http.get(
    '/v1/agents/101/versions',
    () => HttpResponse.json({ versions }),
  ),
  http.get('/v1/agents/101/diff', () =>
    HttpResponse.json({
      base: versions[0],
      head: { ...versions[1], prompt: versions[0].prompt },
    })),
]

export const IdenticalVersionPrompts: Story = {
  args: { page: 'agent' },
  parameters: {
    msw: identicalHandlers,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: '版本对比' }),
    )
    await expect(await canvas.findByText('两版策略正文相同。')).toBeVisible()
    await expect(canvasElement.querySelectorAll('del, ins').length).toBe(0)
    const titles = canvasElement.querySelectorAll(
      '[data-tm="EA.diff-column-title"]',
    )
    for (const title of titles) {
      await expect(title).toHaveTextContent('fixture-model')
    }
  },
}

// An incomplete catalog response must not prevent reading saved versions.
export const IncompleteModelCatalog: Story = {
  ...IdenticalVersionPrompts,
  parameters: {
    msw: [
      http.get('/v1/models', () => HttpResponse.json({})),
      ...identicalHandlers.slice(1),
    ],
  },
}
