import { Link, Navigate, useParams } from 'react-router-dom'
import { NewAgentButton } from './new-agent-button'
import { type Agent, scenarios } from './model'

export function EmptyAgentHome({ agents, onCreate }: {
  agents: Agent[]
  onCreate: (scenario: string, side: number, anchor: HTMLElement) => void
}) {
  const { scenarioId, side: sideParam } = useParams()
  const scenario = scenarios.find((item) => item.id === scenarioId)
  const side = Number(sideParam)
  if (!scenario || !['0', '1'].includes(sideParam ?? '')) {
    return <Navigate to='/my-agents' replace />
  }
  const existing = agents.find((agent) =>
    agent.scenario === scenario.id && agent.side === side
  )
  if (existing) return <Navigate to={`/agents/${existing.id}`} replace />
  const role = scenario.roles[side]
  return (
    <div className='space-y-6'>
      <Link
        to='/my-agents'
        className='block text-sm text-(--foreground-subtle) hover:text-(--foreground)'
      >
        ← 我的智能体
      </Link>
      <div>
        <p className='mb-2 text-xs text-(--foreground-subtle)'>智能体主页</p>
        <h1 className='text-2xl font-black tracking-tight'>{role}</h1>
        <p className='mt-2 text-sm text-(--foreground-subtle)'>
          {scenario.title}
        </p>
      </div>
      <nav aria-label='同角色智能体' className='flex items-center gap-2'>
        <NewAgentButton
          role={role}
          onClick={(anchor) => onCreate(scenario.id, side, anchor)}
        />
      </nav>
      <div className='rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center text-sm text-(--foreground-subtle)'>
        还没有{role}智能体
      </div>
    </div>
  )
}
