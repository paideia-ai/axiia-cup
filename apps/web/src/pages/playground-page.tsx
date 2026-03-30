import { primaryScenario, transcript } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function PlaygroundPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-eyebrow">Playground</p>
          <h1 className="page-title">试炼场</h1>
          <p className="page-subtitle">双栏对话区已经就位，后面直接接流式 transcript 和裁判评分预览。</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">重新运行</Button>
          <Button>提交版本</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>{primaryScenario.title}</CardTitle>
          <Badge tone="success">自己打自己 · 评分预览占位</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4">
            <p className="panel-label text-[var(--accent)]">角色 A</p>
            {transcript
              .filter((turn) => turn.speaker === "roleA")
              .map((turn) => (
                <div key={turn.id} className="rounded-xl bg-[rgba(224,74,47,0.12)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                  {turn.content}
                </div>
              ))}
          </div>
          <div className="space-y-3 rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4">
            <p className="panel-label">角色 B / 裁判</p>
            {transcript
              .filter((turn) => turn.speaker !== "roleA")
              .map((turn) => (
                <div key={turn.id} className="rounded-xl bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm leading-7 text-[var(--foreground-subtle)]">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">{turn.label}</span>
                  {turn.content}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
