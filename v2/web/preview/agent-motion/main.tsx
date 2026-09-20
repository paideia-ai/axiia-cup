import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { NavigationMemoryProvider } from '../../src/context/navigation-memory'
import { resetNavigationCache } from '../../src/lib/navigation-cache'
import { AgentViewPage } from '../../src/pages/agent-view'
import {
  config,
  inventory,
  scenario,
  scenarioList,
  versions,
} from '../../src/testing/v34-fixtures'
import './style.css'

let state = { second: false, saved: false }
const worker = setupWorker(
  http.get('/v1/config', () => HttpResponse.json(config)),
  http.get('/v1/models', () => HttpResponse.json({ models: config.models })),
  http.get('/v1/scenarios', () => HttpResponse.json(scenarioList)),
  http.get('/v1/scenarios/:id', () => HttpResponse.json(scenario)),
  http.get('/v1/my/agents', () =>
    HttpResponse.json({
      ...inventory,
      scenarios: [{
        ...inventory.scenarios[0],
        sides: {
          a: [
            {
              agentID: 101,
              name: '初见',
              versionCount: state.saved ? 1 : 0,
              entryVersionID: null,
              latestVersionID: state.saved ? 1001 : null,
            },
            ...(state.second
              ? [{
                agentID: 102,
                name: '另一种思路',
                versionCount: 0,
                entryVersionID: null,
                latestVersionID: null,
              }]
              : []),
          ],
          b: [],
        },
      }],
    })),
  http.get('/v1/agents/:id/draft', () =>
    HttpResponse.json({
      fields: {},
      scenarioID: scenario.summary.id,
      side: 'a',
    })),
  http.get('/v1/agents/:id/versions', ({ params }) =>
    HttpResponse.json({
      versions: state.saved && params.id === '101'
        ? [{ ...versions[0], isEntry: false }]
        : [],
      entryVersionID: null,
    })),
  http.get(
    '/v1/agents/:id/matches',
    () => HttpResponse.json({ matches: [], open: false }),
  ),
  http.post('/v1/agents', () => {
    state = { ...state, second: true }
    return HttpResponse.json({ agentID: 102 })
  }),
  http.all('/v1/*', () =>
    HttpResponse.json({
      error: 'preview_only',
      message: '此预览只演示首次操作动效，请使用上方状态开关。',
    }, { status: 400 })),
)

function Preview() {
  useLocation()
  const navigate = useNavigate()
  const [revision, setRevision] = useState(0)
  const [paused, setPaused] = useState(false)
  const refresh = () => {
    resetNavigationCache()
    setRevision((n) => n + 1)
  }
  const update = (key: 'second' | 'saved', value: boolean) => {
    state = { ...state, [key]: value }
    refresh()
    navigate('/agents/101')
  }
  return (
    <div className={paused ? 'motion-preview paused' : 'motion-preview'}>
      <header className='preview-controls'>
        <div className='preview-heading'>
          <div>
            <p className='preview-kicker'>Axiia Cup · 本地预览</p>
            <h1>A · 明亮涟漪</h1>
          </div>
          <p className='preview-note'>
            示例数据 · 不连接线上账户<br />已选定方案 · 下方为实际页面组件
          </p>
        </div>
        <div className='preview-state'>
          <span>模拟进度</span>
          <label>
            <input
              type='checkbox'
              checked={state.saved}
              onChange={(e) => update('saved', e.target.checked)}
            />已保存首版 prompt
          </label>
          <label>
            <input
              type='checkbox'
              checked={state.second}
              onChange={(e) => update('second', e.target.checked)}
            />已创建第二个同角色智能体
          </label>
          <button type='button' onClick={() => setPaused(!paused)}>
            {paused ? '播放动效' : '暂停动效'}
          </button>
        </div>
        <p className='preview-footnote'>
          每 2.8
          秒一轮，两个入口错开出现。勾选上方进度，对应入口恢复静止；系统开启“减少动态效果”时不播放。
        </p>
      </header>
      <div className='page-preview-label'>
        <span>原页面预览</span>
        <span>A · 明亮涟漪</span>
      </div>
      <main className='agent-preview'>
        <NavigationMemoryProvider scope='agent-motion-preview'>
          <Routes key={revision}>
            <Route path='/' element={<Navigate to='/agents/101' replace />} />
            <Route path='/agents/:agentId' element={<AgentViewPage />} />
            <Route
              path='/agents/:agentId/build'
              element={
                <div className='preview-destination'>
                  <h2>已进入提示词编辑入口</h2>
                  <p>
                    这个预览只演示主页动效。可以在上方勾选“已保存首版
                    prompt”，查看完成后的效果。
                  </p>
                  <Link to='/agents/101'>返回智能体主页</Link>
                </div>
              }
            />
            <Route
              path='*'
              element={<Link to='/agents/101'>返回智能体主页</Link>}
            />
          </Routes>
        </NavigationMemoryProvider>
      </main>
    </div>
  )
}

async function start() {
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <Preview />
    </BrowserRouter>,
  )
}
void start().catch(() => {
  document.getElementById('root')!.textContent = '预览加载失败，请刷新后重试。'
})
