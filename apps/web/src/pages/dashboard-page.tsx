import { dashboardStats, recentMatches } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function DashboardPage() {
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{stat.label}</p>
              <p className="font-mono text-3xl font-bold text-[var(--foreground)]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近对局</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentMatches.map((match) => (
            <div key={match.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{match.title}</p>
                <p className="text-sm text-[var(--foreground-subtle)]">{match.subtitle}</p>
              </div>
              <Badge tone={match.statusTone}>{match.result}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
