import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { delay, http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { AppShell } from '../../components/layout/app-shell'
import { AuthProvider, useAuth } from '../../context/auth'
import { SoundProvider, useSound } from '../../context/sound'
import { BuilderPage } from '../../pages/builder'
import { AgentViewPage } from '../../pages/agent-view'
import { MatchDetailPage } from '../../pages/match-detail'
import { MyAgentsPage } from '../../pages/my-agents'
import { CatalogPage } from '../../pages/catalog'
import { ScenarioDetailPage } from '../../pages/scenario-detail'
import { NotificationsPage } from '../../pages/notifications'
import { MatchesPage } from '../../pages/matches'
import { TournamentsPage } from '../../pages/tournaments'
import { SettingsPage } from '../../pages/settings'
import { purgeBuilderDraftJournals } from '../../lib/builder-draft-storage'
import { TypingFeedback } from '../typing/typing-feedback'
import { ClaimReward } from './claim-reward'
import { respond, streamMatch } from './fixtures'
import '../../styles.css'

function BuilderRoute() {
  const { agentId } = useParams()
  return <BuilderPage key={agentId} />
}
function MatchRoute() {
  const { matchId } = useParams()
  return (
    <MatchDetailPage
      key={matchId}
      resultAction={<ClaimReward key={matchId} />}
    />
  )
}
function Surface() {
  const { isLoading } = useAuth()
  const { preferences, update } = useSound()
  useEffect(() => {
    update({ palette: 'clear', responses: true })
  }, [update])
  async function reset() {
    await fetch('/v1/demo/reset', { method: 'POST' })
    sessionStorage.removeItem('axiia.sound-journey.builder.v1')
    purgeBuilderDraftJournals(101)
    location.hash = '/agents/101/build'
    location.reload()
  }
  if (isLoading) return <p className='p-6 text-sm'>正在准备演示…</p>
  return (
    <HashRouter>
      <AppShell>
        <aside
          aria-label='演示说明'
          className='mb-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-(--border-soft) pb-3 text-xs text-(--foreground-muted)'
        >
          <p>本地演示 · 保存 → 出战 → 获胜 → 领取奖励；对局与积分均为模拟。</p>
          <div className='flex items-center gap-4'>
            <label className='flex min-h-8 items-center gap-2'>
              <input
                type='checkbox'
                checked={preferences.responses}
                onChange={(e) => update({ responses: e.target.checked })}
              />回复音效
            </label>
            <button
              type='button'
              className='min-h-8 underline underline-offset-4'
              onClick={() => void reset()}
            >
              重新体验
            </button>
          </div>
        </aside>
        <Routes>
          <Route path='/agents/:agentId/build' element={<BuilderRoute />} />
          <Route path='/agents/:agentId' element={<AgentViewPage />} />
          <Route path='/matches/:matchId' element={<MatchRoute />} />
          <Route path='/my-agents' element={<MyAgentsPage />} />
          <Route path='/scenarios' element={<CatalogPage />} />
          <Route
            path='/scenarios/:scenarioId'
            element={<ScenarioDetailPage />}
          />
          <Route path='/notifications' element={<NotificationsPage />} />
          <Route path='/matches' element={<MatchesPage />} />
          <Route path='/tournaments' element={<TournamentsPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route
            path='*'
            element={<Navigate to='/agents/101/build' replace />}
          />
        </Routes>
      </AppShell>
      {!new URLSearchParams(location.search).has('baseline') && (
        <TypingFeedback />
      )}
    </HashRouter>
  )
}
const worker = setupWorker(http.all('/v1/*', async ({ request }) => {
  const url = new URL(request.url)
  const streamID = url.pathname.match(/^\/v1\/matches\/(\d+)\/stream$/)?.[1]
  if (streamID) {
    const stream = streamMatch(
      Number(streamID),
      Number(url.searchParams.get('afterTurn') ?? -1),
      request.signal,
    )
    return new HttpResponse(stream, {
      status: stream ? 200 : 404,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  }
  if (request.method === 'POST') await delay(200)
  const body = request.method === 'GET'
    ? {}
    : await request.json().catch(() => ({}))
  const result = respond(
    url.pathname + url.search,
    request.method,
    body as Record<string, unknown>,
  )
  return 'stream' in result && result.stream
    ? new HttpResponse(String(result.body), {
      headers: { 'Content-Type': 'text/event-stream' },
    })
    : new HttpResponse(JSON.stringify(result.body), {
      status: result.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
}))
await worker.start({
  quiet: true,
  onUnhandledRequest(request, print) {
    if (new URL(request.url).pathname.startsWith('/v1/')) print.error()
  },
})
createRoot(document.getElementById('root')!).render(
  <SoundProvider>
    <AuthProvider>
      <Surface />
    </AuthProvider>
  </SoundProvider>,
)
