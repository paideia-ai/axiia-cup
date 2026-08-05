// 「进行中的对战」条（核心组件，A1/A5）：装着你已发起对局卡的横条，可留可走。
// mock 简化：不做侧抽屉观战，点卡片直达战报（FA 覆盖观战）。
// #72：只在有派发功能的页面渲染（DA/构建器/EA·OS 上下文/我的智能体），不再全局；
//      空则自动隐藏；折叠开关状态持久（localStorage）。
import { ChevronDown, History, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { cn } from '../lib/cn'
import { SCENARIOS, useAppState } from '../mock/store'
import type { Match, Side } from '../mock/types'
import { Badge } from './ui'

const COLLAPSE_KEY = 'axiia-v3-mock-ongoing-collapsed'
const DISMISS_KEY = 'axiia-v3-mock-ongoing-dismissed'
/** 「刚完成」卡的存活窗口（评审补 R1-1）：过期自动退场，让空态隐藏真正可达 */
const RECENT_DONE_MS = 15 * 60_000

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

/** #72：派发处可见（A1/A5 原意）——取代 v3.3 决定 S1 的「全局渲染」 */
const DISPATCH_ROUTES = [
  /^\/scenarios\/[^/]+$/, // DA 场景介绍
  /^\/scenarios\/[^/]+\/build$/, // E 构建器
  /^\/agents\/[^/]+$/, // EA（OS 面板上下文）
  /^\/my-agents$/, // 我的智能体（含出战入口，#73）
  /^\/express/, // 首战快速通道
]

export function OngoingBar() {
  const { user, matches } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed)

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = [...prev.filter((x) => x !== id), id].slice(-50)
      try {
        localStorage.setItem(DISMISS_KEY, JSON.stringify(next))
      } catch {
        // 忽略存储失败
      }
      return next
    })
  }

  if (!user) return null
  if (!DISPATCH_ROUTES.some((r) => r.test(location.pathname))) return null

  const mine = matches.filter((m) => m.initiatorId === user.id)
  const active = mine.filter((m) => m.status !== 'done')
  // 刚完成＝15 分钟内完局且未被清除（评审补 R1-1）；旧完局自然退场，条可以真正变空
  const recentDone = mine
    .filter((m) =>
      m.status === 'done' &&
      !dismissed.includes(m.id) &&
      m.finishedAt !== null &&
      m.finishedAt !== undefined &&
      Date.now() - Date.parse(m.finishedAt) < RECENT_DONE_MS,
    )
    .toSorted((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
    .slice(0, 3)
  const cards = [...active, ...recentDone]

  // 空则自动隐藏（#72）
  if (cards.length === 0) return null

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // 忽略存储失败
      }
      return next
    })
  }

  return (
    <section aria-label='进行中的对战' className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={toggle}
          className='inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted) transition hover:text-(--foreground)'
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', collapsed && '-rotate-90')} />
          进行中的对战（{active.length} 进行 · {recentDone.length} 刚完成）
        </button>
        <Link
          to='/history'
          className='ml-auto inline-flex items-center gap-1 text-[11px] text-(--foreground-muted) transition hover:text-(--foreground)'
        >
          <History className='h-3 w-3' />
          全部历史
        </Link>
      </div>
      {!collapsed && (
        <div className='flex gap-3 overflow-x-auto pb-1'>
          {cards.map((m) => (
            <div key={m.id} className='relative shrink-0'>
              <MatchCard match={m} userId={user.id} onOpen={() => navigate(`/matches/${m.id}`)} />
              {m.status === 'done' && (
                <button
                  type='button'
                  aria-label='从对战条清除'
                  title='从对战条清除（历史页仍可见）'
                  onClick={() => dismiss(m.id)}
                  className='absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-(--border) bg-(--background) text-(--foreground-muted) transition hover:text-(--foreground)'
                >
                  <X className='h-3 w-3' />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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
        <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>
          {scenario?.name ?? match.scenarioId}
          {/* #66：双侧成对约战的两场标 ①/②，让这一对可见 */}
          {match.challengeLeg !== null && <Badge tone='accent'>约战{match.challengeLeg === 1 ? '①' : '②'}</Badge>}
        </span>
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
