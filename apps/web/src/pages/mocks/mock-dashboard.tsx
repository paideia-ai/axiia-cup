/** Static mock: Dashboard — populated state with stats + recent matches */
import { Link } from 'react-router-dom'

import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/cn'
import { mockStats, mockRecentMatches, mockUser } from './mock-data'

export function MockDashboard() {
  const statCards = [
    {
      label: '总胜率',
      value: `${mockStats.winRate.toFixed(1)}%`,
      highlight: true,
    },
    {
      label: '已完成对局',
      value: String(mockStats.completedMatchCount),
    },
    {
      label: '排行榜名次',
      value: `#${mockStats.rank}`,
    },
    {
      label: '提示词版本',
      value: `v${mockStats.currentVersion}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title">控制台</h1>
          <p className="mt-1 text-sm text-(--foreground-subtle)">
            {mockStats.scenarioTitle} · 瑞士轮第 {mockStats.tournamentRound} 轮
          </p>
        </div>
        <Badge tone="success">
          排队中：{mockStats.pendingMatchCount} 场对局
        </Badge>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-(--border-soft) rounded-xl border border-(--border-soft) xl:grid-cols-4 xl:divide-y-0">
        {statCards.map((stat) => (
          <div key={stat.label} className="px-6 py-5">
            <p className="panel-label">{stat.label}</p>
            <p
              className={cn(
                'mt-2 text-[2.25rem] font-black tabular-nums leading-none tracking-tight',
                stat.highlight ? 'text-(--success)' : 'text-(--foreground)',
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <p className="text-sm font-semibold text-(--foreground)">最近对局</p>
          <Link
            to="/mocks/leaderboard"
            className="text-sm font-medium text-(--accent) transition hover:opacity-80"
          >
            查看全部 →
          </Link>
        </div>
        <CardContent className="space-y-0.5 pt-2">
          {mockRecentMatches.map((match) => (
            <Link
              key={match.id}
              to="/mocks/match"
              className="flex items-center justify-between rounded-xl px-4 py-3.5 transition hover:bg-white/4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-(--foreground)">
                  <span className="font-semibold">{mockUser.displayName}</span>
                  <span className="mx-2 text-(--foreground-muted)">vs</span>
                  <span className="font-semibold">{match.opponentName}</span>
                </p>
                <p className="mt-0.5 text-xs text-(--foreground-muted)">
                  {match.scenarioTitle} · 角色 {match.mySide.toUpperCase()}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                {match.status === 'running' ? (
                  <Badge tone="accent">对战中</Badge>
                ) : match.winner === match.mySide ? (
                  <Badge tone="success">胜出</Badge>
                ) : match.winner === 'draw' ? (
                  <Badge>平局</Badge>
                ) : (
                  <Badge tone="warning">落败</Badge>
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
