import type { JSONValue } from '../../api/types'
import type { ScriptEvent } from '../../lib/event'
import {
  eventArray,
  eventBoolean,
  eventNumber,
  eventString,
  eventStringArray,
  eventType,
} from '../../lib/event'
import type { SpeakerLabels } from './labels'
import { speakerName } from './labels'
import { ReasoningFold } from './reasoning-fold'
import { tm } from '../../testmode/mark'

const ACTION_LABELS: Record<string, string> = {
  SECRET_POLL: '发起秘密意向投票',
  EARLY_FINAL_MOTION: '发起提前终局动议',
  REREAD_E1_RECORDS: '复核 E1：内审、停约与当晚邀约',
  REPLAY_E2_TIMELINE: '复核 E2：八分钟时间线',
  INSPECT_E3_SCENE: '复核 E3：现场与维修锤',
  INSPECT_E4_FORENSICS: '复核 E4：法医与痕迹',
  COMPARE_E5_STATEMENTS: '复核 E5：两次陈述与未求助',
  SPEAK: '开始公开发言',
  PASS: '结束中场行动窗口',
}

function JurySpeech({
  event,
  labels,
  showReasoning,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  const actor = eventString(event, 'actor') ?? ''
  const speech = eventString(event, 'text') ?? ''
  const reasoning = eventString(event, 'reasoning') ?? ''
  return (
    <div
      {...tm('FA.jury-speech')}
      className='rounded-xl border border-(--border) bg-white/2 px-4 py-3'
    >
      <p className='text-xs font-semibold text-(--foreground-subtle)'>
        {speakerName(labels, actor)}
      </p>
      <p className='mt-1 whitespace-pre-wrap text-sm leading-6 text-(--foreground)'>
        {speech || '暂无公开发言'}
      </p>
      {showReasoning ? <ReasoningFold text={reasoning} /> : null}
    </div>
  )
}

interface Ballot {
  juror: string
  vote: string
  reason: string
  reasoning: string
  keyEvidence: string[]
}

interface PrivateMessage {
  exchange: number | null
  speaker: string
  text: string
  reasoning: string
}

function objectOf(value: JSONValue): Record<string, JSONValue> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null
}

function ballotsOf(event: ScriptEvent, key: string): Ballot[] {
  return (eventArray(event, key) ?? []).flatMap((value) => {
    const object = objectOf(value)
    if (!object || typeof object.juror !== 'string') return []
    return [{
      juror: object.juror,
      vote: typeof object.vote === 'string'
        ? object.vote
        : typeof object.procedureVote === 'string'
        ? object.procedureVote
        : typeof object.verdict === 'string'
        ? object.verdict
        : '',
      reason: typeof object.reason === 'string' ? object.reason : '',
      reasoning: typeof object.reasoning === 'string' ? object.reasoning : '',
      keyEvidence: Array.isArray(object.keyEvidence)
        ? object.keyEvidence.filter((item): item is string =>
          typeof item === 'string'
        )
        : [],
    }]
  })
}

function messagesOf(event: ScriptEvent): PrivateMessage[] {
  return (eventArray(event, 'messages') ?? []).flatMap((value) => {
    const object = objectOf(value)
    if (
      !object || typeof object.speaker !== 'string' ||
      typeof object.text !== 'string'
    ) return []
    return [{
      exchange: typeof object.exchange === 'number' ? object.exchange : null,
      speaker: object.speaker,
      text: object.text,
      reasoning: typeof object.reasoning === 'string' ? object.reasoning : '',
    }]
  })
}

function actionLabel(actionID: string, labels: SpeakerLabels): string {
  const privateTarget = actionID.match(/^PRIVATE_CHAT_(J\d{2})$/)?.[1]
  if (privateTarget) {
    return `与 ${speakerName(labels, privateTarget.toLowerCase())} 一对一私聊`
  }
  return ACTION_LABELS[actionID] ?? actionID
}

function ActionDecision({
  event,
  labels,
  showReasoning,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  const player = eventString(event, 'player') ?? ''
  const actionID = eventString(event, 'actionId') ?? '—'
  const window = eventString(event, 'window')
  const round = eventNumber(event, 'round')
  const reasoning = eventString(event, 'reasoning') ?? ''
  const windowLabel = window === 'before-speech'
    ? '发言前'
    : window === 'mid-round'
    ? '轮次中场'
    : '行动窗口'
  return (
    <div
      {...tm('FA.jury-action-decision')}
      className='rounded-lg border border-dashed border-(--border) bg-white/2 px-4 py-3'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        真人幕后 · 行动选择
      </p>
      <p className='mt-1 text-sm text-(--foreground)'>
        {speakerName(labels, player)}
        {round == null ? '' : ` · 第 ${round} 轮`} · {windowLabel}
      </p>
      <p className='mt-1 text-sm font-semibold text-(--foreground-subtle)'>
        {actionLabel(actionID, labels)}
      </p>
      {showReasoning ? <ReasoningFold text={reasoning} /> : null}
    </div>
  )
}

function SpeakerDraw({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const round = eventNumber(event, 'round')
  const speakers = eventStringArray(event, 'speakers') ?? []
  return (
    <div
      {...tm('FA.jury-speaker-draw')}
      className='rounded-lg border border-dashed border-(--border) bg-white/2 px-4 py-3'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        {round == null ? '陪审员发言抽签' : `第 ${round} 轮陪审员发言抽签`}
      </p>
      {speakers.length > 0
        ? (
          <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-(--foreground)'>
            {speakers.map((speaker, index) => (
              <span key={speaker} className='inline-flex items-center gap-2'>
                {index > 0
                  ? <span className='text-(--foreground-muted)'>→</span>
                  : null}
                <span className='rounded-md bg-white/6 px-2.5 py-1'>
                  {index + 1}. {speakerName(labels, speaker)}
                </span>
              </span>
            ))}
          </div>
        )
        : (
          <p className='mt-1 text-sm text-(--foreground-muted)'>
            暂无抽签结果
          </p>
        )}
    </div>
  )
}

function SecretPollOpened({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const mover = eventString(event, 'mover') ?? ''
  const round = eventNumber(event, 'round')
  return (
    <div
      {...tm('FA.jury-secret-poll-opened')}
      className='rounded-lg border border-(--border) bg-[rgba(96,165,250,0.06)] px-4 py-3'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--info)'>
        秘密意向投票
      </p>
      <p className='mt-1 text-sm text-(--foreground)'>
        {speakerName(labels, mover)}
        {round == null ? '发起投票' : `在第 ${round} 轮发起投票`}
      </p>
      <p className='mt-1 text-xs text-(--foreground-muted)'>
        投票发生向全场公开；个人票型对其他场内 Agent 保密。
      </p>
    </div>
  )
}

function SecretPollResult({
  event,
  labels,
  showReasoning,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  const ballots = ballotsOf(event, 'ballots')
  const guilty = eventNumber(event, 'guiltyVotes')
  const notGuilty = eventNumber(event, 'notGuiltyVotes')
  const round = eventNumber(event, 'round')
  return (
    <div
      {...tm('FA.jury-secret-poll-result')}
      className='rounded-xl border border-(--border) bg-[rgba(96,165,250,0.06)] px-4 py-4'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--info)'>
        真人幕后 · 秘密意向投票结果
      </p>
      <div className='mt-1 flex flex-wrap items-baseline justify-between gap-2'>
        <p className='text-lg font-black text-(--foreground)'>
          有罪 {guilty ?? '—'} · 无罪 {notGuilty ?? '—'}
        </p>
        <p className='text-xs text-(--foreground-muted)'>
          {round == null ? '' : `第 ${round} 轮 · `}不约束最终判决
        </p>
      </div>
      <BallotGrid
        ballots={ballots}
        labels={labels}
        kind='verdict'
        showReasoning={showReasoning}
      />
    </div>
  )
}

function PrivateChat({
  event,
  labels,
  showReasoning,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  const mover = eventString(event, 'mover') ?? ''
  const target = eventString(event, 'target') ?? ''
  const round = eventNumber(event, 'round')
  const messages = messagesOf(event)
  return (
    <div
      {...tm('FA.jury-private-chat')}
      className='rounded-xl border border-[rgba(168,85,247,0.32)] bg-[rgba(168,85,247,0.05)] px-4 py-4'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--info)'>
        真人幕后 · 一对一私聊
      </p>
      <p className='mt-1 text-sm text-(--foreground)'>
        {speakerName(labels, mover)} 与 {speakerName(labels, target)}
        {round == null ? '' : ` · 第 ${round} 轮`}
      </p>
      <p className='mt-1 text-xs text-(--foreground-muted)'>
        场内其他 Agent 不知道这次私聊发生，也不知道对象或内容。
      </p>
      {messages.length > 0
        ? (
          <div className='mt-3 space-y-2'>
            {messages.map((message, index) => {
              const fromMover = message.speaker === mover
              return (
                <div
                  key={`${
                    message.exchange ?? 'message'
                  }-${message.speaker}-${index}`}
                  className={`flex ${
                    fromMover ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    {...tm('FA.jury-private-message')}
                    className='max-w-[92%] rounded-lg bg-black/15 px-3 py-2 sm:max-w-[82%]'
                  >
                    <p className='text-[11px] font-semibold text-(--foreground-subtle)'>
                      {speakerName(labels, message.speaker)}
                      {message.exchange == null
                        ? ''
                        : ` · 第 ${message.exchange} 轮私聊`}
                    </p>
                    <p className='mt-1 whitespace-pre-wrap text-sm text-(--foreground)'>
                      {message.text}
                    </p>
                    {showReasoning
                      ? <ReasoningFold text={message.reasoning} />
                      : null}
                  </div>
                </div>
              )
            })}
          </div>
        )
        : (
          <p className='mt-3 text-sm text-(--foreground-muted)'>
            暂无私聊记录
          </p>
        )}
    </div>
  )
}

function EvidenceReview({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const mover = eventString(event, 'mover') ?? ''
  const evidence = eventString(event, 'evidenceId') ?? '—'
  const title = eventString(event, 'title') ?? ''
  const text = eventString(event, 'text') ?? ''
  const round = eventNumber(event, 'round')
  return (
    <div
      {...tm('FA.jury-evidence-review')}
      className='rounded-lg border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.05)] px-4 py-3'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--warning)'>
        公开证据复核 · {evidence}
      </p>
      {title
        ? (
          <p className='mt-1 text-sm font-semibold text-(--foreground)'>
            {title}
          </p>
        )
        : null}
      <p className='mt-1 text-xs text-(--foreground-muted)'>
        由 {speakerName(labels, mover)} 请求
        {round == null ? '' : ` · 第 ${round} 轮`} · 固定证据卡，不是新发现
      </p>
      {text
        ? (
          <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-(--foreground-subtle)'>
            {text}
          </p>
        )
        : null}
    </div>
  )
}

function MotionOpened({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const mover = eventString(event, 'mover') ?? ''
  const threshold = eventNumber(event, 'threshold')
  const round = eventNumber(event, 'round')
  return (
    <div
      {...tm('FA.jury-motion-opened')}
      className='rounded-lg border border-(--border) bg-white/2 px-4 py-3'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        提前终局动议
      </p>
      <p className='mt-1 text-sm text-(--foreground)'>
        {speakerName(labels, mover)} 请求立即进入最终判决
      </p>
      <p className='mt-1 text-xs text-(--foreground-muted)'>
        {round == null ? '' : `第 ${round} 轮 · `}十一人记名程序票 ·{' '}
        {threshold ?? 6}/11 通过
      </p>
    </div>
  )
}

function MotionVotes({
  event,
  labels,
  showReasoning,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  return (
    <div
      {...tm('FA.jury-motion-votes')}
      className='rounded-lg border border-(--border-soft) bg-white/2 px-4 py-3'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        提前终局 · 十一人记名程序票
      </p>
      <BallotGrid
        ballots={ballotsOf(event, 'votes')}
        labels={labels}
        kind='procedure'
        showReasoning={showReasoning}
      />
    </div>
  )
}

function MotionResult({ event }: { event: ScriptEvent }) {
  const passed = eventBoolean(event, 'passed') === true
  const endNow = eventNumber(event, 'endNowVotes')
  const threshold = eventNumber(event, 'threshold')
  return (
    <div
      {...tm('FA.jury-motion-result')}
      className={`rounded-lg border px-4 py-3 ${
        passed
          ? 'border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.08)]'
          : 'border-(--border-soft) bg-white/2'
      }`}
    >
      <p className='text-sm font-semibold text-(--foreground)'>
        动议{passed ? '通过，立即进入最终判决' : '未通过，审议继续'}
      </p>
      <p className='mt-1 text-xs text-(--foreground-muted)'>
        END_NOW {endNow ?? '—'} 票 · 门槛 {threshold ?? 6}/11
      </p>
    </div>
  )
}

function BallotGrid({
  ballots,
  labels,
  kind,
  showReasoning,
}: {
  ballots: Ballot[]
  labels: SpeakerLabels
  kind: 'procedure' | 'verdict'
  showReasoning: boolean
}) {
  if (ballots.length === 0) {
    return (
      <p className='mt-2 text-sm text-(--foreground-muted)'>暂无票型详情</p>
    )
  }
  return (
    <div className='mt-3 grid gap-2 sm:grid-cols-2'>
      {ballots.map((ballot) => {
        const guilty = ballot.vote === 'GUILTY'
        const endNow = ballot.vote === 'END_NOW'
        const voteLabel = kind === 'verdict'
          ? ballot.vote === 'GUILTY'
            ? '有罪'
            : ballot.vote === 'NOT_GUILTY'
            ? '无罪'
            : '票型未知'
          : ballot.vote === 'END_NOW'
          ? '结束审议'
          : ballot.vote === 'CONTINUE'
          ? '继续审议'
          : '票型未知'
        return (
          <div
            {...tm('FA.jury-ballot')}
            key={ballot.juror}
            className='rounded-md bg-black/10 px-3 py-2'
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-xs font-semibold text-(--foreground)'>
                {speakerName(labels, ballot.juror)}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  guilty || endNow
                    ? 'bg-[rgba(224,74,47,0.14)] text-(--accent)'
                    : 'bg-[rgba(96,165,250,0.14)] text-(--info)'
                }`}
              >
                {voteLabel}
              </span>
            </div>
            {ballot.keyEvidence.length > 0
              ? (
                <p className='mt-1 font-mono text-[10px] text-(--foreground-muted)'>
                  {ballot.keyEvidence.join(' + ')}
                </p>
              )
              : null}
            {ballot.reason
              ? (
                <p className='mt-1 whitespace-pre-wrap text-xs text-(--foreground-subtle)'>
                  {ballot.reason}
                </p>
              )
              : null}
            {showReasoning ? <ReasoningFold text={ballot.reasoning} /> : null}
          </div>
        )
      })}
    </div>
  )
}

function FinalVoteReveal({
  event,
  labels,
  showReasoning,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  const guilty = eventNumber(event, 'guiltyVotes')
  const notGuilty = eventNumber(event, 'notGuiltyVotes')
  const threshold = eventNumber(event, 'threshold')
  const endReason = eventString(event, 'endReason')
  const endLabel = endReason === 'early-motion'
    ? '提前终局'
    : endReason === 'five-rounds'
    ? '五轮审议结束'
    : '审议结束'
  return (
    <div
      {...tm('FA.jury-final-vote-reveal')}
      className='rounded-xl border border-(--border) bg-[rgba(224,74,47,0.05)] px-4 py-4'
    >
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <p className='text-[11px] font-semibold tracking-[0.1em] text-(--accent)'>
            十一人最终判决
          </p>
          <p className='mt-1 text-lg font-black text-(--foreground)'>
            有罪 {guilty ?? '—'} · 无罪 {notGuilty ?? '—'}
          </p>
        </div>
        <p className='text-xs text-(--foreground-muted)'>
          {threshold ?? 6} 票形成裁决 · {endLabel}
        </p>
      </div>
      <BallotGrid
        ballots={ballotsOf(event, 'votes')}
        labels={labels}
        kind='verdict'
        showReasoning={showReasoning}
      />
    </div>
  )
}

function MatchResult({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const winner = eventString(event, 'winner') ?? ''
  const guilty = eventNumber(event, 'guiltyVotes')
  const notGuilty = eventNumber(event, 'notGuiltyVotes')
  return (
    <div
      {...tm('FA.jury-match-result')}
      className='rounded-xl border border-(--border) bg-white/2 px-4 py-4 text-center'
    >
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        对局结果
      </p>
      <p className='mt-1 text-lg font-black text-(--foreground)'>
        {winner ? `${speakerName(labels, winner)}获胜` : '胜方待定'}
      </p>
      <p className='mt-1 text-sm text-(--foreground-subtle)'>
        有罪 {guilty ?? '—'} : {notGuilty ?? '—'} 无罪
      </p>
    </div>
  )
}

export function renderJuryEvent(
  event: ScriptEvent,
  labels: SpeakerLabels,
  showReasoning: boolean,
) {
  switch (eventType(event)) {
    case 'jury_speech':
      return (
        <JurySpeech
          event={event}
          labels={labels}
          showReasoning={showReasoning}
        />
      )
    case 'observer_action_decision':
      return (
        <ActionDecision
          event={event}
          labels={labels}
          showReasoning={showReasoning}
        />
      )
    case 'npc_speaker_draw':
      return <SpeakerDraw event={event} labels={labels} />
    case 'secret_poll_opened':
      return <SecretPollOpened event={event} labels={labels} />
    case 'observer_secret_poll':
      return (
        <SecretPollResult
          event={event}
          labels={labels}
          showReasoning={showReasoning}
        />
      )
    case 'observer_private_chat':
      return (
        <PrivateChat
          event={event}
          labels={labels}
          showReasoning={showReasoning}
        />
      )
    case 'evidence_review':
      return <EvidenceReview event={event} labels={labels} />
    case 'early_motion_opened':
      return <MotionOpened event={event} labels={labels} />
    case 'early_motion_votes':
      return (
        <MotionVotes
          event={event}
          labels={labels}
          showReasoning={showReasoning}
        />
      )
    case 'early_motion_result':
      return <MotionResult event={event} />
    case 'final_vote_reveal':
      return (
        <FinalVoteReveal
          event={event}
          labels={labels}
          showReasoning={showReasoning}
        />
      )
    case 'score':
      return <MatchResult event={event} labels={labels} />
    default:
      return null
  }
}
