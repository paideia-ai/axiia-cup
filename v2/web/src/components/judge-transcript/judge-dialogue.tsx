import { useRef } from 'react'
import { JudgeSidebarTrend } from './judge-sidebar-trend'
import { useAlignedJudgeNotes } from './use-aligned-judge-notes'
import { focusJudgeBeat, JudgeNote, useCompactJudgeLayout } from './shared'
import type { JudgeDialoguePresentation } from './shared'
import { speechProgressLabel } from './shared'
import type { ReplayBeatStep } from '../../lib/replay'
import { placeVerdicts } from '../../lib/transcript'
import './judge-transcript.css'

export function JudgeDialogue(props: JudgeDialoguePresentation) {
  const { groups, beats, labels, renderGroup, showTrace } = props
  const compact = useCompactJudgeLayout()
  const root = useRef<HTMLDivElement>(null)
  useAlignedJudgeNotes(root, !compact, [groups, showTrace])
  const placement = placeVerdicts(groups, beats.map((step) => step.verdict))
  const chunks = groups.flatMap((group, groupIndex) => {
    const items = group.channels.flatMap((channel) => channel.items)
    const last = Math.max(...items.map((item) => item.seq))
    const localBeats = beats.filter((step) =>
      placement.perGroup[groupIndex].some((verdict) =>
        verdict.key === step.verdict.key
      )
    )
    let start = -Infinity
    return [...localBeats, null].flatMap((step, localIndex) => {
      const end = step?.verdict.afterSeq ?? Infinity
      const slice = {
        ...group,
        phases: group.phases.filter((phase) =>
          phase.seq >= start && phase.seq < end
        ),
        channels: group.channels.map((channel) => ({
          ...channel,
          items: channel.items.filter((item) =>
            item.seq >= start && item.seq < end
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
      }]
    })
  })

  const osCard = (step: ReplayBeatStep) => <JudgeNote {...props} step={step} />
  const title = (text: string) =>
    text.replace(
      /^第([一二三])阶段·?/,
      (_, ordinal: string) => `（阶段${'一二三'.indexOf(ordinal) + 1}/3）`,
    )
  const heading = (
    <h2 className='text-xs font-semibold text-(--foreground-muted)'>裁判 OS</h2>
  )
  const track = (
    <JudgeSidebarTrend
      beats={beats}
      mobileTrendTarget={props.mobileTrendTarget}
      labels={labels}
      connectionGap={4}
      onSelect={(index) => focusJudgeBeat(beats[index].verdict.key)}
    />
  )
  const content = (chunk: typeof chunks[number], index: number) => (
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
      {renderGroup(chunk.group)}
    </div>
  )

  if (!beats.length) return <>{groups.map(renderGroup)}</>
  return (
    <section ref={root} className='judge-transcript' aria-label='对话与裁判 OS'>
      {compact
        ? (
          <>
            {chunks.map((chunk, index) => (
              <div
                className='judge-transcript-columns judge-transcript-pair'
                key={index}
              >
                {content(chunk, index)}
                <aside className='judge-transcript-paired-aside'>
                  {index === 0 && (
                    <div className='mb-5 space-y-3'>{heading}{track}</div>
                  )}
                  {chunk.step && (
                    <>
                      <p className='mb-2 text-[11px] text-(--foreground-muted)'>
                        {speechProgressLabel(
                          props.speechNumberOf(chunk.step.verdict),
                        )}
                      </p>
                      {osCard(chunk.step)}
                    </>
                  )}
                </aside>
              </div>
            ))}
          </>
        )
        : (
          <div className='judge-transcript-columns judge-transcript-aligned-grid'>
            <div className='judge-transcript-dialogue-column space-y-5'>
              {chunks.map(content)}
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
                  <p className='mb-2 text-[11px] text-(--foreground-muted)'>
                    {speechProgressLabel(
                      props.speechNumberOf(chunk.step!.verdict),
                    )}
                    {chunk.step!.changed ? ' · 倾向变化' : ''}
                  </p>
                  {osCard(chunk.step!)}
                </div>
              ))}
            </aside>
          </div>
        )}
    </section>
  )
}
