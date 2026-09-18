import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { NavigationMemoryProvider } from '../../src/context/navigation-memory'
import { AgentViewPage } from '../../src/pages/agent-view'
import { MatchDetailPage } from '../../src/pages/match-detail'
import { MatchesPage } from '../../src/pages/matches'
import { versionHistoryHandlers } from '../../src/testing/version-history-fixtures'
import './style.css'

const worker = setupWorker(
  ...versionHistoryHandlers,
  http.all('/v1/*', () =>
    HttpResponse.json({
      error: 'preview_only',
      message: '此预览仅演示版本对局查询，其他操作未开放。',
    }, { status: 400 })),
)

async function start() {
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <NavigationMemoryProvider scope='version-history-preview'>
        <header className='border-b border-(--border-soft) bg-(--background) text-(--foreground-subtle)'>
          <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs md:px-8'>
            <span>版本对局预览 · 演示数据，不连接线上账户</span>
            <nav className='flex gap-5'>
              <Link className='hover:text-(--foreground)' to='/agents/101'>
                智能体主页
              </Link>
              <Link className='hover:text-(--foreground)' to='/matches'>
                全部历史
              </Link>
            </nav>
          </div>
        </header>
        <main className='mx-auto min-h-screen max-w-6xl px-4 py-8 text-(--foreground) md:px-8'>
          <Routes>
            <Route path='/' element={<Navigate to='/agents/101' replace />} />
            <Route path='/agents/:agentId' element={<AgentViewPage />} />
            <Route path='/matches' element={<MatchesPage />} />
            <Route path='/matches/:matchId' element={<MatchDetailPage />} />
            <Route
              path='*'
              element={
                <p>
                  此预览仅演示版本对局查询。<Link
                    to='/agents/101'
                    className='underline'
                  >
                    返回智能体主页
                  </Link>
                </p>
              }
            />
          </Routes>
        </main>
      </NavigationMemoryProvider>
    </BrowserRouter>,
  )
}

void start().catch(() => {
  document.getElementById('root')!.textContent = '预览加载失败，请刷新后重试。'
})
