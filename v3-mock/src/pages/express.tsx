// §A3 首战快速通道（流程，非页面组）：简化版 DA（#11）→ E express 形态（#12/#57，单侧 agent）
// → 保存自动派发最容易 NPC（#10/#17 例外）→ 直接进实况（#9）→ 首战后引导创建对侧（#59/#64）。
import { CheckCircle2, ChevronRight, Circle, Gavel, Clock3, Sparkles, Swords } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge, Button, Card } from '../components/ui'
import { cn } from '../lib/cn'
import { CONFIG, countPromptUnits } from '../mock/config'
import { NPCS, SCENARIOS } from '../mock/data'
import { store, useAppState } from '../mock/store'
import type { McqQuestion } from '../mock/types'

const preset = CONFIG.expressPreset

function usePresetScenario() {
  return SCENARIOS.find((s) => s.id === preset.scenarioId)
}

/** 快速通道只对首战开放：打完（expressPending=false）就回正常轨道；
 *  首战已发起但还没打完时，回到实况而不是允许再开一场 */
function useExpressGuard() {
  const { user, matches } = useAppState()
  const navigate = useNavigate()
  const pendingFirstBattle = matches.find(
    (m) => m.initiatorId === user?.id && m.isFirstBattle && m.status !== 'done',
  )
  useEffect(() => {
    if (user && !user.expressPending) navigate('/scenarios', { replace: true })
    else if (pendingFirstBattle) navigate(`/matches/${pendingFirstBattle.id}`, { replace: true })
  }, [user, pendingFirstBattle, navigate])
  return user?.expressPending === true && !pendingFirstBattle
}

/** 简化版 DA（#11）：比正常场景介绍省略得多的首屏 */
export function ExpressIntroPage() {
  const { user } = useAppState()
  const navigate = useNavigate()
  const active = useExpressGuard()
  const scenario = usePresetScenario()
  if (!active || !scenario) return null

  const myCard = preset.side === 'A' ? scenario.sideA : scenario.sideB

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6'>
      <header className='text-center'>
        <p className='page-eyebrow'>新手轨道 · 首战快速通道</p>
        <h1 className='page-title'>欢迎，{user?.name}</h1>
        <p className='page-subtitle mx-auto'>
          先打一场，边打边懂。我们已为你选好场景和执方——几道选择题就能拼出你的第一个智能体。
        </p>
      </header>

      <Card className='flex flex-col gap-5'>
        <div>
          <div className='mb-1.5 flex items-center gap-2'>
            <Badge tone='accent'>{scenario.subject}</Badge>
            <h2 className='panel-title'>{scenario.name}</h2>
          </div>
          <p className='panel-copy text-sm'>{scenario.oneLiner}</p>
        </div>

        <p className='panel-copy text-sm'>{scenario.background}</p>

        <div className='app-panel'>
          <div className='mb-2 flex items-center gap-2'>
            <Badge tone={preset.side === 'A' ? 'sideA' : 'sideB'}>你执方 {preset.side}</Badge>
            <span className='text-sm font-semibold text-(--foreground)'>{myCard.name}</span>
          </div>
          <p className='m-0 text-sm leading-relaxed text-(--foreground-subtle)'>{myCard.publicRequirements}</p>
          <p className='mt-2 mb-0 text-xs leading-relaxed text-(--foreground-muted)'>开场白：{myCard.openingStatement}</p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex items-start gap-2.5 text-sm text-(--foreground-subtle)'>
            <Gavel className='mt-0.5 h-4 w-4 shrink-0 text-(--foreground-muted)' />
            <span>裁判：{scenario.judgePersona}</span>
          </div>
          <div className='flex items-start gap-2.5 text-sm text-(--foreground-subtle)'>
            <Clock3 className='mt-0.5 h-4 w-4 shrink-0 text-(--foreground-muted)' />
            <span>预计一场约 {scenario.estimatedMinutes} 分钟</span>
          </div>
        </div>

        <Button size='lg' onClick={() => navigate('/express/build')}>
          <Sparkles className='h-4 w-4' />
          去构建
        </Button>
        <p className='m-0 text-center text-xs text-(--foreground-muted)'>
          首战＝创建一个执{myCard.name}的单侧智能体，保存后立刻开打、直接观看实况。打完再去建对侧。
        </p>
      </Card>
    </div>
  )
}

/** E express 形态（#12/#57）：单侧 agent 的 MCQ + 保存自动派发（#17 唯一例外） */
export function ExpressBuildPage() {
  const navigate = useNavigate()
  const active = useExpressGuard()
  const scenario = usePresetScenario()

  const questions = useMemo(
    () => (scenario ? scenario.mcqDeck.filter((q) => q.side === preset.side) : []),
    [scenario],
  )
  // 模板预填（§A3）：每题预选第一个选项，改哪题都行
  const [sel, setSel] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(questions.map((q): [string, string[]] => [q.id, [q.options[0].id]])),
  )
  const [model, setModel] = useState(CONFIG.modelList[0].id)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!active || !scenario) return null

  const myCard = preset.side === 'A' ? scenario.sideA : scenario.sideB
  const npc = NPCS.find((n) => n.id === preset.npcId)
  const assembled = questions
    .flatMap((q) => q.options.filter((o) => (sel[q.id] ?? []).includes(o.id)).map((o) => o.fragment))
    .join('\n')
  const units = countPromptUnits(assembled)
  const overLimit = units > CONFIG.promptCharLimit

  function toggleOption(q: McqQuestion, optId: string) {
    setSel((prev) => {
      const cur = prev[q.id] ?? []
      if (q.multi) {
        return { ...prev, [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] }
      }
      return { ...prev, [q.id]: [optId] }
    })
  }

  function handleSaveAndBattle() {
    if (!scenario || submitting || overLimit) return
    setError(null)
    // 触顶行为（#52）：按钮可点 → 提示 → 拒绝入队；赛事期间可阻挡全部试炼（#47）
    if (store.getState().trialsBlocked) {
      setError('赛事正在运行，全部试炼暂时关闭，请稍后再来。')
      return
    }
    if (store.dailyLimitReached()) {
      setError(`今日次数已用完（${CONFIG.dailyBattleLimit}/${CONFIG.dailyBattleLimit}），明天再来`)
      return
    }
    setSubmitting(true)
    // 派发失败重试时复用已建的 agent，避免遗留孤儿
    const existing = store
      .getState()
      .agents.find((a) => a.ownerId === store.getState().user?.id && a.scenarioId === scenario.id && a.name === '我的第一个智能体')
    // 首战＝创建一个单侧 agent（#57，执方来自新手预设）——没有「半满」概念；首战后引导创建对侧（#59/#64）
    const created = existing ? { ok: true as const, agent: existing } : store.createAgent(scenario.id, '我的第一个智能体', preset.side)
    if (!created.ok) {
      // 新用户首个 agent 不会触发 #59 引导门；防御分支仅为完备
      setSubmitting(false)
      setError('创建智能体失败，请稍后再试。')
      return
    }
    const agent = created.agent
    const version = store.saveVersion(agent.id, {
      prompt: assembled,
      model,
      mode: 'mcq',
      note: '首战 express 版本',
    })
    const res = store.dispatch({
      kind: 'pve',
      scenarioId: scenario.id,
      agentId: agent.id,
      versionId: version.id,
      opponent: { npcId: preset.npcId },
      firstBattle: true,
    })
    if (res.ok) {
      // 首战直接进实况观看（#9），非异步派发
      navigate(`/matches/${res.match.id}`)
      return
    }
    setSubmitting(false)
    setError(
      res.reason === 'daily-limit'
        ? `今日次数已用完（${CONFIG.dailyBattleLimit}/${CONFIG.dailyBattleLimit}），明天再来`
        : res.reason === 'trials-blocked'
          ? '赛事正在运行，全部试炼暂时关闭，请稍后再来。'
          : '派发失败：对手配置无效。',
    )
  }

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6'>
      <header>
        <p className='page-eyebrow'>首战快速通道 · 构建</p>
        <h1 className='page-title'>{scenario.name}</h1>
        <p className='page-subtitle'>
          首战＝一个单侧智能体（执{myCard.name}）。每题选一个方向，就拼成它的提示词——保存即开战。
        </p>
      </header>

      <Card className='flex flex-col gap-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Badge tone={preset.side === 'A' ? 'sideA' : 'sideB'}>你执方 {preset.side}</Badge>
            <span className='text-sm font-semibold text-(--foreground)'>{myCard.name}</span>
          </div>
          <span className={cn('text-xs font-semibold tabular-nums', overLimit ? 'text-red-400' : 'text-(--foreground-subtle)')}>
            {units} / {CONFIG.promptCharLimit}
          </span>
        </div>

        {questions.map((q) => (
          <div key={q.id} className='app-panel'>
            <p className='panel-label'>
              {q.title}
              {q.multi ? '（可多选）' : '（单选）'}
            </p>
            <div className='flex flex-col gap-2'>
              {q.options.map((o) => {
                const selected = (sel[q.id] ?? []).includes(o.id)
                const Icon = selected ? CheckCircle2 : Circle
                return (
                  <button
                    key={o.id}
                    type='button'
                    onClick={() => toggleOption(q, o.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      selected
                        ? 'border-(--accent)/60 bg-(--accent)/10'
                        : 'border-(--border-soft) bg-white/[0.02] hover:border-(--border) hover:bg-white/[0.04]',
                    )}
                  >
                    <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-(--accent)' : 'text-(--foreground-muted)')} />
                    <span>
                      <span className='block text-sm font-medium text-(--foreground)'>{o.label}</span>
                      <span className='mt-0.5 block text-xs leading-relaxed text-(--foreground-subtle)'>{o.fragment}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className='app-panel'>
          <p className='panel-label'>拼装预览（只读 · 按汉字或英文词计，非 token）</p>
          <pre className='m-0 font-[inherit] text-sm leading-relaxed whitespace-pre-wrap text-(--foreground-subtle)'>{assembled}</pre>
        </div>

        <label className='flex flex-col gap-1.5'>
          <span className='panel-label m-0'>模型（随版本快照，永远公开）</span>
          <select className='app-input' value={model} onChange={(e) => setModel(e.target.value)}>
            {CONFIG.modelList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        {npc && (
          <div className='flex items-center gap-3 rounded-xl border border-(--border-soft) bg-white/[0.02] px-4 py-3'>
            <Swords className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
            <p className='m-0 text-sm text-(--foreground-subtle)'>
              首战对手已选好：<span className='font-semibold text-(--foreground)'>{npc.name}</span>（{npc.tagline}，最容易的一档）
            </p>
          </div>
        )}

        {error && (
          <p className='m-0 rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-300'>{error}</p>
        )}

        <Button size='lg' onClick={handleSaveAndBattle} disabled={submitting || overLimit}>
          <Swords className='h-4 w-4' />
          {submitting ? '开战中…' : '保存并开战'}
        </Button>
        <p className='m-0 text-center text-xs text-(--foreground-muted)'>
          仅首战：保存会自动派发并直接进入实况。之后的保存都只存版本、不派发。
        </p>
      </Card>

      {/* 可切换到正常模式（#12） */}
      <Link
        to={`/scenarios/${scenario.id}/build`}
        className='inline-flex items-center gap-1 self-center text-xs font-medium text-(--foreground-muted) transition hover:text-(--foreground)'
      >
        想完整体验三种构建模式？切换到正常模式
        <ChevronRight className='h-3.5 w-3.5' />
      </Link>
    </div>
  )
}
