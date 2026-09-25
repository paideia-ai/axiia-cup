import type { ReactNode } from 'react'

import type { ScriptEvent } from '../../lib/event'
import type { StageGroup } from '../../lib/transcript'
import { DialogueRow, LiveDialogueRow } from './dialogue-row'
import { EventRow } from './event-row'
import type { SpeakerLabels } from './labels'
import { tm } from '../../testmode/mark'

function stageTitle(title: string): string {
  return title.replace(
    /^第([一二三])阶段·?/,
    (_match, ordinal: string) => `（阶段${'一二三'.indexOf(ordinal) + 1}/3）`,
  )
}

export function TranscriptStage({
  group,
  index,
  total,
  labels,
  scenarioID,
  showReasoning,
  verdictsBySeq,
  previousPolls,
  hideStageTitle = false,
}: {
  hideStageTitle?: boolean
  previousPolls?: ReadonlyMap<number, ScriptEvent>
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
  const casesOnly = scenarioID === 'trolley-problem'
  const numberedStage = /^第[一二三]阶段·/.test(group.title) &&
    (scenarioID === 'shangyang-court' || scenarioID === 'honnoji-decision')
  const StageHeading = numberedStage ? 'h2' : 'h3'
  const itemSeqs = group.channels
    .flatMap((channel) => channel.items.map((item) => item.seq))
    .sort((left, right) => left - right)
  const phaseBefore = new Map<number, typeof group.phases>()
  const trailingPhases: typeof group.phases = []
  for (const marker of group.phases) {
    if (casesOnly && !/^第[一二三]案·/.test(marker.title)) continue
    const nextSeq = itemSeqs.find((seq) => seq > marker.seq)
    if (nextSeq == null) {
      trailingPhases.push(marker)
      continue
    }
    const markers = phaseBefore.get(nextSeq) ?? []
    markers.push(marker)
    phaseBefore.set(nextSeq, markers)
  }
  const PhaseHeading = casesOnly ? 'h2' : 'p'
  const renderPhase = (marker: (typeof group.phases)[number]) => (
    <PhaseHeading
      {...tm('FA.phase-marker')}
      key={`${marker.seq}-${marker.title}`}
      className={casesOnly
        ? 'py-1 text-sm font-semibold text-(--foreground)'
        : 'py-1 text-center text-xs font-semibold text-(--foreground-subtle)'}
    >
      {scenarioID === 'fengyiting-real'
        ? marker.title.replace(/^第一阶段/, '第一场')
        : stageTitle(marker.title)}
    </PhaseHeading>
  )
  const phaseRows = (seq: number) =>
    (phaseBefore.get(seq) ?? []).map(renderPhase)

  return (
    <div {...tm('FA.stage')} className='space-y-3'>
      {!casesOnly && !hideStageTitle
        ? (
          <div className='space-y-1'>
            <StageHeading
              {...tm('FA.stage-title')}
              className='text-xs font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)'
            >
              {stageTitle(group.title)}
              {!numberedStage && total > 1
                ? `（阶段${index + 1}/${total}）`
                : ''}
            </StageHeading>
          </div>
        )
        : null}
      {hideStageTitle && scenarioID === 'fengyiting-real' &&
          group.id === 'stage-one' &&
          !group.phases.some((marker) => /^第(一阶段|一场)/.test(marker.title))
        ? renderPhase({ seq: -1, title: group.title })
        : null}
      {group.channels.map((channel) => (
        <div key={channel.key} className='space-y-2'>
          {!casesOnly && !numberedStage && group.channels.length > 1 &&
              channel.label
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
                  {item.verdictAnchor ? null : item.turn.kind === 'event'
                    ? (
                      <EventRow
                        turn={item.turn}
                        previousSecretPoll={previousPolls?.get(item.seq)}
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
      {trailingPhases.map(renderPhase)}
    </div>
  )
}
