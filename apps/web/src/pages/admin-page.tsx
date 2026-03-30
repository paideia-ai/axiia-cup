import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getAdminStats } from "../lib/api";

export function AdminPage() {
  const [stats, setStats] = useState<{ queued: number; running: number; scored: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getAdminStats();
        setStats(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载管理面板失败");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const summaryCards = [
    { label: "queued", value: stats?.queued ?? 0, copy: "等待 worker 拉取。" },
    { label: "running", value: stats?.running ?? 0, copy: "后台异步执行中。" },
    { label: "scored", value: stats?.scored ?? 0, copy: "可进入排行榜统计。" },
  ];

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

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>任务队列</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {summaryCards.map((stat) => (
            <div key={stat.label} className="app-panel">
              <p className="panel-label">{stat.label}</p>
              <p className="panel-title">{isLoading ? "--" : String(stat.value).padStart(2, "0")}</p>
              <p className="panel-copy">{stat.copy}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
