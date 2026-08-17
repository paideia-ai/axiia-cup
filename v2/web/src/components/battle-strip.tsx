import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { matches } from '../api/client'
import type { MatchSummary } from '../api/types'
import { cn } from '../lib/cn'

// 对战条（#72，mock V29/V35）：只在派发处路由出现的横条，装着进行中与
// 「刚完成」（15 分钟内完局）的对局小卡。空态自动隐藏；可折叠（chevron，
// 状态存 sessionStorage）；单行横向滚动，保持廉价不抢戏。
// 数据靠 30 秒轮询 matches.list()——标签页隐藏时暂停（visibilitychange），
// 回到前台立即补一拍。老服务器（无 createdAt/finishedAt）下整条不渲染。

// #72 路由白名单：DA 场景介绍 / EA·构建器（/agents/*）/ 我的智能体。
const DISPATCH_ROUTES = [
  /^\/scenarios\/[^/]+$/,
  /^\/agents\/.+$/,
  /^\/my-agents$/,
]

const POLL_MS = 30_000
// 「刚完成」的存活窗口（mock V35）：过期自动退场，空态隐藏才真正可达。
const RECENT_DONE_MS = 15 * 60_000
const COLLAPSE_KEY = 'axiia-battle-strip-collapsed'

function loadCollapsed(): boolean {
  try {
    return sessionStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function BattleStrip() {
  const location = useLocation()
  const whitelisted = DISPATCH_ROUTES.some((route) =>
    route.test(location.pathname)
  )
  // null = 未加载/加载失败：两种情况都整条不渲染（降级为不存在）。
  const [rows, setRows] = useState<MatchSummary[] | null>(null)
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  // 轮询只更新数据；「刚完成」的过期靠每次轮询后的重渲染自然收敛（粒度
  // 30 秒，对 15 分钟窗口足够）。
  useEffect(() => {
    if (!whitelisted) return
    let live = true
    const load = () => {
      if (document.hidden) return
      void matches
        .list()
        .then((response) => {
          if (live) setRows(response.matches)
        })
        .catch(() => {
          if (live) setRows(null)
        })
    }
    load()
    const timer = setInterval(load, POLL_MS)
    const onVisibility = () => {
      if (!document.hidden) load()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      live = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [whitelisted])

  if (!whitelisted || rows == null) return null

  // 老服务器守卫：createdAt/finishedAt 缺席时不渲染任何东西——没有时间
  // 字段就没有「刚完成」语义，进行中的陈年对局也不该复活成横条。
  const now = Date.now()
  // #72 的横条装的是**你已发起的**对局。dev 上 AXIIA_OPEN_BATTLES=1 让
  // /v1/matches 成为全站可观战的列表（返回别人的对局，靠 initiatorIsMe 区分），
  // 不过滤就会把陌生人的对局塞进你的横条——审计 U05-C09b 实证过：0 派发的
  // 新账号照样看到别人进行中的卡。
  // 这里对归属**失败关闭**：只有明确 initiatorIsMe === true 才进横条。老服务器
  // 不返回该字段时整条退场，与上面「缺时间字段就不渲染」的降级取向一致——
  // 宁可少显示，也不泄漏别人的对局。
  const mine = rows.filter((match) => match.initiatorIsMe === true)
  const inFlight = mine.filter((match) =>
    match.dispatched && !match.finished && match.createdAt != null
  )
  const recentDone = mine
    .filter((match) =>
      match.finished &&
      match.finishedAt != null &&
      now - match.finishedAt * 1000 < RECENT_DONE_MS
    )
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .slice(0, 3)
  const cards = [...inFlight, ...recentDone]
  if (cards.length === 0) return null

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value
      try {
        sessionStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // 存储失败只丢折叠记忆，不碍事。
      }
      return next
    })
  }

  return (
    <section aria-label='进行中的对战' className='space-y-2'>
      <button
        type='button'
        onClick={toggle}
        className='inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase transition hover:text-(--foreground)'
      >
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            collapsed && '-rotate-90',
          )}
        />
        进行中的对战（{inFlight.length} 进行 · {recentDone.length} 刚完成）
      </button>
      {collapsed ? null : (
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {cards.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className='inline-flex shrink-0 items-center gap-2 rounded-full border border-(--border-soft) bg-white/2 px-3 py-1.5 text-xs text-(--foreground-subtle) transition hover:border-(--border) hover:text-(--foreground)'
            >
              <span className='font-medium'>{match.scenarioTitle}</span>
              {match.challengeLeg != null
                ? (
                  <span className='text-(--accent)'>
                    约战{match.challengeLeg === 1 ? '①' : '②'}
                  </span>
                )
                : null}
              {match.finished
                ? <span className='text-(--success)'>刚完成</span>
                : (
                  <span className='inline-flex items-center gap-1 text-(--info)'>
                    <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-(--info)' />
                    进行中
                  </span>
                )}
              <span className='text-(--foreground-muted)'>#{match.id}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
