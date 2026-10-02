import { useRef } from 'react'
import { JudgeSidebarTrend } from './judge-sidebar-trend'
import { useAlignedJudgeNotes } from './use-aligned-judge-notes'
import {
  focusJudgeBeat,
  JudgeNote,
  JudgeNoteCaption,
  useCompactJudgeLayout,
} from './shared'
import type { ChunkRange, JudgeDialoguePresentation } from './shared'
import type { ReplayBeatStep } from '../../lib/replay'
import type { StageGroup, TranscriptItem } from '../../lib/transcript'
import { placeVerdicts } from '../../lib/transcript'
import { OsPendingCard } from '../timeline/os-beat-card'
import './judge-transcript.css'

// The judge's aside act streams on its own channel and its card lands in this
// sidebar, so the generation in flight waits there too instead of showing up as
// a speech in the dialogue it will be lifted out of.
const ASIDE_CHANNEL = 'judge-aside'

type LiveItem = Extract<TranscriptItem, { kind: 'live' }>

interface Chunk {
  group: StageGroup
  step: ReplayBeatStep | null
  first: boolean
  end: number
  range: ChunkRange
}

export function JudgeDialogue(props: JudgeDialoguePresentation) {
  const { groups, beats, revealedKeys, labels, renderGroup, showTrace } = props
  const compact = useCompactJudgeLayout()
  const root = useRef<HTMLDivElement>(null)
  const shown = revealedKeys == null
    ? beats
    : beats.filter((step) => revealedKeys.has(step.verdict.key))
  const pendingGroup = groups.find((group) =>
    group.channels.some((channel) =>
      channel.id === ASIDE_CHANNEL &&
      channel.items.some((item) => item.kind === 'live')
    )
  )
  const pending = pendingGroup?.channels
    .filter((channel) => channel.id === ASIDE_CHANNEL)
    .flatMap((channel) => channel.items)
    .find((item): item is LiveItem => item.kind === 'live')
  // Re-align when a note (or the pending one) comes or goes; the transcript
  // growing underneath is picked up by the hook's resize observer.
  useAlignedJudgeNotes(
    root,
    !compact,
    [
      showTrace,
      pending?.seq,
      ...shown.map((step) =>
        `${step.verdict.key}@${props.anchorSeqOf(step.verdict)}`
      ),
    ].join('|'),
  )
  const placement = placeVerdicts(groups, shown.map((step) => step.verdict))
  const chunks: Chunk[] = groups.flatMap((group, groupIndex) => {
    const items = group.channels.flatMap((channel) => channel.items)
    const last = Math.max(...items.map((item) => item.seq))
    const localBeats = shown.filter((step) =>
      placement.perGroup[groupIndex].some((verdict) =>
        verdict.key === step.verdict.key
      )
    )
    let start = -Infinity
    return [...localBeats, null].flatMap((step, localIndex) => {
      const end = step?.verdict.afterSeq ?? Infinity
      const range = { start, end }
      const slice = {
        ...group,
        phases: group.phases.filter((phase) =>
          phase.seq >= start && phase.seq < end
        ),
        channels: group.channels.map((channel) => ({
          ...channel,
          items: channel.items.filter((item) =>
            item !== pending && item.seq >= start && item.seq < end
          ),
        })).filter((channel) => channel.items.length > 0),
      }
      start = end
      // Absorbed OS acts are anchors, not an extra visible dialogue segment.
      const visible = slice.channels.some((channel) =>
        channel.items.some((item) =>
          item.kind === 'live' || !item.verdictAnchor
        )
      ) || slice.phases.length > 0
      if (!visible && !step) {
        return []
      }
      return [{
        group: slice,
        step,
        first: localIndex === 0,
        end: step?.verdict.afterSeq ?? last + 1,
        range,
      }]
    })
  })
  // On narrow screens the pending note sits after the rows it follows: the
  // slice holding its seq, else the last one (or the empty transcript).
  let pendingIndex = Math.max(0, chunks.length - 1)
  chunks.forEach((chunk, index) => {
    if (
      pending != null && chunk.group.id === pendingGroup?.id &&
      pending.seq >= chunk.range.start && pending.seq < chunk.range.end
    ) {
      pendingIndex = index
    }
  })

  const note = (step: ReplayBeatStep) => (
    <>
      <JudgeNoteCaption step={step} speechNumberOf={props.speechNumberOf} />
      <JudgeNote {...props} step={step} />
    </>
  )
  const pendingCard = pending
    ? (
      <OsPendingCard
        labels={labels}
        reasoning={pending.bubble.reasoning}
        showTrace={showTrace}
      />
    )
    : null
  const title = (text: string) =>
    text.replace(
      /^第([一二三])阶段·?/,
      (_, ordinal: string) => `（阶段${'一二三'.indexOf(ordinal) + 1}/3）`,
    )
  const heading = (
    <h2 className='text-xs font-semibold text-(--foreground-muted)'>裁判 OS</h2>
  )
  const track = beats.length > 0
    ? (
      <JudgeSidebarTrend
        beats={beats}
        revealedKeys={revealedKeys}
        mobileTrendTarget={props.mobileTrendTarget}
        labels={labels}
        connectionGap={4}
        onSelect={(index) => focusJudgeBeat(beats[index].verdict.key)}
      />
    )
    : pendingCard
    ? null
    : <p className='text-xs text-(--foreground-muted)'>等待裁判点评…</p>
  const content = (chunk: Chunk, index: number) => (
    <div
      className='judge-transcript-chunk'
      id={`judge-dialogue-${index}`}
      data-judge-chunk
      data-beat-index={chunk.step ? beats.indexOf(chunk.step) : undefined}
      tabIndex={-1}
      key={`${chunk.group.id}-${index}`}
    >
      {chunk.first && (
        <h2 className='mb-3 text-xs font-semibold tracking-[0.1em] text-(--foreground-muted)'>
          {title(chunk.group.title)}
        </h2>
      )}
      {renderGroup(chunk.group, chunk.range)}
    </div>
  )

  return (
    <section ref={root} className='judge-transcript' aria-label='对话与裁判 OS'>
      {compact
        ? (chunks.length > 0 ? chunks : [null]).map((chunk, index) => (
          <div
            className='judge-transcript-columns judge-transcript-pair'
            key={index}
          >
            {chunk ? content(chunk, index) : props.empty}
            <aside className='judge-transcript-paired-aside'>
              {index === 0 && (
                <div
                  className={chunk || pendingCard
                    ? 'mb-5 space-y-3'
                    : 'space-y-3'}
                >
                  {heading}
                  {track}
                </div>
              )}
              {chunk?.step && note(chunk.step)}
              {index === pendingIndex && pendingCard}
            </aside>
          </div>
        ))
        : (
          <div className='judge-transcript-columns judge-transcript-aligned-grid'>
            <div className='judge-transcript-dialogue-column space-y-5'>
              {chunks.length > 0 ? chunks.map(content) : props.empty}
            </div>
            <aside
              className='judge-transcript-aligned-aside'
              aria-label='裁判 OS 侧栏'
            >
              <div className='space-y-3'>{heading}{track}</div>
              {chunks.filter((chunk) =>
                chunk.step
              ).map((chunk) => (
                <div
                  className='judge-transcript-aligned-note'
                  data-os-after={chunk.end}
                  data-os-anchor={props.anchorSeqOf(chunk.step!.verdict)}
                  key={chunk.step!.verdict.key}
                >
                  {note(chunk.step!)}
                </div>
              ))}
              {pending && (
                <div
                  className='judge-transcript-aligned-note'
                  data-os-after={pending.seq}
                  data-os-anchor={pending.seq - 1}
                  key='pending'
                >
                  {pendingCard}
                </div>
              )}
            </aside>
          </div>
        )}
    </section>
  )
}
