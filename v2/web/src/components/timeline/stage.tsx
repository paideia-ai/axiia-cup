import type { ReactNode } from 'react'

import type { StageGroup } from '../../lib/transcript'
import { DialogueRow, LiveDialogueRow } from './dialogue-row'
import { EventRow } from './event-row'
import type { SpeakerLabels } from './labels'
import { tm } from '../../testmode/mark'

export function TranscriptStage({
  group,
  index,
  total,
  labels,
  scenarioID,
  showReasoning,
  verdictsBySeq,
}: {
  group: StageGroup
  index: number
  total: number
  labels: SpeakerLabels
  scenarioID: string
  // 调试模式 (#22): governs only the model reasoning traces inside the rows —
  // dialogue and event rows render regardless.
  showReasoning: boolean
  // 行级锚点的裁决卡（#22① 心声按 afterSeq 内插）：键＝所锚定行的 seq，
  // 渲染在该行之后。
  verdictsBySeq?: Record<number, ReactNode[]>
}) {
  const itemSeqs = group.channels
    .flatMap((channel) => channel.items.map((item) => item.seq))
    .sort((left, right) => left - right)
  const phaseBefore = new Map<number, typeof group.phases>()
  const trailingPhases: typeof group.phases = []
  for (const marker of group.phases) {
    const nextSeq = itemSeqs.find((seq) => seq > marker.seq)
    if (nextSeq == null) {
      trailingPhases.push(marker)
      continue
    }
    const markers = phaseBefore.get(nextSeq) ?? []
    markers.push(marker)
    phaseBefore.set(nextSeq, markers)
  }
  const phaseRows = (seq: number) =>
    (phaseBefore.get(seq) ?? []).map((marker) => (
      <p
        {...tm('FA.phase-marker')}
        key={`${marker.seq}-${marker.title}`}
        className='py-1 text-center text-xs font-semibold text-(--foreground-subtle)'
      >
        {marker.title}
      </p>
    ))

  return (
    <div {...tm('FA.stage')} className='space-y-3'>
      <div className='space-y-1'>
        <h3
          {...tm('FA.stage-title')}
          className='text-xs font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)'
        >
          {group.title}
          {total > 1 ? `（第 ${index + 1}/${total} 阶段）` : ''}
        </h3>
      </div>
      {group.channels.map((channel) => (
        <div key={channel.key} className='space-y-2'>
          {group.channels.length > 1 && channel.label
            ? (
              <p
                {...tm('FA.channel-label')}
                className='text-xs font-medium text-(--foreground-subtle)'
              >
                {channel.label}
              </p>
            )
            : null}
          {channel.items.map((item) =>
            item.kind === 'live'
              ? (
                <div key={`live-${item.seq}-${item.bubble.speaker}`}>
                  {phaseRows(item.seq)}
                  <LiveDialogueRow
                    bubble={item.bubble}
                    labels={labels}
                    showReasoning={showReasoning}
                  />
                </div>
              )
              : (
                <div key={item.seq} className='space-y-2'>
                  {phaseRows(item.seq)}
                  {item.turn.kind === 'event'
                    ? (
                      <EventRow
                        turn={item.turn}
                        labels={labels}
                        scenarioID={scenarioID}
                        showReasoning={showReasoning}
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
      {trailingPhases.map((marker) => (
        <p
          {...tm('FA.phase-marker')}
          key={`${marker.seq}-${marker.title}`}
          className='py-1 text-center text-xs font-semibold text-(--foreground-subtle)'
        >
          {marker.title}
        </p>
      ))}
    </div>
  )
}
