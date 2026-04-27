/** Static mock: Dashboard — empty state (new user, no matches) */
import { Link } from 'react-router-dom'

import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/cn'

export function MockDashboardEmpty() {
  const statCards = [
    { label: '总胜率', value: '—', highlight: true },
    { label: '已完成对局', value: '0' },
    { label: '排行榜名次', value: '—' },
    { label: '提示词版本', value: '—' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">控制台</h1>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-(--border-soft) rounded-xl border border-(--border-soft) xl:grid-cols-4 xl:divide-y-0">
        {statCards.map((stat) => (
          <div key={stat.label} className="px-6 py-5">
            <p className="panel-label">{stat.label}</p>
            <p
              className={cn(
                'mt-2 text-[2.25rem] font-black tabular-nums leading-none tracking-tight text-(--foreground)',
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
          <div className="rounded-xl border border-(--border-soft) bg-white/2 px-6 py-8 text-sm">
            <p className="font-semibold text-(--foreground)">
              欢迎来到 AXIIA CUP
            </p>
            <p className="mt-2 text-(--foreground-subtle) leading-6">
              你还没有参加过对局。
            </p>
            <ol className="mt-3 space-y-1 text-(--foreground-subtle) list-decimal list-inside">
              <li>前往工坊，编写你的策略提示词</li>
              <li>保存后等待管理员开启下一轮比赛</li>
              <li>比赛结束后，你的战绩会显示在这里</li>
            </ol>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/mocks/workshop"
                className="inline-flex items-center rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                前往工坊 →
              </Link>
              <Link
                to="/mocks/match"
                className="inline-flex items-center rounded-lg border border-(--border-soft) px-4 py-2 text-sm font-medium text-(--foreground-subtle) transition hover:bg-white/5"
              >
                先看一场精彩对局 →
              </Link>
              <Link
                to="/mocks/leaderboard"
                className="inline-flex items-center rounded-lg border border-(--border-soft) px-4 py-2 text-sm font-medium text-(--foreground-subtle) transition hover:bg-white/5"
              >
                查看排行榜 →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
