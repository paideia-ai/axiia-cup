import { createPortal } from 'react-dom'
import { useCompactJudgeLayout } from './shared'
import type { ReplayBeatStep } from '../../lib/replay'
import type { SpeakerLabels } from '../timeline/labels'
import { JudgeTrendChart } from '../judge-trend'
import { Card, CardContent } from '../ui/card'

export function JudgeSidebarTrend(
  {
    beats,
    revealedKeys = null,
    labels,
    onSelect,
    connectionGap,
    mobileTrendTarget,
  }: {
    mobileTrendTarget?: HTMLElement | null
    beats: ReplayBeatStep[]
    // Replay: the axis spans every beat and fills in as they are revealed.
    revealedKeys?: ReadonlySet<string> | null
    labels: SpeakerLabels
    connectionGap: number
    onSelect: (index: number) => void
  },
) {
  const compact = useCompactJudgeLayout()
  const card = (
    <Card className='judge-sidebar-trend'>
      <CardContent className='pt-5'>
        <JudgeTrendChart
          beats={beats}
          revealedKeys={revealedKeys}
          labels={labels}
          speakers={[...(labels.speakers ?? [])]}
          connectionGap={connectionGap}
          legendPosition='stacked'
          fitWidth
          onSelectBeat={(key) => {
            const index = beats.findIndex((step) => step.verdict.key === key)
            if (index >= 0) onSelect(index)
          }}
        />
      </CardContent>
    </Card>
  )
  return compact && mobileTrendTarget
    ? createPortal(card, mobileTrendTarget)
    : card
}
