import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { matches } from '../api/client'
import { useMatchStream } from '../api/sse'
import type { VerdictDTO } from '../api/types'
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
import { Card, CardContent } from '../components/ui/card'
import { VerdictBody, VerdictCard } from '../components/verdict-card'
import { cn } from '../lib/cn'
import { buildReplaySteps, replayBeats, replayReveal } from '../lib/replay'
import {
  deriveScoreBreakdown,
  formatScoringReasoning,
} from '../lib/scoring-reasoning'
import { usePinToBottom } from '../lib/scroll'
import {
  groupTranscript,
  isInquiryChannel,
  isInquiryGroup,
  placeVerdicts,
} from '../lib/transcript'
import { useAsync } from '../lib/use-async'
import { isOsBeatVerdict, isTerminalVerdict } from '../lib/verdict'

export function MatchDetailPage() {
  const { matchId = '' } = useParams()
  const matchID = Number(matchId)
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
  const replaySteps = useMemo(() => {
    if (data == null) return []
    return buildReplaySteps(
      data.turns.filter((turn) =>
        !inquiryChannels.has(turn.channel) && !isInquiryChannel(turn.channel)
      ),
      data.verdicts,
    )
  }, [data, inquiryChannels])
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
    ? groupTranscript(shownTurns, data.stages, stream.bubbles)
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
        />
      )
    }
    return (
      <VerdictCard
        key={verdict.key}
        verdict={verdict}
        labels={labels}
        interim
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
  const winner = data.summary.winner
  const winnerLine = winner === 'a'
    ? `胜方 ${sideA}`
    : winner === 'b'
    ? `胜方 ${sideB}`
    : winner === 'draw'
    ? '平局'
    : '已结束'

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
          <Badge tone='info'>{data.summary.kind.toUpperCase()}</Badge>
          {data.summary.finished
            ? (
              // 回放中不剧透胜负——结果徽章换成中性的回放态。
              replaying
                ? <Badge tone='info'>回放中</Badge>
                : (
                  <Badge tone='success'>
                    {winner === 'a'
                      ? `胜方 ${sideA}`
                      : winner === 'b'
                      ? `胜方 ${sideB}`
                      : '已结束'}
                  </Badge>
                )
            )
            : (
              <Badge tone='warning'>
                {stream.connected ? '直播中' : '进行中'}
              </Badge>
            )}
        </div>
      </div>

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
                        {ledger || breakdown?.scoreA != null ||
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
