import {
  modelOptions,
  type AdminScenario,
  type PresetOpponent,
  type UpdateScenario,
} from '@axiia/shared'
import { ArrowLeft, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import {
  createPresetOpponent,
  deletePresetOpponent,
  getAdminScenarios,
  getPresetOpponents,
  updateAdminScenario,
  updatePresetOpponent,
} from '../lib/api'

function getScenarioUpdateInput(scenario: AdminScenario): UpdateScenario {
  return {
    turnCount: scenario.turnCount,
    judgeModel: scenario.judgeModel,
    judgePrompt: scenario.judgePrompt,
    openingLine: scenario.openingLine,
    agentPromptTemplate: scenario.agentPromptTemplate,
    examinationQuestionTemplate: scenario.examinationQuestionTemplate,
    scorerPrompt: scenario.scorerPrompt,
    roleAName: scenario.roleAName,
    roleAHiddenInfo: scenario.roleAHiddenInfo,
    roleARequests: scenario.roleARequests,
    roleBName: scenario.roleBName,
    roleBHiddenInfo: scenario.roleBHiddenInfo,
    roleBRequests: scenario.roleBRequests,
    falseInfoCount: scenario.falseInfoCount,
    trueRequestCount: scenario.trueRequestCount,
  }
}

type PromptVariableItem = {
  description: string
  token: string
}

type PromptVariableCategory = {
  items: PromptVariableItem[]
  title: string
}

type PromptVariableSection = {
  categories: PromptVariableCategory[]
  summary: string
  title: string
  value: string
}

const promptVariableSections: PromptVariableSection[] = [
  {
    value: 'agent',
    title: 'Agent 模板',
    summary: '用于角色系统提示词。会分别以角色 A / B 的视角渲染一次。',
    categories: [
      {
        title: '当前角色',
        items: [
          { token: '{{roleName}}', description: '当前角色名称。' },
          { token: '{{opponentName}}', description: '对手角色名称。' },
          { token: '{{roleAName}}', description: '角色 A 名称。' },
          { token: '{{roleBName}}', description: '角色 B 名称。' },
          {
            token: '{{hiddenInfo}}',
            description: '当前角色隐藏信息列表，已带本局真/假标记。',
          },
          {
            token: '{{requests}}',
            description: '当前角色诉求列表，已带本局真请求/假请求标记。',
          },
          {
            token: '{{opponentRequests}}',
            description: '对手诉求列表，只展示 ID 与内容。',
          },
          {
            token: '{{opponentInfoIds}}',
            description: '对手隐藏信息 ID 列表。',
          },
          {
            token: '{{opponentRequestIds}}',
            description: '对手诉求 ID 列表。',
          },
          { token: '{{turnCount}}', description: '对话轮数。' },
        ],
      },
    ],
  },
  {
    value: 'judge',
    title: '裁判模板',
    summary:
      '用于裁判系统提示词，可以引用双方整体材料，也可以引用单条隐藏信息或诉求。',
    categories: [
      {
        title: '角色与对话',
        items: [
          { token: '{{roleAName}}', description: '角色 A 名称。' },
          { token: '{{roleBName}}', description: '角色 B 名称。' },
          { token: '{{turnCount}}', description: '对话轮数。' },
          { token: '{{debate}}', description: '双方对话记录。' },
          { token: '{{examinationA}}', description: '角色 A 审讯记录。' },
          { token: '{{examinationB}}', description: '角色 B 审讯记录。' },
        ],
      },
      {
        title: '角色材料',
        items: [
          {
            token: '{{roleAHiddenInfo}}',
            description: '角色 A 隐藏信息清单，已带真假标记。',
          },
          {
            token: '{{roleBHiddenInfo}}',
            description: '角色 B 隐藏信息清单，已带真假标记。',
          },
          {
            token: '{{roleARequests}}',
            description: '角色 A 诉求清单，已带真/假目标标记。',
          },
          {
            token: '{{roleBRequests}}',
            description: '角色 B 诉求清单，已带真/假目标标记。',
          },
        ],
      },
      {
        title: '单条信息 / 诉求',
        items: [
          {
            token: '{{<隐藏信息ID或请求ID>_LABEL}}',
            description:
              '按 ID 替换成标签。隐藏信息输出“确有其事 / 子虚乌有”，诉求输出“真目标 / 假目标”。',
          },
          {
            token: '{{<隐藏信息ID或请求ID>_CONTENT}}',
            description: '按 ID 替换成对应隐藏信息或诉求的原文内容。',
          },
        ],
      },
    ],
  },
  {
    value: 'examination',
    title: '审讯模板',
    summary: '用于第二阶段问询模板。会分别以角色 A / B 的回答视角渲染一次。',
    categories: [
      {
        title: '当前回答方',
        items: [
          { token: '{{roleName}}', description: '当前被问询角色名称。' },
          { token: '{{opponentName}}', description: '对手角色名称。' },
          {
            token: '{{opponentInfoIds}}',
            description: '当前可供选择的对手隐藏信息 ID 列表，例如 G1/G2/G3。',
          },
          {
            token: '{{opponentRequestIds}}',
            description: '当前可供选择的对手诉求 ID 列表。',
          },
        ],
      },
    ],
  },
  {
    value: 'scorer',
    title: '评分模板',
    summary: '用于评分器提示词，根据裁判输出和信息分配计算最终得分。',
    categories: [
      {
        title: '角色与对话',
        items: [
          { token: '{{roleAName}}', description: '角色 A 名称。' },
          { token: '{{roleBName}}', description: '角色 B 名称。' },
          { token: '{{judgeOutput}}', description: '裁判输出内容。' },
          { token: '{{infoAssignment}}', description: '本局信息分配。' },
          { token: '{{debate}}', description: '双方对话记录。' },
          { token: '{{examinationA}}', description: '角色 A 审讯记录。' },
          { token: '{{examinationB}}', description: '角色 B 审讯记录。' },
        ],
      },
      {
        title: '角色材料',
        items: [
          {
            token: '{{roleARequests}}',
            description: '角色 A 诉求清单，已带真/假目标标记。',
          },
          {
            token: '{{roleBRequests}}',
            description: '角色 B 诉求清单，已带真/假目标标记。',
          },
          {
            token: '{{roleAHiddenInfo}}',
            description: '角色 A 隐藏信息清单，已带真假标记。',
          },
          {
            token: '{{roleBHiddenInfo}}',
            description: '角色 B 隐藏信息清单，已带真假标记。',
          },
        ],
      },
      {
        title: '单条信息 / 诉求',
        items: [
          {
            token: '{{<隐藏信息ID或请求ID>_LABEL}}',
            description:
              '按 ID 替换成标签。隐藏信息输出“确有其事 / 子虚乌有”，诉求输出“真目标 / 假目标”。',
          },
          {
            token: '{{<隐藏信息ID或请求ID>_CONTENT}}',
            description: '按 ID 替换成对应隐藏信息或诉求的原文内容。',
          },
        ],
      },
    ],
  },
]

function buildTemplateExamples(
  items: { id: string }[],
  suffix: 'CONTENT' | 'LABEL',
) {
  return items
    .map((item) => item.id.trim())
    .filter(Boolean)
    .map((id) => `{{${id}_${suffix}}}`)
}

function PromptVariableGuide({ draft }: { draft: UpdateScenario }) {
  const hiddenInfoLabelExamples = [
    ...buildTemplateExamples(draft.roleAHiddenInfo, 'LABEL'),
    ...buildTemplateExamples(draft.roleBHiddenInfo, 'LABEL'),
  ]
  const hiddenInfoContentExamples = [
    ...buildTemplateExamples(draft.roleAHiddenInfo, 'CONTENT'),
    ...buildTemplateExamples(draft.roleBHiddenInfo, 'CONTENT'),
  ]
  const requestLabelExamples = [
    ...buildTemplateExamples(draft.roleARequests, 'LABEL'),
    ...buildTemplateExamples(draft.roleBRequests, 'LABEL'),
  ]
  const requestContentExamples = [
    ...buildTemplateExamples(draft.roleARequests, 'CONTENT'),
    ...buildTemplateExamples(draft.roleBRequests, 'CONTENT'),
  ]

  return (
    <div className="space-y-3 rounded-xl border border-(--border-soft) bg-white/2 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--foreground)">变量说明</p>
        <p className="text-xs leading-5 text-(--foreground-muted)">
          按模板类型和用途分类说明。裁判/评分模板中的动态变量会根据右侧配置的隐藏信息
          ID 与诉求 ID 自动生成，两者共享同一变量命名空间。
        </p>
      </div>

      <Accordion
        multiple
        defaultValue={['agent', 'judge', 'examination', 'scorer']}
      >
        {promptVariableSections.map((section) => (
          <AccordionItem
            key={section.value}
            value={section.value}
            title={section.title}
          >
            <div className="space-y-3">
              <p className="text-xs leading-5 text-(--foreground-muted)">
                {section.summary}
              </p>

              {section.categories.map((category) => (
                <div
                  key={category.title}
                  className="space-y-2 rounded-lg border border-(--border-soft) bg-black/10 p-3"
                >
                  <p className="text-xs font-medium text-(--foreground)">
                    {category.title}
                  </p>
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <div
                        key={item.token}
                        className="grid gap-1 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-3"
                      >
                        <code className="rounded bg-white/8 px-2 py-1 font-mono text-[11px] text-(--foreground-subtle)">
                          {item.token}
                        </code>
                        <p className="text-xs leading-5 text-(--foreground-muted)">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {section.value === 'judge' || section.value === 'scorer' ? (
                <div className="space-y-2 rounded-lg border border-(--border-soft) bg-white/3 p-3">
                  <p className="text-xs font-medium text-(--foreground)">
                    当前场景动态示例
                  </p>
                  <p className="text-[11px] leading-5 text-(--foreground-muted)">
                    这些示例会随着右侧隐藏信息 ID 与诉求 ID
                    变化，方便管理员确认命名是否正确。
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-[11px] text-(--foreground-subtle)">
                        隐藏信息标签变量
                      </p>
                      <p className="font-mono text-[11px] leading-5 text-(--foreground-muted)">
                        {hiddenInfoLabelExamples.length > 0
                          ? hiddenInfoLabelExamples.join('、')
                          : '当前还没有可展示的隐藏信息 ID'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-(--foreground-subtle)">
                        隐藏信息内容变量
                      </p>
                      <p className="font-mono text-[11px] leading-5 text-(--foreground-muted)">
                        {hiddenInfoContentExamples.length > 0
                          ? hiddenInfoContentExamples.join('、')
                          : '当前还没有可展示的隐藏信息 ID'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-(--foreground-subtle)">
                        诉求标签变量
                      </p>
                      <p className="font-mono text-[11px] leading-5 text-(--foreground-muted)">
                        {requestLabelExamples.length > 0
                          ? requestLabelExamples.join('、')
                          : '当前还没有可展示的诉求 ID'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-(--foreground-subtle)">
                        诉求内容变量
                      </p>
                      <p className="font-mono text-[11px] leading-5 text-(--foreground-muted)">
                        {requestContentExamples.length > 0
                          ? requestContentExamples.join('、')
                          : '当前还没有可展示的诉求 ID'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function IdContentListEditor({
  helperText,
  items,
  label,
  onChange,
}: {
  helperText?: string
  items: { id: string; content: string }[]
  label: string
  onChange: (items: { id: string; content: string }[]) => void
}) {
  return (
    <div className="space-y-2 text-sm text-(--foreground-subtle)">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            onChange([...items, { id: `${items.length + 1}`, content: '' }])
          }
        >
          + 添加
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-(--foreground-muted)">暂无条目</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg border border-(--border-soft) bg-white/2 p-2"
            >
              <Input
                className="w-20 shrink-0"
                placeholder="ID"
                value={item.id}
                onChange={(event) => {
                  const next = [...items]
                  next[index] = { ...item, id: event.target.value }
                  onChange(next)
                }}
              />
              <Input
                className="flex-1"
                placeholder="内容"
                value={item.content}
                onChange={(event) => {
                  const next = [...items]
                  next[index] = { ...item, content: event.target.value }
                  onChange(next)
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-(--accent)"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                删除
              </Button>
            </div>
          ))}
        </div>
      )}
      {helperText ? (
        <p className="text-[11px] text-(--foreground-muted)">{helperText}</p>
      ) : null}
    </div>
  )
}

function RolePresetOpponentsEditor({
  scenarioId,
  role,
  roleName,
  presets,
  onPresetsChange,
}: {
  scenarioId: string
  role: 'a' | 'b'
  roleName: string
  presets: PresetOpponent[]
  onPresetsChange: (
    updater: (prev: PresetOpponent[]) => PresetOpponent[],
  ) => void
}) {
  const [newLabel, setNewLabel] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rolePresets = presets.filter((p) => p.role === role)

  const handleCreate = async () => {
    if (!newLabel.trim() || !newPrompt.trim()) return
    try {
      setIsSaving(true)
      setError(null)
      const created = await createPresetOpponent({
        scenarioId,
        role,
        label: newLabel.trim(),
        prompt: newPrompt.trim(),
      })
      onPresetsChange((prev) => [...prev, created])
      setNewLabel('')
      setNewPrompt('')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editLabel.trim() || !editPrompt.trim()) return
    try {
      setIsSaving(true)
      setError(null)
      const updated = await updatePresetOpponent(id, {
        label: editLabel.trim(),
        prompt: editPrompt.trim(),
      })
      onPresetsChange((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditingId(null)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '更新失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setError(null)
      await deletePresetOpponent(id)
      onPresetsChange((prev) => prev.filter((p) => p.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-(--foreground-subtle)">
        预设对手 Prompt
      </p>
      <p className="text-[11px] text-(--foreground-muted)">
        玩家可在试炼场选择预设对手替换{roleName}的 Prompt 进行对战。
      </p>

      {error ? <p className="text-xs text-(--accent)">{error}</p> : null}

      {rolePresets.length > 0 ? (
        <div className="space-y-2">
          {rolePresets.map((preset) => (
            <div
              key={preset.id}
              className="rounded-lg border border-(--border-soft) bg-white/2 p-3 space-y-2"
            >
              {editingId === preset.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="名称"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                  />
                  <Textarea
                    className="min-h-20"
                    placeholder="Prompt"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isSaving}
                      onClick={() => void handleUpdate(preset.id)}
                    >
                      {isSaving ? '保存中…' : '保存'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-(--foreground)">
                      {preset.label}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="text-[11px] text-(--foreground-muted) hover:text-(--foreground)"
                        onClick={() => {
                          setEditingId(preset.id)
                          setEditLabel(preset.label)
                          setEditPrompt(preset.prompt)
                        }}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-(--accent) hover:text-(--accent)/80"
                        onClick={() => void handleDelete(preset.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-(--foreground-subtle) whitespace-pre-wrap line-clamp-3">
                    {preset.prompt}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-(--foreground-muted)">暂无预设对手。</p>
      )}

      {/* Add new */}
      <div className="space-y-2 rounded-lg border border-dashed border-(--border-soft) p-3">
        <p className="text-[11px] font-medium text-(--foreground-muted)">
          添加预设
        </p>
        <Input
          placeholder="名称（如：基础保守型）"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <Textarea
          className="min-h-20"
          placeholder="预设对手 Prompt"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
        />
        <Button
          size="sm"
          disabled={isSaving || !newLabel.trim() || !newPrompt.trim()}
          onClick={() => void handleCreate()}
        >
          {isSaving ? '添加中…' : '添加'}
        </Button>
      </div>
    </div>
  )
}

export function AdminScenarioEditPage() {
  const { scenarioId = '' } = useParams()
  const navigate = useNavigate()
  const [scenario, setScenario] = useState<AdminScenario | null>(null)
  const [draft, setDraft] = useState<UpdateScenario | null>(null)
  const [presets, setPresets] = useState<PresetOpponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [scenarios, presetData] = await Promise.all([
          getAdminScenarios(),
          getPresetOpponents(scenarioId),
        ])
        const found = scenarios.find((s) => s.id === scenarioId) ?? null
        setScenario(found)
        setPresets(presetData)
        if (found) {
          setDraft(getScenarioUpdateInput(found))
        } else {
          setError('场景不存在')
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

  const handleSave = async () => {
    if (!scenario || !draft) return

    try {
      setIsSaving(true)
      setError(null)
      const updated = await updateAdminScenario(scenario.id, draft)
      setScenario(updated)
      setDraft(getScenarioUpdateInput(updated))
      setToast('场景已保存')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存场景失败')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-white/8" />
        <div className="h-[600px] animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  if (!scenario || !draft) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1 text-xs text-(--foreground-muted) hover:text-(--foreground-subtle)"
        >
          <ArrowLeft className="h-3 w-3" />
          返回管理面板
        </button>
        <p className="text-sm text-(--accent)">{error ?? '场景不存在'}</p>
      </div>
    )
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
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="mb-2 flex items-center gap-1 text-xs text-(--foreground-muted) hover:text-(--foreground-subtle)"
          >
            <ArrowLeft className="h-3 w-3" />
            返回管理面板
          </button>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">编辑场景 · {scenario.title}</h1>
          <p className="page-subtitle">
            修改场景配置、角色信息、隐藏信息、诉求和提示词模板。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenario.locked ? (
            <Badge className="gap-1" tone="warning">
              <Lock size={12} />
              比赛进行中，已锁定
            </Badge>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Left column ── */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>对话轮数</span>
                    <Input
                      max={50}
                      min={1}
                      onChange={(event) =>
                        setDraft((c) =>
                          c
                            ? {
                                ...c,
                                turnCount:
                                  event.target.value === ''
                                    ? 0
                                    : Number(event.target.value),
                              }
                            : c,
                        )
                      }
                      type="number"
                      value={draft.turnCount}
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>裁判模型</span>
                    <Select
                      value={draft.judgeModel}
                      onValueChange={(value) =>
                        setDraft((c) =>
                          c && value
                            ? { ...c, judgeModel: value as typeof c.judgeModel }
                            : c,
                        )
                      }
                    >
                      {modelOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </label>
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>开场白</span>
                    <Input
                      onChange={(event) =>
                        setDraft((c) =>
                          c ? { ...c, openingLine: event.target.value } : c,
                        )
                      }
                      value={draft.openingLine}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>计分与随机化</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>假信息数量</span>
                    <Input
                      min={0}
                      onChange={(event) =>
                        setDraft((c) =>
                          c
                            ? {
                                ...c,
                                falseInfoCount:
                                  event.target.value === ''
                                    ? 0
                                    : Number(event.target.value),
                              }
                            : c,
                        )
                      }
                      type="number"
                      value={draft.falseInfoCount}
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>真请求数量</span>
                    <Input
                      min={1}
                      onChange={(event) =>
                        setDraft((c) =>
                          c
                            ? {
                                ...c,
                                trueRequestCount:
                                  event.target.value === ''
                                    ? 1
                                    : Number(event.target.value),
                              }
                            : c,
                        )
                      }
                      type="number"
                      value={draft.trueRequestCount}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>提示词模板</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                  <span>Agent 提示词模板</span>
                  <Textarea
                    className="min-h-48"
                    onChange={(event) =>
                      setDraft((c) =>
                        c
                          ? { ...c, agentPromptTemplate: event.target.value }
                          : c,
                      )
                    }
                    value={draft.agentPromptTemplate}
                  />
                </label>
                <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                  <span>裁判提示词</span>
                  <Textarea
                    className="min-h-48"
                    onChange={(event) =>
                      setDraft((c) =>
                        c ? { ...c, judgePrompt: event.target.value } : c,
                      )
                    }
                    value={draft.judgePrompt}
                  />
                </label>

                <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                  <span>审讯问题模板</span>
                  <Textarea
                    className="min-h-20"
                    onChange={(event) =>
                      setDraft((c) =>
                        c
                          ? {
                              ...c,
                              examinationQuestionTemplate: event.target.value,
                            }
                          : c,
                      )
                    }
                    value={draft.examinationQuestionTemplate}
                  />
                </label>
                <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                  <span>评分提示词</span>
                  <Textarea
                    className="min-h-48"
                    onChange={(event) =>
                      setDraft((c) =>
                        c ? { ...c, scorerPrompt: event.target.value } : c,
                      )
                    }
                    value={draft.scorerPrompt}
                  />
                </label>
                <PromptVariableGuide draft={draft} />
              </CardContent>
            </Card>
          </div>

          {/* ── Right column: Roles ── */}
          <div className="space-y-6">
            {(
              [
                {
                  side: 'A' as const,
                  nameKey: 'roleAName' as const,
                  hiddenInfoKey: 'roleAHiddenInfo' as const,
                  requestsKey: 'roleARequests' as const,
                },
                {
                  side: 'B' as const,
                  nameKey: 'roleBName' as const,
                  hiddenInfoKey: 'roleBHiddenInfo' as const,
                  requestsKey: 'roleBRequests' as const,
                },
              ] as const
            ).map((role) => (
              <Card key={role.side}>
                <CardHeader>
                  <CardTitle>
                    角色 {role.side}
                    {draft[role.nameKey] ? ` · ${draft[role.nameKey]}` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <label className="block space-y-2 text-sm text-(--foreground-subtle)">
                    <span>名称</span>
                    <Input
                      onChange={(event) =>
                        setDraft((c) =>
                          c ? { ...c, [role.nameKey]: event.target.value } : c,
                        )
                      }
                      value={draft[role.nameKey]}
                    />
                  </label>
                  <IdContentListEditor
                    helperText="隐藏信息 ID 会参与裁判/评分模板插值。仅支持字母、数字和下划线，且需以字母开头。建议使用 S1、G2 这类短 ID。"
                    label="隐藏信息"
                    items={draft[role.hiddenInfoKey]}
                    onChange={(items) =>
                      setDraft((c) =>
                        c ? { ...c, [role.hiddenInfoKey]: items } : c,
                      )
                    }
                  />
                  <IdContentListEditor
                    helperText="请求 ID 会参与裁判/评分模板插值。仅支持字母、数字和下划线，且需以字母开头，并且不能与任何隐藏信息 ID 复用。建议保持稳定且易读，例如 SR1、GR2。"
                    label="诉求清单"
                    items={draft[role.requestsKey]}
                    onChange={(items) =>
                      setDraft((c) =>
                        c ? { ...c, [role.requestsKey]: items } : c,
                      )
                    }
                  />
                  <RolePresetOpponentsEditor
                    scenarioId={scenario.id}
                    role={role.side === 'A' ? 'a' : 'b'}
                    roleName={draft[role.nameKey]}
                    presets={presets}
                    onPresetsChange={setPresets}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Sticky save bar ── */}
        <div className="sticky bottom-0 z-10 -mx-1 mt-6 flex items-center justify-end gap-3 border-t border-(--border-soft) bg-(--background)/80 px-1 py-4 backdrop-blur-md">
          <Button
            onClick={() => navigate('/admin')}
            type="button"
            variant="secondary"
          >
            取消
          </Button>
          <Button disabled={isSaving} type="submit">
            {isSaving ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </form>
    </div>
  )
}
