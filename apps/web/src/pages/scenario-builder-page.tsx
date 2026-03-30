import { modelOptions, primaryScenario } from "../lib/mock-data";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function ScenarioBuilderPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Workshop</p>
          <h1 className="page-title">智能体工坊</h1>
          <p className="page-subtitle">左右分栏已经拆出来，后续直接接 prompt editor、表单校验和版本管理。</p>
        </div>
        <Badge>{primaryScenario.title}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>场景材料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="app-panel">
              <p className="panel-label">背景</p>
              <p className="panel-copy">{primaryScenario.summary}</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">公开裁判设定</p>
              <p className="panel-copy">裁判以场景内角色身份提问，并根据赛后问答做结构化评分。</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">边界约束</p>
              <p className="panel-copy">不可跳出时代背景，不可承认自己是 AI，不可使用工具调用。</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 border-none pb-0">
            <div className="flex flex-wrap gap-2">
              <Badge>角色 A 提示词</Badge>
              <Badge tone="info">角色 B 提示词</Badge>
            </div>
            <CardTitle>提交表单骨架</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>角色 A 系统提示词</span>
              <textarea className="app-textarea" placeholder="先保留编辑区域，后续补自动保存、字数限制和版本对比。" />
            </label>
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>角色 B 系统提示词</span>
              <textarea className="app-textarea" placeholder="提交必须同时包含双角色提示词。" />
            </label>
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>模型选择</span>
              <select className="app-input">
                {modelOptions.map((model) => (
                  <option key={model.id}>{model.label}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary">进入试炼场</Button>
              <Button>提交参赛</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
