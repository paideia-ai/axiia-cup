import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { StageGroup } from '../../lib/transcript'
import type { ReplayBeatStep } from '../../lib/replay'
import type { VerdictDTO } from '../../api/types'
import type { SpeakerLabels } from '../timeline/labels'
import { judgeFavorSide } from '../timeline/labels'
import { OsBeatCard } from '../timeline/os-beat-card'

export interface JudgePresentation {
  mobileTrendTarget?: HTMLElement | null
  beats: ReplayBeatStep[]
  labels: SpeakerLabels
  speechNumberOf: (verdict: VerdictDTO) => number | undefined
  anchorSeqOf: (verdict: VerdictDTO) => number | null
  showTrace: boolean
  traceOf: (verdict: VerdictDTO) => string | null
  // The page's own OS card (replay highlight and 继续 included); without it the
  // plain card renders.
  renderNote?: (verdict: VerdictDTO) => ReactNode
}
// One slice of a stage group: rows with start <= seq < end.
export interface ChunkRange {
  start: number
  end: number
}
export interface JudgeDialoguePresentation extends JudgePresentation {
  // Replay: only these notes are shown; the trend keeps every beat's slot.
  revealedKeys?: ReadonlySet<string> | null
  empty: ReactNode
  groups: StageGroup[]
  renderGroup: (group: StageGroup, range: ChunkRange) => ReactNode
}
export interface TabbedJudgePresentation extends JudgePresentation {
  panels: ReactNode[]
  tabLabels: string[]
  beatTabs: Record<string, number>
}
export function colorOf(step: ReplayBeatStep, labels: SpeakerLabels) {
  const side = judgeFavorSide(labels, step.beat.favor)
  return side === 'a'
    ? 'var(--accent)'
    : side === 'b'
    ? 'var(--info)'
    : 'var(--warning)'
}

export function useCompactJudgeLayout() {
  const [compact, setCompact] = useState(() =>
    globalThis.matchMedia?.('(max-width: 899px)').matches ?? false
  )
  useEffect(() => {
    const media = matchMedia('(max-width: 899px)')
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return compact
}
export function focusJudgeBeat(key: string) {
  const card = document.getElementById(`beat-${key}`)
  card?.setAttribute('tabindex', '-1')
  card?.focus({ preventScroll: true })
  card?.scrollIntoView({ block: 'center', behavior: 'instant' })
}
export function JudgeNote(
  { step, labels, traceOf, showTrace, renderNote }: JudgePresentation & {
    step: ReplayBeatStep
  },
) {
  return (
    <div
      className='judge-transcript-os'
      style={{ '--os-favor-color': colorOf(step, labels) } as CSSProperties}
    >
      {renderNote?.(step.verdict) ?? (
        <OsBeatCard
          verdict={step.verdict}
          labels={labels}
          trace={traceOf(step.verdict)}
          showTrace={showTrace}
        />
      )}
    </div>
  )
}

export function speechProgressLabel(number: number | undefined): string {
  return number == null ? '发言前' : `读至 #${number} 后`
}

export function JudgeNoteCaption(
  { step, speechNumberOf }: {
    step: ReplayBeatStep
    speechNumberOf: JudgePresentation['speechNumberOf']
  },
) {
  return (
    <p className='mb-2 text-[11px] text-(--foreground-muted)'>
      {speechProgressLabel(speechNumberOf(step.verdict))}
      {step.changed ? ' · 倾向变化' : ''}
    </p>
  )
}
