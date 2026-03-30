import { modelOptions, primaryScenario } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function ScenariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Scenarios</p>
          <h1 className="page-title">场景列表</h1>
          <p className="page-subtitle">先把页面框架和信息层级固定，后面再替换成真实数据流。</p>
        </div>
        <Badge tone="info">{modelOptions.length} 个可选模型</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 border-none pb-0">
          <CardTitle>{primaryScenario.title}</CardTitle>
          <p className="text-sm leading-7 text-[var(--foreground-subtle)]">{primaryScenario.summary}</p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="app-panel">
              <p className="panel-label">角色 A</p>
              <p className="panel-title">{primaryScenario.roleAName}</p>
              <p className="panel-copy">推进变法，争取君主支持。</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">角色 B</p>
              <p className="panel-title">{primaryScenario.roleBName}</p>
              <p className="panel-copy">维护旧秩序，阻止激进改革。</p>
            </div>
          </div>
          <div className="app-panel flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{primaryScenario.subject}</Badge>
              <Badge tone="info">{primaryScenario.turnCount} 回合</Badge>
              <Badge tone="warning">{primaryScenario.judgeRounds} 轮裁判提问</Badge>
            </div>
            <p className="text-sm leading-7 text-[var(--foreground-subtle)]">
              下一步会把这个卡片接到真实场景 schema 和后端 API，当前先锁定卡片结构、信息密度和 CTA 位置。
            </p>
            <div className="mt-auto">
              <Button>进入智能体工坊</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
