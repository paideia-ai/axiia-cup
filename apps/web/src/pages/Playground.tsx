import { createSubmissionSchema, modelOptions, type PlaygroundResult, type Scenario, type Submission } from "@axiia/shared";
import { useEffect, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getMySubmissions, getScenarios } from "../lib/api";
import {
  clearPlaygroundSession,
  getPlaygroundSessionState,
  startPlaygroundSession,
  subscribePlaygroundSession,
} from "../lib/playground-session";

function countText(value: string) {
  return [...value].length;
}

const runningStages = [
  {
    key: "submitted",
    label: "提交任务",
    hint: "已锁定本次试炼场配置，正在向引擎发送请求。",
    threshold: 0,
  },
  {
    key: "dialogue",
    label: "对话阶段",
    hint: "双方按场景设定展开多轮对话，逐步积累 transcript。",
    threshold: 6,
  },
  {
    key: "judge-a",
    label: "审问 A",
    hint: "裁判正在围绕完整 transcript 追问角色 A。",
    threshold: 70,
  },
  {
    key: "judge-b",
    label: "审问 B",
    hint: "裁判切换到角色 B，继续进行多轮追问。",
    threshold: 120,
  },
  {
    key: "scoring",
    label: "裁判评分",
    hint: "汇总双方问答，生成最终分数、胜负和 reasoning。",
    threshold: 170,
  },
] as const;

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getStageIndex(elapsedSeconds: number) {
  let activeIndex = 0;

  for (let index = 0; index < runningStages.length; index += 1) {
    if (elapsedSeconds >= runningStages[index].threshold) {
      activeIndex = index;
    }
  }

  return activeIndex;
}

export function PlaygroundPage() {
  const initialSession = getPlaygroundSessionState();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialSession.draft?.scenarioId ?? "");
  const [promptA, setPromptA] = useState(initialSession.draft?.promptA ?? "");
  const [promptB, setPromptB] = useState(initialSession.draft?.promptB ?? "");
  const [model, setModel] = useState(initialSession.draft?.model ?? modelOptions[0]!.id);
  const [result, setResult] = useState<PlaygroundResult | null>(initialSession.result);
  const [latestSubmission, setLatestSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(initialSession.status === "running");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(initialSession.error);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(initialSession.startedAt);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    initialSession.startedAt ? Math.max(0, Math.floor((Date.now() - initialSession.startedAt) / 1000)) : 0,
  );

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const promptALength = countText(promptA);
  const promptBLength = countText(promptB);
  const activeStageIndex = getStageIndex(elapsedSeconds);
  const activeStage = runningStages[activeStageIndex];
  const progressPercent = isRunning
    ? Math.min(96, ((activeStageIndex + 1) / runningStages.length) * 100)
    : result
      ? 100
      : 0;

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
    return subscribePlaygroundSession((session) => {
      setIsRunning(session.status === "running");
      setResult(session.result);
      setError(session.error);
      setRunStartedAt(session.startedAt);

      if (session.draft) {
        setSelectedScenarioId(session.draft.scenarioId);
        setPromptA(session.draft.promptA);
        setPromptB(session.draft.promptB);
        setModel(session.draft.model as (typeof modelOptions)[number]["id"]);
      }

      if (session.startedAt) {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)));
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedScenarioId) {
      return;
    }

    setLatestSubmission(null);
  }, [selectedScenarioId]);

  useEffect(() => {
    if (!isRunning || !runStartedAt) {
      return;
    }

    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000)));
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, runStartedAt]);

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

    setError(null);
    void startPlaygroundSession(parsed.data);
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
                {(result || error) && !isRunning ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      clearPlaygroundSession({
                        model,
                        promptA,
                        promptB,
                        scenarioId: selectedScenarioId,
                      });
                      setError(null);
                      setResult(null);
                      setElapsedSeconds(0);
                    }}
                  >
                    清空结果
                  </Button>
                ) : null}
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
              {isRunning ? (
                <div className="rounded-2xl border border-[rgba(224,74,47,0.18)] bg-[linear-gradient(180deg,rgba(224,74,47,0.08),rgba(255,255,255,0.02))] p-5">
                  <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Trial Running</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{activeStage.label}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--foreground-subtle)]">{activeStage.hint}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(0,0,0,0.18)] px-4 py-3 text-right">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Elapsed</p>
                      <p className="mt-1 font-mono text-2xl text-[var(--foreground)]">{formatElapsed(elapsedSeconds)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#f97316)] transition-[width] duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[var(--foreground-muted)]">当前进度为前端估算阶段，用于反馈引擎正在执行，不代表精确实时百分比。</p>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-5">
                    {runningStages.map((stage, index) => {
                      const isDone = index < activeStageIndex;
                      const isCurrent = index === activeStageIndex;

                      return (
                        <div
                          key={stage.key}
                          className={`rounded-xl border px-3 py-4 transition ${
                            isCurrent
                              ? "border-[rgba(224,74,47,0.3)] bg-[rgba(224,74,47,0.12)]"
                              : isDone
                                ? "border-[rgba(52,211,153,0.24)] bg-[rgba(52,211,153,0.08)]"
                                : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                isCurrent
                                  ? "bg-[var(--accent)] text-black"
                                  : isDone
                                    ? "bg-[var(--success)] text-black"
                                    : "bg-[rgba(255,255,255,0.08)] text-[var(--foreground-muted)]"
                              }`}
                            >
                              {isDone ? "✓" : index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">{stage.label}</p>
                              <p className="text-xs text-[var(--foreground-muted)]">
                                {isCurrent ? "进行中" : isDone ? "已完成" : "等待中"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
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
