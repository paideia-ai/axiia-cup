import { useLayoutEffect, useRef, useState } from 'react'
import { focusJudgeBeat, JudgeNote, useCompactJudgeLayout } from './shared'
import { useAlignedJudgeNotes } from './use-aligned-judge-notes'
import type { TabbedJudgePresentation } from './shared'
import { TranscriptTabs } from '../transcript-tabs'
import { JudgeSidebarTrend } from './judge-sidebar-trend'
import './judge-transcript.css'

export function TabbedJudgeTranscript({
  panels,
  mobileTrendTarget,
  tabLabels,
  beats,
  labels,
  beatTabs,
  connectionGap = 4,
  showTrace,
  traceOf,
  anchorSeqOf,
}: TabbedJudgePresentation & { connectionGap?: number }) {
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const compact = useCompactJudgeLayout()
  useAlignedJudgeNotes(root, !compact, [active, panels, showTrace])
  const [target, setTarget] = useState<string | null>(null)
  useLayoutEffect(() => {
    if (!target) return
    focusJudgeBeat(target)
    setTarget(null)
  }, [active, target])
  return (
    <section
      ref={root}
      className='judge-transcript judge-trolley'
      aria-label='电车难题对话与全局倾向'
    >
      <div className='judge-transcript-columns judge-transcript-aligned-grid'>
        <div className='judge-transcript-dialogue-column min-w-0'>
          <TranscriptTabs
            labels={tabLabels}
            panels={panels}
            reached={tabLabels.length - 1}
            streaming={false}
            value={active}
            onValueChange={setActive}
          />
        </div>
        <aside
          className='judge-transcript-aligned-aside min-w-0'
          aria-label='裁判 OS 侧栏'
        >
          <h2 className='mb-4 text-xs font-semibold text-(--foreground-muted)'>
            裁判 OS
          </h2>
          <JudgeSidebarTrend
            beats={beats}
            mobileTrendTarget={mobileTrendTarget}
            labels={labels}
            connectionGap={connectionGap}
            onSelect={(index) => {
              const key = beats[index].verdict.key
              setActive(beatTabs[key] ?? 0)
              setTarget(key)
            }}
          />
          <div className={compact ? 'space-y-5' : undefined}>
            {beats.filter((step) => beatTabs[step.verdict.key] === active).map((
              step,
            ) => (
              <div
                key={step.verdict.key}
                className={compact
                  ? undefined
                  : 'judge-transcript-aligned-note'}
                data-os-after={step.verdict.afterSeq}
                data-os-anchor={anchorSeqOf(step.verdict)}
              >
                <p className='mb-2 text-[11px] text-(--foreground-muted)'>
                  读至 #{step.verdict.afterSeq}{' '}
                  后{step.changed ? ' · 倾向变化' : ''}
                </p>
                <JudgeNote
                  step={step}
                  beats={beats}
                  labels={labels}
                  traceOf={traceOf}
                  anchorSeqOf={anchorSeqOf}
                  showTrace={showTrace}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
