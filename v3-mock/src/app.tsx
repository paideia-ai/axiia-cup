import type { PropsWithChildren } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

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
        <Route path='/matches/:id' element={<Protected><MatchPage /></Protected>} />
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
