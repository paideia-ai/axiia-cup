// 我的智能体（#73）：一级导航页——全部自有 agent 按场景分组，
// 每组显示双侧完成度徽章（#64）+ 参赛资格，逐 agent 快捷入口（EA / 编辑 / 出战）。
import { Bot, Eye, Hammer, Pencil, Swords } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { OsPanel } from '../components/os-panel'
import { Badge, Button, Card, EmptyState } from '../components/ui'
import { sideRoleShort } from '../mock/data'
import { SCENARIOS, store, useAppState } from '../mock/store'
import type { Agent, Scenario } from '../mock/types'

function AgentRow({ agent, scenario, onBattle }: { agent: Agent; scenario: Scenario; onBattle: () => void }) {
  const navigate = useNavigate()
  const latest = agent.versions.at(-1)
  const entry = agent.versions.find((v) => v.id === agent.tournamentVersionId)
  const wins = agent.versions.reduce((s, v) => s + v.record.wins, 0)
  const losses = agent.versions.reduce((s, v) => s + v.record.losses, 0)
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
      <Badge tone={agent.side === 'A' ? 'sideA' : 'sideB'}>{sideRoleShort(scenario, agent.side)}</Badge>
      <div className='min-w-0 flex-1'>
        <p className='m-0 text-sm font-semibold text-(--foreground)'>{agent.name}</p>
        <p className='m-0 text-xs text-(--foreground-muted)'>
          {agent.versions.length} 个版本{latest ? ` · 最新 v${latest.num}` : ''}
          {entry ? ` · ★参赛版本 v${entry.num}` : ' · 未标参赛版本'} · {wins} 胜 {losses} 负
        </p>
      </div>
      {/* 快捷入口（#73）：EA / 编辑 / 出战 */}
      <div className='flex items-center gap-1.5'>
        <Button size='sm' variant='ghost' onClick={() => navigate(`/agents/${agent.id}`)}>
          <Eye className='h-3.5 w-3.5' />
          查看
        </Button>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => navigate(`/scenarios/${agent.scenarioId}/build?agent=${agent.id}${latest ? `&version=${latest.id}` : ''}`)}
        >
          <Pencil className='h-3.5 w-3.5' />
          编辑
        </Button>
        <Button size='sm' variant='secondary' disabled={agent.versions.length === 0} onClick={onBattle}>
          <Swords className='h-3.5 w-3.5' />
          出战
        </Button>
      </div>
    </div>
  )
}

export function MyAgentsPage() {
  const { user, agents } = useAppState()
  const [osAgentId, setOsAgentId] = useState<string | null>(null)

  const groups = SCENARIOS.map((sc) => ({
    scenario: sc,
    mine: agents.filter((a) => a.scenarioId === sc.id && a.ownerId === user?.id),
  })).filter((g) => g.mine.length > 0)

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='page-eyebrow'>我的智能体</p>
          <h1 className='page-title'>我的智能体</h1>
          <p className='page-subtitle'>按场景分组；每个智能体执一侧，参赛需两侧各标一个参赛版本。</p>
        </div>
        <Link to='/scenarios' className='text-sm font-medium text-(--accent) hover:underline'>
          去场景选择，开新战场 →
        </Link>
      </header>

      {groups.length === 0 ? (
        <EmptyState
          title='还没有智能体'
          hint='去选一个场景，创建你的第一个单侧智能体。'
          action={
            <Link to='/scenarios'>
              <Button>
                <Hammer className='h-4 w-4' />
                去选场景
              </Button>
            </Link>
          }
        />
      ) : (
        groups.map(({ scenario, mine }) => {
          const bySide = store.myAgentsBySide(scenario.id)
          const readiness = store.entryReadiness(scenario.id)
          const missing = bySide.A.length === 0 ? 'A' : bySide.B.length === 0 ? 'B' : null
          return (
            <Card key={scenario.id} className='flex flex-col gap-3'>
              <div className='flex flex-wrap items-center gap-2.5'>
                <Bot className='h-4 w-4 text-(--foreground-subtle)' />
                <Link to={`/scenarios/${scenario.id}`} className='text-base font-extrabold text-(--foreground) hover:underline'>
                  {scenario.name}
                </Link>
                {/* 双侧完成度徽章（#64） */}
                {(['A', 'B'] as const).map((side) => (
                  <Badge key={side} tone={bySide[side].length > 0 ? 'success' : 'neutral'}>
                    {sideRoleShort(scenario, side)} {bySide[side].length > 0 ? '✓' : '✗'}
                  </Badge>
                ))}
                <span className='ml-auto text-xs text-(--foreground-muted)'>
                  {readiness.eligible ? '已具备参赛资格' : missing !== null ? `缺${sideRoleShort(scenario, missing)}——不能参赛` : '还差参赛版本标记'}
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                {mine.map((a) => (
                  <AgentRow key={a.id} agent={a} scenario={scenario} onBattle={() => setOsAgentId(a.id)} />
                ))}
              </div>
              {missing !== null && (
                <Link
                  to={`/scenarios/${scenario.id}/build?side=${missing}`}
                  className='inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-(--accent)/50 px-3 py-1.5 text-xs font-semibold text-(--accent) transition hover:bg-(--accent)/10'
                >
                  <Hammer className='h-3.5 w-3.5' />
                  去创建对侧（{sideRoleShort(scenario, missing)}）
                </Link>
              )}
            </Card>
          )
        })
      )}

      {osAgentId !== null && (
        <OsPanel open onClose={() => setOsAgentId(null)} agentId={osAgentId} />
      )}
    </div>
  )
}
