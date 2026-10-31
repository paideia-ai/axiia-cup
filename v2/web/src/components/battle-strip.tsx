import { navigationCache } from '../lib/navigation-cache'
import { catalogQuery } from '../lib/navigation-queries'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { matches } from '../api/client'
import type { MatchSummary } from '../api/types'
import { useSoundMatchFeed } from '../context/sound'
import { cn } from '../lib/cn'
import type { RoleNames } from '../lib/outcome'
import { outcomeCopy, scenarioRoles } from '../lib/outcome'
import { tm } from '../testmode/mark'

// 对战条：登录后的日常页面共用，装着进行中与
// 「刚完成」（15 分钟内完局）的对局小卡。空态自动隐藏；可折叠（chevron，
// 状态存 sessionStorage）。960 CSS px 起在左侧纵向排列，窄屏单行横向滚动。
// 数据靠 30 秒轮询 matches.list()——标签页隐藏时暂停（visibilitychange），
// 回到前台立即补一拍。老服务器（无 createdAt/finishedAt）下整条不渲染。

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
  const sharedRows = useSoundMatchFeed()
  const location = useLocation()
  const cardsID = useId()
  // null = 未加载/加载失败：两种情况都整条不渲染（降级为不存在）。
  const [fallbackRows, setRows] = useState<MatchSummary[] | null>(null)
  const rows = sharedRows === undefined ? fallbackRows : sharedRows
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  // F7（可选面）：完局卡带同口径的结果文案；角色名一次性取自 catalog，
  // 名称缺失时只报我方/对手的胜负，不影响横条本体。
  const [roles, setRoles] = useState<Record<string, RoleNames> | null>(null)
  useEffect(() => {
    if (roles != null) return
    let live = true
    void navigationCache
      .fetchQuery(catalogQuery())
      .then((response) => {
        if (!live) return
        setRoles(scenarioRoles(response.scenarios))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [roles])
  // 轮询只更新数据；「刚完成」的过期靠每次轮询后的重渲染自然收敛（粒度
  // 30 秒，对 15 分钟窗口足够）。
  useEffect(() => {
    if (sharedRows !== undefined) return
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
  }, [sharedRows === undefined])

  if (rows == null) return null

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
    <section
      aria-label='进行中的对战'
      className='battle-strip min-w-0 space-y-2'
      {...tm('OS.battle-strip')}
    >
      <button
        type='button'
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={collapsed ? undefined : cardsID}
        {...tm('OS.battle-strip-toggle')}
        className='battle-strip-toggle inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase transition hover:text-(--foreground)'
      >
        <ChevronDown
          aria-hidden='true'
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            collapsed && '-rotate-90',
          )}
        />
        <span className='battle-strip-heading'>
          <span>进行中的对战</span>
          <span>（{inFlight.length} 进行 · {recentDone.length} 刚完成）</span>
        </span>
      </button>
      {collapsed ? null : (
        <div
          id={cardsID}
          className='battle-strip-cards flex gap-2 overflow-x-auto pb-1'
          {...tm('OS.battle-strip-cards')}
        >
          {cards.map((match) => {
            // F7：完局卡在「刚完成」后追加带视角的结果（我方（商鞅）胜…）。
            const outcome = match.finished && match.scored
              ? outcomeCopy(match, roles?.[match.scenarioID] ?? null)
              : null
            return (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                aria-current={location.pathname === `/matches/${match.id}`
                  ? 'page'
                  : undefined}
                className='battle-strip-card inline-flex shrink-0 items-center gap-2 rounded-full border border-(--border-soft) bg-white/2 px-3 py-1.5 text-xs text-(--foreground-subtle) transition hover:border-(--border) hover:text-(--foreground)'
                {...tm('OS.battle-card')}
              >
                <span
                  className='battle-strip-title text-[13px] font-medium'
                  title={match.scenarioTitle}
                >
                  {match.scenarioTitle}
                </span>
                <span className='battle-strip-meta inline-flex items-center gap-2'>
                  <span className='battle-strip-status inline-flex items-center gap-2'>
                    {match.challengeLeg != null
                      ? (
                        <span
                          className='text-(--accent)'
                          {...tm('OS.battle-card-leg')}
                        >
                          约战{match.challengeLeg === 1 ? '①' : '②'}
                        </span>
                      )
                      : null}
                    {match.finished
                      ? (
                        <span className='text-(--success)'>
                          {outcome != null ? `刚完成 · ${outcome}` : '刚完成'}
                        </span>
                      )
                      : (
                        <span className='inline-flex items-center gap-1 text-(--info)'>
                          <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-(--info) motion-reduce:animate-none' />
                          进行中
                        </span>
                      )}
                  </span>
                  <span className='battle-strip-id text-(--foreground-muted)'>
                    #{match.id}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
