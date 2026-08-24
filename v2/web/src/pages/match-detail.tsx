import { Check, Copy } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { builder, matches } from '../api/client'
import { useMatchStream } from '../api/sse'
import type {
  MatchParticipantDTO,
  MatchParticipantsDTO,
  MatchSummary,
  Side,
  VerdictDTO,
} from '../api/types'
import { JudgeTrendChart } from '../components/judge-trend'
import { ReplayControls, useReplay } from '../components/replay-controls'
import type { SpeakerLabels } from '../components/timeline/labels'
import {
  sideName,
  speakerLabels,
  speakerName,
} from '../components/timeline/labels'
import { OsBeatCard } from '../components/timeline/os-beat-card'
import { ReasoningFold } from '../components/timeline/reasoning-fold'
import { TranscriptStage } from '../components/timeline/stage'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { VerdictBody, VerdictCard } from '../components/verdict-card'
import { useOptionalAuth } from '../context/auth'
import { cn } from '../lib/cn'
import { outcomeCopy } from '../lib/outcome'
import { buildReplaySteps, replayBeats, replayReveal } from '../lib/replay'
import type { LedgerItem, ScoreBreakdown } from '../lib/scoring-reasoning'
import {
  deriveScoreBreakdown,
  formatDelta,
  formatScoringReasoning,
  ledgerShortLabel,
  parseLedger,
} from '../lib/scoring-reasoning'
import { usePinToBottom } from '../lib/scroll'
import {
  absorbedActSeqs,
  groupTranscript,
  isInquiryChannel,
  isInquiryGroup,
  placeVerdicts,
} from '../lib/transcript'
import { messageOf, useAsync } from '../lib/use-async'
import { isOsBeatVerdict, isTerminalVerdict } from '../lib/verdict'

export function MatchDetailPage() {
  const { matchId = '' } = useParams()
  const matchID = Number(matchId)
  const location = useLocation()
  // auth 在这里只是增强（首战完局翻新 firstBattleDone）：Provider 之外
  // （stories）拿到 null，静默跳过。
  const optionalAuth = useOptionalAuth()
  const refreshAuth = optionalAuth?.refresh ?? null
  // 旅程卡（#67/V23）的诚实判据：express 流程把标记随导航 state 一路带到
  // 实况页——只有确知是首战的对局才展示，不做「猜第一场」的启发式。
  const expressArrival =
    (location.state as { express?: boolean } | null)?.express === true
  const { data, error, loading, reload } = useAsync(
    () => matches.detail(matchID),
    [matchID],
  )
  // 调试模式 (#22)：model reasoning traces (内心 folds, live thinking deltas) are
  // hidden until switched on. A UI mask only in this stage — the stream still
  // carries the deltas; the renderer just never mounts them. Dialogue, events,
  // verdicts and the 心声 cards are never gated.
  const [debug, setDebug] = useState(false)

  const labels: SpeakerLabels = speakerLabels(
    data?.summary.scenarioID,
    data?.speakerLabels ?? {},
  )
  // A role-cast match names its lanes after the roles, so which role stood for
  // which side is read back off the transcript rather than off the labels.
  const speakers = data?.turns.map((turn) => turn.speaker) ?? []
  const sideA = sideName(labels, 'a', speakers)
  const sideB = sideName(labels, 'b', speakers)

  const live = data != null && !data.summary.finished
  const stream = useMatchStream(matchID, live)

  // 约战 ①/② 互链（#66，mock V21）：契约只带本场的 challengeID/leg，没有
  // siblingMatchID——另一条腿从 matches.list() 里按同 challengeID 找（两条腿
  // 我都是参战方，列表必含）。找不到/接口失败 → 只显徽章不给链接。
  const challengeID = data?.summary.challengeID ?? null
  // F7：保存整个兄弟 MatchSummary 而不只是 id——互链旁直接标注另一场结果。
  const [sibling, setSibling] = useState<MatchSummary | null>(null)
  useEffect(() => {
    setSibling(null)
    if (challengeID == null) return
    let liveLookup = true
    void matches
      .list()
      .then((response) => {
        if (!liveLookup) return
        setSibling(
          response.matches.find(
            (match) =>
              match.challengeID === challengeID && match.id !== matchID,
          ) ?? null,
        )
      })
      .catch(() => {})
    return () => {
      liveLookup = false
    }
  }, [challengeID, matchID])

  useEffect(() => {
    if (stream.done) reload()
  }, [stream.done, reload])

  // Chunks carry the content of the turn in flight; the committed row still comes
  // from a refetch, but only at a landmark (turn/verdict), never per token.
  const landmark = stream.landmark == null
    ? null
    : JSON.stringify(stream.landmark)
  useEffect(() => {
    if (landmark != null) reload()
  }, [landmark, reload])

  // 完局战报 (#69): a finished, scored match reads 结果 → 对话全文 → 问询 →
  // 计分推导. Anything short of that (queued, live, finished-but-unscored)
  // keeps the live layout untouched.
  const finished = data != null && data.summary.finished &&
    data.summary.scored

  // 首战完局把 me.firstBattleDone 翻真（服务端推导）：就地刷新 auth 上下文，
  // 让 /express 的让路逻辑立刻生效。失败无害——下次全量刷新自然对齐。
  useEffect(() => {
    if (expressArrival && finished) void refreshAuth?.().catch(() => {})
  }, [expressArrival, finished, refreshAuth])

  // 回放（#24/A7）：纯前端重演。问询腿在回放里整段隐藏（终局剧透），所以
  // 它的行不进入步骤序列——各场景的问询都在对话之后，前缀行数不受影响，
  // 节拍的 afterSeq 锚点照常成立。
  const inquiryChannels = useMemo(() => {
    const set = new Set<string>()
    if (data == null) return set
    for (const stage of data.stages) {
      for (const channel of stage.channels) {
        if (stage.title.includes('问询') || isInquiryChannel(channel.id)) {
          set.add(channel.id)
        }
      }
    }
    return set
  }, [data])
  // 整行都是结构化载荷的 act 行不渲染（内容在它自己的裁决卡里，#22）——回放
  // 也不能为它花一拍。这些行的节拍 afterSeq 恰等于该行 seq，flushBeats 仍在它
  // 原本的位置之前触发，节拍次序不变。
  const absorbed = useMemo(
    () => absorbedActSeqs(data?.turns ?? [], data?.verdicts ?? []),
    [data],
  )
  const replaySteps = useMemo(() => {
    if (data == null) return []
    return buildReplaySteps(
      data.turns.filter((turn) =>
        !inquiryChannels.has(turn.channel) && !isInquiryChannel(turn.channel) &&
        !absorbed.has(turn.seq)
      ),
      data.verdicts,
    )
  }, [data, inquiryChannels, absorbed])
  const replay = useReplay(replaySteps)
  const replaying = finished && replay.state.active
  const reveal = replaying
    ? replayReveal(replaySteps, replay.state.cursor)
    : null

  const shownTurns = data == null
    ? []
    : reveal == null
    ? data.turns
    : data.turns.filter((turn) => reveal.seqs.has(turn.seq))
  const stageGroups = data
    ? groupTranscript(shownTurns, data.stages, stream.bubbles, data.verdicts)
    : []
  const interimSource =
    data?.verdicts.filter((verdict) => !isTerminalVerdict(verdict)) ?? []
  // 回放揭示切片：节拍按其步骤揭示，其余过程裁决按 afterSeq 跟上已揭示行数。
  // 锚在问询行上的裁决（inquiry-a/b 的猜测 act）是终局剧透：问询腿整段不进
  // 回放，它们也一并压下——afterSeq 数的是全部行、reveal.rows 数的是非问询
  // 行，二者错位会让这些卡提前漏出（评审确认项）。
  const inquiryAnchored = (verdict: VerdictDTO) => {
    if (/^inquiry([-_.]|$)/i.test(verdict.key)) return true
    const anchor = verdict.afterSeq > 0
      ? data?.turns[verdict.afterSeq - 1]
      : undefined
    return anchor != null &&
      (inquiryChannels.has(anchor.channel) || isInquiryChannel(anchor.channel))
  }
  const shownInterim = reveal == null ? interimSource : interimSource.filter(
    (verdict) =>
      isOsBeatVerdict(verdict)
        ? reveal.beatKeys.has(verdict.key)
        : verdict.afterSeq <= reveal.rows && !inquiryAnchored(verdict),
  )
  const interim = placeVerdicts(stageGroups, shownInterim)
  const finalVerdict = data?.verdicts.find(isTerminalVerdict) ?? null
  // A private generation (an `act` with no channel, an affordance-only reply) has
  // no timeline row to grow into; it belongs to the status card, not the script.
  const offstage = stream.bubbles.filter((bubble) => bubble.seq < 0)

  const grown = stream.bubbles.reduce(
    (total, bubble) => total + bubble.text.length + bubble.reasoning.length,
    data?.turns.length ?? 0,
  )
  // 回放推进时同样跟底——读者向上滚动即解除，与实况一致。
  usePinToBottom(live || replaying, replaying ? replay.state.cursor : grown)

  if (loading && data == null) {
    return (
      <div className='space-y-6'>
        <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
      </div>
    )
  }
  if (!data) {
    return (
      <div className='space-y-6'>
        <div className='rounded-xl border border-(--border-soft) bg-white/2 px-6 py-8 text-center text-sm'>
          <p className='font-semibold text-(--foreground)'>
            {error ?? '对局不存在'}
          </p>
          <p className='mt-2 text-(--foreground-subtle)'>
            该对局可能已被删除或链接无效。
          </p>
          <div className='mt-5 flex justify-center'>
            <Link
              to='/matches'
              className='inline-flex items-center rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90'
            >
              返回对战列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 一次 act 生成的真实推演轨迹存在它那一行上（turn.reasoning）；行被吸收后
  // 轨迹随卡走，这是 #22② 要暴露的东西——原始标签不是。
  const traceOf = (verdict: VerdictDTO) =>
    data.turns.find(
      (turn) => turn.seq === verdict.afterSeq && turn.kind === 'dialogue',
    )?.reasoning ?? null
  const showTrace = debug && !replaying

  // 教学锚点（#24 U9）：回放停在倾向变化的节拍上，心声卡就地高亮并给「继续」。
  const interimVerdict = (verdict: VerdictDTO) => {
    if (isOsBeatVerdict(verdict)) {
      const anchored = replaying && replay.state.anchorKey === verdict.key
      return (
        <OsBeatCard
          key={verdict.key}
          verdict={verdict}
          labels={labels}
          highlight={anchored}
          onResume={anchored ? replay.togglePlay : undefined}
          trace={traceOf(verdict)}
          showTrace={showTrace}
        />
      )
    }
    return (
      <VerdictCard
        key={verdict.key}
        verdict={verdict}
        labels={labels}
        interim
        trace={traceOf(verdict)}
        showTrace={showTrace}
      />
    )
  }

  const groupRows = stageGroups.map((group, index) => ({
    group,
    index,
    verdicts: interim.perGroup[index],
  }))
  // The 问询 leg moves under its own section in the finished layout — with its
  // original stage numbering, since it is extracted, not renumbered.
  const inquiryRows = finished
    ? groupRows.filter((row) => isInquiryGroup(row.group))
    : []
  const dialogueRows = finished
    ? groupRows.filter((row) => !isInquiryGroup(row.group))
    : groupRows

  // afterSeq 是「已提交行数」：第 afterSeq 行（turns[afterSeq-1]）之后就是
  // 这条裁决的时间线位置——按行内插，而不是压到整个阶段末尾（#22①）。
  const anchorRowSeq = (verdict: VerdictDTO) => {
    if (verdict.afterSeq <= 0) return null
    const anchor = data.turns[verdict.afterSeq - 1]
    return anchor ? anchor.seq : null
  }

  const renderGroupRow = (row: (typeof groupRows)[number]) => {
    const bySeq: Record<number, ReactNode[]> = {}
    const atGroupEnd: VerdictDTO[] = []
    for (const verdict of row.verdicts) {
      const anchor = anchorRowSeq(verdict)
      const inGroup = anchor != null &&
        row.group.channels.some((channel) =>
          channel.items.some((item) =>
            item.kind !== 'live' && item.seq === anchor
          )
        )
      if (anchor != null && inGroup) {
        ;(bySeq[anchor] ??= []).push(interimVerdict(verdict))
      } else {
        atGroupEnd.push(verdict)
      }
    }
    return (
      <div key={row.group.id} className='space-y-3'>
        <TranscriptStage
          group={row.group}
          index={row.index}
          total={stageGroups.length}
          labels={labels}
          scenarioID={data.summary.scenarioID}
          // B1 · 08-10：回放是公开教学层，进行中强制隐藏 debug/trace 层。
          showReasoning={debug && !replaying}
          verdictsBySeq={bySeq}
        />
        {atGroupEnd.map(interimVerdict)}
      </div>
    )
  }

  // 调试开关易被错过（评审反馈）：完局战报里若确有可揭示的思考轨迹而调试
  // 未开，就在第一幕上方给一行安静的提示（不是横幅；实况布局不加）。
  const hasHiddenReasoning = data.turns.some(
    (turn) => (turn.reasoning ?? '').trim() !== '',
  )

  const breakdown = finished ? deriveScoreBreakdown(data.turns) : null
  // 裁判倾向轨迹（#24）：节拍序列（含 changed 元数据）；零节拍不出图。
  const beats = replayBeats(replaySteps)
  const ledger = formatScoringReasoning(data.reasoning)
  // F2（#69/#26）：把散文得分账解析成结构化条目——正负号、归侧、识破标记。
  // 解析不产出数字：合计与得分变化的兜底一律用服务端 scoreA/scoreB。
  const parsed = finished
    ? parseLedger(data.reasoning, {
      slotID: data.summary.scenarioID,
      lanes: data.speakerLabels,
    })
    : null
  const ledgerFor = (side: Side) =>
    parsed?.items.filter((item) => item.side === side) ?? []
  // 结果卡比分下的签名明细（F2）：如「甘龙 +1 大政方针 · -1 被识破 = 0」。
  const sideSummaryLine = (side: Side): string => {
    const name = side === 'a' ? sideA : sideB
    const items = ledgerFor(side)
    const total = parsed?.subtotals?.[side] ?? 0
    if (items.length === 0) return `${name} 无增减 = ${total}`
    const parts = items.map((item) =>
      `${formatDelta(item.delta)} ${ledgerShortLabel(item)}`
    )
    return `${name} ${parts.join(' · ')} = ${total}`
  }
  const winner = data.summary.winner
  // F7（#69/#71）：胜负行带视角——我方（商鞅）胜 / 对方（甘龙）胜；旁观与
  // open 历史回退「胜方 角色」；左右手互搏单独标注。
  const outcome = outcomeCopy(
    { winner, participants: data.summary.participants },
    { a: sideA, b: sideB },
  )
  const winnerLine = outcome ?? '已结束'

  // P3 头部元数据（#71/#25，mock V21）：epoch 秒 → 紧凑本地时间。
  const compactTime = (epochSeconds: number) =>
    new Date(epochSeconds * 1000).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  const participants = data.summary.participants ?? null
  const challengeLeg = data.summary.challengeLeg ?? null
  // F7：兄弟场（约战另一条腿）已判定时，把它的结果写在互链旁。
  const siblingOutcome = sibling != null && sibling.finished && sibling.scored
    ? outcomeCopy(sibling, { a: sideA, b: sideB })
    : null

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Link to='/my-agents' className='text-sm text-(--accent)'>
            ← 我的智能体
          </Link>
          <h1 className='mt-1 text-2xl font-black tracking-tight text-(--foreground)'>
            对战 #{data.summary.id}
          </h1>
          <p className='mt-1 text-sm text-(--foreground-subtle)'>
            {data.summary.scenarioTitle} · {sideA} 对{sideB}
          </p>
          {data.summary.createdAt != null || data.summary.finishedAt != null
            ? (
              <p className='mt-0.5 text-xs text-(--foreground-muted)'>
                {data.summary.createdAt != null
                  ? `发起 ${compactTime(data.summary.createdAt)}`
                  : null}
                {data.summary.createdAt != null &&
                    data.summary.finishedAt != null
                  ? ' · '
                  : null}
                {data.summary.finishedAt != null
                  ? `完局 ${compactTime(data.summary.finishedAt)}`
                  : null}
              </p>
            )
            : null}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            role='switch'
            aria-checked={debug && !replaying}
            // B1 · 08-10：回放中强制隐藏 debug 层——开关禁用（aria-disabled
            // 而非 disabled，让 title 提示可悬停出现），退出回放后恢复原值。
            aria-disabled={replaying}
            title={replaying ? '回放中不可用' : undefined}
            onClick={() => {
              if (!replaying) setDebug((value) => !value)
            }}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground)',
              replaying && 'cursor-not-allowed opacity-45',
            )}
          >
            调试模式
            <span
              className={cn(
                'inline-flex h-4 w-7 items-center rounded-full transition-colors',
                debug && !replaying ? 'bg-(--accent)' : 'bg-white/10',
              )}
            >
              <span
                className={cn(
                  'inline-block h-3 w-3 translate-x-0.5 rounded-full bg-white transition-transform',
                  debug && !replaying && 'translate-x-3.5',
                )}
              />
            </span>
          </button>
          {finished && !replaying && replaySteps.length > 0
            ? (
              <button
                type='button'
                onClick={replay.start}
                className='inline-flex cursor-pointer items-center rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground)'
              >
                回放
              </button>
            )
            : null}
          {/* #66 成对约战：标出这是一对中的第几场，另一场给互链（mock V21）。 */}
          {challengeLeg != null
            ? (
              <Badge tone='accent'>
                约战{challengeLeg === 1 ? '①' : '②'}
              </Badge>
            )
            : null}
          {challengeLeg != null && sibling != null
            ? (
              <Link
                to={`/matches/${sibling.id}`}
                className='text-xs font-semibold text-(--accent) underline-offset-2 hover:underline'
              >
                {/* F7：互链旁标注另一场的结果，两场胜负一屏看全。 */}
                查看另一场（{challengeLeg === 1 ? '②' : '①'}
                {siblingOutcome != null ? `：${siblingOutcome}` : ''}）→
              </Link>
            )
            : null}
          {/* #67：顶部只有小锚点，旅程卡本体在页底。 */}
          {expressArrival && finished && !replaying
            ? (
              <a
                href='#first-battle-journey'
                className='text-xs font-semibold text-(--accent) underline-offset-2 hover:underline'
              >
                首战旅程 ↓
              </a>
            )
            : null}
          <Badge tone='info'>{data.summary.kind.toUpperCase()}</Badge>
          {data.summary.finished
            ? (
              // 回放中不剧透胜负——结果徽章换成中性的回放态。
              replaying ? <Badge tone='info'>回放中</Badge> : (
                // F7：徽记与结果卡同一口径（outcomeCopy）。
                <Badge tone='success'>{outcome ?? '已结束'}</Badge>
              )
            )
            : (
              <Badge tone='warning'>
                {stream.connected ? '直播中' : '进行中'}
              </Badge>
            )}
        </div>
      </div>

      {/* 参战双方（P3 G20，#71/#25）：老服务器无 participants → 整块不渲染。 */}
      {participants
        ? (
          <div className='grid gap-3 md:grid-cols-2'>
            <ParticipantCard
              which='a'
              sideLabel={sideA}
              participant={participants.a}
            />
            <ParticipantCard
              which='b'
              sideLabel={sideB}
              participant={participants.b}
            />
          </div>
        )
        : null}

      {finished
        ? (
          <>
            {
              /* 回放中（#24/A7）：结果卡、判词、问询、计分推导都是终局剧透，
              整段隐藏；控制条置顶，倾向轨迹小图随揭示逐点生长兼作进度感。 */
            }
            {replaying
              ? (
                <ReplayControls handle={replay} total={replaySteps.length}>
                  <JudgeTrendChart
                    beats={beats}
                    labels={labels}
                    speakers={speakers}
                    revealedKeys={reveal?.beatKeys ?? null}
                  />
                </ReplayControls>
              )
              : (
                <Card>
                  <CardContent className='space-y-4 pt-5'>
                    <h2 className='text-sm font-semibold text-(--foreground)'>
                      结果
                    </h2>
                    <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                      <span className='text-xl font-black text-(--foreground)'>
                        {winnerLine}
                      </span>
                      <span className='text-sm text-(--foreground-subtle)'>
                        比分 {sideA}{' '}
                        <span className='text-lg font-black text-(--foreground)'>
                          {data.scoreA ?? '—'} : {data.scoreB ?? '—'}
                        </span>{' '}
                        {sideB}
                      </span>
                    </div>
                    {
                      /* F2（#69）：比分下的签名明细——「被识破 −1」这类增减
                      在结果卡就说清，不必读到页底的得分账。 */
                    }
                    {parsed != null && parsed.items.length > 0 &&
                        parsed.subtotals != null
                      ? (
                        <div className='space-y-0.5 text-xs text-(--foreground-subtle)'>
                          {(['a', 'b'] as const).map((side) => (
                            <p key={side}>{sideSummaryLine(side)}</p>
                          ))}
                        </div>
                      )
                      : null}
                    {finalVerdict
                      ? (
                        <div className='space-y-3 border-t border-(--border-soft) pt-4'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
                              判词
                            </p>
                            <span className='text-xs text-(--foreground-muted)'>
                              {finalVerdict.model}
                            </span>
                          </div>
                          <VerdictBody verdict={finalVerdict} labels={labels} />
                          {showTrace
                            ? (
                              <ReasoningFold
                                text={traceOf(finalVerdict) ?? ''}
                              />
                            )
                            : null}
                        </div>
                      )
                      : null}
                  </CardContent>
                </Card>
              )}

            <div className='space-y-5'>
              <h2 className='text-sm font-semibold text-(--foreground)'>
                {replaying ? '对话重演' : '对话全文'}
              </h2>
              {!replaying && !debug && hasHiddenReasoning &&
                  dialogueRows.length > 0
                ? (
                  <p className='text-xs text-(--foreground-muted)'>
                    内心与思考过程默认隐藏——页头「调试模式」可开启
                  </p>
                )
                : null}
              {dialogueRows.length === 0
                ? (
                  <p className='text-sm text-(--foreground-muted)'>
                    {replaying ? '回放即将开始…' : '暂无回合。'}
                  </p>
                )
                : dialogueRows.map(renderGroupRow)}
              {interim.trailing.map(interimVerdict)}
            </div>

            {!replaying && inquiryRows.length > 0
              ? (
                <div className='space-y-5'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    问询
                  </h2>
                  {inquiryRows.map(renderGroupRow)}
                </div>
              )
              : null}

            {
              /* F2 · #69：独立的「隐藏目标」五步区块，排在问询与计分推导之
              间——真目标 → 是否达成 → 对手猜了什么 → 是否被识破 → 得分
              变化。散文里那条「被识破 −1」在这里成为明确的一步。 */
            }
            {!replaying && breakdown?.trueRequests != null &&
                (breakdown.trueRequests.a != null ||
                  breakdown.trueRequests.b != null)
              ? (
                <div className='space-y-3'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    隐藏目标
                  </h2>
                  <div className='grid gap-3 md:grid-cols-2'>
                    {(['a', 'b'] as const)
                      .filter((side) => breakdown.trueRequests?.[side] != null)
                      .map((side) => (
                        <HiddenGoalCard
                          key={side}
                          side={side}
                          name={side === 'a' ? sideA : sideB}
                          otherName={side === 'a' ? sideB : sideA}
                          breakdown={breakdown}
                          items={ledgerFor(side)}
                          total={parsed?.subtotals?.[side] ??
                            (side === 'a' ? data.scoreA : data.scoreB) ??
                            null}
                        />
                      ))}
                  </div>
                </div>
              )
              : null}

            {replaying ? null : (
              <div className='space-y-3'>
                <h2 className='text-sm font-semibold text-(--foreground)'>
                  计分推导
                </h2>
                {beats.length > 0
                  ? (
                    <Card>
                      <CardContent className='pt-5'>
                        <JudgeTrendChart
                          beats={beats}
                          labels={labels}
                          speakers={speakers}
                        />
                      </CardContent>
                    </Card>
                  )
                  : null}
                {breakdown == null && !ledger
                  ? (
                    <div className='rounded-xl border border-dashed border-(--border) px-4 py-5 text-center text-sm text-(--foreground-muted)'>
                      此场景暂未提供计分明细
                    </div>
                  )
                  : (
                    <Card>
                      <CardContent className='space-y-3 pt-5'>
                        {breakdown?.trueRequests
                          ? (
                            <LedgerLine label='真目标'>
                              <div className='flex flex-wrap gap-x-4 gap-y-1'>
                                {Object.entries(breakdown.trueRequests).map(
                                  ([side, id]) => (
                                    <span key={side}>
                                      {speakerName(labels, side)}{' '}
                                      <span className='font-mono'>{id}</span>
                                    </span>
                                  ),
                                )}
                              </div>
                            </LedgerLine>
                          )
                          : null}
                        {breakdown?.guesses
                          ? (
                            <LedgerLine label='对方猜测'>
                              <div className='flex flex-wrap gap-x-4 gap-y-1'>
                                {Object.entries(breakdown.guesses).map(
                                  ([side, guess]) => (
                                    <span key={side}>
                                      {speakerName(labels, side)} 猜{' '}
                                      <span className='font-mono'>{guess}</span>
                                    </span>
                                  ),
                                )}
                              </div>
                            </LedgerLine>
                          )
                          : null}
                        {breakdown?.rulings
                          ? (
                            <LedgerLine label='准驳结果'>
                              <div className='flex flex-wrap gap-1.5'>
                                {Object.entries(breakdown.rulings).map(
                                  ([id, decision]) => (
                                    <span
                                      key={id}
                                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${
                                        decision === '同意'
                                          ? 'bg-[rgba(52,211,153,0.12)] text-(--success)'
                                          : 'bg-white/4 text-(--foreground-muted)'
                                      }`}
                                    >
                                      <span className='font-mono'>{id}</span>
                                      {decision}
                                    </span>
                                  ),
                                )}
                              </div>
                            </LedgerLine>
                          )
                          : null}
                        {
                          /* F2（#69/#26）：得分账升格为逐项账目表——带符号
                          分值、被识破标记、分侧小计与合计；解析不出条目
                          （LLM 散文计分的场景）时整段散文原样回退。 */
                        }
                        {parsed != null && parsed.items.length > 0
                          ? (
                            <LedgerLine label='得分账'>
                              <div className='space-y-1.5'>
                                {parsed.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className='flex items-baseline justify-between gap-3'
                                  >
                                    <span className='min-w-0 text-sm text-(--foreground-subtle)'>
                                      <span className='font-semibold text-(--foreground)'>
                                        {item.name}
                                      </span>
                                      {' · '}
                                      <span>{item.why}</span>
                                      {item.kind === 'identified'
                                        ? (
                                          <span className='ml-1.5 inline-flex items-center rounded-md bg-[rgba(224,74,47,0.14)] px-1.5 py-0.5 text-[10px] font-semibold text-(--accent)'>
                                            被识破扣分
                                          </span>
                                        )
                                        : null}
                                    </span>
                                    <span
                                      className={cn(
                                        'shrink-0 font-mono text-sm font-semibold',
                                        item.delta > 0
                                          ? 'text-(--success)'
                                          : item.delta < 0
                                          ? 'text-(--accent)'
                                          : 'text-(--foreground-subtle)',
                                      )}
                                    >
                                      {formatDelta(item.delta)}
                                    </span>
                                  </div>
                                ))}
                                {parsed.subtotals != null
                                  ? (
                                    <p className='border-t border-(--border-soft) pt-1.5 text-xs text-(--foreground-subtle)'>
                                      {`小计 ${sideA} ${parsed.subtotals.a} · ${sideB} ${parsed.subtotals.b}`}
                                    </p>
                                  )
                                  : null}
                                {
                                  /* 合计一律用服务端 scoreA/scoreB——与结果
                                  卡同一数据源（#26）。 */
                                }
                                <p className='text-sm font-semibold text-(--foreground)'>
                                  {`合计 ${sideA} ${data.scoreA ?? '—'} : ${
                                    data.scoreB ?? '—'
                                  } ${sideB}`}
                                </p>
                                {parsed.leftover.length > 0
                                  ? (
                                    <p className='whitespace-pre-wrap pt-1 text-xs leading-relaxed text-(--foreground-muted)'>
                                      {parsed.leftover.join('\n')}
                                    </p>
                                  )
                                  : null}
                              </div>
                            </LedgerLine>
                          )
                          : ledger || breakdown?.scoreA != null ||
                              breakdown?.scoreB != null
                          ? (
                            <LedgerLine label='得分账'>
                              {ledger
                                ? (
                                  <p className='whitespace-pre-wrap text-xs leading-relaxed text-(--foreground-subtle)'>
                                    {ledger}
                                  </p>
                                )
                                : (
                                  <p className='text-sm text-(--foreground)'>
                                    {sideA} {breakdown?.scoreA ?? '—'} :{' '}
                                    {breakdown?.scoreB ?? '—'} {sideB}
                                  </p>
                                )}
                            </LedgerLine>
                          )
                          : null}
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}
          </>
        )
        : (
          <>
            {live && offstage.length > 0
              ? (
                <Card>
                  <CardContent className='space-y-2 pt-5'>
                    <h2 className='text-sm font-semibold text-(--foreground)'>
                      幕后
                    </h2>
                    {offstage.map((bubble) => (
                      <div key={bubble.speaker}>
                        <p className='text-sm text-(--foreground-subtle)'>
                          {speakerName(labels, bubble.speaker)} 正在推演…
                        </p>
                        {debug
                          ? <ReasoningFold text={bubble.reasoning} streaming />
                          : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
              : null}

            <div className='space-y-5'>
              <h2 className='text-sm font-semibold text-(--foreground)'>
                对话
              </h2>
              {dialogueRows.length === 0
                ? (
                  <p className='text-sm text-(--foreground-muted)'>
                    {live ? '对局即将开始…' : '暂无回合。'}
                  </p>
                )
                : dialogueRows.map(renderGroupRow)}
              {interim.trailing.map(interimVerdict)}
            </div>

            {finalVerdict
              ? (
                <VerdictCard
                  verdict={finalVerdict}
                  labels={labels}
                  interim={false}
                  trace={traceOf(finalVerdict)}
                  showTrace={showTrace}
                >
                  {data.scoreA != null && data.scoreB != null
                    ? (
                      <p className='text-sm text-(--foreground-subtle)'>
                        比分 {sideA} {data.scoreA} : {data.scoreB} {sideB}
                      </p>
                    )
                    : null}
                  {ledger
                    ? (
                      <p className='whitespace-pre-wrap text-xs text-(--foreground-muted)'>
                        {ledger}
                      </p>
                    )
                    : null}
                </VerdictCard>
              )
              : null}
          </>
        )}

      {data.error
        ? (
          <p className='text-sm text-(--accent)'>
            对战错误：{data.error}
          </p>
        )
        : null}

      {
        /* 旅程卡（A3 ④/#67/V23）：首战完局置底——三格方向性 CTA + 三种构建
        模式 tab 卡（#12）。回放中不渲染（回放隐藏一切终局层）。 */
      }
      {expressArrival && finished && !replaying
        ? (
          <FirstBattleJourney
            scenarioID={data.summary.scenarioID}
            participants={participants}
          />
        )
        : null}
    </div>
  )
}

// 首战旅程卡（#67，mock V23 初版）：三格用方向性关键词指路——下一轮 /
// 对侧 / PVP；随后是三种构建模式 tab 卡（#12：首战后「解锁」三种初始化方式
// ——新建流程可用，存量智能体的迭代仍是纯文本，E7）。participants 缺席
// （老服务器）时按通用落点降级：智能体格去 /my-agents、对侧格去场景页。
function FirstBattleJourney({
  scenarioID,
  participants,
}: {
  scenarioID: string
  participants: MatchParticipantsDTO | null
}) {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [journeyError, setJourneyError] = useState<string | null>(null)

  const mine: { agentID: number | null; side: Side } | null =
    participants?.a.isMine
      ? { agentID: participants.a.agentID ?? null, side: 'a' }
      : participants?.b.isMine
      ? { agentID: participants.b.agentID ?? null, side: 'b' }
      : null
  const agentPath = mine?.agentID != null
    ? `/agents/${mine.agentID}`
    : '/my-agents'
  const oppositeSide: Side | null = mine == null
    ? null
    : mine.side === 'a'
    ? 'b'
    : 'a'

  // 「解锁对侧」＝#59/#64 的 ensure（get-or-create）+ 预选参数进构建器——
  // 对侧是新建流程，三种初始化方式在那里全量可选。
  const createOpposite = async () => {
    if (oppositeSide == null) return
    setCreating(true)
    setJourneyError(null)
    try {
      const { agentID } = await builder.ensure({
        scenarioID,
        side: oppositeSide,
      })
      navigate(
        `/agents/${agentID}/build?scenario=${scenarioID}&side=${oppositeSide}`,
      )
    } catch (cause) {
      setJourneyError(messageOf(cause, '创建对侧智能体失败'))
      setCreating(false)
    }
  }

  const cellClass =
    'flex flex-col gap-2 rounded-xl border border-(--border-soft) bg-white/2 px-4 py-4'

  return (
    <section id='first-battle-journey' className='space-y-3 pt-2'>
      <h2 className='text-sm font-semibold text-(--foreground)'>
        首战打完，接下来
      </h2>
      {journeyError
        ? <p className='text-sm text-(--accent)'>{journeyError}</p>
        : null}
      <div className='grid gap-3 sm:grid-cols-3'>
        <div className={cellClass}>
          <p className='text-base font-bold text-(--foreground)'>
            通往下一轮 →
          </p>
          <p className='flex-1 text-xs text-(--foreground-muted)'>
            回到智能体主页，改一版策略、从「出战」面板再打一场。
          </p>
          <Link to={agentPath}>
            <Button size='sm' variant='secondary'>再战一场</Button>
          </Link>
        </div>
        <div className={cellClass}>
          <p className='text-base font-bold text-(--foreground)'>解锁对侧</p>
          <p className='flex-1 text-xs text-(--foreground-muted)'>
            换个立场再打——为另一方创建智能体，两侧都练过才解锁玩家约战。
          </p>
          {oppositeSide != null
            ? (
              <Button
                size='sm'
                variant='secondary'
                disabled={creating}
                onClick={() => void createOpposite()}
              >
                {creating ? '创建中…' : '去创建对侧'}
              </Button>
            )
            : (
              <Link to={`/scenarios/${scenarioID}`}>
                <Button size='sm' variant='secondary'>去场景页选侧</Button>
              </Link>
            )}
        </div>
        <div className={cellClass}>
          <p className='text-base font-bold text-(--foreground)'>
            通往 PVP →
          </p>
          <p className='flex-1 text-xs text-(--foreground-muted)'>
            每侧各赢下 NPC 练习即解锁玩家约战——进度在「出战」面板随时可看。
          </p>
          <Link to={agentPath}>
            <Button size='sm' variant='secondary'>查看解锁进度</Button>
          </Link>
        </div>
      </div>

      {
        /* #12：三种构建模式 tab 卡——新建流程（如「解锁对侧」）三选一；
        已有智能体的迭代始终是文本工作台（E7），不提供选项回改。 */
      }
      <Card>
        <CardContent className='space-y-3 pt-5'>
          <p className='text-sm font-semibold text-(--foreground)'>
            三种构建模式已解锁（新建智能体时三选一）
          </p>
          <div className='grid gap-2 sm:grid-cols-3'>
            {([
              ['MCQ 拼装', '默认——答几道选择题，拼出你的首稿'],
              ['Basic 直写', '直接书写策略提示词'],
              ['元提示词', '复制给你常用的 AI 生成，再粘贴回来'],
            ] as const).map(([name, blurb]) => (
              <div
                key={name}
                className='rounded-lg border border-(--border-soft) px-3 py-2.5'
              >
                <p className='text-sm font-semibold text-(--foreground)'>
                  {name}
                </p>
                <p className='mt-0.5 text-xs text-(--foreground-muted)'>
                  {blurb}
                </p>
              </div>
            ))}
          </div>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='text-xs text-(--foreground-muted)'>
              已保存过版本的智能体只有文本工作台——想再用选卡，走「清空工作区」重来或创建对侧。
            </p>
            {mine?.agentID != null
              ? (
                <Link
                  to={`/agents/${mine.agentID}/build`}
                  className='text-xs font-semibold text-(--accent) underline-offset-2 hover:underline'
                >
                  去构建器继续迭代 →
                </Link>
              )
              : null}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

// 参战方卡（P3 G20）：展示名 + 模型（#21 永远公开）+ 版本 id 与复制按钮
// （#25，按 id 约战的发现路径）。我方＝醒目「← 我的智能体」按钮（#71）；
// 对手侧＝低调一行「对手：{名} · v#{id}」——公开 EA（G6）在 P6 后端才有，
// 本阶段不给链接，id 可复制即可闭环。契约只有 ownerDisplayName，没有对手
// 的 agent 名。
function ParticipantCard({
  which,
  sideLabel,
  participant,
}: {
  which: 'a' | 'b'
  sideLabel: string
  participant: MatchParticipantDTO
}) {
  const [copied, setCopied] = useState(false)
  const copyID = () => {
    const id = participant.versionID
    if (id == null) return
    // 非安全上下文没有 clipboard——静默不复制，id 仍然可见可手抄。
    try {
      void navigator.clipboard.writeText(String(id)).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }).catch(() => {})
    } catch {
      // 忽略
    }
  }
  const name = participant.ownerDisplayName ??
    (participant.presetKey != null ? `预设 · ${participant.presetKey}` : '—')
  return (
    <div className='rounded-xl border border-(--border-soft) bg-white/2 px-4 py-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone='info'>
          执{which.toUpperCase()} · {sideLabel}
        </Badge>
        {participant.isMine
          ? (
            <span className='text-sm font-semibold text-(--foreground)'>
              {name}
            </span>
          )
          : (
            <span className='text-sm text-(--foreground-subtle)'>
              {participant.versionID != null
                ? `对手：${name} · v#${participant.versionID}`
                : name}
            </span>
          )}
        {participant.isMine && participant.agentID != null
          ? (
            <Link
              to={`/agents/${participant.agentID}`}
              className='ml-auto inline-flex items-center rounded-md bg-(--accent) px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90'
            >
              ← 我的智能体
            </Link>
          )
          : null}
      </div>
      <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-(--foreground-subtle)'>
        {participant.modelID
          ? (
            <span className='rounded-full border border-(--border-soft) px-2 py-0.5 font-mono'>
              {participant.modelID}
            </span>
          )
          : null}
        {participant.versionID != null
          ? (
            <>
              <code className='rounded-md border border-(--border-soft) bg-white/4 px-2 py-0.5 font-mono text-(--foreground)'>
                v#{participant.versionID}
              </code>
              <button
                type='button'
                onClick={copyID}
                className='inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-(--foreground-subtle) transition hover:bg-white/6 hover:text-(--foreground)'
              >
                {copied
                  ? <Check className='h-3 w-3 text-(--success)' />
                  : <Copy className='h-3 w-3' />}
                {copied ? '已复制' : '复制 id'}
              </button>
              <span className='text-(--foreground-muted)'>
                可用于按 id 约战
              </span>
            </>
          )
          : participant.presetKey != null
          ? (
            <span className='text-(--foreground-muted)'>
              PVE 预设 · {participant.presetKey}
            </span>
          )
          : null}
      </div>
    </div>
  )
}

// One labeled row of the 计分推导 ledger (#69 ④).
function LedgerLine({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4'>
      <p className='w-20 shrink-0 text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
        {label}
      </p>
      <div className='min-w-0 flex-1 text-sm text-(--foreground)'>
        {children}
      </div>
    </div>
  )
}

// F2 · #69 隐藏目标五步卡：一侧的 真目标 → 是否达成 → 对手猜了什么 →
// 是否被识破 → 得分变化。事件证据（achieved/identified）优先，缺席时由解析
// 出的得分账条目回补；两者都没有的步骤以「—」示不知，不瞎猜。
function HiddenGoalCard({
  side,
  name,
  otherName,
  breakdown,
  items,
  total,
}: {
  side: Side
  name: string
  otherName: string
  breakdown: ScoreBreakdown
  items: LedgerItem[]
  total: number | null
}) {
  const other: Side = side === 'a' ? 'b' : 'a'
  const trueApprovedItem = items.find((item) => item.kind === 'trueApproved') ??
    null
  const identifiedItem = items.find((item) => item.kind === 'identified') ??
    null
  const achieved = breakdown.achieved?.[side] ??
    (trueApprovedItem != null ? true : null)
  const identified = breakdown.identified?.[side] ??
    (identifiedItem != null ? true : null)
  const oppGuess = breakdown.guesses?.[other] ?? null
  const unknown = <span className='text-(--foreground-muted)'>—</span>
  return (
    <div className='space-y-2.5 rounded-xl border border-(--border-soft) bg-white/2 px-4 py-4'>
      <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
        {name}
      </p>
      <LedgerLine label='真目标'>
        <span className='font-mono'>
          {breakdown.trueRequests?.[side] ?? '—'}
        </span>
      </LedgerLine>
      <LedgerLine label='是否达成'>
        {achieved === true
          ? (
            <span className='text-(--success)'>
              {trueApprovedItem != null
                ? `已达成（真请求获准 ${formatDelta(trueApprovedItem.delta)}）`
                : '已达成'}
            </span>
          )
          : achieved === false
          ? <span className='text-(--foreground-subtle)'>未达成</span>
          : unknown}
      </LedgerLine>
      <LedgerLine label='对手猜了什么'>
        {oppGuess != null
          ? (
            <span>
              {otherName} 猜 <span className='font-mono'>{oppGuess}</span>
            </span>
          )
          : unknown}
      </LedgerLine>
      <LedgerLine label='是否被识破'>
        {identified === true
          ? (
            <span className='font-semibold text-(--accent)'>
              {identifiedItem != null
                ? `被识破 ${formatDelta(identifiedItem.delta)}`
                : '被识破'}
            </span>
          )
          : identified === false
          ? <span className='text-(--success)'>未被识破</span>
          : unknown}
      </LedgerLine>
      <LedgerLine label='得分变化'>
        {total != null
          ? (
            <span className='font-black text-(--foreground)'>
              {formatDelta(total)}
            </span>
          )
          : unknown}
      </LedgerLine>
    </div>
  )
}
