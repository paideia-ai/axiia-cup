import type { RecentMatch } from "@axiia/shared";
import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getMyRecentMatches, getMyStats } from "../lib/api";

type DashboardStatsState = {
  pendingMatchCount: number;
  rank: number | null;
  submissionCount: number;
  winRate: number | null;
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsState | null>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [statsResponse, matchesResponse] = await Promise.all([getMyStats(), getMyRecentMatches()]);
        setStats(statsResponse);
        setRecentMatches(matchesResponse);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载控制台失败");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const dashboardStats = [
    { label: "当前排名", value: stats?.rank ? `#${stats.rank}` : "--" },
    { label: "总胜率", value: stats?.winRate != null ? `${stats.winRate.toFixed(1)}%` : "--" },
    { label: "已提交版本", value: stats ? String(stats.submissionCount) : "--" },
    { label: "待运行对局", value: stats ? String(stats.pendingMatchCount).padStart(2, "0") : "--" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Dashboard</p>
          <h1 className="page-title">控制台</h1>
          <p className="page-subtitle">如果后续需要个人首页，这个页面可以继续扩展；当前先用于承接新壳子。</p>
        </div>
        <Badge tone="info">新框架已切换</Badge>
      </div>

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{stat.label}</p>
              <p className="font-mono text-3xl font-bold text-[var(--foreground)]">{isLoading ? "..." : stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近对局</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-white/5" />)
          ) : recentMatches.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[var(--foreground-subtle)]">
              暂无最近对局。
            </div>
          ) : (
            recentMatches.map((match) => (
              <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{match.scenarioTitle}</p>
                  <p className="text-sm text-[var(--foreground-subtle)]">
                    {match.roleALabel} vs {match.roleBLabel}
                  </p>
                </div>
                <Badge tone={match.status === "scored" ? "success" : match.status === "error" ? "warning" : "info"}>
                  {match.status === "scored" ? `胜者 ${match.winner?.toUpperCase() ?? "--"}` : match.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
