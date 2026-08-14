import type { LiveBubble } from '../../api/sse'
import type { TurnDTO } from '../../api/types'
import { stripStreamingActTags } from '../../lib/act-markup'
import { Card, CardContent } from '../ui/card'
import type { SpeakerLabels } from './labels'
import { speakerAccent, speakerName, speakerSide } from './labels'
import { ReasoningFold } from './reasoning-fold'

function Speaker({
  speaker,
  labels,
  seq,
  live,
}: {
  speaker: string
  labels: SpeakerLabels
  seq: number
  live: boolean
}) {
  const isSide = speakerSide(labels, speaker) != null
  return (
    <div className='flex items-center gap-2 text-xs text-(--foreground-muted)'>
      <span className='font-semibold text-(--foreground-subtle)'>
        {speakerName(labels, speaker)}
      </span>
      {isSide
        ? null
        : (
          <span className='rounded-full bg-[rgba(251,191,36,0.14)] px-2 py-0.5 text-[10px] font-semibold text-(--warning)'>
            旁白角色
          </span>
        )}
      <span>#{seq + 1}</span>
      {live
        ? (
          <span className='inline-flex items-center gap-1 text-(--accent)'>
            <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-(--accent)' />
            正在发言
          </span>
        )
        : null}
    </div>
  )
}

// `showReasoning` is the 调试模式 gate (#22): off, the model's 内心 trace does not
// render at all — dialogue itself is never gated.
export function DialogueRow({
  turn,
  labels,
  showReasoning,
}: {
  turn: TurnDTO
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  return (
    <Card className={`border-l-2 ${speakerAccent(labels, turn.speaker)}`}>
      <CardContent className='space-y-1 py-4'>
        <Speaker
          speaker={turn.speaker}
          labels={labels}
          seq={turn.seq}
          live={false}
        />
        <p className='whitespace-pre-wrap text-sm text-(--foreground)'>
          {turn.finalText}
        </p>
        {showReasoning && turn.reasoning
          ? <ReasoningFold text={turn.reasoning} />
          : null}
      </CardContent>
    </Card>
  )
}

// The in-flight twin of a dialogue row: the same shape, fed by chunk deltas, and
// replaced by the committed row the moment `turnCompleted` lands. The reasoning
// arrives before the speech does, so an empty body is a normal early state.
//
// 一个 act 生成的 text 流里带结构化标签（#22），committed 行由 transcript.ts 剥
// 干净，流式这一段只能自己剥。除非服务端明说这是 `say`，否则一律按形状剥——
// 老服务端不送 call，宁可暂时多剥（落定即恢复），也不让原始标签闪给玩家。
export function LiveDialogueRow({
  bubble,
  labels,
  showReasoning,
}: {
  bubble: LiveBubble
  labels: SpeakerLabels
  showReasoning: boolean
}) {
  const text = bubble.call === 'say'
    ? bubble.text
    : stripStreamingActTags(bubble.text)
  return (
    <Card
      className={`border-l-2 ${
        speakerAccent(labels, bubble.speaker)
      } border-dashed bg-white/1`}
    >
      <CardContent className='space-y-1 py-4'>
        <Speaker
          speaker={bubble.speaker}
          labels={labels}
          seq={bubble.seq}
          live
        />
        {text
          ? (
            <p className='whitespace-pre-wrap text-sm text-(--foreground)'>
              {text}
              <span className='ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-(--accent)' />
            </p>
          )
          : (
            <p className='text-sm text-(--foreground-muted)'>
              {bubble.reasoning ? '正在斟酌措辞…' : '正在思考…'}
            </p>
          )}
        {showReasoning
          ? <ReasoningFold text={bubble.reasoning} streaming />
          : null}
      </CardContent>
    </Card>
  )
}
