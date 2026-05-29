import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/layout/app-shell'
import { useAuth } from './context/auth'
import { AdminPage } from './pages/admin-page'
import { AdminMonitorPage } from './pages/admin/admin-monitor-page'
import { AdminPlayersPage } from './pages/admin/admin-players-page'
import { AdminSettingsPage } from './pages/admin/admin-settings-page'
import { AdminTournamentsPage } from './pages/admin/admin-tournaments-page'
import { AdminScenarioEditPage } from './pages/admin-scenario-edit'
import ComponentPlaygroundPage from './pages/component-playground-page'
import { DashboardPage } from './pages/dashboard-page'
import { LeaderboardPage } from './pages/Leaderboard'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/Login'
import { MatchDetailPage } from './pages/MatchDetail'
import { PlaygroundPage } from './pages/Playground'
import { RegisterPage } from './pages/Register'
import { ScenarioDetailPage } from './pages/ScenarioDetail'
import { ScenariosPage } from './pages/Scenarios'
import { SettingsPage } from './pages/settings-page'
import { TournamentPlayerDetailPage } from './pages/TournamentPlayerDetail'
import { MockIndex } from './pages/mocks/mock-index'
import { MockLanding } from './pages/mocks/mock-landing'
import { MockLogin } from './pages/mocks/mock-login'
import { MockRegister } from './pages/mocks/mock-register'
import { MockDashboard } from './pages/mocks/mock-dashboard'
import { MockDashboardEmpty } from './pages/mocks/mock-dashboard-empty'
import { MockWorkshop } from './pages/mocks/mock-workshop'
import { MockLeaderboard } from './pages/mocks/mock-leaderboard'
import { MockMatch } from './pages/mocks/mock-match'
import { MockShell } from './pages/mocks/mock-shell'

function ProtectedShell() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--background) text-sm text-(--foreground-subtle)">
        正在恢复会话...
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to="/" />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/scenarios/:scenarioId" element={<ScenarioDetailPage />} />
        <Route path="/playground/:submissionId" element={<PlaygroundPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/leaderboard/tournaments/:tournamentId/players/:submissionId"
          element={<TournamentPlayerDetailPage />}
        />
        <Route path="/matches/:matchId" element={<MatchDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/components" element={<ComponentPlaygroundPage />} />
        <Route
          path="/admin"
          element={
            user?.isAdmin ? <AdminPage /> : <Navigate replace to="/scenarios" />
          }
        >
          <Route index element={<Navigate replace to="tournaments" />} />
          <Route path="tournaments" element={<AdminTournamentsPage />} />
          <Route path="players" element={<AdminPlayersPage />} />
          <Route path="monitor" element={<AdminMonitorPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route
          path="/admin/scenarios/:scenarioId"
          element={
            user?.isAdmin ? (
              <AdminScenarioEditPage />
            ) : (
              <Navigate replace to="/scenarios" />
            )
          }
        />
        <Route path="*" element={<Navigate replace to="/scenarios" />} />
      </Routes>
    </AppShell>
  )
}

export function AppRouter() {
  const { isLoading, user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            isLoading ? (
              <div />
            ) : user ? (
              <Navigate replace to="/scenarios" />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isLoading ? (
              <div />
            ) : user ? (
              <Navigate replace to="/scenarios" />
            ) : (
              <RegisterPage />
            )
          }
        />
        {/* Static mock pages — no auth required */}
        <Route path="/mocks" element={<MockIndex />} />
        <Route path="/mocks/landing" element={<MockLanding />} />
        <Route path="/mocks/login" element={<MockLogin />} />
        <Route path="/mocks/register" element={<MockRegister />} />
        <Route
          path="/mocks/dashboard"
          element={
            <MockShell>
              <MockDashboard />
            </MockShell>
          }
        />
        <Route
          path="/mocks/dashboard-empty"
          element={
            <MockShell>
              <MockDashboardEmpty />
            </MockShell>
          }
        />
        <Route
          path="/mocks/workshop"
          element={
            <MockShell>
              <MockWorkshop />
            </MockShell>
          }
        />
        <Route
          path="/mocks/leaderboard"
          element={
            <MockShell>
              <MockLeaderboard />
            </MockShell>
          }
        />
        <Route
          path="/mocks/match"
          element={
            <MockShell>
              <MockMatch />
            </MockShell>
          }
        />
        <Route path="/*" element={<ProtectedShell />} />
      </Routes>
    </BrowserRouter>
  )
}
