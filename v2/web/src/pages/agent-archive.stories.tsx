import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../context/auth'
import {
  inventory,
  scenario,
  scenarioList,
  versions,
} from '../testing/v34-fixtures'
import { AgentViewPage } from './agent-view'
import { ArchivedAgentsPage } from './archived-agents'
import { MyAgentsPage } from './my-agents'
import { SettingsPage } from './settings'

function Surface({ entry = '/agents/101' }: { entry?: string }) {
  return (
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path='/agents/:agentId' element={<AgentViewPage />} />
          <Route path='/my-agents' element={<MyAgentsPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route
            path='/settings/archived-agents'
            element={<ArchivedAgentsPage />}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function handlers(initiallyArchived = false, failRestore = false) {
  let archived = initiallyArchived
  const agent = () => ({
    ...inventory.scenarios[0].sides.a[0],
    name: '以民为本',
    isArchived: archived,
  })
  return [
    http.get(
      '/v1/auth/me',
      () =>
        HttpResponse.json({
          account: { id: 'preview', displayName: '预览', isAdmin: false },
          elevated: false,
          firstBattleDone: true,
        }),
    ),
    http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
    http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
    http.get(
      '/v1/my/agents',
      () =>
        HttpResponse.json({
          scenarios: [{
            ...inventory.scenarios[0],
            sides: { ...inventory.scenarios[0].sides, a: [agent()] },
          }],
        }),
    ),
    http.get(
      '/v1/my/archived-agents',
      () =>
        HttpResponse.json({
          agents: archived
            ? [{
              agent: agent(),
              scenarioID: scenario.summary.id,
              scenarioTitle: scenario.summary.title,
              sideName: '商鞅',
            }]
            : [],
        }),
    ),
    http.get(
      '/v1/agents/101/draft',
      () =>
        HttpResponse.json({
          fields: {},
          scenarioID: scenario.summary.id,
          side: 'a',
        }),
    ),
    http.get(
      '/v1/agents/101/versions',
      () => HttpResponse.json({ versions, entryVersionID: 1002 }),
    ),
    http.put('/v1/agents/101/archive', () => {
      archived = true
      return HttpResponse.json({ ok: true })
    }),
    http.delete('/v1/agents/101/archive', () => {
      if (failRestore) {
        return HttpResponse.json({
          error: 'unavailable',
          message: '恢复失败，请稍后重试',
        }, { status: 503 })
      }
      archived = false
      return HttpResponse.json({ ok: true })
    }),
  ]
}

const meta = {
  title: 'Agents/Archive and restore',
  component: Surface,
} satisfies Meta<typeof Surface>
export default meta
type Story = StoryObj<typeof meta>

export const ArchiveAndRestore: Story = {
  parameters: { msw: handlers() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)
    await expect(
      await canvas.findByText('商鞅「以民为本」', { selector: 'h1' }),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '智能体更多操作' }),
    )
    await expect(page.queryByRole('menuitem', { name: '删除智能体' }))
      .toBeNull()
    await userEvent.click(
      await page.findByRole('menuitem', { name: '归档智能体' }),
    )
    await expect(await canvas.findByRole('heading', { name: '我的智能体' }))
      .toBeVisible()
    await expect(canvas.queryByRole('link', { name: /以民为本/ })).toBeNull()
    await userEvent.click(
      canvas.getByRole('link', { name: '查看已归档的智能体' }),
    )
    await expect(
      await canvas.findByRole('heading', { name: '商鞅「以民为本」' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: '返回设置' }))
    await userEvent.click(
      await canvas.findByRole('link', { name: /已归档的智能体/ }),
    )
    await userEvent.click(
      await canvas.findByRole('button', { name: '恢复 商鞅「以民为本」' }),
    )
    await expect(
      await canvas.findByRole('heading', { name: '暂无已归档的智能体' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: '查看智能体' }))
    await expect(await canvas.findByRole('button', { name: '复制 v1 提示词' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '复制 v2 提示词' }))
      .toBeVisible()
    await expect(canvas.getByRole('button', { name: '将 v2 设为商鞅参赛版本' }))
      .toHaveAttribute('aria-pressed', 'true')
  },
}

export const RestoreFailure: Story = {
  args: { entry: '/settings/archived-agents' },
  parameters: { msw: handlers(true, true) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: '恢复 商鞅「以民为本」' }),
    )
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      '恢复失败，请稍后重试',
    )
    await expect(canvas.getByRole('button', { name: '恢复 商鞅「以民为本」' }))
      .toBeEnabled()
    await expect(canvas.queryByText('暂无已归档的智能体')).toBeNull()
  },
}
