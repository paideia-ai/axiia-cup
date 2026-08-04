// FA 战报 —— 唯一对局视图（A7，#27）：排队 / 进行中·实况 / 完成 三态，赛事 / PVP / PVE 通用。
import {
  Bug,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Lock,
  Pause,
  Play,
  Radio,
  Scale,
  Share2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge, Button, Card, EmptyState, KeyValue } from '../components/ui'
import { cn } from '../lib/cn'
import { SCENARIOS, store, useAppState } from '../mock/store'
import type { DialogueTurn, JudgeOsEntry, Match, MatchParticipant, Scenario, Side } from '../mock/types'

// 赛事/PVP/PVE 全部用同一个视图（#27）——kind 只是徽章
const KIND_LABEL: Record<Match['kind'], string> = {
  tournament: '赛事',
  'pvp-friendly': '友谊赛',
  'pvp-ranked': '天梯',
  pve: 'PVE',
}

const STATUS_LABEL: Record<Match['status'], string> = {
  queued: '排队中',
  running: '进行中 · 实况',
  done: '已完成',
}

type FeedItem = { type: 'turn'; turn: DialogueTurn } | { type: 'os'; entry: JudgeOsEntry }

function buildFeed(match: Match, upToTurn: number | null): FeedItem[] {
  const limit = upToTurn ?? Number.POSITIVE_INFINITY
  const items: FeedItem[] = []
  for (const turn of match.transcript) {
    if (turn.turn > limit) break
    items.push({ type: 'turn', turn })
    // 裁判 OS ① 生成层：默认对所有观众可见，按 afterTurn 穿插（#22 修订）
    for (const entry of match.judgeOs) {
      if (entry.afterTurn === turn.turn) items.push({ type: 'os', entry })
    }
  }
  return items
}

interface ReplayState {
  active: boolean
  /** 已重演到的轮数（0 = 尚未展示任何轮） */
  cursor: number
  paused: boolean
  /** 自动暂停锚点：倾向变化的裁判 OS（#24 教学节奏） */
  anchor: JudgeOsEntry | null
}

const REPLAY_IDLE: ReplayState = { active: false, cursor: 0, paused: false, anchor: null }

export function MatchPage() {
  const { id } = useParams()
  const state = useAppState()
  const match = state.matches.find((m) => m.id === id)
  const scenario: Scenario | undefined = match ? SCENARIOS.find((s) => s.id === match.scenarioId) : undefined

  const [copied, setCopied] = useState<string | null>(null)
  const [replay, setReplay] = useState<ReplayState>(REPLAY_IDLE)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const copy = (key: string, text: string) => {
    try {
      void navigator.clipboard.writeText(text)
    } catch {
      // mock 环境下剪贴板失败不致命
    }
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600)
  }

  // 首战实况例外：强制把最新轮滚入视野（A7 末条；其余对局不强制自动滚动）
  const turnCount = match?.transcript.length ?? 0
  const firstBattleLive = Boolean(match?.isFirstBattle && match.status === 'running')
  useEffect(() => {
    if (firstBattleLive) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [firstBattleLive, turnCount])

  // 回放推进：~1.2s/轮，纯动画（无 LLM 调用）；遇 tendency.changed 的 OS 自动暂停（#24）
  const matchId = match?.id
  const matchDone = match?.status === 'done'
  useEffect(() => {
    if (!replay.active || replay.paused || !matchId || !matchDone) return
    const m = store.getState().matches.find((x) => x.id === matchId)
    if (!m) return
    if (replay.cursor >= m.totalTurns) {
      const t = setTimeout(() => setReplay(REPLAY_IDLE), 1800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setReplay((r) => {
        const next = r.cursor + 1
        const anchor = m.judgeOs.find((e) => e.afterTurn === next && e.tendency.changed) ?? null
        return { ...r, cursor: next, paused: anchor !== null, anchor }
      })
    }, 1200)
    return () => clearTimeout(t)
  }, [replay.active, replay.paused, replay.cursor, matchId, matchDone])

  if (!match) {
    return (
      <EmptyState
        title='没有找到这场对局'
        hint='链接可能已失效，或对局尚未创建。回到历史页看看你的全部对战记录。'
      />
    )
  }

  const sideName = (s: Side): string => (s === 'A' ? scenario?.sideA.name ?? '执A方' : scenario?.sideB.name ?? '执B方')
  const judgeName = scenario?.judgePersona.split('—')[0] ?? '裁判'
  const userId = state.user?.id ?? null
  const replaying = replay.active
  const feed = buildFeed(match, replaying ? replay.cursor : null)
  const visibleOs = replaying ? match.judgeOs.filter((e) => e.afterTurn <= replay.cursor) : match.judgeOs

  return (
    <div className='flex flex-col gap-6'>
      {/* ---------- 头部 ---------- */}
      <section>
        <p className='page-eyebrow'>战报 · {scenario?.name ?? match.scenarioId}</p>
        <div className='flex flex-wrap items-center gap-3'>
          <h1 className='page-title'>对局 {match.id}</h1>
          <Badge tone='accent'>{KIND_LABEL[match.kind]}</Badge>
          <Badge tone={match.status === 'done' ? 'success' : match.status === 'running' ? 'info' : 'neutral'}>
            {match.status === 'running' && <Radio className='h-3 w-3 animate-pulse' />}
            {STATUS_LABEL[match.status]}
          </Badge>
          {match.isFirstBattle && <Badge tone='warning'>首战</Badge>}
        </div>
        <div className='mt-4 flex flex-wrap items-center gap-2'>
          {/* 分享：一切可分享内容均已公开，无需隐藏信息打码（A7 分享 · #20） */}
          <Button size='sm' variant='secondary' onClick={() => copy('share', window.location.href)}>
            {copied === 'share' ? <Check className='h-3.5 w-3.5' /> : <Share2 className='h-3.5 w-3.5' />}
            {copied === 'share' ? '链接已复制' : '分享战报'}
          </Button>
          {/* debug mode 任何观众可开（A7 W9 已解决） */}
          <Button
            size='sm'
            variant={state.debugMode ? 'primary' : 'ghost'}
            onClick={() => store.toggleDebugMode()}
            title='受限项只有三样：提示词、diff、己方 OS trace（仅所有者）；其余一律可见'
          >
            <Bug className='h-3.5 w-3.5' />
            {state.debugMode ? 'debug mode 开' : 'debug mode'}
          </Button>
          {match.status === 'done' && !replaying && (
            <Button size='sm' variant='secondary' onClick={() => setReplay({ active: true, cursor: 0, paused: false, anchor: null })}>
              <Play className='h-3.5 w-3.5' />
              回放
            </Button>
          )}
          <span className='text-xs text-(--foreground-muted)'>分享无需打码——可分享内容均已公开</span>
        </div>
      </section>

      {/* ---------- 参战双方（模型永远公开 #21；版本 id #25） ---------- */}
      <div className='grid gap-4 md:grid-cols-2'>
        <ParticipantCard side='A' participant={match.participants.A} sideName={sideName('A')} copied={copied} onCopy={copy} />
        <ParticipantCard side='B' participant={match.participants.B} sideName={sideName('B')} copied={copied} onCopy={copy} />
      </div>

      {/* ---------- 排队态：等待指示（B5/I-1：ETA + 完成后通知） ---------- */}
      {match.status === 'queued' && (
        <Card className='flex items-center gap-4'>
          <Loader2 className='h-5 w-5 animate-spin text-(--foreground-subtle)' />
          <div>
            <p className='panel-title text-base'>已入队，完成后通知你</p>
            <p className='panel-copy text-sm'>
              预计约 {Math.max(1, Math.round((match.totalTurns * 1.6 + 20) / 60))} 分钟出结果。你可以留在这里观战，也可以先去别处——结果会推送到通知铃。
            </p>
          </div>
        </Card>
      )}

      {/* ---------- 裁判倾向轨迹（#24 教学锚点，一眼看清弧线） ---------- */}
      {match.status !== 'queued' && visibleOs.length > 0 && (
        <TendencyStrip entries={visibleOs} sideName={sideName} />
      )}

      {/* ---------- 对话（实况 / 静态 / 回放共用同一渲染） ---------- */}
      {match.status !== 'queued' && (
        <section className='app-panel'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
            <p className='panel-label mb-0'>
              {replaying ? '回放 · 对话重演' : match.status === 'running' ? '实况 · 对话' : '完整对话'}
            </p>
            {match.status === 'running' && (
              <span className='inline-flex items-center gap-2 text-xs text-sky-300'>
                <Radio className='h-3.5 w-3.5 animate-pulse' />
                第 {match.transcript.length}/{match.totalTurns} 轮
              </span>
            )}
            {replaying && (
              <div className='flex items-center gap-2'>
                <span className='text-xs text-(--foreground-subtle)'>第 {replay.cursor}/{match.totalTurns} 轮</span>
                <Button size='sm' variant='secondary' onClick={() => setReplay((r) => ({ ...r, paused: !r.paused, anchor: null }))}>
                  {replay.paused ? <Play className='h-3.5 w-3.5' /> : <Pause className='h-3.5 w-3.5' />}
                  {replay.paused ? '继续' : '暂停'}
                </Button>
                <Button size='sm' variant='ghost' onClick={() => setReplay(REPLAY_IDLE)}>
                  <X className='h-3.5 w-3.5' />
                  退出回放
                </Button>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-3'>
            {feed.length === 0 && <p className='panel-copy text-sm'>{replaying ? '回放即将开始……' : '等待第一轮发言……'}</p>}
            {feed.map((item) =>
              item.type === 'turn' ? (
                <TurnBlock key={`t-${item.turn.turn}`} turn={item.turn} />
              ) : (
                <JudgeOsBlock
                  key={`os-${item.entry.afterTurn}`}
                  entry={item.entry}
                  judgeName={judgeName}
                  sideName={sideName}
                  // 回放锚点：倾向变化处自动暂停并高亮（#24）
                  anchored={replaying && replay.anchor?.afterTurn === item.entry.afterTurn}
                  onContinue={() => setReplay((r) => ({ ...r, paused: false, anchor: null }))}
                />
              ),
            )}
            {replaying && replay.cursor >= match.totalTurns && (
              <p className='text-center text-xs text-(--foreground-muted)'>回放结束，即将返回完整战报……</p>
            )}
            <div ref={bottomRef} />
          </div>
        </section>
      )}

      {/* ---------- 完成态内容（回放期间暂隐，重演结束后恢复） ---------- */}
      {match.status === 'done' && match.result && !replaying && (
        <>
          {/* 结果 与 裁判理由 分列（A7） */}
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <p className='panel-label'>结果</p>
              <div className='flex flex-col gap-4'>
                <KeyValue label='胜者'>
                  {match.result.winner === 'draw' ? (
                    '平局'
                  ) : (
                    <span className='inline-flex items-center gap-2'>
                      <Badge tone={match.result.winner === 'A' ? 'sideA' : 'sideB'}>执{match.result.winner}</Badge>
                      <span className='font-semibold'>{match.participants[match.result.winner].displayName}</span>
                    </span>
                  )}
                </KeyValue>
                <div className='grid grid-cols-2 gap-4'>
                  <KeyValue label={`执A · ${sideName('A')}`}>
                    <span className='text-lg font-bold text-(--side-a)'>{match.result.totalScore.A}</span>
                  </KeyValue>
                  <KeyValue label={`执B · ${sideName('B')}`}>
                    <span className='text-lg font-bold text-(--side-b)'>{match.result.totalScore.B}</span>
                  </KeyValue>
                </div>
              </div>
            </Card>
            <Card>
              <p className='panel-label'>裁判理由（散文）</p>
              <p className='panel-copy text-sm'>{match.result.judgeProse}</p>
            </Card>
          </div>

          {/* 首战结束后展示三个模式 tab，进入正常迭代循环（#12） */}
          {match.isFirstBattle && (
            <Card className='border-(--accent)/30'>
              <p className='panel-label'>首战完成 · 三种构建模式已解锁</p>
              <p className='panel-copy mb-4 text-sm'>
                从现在起你可以用任意模式迭代你的智能体，双方提示词都可以编写，并解锁 PVE 之外的进阶路线。
              </p>
              <div className='flex flex-wrap gap-2'>
                {(
                  [
                    { mode: 'mcq', label: 'MCQ 选择题拼装' },
                    { mode: 'basic', label: 'Basic 直接写提示词' },
                    { mode: 'meta', label: '元提示词（用你自己的 AI）' },
                  ] as const
                ).map((m) => (
                  <Link
                    key={m.mode}
                    to={`/scenarios/${match.scenarioId}/build?mode=${m.mode}`}
                    className='inline-flex items-center gap-2 rounded-full border border-(--border) bg-white/4 px-4 py-2 text-sm font-medium text-(--foreground) transition hover:bg-white/8'
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* 计分推导（#26）：精确权重全公开；LLM 软判断如实展示 */}
          <section className='app-panel'>
            <p className='panel-label'>计分推导</p>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[640px] text-left text-sm'>
                <thead>
                  <tr className='border-b border-(--border) text-[11px] uppercase tracking-[0.14em] text-(--foreground-muted)'>
                    <th className='py-2 pr-3 font-semibold'>维度</th>
                    <th className='py-2 pr-3 font-semibold'>权重</th>
                    <th className='py-2 pr-3 font-semibold'>类型</th>
                    <th className='py-2 pr-3 font-semibold text-(--side-a)'>A 得分</th>
                    <th className='py-2 pr-3 font-semibold text-(--side-b)'>B 得分</th>
                    <th className='py-2 font-semibold'>判定说明</th>
                  </tr>
                </thead>
                <tbody>
                  {match.result.breakdown.map((row) => (
                    <tr key={row.key} className='border-b border-(--border-soft) align-top'>
                      <td className='py-2.5 pr-3 font-medium text-(--foreground)'>{row.label}</td>
                      <td className='py-2.5 pr-3 font-mono text-(--foreground-subtle)'>{row.weight}</td>
                      <td className='py-2.5 pr-3'>
                        <Badge tone={row.kind === 'structured' ? 'info' : 'warning'}>
                          {row.kind === 'structured' ? '结构化' : 'LLM 软判断'}
                        </Badge>
                      </td>
                      <td className='py-2.5 pr-3 font-mono text-(--side-a)'>{row.scoreA}</td>
                      <td className='py-2.5 pr-3 font-mono text-(--side-b)'>{row.scoreB}</td>
                      <td className='py-2.5 text-(--foreground-subtle)'>{row.reasoning}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className='py-2.5 pr-3 font-bold text-(--foreground)'>加权总分</td>
                    <td className='py-2.5 pr-3' />
                    <td className='py-2.5 pr-3' />
                    <td className='py-2.5 pr-3 font-mono font-bold text-(--side-a)'>{match.result.totalScore.A}</td>
                    <td className='py-2.5 pr-3 font-mono font-bold text-(--side-b)'>{match.result.totalScore.B}</td>
                    <td className='py-2.5' />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className='mt-3 text-xs text-(--foreground-muted)'>精确权重全公开；LLM 软判断如实展示。</p>
          </section>

          {/* 赛后问询 */}
          <section className='app-panel'>
            <p className='panel-label'>赛后问询</p>
            <div className='flex flex-col gap-4'>
              {match.judgeQa.map((qa, i) => (
                <div key={i} className='flex flex-col gap-1.5'>
                  <p className='text-sm text-(--foreground)'>
                    <span className='mr-2 font-semibold text-(--foreground-subtle)'>{judgeName} 问 · </span>
                    <Badge tone={qa.side === 'A' ? 'sideA' : 'sideB'}>执{qa.side} {sideName(qa.side)}</Badge>
                    <span className='ml-2'>{qa.question}</span>
                  </p>
                  <p className={cn('border-l-2 pl-3 text-sm text-(--foreground-subtle)', qa.side === 'A' ? 'border-(--side-a)' : 'border-(--side-b)')}>
                    {qa.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 隐藏目标过程 */}
          <section className='app-panel'>
            <p className='panel-label'>隐藏目标过程</p>
            <p className='panel-copy text-sm'>{match.result.hiddenGoalReveal}</p>
          </section>
        </>
      )}

      {/* ---------- debug mode 附加层（#22 修订）：裁判真实 trace 公开 + 己方 trace 仅所有者（#20） ---------- */}
      {state.debugMode && !replaying && match.status !== 'queued' && (
        <section className='flex flex-col gap-4 rounded-2xl border border-dashed border-(--border) p-5'>
          <p className='panel-label mb-0 flex items-center gap-2'>
            <Bug className='h-3.5 w-3.5' />
            debug mode · 内心 OS trace 层
          </p>
          <TraceBlock
            title={`裁判真实 thinking trace（公开）`}
            trace={match.judgeTrace}
            emptyNote='裁判 trace 在判决生成后可见。'
          />
          {(['A', 'B'] as const).map((s) => {
            const p = match.participants[s]
            const isOwner = p.ownerId !== null && p.ownerId === userId
            return (
              <div key={s}>
                <p className='mb-2 flex items-center gap-2 text-xs font-semibold text-(--foreground-subtle)'>
                  <Badge tone={s === 'A' ? 'sideA' : 'sideB'}>执{s}</Badge>
                  {p.displayName} · 己方 OS trace
                </p>
                {p.kind === 'npc' ? (
                  <p className='text-xs text-(--foreground-muted)'>PVE-NPC 侧无己方 OS trace。</p>
                ) : isOwner ? (
                  <TraceBlock title='己方真实 thinking trace（仅你可见）' trace={match.selfTrace[s]} emptyNote='对局完成后生成。' />
                ) : (
                  <p className='inline-flex items-center gap-1.5 text-xs text-(--foreground-muted)'>
                    <Lock className='h-3.5 w-3.5' />
                    仅所有者可见
                  </p>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}

// ---------- 子组件 ----------

function ParticipantCard({
  side,
  participant,
  sideName,
  copied,
  onCopy,
}: {
  side: Side
  participant: MatchParticipant
  sideName: string
  copied: string | null
  onCopy: (key: string, text: string) => void
}) {
  const copyKey = `vid-${side}`
  return (
    <Card className={cn('border-l-2', side === 'A' ? 'border-l-(--side-a)' : 'border-l-(--side-b)')}>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={side === 'A' ? 'sideA' : 'sideB'}>执{side} · {sideName}</Badge>
        <span className='font-semibold text-(--foreground)'>{participant.displayName}</span>
      </div>
      <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-(--foreground-subtle)'>
        {/* 模型永远公开（#21） */}
        <span className='rounded-full border border-(--border) px-2 py-0.5 font-mono'>{participant.model}</span>
        {participant.versionId !== null ? (
          <>
            {/* 双方版本 id 可分享——按 id 约战的发现路径（#25） */}
            <code className='rounded-md border border-(--border) bg-white/4 px-2 py-0.5 font-mono text-(--foreground)'>
              {participant.versionId}
            </code>
            <button
              type='button'
              onClick={() => onCopy(copyKey, participant.versionId ?? '')}
              className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-(--foreground-subtle) transition hover:bg-white/6 hover:text-(--foreground)'
            >
              {copied === copyKey ? <Check className='h-3 w-3 text-(--success)' /> : <Copy className='h-3 w-3' />}
              {copied === copyKey ? '已复制' : '复制 id'}
            </button>
            <span className='text-(--foreground-muted)'>可用于按 id 约战</span>
          </>
        ) : (
          <span className='text-(--foreground-muted)'>PVE-NPC · {participant.displayName}</span>
        )}
      </div>
    </Card>
  )
}

function TurnBlock({ turn }: { turn: DialogueTurn }) {
  const isA = turn.side === 'A'
  return (
    <div
      className={cn(
        'rounded-xl border-l-2 p-3.5',
        isA ? 'border-(--side-a) bg-sky-950/15' : 'border-(--side-b) bg-amber-950/15',
      )}
    >
      <div className='mb-1.5 flex items-center gap-2'>
        <Badge tone={isA ? 'sideA' : 'sideB'}>执{turn.side}</Badge>
        <span className='text-xs font-semibold text-(--foreground-subtle)'>{turn.speaker} · 第 {turn.turn} 轮</span>
      </div>
      <p className='text-sm leading-relaxed text-(--foreground)'>{turn.text}</p>
    </div>
  )
}

function JudgeOsBlock({
  entry,
  judgeName,
  sideName,
  anchored,
  onContinue,
}: {
  entry: JudgeOsEntry
  judgeName: string
  sideName: (s: Side) => string
  anchored: boolean
  onContinue: () => void
}) {
  const { favor, strength, changed, attention } = entry.tendency
  return (
    <div
      className={cn(
        'mx-2 rounded-xl border border-dashed p-3 sm:mx-6',
        changed ? 'border-(--accent)/50 bg-(--accent)/5' : 'border-(--border) bg-white/[0.02]',
        anchored && 'border-solid border-(--accent) ring-2 ring-(--accent)/30',
      )}
    >
      <div className='mb-1 flex flex-wrap items-center gap-2 text-xs text-(--foreground-muted)'>
        <Scale className='h-3.5 w-3.5' />
        <span className='font-semibold'>{judgeName} · 内心 OS</span>
        <span>（第 {entry.afterTurn} 轮后）</span>
        {changed && <Badge tone='accent'>转折点</Badge>}
      </div>
      <p className='text-sm italic leading-relaxed text-(--foreground-subtle)'>{entry.text}</p>
      {/* 结构化倾向数据（#24）：回放的教学锚点 */}
      <div className='mt-2 flex flex-wrap items-center gap-2 text-[11px]'>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 font-semibold',
            favor === 'A' && 'border-sky-800/60 text-(--side-a)',
            favor === 'B' && 'border-amber-800/60 text-(--side-b)',
            favor === 'even' && 'border-(--border) text-(--foreground-subtle)',
          )}
        >
          倾向：{favor === 'even' ? '均势' : `${sideName(favor)} ▲${strength.toFixed(1)}`}
        </span>
        <span className='text-(--foreground-muted)'>关注：{attention}</span>
      </div>
      {anchored && (
        <div className='mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-(--accent)/10 p-3'>
          <p className='text-sm font-semibold text-(--accent)'>
            裁判倾向变化：转向{favor === 'even' ? '均势' : `${sideName(favor as Side)}（强度 ${strength.toFixed(1)}）`}——{attention}
          </p>
          <Button size='sm' onClick={onContinue}>
            <Play className='h-3.5 w-3.5' />
            继续
          </Button>
        </div>
      )}
    </div>
  )
}

/** 裁判倾向轨迹条：A / 均 / B 标记序列，一眼看清全局弧线（#24） */
function TendencyStrip({ entries, sideName }: { entries: JudgeOsEntry[]; sideName: (s: Side) => string }) {
  return (
    <div className='app-panel'>
      <p className='panel-label'>裁判倾向轨迹</p>
      <div className='flex flex-wrap items-center gap-1.5'>
        {entries.map((e) => (
          <span
            key={e.afterTurn}
            title={`第 ${e.afterTurn} 轮后 · ${e.tendency.favor === 'even' ? '均势' : `倾向${sideName(e.tendency.favor)} ${e.tendency.strength.toFixed(1)}`} · ${e.tendency.attention}`}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold',
              e.tendency.favor === 'A' && 'bg-sky-950/60 text-(--side-a)',
              e.tendency.favor === 'B' && 'bg-amber-950/60 text-(--side-b)',
              e.tendency.favor === 'even' && 'bg-white/6 text-(--foreground-muted)',
              e.tendency.changed && 'ring-1 ring-(--accent)',
            )}
          >
            {e.tendency.favor === 'even' ? '均' : e.tendency.favor}
          </span>
        ))}
        <span className='ml-2 text-[11px] text-(--foreground-muted)'>带红圈 = 倾向转折点</span>
      </div>
    </div>
  )
}

function TraceBlock({ title, trace, emptyNote }: { title: string; trace: string | null; emptyNote: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='rounded-xl border border-(--border-soft) bg-white/[0.02]'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-(--foreground-subtle) transition hover:text-(--foreground)'
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        (trace ? (
          <pre className='overflow-x-auto whitespace-pre-wrap border-t border-(--border-soft) px-3.5 py-3 font-mono text-xs leading-relaxed text-(--foreground-subtle)'>
            {trace}
          </pre>
        ) : (
          <p className='border-t border-(--border-soft) px-3.5 py-3 text-xs text-(--foreground-muted)'>{emptyNote}</p>
        ))}
    </div>
  )
}
