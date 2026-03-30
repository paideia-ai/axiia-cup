import { createSubmissionSchema, modelOptions, type ModelOption, type Scenario, type Submission } from "@axiia/shared";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { createSubmission, getMySubmissions, getScenario } from "../lib/api";

function countText(value: string) {
  return [...value].length;
}

export function ScenarioDetailPage() {
  const { scenarioId = "" } = useParams();
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
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = createSubmissionSchema.safeParse({
      model,
      promptA,
      promptB,
      scenarioId,
    });

    if (!parsed.success) {
      setError("请检查提示词字数、模型选择和必填项");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createSubmission(parsed.data);
      const history = await getMySubmissions(scenarioId);
      setSubmissions(history);
      setToast(`提交成功，已创建 v${created.version}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "提交失败");
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
      {toast ? <div className="fixed right-6 top-20 z-50 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.12)] px-4 py-3 text-sm text-[var(--success)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">{toast}</div> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Workshop</p>
          <h1 className="page-title">{scenario.title}</h1>
          <p className="page-subtitle">提交时必须同时包含角色 A 和角色 B 的系统提示词，且每个提示词不超过 1000 字。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">{scenario.turnCount} 回合</Badge>
          <Badge tone="warning">{scenario.judgeRounds} 轮裁判提问</Badge>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>场景材料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="app-panel">
              <p className="panel-label">背景</p>
              <p className="panel-copy">{scenario.context}</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">角色 A · {scenario.roleAName}</p>
              <p className="panel-copy">{scenario.roleAPublicGoal}</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">角色 B · {scenario.roleBName}</p>
              <p className="panel-copy">{scenario.roleBPublicGoal}</p>
            </div>
            <div className="app-panel">
              <p className="panel-label">边界约束</p>
              <p className="panel-copy">{scenario.boundaryConstraints}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)]">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                type="button"
                onClick={() => setIsJudgePromptOpen((value) => !value)}
              >
                <div>
                  <p className="panel-label mb-1">公开裁判 Prompt</p>
                  <p className="text-sm text-[var(--foreground-subtle)]">按文档要求，裁判 prompt 对选手公开。</p>
                </div>
                {isJudgePromptOpen ? <ChevronUp className="h-4 w-4 text-[var(--foreground-subtle)]" /> : <ChevronDown className="h-4 w-4 text-[var(--foreground-subtle)]" />}
              </button>
              {isJudgePromptOpen ? <div className="border-t border-[var(--border-soft)] px-4 py-4 text-sm leading-7 text-[var(--foreground-subtle)] whitespace-pre-wrap">{scenario.judgePrompt}</div> : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0">
              <div className="flex flex-wrap gap-2">
                <Badge>角色 A 提示词</Badge>
                <Badge tone="info">角色 B 提示词</Badge>
              </div>
              <CardTitle>提交参赛版本</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                  <span>角色 A 系统提示词</span>
                  <textarea className="app-textarea" maxLength={1000} onChange={(event) => setPromptA(event.target.value)} value={promptA} />
                  <div className={`text-right text-xs ${promptALength > 1000 ? "text-[#f87171]" : "text-[var(--foreground-muted)]"}`}>{promptALength} / 1000</div>
                </label>
                <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                  <span>角色 B 系统提示词</span>
                  <textarea className="app-textarea" maxLength={1000} onChange={(event) => setPromptB(event.target.value)} value={promptB} />
                  <div className={`text-right text-xs ${promptBLength > 1000 ? "text-[#f87171]" : "text-[var(--foreground-muted)]"}`}>{promptBLength} / 1000</div>
                </label>
                <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                  <span>模型选择</span>
                  <select className="app-input" onChange={(event) => setModel(event.target.value as ModelOption["id"])} value={model}>
                    {modelOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex justify-end">
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "提交中..." : "提交参赛"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>提交历史</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 ? (
                <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[var(--foreground-subtle)]">
                  还没有提交记录。
                </div>
              ) : (
                submissions.map((submission) => (
                  <div key={submission.id} className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">v{submission.version}</p>
                        <p className="text-sm text-[var(--foreground-subtle)]">{submission.createdAt}</p>
                      </div>
                      <Badge tone="info">{modelOptions.find((option) => option.id === submission.model)?.label ?? submission.model}</Badge>
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
