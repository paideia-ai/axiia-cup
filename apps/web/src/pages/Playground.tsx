import {
  modelOptions,
  type PlaygroundRun,
  type PlaygroundRunSummary,
  type Scenario,
  type Submission,
} from "@axiia/shared";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  getMySubmissions,
  getPlaygroundRun,
  getPlaygroundRuns,
  getScenario,
} from "../lib/api";
import {
  getPlaygroundSession,
  startTrackedPlaygroundRun,
  subscribePlaygroundSession,
  syncPlaygroundRun,
  type PlaygroundSession,
} from "../lib/playground-session";

const runningStages = [
  { key: "submitted", label: "提交", hint: "本次试炼场任务已创建。", shortLabel: "提交" },
  { key: "preparing", label: "准备中", hint: "引擎正在初始化角色与上下文。", shortLabel: "准备中" },
  { key: "dialogue", label: "对战中", hint: "双方正在按场景设定进行多轮对话。", shortLabel: "对战中" },
  { key: "judging", label: "审讯阶段", hint: "裁判正在追问双方并整理关键论点。", shortLabel: "审讯阶段" },
  { key: "completed", label: "完成", hint: "结果已生成，可以查看完整记录。", shortLabel: "完成" },
] as const;

type RunningStageKey = (typeof runningStages)[number]["key"];

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function parseSqlTimestamp(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const timestamp = Date.parse(normalized);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isRunFinished(run: PlaygroundRun | null) {
  if (!run) {
    return false;
  }

  return run.error != null || run.scoreA != null || run.scoreB != null || run.winner != null;
}

function hasRunOutput(run: PlaygroundRun | null) {
  if (!run) {
    return false;
  }

  return run.transcript.length > 0 || run.judgeTranscriptA.length > 0 || run.judgeTranscriptB.length > 0;
}

function deriveRunningState(session: PlaygroundSession) {
  if (session.status === "error") {
    return {
      activeIndex: 4,
      detail: session.error ?? "试炼场运行失败。",
      progressPercent: 100,
      stageKey: "completed" as RunningStageKey,
      title: "运行失败",
    };
  }

  if (session.status === "success" || isRunFinished(session.run)) {
    return {
      activeIndex: 4,
      detail: "结果已写入记录，可以查看完整 transcript 与裁判评分。",
      progressPercent: 100,
      stageKey: "completed" as RunningStageKey,
      title: "对战已完成",
    };
  }

  if (!session.run) {
    return {
      activeIndex: 1,
      detail: "任务已经提交，正在等待首轮对话开始。",
      progressPercent: 18,
      stageKey: "preparing" as RunningStageKey,
      title: "正在准备对战",
    };
  }

  const turns = session.run.transcript.length;
  const judgeRoundsA = session.run.judgeTranscriptA.length;
  const judgeRoundsB = session.run.judgeTranscriptB.length;

  if (judgeRoundsA > 0 || judgeRoundsB > 0) {
    const totalJudgeProgress = judgeRoundsA + judgeRoundsB;
    const totalJudgeRounds = Math.max(1, session.judgeRounds * 2);
    const completedJudging = Math.min(1, totalJudgeProgress / totalJudgeRounds);
    const judgingComplete = judgeRoundsA >= session.judgeRounds && judgeRoundsB >= session.judgeRounds;

    return {
      activeIndex: 3,
      detail: judgingComplete
        ? "双方裁判问答已完成，正在汇总最终评分。"
        : `裁判追问进度：A ${judgeRoundsA}/${session.judgeRounds} · B ${judgeRoundsB}/${session.judgeRounds}`,
      progressPercent: 70 + completedJudging * 22,
      stageKey: "judging" as RunningStageKey,
      title: judgingComplete ? "正在生成最终评分" : "进入审讯阶段",
    };
  }

  if (turns > 0) {
    const dialogueProgress = Math.min(1, turns / Math.max(1, session.turnCount));

    return {
      activeIndex: 2,
      detail: `对话进度：已完成 ${turns}/${session.turnCount} 回合`,
      progressPercent: 28 + dialogueProgress * 38,
      stageKey: "dialogue" as RunningStageKey,
      title: "双方正在对战",
    };
  }

  return {
    activeIndex: 1,
    detail: "引擎已启动，正在准备首轮发言。",
    progressPercent: 22,
    stageKey: "preparing" as RunningStageKey,
    title: "正在准备对战",
  };
}

function RunResult({ run, scenario }: { run: PlaygroundRun; scenario: Scenario }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>对话记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {run.transcript.length ? (
            run.transcript.map((turn, index) => {
              const isA = turn.speaker === "a";
              const roleName = isA ? scenario.roleAName : scenario.roleBName;

              return (
                <div key={`${turn.speaker}-${index}`} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                      isA
                        ? "border-[rgba(224,74,47,0.25)] bg-[rgba(224,74,47,0.12)]"
                        : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                      Turn {index + 1} · {roleName}
                    </p>
                    <p className="text-sm leading-7 text-[var(--foreground-subtle)]">{turn.content}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[var(--foreground-subtle)]">对话尚未开始。</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {[
          { transcript: run.judgeTranscriptA, label: `裁判追问 · ${scenario.roleAName}` },
          { transcript: run.judgeTranscriptB, label: `裁判追问 · ${scenario.roleBName}` },
        ].map(({ transcript, label }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transcript.length ? (
                transcript.map((item) => (
                  <div key={item.round} className="app-panel">
                    <p className="panel-label">第 {item.round} 轮问题</p>
                    <p className="panel-copy whitespace-pre-wrap">{item.question}</p>
                    <p className="mt-3 panel-label">回答</p>
                    <p className="panel-copy whitespace-pre-wrap">{item.answer}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--foreground-subtle)]">暂无问答。</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最终评分</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="app-panel">
              <p className="panel-label">Score A · {scenario.roleAName}</p>
              <p className="mt-2 font-mono text-3xl text-[var(--foreground)]">{run.scoreA ?? "--"} / 10</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">Score B · {scenario.roleBName}</p>
              <p className="mt-2 font-mono text-3xl text-[var(--foreground)]">{run.scoreB ?? "--"} / 10</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">Winner</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{run.winner?.toUpperCase() ?? "--"}</p>
            </div>
          </div>
          {run.reasoning ? (
            <div className="app-panel">
              <p className="panel-label">裁判评分理由</p>
              <pre className="panel-copy mt-2 whitespace-pre-wrap font-sans">{run.reasoning}</pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RunHistoryItem({
  isPending,
  isSelected,
  onSelect,
  run,
}: {
  isPending: boolean;
  isSelected: boolean;
  onSelect: () => void;
  run: PlaygroundRunSummary;
}) {
  const winnerLabel = isPending ? "进行中" : run.winner ? run.winner.toUpperCase() : run.error ? "ERROR" : "—";
  const winnerColor = isPending
    ? "text-[var(--accent)]"
    : run.winner === "a" || run.winner === "b"
      ? "text-[var(--success)]"
      : run.winner === "draw"
        ? "text-[var(--foreground-subtle)]"
        : run.error
          ? "text-[#f87171]"
          : "text-[var(--foreground-muted)]";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        isSelected
          ? "border-[rgba(224,74,47,0.35)] bg-[rgba(224,74,47,0.1)]"
          : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">{run.createdAt}</p>
          {run.scoreA != null && run.scoreB != null ? (
            <p className="mt-0.5 text-sm text-[var(--foreground-subtle)]">
              A: {run.scoreA} · B: {run.scoreB}
            </p>
          ) : null}
        </div>
        <span className={`text-sm font-semibold ${winnerColor}`}>{winnerLabel}</span>
      </div>
    </button>
  );
}

function ProgressPanel({
  elapsedSeconds,
  isRefreshing,
  onRefresh,
  session,
}: {
  elapsedSeconds: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  session: PlaygroundSession;
}) {
  const progress = deriveRunningState(session);
  const visibleRunId = session.runId ?? session.run?.id ?? null;

  return (
    <Card>
      <CardContent className="space-y-6 py-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(224,74,47,0.22)] bg-[rgba(224,74,47,0.1)] text-2xl text-[var(--accent)]">
            ⚔
          </div>
          <div>
            <p className="text-2xl font-semibold text-[var(--foreground)]">{progress.title}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground-subtle)]">{progress.detail}</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">你可以离开此页面，稍后返回继续查看最新进展。</p>
          </div>
          {visibleRunId ? (
            <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm text-[var(--foreground-subtle)]">
              对战 #{visibleRunId}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">运行耗时</p>
              <p className="mt-1 font-mono text-2xl text-[var(--foreground)]">{formatElapsed(elapsedSeconds)}</p>
            </div>
            <Button disabled={isRefreshing} onClick={onRefresh} size="sm" type="button" variant="secondary">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新状态
            </Button>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#f97316)] transition-[width] duration-700"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {runningStages.map((stage, index) => {
            const isDone = index < progress.activeIndex;
            const isCurrent = index === progress.activeIndex;

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
                    <p className="text-sm font-semibold text-[var(--foreground)]">{stage.shortLabel}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{stage.hint}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function findCandidateRunSummary(session: PlaygroundSession, summaries: PlaygroundRunSummary[]) {
  if (session.runId) {
    return summaries.find((summary) => summary.id === session.runId) ?? null;
  }

  const startedAt = session.startedAt - 5000;

  return summaries.find((summary) => parseSqlTimestamp(summary.createdAt) >= startedAt) ?? null;
}

export function PlaygroundPage() {
  const { submissionId: submissionIdParam } = useParams<{ submissionId: string }>();
  const submissionId = Number(submissionIdParam);
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [runSummaries, setRunSummaries] = useState<PlaygroundRunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<PlaygroundRun | null>(null);
  const [activeSession, setActiveSession] = useState<PlaygroundSession | null>(() =>
    Number.isInteger(submissionId) && submissionId > 0 ? getPlaygroundSession(submissionId) : null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    activeSession ? Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000)) : 0,
  );

  useEffect(() => {
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return;
    }

    return subscribePlaygroundSession(submissionId, (session) => {
      setActiveSession(session);

      if (!session) {
        setElapsedSeconds(0);
        return;
      }

      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)));

      if (session.status === "success" && session.run) {
        setSelectedRun(session.run);
        setError(null);
      } else if (session.status === "error") {
        setError(session.error ?? "试炼场运行失败");
      }
    });
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) {
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const allSubmissions = await getMySubmissions();
        const sub = allSubmissions.find((item) => item.id === submissionId) ?? null;
        setSubmission(sub);

        if (!sub) {
          setError("找不到该版本");
          return;
        }

        const [scenarioData, runs] = await Promise.all([
          getScenario(sub.scenarioId),
          getPlaygroundRuns(submissionId),
        ]);

        setScenario(scenarioData);
        setRunSummaries(runs);

        const session = getPlaygroundSession(submissionId);

        if (session?.run) {
          setSelectedRun(session.run);
          return;
        }

        const latestFinishedRun = runs.find(
          (run) => run.error != null || run.scoreA != null || run.scoreB != null || run.winner != null,
        );

        if (latestFinishedRun) {
          const fullRun = await getPlaygroundRun(submissionId, latestFinishedRun.id);
          setSelectedRun(fullRun);
        } else {
          setSelectedRun(null);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [submissionId]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") {
      return;
    }

    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000)));
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession?.requestId, activeSession?.startedAt, activeSession?.status]);

  async function refreshActiveRun() {
    if (!activeSession || activeSession.status !== "running") {
      return;
    }

    try {
      setIsRefreshing(true);
      const summaries = await getPlaygroundRuns(submissionId);
      setRunSummaries(summaries);

      const candidate = findCandidateRunSummary(activeSession, summaries);

      if (!candidate) {
        return;
      }

      const fullRun = await getPlaygroundRun(submissionId, candidate.id);
      syncPlaygroundRun(submissionId, activeSession.requestId, fullRun);

      if (isRunFinished(fullRun)) {
        setSelectedRun(fullRun);
        setError(fullRun.error ?? null);
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "刷新试炼场状态失败");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") {
      return;
    }

    let cancelled = false;

    const sync = async () => {
      if (cancelled) {
        return;
      }

      await refreshActiveRun();
    };

    void sync();
    const timer = window.setInterval(() => {
      void sync();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeSession?.requestId, activeSession?.status, submissionId]);

  const handleRun = () => {
    if (!submission || !scenario) {
      return;
    }

    setError(null);
    setSelectedRun(null);

    startTrackedPlaygroundRun({
      judgeRounds: scenario.judgeRounds,
      scenarioId: scenario.id,
      submissionId,
      turnCount: scenario.turnCount,
    });
  };

  const handleSelectRun = async (summary: PlaygroundRunSummary) => {
    if (selectedRun?.id === summary.id) {
      return;
    }

    try {
      const fullRun = await getPlaygroundRun(submissionId, summary.id);
      setSelectedRun(fullRun);
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "加载测试记录失败");
    }
  };

  const modelLabel = useMemo(
    () => (submission ? modelOptions.find((option) => option.id === submission.model)?.label ?? submission.model : null),
    [submission],
  );

  const activeRunId = activeSession?.runId ?? activeSession?.run?.id ?? null;
  const isRunning = activeSession?.status === "running";
  const visibleRun = isRunning ? activeSession?.run ?? null : selectedRun;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-white/8" />
        <div className="h-[520px] animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!submission || !scenario) {
    return (
      <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
        {error ?? "找不到该版本"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/scenarios/${submission.scenarioId}`)}
            className="mb-2 flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground-subtle)]"
          >
            <ArrowLeft className="h-3 w-3" />
            返回工坊
          </button>
          <p className="page-eyebrow">试炼场</p>
          <h1 className="page-title">{scenario.title}</h1>
          <p className="page-subtitle">测试结果与版本绑定，不写入正式赛事。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">v{submission.version}</Badge>
          {modelLabel ? <Badge tone="warning">{modelLabel}</Badge> : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>测试版本</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="app-panel">
                <p className="panel-label">Prompt A · {scenario.roleAName}</p>
                <p className="panel-copy whitespace-pre-wrap">{submission.promptA}</p>
              </div>
              <div className="app-panel">
                <p className="panel-label">Prompt B · {scenario.roleBName}</p>
                <p className="panel-copy whitespace-pre-wrap">{submission.promptB}</p>
              </div>
              <Button className="w-full" disabled={isRunning} onClick={handleRun}>
                {isRunning ? "对战进行中..." : "运行对战"}
              </Button>
              {isRunning ? (
                <p className="text-center text-xs text-[var(--foreground-muted)]">
                  可以暂时离开页面，回来后会继续展示最新进展。
                </p>
              ) : null}
            </CardContent>
          </Card>

          {runSummaries.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>测试历史</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {runSummaries.map((run) => (
                  <RunHistoryItem
                    key={run.id}
                    isPending={run.id === activeRunId && isRunning}
                    isSelected={selectedRun?.id === run.id}
                    onSelect={() => void handleSelectRun(run)}
                    run={run}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {isRunning && activeSession ? (
            <>
              <ProgressPanel
                elapsedSeconds={elapsedSeconds}
                isRefreshing={isRefreshing}
                onRefresh={() => void refreshActiveRun()}
                session={activeSession}
              />
              {hasRunOutput(activeSession.run) ? <RunResult run={activeSession.run!} scenario={scenario} /> : null}
            </>
          ) : visibleRun ? (
            <RunResult run={visibleRun} scenario={scenario} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-24">
                <p className="text-sm text-[var(--foreground-subtle)]">点击「运行对战」开始一次新的试炼场测试。</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
