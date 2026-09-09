import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ScenarioSummary } from '../api/types'
import { ScenarioDetailContent } from '../pages/scenario-detail'
import { type Agent, scenarios } from './model'

export function DemoScenarioDetail({ agents, onCreate }: {
  agents: Agent[]
  onCreate: (scenario: string, side: number) => void
}) {
  const { scenarioId } = useParams()
  const navigate = useNavigate()
  const scenario = scenarios.find((item) => item.id === scenarioId)
  if (!scenario) {
    return (
      <div className='space-y-4'>
        <h1 className='text-2xl font-black'>场景不存在</h1>
        <Link to='/my-agents' className='text-(--accent)'>返回我的智能体</Link>
      </div>
    )
  }
  const summary: ScenarioSummary = {
    id: scenario.id,
    title: scenario.title,
    subject: scenario.subject,
    sideAName: scenario.roles[0],
    sideBName: scenario.roles[1],
    sideALabel: scenario.descriptions[0],
    sideBLabel: scenario.descriptions[1],
    // All five modules supply the original formatLabel used by this view.
    turnCount: 0,
    gateUnlocked: false,
  }
  return (
    <div className='mx-auto w-full max-w-6xl space-y-6'>
      <Link
        to='/my-agents'
        className='block text-sm text-(--foreground-subtle) hover:text-(--foreground)'
      >
        ← 我的智能体
      </Link>
      <ScenarioDetailContent
        summary={summary}
        showLiveProgress={false}
        mineOf={(side) =>
          agents.filter((agent) =>
            agent.scenario === scenario.id &&
            agent.side === (side === 'a' ? 0 : 1)
          ).map((agent) => ({ agentID: agent.id, name: agent.name }))}
        onEnter={(side, target) => {
          const which = side === 'a' ? 0 : 1
          const agent = agents.find((item) =>
            item.scenario === scenario.id && item.side === which
          )
          if (agent) {
            navigate(
              `/agents/${agent.id}${target === 'build' ? '/build' : ''}`,
            )
          } else onCreate(scenario.id, which)
          return Promise.resolve()
        }}
        onViewAll={() => navigate('/my-agents')}
        onNew={(side) => onCreate(scenario.id, side === 'a' ? 0 : 1)}
      />
    </div>
  )
}
