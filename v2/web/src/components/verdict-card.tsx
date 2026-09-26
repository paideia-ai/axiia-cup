import type { ReactNode } from 'react'

import type { VerdictDTO } from '../api/types'
import { isTerminalVerdict, parseVerdict, verdictLabel } from '../lib/verdict'
import type { SpeakerLabels } from './timeline/labels'
import { speakerName } from './timeline/labels'
import { tm } from '../testmode/mark'
import { ReasoningFold } from './timeline/reasoning-fold'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

function isVisitOrder(verdict: VerdictDTO, labels: SpeakerLabels): boolean {
  return verdict.key === 'order' && labels.module?.slotID === 'fengyiting-real'
}

// The parsed fields of a verdict, without the card around them — the finished
// report reuses this to promote the terminal 判词 into the result card (#69).
export function VerdictBody({
  verdict,
  labels,
  judgmentContent,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
  judgmentContent?: ReactNode
}) {
  const parsed = parseVerdict(verdict.output)
  const visitOrder = isVisitOrder(verdict, labels)
  const fields = visitOrder
    ? [...parsed.fields].sort((a, b) =>
      Number(b.key === 'first-side') - Number(a.key === 'first-side')
    )
    : parsed.fields
  return (
    <>
      {fields.map((field) => (
        <div {...tm('FA.verdict-field')} key={field.key} className='space-y-1'>
          <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
            {visitOrder && field.key === 'first-side' ? '先见' : field.label}
          </p>
          {judgmentContent && (field.key === 'judgment' || field.key === '判决')
            ? judgmentContent
            : field.lines.map((line, index) => (
              <p
                key={index}
                className={visitOrder && field.key === 'first-side'
                  ? 'whitespace-pre-wrap text-base font-semibold text-(--foreground)'
                  : isTerminalVerdict(verdict) &&
                      (field.key === 'judgment' || field.key === '判决')
                  ? 'whitespace-pre-wrap text-3xl leading-tight font-bold text-(--foreground) sm:text-4xl'
                  : 'whitespace-pre-wrap text-sm text-(--foreground)'}
              >
                {field.key === 'winner' || field.key === 'selectedSide' ||
                    (visitOrder && field.key === 'first-side')
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
  title,
  labels,
  interim,
  children,
  trace,
  showTrace = false,
  judgmentContent,
}: {
  verdict: VerdictDTO
  title?: string
  labels: SpeakerLabels
  interim: boolean
  children?: ReactNode
  // 这次裁决生成时模型的真实推演轨迹（#22②）：原本挂在被吸收的 act 行上，行
  // 不再渲染后随卡走。调试模式之外不出现。
  trace?: string | null
  showTrace?: boolean
  judgmentContent?: ReactNode
}) {
  const visitOrder = isVisitOrder(verdict, labels)
  return (
    <Card
      {...tm('FA.verdict-card')}
      className={isTerminalVerdict(verdict) || visitOrder
        ? 'border-l-2 border-l-(--warning)'
        : undefined}
    >
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2
            {...tm('FA.verdict-title')}
            className='text-sm font-semibold text-(--foreground)'
          >
            {visitOrder ? '貂蝉·裁定先后' : title ?? verdictLabel(verdict.key)}
          </h2>
          {interim && !visitOrder
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

        <VerdictBody
          verdict={verdict}
          labels={labels}
          judgmentContent={judgmentContent}
        />

        {showTrace && trace?.trim() ? <ReasoningFold text={trace} /> : null}

        {children}
      </CardContent>
    </Card>
  )
}
