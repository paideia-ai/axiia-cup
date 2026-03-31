import {
  createSubmissionSchema,
  modelOptions,
  type ModelOption,
  type Scenario,
  type Submission,
} from "@axiia/shared";
import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { createSubmission, getMySubmissions, getScenario } from "../lib/api";

function countText(value: string) {
  return [...value].length;
}

function RoleCard({
  roleName,
  publicGoal,
  side,
}: {
  roleName: string;
  publicGoal: string;
  side: "a" | "b";
}) {
  const accent = side === "a" ? "rgba(224,74,47,0.15)" : "rgba(99,102,241,0.15)";
  const border = side === "a" ? "rgba(224,74,47,0.22)" : "rgba(99,102,241,0.22)";

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: accent, borderColor: border }}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
          角色 {side.toUpperCase()}
        </span>
        <span className="text-sm font-semibold text-[var(--foreground)]">{roleName}</span>
      </div>
      <div className="whitespace-pre-wrap text-xs leading-6 text-[var(--foreground-subtle)]">{publicGoal}</div>
    </div>
  );
}

export function ScenarioDetailPage() {
  const { scenarioId = "" } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<ModelOption["id"]>(modelOptions[0]!.id);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJudgePromptOpen, setIsJudgePromptOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const promptALength = useMemo(() => countText(promptA), [promptA]);
  const promptBLength = useMemo(() => countText(promptB), [promptB]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [scenarioResponse, submissionsResponse] = await Promise.all([
          getScenario(scenarioId),
          getMySubmissions(scenarioId),
        ]);

        setScenario(scenarioResponse);
        setSubmissions(submissionsResponse);

        // Pre-fill from latest version
        const latest = submissionsResponse[0];
        if (latest) {
          setPromptA(latest.promptA);
          setPromptB(latest.promptB);
          setModel(latest.model as ModelOption["id"]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载场景失败");
      } finally {
        setIsLoading(false);
      }
    };

    if (scenarioId) {
      void load();
    }
  }, [scenarioId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = createSubmissionSchema.safeParse({ model, promptA, promptB, scenarioId });

    if (!parsed.success) {
      setError("请检查提示词字数、模型选择和必填项");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createSubmission(parsed.data);
      const history = await getMySubmissions(scenarioId);
      setSubmissions(history);
      setToast(`v${created.version} 已保存`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "保存失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-white/8" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-80 animate-pulse rounded-xl bg-white/5" />
          <div className="h-[640px] animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (error && !scenario) {
    return <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div>;
  }

  if (!scenario) {
    return <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-subtle)]">场景不存在。</div>;
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.12)] px-4 py-3 text-sm text-[var(--success)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Workshop</p>
          <h1 className="page-title">{scenario.title}</h1>
          <p className="page-subtitle">每次保存会创建一个新版本，比赛由管理员开启，届时将自动使用你的最新版本参赛。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">{scenario.turnCount} 回合</Badge>
          <Badge tone="warning">{scenario.judgeRounds} 轮裁判追问</Badge>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Left: Scene Materials ── */}
        <Card>
          <CardHeader>
            <CardTitle>场景材料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="app-panel">
              <p className="panel-label">背景</p>
              <p className="panel-copy">{scenario.context}</p>
            </div>

            <RoleCard
              side="a"
              roleName={scenario.roleAName}
              publicGoal={scenario.roleAPublicGoal}
            />
            <RoleCard
              side="b"
              roleName={scenario.roleBName}
              publicGoal={scenario.roleBPublicGoal}
            />

            <div className="app-panel">
              <p className="panel-label">边界约束</p>
              <p className="panel-copy">{scenario.boundaryConstraints}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)]">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                type="button"
                onClick={() => setIsJudgePromptOpen((v) => !v)}
              >
                <div>
                  <p className="panel-label mb-1">公开裁判 Prompt</p>
                  <p className="text-sm text-[var(--foreground-subtle)]">按文档要求，裁判 prompt 对选手公开。</p>
                </div>
                {isJudgePromptOpen
                  ? <ChevronUp className="h-4 w-4 text-[var(--foreground-subtle)]" />
                  : <ChevronDown className="h-4 w-4 text-[var(--foreground-subtle)]" />}
              </button>
              {isJudgePromptOpen ? (
                <div className="border-t border-[var(--border-soft)] px-4 py-4 text-sm leading-7 text-[var(--foreground-subtle)] whitespace-pre-wrap">
                  {scenario.judgePrompt}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* ── Right: Prompt Editor + Version History ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0">
              <div className="flex flex-wrap gap-2">
                <Badge>角色 A 提示词</Badge>
                <Badge tone="info">角色 B 提示词</Badge>
              </div>
              <CardTitle>编写提示词</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSave}>
                <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                  <span>
                    角色 A 系统提示词
                    <span className="ml-1 text-[var(--foreground-muted)]">· {scenario.roleAName}</span>
                  </span>
                  <textarea
                    className="app-textarea"
                    maxLength={1000}
                    onChange={(event) => setPromptA(event.target.value)}
                    value={promptA}
                  />
                  <div className={`text-right text-xs ${promptALength > 1000 ? "text-[#f87171]" : "text-[var(--foreground-muted)]"}`}>
                    {promptALength} / 1000
                  </div>
                </label>
                <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                  <span>
                    角色 B 系统提示词
                    <span className="ml-1 text-[var(--foreground-muted)]">· {scenario.roleBName}</span>
                  </span>
                  <textarea
                    className="app-textarea"
                    maxLength={1000}
                    onChange={(event) => setPromptB(event.target.value)}
                    value={promptB}
                  />
                  <div className={`text-right text-xs ${promptBLength > 1000 ? "text-[#f87171]" : "text-[var(--foreground-muted)]"}`}>
                    {promptBLength} / 1000
                  </div>
                </label>
                <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                  <span>模型选择</span>
                  <select
                    className="app-input"
                    onChange={(event) => setModel(event.target.value as ModelOption["id"])}
                    value={model}
                  >
                    {modelOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex justify-end">
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "保存中..." : "保存版本"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Version History ── */}
          <Card>
            <CardHeader>
              <CardTitle>版本历史</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[var(--foreground-subtle)]">
                  还没有保存记录。
                </div>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">v{submission.version}</p>
                        <p className="text-sm text-[var(--foreground-subtle)]">{submission.createdAt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="info">
                          {modelOptions.find((o) => o.id === submission.model)?.label ?? submission.model}
                        </Badge>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => navigate(`/playground/${submission.id}`)}
                        >
                          <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                          在试炼场测试
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="app-panel">
                        <p className="panel-label">Prompt A</p>
                        <p className="panel-copy whitespace-pre-wrap">{submission.promptA}</p>
                      </div>
                      <div className="app-panel">
                        <p className="panel-label">Prompt B</p>
                        <p className="panel-copy whitespace-pre-wrap">{submission.promptB}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
