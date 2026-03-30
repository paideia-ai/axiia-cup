import { dashboardStats } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">只读管理面板</h1>
          <p className="page-subtitle">先做状态盘，不做操作按钮；实际管理动作后续走 CLI。</p>
        </div>
        <Badge tone="warning">read only</Badge>
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
          <CardTitle>任务队列</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="app-panel">
            <p className="panel-label">queued</p>
            <p className="panel-title">12</p>
            <p className="panel-copy">等待 worker 拉取。</p>
          </div>
          <div className="app-panel">
            <p className="panel-label">running</p>
            <p className="panel-title">03</p>
            <p className="panel-copy">后台异步执行中。</p>
          </div>
          <div className="app-panel">
            <p className="panel-label">scored</p>
            <p className="panel-title">41</p>
            <p className="panel-copy">可进入排行榜统计。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
