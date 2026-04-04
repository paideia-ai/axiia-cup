import {
  createSubmissionSchema,
  modelOptions,
  type ModelOption,
  type Scenario,
  type Submission,
} from '@axiia/shared'
import { FlaskConical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import { createSubmission, getMySubmissions, getScenario } from '../lib/api'

function countText(value: string) {
  return [...value].length
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
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-(--foreground)">{roleName}</p>
      <p className="whitespace-pre-wrap text-xs leading-5 text-(--foreground-subtle)">
        {roleCard}
      </p>
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
    return <p className="text-sm text-(--accent)">{error}</p>
  }

  if (!scenario) {
    return <p className="text-sm text-(--foreground-subtle)">场景不存在。</p>
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-(--success)" />
          {toast}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">Scenario</p>
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

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Scene Materials (reference, sticky) ── */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:scrollbar-thin">
          <Card>
            <CardContent className="space-y-3">
              <Accordion defaultValue={['context']}>
                <AccordionItem value="context" title="场景背景">
                  <p className="text-xs leading-5 text-(--foreground-subtle)">
                    {scenario.context}
                  </p>
                </AccordionItem>
                <AccordionItem value="boundary" title="边界约束">
                  <p className="text-xs leading-5 text-(--foreground-subtle)">
                    {scenario.boundaryConstraints}
                  </p>
                </AccordionItem>
                <AccordionItem value="judge" title="裁判规则">
                  <p className="whitespace-pre-wrap text-xs leading-5 text-(--foreground-subtle)">
                    {scenario.judgePrompt}
                  </p>
                </AccordionItem>
              </Accordion>

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
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Prompt Editor + Version History ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0">
              <CardTitle>编写策略提示词</CardTitle>
              <p className="text-sm leading-6 text-(--foreground-subtle)">
                每次保存会创建一个新版本。比赛由管理员开启，届时将自动使用你的最新版本参赛。
              </p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSave}>
                <Tabs defaultValue="a" className="space-y-0">
                  <TabsList>
                    <TabsTrigger value="a">{scenario.roleAName}</TabsTrigger>
                    <TabsTrigger value="b">{scenario.roleBName}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="a" className="pt-4 space-y-1.5">
                    <Textarea
                      className="min-h-55"
                      maxLength={1000}
                      onChange={(event) => setPromptA(event.target.value)}
                      placeholder={`为 ${scenario.roleAName} 编写策略提示词…`}
                      value={promptA}
                    />
                    <p
                      className={`text-right text-xs tabular-nums ${promptALength > 1000 ? 'text-(--accent)' : 'text-(--foreground-muted)'}`}
                    >
                      {promptALength} / 1000
                    </p>
                  </TabsContent>
                  <TabsContent value="b" className="pt-4 space-y-1.5">
                    <Textarea
                      className="min-h-55"
                      maxLength={1000}
                      onChange={(event) => setPromptB(event.target.value)}
                      placeholder={`为 ${scenario.roleBName} 编写策略提示词…`}
                      value={promptB}
                    />
                    <p
                      className={`text-right text-xs tabular-nums ${promptBLength > 1000 ? 'text-(--accent)' : 'text-(--foreground-muted)'}`}
                    >
                      {promptBLength} / 1000
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="flex items-end justify-between gap-4">
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>模型选择</span>
                    <Select
                      value={model}
                      onValueChange={(v) => {
                        if (v) setModel(v as ModelOption['id'])
                      }}
                      className="w-full"
                    >
                      {modelOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </label>
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? '保存中…' : '保存版本'}
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
                    className="rounded-xl border border-(--border-soft) bg-white/2 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-(--foreground)">
                          v{submission.version}
                        </p>
                        <Badge tone="info">
                          {modelOptions.find((o) => o.id === submission.model)
                            ?.label ?? submission.model}
                        </Badge>
                        <span className="text-xs text-(--foreground-muted)">
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
      </div>
    </div>
  )
}
