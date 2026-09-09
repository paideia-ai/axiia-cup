import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { AuthProvider, useAuth } from '../context/auth'
import { AppShell } from '../components/layout/app-shell'
import { CatalogPage } from '../pages/catalog'
import { ScenarioDetailPage } from '../pages/scenario-detail'
import { MyAgentsPage } from '../pages/my-agents'
import { AgentViewPage } from '../pages/agent-view'
import { BuilderPage } from '../pages/builder'
import { TournamentsPage } from '../pages/tournaments'
import { StandingsPage } from '../pages/standings'
import { MatchesPage } from '../pages/matches'
import { MatchDetailPage } from '../pages/match-detail'
import { NotificationsPage } from '../pages/notifications'
import { SettingsPage } from '../pages/settings'
import { installDemoAPI } from './fixture-api'
import '../styles.css'
import './frontend-style.css'

installDemoAPI()
document.body.dataset.frontendStyle =
  new URLSearchParams(location.search).get('style') === 'original'
    ? 'original'
    : 'polished'
function BuilderRoute() {
  const { agentId = '' } = useParams()
  return <BuilderPage key={agentId} />
}
function Demo() {
  const { isLoading, account } = useAuth()
  const { pathname } = useLocation()
  useEffect(() => {
    document.body.dataset.demoPage = pathname.startsWith('/matches/')
      ? 'report'
      : pathname.startsWith('/scenarios/')
      ? 'scenario'
      : pathname.split('/')[1]
  }, [pathname])
  if (isLoading) return <p className='p-8'>正在加载示例…</p>
  if (!account) {
    return <p className='p-8'>已退出演示。刷新页面可恢复示例账户。</p>
  }
  return (
    <>
      <AppShell>
        <Routes>
          <Route path='/scenarios' element={<CatalogPage />} />
          <Route
            path='/scenarios/:scenarioId'
            element={<ScenarioDetailPage />}
          />
          <Route path='/my-agents' element={<MyAgentsPage />} />
          <Route path='/agents/:agentId' element={<AgentViewPage />} />
          <Route path='/agents/:agentId/build' element={<BuilderRoute />} />
          <Route path='/tournaments' element={<TournamentsPage />} />
          <Route
            path='/tournaments/:tournamentId'
            element={<StandingsPage />}
          />
          <Route path='/matches' element={<MatchesPage />} />
          <Route path='/matches/:matchId' element={<MatchDetailPage />} />
          <Route path='/notifications' element={<NotificationsPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='*' element={<Navigate replace to='/scenarios' />} />
        </Routes>
      </AppShell>
      <p className='demo-provenance'>
        真实数据快照 · 2026-09-09 17:51 UTC · 账户已匿名化，私人策略为示例文本 ·
        历史展示已收录的 29 场对局 · 操作仅保存在本机
      </p>
    </>
  )
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <Demo />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
