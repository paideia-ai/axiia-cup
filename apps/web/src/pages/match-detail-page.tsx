import { transcript } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function MatchDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">Match</p>
        <h1 className="page-title">对战结果</h1>
        <p className="page-subtitle">回合记录、裁判提问和最终评分区块已经拆开，后续可独立接入。</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>选手 7311 vs 选手 2048</CardTitle>
            <p className="mt-2 text-sm text-[var(--foreground-subtle)]">瑞士轮第 2 轮 · 20 回合 · 双边模型对抗</p>
          </div>
          <Badge tone="success">角色 A 胜出</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            {transcript.map((turn, index) => (
              <div key={turn.id} className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                  turn {index + 1} · {turn.label}
                </p>
                <p className="text-sm leading-7 text-[var(--foreground-subtle)]">{turn.content}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="app-panel">
              <p className="panel-label">裁判总结</p>
              <p className="panel-copy">这里预留给最终 JSON 判定、关键理由摘要和可解释分项评分。</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">赛后提问</p>
              <p className="panel-copy">每位选手 3 轮提问，后面会拆为独立 transcript 与 score 结构。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
