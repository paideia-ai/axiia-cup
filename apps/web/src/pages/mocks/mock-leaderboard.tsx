/** Static mock: Leaderboard with data */
import { Link } from 'react-router-dom'

import { Badge } from '../../components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { mockLeaderboard, mockScenario } from './mock-data'

export function MockLeaderboard() {
  const formatScore = (v: number) =>
    Number.isInteger(v) ? String(v) : v.toFixed(1)
  const formatRecord = (w: number, l: number) => `${formatScore(w)} / ${l}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">排行榜</p>
          <h1 className="page-title">排行榜</h1>
        </div>
        <Badge tone="success">已结束 · 5 轮</Badge>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>瑞士轮战绩</CardTitle>
            <p className="mt-1 text-xs text-(--foreground-muted)">
              同胜场选手对阵，积分高者排名靠前
            </p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {/* Mobile card layout */}
          <div className="space-y-2 md:hidden">
            {mockLeaderboard.map((entry) => (
              <div
                key={entry.submissionId}
                className="cursor-pointer rounded-xl border border-(--border-soft) bg-white/2 px-4 py-3 transition hover:bg-white/4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-lg font-black text-(--foreground)">
                      #{entry.rank}
                    </span>
                    <span className="font-semibold text-(--foreground)">
                      {entry.playerName}
                    </span>
                  </div>
                  <span className="tabular-nums text-sm font-semibold text-(--success)">
                    {entry.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-(--foreground-muted)">
                  <span>
                    {formatScore(entry.wins)}胜 {entry.losses}负
                  </span>
                  <span>
                    小分 {entry.buchholz.toFixed(1)}
                    <span className="ml-1 text-(--foreground-muted)/60">
                      (排名依据)
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <table className="hidden min-w-full text-left text-sm md:table">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-(--foreground-muted)">
              <tr className="border-b border-(--border-soft)">
                <th className="pb-3 pr-6">排名</th>
                <th className="pb-3 pr-6">选手</th>
                <th className="pb-3 pr-4">总胜</th>
                <th className="pb-3 pr-4">总负</th>
                <th className="pb-3 pr-6">{mockScenario.roleAName} 胜 / 负</th>
                <th className="pb-3 pr-6">{mockScenario.roleBName} 胜 / 负</th>
                <th
                  className="pb-3 pr-4"
                  title="得分总和 · 同胜场时小分高者排名靠前"
                >
                  小分
                </th>
                <th className="pb-3">胜率</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((entry) => (
                <tr
                  key={entry.submissionId}
                  className="cursor-pointer border-b border-(--border-soft) transition last:border-b-0 hover:bg-white/3"
                >
                  <td className="py-4 pr-6 tabular-nums text-base font-black text-(--foreground)">
                    #{entry.rank}
                  </td>
                  <td className="py-4 pr-6 font-semibold text-(--foreground)">
                    {entry.playerName}
                  </td>
                  <td className="py-4 pr-4 tabular-nums text-(--foreground)">
                    {entry.wins}
                  </td>
                  <td className="py-4 pr-4 tabular-nums text-(--foreground)">
                    {entry.losses}
                  </td>
                  <td className="py-4 pr-6 tabular-nums text-(--foreground-subtle)">
                    {formatRecord(entry.roleAWins, entry.roleALosses)}
                  </td>
                  <td className="py-4 pr-6 tabular-nums text-(--foreground-subtle)">
                    {formatRecord(entry.roleBWins, entry.roleBLosses)}
                  </td>
                  <td className="py-4 pr-4 tabular-nums text-(--foreground-subtle)">
                    {entry.buchholz.toFixed(1)}
                  </td>
                  <td className="py-4 tabular-nums text-(--foreground-subtle)">
                    {entry.winRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
