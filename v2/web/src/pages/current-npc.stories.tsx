import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { delay, http, HttpResponse } from 'msw'
import { useState } from 'react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'

import { AppRoutes } from '../app-router'
import { OsPanel } from '../components/os-panel'
import { AuthProvider } from '../context/auth'
import { currentNpcPath } from '../lib/current-npc'
import { config, scenario, versions } from '../testing/v34-fixtures'

const presetKey = 'b / current?key'
const detail = {
  ...scenario,
  summary: {
    ...scenario.summary,
    id: 'npc-test',
    stats: { battleCount: 987, sideWinRate: { a: 73, b: 27 } },
  },
  presets: [
    {
      ...scenario.presets[0],
      key: presetKey,
      options: { secret: 'hidden-options' },
    },
    scenario.presets[1],
  ],
}
const path = currentNpcPath('npc-test', presetKey)

function Picker() {
  const [open, setOpen] = useState(true)
  return (
    <OsPanel
      open={open}
      onClose={() => setOpen(false)}
      scenario={detail}
      side='a'
      versions={versions}
      entryVersionID={1002}
    />
  )
}

function Surface({ initialPath = path }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Link to={currentNpcPath('npc-test', 'shangyang-direct')}>
          切换到另一预设
        </Link>
        <Routes>
          <Route path='/picker' element={<Picker />} />
          <Route path='*' element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

let mutations = 0
let catalogReads = 0
const meta = {
  title: 'v3.4/Current NPC',
  component: Surface,
  beforeEach: () => {
    mutations = 0
    catalogReads = 0
  },
  parameters: {
    msw: [
      http.get('/v1/auth/me', () => HttpResponse.json({}, { status: 401 })),
      http.get('/v1/scenarios/npc-test', ({ request }) => {
        catalogReads++
        // Guest reads do not forward stale sessions.
        expect(request.credentials).toBe('omit')
        return HttpResponse.json(detail)
      }),
      http.get('/v1/config', () => HttpResponse.json(config)),
      http.get(
        '/v1/scenarios/npc-test/opponents',
        () => HttpResponse.json({ opponents: [] }),
      ),
      http.post('/v1/*', () => {
        mutations++
        return HttpResponse.json({}, { status: 500 })
      }),
    ],
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const GuestReadsCurrentMetadata: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: '稳健守旧派' }))
      .toBeVisible()
    await expect(canvas.getByText('乙方 · 甘龙')).toBeVisible()
    await expect(canvas.getByText('fixture-model')).toBeVisible()
    await expect(canvas.getByText('当前 NPC 预设')).toBeVisible()
    const page = canvasElement.querySelector('[data-tm="EA.npc-page"]')!
    await expect(page.textContent).not.toMatch(
      /987|73%|27%|暂无数据|hidden-options/,
    )
    await expect(page.textContent).not.toContain(presetKey)
    await expect(within(page as HTMLElement).queryByRole('button')).toBeNull()
    await expect(catalogReads).toBe(1)
    await expect(mutations).toBe(0)
    await userEvent.click(canvas.getByRole('link', { name: '返回场景' }))
    await expect(await canvas.findByRole('heading', { name: 'NPC 练习对手' }))
      .toBeVisible()
  },
}

export const ScenarioEntranceOpensExactPreset: Story = {
  args: { initialPath: '/scenarios/npc-test' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByRole('link', { name: '稳健守旧派 · 甘龙' })
    await expect(link).toHaveAttribute('href', path)
    await expect(catalogReads).toBe(1)
    await userEvent.click(link)
    await expect(await canvas.findByRole('heading', { name: '稳健守旧派' }))
      .toBeVisible()
    await expect(catalogReads).toBe(2)
    await expect(mutations).toBe(0)
  },
}

export const PveSelectionOpensWithoutDispatch: Story = {
  args: { initialPath: '/picker' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await expect(canvas.queryByRole('link', { name: '查看当前 NPC' }))
      .toBeNull()
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(
      await canvas.findByRole('option', { name: '稳健守旧派' }),
    )
    const link = canvas.getByRole('link', { name: '查看当前 NPC' })
    await expect(link).toHaveAttribute('href', path)
    await userEvent.click(link)
    await expect(await canvas.findByRole('heading', { name: '稳健守旧派' }))
      .toBeVisible()
    await expect(canvas.queryByRole('dialog')).toBeNull()
    await expect(mutations).toBe(0)
  },
}

export const RemovedPresetDoesNotFallback: Story = {
  args: { initialPath: currentNpcPath('npc-test', 'retired-preset') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/当前场景已没有这个 NPC 预设/))
      .toBeVisible()
    await expect(canvas.queryByRole('heading', { name: '稳健守旧派' }))
      .toBeNull()
    await expect(canvas.getByRole('link', { name: '返回场景' })).toBeVisible()
    await expect(catalogReads).toBe(1)
  },
}

let failedReads = 0
export const FailedReadHasManualBoundedRetry: Story = {
  beforeEach: () => {
    failedReads = 0
  },
  parameters: {
    msw: [
      http.get('/v1/scenarios/npc-test', () => {
        failedReads++
        return failedReads === 1
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json(detail)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toBeVisible()
    await expect(failedReads).toBe(1)
    await userEvent.click(canvas.getByRole('button', { name: '重试' }))
    await expect(await canvas.findByRole('heading', { name: '稳健守旧派' }))
      .toBeVisible()
    await expect(failedReads).toBe(2)
  },
}

export const HangingReadStopsAndCanRetry: Story = {
  beforeEach: () => {
    failedReads = 0
  },
  parameters: {
    msw: [
      http.get('/v1/scenarios/npc-test', async () => {
        failedReads++
        if (failedReads === 1) await delay('infinite')
        return HttpResponse.json(detail)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 }))
      .toBeVisible()
    await expect(failedReads).toBe(1)
    await userEvent.click(canvas.getByRole('button', { name: '重试' }))
    await expect(await canvas.findByRole('heading', { name: '稳健守旧派' }))
      .toBeVisible()
    await expect(failedReads).toBe(2)
  },
}

export const RouteChangeCannotShowPreviousNpc: Story = {
  parameters: {
    msw: [
      http.get('/v1/scenarios/npc-test', async () => {
        catalogReads++
        if (catalogReads === 1) await delay(300)
        return HttpResponse.json(detail)
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link', { name: '切换到另一预设' }))
    await expect(await canvas.findByRole('heading', { name: '强硬变法派' }))
      .toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 350))
    await expect(canvas.queryByRole('heading', { name: '稳健守旧派' }))
      .toBeNull()
    await expect(canvas.getByText('甲方 · 商鞅')).toBeVisible()
  },
}
