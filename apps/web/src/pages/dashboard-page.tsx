import { modelOptions, type RecentMatch } from '@axiia/shared'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { cn } from '../lib/cn'
import { getMyRecentMatches, getMyStats } from '../lib/api'

type ConsoleStats = {
  completedMatchCount: number
  currentVersion: number | null
  pendingMatchCount: number
  rank: number | null
  scenarioTitle: string | null
  submissionCount: number
  tournamentRound: number | null
  winRate: number | null
}

function formatTimeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}小时前`

  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}天前`
}

function resultBadge(match: RecentMatch) {
  if (
    match.status === 'running' ||
    match.status === 'queued' ||
    match.status === 'judging'
  ) {
    return <Badge tone="accent">对战中</Badge>
  }
  if (match.status === 'error') {
    return <Badge tone="warning">异常</Badge>
  }
  if (match.winner === null || match.winner === 'draw') {
    return <Badge>平局</Badge>
  }
  const won = match.winner === match.mySide
  return (
    <Badge tone={won ? 'success' : 'warning'}>{won ? '胜出' : '落败'}</Badge>
  )
}

function modelLabel(modelId: string) {
  return modelOptions.find((o) => o.id === modelId)?.label ?? modelId
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ConsoleStats | null>(null)
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [statsResponse, matchesResponse] = await Promise.all([
          getMyStats(),
          getMyRecentMatches(),
        ])
        setStats(statsResponse)
        setRecentMatches(matchesResponse)
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : '加载控制台失败',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const statCards = [
    {
      label: '总胜率',
      value: stats?.winRate != null ? `${stats.winRate.toFixed(1)}%` : '—',
      highlight: true,
    },
    {
      label: '已完成对局',
      value: stats ? String(stats.completedMatchCount) : '—',
    },
    {
      label: '排行榜名次',
      value: stats?.rank != null ? `#${stats.rank}` : '—',
    },
    {
      label: '提示词版本',
      value: stats?.currentVersion != null ? `v${stats.currentVersion}` : '—',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">控制台</h1>
          {stats?.scenarioTitle ? (
            <p className="mt-1 text-sm text-(--foreground-subtle)">
              {stats.scenarioTitle}
              {stats.tournamentRound != null && stats.tournamentRound > 0
                ? ` · 瑞士轮第 ${stats.tournamentRound} 轮`
                : null}
            </p>
          ) : null}
        </div>
        {stats && stats.pendingMatchCount > 0 ? (
          <Badge tone="success">排队中：{stats.pendingMatchCount} 场对局</Badge>
        ) : null}
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      {/* Stat strip — unified container instead of 4 isolated cards */}
      <div className="grid grid-cols-2 divide-x divide-y divide-(--border-soft) rounded-xl border border-(--border-soft) xl:grid-cols-4 xl:divide-y-0">
        {statCards.map((stat) => (
          <div key={stat.label} className="px-6 py-5">
            <p className="panel-label">{stat.label}</p>
            <p
              className={cn(
                'mt-2 text-[2.25rem] font-black tabular-nums leading-none tracking-tight',
                stat.highlight && stats?.winRate != null
                  ? 'text-(--success)'
                  : 'text-(--foreground)',
              )}
            >
              {isLoading ? (
                <span className="animate-pulse text-(--foreground-muted)">
                  —
                </span>
              ) : (
                stat.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Matches */}
      <Card>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <p className="text-sm font-semibold text-(--foreground)">最近对局</p>
          <Link
            to="/leaderboard"
            className="text-sm font-medium text-(--accent) transition hover:opacity-80"
          >
            查看全部 →
          </Link>
        </div>
        <CardContent className="space-y-0.5 pt-2">
          {isLoading ? (
            ['a', 'b', 'c', 'd'].map((k) => (
              <div
                key={k}
                className="h-16 animate-pulse rounded-xl bg-white/5"
              />
            ))
          ) : recentMatches.length === 0 ? (
            <div className="rounded-xl border border-(--border-soft) bg-white/2 px-4 py-5 text-sm text-(--foreground-subtle)">
              暂无最近对局。
            </div>
          ) : (
            recentMatches.map((match) => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 transition hover:bg-white/4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-(--foreground)">
                    <span className="font-semibold">
                      {user?.displayName ?? '我'}
                    </span>
                    <span className="mx-2 text-(--foreground-muted)">vs</span>
                    <span className="font-semibold">{match.opponentName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-(--foreground-muted)">
                    {match.scenarioTitle} · 角色 {match.mySide.toUpperCase()}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs text-(--foreground-muted) sm:inline">
                    {modelLabel(match.model)}
                  </span>
                  {resultBadge(match)}
                  <span className="hidden min-w-[4.5rem] text-right text-xs text-(--foreground-muted) lg:inline">
                    {match.status === 'running' ||
                    match.status === 'queued' ||
                    match.status === 'judging'
                      ? '进行中'
                      : formatTimeAgo(match.createdAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
