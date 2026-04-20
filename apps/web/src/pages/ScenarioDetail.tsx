import {
  createSubmissionSchema,
  modelOptions,
  type ModelOption,
  type Scenario,
  type Submission,
} from '@axiia/shared'
import { FlaskConical, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { Select, SelectItem } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import { createSubmission, getMySubmissions, getScenario } from '../lib/api'
import { formatDateTime } from '../lib/datetime'

function countText(value: string) {
  return [...value].length
}

function buildDefaultStrategyPrompt(roleName: string) {
  return `你是${roleName}`
}

function resolveModelLabel(modelId: string) {
  return modelOptions.find((option) => option.id === modelId)?.label ?? modelId
}

function interpolatePromptTemplate(
  template: string,
  variables: Record<string, string>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in variables ? variables[key] : match
  })
}

function buildPromptPreviewList(
  items: { id: string; content: string }[],
  note?: string,
) {
  if (items.length === 0) {
    return '（无）'
  }

  return items
    .map((item) =>
      note
        ? `- ${item.id}：${item.content}（${note}）`
        : `- ${item.id}：${item.content}`,
    )
    .join('\n')
}

function buildRolePromptPreview(scenario: Scenario, side: 'a' | 'b') {
  const isRoleA = side === 'a'
  const roleName = isRoleA ? scenario.roleAName : scenario.roleBName
  const opponentName = isRoleA ? scenario.roleBName : scenario.roleAName
  const hiddenInfo = isRoleA
    ? scenario.roleAHiddenInfo
    : scenario.roleBHiddenInfo
  const requests = isRoleA ? scenario.roleARequests : scenario.roleBRequests
  const opponentRequests = isRoleA
    ? scenario.roleBRequests
    : scenario.roleARequests
  const opponentHiddenInfo = isRoleA
    ? scenario.roleBHiddenInfo
    : scenario.roleAHiddenInfo

  return interpolatePromptTemplate(scenario.agentPromptTemplate, {
    roleName,
    opponentName,
    roleAName: scenario.roleAName,
    roleBName: scenario.roleBName,
    hiddenInfo: buildPromptPreviewList(hiddenInfo, '实际运行中会随机标注真假'),
    requests:
      requests.length > 0 ? '实际的真假请求会在运行中随机分配' : '（无）',
    opponentRequests: buildPromptPreviewList(opponentRequests),
    opponentInfoIds: opponentHiddenInfo.map((item) => item.id).join('/'),
    opponentRequestIds: opponentRequests.map((item) => item.id).join('/'),
    turnCount: String(scenario.turnCount),
  })
}

const scoringRuleItems = [
  {
    title: '秦孝公支持你的立场',
    detail: '变法 / 维持现状',
    score: '+1',
    scoreClassName:
      'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  },
  {
    title: '你的真请求被秦孝公同意',
    detail: '命中真目标',
    score: '+0.5',
    scoreClassName:
      'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  },
  {
    title: '你的假请求被秦孝公同意',
    detail: '每个假请求单独结算',
    score: '-0.25',
    scoreClassName:
      'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  },
  {
    title: '你的真请求被对手猜中',
    detail: '被识破真目标',
    score: '-0.75',
    scoreClassName:
      'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-500/20',
  },
] as const

function RoleCard({
  roleName,
  hiddenInfo,
  requests,
  side,
}: {
  roleName: string
  hiddenInfo: { id: string; content: string }[]
  requests: { id: string; content: string }[]
  side: 'a' | 'b'
}) {
  const accentColor = side === 'a' ? 'var(--accent)' : 'var(--info)'

  return (
    <div className="space-y-3 rounded-xl border border-(--border-soft) bg-white/2 p-4">
      <p className="text-sm font-semibold" style={{ color: accentColor }}>
        {roleName}
      </p>

      {hiddenInfo.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-(--foreground-muted)">
            隐藏信息（{hiddenInfo.length} 条，比赛时随机指定真假）
          </p>
          <ul className="space-y-1">
            {hiddenInfo.map((item) => (
              <li
                key={item.id}
                className="text-xs leading-5 text-(--foreground-subtle) pl-2.5 border-l-2 border-(--border-soft)"
              >
                <span className="mr-1 text-(--foreground-muted)">
                  [{item.id}]
                </span>
                {item.content}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {requests.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-(--foreground-muted)">
            诉求清单（{requests.length} 条，比赛时随机选取真诉求）
          </p>
          <ul className="space-y-1">
            {requests.map((item) => (
              <li
                key={item.id}
                className="text-xs leading-5 text-(--foreground-subtle) pl-2.5 border-l-2 border-(--border-soft)"
              >
                <span className="mr-1 text-(--foreground-muted)">
                  [{item.id}]
                </span>
                {item.content}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function ScenarioDetailPage() {
  const { scenarioId = '' } = useParams()
  const navigate = useNavigate()
  const [modelA, setModelA] = useState<ModelOption['id']>(modelOptions[0]!.id)
  const [modelB, setModelB] = useState<ModelOption['id']>(modelOptions[0]!.id)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [promptA, setPromptA] = useState('')
  const [promptB, setPromptB] = useState('')
  const [selectedRoleTab, setSelectedRoleTab] = useState<'a' | 'b'>('a')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const promptALength = useMemo(() => countText(promptA), [promptA])
  const promptBLength = useMemo(() => countText(promptB), [promptB])
  const promptTemplatePreviewA = useMemo(
    () => (scenario ? buildRolePromptPreview(scenario, 'a') : ''),
    [scenario],
  )
  const promptTemplatePreviewB = useMemo(
    () => (scenario ? buildRolePromptPreview(scenario, 'b') : ''),
    [scenario],
  )

  const showScoringRules = useMemo(() => {
    if (!scenario) {
      return false
    }

    return (
      scenario.roleARequests.length > 0 &&
      scenario.roleBRequests.length > 0 &&
      Boolean(scenario.examinationQuestionTemplate)
    )
  }, [scenario])

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
          setModelA(latest.modelA as ModelOption['id'])
          setModelB(latest.modelB as ModelOption['id'])
        } else {
          setPromptA(buildDefaultStrategyPrompt(scenarioResponse.roleAName))
          setPromptB(buildDefaultStrategyPrompt(scenarioResponse.roleBName))
          setModelA(modelOptions[0]!.id)
          setModelB(modelOptions[0]!.id)
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
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsed = createSubmissionSchema.safeParse({
      modelA,
      modelB,
      promptA,
      promptB,
      scenarioId,
    })

    if (!parsed.success) {
      setError('请检查两个角色的提示词与模型是否都已填写完整')
      return
    }

    try {
      setIsSubmitting(true)
      const created = await createSubmission(parsed.data)
      const history = await getMySubmissions(scenarioId)
      setSubmissions(history)
      setToast(
        `v${created.version} 已保存 · 可去排行榜查看往期对局，学习优秀策略`,
      )
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
          <span>{toast}</span>
          <Link
            to="/leaderboard"
            className="shrink-0 text-xs font-medium text-(--accent) hover:underline"
            onClick={() => setToast(null)}
          >
            排行榜 →
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">场景工坊</p>
          <h1 className="page-title">{scenario.title}</h1>
          <p className="page-subtitle">写一段策略让你的 AI 在辩论中胜出</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">{scenario.turnCount} 回合</Badge>
        </div>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Scene Materials (reference, sticky) ── */}
        <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <ScrollArea className="h-full">
            <Card>
              <CardContent className="space-y-3">
                <Accordion multiple defaultValue={['roles']}>
                  <AccordionItem value="roles" title="角色详情">
                    <div className="space-y-3">
                      <RoleCard
                        roleName={scenario.roleAName}
                        hiddenInfo={scenario.roleAHiddenInfo}
                        requests={scenario.roleARequests}
                        side="a"
                      />
                      <RoleCard
                        roleName={scenario.roleBName}
                        hiddenInfo={scenario.roleBHiddenInfo}
                        requests={scenario.roleBRequests}
                        side="b"
                      />
                    </div>
                  </AccordionItem>

                  <AccordionItem value="scoring" title="机制参数">
                    <div className="space-y-3 text-xs leading-5 text-(--foreground-subtle)">
                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-3 py-2">
                          <p className="text-[11px] text-(--foreground-muted)">
                            对话回合
                          </p>
                          <p className="text-base font-semibold text-(--foreground)">
                            {scenario.turnCount}
                          </p>
                        </div>
                        {scenario.roleAHiddenInfo.length > 0 ? (
                          <div className="rounded-lg border border-(--border-soft) bg-white/3 px-3 py-2">
                            <p className="text-[11px] text-(--foreground-muted)">
                              虚假信息数
                            </p>
                            <p className="text-base font-semibold text-(--foreground)">
                              {scenario.falseInfoCount}
                            </p>
                          </div>
                        ) : null}
                        {scenario.roleARequests.length > 0 ? (
                          <div className="rounded-lg border border-(--border-soft) bg-white/3 px-3 py-2">
                            <p className="text-[11px] text-(--foreground-muted)">
                              真诉求数
                            </p>
                            <p className="text-base font-semibold text-(--foreground)">
                              {scenario.trueRequestCount}
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <p className="text-(--foreground-muted)">
                        {scenario.roleAHiddenInfo.length > 0 &&
                          `每场比赛会随机从隐藏信息中选 ${scenario.falseInfoCount} 条指定为假。`}
                        {scenario.roleARequests.length > 0 &&
                          `从诉求中随机选 ${scenario.trueRequestCount} 条作为真诉求。`}
                        {(scenario.roleAHiddenInfo.length > 0 ||
                          scenario.roleARequests.length > 0) &&
                          ' AI 在对话前就会知道自己的真假分配。'}
                      </p>
                    </div>
                  </AccordionItem>

                  <AccordionItem value="more-rules" title="更多规则">
                    <Accordion multiple>
                      <AccordionItem value="flow" title="比赛流程">
                        <ol className="space-y-2 text-xs leading-5 text-(--foreground-subtle) list-decimal list-inside">
                          <li>
                            <span className="font-medium text-(--foreground)">
                              对话阶段
                            </span>
                            ：双方进行 {scenario.turnCount}{' '}
                            轮对话，各自根据策略提示词行动
                          </li>
                          {scenario.examinationQuestionTemplate ? (
                            <li>
                              <span className="font-medium text-(--foreground)">
                                问询阶段
                              </span>
                              ：裁判分别向双方提问，双方独立作答（互不可见）
                            </li>
                          ) : null}
                          <li>
                            <span className="font-medium text-(--foreground)">
                              裁决阶段
                            </span>
                            ：裁判综合辩论内容做出最终裁决
                          </li>
                          <li>
                            <span className="font-medium text-(--foreground)">
                              计分阶段
                            </span>
                            ：系统根据裁决结果计算双方得分，判定胜负
                          </li>
                        </ol>
                      </AccordionItem>

                      {showScoringRules ? (
                        <AccordionItem value="score-rules" title="计分规则">
                          <div className="space-y-3 text-xs leading-5 text-(--foreground-subtle)">
                            <p className="text-[11px] text-(--foreground-muted)">
                              每局双方独立计分，得分高者胜。
                            </p>
                            <div className="space-y-2">
                              {scoringRuleItems.map((rule) => (
                                <div
                                  key={rule.title}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-(--border-soft) bg-white/2 px-3 py-2.5"
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <p className="text-xs font-medium text-(--foreground)">
                                      {rule.title}
                                    </p>
                                    <p className="text-[11px] text-(--foreground-muted)">
                                      {rule.detail}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${rule.scoreClassName}`}
                                  >
                                    {rule.score}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-(--foreground-muted)">
                              假请求的扣分按被同意的个数累计；真请求一旦被对手猜中，额外扣
                              0.75 分。
                            </p>
                          </div>
                        </AccordionItem>
                      ) : null}

                      <AccordionItem value="judge" title="裁判的视角与判决逻辑">
                        <p className="whitespace-pre-wrap text-xs leading-5 text-(--foreground-subtle)">
                          {scenario.judgePrompt}
                        </p>
                      </AccordionItem>
                    </Accordion>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>

        {/* ── Right: Prompt Editor + Version History ── */}
        <div className="order-1 space-y-6 lg:order-2">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0">
              <CardTitle>编写策略提示词</CardTitle>
              <p className="text-sm leading-6 text-(--foreground-subtle)">
                保存后可在试炼场测试效果，比赛前自动使用最新版本。
              </p>
            </CardHeader>
            {!localStorage.getItem('axiia-quickstart-dismissed') && (
              <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.06)] px-4 py-3">
                <div className="min-w-0 flex-1 space-y-1 text-xs leading-5 text-(--foreground-subtle)">
                  <p className="font-semibold text-(--foreground)">快速上手</p>
                  <p>
                    你的{scenario.roleAName}会对阵别人的
                    {scenario.roleBName}，你的{scenario.roleBName}
                    会对阵别人的{scenario.roleAName}
                    。写一段策略告诉 AI 怎么赢得辩论，100 字就够开始。
                  </p>
                  <Link
                    to="/leaderboard"
                    className="inline-block text-xs font-medium text-(--accent) hover:opacity-80"
                  >
                    去排行榜看看别人怎么打的 →
                  </Link>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-(--foreground-muted) transition hover:bg-white/8 hover:text-(--foreground)"
                  onClick={(e) => {
                    localStorage.setItem('axiia-quickstart-dismissed', '1')
                    const card = (e.target as HTMLElement).closest(
                      '[class*="mx-6"]',
                    )
                    card?.remove()
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSave}>
                <Tabs
                  value={selectedRoleTab}
                  onValueChange={(value) =>
                    setSelectedRoleTab(value === 'b' ? 'b' : 'a')
                  }
                >
                  <TabsList>
                    <TabsTrigger value="a">{scenario.roleAName}</TabsTrigger>
                    <TabsTrigger value="b">{scenario.roleBName}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="a" className="space-y-3">
                    <div className="rounded-lg border border-(--border-soft) px-3">
                      <Accordion defaultValue={[]}>
                        <AccordionItem
                          value="template"
                          title="系统预设角色提示词"
                        >
                          <pre className="whitespace-pre-wrap text-[11px] leading-5 text-(--foreground-subtle) font-mono">
                            {promptTemplatePreviewA}
                          </pre>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    <div className="space-y-1.5">
                      <Textarea
                        className="min-h-55"
                        maxLength={1000}
                        onChange={(event) => setPromptA(event.target.value)}
                        placeholder={`例如：在辩论中强调变法对军事力量的具体提升，用历史战例作为论据…`}
                        value={promptA}
                      />
                      {1000 - promptALength < 200 ? (
                        <p
                          className={`text-right text-xs tabular-nums ${promptALength > 1000 ? 'text-(--accent)' : 'text-(--foreground-muted)'}`}
                        >
                          还剩 {1000 - promptALength} 字
                        </p>
                      ) : null}
                    </div>
                  </TabsContent>
                  <TabsContent value="b" className="space-y-3">
                    <div className="rounded-lg border border-(--border-soft) px-3">
                      <Accordion defaultValue={[]}>
                        <AccordionItem
                          value="template"
                          title="系统预设角色提示词"
                        >
                          <pre className="whitespace-pre-wrap text-[11px] leading-5 text-(--foreground-subtle) font-mono">
                            {promptTemplatePreviewB}
                          </pre>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    <div className="space-y-1.5 mb-6">
                      <Textarea
                        className="min-h-55"
                        maxLength={1000}
                        onChange={(event) => setPromptB(event.target.value)}
                        placeholder={`例如：强调祖制的稳定性，质疑对手方案的可行性和成本…`}
                        value={promptB}
                      />
                      {1000 - promptBLength < 200 ? (
                        <p
                          className={`text-right text-xs tabular-nums ${promptBLength > 1000 ? 'text-(--accent)' : 'text-(--foreground-muted)'}`}
                        >
                          还剩 {1000 - promptBLength} 字
                        </p>
                      ) : null}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-col justify-center items-center gap-4 lg:flex-row lg:items-end">
                  <label className="block w-full text-sm text-(--foreground-subtle) lg:flex-1">
                    <span title="模型影响 AI 的表达风格和推理能力">
                      {scenario.roleAName} 模型
                    </span>
                    <Select
                      value={modelA}
                      onValueChange={(value) => {
                        if (value) setModelA(value as ModelOption['id'])
                      }}
                      renderValue={(value) => resolveModelLabel(value)}
                      className="w-full"
                    >
                      {modelOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </label>
                  <label className="block w-full text-sm text-(--foreground-subtle) lg:flex-1">
                    <span title="模型影响 AI 的表达风格和推理能力">
                      {scenario.roleBName} 模型
                    </span>
                    <Select
                      value={modelB}
                      onValueChange={(value) => {
                        if (value) setModelB(value as ModelOption['id'])
                      }}
                      renderValue={(value) => resolveModelLabel(value)}
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
                <p className="text-center text-[11px] text-(--foreground-muted)">
                  你可以随时修改，比赛前自动使用最新版本。
                </p>
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
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="shrink-0 font-semibold text-(--foreground)">
                          v{submission.version}
                        </p>
                        <Badge
                          tone="accent"
                          className="shrink-0 whitespace-nowrap"
                        >
                          {scenario.roleAName} ·{' '}
                          {resolveModelLabel(submission.modelA)}
                        </Badge>
                        <Badge
                          tone="info"
                          className="shrink-0 whitespace-nowrap"
                        >
                          {scenario.roleBName} ·{' '}
                          {resolveModelLabel(submission.modelB)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="whitespace-nowrap text-xs text-(--foreground-muted)">
                          {formatDateTime(submission.createdAt, {
                            second: '2-digit',
                          })}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="shrink-0 whitespace-nowrap"
                          onClick={() =>
                            navigate(`/playground/${submission.id}`)
                          }
                        >
                          <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                          前往试炼场
                        </Button>
                      </div>
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
