import type { Scenario } from "@axiia/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getScenarios } from "../lib/api";

function ScenarioCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="space-y-3 border-none pb-0">
        <div className="h-6 w-48 rounded bg-white/8" />
        <div className="h-4 w-20 rounded bg-white/6" />
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="app-panel h-28 bg-white/3" />
          <div className="app-panel h-28 bg-white/3" />
        </div>
        <div className="app-panel h-28 bg-white/3" />
      </CardContent>
    </Card>
  );
}

export function ScenariosPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        setScenarios(await getScenarios());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载场景失败");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Scenarios</p>
          <h1 className="page-title">场景列表</h1>
          <p className="page-subtitle">裁判 prompt 对所有选手公开可见，场景页先只展示比赛前可知信息。</p>
        </div>
        <Badge tone="info">{isLoading ? "加载中..." : `${scenarios.length} 个场景`}</Badge>
      </div>

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 1 }).map((_, index) => <ScenarioCardSkeleton key={index} />)
          : scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className="cursor-pointer transition hover:border-[rgba(224,74,47,0.35)] hover:bg-[rgba(255,255,255,0.03)]"
                onClick={() => navigate(`/scenarios/${scenario.id}`)}
              >
                <CardHeader className="flex flex-col gap-2 border-none pb-0">
                  <CardTitle>{scenario.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{scenario.subject}</Badge>
                    <Badge tone="info">{scenario.turnCount} 回合</Badge>
                    <Badge tone="warning">结构化评分</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="app-panel">
                      <p className="panel-label">角色 A</p>
                      <p className="panel-title">{scenario.roleAName}</p>
                      <p className="panel-copy">{scenario.roleAPublicGoal}</p>
                    </div>
                    <div className="app-panel">
                      <p className="panel-label">角色 B</p>
                      <p className="panel-title">{scenario.roleBName}</p>
                      <p className="panel-copy">{scenario.roleBPublicGoal}</p>
                    </div>
                  </div>
                  <div className="app-panel">
                    <p className="panel-label">场景背景</p>
                    <p className="panel-copy line-clamp-4">{scenario.context}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
