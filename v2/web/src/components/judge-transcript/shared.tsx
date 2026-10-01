import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { StageGroup } from '../../lib/transcript'
import type { ReplayBeatStep } from '../../lib/replay'
import type { VerdictDTO } from '../../api/types'
import type { SpeakerLabels } from '../timeline/labels'
import { judgeFavorSide } from '../timeline/labels'
import { OsBeatCard } from '../timeline/os-beat-card'

export interface JudgePresentation {
  activeBeatKey?: string | null
  onResume?: () => void
  mobileTrendTarget?: HTMLElement | null
  beats: ReplayBeatStep[]
  labels: SpeakerLabels
  speechNumberOf: (verdict: VerdictDTO) => number | undefined
  anchorSeqOf: (verdict: VerdictDTO) => number | null
  showTrace: boolean
  traceOf: (verdict: VerdictDTO) => string | null
}
export interface JudgeDialoguePresentation extends JudgePresentation {
  emptyMessage?: string
  groups: StageGroup[]
  renderGroup: (group: StageGroup) => ReactNode
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
  { step, labels, traceOf, showTrace, activeBeatKey, onResume }:
    & JudgePresentation
    & {
      step: ReplayBeatStep
    },
) {
  return (
    <div
      className='judge-transcript-os'
      style={{ '--os-favor-color': colorOf(step, labels) } as CSSProperties}
    >
      <OsBeatCard
        verdict={step.verdict}
        highlight={activeBeatKey === step.verdict.key}
        onResume={activeBeatKey === step.verdict.key ? onResume : undefined}
        labels={labels}
        trace={traceOf(step.verdict)}
        showTrace={showTrace}
      />
    </div>
  )
}

export function speechProgressLabel(number: number | undefined): string {
  return number == null ? '发言前' : `读至 #${number} 后`
}
