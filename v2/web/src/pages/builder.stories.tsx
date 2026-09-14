import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { AgentVersionDTO, ScenarioScoringDTO } from '../api/types'
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
  scoring?: ScenarioScoringDTO,
) {
  return [
    http.get('/v1/config', () => HttpResponse.json(config)),
    http.get('/v1/models', () =>
      HttpResponse.json({
        models: [{ id: 'fixture-model', label: 'Fixture Model' }],
      })),
    http.get('/v1/my/agents', () => HttpResponse.json({ scenarios: [] })),
    http.get(
      '/v1/scenarios/:id',
      () => HttpResponse.json({ ...scenario, scoring }),
    ),
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
      {
        summary: '逐项累计本场得分。',
        items: [
          { id: 'evidence', label: '证据闭环', points: 2.75 },
          { id: 'repetition', label: '重复论证', points: -1.125 },
          { id: 'unused', label: '未使用机会', points: 0 },
        ],
        notes: ['每项仅计入一次。'],
      },
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
    await expect(
      within(dialog).getByRole('button', { name: '复制策略构建提示词' }),
    )
      .toBeVisible()
    const prompt = within(dialog).getByLabelText('策略构建提示词内容')
    await waitFor(() =>
      expect(prompt).toHaveTextContent('计分规则：逐项累计本场得分。')
    )
    expect(prompt).toHaveTextContent('# 商鞅 Prompt Builder')
    expect(prompt).toHaveTextContent('等我确认后再生成')
    expect(prompt).not.toHaveTextContent(/\{\{|只输出策略提示词正文/)
    const clipboard = spyOn(navigator.clipboard, 'writeText').mockResolvedValue(
      undefined,
    )
    try {
      await userEvent.click(
        within(dialog).getByRole('button', { name: '复制策略构建提示词' }),
      )
      await expect(
        await within(dialog).findByRole('button', { name: '已复制' }),
      ).toBeVisible()
      expect(clipboard).toHaveBeenCalledWith(prompt.textContent)
      clipboard.mockRejectedValueOnce(new Error('Clipboard permission denied'))
      await userEvent.click(
        within(dialog).getByRole('button', { name: '已复制' }),
      )
      await expect(await within(dialog).findByRole('status')).toHaveTextContent(
        '请手动选择上方策略构建提示词并复制',
      )
    } finally {
      clipboard.mockRestore()
    }
    await expect(input).toHaveValue(v1.prompt)
    expect(prompt).toHaveTextContent('证据闭环：2.75 分')
    expect(prompt).toHaveTextContent('重复论证：-1.125 分')
    expect(prompt).toHaveTextContent('未使用机会：0 分')
    expect(prompt).toHaveTextContent('每项仅计入一次。')
    expect(prompt).not.toHaveTextContent(
      /计分规则整理中|undefined|\+0\.5|[−-]0\.25|[−-]0\.75|\+1(?![\d.])|[−-]1(?![\d.])/,
    )
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

export const ExternalAiHelperFollowsSelectedRole: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    msw: [
      http.get('/v1/agents/101/draft', () =>
        HttpResponse.json({
          fields: { prompt: v1.prompt },
          scenarioID: 'honnoji-decision',
          side: 'a',
        })),
      http.get('/v1/scenarios/honnoji-decision', () =>
        HttpResponse.json({
          ...scenario,
          summary: {
            ...scenario.summary,
            id: 'honnoji-decision',
            title: '本能寺之变',
            sideAName: '袭击本能寺',
            sideBName: '西进毛利',
          },
        })),
      ...handlers(v1.prompt, () => HttpResponse.json({ versions: [] })),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByLabelText('策略提示词')
    await waitFor(() => expect(input).toBeEnabled())
    for (
      const [name, heading] of [
        ['足利义昭的使者', 'D.足利义昭使者辩论策略 Prompt Builder'],
        ['长宗我部元亲的密使', 'A.长宗我部元亲阵营辩论策略 Prompt Builder'],
      ]
    ) {
      await userEvent.click(canvas.getByRole('combobox', { name: '选择角色' }))
      await userEvent.click(
        await within(document.body).findByRole('option', { name }),
      )
      await userEvent.click(
        canvas.getByRole('button', { name: '让你的AI帮你想策略' }),
      )
      const dialog = canvas.getByRole('dialog', { name: '让你的AI帮你想策略' })
      const prompt = within(dialog).getByLabelText('策略构建提示词内容')
      expect(prompt).toHaveTextContent(heading)
      expect(prompt).toHaveTextContent(`「${name}」一方`)
      expect(prompt).not.toHaveTextContent(/\{\{|undefined/)
      await userEvent.click(
        within(dialog).getByRole('button', { name: '关闭弹窗' }),
      )
      expect(input).toHaveValue(v1.prompt)
    }
  },
}
