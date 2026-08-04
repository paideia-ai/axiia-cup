// G — 锦标赛 / 排名中心（B4）：GT 锦标赛 + GP 天梯双 tab（无独立 J 页）。
import { ArrowRight, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge, Card, EmptyState, Tabs } from '../components/ui'
import { SCENARIOS, useAppState } from '../mock/store'
import type { Tournament } from '../mock/types'

function scenarioName(id: string): string {
  return SCENARIOS.find((s) => s.id === id)?.name ?? id
}

const TOURNAMENT_STATUS: Record<Tournament['status'], { label: string; tone: 'info' | 'success' | 'neutral' }> = {
  upcoming: { label: '未开始', tone: 'info' },
  running: { label: '进行中', tone: 'success' },
  finished: { label: '已结束', tone: 'neutral' },
}

function TournamentTab() {
  const { tournaments } = useAppState()
  const [selectedId, setSelectedId] = useState(tournaments[0]?.id ?? '')
  const tournament = tournaments.find((t) => t.id === selectedId) ?? tournaments[0]

  if (!tournament) {
    return <EmptyState title='暂无锦标赛' hint='主办方开赛后，赛程与按轮时间线会出现在这里。' />
  }
  const status = TOURNAMENT_STATUS[tournament.status]

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <select
          className='app-input max-w-xs'
          value={tournament.id}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone='neutral'>{scenarioName(tournament.scenarioId)}</Badge>
      </div>

      {/* 按轮时间线 */}
      <div className='flex flex-col gap-4'>
        {tournament.rounds.map((round) => (
          <Card key={round.name}>
            <p className='panel-label'>{round.name}</p>
            <ul className='flex flex-col divide-y divide-(--border-soft)'>
              {round.matches.map((m, i) => (
                <li key={`${m.matchId}-${i}`} className='flex flex-wrap items-center gap-3 py-3'>
                  <span className='min-w-0 flex-1 text-sm font-semibold text-(--foreground)'>
                    <span className='text-(--side-a)'>{m.playerA}</span>
                    <span className='mx-2 text-(--foreground-muted)'>vs</span>
                    <span className='text-(--side-b)'>{m.playerB}</span>
                  </span>
                  {m.winner ? (
                    <Badge tone='success'>
                      <Trophy className='h-3 w-3' />
                      {m.winner} 胜
                    </Badge>
                  ) : (
                    <Badge tone='info'>待定</Badge>
                  )}
                  <Link
                    to={`/matches/${m.matchId}`}
                    className='inline-flex items-center gap-1 text-sm font-semibold text-(--accent) hover:text-(--accent-hover)'
                  >
                    查看战报
                    <ArrowRight className='h-3.5 w-3.5' />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LadderTab() {
  const { ladder } = useAppState()
  return (
    <div className='flex flex-col gap-4'>
      {/* (#32) 天梯回报：高分 → 锦标赛直邀 / 跳过海选 */}
      <Card className='border-(--accent)/30 bg-(--accent)/5'>
        <p className='text-sm leading-relaxed text-(--foreground-subtle)'>
          天梯分够高 → 后续锦标赛<span className='font-semibold text-(--foreground)'>直邀 / 跳过海选</span>
          （任意高分 agent 即可获得资格，不必同一 agent 参赛）。
        </p>
      </Card>
      {ladder.length === 0 ? (
        <EmptyState title='天梯暂无数据' hint='参加计分 PVP（自动匹配）后你会出现在这里。' />
      ) : (
        <Card className='overflow-x-auto p-0'>
          <table className='w-full min-w-[560px] text-sm'>
            <thead>
              <tr className='border-b border-(--border-soft) text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>
                <th className='px-5 py-3'>排名</th>
                <th className='px-5 py-3'>玩家</th>
                <th className='px-5 py-3'>场景</th>
                <th className='px-5 py-3'>天梯分</th>
                <th className='px-5 py-3'>智能体</th>
              </tr>
            </thead>
            <tbody>
              {ladder.map((row) => (
                <tr key={`${row.player}-${row.scenarioId}`} className='border-b border-(--border-soft) last:border-b-0'>
                  <td className='px-5 py-3 text-lg font-black text-(--foreground-muted)'>{row.rank}</td>
                  <td className='px-5 py-3 font-semibold text-(--foreground)'>{row.player}</td>
                  <td className='px-5 py-3 text-(--foreground-subtle)'>{scenarioName(row.scenarioId)}</td>
                  <td className='px-5 py-3 font-bold text-(--accent)'>{row.score}</td>
                  <td className='px-5 py-3 text-(--foreground-subtle)'>{row.agentDisplay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {/* 天梯完整设计待评审（W11）；方向已进规格 A6 */}
      <p className='text-xs text-(--foreground-muted)'>天梯完整设计仍在评审中（W11）——当前展示为方向性数据。</p>
    </div>
  )
}

export function RankingsPage() {
  const [tab, setTab] = useState('gt')
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <p className='page-eyebrow'>G · 排名中心</p>
        <h1 className='page-title'>锦标赛与天梯</h1>
      </div>
      <Tabs
        className='self-start'
        value={tab}
        onChange={setTab}
        items={[
          { key: 'gt', label: 'GT 锦标赛' },
          { key: 'gp', label: 'GP 天梯' },
        ]}
      />
      {tab === 'gt' ? <TournamentTab /> : <LadderTab />}
    </div>
  )
}
