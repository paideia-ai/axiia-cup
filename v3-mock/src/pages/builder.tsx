// E 构建器（§A2）：独立页面绑定场景；三种构建模式逐版本（#16）；
// 逐方 ≤1000 字（#14）；模型属于版本（#13）；保存≠派发（#17）；无构建内快测（§A2）。
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Save,
  Square,
  Swords,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Badge, Button, Card, EmptyState, Tabs } from '../components/ui'
import { cn } from '../lib/cn'
import { CONFIG, countPromptUnits } from '../mock/config'
import { SCENARIOS } from '../mock/data'
import { store, useAppState } from '../mock/store'
import type { AgentVersion, BuildMode, McqQuestion, Scenario, Side } from '../mock/types'

const NEW_AGENT = '__new__'

/** MCQ 拼装：选中选项的 fragment 按 deck 顺序换行连接（§A2 模式 1） */
function assemblePrompt(sc: Scenario, side: Side, sel: Record<string, string[]>): string {
  const parts: string[] = []
  for (const q of sc.mcqDeck) {
    if (q.side !== side) continue
    for (const o of q.options) {
      if ((sel[q.id] ?? []).includes(o.id)) parts.push(o.fragment)
    }
  }
  return parts.join('\n')
}

/** 从既有版本（mode=mcq）的提示词反推选项勾选，用于「从版本继续编辑」入口 */
function deriveMcqSelections(sc: Scenario, promptA: string, promptB: string): Record<string, string[]> {
  const lines = new Set(
    [...promptA.split('\n'), ...promptB.split('\n')].map((l) => l.trim()).filter(Boolean),
  )
  const sel: Record<string, string[]> = {}
  for (const q of sc.mcqDeck) {
    const picked = q.options.filter((o) => lines.has(o.fragment)).map((o) => o.id)
    if (picked.length > 0) sel[q.id] = q.multi ? picked : [picked[0]]
  }
  return sel
}

/** 逐方 1000 计数器（#14：按汉字或英文词计，非 token） */
function LimitCounter({ units }: { units: number }) {
  const over = units > CONFIG.promptCharLimit
  return (
    <span className={cn('text-xs font-semibold tabular-nums', over ? 'text-red-400' : 'text-(--foreground-subtle)')}>
      {units} / {CONFIG.promptCharLimit}
      {over && ' · 超出上限'}
    </span>
  )
}

function McqOptionRow({
  question,
  label,
  fragment,
  selected,
  onToggle,
}: {
  question: McqQuestion
  label: string
  fragment: string
  selected: boolean
  onToggle: () => void
}) {
  const Icon = question.multi ? (selected ? CheckSquare : Square) : selected ? CheckCircle2 : Circle
  return (
    <button
      type='button'
      onClick={onToggle}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
        selected
          ? 'border-(--accent)/60 bg-(--accent)/10'
          : 'border-(--border-soft) bg-white/[0.02] hover:border-(--border) hover:bg-white/[0.04]',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-(--accent)' : 'text-(--foreground-muted)')} />
      <span>
        <span className='block text-sm font-medium text-(--foreground)'>{label}</span>
        <span className='mt-0.5 block text-xs leading-relaxed text-(--foreground-subtle)'>{fragment}</span>
      </span>
    </button>
  )
}

export function BuilderPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, agents } = useAppState()

  const scenario = SCENARIOS.find((s) => s.id === id)
  const myAgents = useMemo(
    () => agents.filter((a) => a.scenarioId === id && a.ownerId === user?.id),
    [agents, id, user?.id],
  )

  // 可选入口：?agent=<id>&version=<id>——从某版本的内容继续编辑
  const queryAgent = myAgents.find((a) => a.id === params.get('agent'))
  const queryVersion = queryAgent?.versions.find((v) => v.id === params.get('version'))

  // 玩家每场景可建多个 agent（§0）：选一个已有的，或新建
  const [agentChoice, setAgentChoice] = useState<string>(() => queryAgent?.id ?? myAgents[0]?.id ?? NEW_AGENT)
  const [newName, setNewName] = useState('')

  // 模式逐版本，一版同时做两方（#16）；默认 MCQ（#15 全场景上线）
  const queryMode = params.get('mode')
  const [mode, setMode] = useState<BuildMode>(
    queryVersion?.mode ?? (queryMode === 'basic' || queryMode === 'meta' || queryMode === 'mcq' ? queryMode : 'mcq'),
  )
  const [mcqSel, setMcqSel] = useState<Record<string, string[]>>(() =>
    scenario && queryVersion?.mode === 'mcq'
      ? deriveMcqSelections(scenario, queryVersion.promptA, queryVersion.promptB)
      : {},
  )
  const [textA, setTextA] = useState(queryVersion?.promptA ?? '')
  const [textB, setTextB] = useState(queryVersion?.promptB ?? '')

  // 模型属于版本，随版本快照（#13）
  const [model, setModel] = useState(queryVersion?.model ?? CONFIG.modelList[0].id)
  const [note, setNote] = useState('')

  const [infoOpen, setInfoOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ agentId: string; version: AgentVersion } | null>(null)

  const promptA = scenario && mode === 'mcq' ? assemblePrompt(scenario, 'A', mcqSel) : textA
  const promptB = scenario && mode === 'mcq' ? assemblePrompt(scenario, 'B', mcqSel) : textB
  const unitsA = countPromptUnits(promptA)
  const unitsB = countPromptUnits(promptB)
  const overLimit = unitsA > CONFIG.promptCharLimit || unitsB > CONFIG.promptCharLimit

  if (!scenario) {
    return (
      <EmptyState
        title='场景不存在'
        hint='这个链接指向的场景没有找到。'
        action={<Button onClick={() => navigate('/scenarios')}>回到场景选择</Button>}
      />
    )
  }

  const metaPrompt = [
    `我在参加「Axiia Cup」的对战场景「${scenario.name}」，请帮我写两段智能体提示词（每方不超过 ${CONFIG.promptCharLimit} 字，按汉字或英文词计）。`,
    '',
    `【场景背景】${scenario.background}`,
    '',
    `【方 A · ${scenario.sideA.name}】目标：${scenario.sideA.publicRequirements}`,
    `【方 B · ${scenario.sideB.name}】目标：${scenario.sideB.publicRequirements}`,
    '',
    '请分别输出「方 A 提示词」与「方 B 提示词」两段纯文本：写清核心论证路线、应对对方攻击的策略、隐藏情报的使用时机。不要输出多余解释。',
  ].join('\n')

  function toggleOption(q: McqQuestion, optId: string) {
    setMcqSel((prev) => {
      const cur = prev[q.id] ?? []
      if (q.multi) {
        return { ...prev, [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] }
      }
      return { ...prev, [q.id]: [optId] }
    })
  }

  function copyMetaPrompt() {
    navigator.clipboard
      .writeText(metaPrompt)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      })
      .catch(() => {})
  }

  // 保存＝存一个版本，不派发（#17）
  function handleSave() {
    if (!scenario) return
    setSaveError(null)
    if (overLimit) {
      setSaveError(`逐方上限 ${CONFIG.promptCharLimit}（按汉字或英文词计，非 token），请先精简超限一方。`)
      return
    }
    let agentId = agentChoice
    if (agentChoice === NEW_AGENT) {
      const name = newName.trim()
      if (!name) {
        setSaveError('请先给新智能体起一个名字。')
        return
      }
      const agent = store.createAgent(scenario.id, name)
      agentId = agent.id
      setAgentChoice(agent.id)
      setNewName('')
    }
    const version = store.saveVersion(agentId, {
      promptA,
      promptB,
      model,
      mode,
      note: note.trim() || undefined,
    })
    setNote('')
    setSaved({ agentId, version })
  }

  const modelLabel = CONFIG.modelList.find((m) => m.id === model)?.label ?? model

  const sideColumn = (side: Side) => {
    const card = side === 'A' ? scenario.sideA : scenario.sideB
    const units = side === 'A' ? unitsA : unitsB
    const assembled = side === 'A' ? promptA : promptB
    const questions = scenario.mcqDeck.filter((q) => q.side === side)
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Badge tone={side === 'A' ? 'sideA' : 'sideB'}>方 {side}</Badge>
            <span className='text-sm font-semibold text-(--foreground)'>{card.name}</span>
          </div>
          <LimitCounter units={units} />
        </div>
        <div className='flex flex-col gap-3'>
          {questions.map((q) => (
            <div key={q.id} className='app-panel'>
              <p className='panel-label'>
                {q.title}
                {q.multi ? '（可多选）' : '（单选）'}
              </p>
              <div className='flex flex-col gap-2'>
                {q.options.map((o) => (
                  <McqOptionRow
                    key={o.id}
                    question={q}
                    label={o.label}
                    fragment={o.fragment}
                    selected={(mcqSel[q.id] ?? []).includes(o.id)}
                    onToggle={() => toggleOption(q, o.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className='app-panel'>
          <p className='panel-label'>拼装预览（只读）</p>
          {assembled ? (
            <pre className='m-0 font-[inherit] text-sm leading-relaxed whitespace-pre-wrap text-(--foreground-subtle)'>{assembled}</pre>
          ) : (
            <p className='m-0 text-sm text-(--foreground-muted)'>还没有选择任何选项——上面每答一题，这里就拼进一句。</p>
          )}
        </div>
      </div>
    )
  }

  const textColumn = (side: Side) => {
    const card = side === 'A' ? scenario.sideA : scenario.sideB
    const value = side === 'A' ? textA : textB
    const setValue = side === 'A' ? setTextA : setTextB
    const units = side === 'A' ? unitsA : unitsB
    return (
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Badge tone={side === 'A' ? 'sideA' : 'sideB'}>方 {side}</Badge>
            <span className='text-sm font-semibold text-(--foreground)'>{card.name} 提示词</span>
          </div>
          <LimitCounter units={units} />
        </div>
        <textarea
          className='app-textarea'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`写给「${card.name}」的纯文本提示词：论证路线、应对策略、隐藏情报的使用时机……`}
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <header>
        <p className='page-eyebrow'>构建器 · {scenario.subject}</p>
        <h1 className='page-title'>{scenario.name}</h1>
        <p className='page-subtitle'>
          一个版本同时写两方；逐方上限 {CONFIG.promptCharLimit}（按汉字或英文词计，非 token）。这里不做快测——保存后去「选择对手」用 PVE 检验。
        </p>
      </header>

      {/* 紧凑可折叠的场景资料栏（§A2），默认收起 */}
      <Card className='p-0'>
        <button
          type='button'
          onClick={() => setInfoOpen((o) => !o)}
          className='flex w-full items-center justify-between px-5 py-4 text-left'
        >
          <span className='flex items-center gap-2 text-sm font-semibold text-(--foreground)'>
            {infoOpen ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
            场景资料 · {scenario.oneLiner}
          </span>
          <span className='text-xs text-(--foreground-muted)'>{infoOpen ? '收起' : '展开'}</span>
        </button>
        {infoOpen && (
          <div className='flex flex-col gap-4 border-t border-(--border-soft) px-5 py-4'>
            <p className='panel-copy text-sm'>{scenario.background}</p>
            <div className='grid gap-3 md:grid-cols-2'>
              {([['A', scenario.sideA] as const, ['B', scenario.sideB] as const]).map(([side, card]) => (
                <div key={side} className='app-panel'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Badge tone={side === 'A' ? 'sideA' : 'sideB'}>方 {side}</Badge>
                    <span className='text-sm font-semibold text-(--foreground)'>{card.name}</span>
                  </div>
                  <p className='m-0 text-xs leading-relaxed text-(--foreground-subtle)'>{card.publicRequirements}</p>
                  <p className='mt-1.5 mb-0 text-xs leading-relaxed text-(--foreground-muted)'>
                    隐藏信息：{card.hiddenInfoSummary}
                  </p>
                </div>
              ))}
            </div>
            <Link to={`/scenarios/${scenario.id}`} className='text-xs font-medium text-(--accent) hover:underline'>
              查看完整场景介绍 →
            </Link>
          </div>
        )}
      </Card>

      {/* 智能体选择：每场景可多个（§0） */}
      <Card className='flex flex-col gap-3'>
        <p className='panel-label'>保存到哪个智能体</p>
        <div className='grid gap-3 md:grid-cols-2'>
          <select
            className='app-input'
            value={agentChoice}
            onChange={(e) => {
              setAgentChoice(e.target.value)
              setSaved(null)
            }}
          >
            {myAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}（{a.versions.length} 个版本）
              </option>
            ))}
            <option value={NEW_AGENT}>＋ 新建智能体</option>
          </select>
          {agentChoice === NEW_AGENT && (
            <input
              className='app-input'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='新智能体的名字，如「铁腕商鞅」'
            />
          )}
        </div>
        <p className='m-0 text-xs text-(--foreground-muted)'>同一场景可以建多个智能体，各自独立迭代版本。</p>
      </Card>

      {/* 三种构建模式，逐版本（#16） */}
      <Tabs
        value={mode}
        onChange={(k) => setMode(k as BuildMode)}
        items={[
          { key: 'mcq', label: 'MCQ 拼装' },
          { key: 'basic', label: 'Basic 直写' },
          { key: 'meta', label: '元提示词' },
        ]}
      />

      {mode === 'mcq' && (
        <div className='grid gap-6 lg:grid-cols-2'>
          <div>
            <p className='panel-label'>A 的题目</p>
            {sideColumn('A')}
          </div>
          <div>
            <p className='panel-label'>B 的题目</p>
            {sideColumn('B')}
          </div>
        </div>
      )}

      {mode === 'basic' && (
        <div className='grid gap-6 lg:grid-cols-2'>
          {textColumn('A')}
          {textColumn('B')}
        </div>
      )}

      {mode === 'meta' && (
        <div className='flex flex-col gap-6'>
          <Card className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <p className='panel-label m-0'>元提示词——复制到你自己的 AI 里用</p>
              <Button size='sm' variant='secondary' onClick={copyMetaPrompt}>
                {copied ? <Check className='h-3.5 w-3.5' /> : <Copy className='h-3.5 w-3.5' />}
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <textarea className='app-textarea min-h-[10rem] text-xs' readOnly value={metaPrompt} />
            <p className='m-0 text-xs text-(--foreground-muted)'>
              产品内不提供聊天：把这段话交给你常用的 AI，把它产出的两段提示词粘回下面。
            </p>
          </Card>
          <div className='grid gap-6 lg:grid-cols-2'>
            {textColumn('A')}
            {textColumn('B')}
          </div>
        </div>
      )}

      {/* 保存区：模型属于版本（#13）；保存≠派发（#17） */}
      <Card className='flex flex-col gap-4'>
        <div className='grid gap-4 md:grid-cols-2'>
          <label className='flex flex-col gap-1.5'>
            <span className='panel-label m-0'>模型（随版本快照）</span>
            <select className='app-input' value={model} onChange={(e) => setModel(e.target.value)}>
              {CONFIG.modelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className='text-xs text-(--foreground-muted)'>模型信息永远公开。</span>
          </label>
          <label className='flex flex-col gap-1.5'>
            <span className='panel-label m-0'>备注（可选）</span>
            <input
              className='app-input'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='这一版改了什么，如「强化情报使用时机」'
            />
          </label>
        </div>
        <div className='flex flex-wrap items-center gap-3 border-t border-(--border-soft) pt-4'>
          <Button onClick={handleSave} disabled={overLimit}>
            <Save className='h-4 w-4' />
            保存版本
          </Button>
          <span className='text-xs text-(--foreground-muted)'>
            保存＝存一个版本，不会派发对战；派发去「选择对手」。字数：A {unitsA} / B {unitsB}（上限逐方 {CONFIG.promptCharLimit}，按汉字或英文词计，非 token）。
          </span>
        </div>
        {saveError && (
          <p className='m-0 rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300'>{saveError}</p>
        )}
        {saved && (
          <div className='flex flex-col gap-3 rounded-xl border border-emerald-800/60 bg-emerald-950/25 px-4 py-4'>
            <p className='m-0 flex items-center gap-2 text-sm font-semibold text-emerald-300'>
              <BadgeCheck className='h-4 w-4' />
              已保存 v{saved.version.num} · 版本 id：{saved.version.id}
            </p>
            <p className='m-0 text-xs text-(--foreground-subtle)'>
              模式 {saved.version.mode === 'mcq' ? 'MCQ' : saved.version.mode === 'basic' ? 'Basic' : '元提示词'} · 模型 {modelLabel}（已随版本快照）。保存≠派发——这个版本还没有发起任何对战。
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' onClick={() => navigate(`/agents/${saved.agentId}?os=1`)}>
                <Swords className='h-3.5 w-3.5' />
                选择对手
              </Button>
              <Button size='sm' variant='secondary' onClick={() => setSaved(null)}>
                继续编辑
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
