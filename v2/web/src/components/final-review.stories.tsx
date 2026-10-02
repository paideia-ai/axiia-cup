import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchDetailPage } from '../pages/match-detail'
import court from '../testing/reference-match-144.json'
import honnoji from '../testing/reference-match-120.json'
import trolley from '../testing/reference-match-122.json'
import fengyi from '../testing/reference-match-123.json'
import harbor from '../testing/reference-match-145.json'

const scenes = [
  { name: '商鞅变法', id: 144, match: court },
  { name: '本能寺之变', id: 120, match: honnoji },
  { name: '电车难题', id: 122, match: trolley },
  { name: '凤仪亭', id: 123, match: fengyi },
  { name: '码头疑云', id: 145, match: harbor },
]

function FinalReview() {
  const [selected, setSelected] = useState(0)
  const scene = scenes[selected]
  return (
    <main className='mx-auto max-w-[1040px] px-4 py-8 sm:px-6'>
      <aside
        className='mb-6 space-y-3 border-b border-(--border-soft) pb-5'
        aria-label='设计预览控制'
      >
        <p className='text-xs text-(--foreground-muted)'>
          完整战报 · 本地历史样本 · 使用正式页面组件
        </p>
        <div className='flex flex-wrap gap-2' role='group' aria-label='场景'>
          {scenes.map((item, index) => (
            <button
              type='button'
              key={item.id}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-(--info) ${
                selected === index
                  ? 'border-(--foreground-muted) bg-white/6 text-(--foreground)'
                  : 'border-(--border-soft) text-(--foreground-subtle)'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </aside>
      <MemoryRouter
        key={scene.id}
        initialEntries={[`/matches/${scene.id}`]}
      >
        <Routes>
          <Route
            path='/matches/:matchId'
            element={<MatchDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </main>
  )
}

const meta = {
  title: 'Design/Final review',
  component: FinalReview,
  parameters: {
    fullApp: true,
    layout: 'fullscreen',
    msw: [
      ...scenes.map((scene) =>
        http.get(
          `/v1/matches/${scene.id}`,
          () => HttpResponse.json(scene.match),
        )
      ),
      http.get('/v1/matches', () => HttpResponse.json({ matches: [] })),
      http.all(
        '/v1/*',
        ({ request }) =>
          request.method === 'GET'
            ? HttpResponse.json({}, { status: 404 })
            : HttpResponse.json({ message: '本地只读预览' }, { status: 405 }),
      ),
    ],
  },
} satisfies Meta<typeof FinalReview>
export default meta
type Story = StoryObj<typeof meta>
export const Consolidated: Story = {}

export const InteractionChecks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: '对战 #144' })
    for (const scene of scenes) {
      await userEvent.click(
        within(canvas.getByRole('group', { name: '场景' })).getByRole(
          'button',
          {
            name: scene.name,
          },
        ),
      )
      await canvas.findByRole('heading', {
        name: `对战 #${scene.id}`,
      })
      await expect(canvas.queryByRole('button', { name: /#\d+ 后的裁判心声/ }))
        .toBeNull()
      if ([144, 120, 122].includes(scene.id)) {
        const sidebar = canvas.getByRole('complementary', {
          name: '裁判 OS 侧栏',
        })
        await expect(sidebar.querySelectorAll('[data-tm="FA.aside-card"]'))
          .toHaveLength(scene.id === 120 ? 4 : 2)
        await expect(
          canvasElement.querySelectorAll(
            '.judge-transcript-dialogue-column [data-tm="FA.aside-card"]',
          ),
        ).toHaveLength(0)
        const chart = sidebar.querySelector('[data-tm="FA.trend-chart"]')!
        await expect(chart.querySelectorAll('[data-tm="FA.trend-beat"]'))
          .toHaveLength(scene.id === 120 ? 4 : scene.id === 122 ? 7 : 2)
        for (const circle of chart.querySelectorAll('circle')) {
          const rect = circle.getBoundingClientRect()
          await expect(Math.abs(rect.width - rect.height)).toBeLessThan(0.01)
        }
      }
      if (scene.id === 144 || scene.id === 120) {
        const goals = canvas.getByRole('region', { name: '隐藏目标及计分' })
        await expect(goals.querySelectorAll('[data-review-goal]')).toHaveLength(
          6,
        )
        await expect(goals.querySelectorAll('[data-review-truth="true"]'))
          .toHaveLength(2)
        await expect(canvas.queryByRole('heading', { name: '计分推导' }))
          .toBeNull()
      } else {
        const ending = canvas.getByRole('region', { name: '整局裁决' })
        const original = ending.textContent
        const chart = canvasElement.querySelector('.judge-sidebar-trend')
        const originalChart = chart?.innerHTML
        for (const tab of canvas.getAllByRole('tab')) {
          await userEvent.click(tab)
          await expect(ending.textContent).toBe(original)
          if (chart) {
            await expect(chart.isConnected).toBe(true)
            await expect(chart.innerHTML).toBe(originalChart)
          }
        }
      }
      if (scene.id === 122) {
        const point = canvasElement.querySelector<HTMLElement>(
          '.judge-sidebar-trend [data-tm="FA.trend-beat"]',
        )!
        point.focus()
        await userEvent.keyboard('{Enter}')
        await expect(canvas.getByRole('tab', { selected: true }))
          .toHaveTextContent('原始电车')
        await expect(document.activeElement?.id).toBe('beat-os-2')
        await expect(
          canvas.getByRole('heading', { name: '第一案·原始电车' }),
        )
          .toBeVisible()
        await expect(
          canvasElement.querySelector('[data-tm="FA.event-verdict"]'),
        ).toBeNull()
      }
      if (scene.id === 123) {
        await expect(canvasElement.querySelector('[data-tm="FA.event-score"]'))
          .toBeNull()
        await userEvent.click(
          canvas.getByRole('tab', { name: '私会' }),
        )
        const speakers = [
          ...canvasElement.querySelectorAll('[data-tm="FA.speaker-line"]'),
        ]
          .filter((node) => node.textContent?.includes('貂蝉'))
        await expect(speakers.length).toBeGreaterThan(0)
        for (const speaker of speakers) {
          await expect(speaker.textContent).not.toContain('旁白角色')
        }
      }
      await userEvent.click(
        canvas.getByRole('button', { name: '查看详细裁决' }),
      )
      await expect(document.activeElement?.id).toBe(
        scene.id === 145 ? 'match-scoring' : 'match-final-verdict',
      )
      await userEvent.click(
        canvas.getByRole('button', { name: '回放' }),
      )
      await expect(canvasElement.querySelector('.judge-transcript')).toBeNull()
      await expect(canvasElement.querySelector('[data-review-ending]'))
        .toBeNull()
      await expect(canvas.queryByRole('region', { name: '隐藏目标及计分' }))
        .toBeNull()
      await userEvent.click(
        canvas.getByRole('button', { name: '退出回放' }),
      )
    }
  },
}

export const MobileReportChecks: Story = {
  play: async ({ canvasElement }) => {
    if (!('__vitest_browser_runner__' in globalThis)) return
    const { page } = await import('vitest/browser')
    const canvas = within(canvasElement)
    try {
      await page.viewport(390, 844)
      for (const scene of scenes) {
        await userEvent.click(
          within(canvas.getByRole('group', { name: '场景' })).getByRole(
            'button',
            { name: scene.name },
          ),
        )
        await canvas.findByRole('heading', { name: `对战 #${scene.id}` })
        const portraits = canvasElement.querySelectorAll(
          '.role-portrait:not([data-portrait-size="sm"])',
        )
        await expect(portraits.length).toBeGreaterThan(0)
        for (const portrait of portraits) {
          await expect(portrait.getBoundingClientRect().width).toBe(48)
        }
        if ([144, 120, 122].includes(scene.id)) {
          await waitFor(() =>
            expect(
              canvasElement.querySelector(
                '.judge-mobile-trend .judge-sidebar-trend',
              ),
            ).not.toBeNull()
          )
          const card = canvasElement.querySelector(
            '.judge-mobile-trend .judge-sidebar-trend',
          )!
          await expect(canvasElement.querySelectorAll('.judge-sidebar-trend'))
            .toHaveLength(1)
          const ending = scene.id === 122
            ? canvas.getByRole('region', { name: '整局裁决' })
            : canvas.getByRole('region', { name: '隐藏目标及计分' })
          await expect(
            Boolean(
              ending.compareDocumentPosition(card) &
                Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          ).toBe(true)
          if (scene.id === 122) {
            for (const tab of canvas.getAllByRole('tab')) {
              await userEvent.click(tab)
              await expect(card.isConnected).toBe(true)
            }
            const point = card.querySelector<HTMLElement>(
              '[data-tm="FA.trend-beat"]',
            )!
            point.focus()
            await userEvent.keyboard('{Enter}')
            await expect(canvas.getByRole('tab', { selected: true }))
              .toHaveTextContent('原始电车')
            await expect(document.activeElement?.id).toBe('beat-os-2')
          }
          await page.viewport(1000, 844)
          await waitFor(() =>
            expect(
              canvasElement.querySelector(
                '.judge-transcript .judge-sidebar-trend',
              ),
            ).not.toBeNull()
          )
          await expect(
            canvasElement.querySelector(
              '.judge-mobile-trend .judge-sidebar-trend',
            ),
          ).toBeNull()
          await page.viewport(390, 844)
        }
        await userEvent.click(canvas.getByRole('button', { name: '回放' }))
        await expect(canvasElement.querySelector('.judge-mobile-trend'))
          .toBeNull()
        await userEvent.click(canvas.getByRole('button', { name: '退出回放' }))
      }
    } finally {
      await page.viewport(1280, 720)
    }
  },
}
