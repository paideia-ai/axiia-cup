// E 构建器（§A2）：独立页面绑定场景；三种构建模式逐版本、每版单侧（#57）；
// agent 按侧（#55），执方由所选/新建的 agent 决定；单侧 ≤1000 字（#14）；
// 模型属于版本（#13）；保存≠派发（#17）；无构建内快测（§A2）；
// 同侧第二个 agent 受引导门约束（#59），版本迭代不受限（D16）。
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
import { SCENARIOS, otherSide, sideCardOf, sideRoleShort } from '../mock/data'
import { store, useAppState } from '../mock/store'
import type { AgentVersion, BuildMode, McqQuestion, Scenario, Side } from '../mock/types'

const NEW_AGENT = '__new__'

/** MCQ 拼装：选中选项的 fragment 按 deck 顺序换行连接（§A2 模式 1）；deck 按 agent 的侧过滤（#57） */
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

/** 从既有版本（mode=mcq）的单侧提示词反推选项勾选，用于「从版本继续编辑」入口 */
function deriveMcqSelections(sc: Scenario, side: Side, prompt: string): Record<string, string[]> {
  const lines = new Set(prompt.split('\n').map((l) => l.trim()).filter(Boolean))
  const sel: Record<string, string[]> = {}
  for (const q of sc.mcqDeck) {
    if (q.side !== side) continue
    const picked = q.options.filter((o) => lines.has(o.fragment)).map((o) => o.id)
    if (picked.length > 0) sel[q.id] = q.multi ? picked : [picked[0]]
  }
  return sel
}

/** 单侧 1000 计数器（#14：按汉字或英文词计，非 token） */
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

  // 可选入口：?agent=<id>&version=<id>——从某版本的内容继续编辑；?side=A|B——预选新建侧（「去创建对侧」CTA）
  const queryAgent = myAgents.find((a) => a.id === params.get('agent'))
  const queryVersion = queryAgent?.versions.find((v) => v.id === params.get('version'))
  const querySideRaw = params.get('side')
  const querySide: Side | null = querySideRaw === 'A' || querySideRaw === 'B' ? querySideRaw : null

  // 玩家每场景每侧可建多个 agent（#56，受 #59 引导门）：选一个已有的，或新建（新建需选侧）
  const [agentChoice, setAgentChoice] = useState<string>(() =>
    queryAgent?.id ?? (querySide !== null ? NEW_AGENT : myAgents[0]?.id ?? NEW_AGENT),
  )
  const [newName, setNewName] = useState('')
  const [newSide, setNewSide] = useState<Side>(querySide ?? 'A')

  // 模式逐版本，每版单侧（#57）；默认 MCQ（#15 全场景上线）
  const queryMode = params.get('mode')
  const [mode, setMode] = useState<BuildMode>(
    queryVersion?.mode ?? (queryMode === 'basic' || queryMode === 'meta' || queryMode === 'mcq' ? queryMode : 'mcq'),
  )
  const [mcqSel, setMcqSel] = useState<Record<string, string[]>>(() =>
    scenario && queryAgent && queryVersion?.mode === 'mcq'
      ? deriveMcqSelections(scenario, queryAgent.side, queryVersion.prompt)
      : {},
  )
  const [text, setText] = useState(queryVersion?.prompt ?? '')

  // 模型属于版本，随版本快照（#13）
  const [model, setModel] = useState(queryVersion?.model ?? CONFIG.modelList[0].id)
  const [note, setNote] = useState('')

  const [infoOpen, setInfoOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ agentId: string; version: AgentVersion } | null>(null)

  const currentAgent = myAgents.find((a) => a.id === agentChoice)
  // 执方由所选 agent 隐含（#62）；新建时由玩家选侧
  const currentSide: Side = currentAgent?.side ?? newSide
  const prompt = scenario && mode === 'mcq' ? assemblePrompt(scenario, currentSide, mcqSel) : text
  const units = countPromptUnits(prompt)
  const overLimit = units > CONFIG.promptCharLimit

  if (!scenario) {
    return (
      <EmptyState
        title='场景不存在'
        hint='这个链接指向的场景没有找到。'
        action={<Button onClick={() => navigate('/scenarios')}>回到场景选择</Button>}
      />
    )
  }

  const myCard = sideCardOf(scenario, currentSide)
  const oppCard = sideCardOf(scenario, otherSide(currentSide))
  const myRole = sideRoleShort(scenario, currentSide)
  const oppRole = sideRoleShort(scenario, otherSide(currentSide))

  // 同侧第二个 agent 引导门（#59）——只约束「新建」；版本迭代永不受限（D16）
  const gate = store.canCreateAgent(scenario.id, newSide)
  const gateBlocked = agentChoice === NEW_AGENT && !gate.ok

  // 双侧完成度徽章（#64）+ 参赛资格（#58）
  const bySide = store.myAgentsBySide(scenario.id)
  const readiness = store.entryReadiness(scenario.id)

  const metaPrompt = [
    `我在参加「Axiia Cup」的对战场景「${scenario.name}」，执${myCard.name}。请帮我写一段智能体提示词（不超过 ${CONFIG.promptCharLimit} 字，按汉字或英文词计）。`,
    '',
    `【场景背景】${scenario.background}`,
    '',
    `【我的角色 · ${myCard.name}】目标：${myCard.publicRequirements}`,
    `【对手 · ${oppCard.name}】目标：${oppCard.publicRequirements}`,
    '',
    '请输出一段纯文本提示词：写清核心论证路线、应对对方攻击的策略、隐藏情报的使用时机。不要输出多余解释。',
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
      setSaveError(`单侧上限 ${CONFIG.promptCharLimit}（按汉字或英文词计，非 token），请先精简。`)
      return
    }
    let agentId = agentChoice
    if (agentChoice === NEW_AGENT) {
      const name = newName.trim()
      if (!name) {
        setSaveError('请先给新智能体起一个名字。')
        return
      }
      const created = store.createAgent(scenario.id, name, newSide)
      if (!created.ok) {
        // #59 引导门（文案为 mock 自拟）
        setSaveError(`想再建一个${myRole}？先创建一个${oppRole}——两边都要会写才是真本事。`)
        return
      }
      agentId = created.agent.id
      setAgentChoice(created.agent.id)
      setNewName('')
    }
    const version = store.saveVersion(agentId, {
      prompt,
      model,
      mode,
      note: note.trim() || undefined,
    })
    setNote('')
    setSaved({ agentId, version })
  }

  const modelLabel = CONFIG.modelList.find((m) => m.id === model)?.label ?? model
  const questions = scenario.mcqDeck.filter((q) => q.side === currentSide)

  // #68：系统角色模板预览（只读）——把占位符替换成本侧语境，便于理解「策略会被合并到哪里」
  const templatePreview = scenario.agentPromptTemplate
    .replaceAll('{{roleName}}', myCard.name)
    .replaceAll('{{opponentName}}', oppCard.name)
    .replaceAll('{{turnCount}}', String(scenario.dialogueTurns))
    .replaceAll('{{requests}}', scenario.requests[currentSide].map((r) => `- ${r.id}：${r.content}（真/假 每局随机指派）`).join('\n'))
    .replaceAll('{{opponentRequests}}', scenario.requests[otherSide(currentSide)].map((r) => `- ${r.id}：${r.content}`).join('\n'))
    .replaceAll('{{strategy}}', '（← 你在下方编写的策略会填进这里）')

  // #68：固定说明 + 可折叠只读模板
  const roleTemplateNote = (
    <div className='flex flex-col gap-2 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
      <p className='m-0 text-xs text-(--foreground-subtle)'>
        <span className='font-semibold text-(--foreground)'>你只需编写策略；比赛时系统会自动把它与角色模板合并。</span>
        场景背景、请求清单、辩论规则与边界约束都已在模板里。
      </p>
      <details className='group'>
        <summary className='cursor-pointer text-xs font-semibold text-(--foreground-muted) transition hover:text-(--foreground)'>
          查看系统角色模板（仅供查看，无需在策略中重复）
        </summary>
        <pre className='mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-(--border-soft) bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-(--foreground-subtle)'>
          {templatePreview}
        </pre>
      </details>
    </div>
  )

  const mcqColumn = (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Badge tone={currentSide === 'A' ? 'sideA' : 'sideB'}>执{currentSide}</Badge>
          <span className='text-sm font-semibold text-(--foreground)'>{myCard.name}</span>
        </div>
        <LimitCounter units={units} />
      </div>
      {roleTemplateNote}
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
        {prompt ? (
          <pre className='m-0 font-[inherit] text-sm leading-relaxed whitespace-pre-wrap text-(--foreground-subtle)'>{prompt}</pre>
        ) : (
          <p className='m-0 text-sm text-(--foreground-muted)'>还没有选择任何选项——上面每答一题，这里就拼进一句。</p>
        )}
      </div>
    </div>
  )

  const textColumn = (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Badge tone={currentSide === 'A' ? 'sideA' : 'sideB'}>执{currentSide}</Badge>
          <span className='text-sm font-semibold text-(--foreground)'>{myCard.name} 策略</span>
        </div>
        <LimitCounter units={units} />
      </div>
      {roleTemplateNote}
      <textarea
        className='app-textarea'
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`你的策略（只写策略，无需重复模板内容）：论证路线、为真目标铺垫的节奏、应对${oppCard.name}攻击的方式……`}
      />
    </div>
  )

  return (
    <div className='flex flex-col gap-6'>
      <header>
        <p className='page-eyebrow'>构建器 · {scenario.subject}</p>
        <h1 className='page-title'>{scenario.name}</h1>
        <p className='page-subtitle'>
          每个智能体执一侧，一个版本＝单侧提示词 + 模型；上限 {CONFIG.promptCharLimit}（按汉字或英文词计，非 token）。这里不做快测——保存后去「选择对手」用 PVE 检验。
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
                    {side === currentSide && <Badge tone='accent'>你这一侧</Badge>}
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

      {/* 智能体选择：每场景每侧可多个（#56）；新建需选侧，受 #59 引导门 */}
      <Card className='flex flex-col gap-3'>
        <p className='panel-label'>保存到哪个智能体</p>
        <div className='grid gap-3 md:grid-cols-2'>
          <select
            className='app-input'
            value={agentChoice}
            onChange={(e) => {
              setAgentChoice(e.target.value)
              setSaved(null)
              setSaveError(null)
            }}
          >
            {myAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {sideRoleShort(scenario, a.side)} · {a.name}（{a.versions.length} 个版本）
              </option>
            ))}
            <option value={NEW_AGENT}>＋ 新建智能体</option>
          </select>
          {agentChoice === NEW_AGENT && (
            <input
              className='app-input'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`新智能体的名字，如「铁腕${myRole}」`}
            />
          )}
        </div>
        {agentChoice === NEW_AGENT ? (
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>选择执方（agent 属于一侧）</span>
            <div className='flex items-center gap-1 rounded-full border border-(--border-soft) bg-white/[0.02] p-1'>
              {(['A', 'B'] as const).map((side) => (
                <button
                  key={side}
                  type='button'
                  onClick={() => {
                    setNewSide(side)
                    setSaveError(null)
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    newSide === side
                      ? side === 'A' ? 'bg-sky-950/60 text-sky-300' : 'bg-amber-950/60 text-amber-300'
                      : 'text-(--foreground-subtle) hover:text-(--foreground)',
                  )}
                >
                  执{side}（{sideRoleShort(scenario, side)}）
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentAgent && (
            <p className='m-0 flex items-center gap-2 text-xs text-(--foreground-muted)'>
              <Badge tone={currentAgent.side === 'A' ? 'sideA' : 'sideB'}>执{currentAgent.side} · {myRole}</Badge>
              执方由智能体决定；版本迭代不受任何门限。
            </p>
          )
        )}
        {/* #59 引导门：同侧第 2 个 agent 需先有对侧（文案为 mock 自拟）；版本迭代不受限（D16） */}
        {gateBlocked && (
          <div className='flex flex-col gap-2 rounded-xl border border-amber-800/60 bg-amber-950/25 px-4 py-3'>
            <p className='m-0 text-sm font-semibold text-amber-300'>
              想再建一个{myRole}？先创建一个{oppRole}——两边都要会写才是真本事。
            </p>
            <p className='m-0 text-xs text-(--foreground-muted)'>
              你已有 {gate.sameSideCount} 个{myRole}智能体、0 个{oppRole}。两侧都有后就不再限制；迭代现有智能体的版本不受此门约束。
            </p>
            <div>
              <Button size='sm' variant='secondary' onClick={() => { setNewSide(otherSide(newSide)); setSaveError(null) }}>
                先创建{oppRole}
              </Button>
            </div>
          </div>
        )}
        {/* 双侧完成度徽章（#64）+ 参赛资格（#58） */}
        <p className='m-0 flex flex-wrap items-center gap-2 border-t border-(--border-soft) pt-3 text-xs text-(--foreground-muted)'>
          <span className='font-semibold text-(--foreground-subtle)'>双侧完成度：</span>
          {(['A', 'B'] as const).map((side) => (
            <Badge key={side} tone={bySide[side].length > 0 ? 'success' : 'neutral'}>
              {sideRoleShort(scenario, side)} {bySide[side].length > 0 ? '✓' : '✗'}
            </Badge>
          ))}
          <span>
            参赛需两侧各标一个参赛版本——
            {readiness.eligible ? '已具备参赛资格' : `还差${readiness.A === null ? sideRoleShort(scenario, 'A') : ''}${readiness.A === null && readiness.B === null ? '与' : ''}${readiness.B === null ? sideRoleShort(scenario, 'B') : ''}的参赛版本`}
          </span>
        </p>
      </Card>

      {/* 三种构建模式，逐版本、每版单侧（#57） */}
      <Tabs
        value={mode}
        onChange={(k) => setMode(k as BuildMode)}
        items={[
          { key: 'mcq', label: 'MCQ 拼装' },
          { key: 'basic', label: 'Basic 直写' },
          { key: 'meta', label: '元提示词' },
        ]}
      />

      {/* MCQ deck 按 agent 的侧过滤（#57） */}
      {mode === 'mcq' && mcqColumn}

      {mode === 'basic' && textColumn}

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
              产品内不提供聊天：把这段话交给你常用的 AI，把它产出的单侧提示词粘回下面。
            </p>
          </Card>
          {textColumn}
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
          <Button onClick={handleSave} disabled={overLimit || gateBlocked}>
            <Save className='h-4 w-4' />
            保存版本
          </Button>
          <span className='text-xs text-(--foreground-muted)'>
            保存＝存一个版本，不会派发对战；派发去「选择对手」。字数：{units}（单侧上限 {CONFIG.promptCharLimit}，按汉字或英文词计，非 token）。
          </span>
        </div>
        {saveError && (
          <p className='m-0 rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300'>{saveError}</p>
        )}
        {saved && (
          <div className='flex flex-col gap-3 rounded-xl border border-emerald-800/60 bg-emerald-950/25 px-4 py-4'>
            <p className='m-0 flex items-center gap-2 text-sm font-semibold text-emerald-300'>
              <BadgeCheck className='h-4 w-4' />
              已保存 v{saved.version.num}（执{myRole}） · 版本 id：{saved.version.id}
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
