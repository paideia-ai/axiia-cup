// 「进行中的对战」条（核心组件，A1/A5）：装着你已发起对局卡的横条，可留可走。
// mock 简化：不做侧抽屉观战，点卡片直达战报（FA 覆盖观战）。
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { cn } from '../lib/cn'
import { SCENARIOS, useAppState } from '../mock/store'
import type { Match, Side } from '../mock/types'
import { Badge } from './ui'

export function OngoingBar() {
  const { user, matches } = useAppState()
  const navigate = useNavigate()

  if (!user) return null

  const mine = matches.filter((m) => m.initiatorId === user.id)
  const active = mine.filter((m) => m.status !== 'done')
  const recentDone = mine
    .filter((m) => m.status === 'done')
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
  const cards = [...active, ...recentDone]

  if (cards.length === 0) return null

  return (
    <section aria-label='进行中的对战'>
      <div className='flex gap-3 overflow-x-auto pb-1'>
        {cards.map((m) => (
          <MatchCard key={m.id} match={m} userId={user.id} onOpen={() => navigate(`/matches/${m.id}`)} />
        ))}
      </div>
    </section>
  )
}

function MatchCard({ match, userId, onOpen }: { match: Match; userId: string; onOpen: () => void }) {
  const scenario = SCENARIOS.find((s) => s.id === match.scenarioId)
  const mySide: Side | null =
    match.participants.A.ownerId === userId ? 'A' : match.participants.B.ownerId === userId ? 'B' : null
  const mine = mySide ? match.participants[mySide] : match.participants.A
  const opp = mySide === 'B' ? match.participants.A : match.participants.B

  let status: ReactNode
  if (match.status === 'queued') {
    status = <Badge tone='neutral'>排队中</Badge>
  } else if (match.status === 'running') {
    status = (
      <Badge tone='info'>
        <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400' />
        进行中 {match.transcript.length}/{match.totalTurns}
      </Badge>
    )
  } else {
    const winner = match.result?.winner
    // hotseat（#61）：两侧都是你——按侧报胜负
    const isHotseat = match.kind === 'hotseat'
    const hint = winner === 'draw' ? '平局' : isHotseat ? `${winner} 侧胜` : winner === mySide ? '你赢了' : '你输了'
    status = <Badge tone={!isHotseat && winner === mySide ? 'success' : 'neutral'}>已完成 · {hint}</Badge>
  }

  return (
    <button
      type='button'
      onClick={onOpen}
      className={cn(
        'flex min-w-60 shrink-0 flex-col items-start gap-1.5 rounded-2xl border border-(--border-soft) bg-white/[0.02] px-4 py-3 text-left transition',
        'hover:border-(--border) hover:bg-white/[0.04]',
      )}
    >
      <div className='flex w-full items-center justify-between gap-3'>
        <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>{scenario?.name ?? match.scenarioId}</span>
        {status}
      </div>
      <span className='max-w-56 truncate text-sm font-medium text-(--foreground)'>
        {mine.displayName}
        <span className='mx-1 text-(--foreground-muted)'>vs</span>
        {opp.displayName}
      </span>
    </button>
  )
}
