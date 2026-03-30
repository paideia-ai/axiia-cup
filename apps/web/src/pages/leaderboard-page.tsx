import { leaderboard, primaryScenario } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Leaderboard</p>
          <h1 className="page-title">排行榜</h1>
          <p className="page-subtitle">表格结构已按胜场 + Buchholz 预留，后面直接接真实比赛数据。</p>
        </div>
        <Badge tone="info">{primaryScenario.title}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>瑞士轮快照</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
              <tr className="border-b border-[var(--border-soft)]">
                <th className="pb-3">排名</th>
                <th className="pb-3">选手</th>
                <th className="pb-3">模型</th>
                <th className="pb-3">战绩</th>
                <th className="pb-3">Buchholz</th>
                <th className="pb-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank} className="border-b border-[var(--border-soft)] last:border-b-0">
                  <td className="py-4 font-mono text-base font-bold text-[var(--foreground)]">#{entry.rank}</td>
                  <td className="py-4 font-semibold text-[var(--foreground)]">{entry.playerName}</td>
                  <td className="py-4 text-[var(--foreground-subtle)]">{entry.modelLabel}</td>
                  <td className="py-4 font-mono text-[var(--foreground)]">
                    {entry.wins}-{entry.losses} / {entry.winRate.toFixed(1)}%
                  </td>
                  <td className="py-4 font-mono text-[var(--foreground-subtle)]">{entry.buchholz.toFixed(1)}</td>
                  <td className="py-4">
                    <Badge tone={entry.status === "done" ? "success" : entry.status === "running" ? "warning" : "info"}>
                      {entry.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
