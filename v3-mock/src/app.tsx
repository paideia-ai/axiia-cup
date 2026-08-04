import type { PropsWithChildren } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router-dom'

import { AppShell } from './components/layout/app-shell'
import { useAppState } from './mock/store'
import { AgentViewPage } from './pages/agent-view'
import { BuilderPage } from './pages/builder'
import { ExpressBuildPage, ExpressIntroPage } from './pages/express'
import { HistoryPage } from './pages/history'
import { LandingPage } from './pages/landing'
import { LoginPage } from './pages/login'
import { MatchPage } from './pages/match'
import { NotificationsPage } from './pages/notifications'
import { RankingsPage } from './pages/rankings'
import { RegisterPage } from './pages/register'
import { ScenarioDetailPage } from './pages/scenario-detail'
import { ScenariosPage } from './pages/scenarios'
import { SettingsPage } from './pages/settings'

function Protected({ children }: PropsWithChildren) {
  const { user } = useAppState()
  if (!user) return <Navigate to='/login' replace />
  return <AppShell>{children}</AppShell>
}

/** B1：白名单示范对局公开可看（裁判 OS 公开）——未登录用极简壳渲染战报 */
function MatchRoute() {
  const { user } = useAppState()
  const { id } = useParams()
  if (user) {
    return <AppShell><MatchPage /></AppShell>
  }
  if (id?.startsWith('demo-')) {
    return (
      <div className='flex min-h-screen flex-col bg-(--background)'>
        <header className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl'>
          <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6'>
            <Link to='/' className='text-sm font-black tracking-[0.24em] text-(--accent)'>AXIIA CUP</Link>
            <span className='text-xs text-(--foreground-muted)'>示范对局 · 公开可看</span>
            <div className='ml-auto flex items-center gap-3 text-sm'>
              <Link to='/login' className='text-(--foreground-subtle) hover:text-(--foreground)'>登录</Link>
              <Link to='/register' className='rounded-full bg-(--accent) px-4 py-1.5 font-semibold text-white hover:bg-(--accent-hover)'>注册参赛</Link>
            </div>
          </div>
        </header>
        <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6'>
          <MatchPage />
        </main>
      </div>
    )
  }
  return <Navigate to='/login' replace />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/scenarios' element={<Protected><ScenariosPage /></Protected>} />
        <Route path='/scenarios/:id' element={<Protected><ScenarioDetailPage /></Protected>} />
        <Route path='/scenarios/:id/build' element={<Protected><BuilderPage /></Protected>} />
        <Route path='/express' element={<Protected><ExpressIntroPage /></Protected>} />
        <Route path='/express/build' element={<Protected><ExpressBuildPage /></Protected>} />
        <Route path='/matches/:id' element={<MatchRoute />} />
        <Route path='/agents/:id' element={<Protected><AgentViewPage /></Protected>} />
        <Route path='/rankings' element={<Protected><RankingsPage /></Protected>} />
        <Route path='/notifications' element={<Protected><NotificationsPage /></Protected>} />
        <Route path='/settings' element={<Protected><SettingsPage /></Protected>} />
        <Route path='/history' element={<Protected><HistoryPage /></Protected>} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}
