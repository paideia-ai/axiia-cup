import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { AgentVersionDTO } from '../api/types'
import { config, scenario } from '../testing/v34-fixtures'
import { BuilderPage } from './builder'

function Surface() {
  return (
    <MemoryRouter initialEntries={['/agents/101/build']}>
      <Routes>
        <Route path='/agents/:agentId/build' element={<BuilderPage />} />
        <Route
          path='/agents/:agentId'
          element={<p data-testid='agent-home'>智能体主页</p>}
        />
      </Routes>
    </MemoryRouter>
  )
}

const v1: AgentVersionDTO = {
  id: 9001,
  agentID: 101,
  prompt: '首稿：先立可验证的小承诺，再谈变法大义。',
  modelID: 'fixture-model',
  isEntry: true,
  ordinal: 1,
  snapshotSeq: 0,
}
const v2: AgentVersionDTO = {
  id: 9002,
  agentID: 101,
  prompt: '第二稿：把守旧的长期成本算给君上看。',
  modelID: 'fixture-model',
  isEntry: false,
  ordinal: 2,
  snapshotSeq: 0,
}

function handlers(
  draftPrompt: string,
  versionHandler: Parameters<typeof http.get>[1],
) {
  return [
    http.get('/v1/config', () => HttpResponse.json(config)),
    http.get('/v1/models', () =>
      HttpResponse.json({
        models: [{ id: 'fixture-model', label: 'Fixture Model' }],
      })),
    http.get('/v1/my/agents', () => HttpResponse.json({ scenarios: [] })),
    http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
    http.get('/v1/agents/101/draft', () =>
      HttpResponse.json({
        fields: { prompt: draftPrompt },
        scenarioID: scenario.summary.id,
        side: 'a',
      })),
    http.post('/v1/agents/101/mutate', () => HttpResponse.json({ ok: true })),
    http.get(
      '/v1/agents/101/stream',
      () =>
        new HttpResponse('', {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
    ),
    http.get('/v1/agents/101/versions', versionHandler),
  ]
}

const meta = {
  title: 'Agents/Keso low-complexity builder',
  component: Surface,
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const BlankWorkspaceWithSecondaryHelpers: Story = {
  parameters: {
    msw: handlers('', () => HttpResponse.json({ versions: [] })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    await expect(input).toHaveValue('')
    await expect(await canvas.findByText('不知道怎么指挥智能体？'))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
    await expect(canvas.queryByTestId('version-card')).toBeNull()
    await expect(canvas.getByRole('button', { name: '保存并返回主页' }))
      .toBeDisabled()
  },
}

export const HelpersRemainAfterVersions: Story = {
  parameters: {
    msw: handlers(
      v2.prompt,
      () => HttpResponse.json({ versions: [v1, v2], entryVersionID: v1.id }),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    await expect(input).toHaveValue(v2.prompt)
    await expect(canvas.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
    await expect(canvas.queryByText('版本（2）')).toBeNull()
    await expect(canvas.queryByTestId('version-card')).toBeNull()
    await expect(canvas.getByRole('button', { name: '版本备注' })).toBeVisible()
  },
}

export const ExternalAiHelperLivesInDialog: Story = {
  parameters: {
    msw: handlers(
      v1.prompt,
      () => HttpResponse.json({ versions: [v1], entryVersionID: v1.id }),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    const helper = await canvas.findByRole('button', {
      name: '让你的AI帮你想策略',
    })
    await userEvent.click(helper)
    const dialog = canvas.getByRole('dialog', {
      name: '让你的AI帮你想策略',
    })
    await expect(dialog).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: '复制元提示词' }))
      .toBeVisible()
  },
}

export const SaveReturnsToAgentHome: Story = {
  parameters: {
    msw: [
      ...handlers(
        v2.prompt,
        () => HttpResponse.json({ versions: [v1, v2], entryVersionID: v1.id }),
      ),
      http.post(
        '/v1/agents/101/save',
        () => HttpResponse.json({ ...v2, id: 9003, ordinal: 3 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    const save = await canvas.findByRole('button', {
      name: '保存并返回主页',
    })
    await expect(save).toBeEnabled()
    await userEvent.click(save)
    await expect(await canvas.findByTestId('agent-home')).toBeVisible()
  },
}
