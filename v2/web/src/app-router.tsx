import type { ReactNode } from 'react'
import { useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/layout/app-shell'
import { useAuth } from './context/auth'
import { AdminPage } from './pages/admin'
import { AdminSlotPage } from './pages/admin-slot'
import { AgentViewPage } from './pages/agent-view'
import { BuilderPage } from './pages/builder'
import { CatalogPage } from './pages/catalog'
import { ExpressPage } from './pages/express'
import { MyAgentsPage } from './pages/my-agents'
import { LandingPage } from './pages/landing'
import { LoginPage } from './pages/login'
import { MatchDetailPage } from './pages/match-detail'
import { MatchesPage } from './pages/matches'
import { NotificationsPage } from './pages/notifications'
import { RegisterPage } from './pages/register'
import { ScenarioDetailPage } from './pages/scenario-detail'
import { SettingsPage } from './pages/settings'
import { StandingsPage } from './pages/standings'
import { TournamentsPage } from './pages/tournaments'
import { TestModeRoot } from './testmode/index'

function Loading() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-(--background) text-sm text-(--foreground-subtle)'>
      正在恢复会话...
    </div>
  )
}

function ProtectedShell() {
  const { isLoading, account } = useAuth()

  if (isLoading) return <Loading />
  if (!account) return <Navigate replace to='/login' />

  return (
    <AppShell>
      <Routes>
        {/* A3 首战快速通道：注册落点；已完成首战的账号进来会被让路。 */}
        <Route path='/express' element={<ExpressPage />} />
        <Route path='/scenarios' element={<CatalogPage />} />
        <Route path='/scenarios/:scenarioId' element={<ScenarioDetailPage />} />
        <Route path='/my-agents' element={<MyAgentsPage />} />
        {/* EA/E 拆分（B3/#70/#75）：/agents/:id 是智能体主页，/build 才是构建器 */}
        <Route path='/agents/:agentId' element={<AgentViewPage />} />
        <Route path='/agents/:agentId/build' element={<BuilderPage />} />
        <Route path='/matches' element={<MatchesPage />} />
        <Route path='/matches/:matchId' element={<MatchDetailPage />} />
        <Route path='/tournaments' element={<TournamentsPage />} />
        <Route path='/tournaments/:tournamentId' element={<StandingsPage />} />
        <Route path='/notifications' element={<NotificationsPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route
          path='/admin'
          element={account.isAdmin
            ? <AdminPage />
            : <Navigate replace to='/scenarios' />}
        />
        <Route
          path='/admin/slots/:slotId'
          element={account.isAdmin
            ? <AdminSlotPage />
            : <Navigate replace to='/scenarios' />}
        />
        <Route path='*' element={<Navigate replace to='/scenarios' />} />
      </Routes>
    </AppShell>
  )
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isLoading, account } = useAuth()
  // 只挡「本来就已登录」的访客。表单提交成功后的落点由表单页自己决定
  // （注册按 firstBattleDone 落 /express，A3/#9；登录落 /scenarios）——
  // 提交成功会把 account 写进 auth 上下文，若这里继续无条件抢跳
  // /scenarios，就会与表单页的 navigate 竞态，把新注册用户误送出快速通道。
  const arrivedAuthenticated = useRef<boolean | null>(null)
  if (!isLoading && arrivedAuthenticated.current === null) {
    arrivedAuthenticated.current = account != null
  }
  if (isLoading) return <Loading />
  if (account && arrivedAuthenticated.current === true) {
    return <Navigate replace to='/scenarios' />
  }
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route
          path='/login'
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path='/register'
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route path='/*' element={<ProtectedShell />} />
      </Routes>
      {/* 测试模式（?tm=1）：挂在 Routes 旁边，所有路由都能用；关着时零成本。 */}
      <TestModeRoot />
    </BrowserRouter>
  )
}
