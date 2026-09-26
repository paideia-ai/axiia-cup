import type { ReplayBeatStep } from '../../lib/replay'
import type { SpeakerLabels } from '../timeline/labels'
import { JudgeTrendChart } from '../judge-trend'
import { Card, CardContent } from '../ui/card'

export function JudgeSidebarTrend({ beats, labels, onSelect, connectionGap }: {
  beats: ReplayBeatStep[]
  labels: SpeakerLabels
  connectionGap: number
  onSelect: (index: number) => void
}) {
  return (
    <Card className='judge-sidebar-trend'>
      <CardContent className='pt-5'>
        <JudgeTrendChart
          beats={beats}
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
}
