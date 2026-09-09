import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NewAgentButton } from './new-agent-button'
import { Card, CardContent } from '../components/ui/card'
import { type Agent, isEntryAgent, nameOf, scenarios } from './model'

export function Inventory(
  { agents, onCreate }: {
    agents: Agent[]
    onCreate: (scenario: string, side: number, anchor: HTMLElement) => void
  },
) {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight'>我的智能体</h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          选择一个智能体，继续你的策略。
        </p>
      </div>
      <div className='space-y-6'>
        {scenarios.map((scenario) => {
          const sides = scenario.roles.map((name, side) => {
            const matching = agents.filter((agent) =>
              agent.scenario === scenario.id && agent.side === side
            )
            return {
              name,
              built: matching.length > 0,
              done: matching.some(isEntryAgent),
            }
          })
          const entryReady = sides.every((side) => side.done)
          const missing = sides.filter((side) => !side.done).map((side) =>
            `${side.name}（${side.built ? '未标参赛版本' : '未创建'}）`
          )
          return (
            <Card key={scenario.id} className='demo-scenario-card'>
              <CardContent className='p-4 sm:p-6'>
                <div className='demo-scenario-heading'>
                  <h2 className='text-base font-semibold sm:text-lg'>
                    <Link
                      to={`/scenarios/${scenario.id}`}
                      className='cursor-pointer text-(--foreground) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-(--accent)'
                    >
                      {scenario.title}
                    </Link>
                  </h2>
                  <span className='text-xs text-(--foreground-muted)'>
                    {scenario.subject}
                  </span>
                  <div className='demo-role-statuses'>
                    {sides.map(({ name, built, done }) => (
                      <span key={name} className='demo-role-status'>
                        {name} {done
                          ? <span className='text-(--success)'>✓</span>
                          : built
                          ? '未标参赛'
                          : '未建'}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`demo-entry-status text-xs ${
                      entryReady
                        ? 'text-(--success)'
                        : 'text-(--foreground-muted)'
                    }`}
                  >
                    {entryReady
                      ? '✓ 参赛资格已就绪'
                      : `参赛资格未就绪：还差 ${missing.join('、')}`}
                  </span>
                </div>
                {scenario.roles.map((role, side) => (
                  <div key={role} className='demo-role-group'>
                    <div className='demo-role-heading flex items-center justify-between gap-3'>
                      <p className='min-w-0 text-xs leading-5 text-(--foreground-subtle)'>
                        {scenario.descriptions[side]}
                      </p>
                      <NewAgentButton
                        role={role}
                        onClick={(anchor) =>
                          onCreate(scenario.id, side, anchor)}
                      />
                    </div>
                    {agents.filter((agent) =>
                      agent.scenario === scenario.id && agent.side === side
                    ).map((agent) => {
                      const selected = isEntryAgent(agent)
                      return (
                        <Link
                          key={agent.id}
                          data-testid='agent-row'
                          data-entry={selected ? 'true' : undefined}
                          to={`/agents/${agent.id}`}
                          title={selected ? '当前参赛智能体' : undefined}
                          className='demo-agent-row group flex min-h-11 items-center gap-3 rounded-md border px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-(--accent)'
                        >
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium'>
                              {nameOf(agent)}
                              {selected && (
                                <span className='sr-only'>
                                  （当前参赛智能体）
                                </span>
                              )}
                            </p>
                          </div>
                          <ChevronRight
                            aria-hidden='true'
                            className='h-4 w-4 shrink-0 text-(--foreground-subtle) transition group-hover:translate-x-0.5'
                          />
                        </Link>
                      )
                    })}
                    {!agents.some((agent) =>
                      agent.scenario === scenario.id && agent.side === side
                    ) && (
                      <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-3 text-sm text-(--foreground-subtle)'>
                        还没有{role}智能体
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
