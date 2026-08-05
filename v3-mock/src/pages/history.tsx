// L — 对战历史（B7）：完整历史页；行点开 → 战报。
// （「进行中的对战」条本体在核心 A1/A5，由 AppShell 承载。）
import { useNavigate } from 'react-router-dom'

import { Badge, Button, Card, EmptyState } from '../components/ui'
import { SCENARIOS, useAppState } from '../mock/store'
import type { Match, MatchKind, Side } from '../mock/types'

function scenarioName(id: string): string {
  return SCENARIOS.find((s) => s.id === id)?.name ?? id
}

const KIND_META: Record<MatchKind, { label: string; tone: 'neutral' | 'info' | 'accent' | 'warning' }> = {
  pve: { label: 'PVE', tone: 'neutral' },
  hotseat: { label: '自打', tone: 'info' },
  'pvp-friendly': { label: '友谊赛', tone: 'info' },
  'pvp-ranked': { label: '天梯', tone: 'accent' },
  tournament: { label: '赛事', tone: 'warning' },
}

function mySide(match: Match, userId: string): Side | null {
  if (match.participants.A.ownerId === userId) return 'A'
  if (match.participants.B.ownerId === userId) return 'B'
  return null
}

function StatusBadge({ match, userId }: { match: Match; userId: string }) {
  if (match.status === 'queued') return <Badge tone='neutral'>排队中</Badge>
  if (match.status === 'running') return <Badge tone='info'>进行中</Badge>
  const winner = match.result?.winner
  // hotseat（#61）：两侧都是你的 agent——胜负按侧报
  if (match.kind === 'hotseat') {
    if (!winner) return <Badge tone='neutral'>完成</Badge>
    return winner === 'draw' ? <Badge tone='warning'>完成 · 平局</Badge> : <Badge tone='info'>完成 · {winner} 侧胜</Badge>
  }
  const side = mySide(match, userId)
  if (!side || !winner) return <Badge tone='neutral'>完成</Badge>
  if (winner === 'draw') return <Badge tone='warning'>完成 · 平局</Badge>
  return winner === side ? <Badge tone='success'>完成 · 胜</Badge> : <Badge tone='neutral'>完成 · 负</Badge>
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { user, matches } = useAppState()
  const userId = user?.id ?? ''

  const mine = matches
    .filter(
      (m) =>
        m.initiatorId === userId ||
        m.participants.A.ownerId === userId ||
        m.participants.B.ownerId === userId,
    )
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <p className='page-eyebrow'>L · 对战历史</p>
        <h1 className='page-title'>对战历史</h1>
        <p className='page-subtitle'>你发起或参与的全部对局，点开任意一行查看战报。</p>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title='还没有对局'
          hint='去选一个场景、构建你的 agent，打响第一场。'
          action={<Button onClick={() => navigate('/scenarios')}>去选场景</Button>}
        />
      ) : (
        <Card className='p-0'>
          <ul className='flex flex-col divide-y divide-(--border-soft)'>
            {mine.map((m) => (
              <li key={m.id}>
                <button
                  type='button'
                  onClick={() => navigate(`/matches/${m.id}`)}
                  className='flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-semibold text-(--foreground)'>{scenarioName(m.scenarioId)}</span>
                      <Badge tone={KIND_META[m.kind].tone}>{KIND_META[m.kind].label}</Badge>
                    </div>
                    <p className='mt-1 truncate text-sm text-(--foreground-subtle)'>
                      <span className='text-(--side-a)'>{m.participants.A.displayName}</span>
                      <span className='mx-2 text-(--foreground-muted)'>vs</span>
                      <span className='text-(--side-b)'>{m.participants.B.displayName}</span>
                    </p>
                  </div>
                  <StatusBadge match={m} userId={userId} />
                  <span className='text-[11px] text-(--foreground-muted)'>
                    {new Date(m.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
