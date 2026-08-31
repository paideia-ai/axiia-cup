import type { ReactNode } from 'react'

import type { VerdictDTO } from '../api/types'
import { parseVerdict, verdictLabel } from '../lib/verdict'
import type { SpeakerLabels } from './timeline/labels'
import { speakerName } from './timeline/labels'
import { tm } from '../testmode/mark'
import { ReasoningFold } from './timeline/reasoning-fold'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

// The parsed fields of a verdict, without the card around them — the finished
// report reuses this to promote the terminal 判词 into the result card (#69).
export function VerdictBody({
  verdict,
  labels,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
}) {
  const parsed = parseVerdict(verdict.output)
  return (
    <>
      {parsed.fields.map((field) => (
        <div {...tm('FA.verdict-field')} key={field.key} className='space-y-1'>
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
          <p
            {...tm('FA.verdict-field')}
            className='whitespace-pre-wrap text-sm text-(--foreground)'
          >
            {parsed.fallbackText}
          </p>
        )
        : null}
    </>
  )
}

export function VerdictCard({
  verdict,
  labels,
  interim,
  children,
  trace,
  showTrace = false,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
  interim: boolean
  children?: ReactNode
  // 这次裁决生成时模型的真实推演轨迹（#22②）：原本挂在被吸收的 act 行上，行
  // 不再渲染后随卡走。调试模式之外不出现。
  trace?: string | null
  showTrace?: boolean
}) {
  // An interim verdict is spectator-visible but is never injected into a player
  // agent's context; without the badge the transcript reads like they cheated.
  return (
    <Card {...tm('FA.verdict-card')}>
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2
            {...tm('FA.verdict-title')}
            className='text-sm font-semibold text-(--foreground)'
          >
            {verdictLabel(verdict.key)}
          </h2>
          {interim
            ? (
              <Badge {...tm('FA.verdict-interim-badge')} tone='warning'>
                仅观众可见 · 未注入角色
              </Badge>
            )
            : null}
          <span
            {...tm('FA.verdict-model')}
            className='text-xs text-(--foreground-muted)'
          >
            {verdict.model}
          </span>
        </div>

        <VerdictBody verdict={verdict} labels={labels} />

        {showTrace && trace?.trim() ? <ReasoningFold text={trace} /> : null}

        {children}
      </CardContent>
    </Card>
  )
}
