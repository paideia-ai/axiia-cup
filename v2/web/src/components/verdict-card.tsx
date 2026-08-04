import type { ReactNode } from 'react'

import type { VerdictDTO } from '../api/types'
import { parseVerdict, verdictLabel } from '../lib/verdict'
import type { SpeakerLabels } from './timeline/labels'
import { speakerName } from './timeline/labels'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

export function VerdictCard({
  verdict,
  labels,
  interim,
  children,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
  interim: boolean
  children?: ReactNode
}) {
  // An interim verdict is spectator-visible but is never injected into a player
  // agent's context; without the badge the transcript reads like they cheated.
  const parsed = parseVerdict(verdict.output)

  return (
    <Card>
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            {verdictLabel(verdict.key)}
          </h2>
          {interim
            ? <Badge tone='warning'>仅观众可见 · 未注入角色</Badge>
            : null}
          <span className='text-xs text-(--foreground-muted)'>
            {verdict.model}
          </span>
        </div>

        {parsed.fields.map((field) => (
          <div key={field.key} className='space-y-1'>
            <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
              {field.label}
            </p>
            {field.lines.map((line, index) => (
              <p
                key={index}
                className='whitespace-pre-wrap text-sm text-(--foreground)'
              >
                {field.key === 'winner' || field.key === 'selectedSide'
                  ? speakerName(labels, line)
                  : line}
              </p>
            ))}
          </div>
        ))}

        {parsed.fallbackText
          ? (
            <p className='whitespace-pre-wrap text-sm text-(--foreground)'>
              {parsed.fallbackText}
            </p>
          )
          : null}

        {children}
      </CardContent>
    </Card>
  )
}
