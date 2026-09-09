import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { Button } from '../components/ui/button'
import { PROMPT_UNIT_LIMIT, promptLength } from '../lib/prompt-length'
import '../styles.css'
import './interaction.css'
import './visual-polish.css'
import { DemoBuilder } from './builder'
import { modelFor, roleFor } from './builder-settings'
import { AgentHome } from './home'
import { EmptyAgentHome } from './empty-agent-home'
import { Inventory } from './inventory'
import { CreateAgentPanel } from './create-agent-panel'
import {
  type Agent,
  fillExampleStrategies,
  scenarios,
  seedAgents,
  storageKey,
} from './model'
import { DemoShell } from './shell'
import { DemoScrollRestoration } from './scroll-restoration'
import { DemoScenarioDetail } from './scenario-detail'

function loadAgents(): Agent[] {
  try {
    return fillExampleStrategies(
      JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? seedAgents(),
    )
  } catch {
    return seedAgents()
  }
}
function App() {
  const [agents, setAgents] = useState<Agent[]>(loadAgents)
  const [form, setForm] = useState<
    {
      kind: 'create'
      scenario: string
      side: number
      anchor: HTMLElement | null
    } | null
  >(null)
  const [name, setName] = useState('')
  const [storageError, setStorageError] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  function openCreate(scenario: string, side: number, anchor?: HTMLElement) {
    setName('')
    setForm({
      kind: 'create',
      scenario,
      side,
      anchor: anchor ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null),
    })
  }
  const creationBlocked = form?.kind === 'create' &&
    agents.some((agent) =>
      agent.scenario === form.scenario && agent.side === form.side
    ) &&
    !agents.some((agent) =>
      agent.scenario === form.scenario && agent.side !== form.side &&
      agent.versions.length > 0
    )
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(agents))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [agents])
  function update(agent: Agent) {
    const old = agents.find((other) => other.id === agent.id)
    const marked = agent.versions.find((version) =>
      version.isEntry &&
      !old?.versions.find((previous) => previous.id === version.id)?.isEntry
    )
    setAgents((current) =>
      current.map((other) =>
        other.id === agent.id
          ? agent
          : marked && other.scenario === agent.scenario &&
              other.side === agent.side
          ? {
            ...other,
            entrySelectionUnknown: false,
            versions: other.versions.map((version) => ({
              ...version,
              isEntry: false,
            })),
          }
          : other
      )
    )
  }
  function save(agent: Agent) {
    if (!agent.draft.trim() || promptLength(agent.draft) > PROMPT_UNIT_LIMIT) {
      return
    }
    const version = {
      id: Math.max(
        1000,
        ...agents.flatMap((other) => other.versions.map((item) => item.id)),
      ) + 1,
      agentID: agent.id,
      prompt: agent.draft.trim(),
      method: agent.method ?? 'raw',
      modelID: modelFor(agent),
      note: agent.versionNote?.trim() || undefined,
      createdAt: Math.floor(Date.now() / 1000),
      isEntry: false,
      snapshotSeq: agent.versions.length + 1,
      ordinal: agent.versions.length + 1,
      options: roleFor(agent)
        ? JSON.stringify({ role: roleFor(agent)!.key })
        : null,
    }
    update({
      ...agent,
      versionNote: '',
      versions: [...agent.versions, version],
    })
    navigate(`/agents/${agent.id}?saved=${version.id}`)
  }
  function submit() {
    if (!form || creationBlocked) return
    const id = Math.max(100, ...agents.map((agent) => agent.id)) + 1
    setAgents((
      current,
    ) => [...current, {
      id,
      scenario: form.scenario,
      side: form.side,
      name: name.trim(),
      draft: '',
      versions: [],
    }])
    navigate(`/agents/${id}`)
    setForm(null)
  }
  return (
    <DemoShell>
      <DemoScrollRestoration />
      {storageError && (
        <p role='alert' className='text-sm text-(--warning)'>
          浏览器存储不可用，本次修改仅在当前页面保留。
        </p>
      )}
      <Routes>
        <Route
          path='/scenarios/:scenarioId'
          element={
            <DemoScenarioDetail
              agents={agents}
              onCreate={openCreate}
            />
          }
        />
        <Route
          path='/my-agents'
          element={
            <Inventory
              agents={agents}
              onCreate={openCreate}
            />
          }
        />
        <Route
          path='/agents/empty/:scenarioId/:side'
          element={
            <EmptyAgentHome
              agents={agents}
              onCreate={openCreate}
            />
          }
        />
        <Route
          path='/agents/:id'
          element={
            <AgentRoute
              agents={agents}
              render={(agent) => (
                <>
                  {new URLSearchParams(location.search).has('saved') && (
                    <p
                      role='status'
                      className='rounded-md border border-(--border-soft) px-3 py-2 text-sm text-(--success)'
                    >
                      策略已保存。可在下方设置参赛版本或出战。
                    </p>
                  )}
                  <AgentHome
                    key={agent.id}
                    agent={agent}
                    agents={agents}
                    update={update}
                    onCreate={(anchor) =>
                      openCreate(agent.scenario, agent.side, anchor)}
                    remove={() => {
                      const siblings = agents.filter((other) =>
                        other.scenario === agent.scenario &&
                        other.side === agent.side
                      )
                      const index = siblings.findIndex((other) =>
                        other.id === agent.id
                      )
                      const next = siblings[index + 1] ?? siblings[index - 1]
                      setAgents((current) =>
                        current.filter((other) => other.id !== agent.id)
                      )
                      navigate(
                        next
                          ? `/agents/${next.id}`
                          : `/agents/empty/${agent.scenario}/${agent.side}`,
                        { replace: true },
                      )
                    }}
                  />
                </>
              )}
            />
          }
        />
        <Route
          path='/agents/:id/build'
          element={
            <AgentRoute
              agents={agents}
              render={(agent) => (
                <DemoBuilder
                  key={agent.id}
                  agent={agent}
                  update={update}
                  save={() => save(agent)}
                />
              )}
            />
          }
        />
        <Route path='*' element={<Navigate to='/my-agents' replace />} />
      </Routes>
      {form && (
        <CreateAgentPanel
          key={`${form.scenario}-${form.side}`}
          role={scenarios.find((scenario) => scenario.id === form.scenario)!
            .roles[form.side]}
          anchor={form.anchor}
          name={name}
          onNameChange={setName}
          onSubmit={submit}
          onClose={() => setForm(null)}
          blocked={creationBlocked}
        >
          {creationBlocked && form.kind === 'create' && (
            <div className='space-y-3 rounded-md border border-(--border) p-3'>
              <p className='text-sm text-(--warning)'>
                先为对侧保存一个策略，再创建更多同侧智能体。
              </p>
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={() => {
                  const opposite = agents.find((agent) =>
                    agent.scenario === form.scenario &&
                    agent.side !== form.side
                  )
                  if (opposite) {
                    setForm(null)
                    navigate(`/agents/${opposite.id}`)
                  } else {
                    setForm({ ...form, side: 1 - form.side })
                  }
                }}
              >
                去完善对侧智能体
              </Button>
            </div>
          )}
        </CreateAgentPanel>
      )}
    </DemoShell>
  )
}
function AgentRoute(
  { agents, render }: {
    agents: Agent[]
    render: (agent: Agent) => React.ReactNode
  },
) {
  const { id } = useParams()
  const agent = agents.find((item) => item.id === Number(id))
  if (!agent) {
    return (
      <div className='space-y-4'>
        <h1 className='text-2xl font-black'>智能体不存在</h1>
        <Link to='/my-agents' className='text-(--accent)'>返回我的智能体</Link>
      </div>
    )
  }
  return render(agent)
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
