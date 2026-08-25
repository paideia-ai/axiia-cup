import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { AgentVersionDTO } from '../api/types'
import { BuilderPage } from './builder'
import { scenario } from '../testing/v34-fixtures'

// 构建器工作区（E 页）的行为钉子——本文件只钉 pr-fate 本轮拍板的三件事：
// ① E10/#84「一键改标」（u02-c11b 拍板 A）：保存不移动 ★，但成功提示里给
//    一键把刚保存的 vN 设为参赛版本，提示按 #91 口径更新；
// ② E7/#83 初始化门（u02-c19 拍板 A）：三选一只属于版本数为 0 的新建流程，
//    清空工作区不再复活它，清空入口的词面随版本数改口；
// ③ P11 零损失细化（round-2 人工反馈 RUI LIN，jR1s4）：目标版本与草稿一字
//    不差时直接载入，不弹覆盖确认。

function Surface() {
  return (
    <MemoryRouter initialEntries={['/agents/101/build']}>
      <Routes>
        <Route path='/agents/:agentId/build' element={<BuilderPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// 与 v34-fixtures 的 agent 101 同一世界观，但版本内容按本文件的剧本裁剪。
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

// 每个故事自带 msw 世界：draft 文本与版本线是故事的仅有变量，其余共用。
function handlers(
  draftPrompt: string,
  versionHandler: Parameters<typeof http.get>[1],
) {
  return [
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
    // SSE：故事里不需要事件，给一个立即关闭的合法流即可。
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
  title: 'v3.4/Builder workspace',
  component: Surface,
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

// ── ② E7/#83 门 · 版本数为 0 的新建流程保留完整三选一 ──────────────────────
export const InitChooserForFreshAgent: Story = {
  parameters: {
    msw: handlers('', () => HttpResponse.json({ versions: [] })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('初始化方式 · 三选一生成首稿'))
      .toBeVisible()
    // #90 已废止的动作不出现；E7/#83 的新指引把重新选卡指向「再建一个」。
    await expect(canvas.queryByText(/复制为新智能体/)).toBeNull()
    await expect(
      canvas.getByText(/想重新选卡：再建一个智能体/),
    ).toBeVisible()
  },
}

// ── ② E7/#83 门 · 已有版本＝清空不复活三选一（u02-c19 拍板 A） ─────────────
export const InitGateShutForVersionedAgent: Story = {
  parameters: {
    msw: handlers(
      '临时草稿：想清掉重来。',
      () => HttpResponse.json({ versions: [v1, v2], entryVersionID: v1.id }),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('版本（2）')).toBeVisible()
    // 三选一不挂载；清空入口只叫「清空工作区」，不再承诺重新选择初始化方式。
    await expect(canvas.queryByText('初始化方式 · 三选一生成首稿')).toBeNull()
    await expect(canvas.queryByText('清空工作区（重新选择初始化方式）'))
      .toBeNull()
    const clear = canvas.getByRole('button', { name: '清空工作区' })
    clear.click()
    // 确认句把重选初始化指向「再建一个智能体或创建对侧」（#90 唯一出口）。
    await expect(
      await canvas.findByText(/再建一个智能体或创建对侧/),
    ).toBeVisible()
    canvas.getByRole('button', { name: '确认清空' }).click()
    await waitFor(() =>
      expect(
        (canvas.getByLabelText('策略提示词') as HTMLTextAreaElement).value,
      ).toBe('')
    )
    // 清空之后三选一依旧不复活——这就是与旧行为的分水岭。
    await expect(canvas.queryByText('初始化方式 · 三选一生成首稿')).toBeNull()
  },
}

// ── ① E10/#84 一键改标（u02-c11b 拍板 A） ──────────────────────────────────
// 保存 v2 时 ★ 仍在 v1：提示带「一键改标到 v2」；点击后 ★ 真正移动，提示
// 按 #91 口径更新为「★ 已从 v1 移到 v2」。
const restarWorld = { saved: false, starred: false }

export const SaveNoticeOneClickRestar: Story = {
  loaders: [
    () => {
      restarWorld.saved = false
      restarWorld.starred = false
      return {}
    },
  ],
  parameters: {
    msw: [
      ...handlers(v2.prompt, () =>
        HttpResponse.json(
          restarWorld.saved
            ? {
              versions: [
                { ...v1, isEntry: !restarWorld.starred },
                { ...v2, isEntry: restarWorld.starred },
              ],
              entryVersionID: restarWorld.starred ? v2.id : v1.id,
            }
            : { versions: [v1], entryVersionID: v1.id },
        )),
      http.post('/v1/agents/101/save', () => {
        restarWorld.saved = true
        return HttpResponse.json(v2)
      }),
      http.post('/v1/agents/101/entry/:versionID', () => {
        restarWorld.starred = true
        return HttpResponse.json({ ok: true })
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('版本（1）')).toBeVisible()
    canvas.getByTestId('save-version').click()
    // E10：保存不移动 ★——提示点名旧参赛版本，并给一键改标按钮。
    await expect(
      await canvas.findByText(/已保存 v2 · ★参赛版本仍是 v1/),
    ).toBeVisible()
    const restar = canvas.getByRole('button', { name: '一键改标到 v2' })
    restar.click()
    // #91 口径：提示说清 ★ 从哪来、到哪去；按钮用完即收。
    await expect(await canvas.findByText('★ 已从 v1 移到 v2')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /一键改标/ })).toBeNull()
  },
}

// ── ③ P11 零损失细化（round-2 jR1s4） ─────────────────────────────────────
// 草稿与最新版本 v2 不一致（P11 本会拦），但与被点击的旧版本 v1 一字不差——
// 载入零损失，直接载入、不弹确认。
export const IterateIdenticalDraftSkipsConfirm: Story = {
  parameters: {
    msw: handlers(
      v1.prompt,
      () =>
        HttpResponse.json({
          versions: [
            { ...v1, isEntry: false },
            { ...v2, isEntry: true },
          ],
          entryVersionID: v2.id,
        }),
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('版本（2）')).toBeVisible()
    canvas.getByRole('button', { name: '基于 v1 迭代' }).click()
    // 不出现覆盖确认（role=alert 的确认行），直接载入。
    await expect(await canvas.findByText(/已载入 v1/)).toBeVisible()
    await expect(canvas.queryByRole('alert')).toBeNull()
    await expect(
      (canvas.getByLabelText('策略提示词') as HTMLTextAreaElement).value,
    ).toBe(v1.prompt)
  },
}
