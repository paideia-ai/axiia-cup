import { modelOptions, type RecentMatch } from '@axiia/shared'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
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
      value: stats?.winRate != null ? `${stats.winRate.toFixed(1)}%` : '--',
      highlight: true,
    },
    {
      label: '已完成对局',
      value: stats ? String(stats.completedMatchCount) : '--',
    },
    {
      label: '排行榜名次',
      value: stats?.rank != null ? String(stats.rank) : '--',
    },
    {
      label: '当前提示词版本',
      value: stats?.currentVersion != null ? `v${stats.currentVersion}` : '--',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">控制台</h1>
          {stats?.scenarioTitle ? (
            <p className="mt-1 text-sm text-[var(--foreground-subtle)]">
              {stats.scenarioTitle}
              {stats.tournamentRound != null && stats.tournamentRound > 0
                ? ` · 瑞士轮第${stats.tournamentRound}轮`
                : null}
            </p>
          ) : null}
        </div>
        {stats && stats.pendingMatchCount > 0 ? (
          <Badge tone="success">排队中: {stats.pendingMatchCount}场对局</Badge>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-2">
              <p
                className={`font-mono text-3xl font-bold ${
                  stat.highlight && stats?.winRate != null
                    ? 'text-[var(--success)]'
                    : 'text-[var(--foreground)]'
                }`}
              >
                {isLoading ? '...' : stat.value}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Matches */}
      <Card>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            最近对局
          </p>
          <Link
            to="/leaderboard"
            className="text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
          >
            查看全部 →
          </Link>
        </div>
        <CardContent className="space-y-1 pt-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-white/5"
              />
            ))
          ) : recentMatches.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[var(--foreground-subtle)]">
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
                  <p className="text-sm text-[var(--foreground)]">
                    <span className="font-semibold">
                      {user?.displayName ?? '我'}
                    </span>
                    <span className="mx-2 text-[var(--foreground-muted)]">
                      vs
                    </span>
                    <span className="font-semibold">{match.opponentName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {match.scenarioTitle} · 你扮演角色
                    {match.mySide.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="hidden text-xs text-[var(--foreground-muted)] sm:inline">
                    {modelLabel(match.model)}
                  </span>
                  {resultBadge(match)}
                  <span className="hidden text-xs text-[var(--foreground-muted)] min-w-[4.5rem] text-right lg:inline">
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
