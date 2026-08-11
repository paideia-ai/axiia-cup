import type { ReactNode } from 'react'

import type { StageGroup } from '../../lib/transcript'
import { DialogueRow, LiveDialogueRow } from './dialogue-row'
import { EventRow } from './event-row'
import type { SpeakerLabels } from './labels'

export function TranscriptStage({
  group,
  index,
  total,
  labels,
  showReasoning,
  verdictsBySeq,
}: {
  group: StageGroup
  index: number
  total: number
  labels: SpeakerLabels
  // 调试模式 (#22): governs only the model reasoning traces inside the rows —
  // dialogue and event rows render regardless.
  showReasoning: boolean
  // 行级锚点的裁决卡（#22① 心声按 afterSeq 内插）：键＝所锚定行的 seq，
  // 渲染在该行之后。
  verdictsBySeq?: Record<number, ReactNode[]>
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <h3 className='text-xs font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)'>
          {group.title}
          {total > 1 ? `（第 ${index + 1}/${total} 阶段）` : ''}
        </h3>
        {group.phases.length > 0
          ? (
            <div className='flex flex-wrap gap-1.5'>
              {group.phases.map((phase) => (
                <span
                  key={phase}
                  className='rounded-full bg-white/4 px-2.5 py-0.5 text-[11px] text-(--foreground-subtle)'
                >
                  {phase}
                </span>
              ))}
            </div>
          )
          : null}
      </div>
      {group.channels.map((channel) => (
        <div key={channel.id} className='space-y-2'>
          {group.channels.length > 1 && channel.label
            ? (
              <p className='text-xs font-medium text-(--foreground-subtle)'>
                {channel.label}
              </p>
            )
            : null}
          {channel.items.map((item) =>
            item.kind === 'live'
              ? (
                <LiveDialogueRow
                  key={`live-${item.seq}-${item.bubble.speaker}`}
                  bubble={item.bubble}
                  labels={labels}
                  showReasoning={showReasoning}
                />
              )
              : (
                <div key={item.seq} className='space-y-2'>
                  {item.turn.kind === 'event'
                    ? (
                      <EventRow
                        turn={item.turn}
                        labels={labels}
                      />
                    )
                    : (
                      <DialogueRow
                        turn={item.turn}
                        labels={labels}
                        showReasoning={showReasoning}
                      />
                    )}
                  {verdictsBySeq?.[item.seq]}
                </div>
              )
          )}
        </div>
      ))}
    </div>
  )
}
