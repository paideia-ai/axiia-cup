import { OutputBody, OutputBoundary, OutputText } from './emotion-playback'
import type { SpeakerLabels } from './timeline/labels'
import { RolePortrait } from './role-portrait'
import type { InquiryAnswer } from '../lib/inquiry'
import { tm } from '../testmode/mark'
import { Card, CardContent } from './ui/card'
import { ReasoningFold } from './timeline/reasoning-fold'

// Match main's VerdictCard / VerdictBody styles, with paired columns and the
// dialogue side colors carried by a narrow left border.
export function InquiryCards({ answers, labels, showReasoning = false }: {
  answers: InquiryAnswer[]
  labels?: SpeakerLabels
  showReasoning?: boolean
}) {
  return (
    <div className='inquiry-columns grid gap-3 md:grid-cols-2'>
      {answers.map((answer) => (
        <OutputBoundary
          key={answer.side}
          outputRef={answer.outputRef}
          labels={labels}
          speaker={answer.side}
        >
          <Card
            {...tm('FA.verdict-card')}
            className={`inquiry-card min-w-0 border-l-2 ${
              answer.side === 'a' ? 'border-l-(--accent)' : 'border-l-(--info)'
            }`}
            role='article'
            aria-label={`问询：${answer.name}`}
            key={answer.side}
            data-side={answer.side}
          >
            <CardContent className='space-y-3 pt-5'>
              <h3
                {...tm('FA.verdict-title')}
                className='flex items-center gap-2 text-sm font-semibold text-(--foreground)'
              >
                {labels
                  ? <RolePortrait labels={labels} speaker={answer.side} />
                  : null}
                问询：{answer.name}
              </h3>
              <OutputBody>
                <div className='space-y-1'>
                  <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
                    猜测{answer.otherName}的真实目标
                  </p>
                  <p
                    {...tm('FA.verdict-field')}
                    className='whitespace-pre-wrap text-sm text-(--foreground)'
                  >
                    <span className='mr-2 font-mono text-xs text-(--foreground-muted)'>
                      <OutputText text={answer.guess} />
                    </span>
                    <OutputText text={answer.goal} source={answer.guess} />
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
                    回答理由
                  </p>
                  <p
                    {...tm('FA.verdict-field')}
                    data-reason-side={answer.side}
                    className='whitespace-pre-wrap wrap-anywhere text-sm text-(--foreground)'
                  >
                    <OutputText text={answer.reason} />
                  </p>
                </div>
              </OutputBody>
              {showReasoning && answer.trace?.trim()
                ? <ReasoningFold text={answer.trace} />
                : null}
            </CardContent>
          </Card>
        </OutputBoundary>
      ))}
    </div>
  )
}

export function InquiryStage({ answers, labels, showReasoning }: {
  answers: InquiryAnswer[]
  labels?: SpeakerLabels
  showReasoning: boolean
}) {
  return (
    <section {...tm('FA.stage')} className='space-y-3' aria-label='屏退问询'>
      <h2
        {...tm('FA.stage-title')}
        className='text-xs font-semibold uppercase tracking-[0.1em] text-(--foreground-muted)'
      >
        （阶段2/3）屏退问询
      </h2>
      <InquiryCards
        labels={labels}
        answers={answers}
        showReasoning={showReasoning}
      />
    </section>
  )
}
