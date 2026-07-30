import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/layout/app-shell'
import { useAuth } from './context/auth'
import { AdminPage } from './pages/admin'
import { AdminSlotPage } from './pages/admin-slot'
import { BuilderPage } from './pages/builder'
import { CatalogPage } from './pages/catalog'
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
        <Route path='/scenarios' element={<CatalogPage />} />
        <Route path='/scenarios/:scenarioId' element={<ScenarioDetailPage />} />
        <Route path='/agents/:agentId' element={<BuilderPage />} />
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
  if (isLoading) return <Loading />
  if (account) return <Navigate replace to='/scenarios' />
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
    </BrowserRouter>
  )
}
