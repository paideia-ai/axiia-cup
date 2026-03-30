import { createSubmissionSchema, modelOptions, type PlaygroundResult, type Scenario, type Submission } from "@axiia/shared";
import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getMySubmissions, getScenarios, runPlayground } from "../lib/api";

function countText(value: string) {
  return [...value].length;
}

export function PlaygroundPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [model, setModel] = useState(modelOptions[0]?.id ?? "kimi-k2");
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const promptALength = countText(promptA);
  const promptBLength = countText(promptB);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setIsLoading(true);
        const scenarioList = await getScenarios();
        setScenarios(scenarioList);
        setSelectedScenarioId((current) => current || scenarioList[0]?.id || "");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载试炼场失败");
      } finally {
        setIsLoading(false);
      }
    };

    void loadScenarios();
  }, []);

  useEffect(() => {
    if (!selectedScenarioId) {
      return;
    }

    setLatestSubmission(null);
    setResult(null);
  }, [selectedScenarioId]);

  const handleAutoFill = async () => {
    if (!selectedScenarioId) {
      return;
    }

    try {
      setIsAutoFilling(true);
      setError(null);
      const submissions = await getMySubmissions(selectedScenarioId);
      const latest = submissions[0] ?? null;

      if (!latest) {
        setError("当前场景还没有提交记录");
        return;
      }

      setLatestSubmission(latest);
      setPromptA(latest.promptA);
      setPromptB(latest.promptB);
      setModel(latest.model);
    } catch (fillError) {
      setError(fillError instanceof Error ? fillError.message : "自动填充失败");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleRun = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = createSubmissionSchema.safeParse({
      model,
      promptA,
      promptB,
      scenarioId: selectedScenarioId,
    });

    if (!parsed.success) {
      setError("请检查场景、模型和提示词字数限制");
      return;
    }

    try {
      setIsRunning(true);
      setResult(null);
      const nextResult = await runPlayground(parsed.data);
      setResult(nextResult);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "试炼场运行失败");
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-white/8" />
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="h-[520px] animate-pulse rounded-xl bg-white/5" />
          <div className="h-[520px] animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Playground</p>
          <h1 className="page-title">试炼场</h1>
          <p className="page-subtitle">自己 A 打自己 B，完整跑对话、裁判追问和最终评分，不会写入正式赛事表。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedScenario ? <Badge>{selectedScenario.title}</Badge> : null}
          {latestSubmission ? <Badge tone="info">已载入 v{latestSubmission.version}</Badge> : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>测试配置</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleRun}>
              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>场景</span>
                <select className="app-input" value={selectedScenarioId} onChange={(event) => setSelectedScenarioId(event.target.value)}>
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>角色 A 提示词</span>
                <textarea className="app-textarea" maxLength={1000} value={promptA} onChange={(event) => setPromptA(event.target.value)} />
                <div className="text-right text-xs text-[var(--foreground-muted)]">{promptALength} / 1000</div>
              </label>

              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>角色 B 提示词</span>
                <textarea className="app-textarea" maxLength={1000} value={promptB} onChange={(event) => setPromptB(event.target.value)} />
                <div className="text-right text-xs text-[var(--foreground-muted)]">{promptBLength} / 1000</div>
              </label>

              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>模型</span>
                <select className="app-input" value={model} onChange={(event) => setModel(event.target.value as (typeof modelOptions)[number]["id"])}>
                  {modelOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" disabled={isAutoFilling || !selectedScenarioId} onClick={handleAutoFill}>
                  {isAutoFilling ? "读取中..." : "Auto-fill from latest submission"}
                </Button>
                <Button type="submit" disabled={isRunning}>
                  {isRunning ? "对战进行中，请耐心等待..." : "Run Test"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle>对话记录</CardTitle>
              {result ? <Badge tone="success">已完成</Badge> : <Badge tone="warning">{isRunning ? "运行中" : "等待执行"}</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              {isRunning ? <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">对战进行中，请耐心等待...</div> : null}
              {!isRunning && !result ? (
                <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
                  运行后会在这里显示完整 transcript。
                </div>
              ) : null}
              {result?.transcript.map((turn, index) => {
                const isA = turn.speaker === "a";
                const roleName = isA ? selectedScenario?.roleAName ?? "角色 A" : selectedScenario?.roleBName ?? "角色 B";

                return (
                  <div key={`${turn.speaker}-${index}`} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl border px-4 py-3 ${isA ? "border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.12)]" : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)]"}`}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                        Turn {index + 1} · {roleName}
                      </p>
                      <p className="text-sm leading-7 text-[var(--foreground-subtle)]">{turn.content}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>裁判追问 · A</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result?.judgeTranscriptA.length ? (
                  result.judgeTranscriptA.map((item) => (
                    <div key={`a-${item.round}`} className="app-panel">
                      <p className="panel-label">第 {item.round} 轮问题</p>
                      <p className="panel-copy whitespace-pre-wrap">{item.question}</p>
                      <p className="mt-3 panel-label">回答</p>
                      <p className="panel-copy whitespace-pre-wrap">{item.answer}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
                    暂无裁判问答。
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>裁判追问 · B</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result?.judgeTranscriptB.length ? (
                  result.judgeTranscriptB.map((item) => (
                    <div key={`b-${item.round}`} className="app-panel">
                      <p className="panel-label">第 {item.round} 轮问题</p>
                      <p className="panel-copy whitespace-pre-wrap">{item.question}</p>
                      <p className="mt-3 panel-label">回答</p>
                      <p className="panel-copy whitespace-pre-wrap">{item.answer}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm text-[var(--foreground-subtle)]">
                    暂无裁判问答。
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>最终评分</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="app-panel">
                <p className="panel-label">Score A</p>
                <p className="mt-2 font-mono text-3xl text-[var(--foreground)]">{result ? result.scoreA.toFixed(2) : "--"}</p>
              </div>
              <div className="app-panel">
                <p className="panel-label">Score B</p>
                <p className="mt-2 font-mono text-3xl text-[var(--foreground)]">{result ? result.scoreB.toFixed(2) : "--"}</p>
              </div>
              <div className="app-panel">
                <p className="panel-label">Winner</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{result ? result.winner.toUpperCase() : "--"}</p>
              </div>
              <div className="app-panel md:col-span-3">
                <p className="panel-label">Reasoning</p>
                <p className="panel-copy mt-2 whitespace-pre-wrap">{result?.reasoning ?? "运行完成后显示裁判解释。"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
