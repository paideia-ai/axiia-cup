import type { Meta, StoryObj } from '@storybook/react-vite'
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
      http.get('/v1/matches', () => HttpResponse.json({ items: [] })),
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
