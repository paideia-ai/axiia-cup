import {
  createSubmissionSchema,
  modelOptions,
  type ModelOption,
  type Scenario,
  type Submission,
} from '@axiia/shared'
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { createSubmission, getMySubmissions, getScenario } from '../lib/api'

function countText(value: string) {
  return [...value].length
}

function Collapsible({
  children,
  defaultOpen = false,
  title,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
  title: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)]">
      <button
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground-subtle)] transition hover:text-[var(--foreground)]"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--foreground-muted)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--foreground-muted)]" />
        )}
        {title}
      </button>
      {isOpen ? (
        <div className="border-t border-[var(--border-soft)] px-3 py-3">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function RoleCard({
  roleName,
  roleCard,
  side,
}: {
  roleName: string
  roleCard: string
  side: 'a' | 'b'
}) {
  const accent = side === 'a' ? 'rgba(224,74,47,0.15)' : 'rgba(99,102,241,0.15)'
  const border = side === 'a' ? 'rgba(224,74,47,0.22)' : 'rgba(99,102,241,0.22)'

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ background: accent, borderColor: border }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
          角色卡 {side.toUpperCase()}
        </span>
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {roleName}
        </span>
      </div>
      <div className="whitespace-pre-wrap text-xs leading-5 text-[var(--foreground-subtle)]">
        {roleCard}
      </div>
    </div>
  )
}

export function ScenarioDetailPage() {
  const { scenarioId = '' } = useParams()
  const navigate = useNavigate()
  const [model, setModel] = useState<ModelOption['id']>(modelOptions[0]!.id)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [promptA, setPromptA] = useState('')
  const [promptB, setPromptB] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const promptALength = useMemo(() => countText(promptA), [promptA])
  const promptBLength = useMemo(() => countText(promptB), [promptB])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [scenarioResponse, submissionsResponse] = await Promise.all([
          getScenario(scenarioId),
          getMySubmissions(scenarioId),
        ])

        setScenario(scenarioResponse)
        setSubmissions(submissionsResponse)

        // Pre-fill from latest version
        const latest = submissionsResponse[0]
        if (latest) {
          setPromptA(latest.promptA)
          setPromptB(latest.promptB)
          setModel(latest.model as ModelOption['id'])
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : '加载场景失败',
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (scenarioId) {
      void load()
    }
  }, [scenarioId])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsed = createSubmissionSchema.safeParse({
      model,
      promptA,
      promptB,
      scenarioId,
    })

    if (!parsed.success) {
      setError('请检查提示词字数、模型选择和必填项')
      return
    }

    try {
      setIsSubmitting(true)
      const created = await createSubmission(parsed.data)
      const history = await getMySubmissions(scenarioId)
      setSubmissions(history)
      setToast(`v${created.version} 已保存`)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : '保存失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-white/8" />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="h-[640px] animate-pulse rounded-xl bg-white/5" />
          <div className="h-80 animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (error && !scenario) {
    return (
      <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
        {error}
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-subtle)]">
        场景不存在。
      </div>
    )
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
          <h1 className="page-title">{scenario.title}</h1>
          <p className="page-subtitle">
            你只需编写每个角色的策略提示词。系统会自动拼接场景背景、角色卡、对手公开信息与边界约束。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">{scenario.turnCount} 回合</Badge>
          <Badge tone="warning">{scenario.judgeRounds} 轮裁判追问</Badge>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#f87171]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── Left: Prompt Editor (primary) + Version History ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0">
              <CardTitle>编写策略提示词</CardTitle>
              <p className="text-sm leading-6 text-[var(--foreground-subtle)]">
                每次保存会创建一个新版本。比赛由管理员开启，届时将自动使用你的最新版本参赛。
              </p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSave}>
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                    <span>
                      角色 A 策略提示词
                      <span className="ml-1 text-[var(--foreground-muted)]">
                        · {scenario.roleAName}
                      </span>
                    </span>
                    <textarea
                      className="app-textarea min-h-[180px]"
                      maxLength={1000}
                      onChange={(event) => setPromptA(event.target.value)}
                      value={promptA}
                    />
                    <div
                      className={`text-right text-xs ${promptALength > 1000 ? 'text-[#f87171]' : 'text-[var(--foreground-muted)]'}`}
                    >
                      {promptALength} / 1000
                    </div>
                  </label>
                  <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                    <span>
                      角色 B 策略提示词
                      <span className="ml-1 text-[var(--foreground-muted)]">
                        · {scenario.roleBName}
                      </span>
                    </span>
                    <textarea
                      className="app-textarea min-h-[180px]"
                      maxLength={1000}
                      onChange={(event) => setPromptB(event.target.value)}
                      value={promptB}
                    />
                    <div
                      className={`text-right text-xs ${promptBLength > 1000 ? 'text-[#f87171]' : 'text-[var(--foreground-muted)]'}`}
                    >
                      {promptBLength} / 1000
                    </div>
                  </label>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                    <span>模型选择</span>
                    <select
                      className="app-input"
                      onChange={(event) =>
                        setModel(event.target.value as ModelOption['id'])
                      }
                      value={model}
                    >
                      {modelOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? '保存中...' : '保存版本'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Version History ── */}
          {submissions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>版本历史</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-xl border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-[var(--foreground)]">
                          v{submission.version}
                        </p>
                        <Badge tone="info">
                          {modelOptions.find((o) => o.id === submission.model)
                            ?.label ?? submission.model}
                        </Badge>
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {submission.createdAt}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/playground/${submission.id}`)}
                      >
                        <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                        前往试炼场
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ── Right: Scene Materials (reference sidebar, sticky) ── */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:scrollbar-thin">
          <Card>
            <CardHeader>
              <CardTitle>场景材料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Collapsible title="场景背景" defaultOpen>
                <p className="text-xs leading-5 text-[var(--foreground-subtle)]">
                  {scenario.context}
                </p>
              </Collapsible>

              <RoleCard
                side="a"
                roleName={scenario.roleAName}
                roleCard={scenario.roleAPublicGoal}
              />
              <RoleCard
                side="b"
                roleName={scenario.roleBName}
                roleCard={scenario.roleBPublicGoal}
              />

              <Collapsible title="边界约束">
                <p className="text-xs leading-5 text-[var(--foreground-subtle)]">
                  {scenario.boundaryConstraints}
                </p>
              </Collapsible>

              <Collapsible title="公开裁判规则">
                <p className="text-xs leading-5 text-[var(--foreground-subtle)] whitespace-pre-wrap">
                  {scenario.judgePrompt}
                </p>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
