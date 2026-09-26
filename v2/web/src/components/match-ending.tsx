// Shared terminal presentation for the application and local report stories.
import type { ReactNode } from 'react'
import type { MatchDetail, Side, VerdictDTO } from '../api/types'
import {
  deriveScoreBreakdown,
  formatDelta,
  ledgerFromScore,
  parseLedger,
} from '../lib/scoring-reasoning'
import { cn } from '../lib/cn'
import type { SpeakerLabels } from './timeline/labels'
import { sideName } from './timeline/labels'
import { VerdictCard } from './verdict-card'
import { VerdictEventRow } from './timeline/event-row'
import { eventRecord, scriptEvent } from '../lib/event'

function GoalsAndScoring(
  { match, labels }: { match: MatchDetail; labels: SpeakerLabels },
) {
  const breakdown = deriveScoreBreakdown(match.turns)
  const context = {
    slotID: match.summary.scenarioID,
    lanes: match.speakerLabels,
    speakers: labels.speakers,
    participants: match.summary.participants,
  }
  const ledger = ledgerFromScore(match.turns, context) ??
    parseLedger(match.reasoning, context)
  const event = match.turns.map(scriptEvent).reverse().find((event) =>
    event?.type === 'verdict'
  )
  if (!event) return null
  const entries = ledger?.items ?? []
  const assigned = new Set<typeof entries[number]>()
  const details: Record<string, ReactNode> = {}
  const requestOrder = Object.keys(eventRecord(event, 'requests') ?? {})
  const requestGroups: { label: string; ids: string[] }[] = []
  for (const side of ['a', 'b'] as Side[]) {
    const options =
      labels.module?.hiddenGoals?.[side]?.groups.flatMap((group) =>
        group.options
      ) ?? []
    const requests = options.filter((option) =>
      requestOrder.includes(option.id)
    )
    requestGroups.push({
      label: sideName(labels, side),
      ids: requests.map((request) => request.id),
    })
    for (const request of requests) {
      const isTrue = breakdown?.trueRequests?.[side] === request.id
      const changes = entries.filter((entry) =>
        entry.side === side && new RegExp(`\\b${request.id}\\b`).test(entry.why)
      )
      changes.forEach((entry) => assigned.add(entry))
      details[request.id] = (
        <div className='mt-2 space-y-2' data-review-goal={request.id}>
          <p className='text-[11px] text-(--foreground-subtle)'>
            <span
              data-review-truth={isTrue}
              className={isTrue
                ? 'font-semibold text-(--foreground)'
                : undefined}
            >
              {isTrue ? '真目标' : '假目标'}
            </span>
          </p>
          <p className='text-sm text-(--foreground)'>{request.text}</p>
          {changes.length
            ? changes.map((entry, index) => (
              <div
                key={index}
                data-review-ledger={entry.why}
                className='flex items-baseline justify-between gap-2'
              >
                <span className='text-[11px] text-(--foreground-subtle)'>
                  {entry.kind === 'identified'
                    ? entry.why.replace(`真目标 ${request.id} `, '')
                    : '获准计分'}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-sm font-semibold',
                    entry.delta > 0
                      ? 'text-(--success)'
                      : entry.delta < 0
                      ? 'text-(--accent)'
                      : 'text-(--foreground-subtle)',
                  )}
                >
                  {formatDelta(entry.delta)}
                </span>
              </div>
            ))
            : null}
        </div>
      )
    }
  }
  return (
    <section className='space-y-3' aria-label='隐藏目标及计分'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
        <h2 className='text-sm font-semibold text-(--foreground)'>
          隐藏目标及计分
        </h2>
        <div
          aria-label='本局总分'
          className='flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs'
        >
          <span className='text-(--foreground-muted)'>总分</span>
          {(['a', 'b'] as Side[]).map((side) => (
            <span key={side} className='inline-flex items-baseline gap-2'>
              <span className='text-(--foreground-subtle)'>
                {sideName(labels, side)}
              </span>
              <span className='font-mono text-sm font-semibold text-(--foreground)'>
                {(side === 'a' ? match.scoreA : match.scoreB) ?? '—'}
              </span>
            </span>
          ))}
        </div>
      </div>
      <VerdictEventRow
        event={event}
        labels={labels}
        requestDetails={details}
        requestGroups={requestGroups.sort((left, right) =>
          requestOrder.indexOf(left.ids[0]) - requestOrder.indexOf(right.ids[0])
        )}
        judgmentAside={
          <div className='flex flex-wrap justify-end gap-x-4 gap-y-1'>
            {entries.filter((entry) => entry.kind === 'main').map((
              entry,
              index,
            ) => (
              <span
                key={index}
                data-review-ledger={entry.why}
                className='inline-flex items-baseline gap-2 text-sm'
              >
                <span className='text-(--foreground-subtle)'>
                  {entry.side ? sideName(labels, entry.side) : entry.name}
                </span>
                <span className='font-mono font-semibold text-(--success)'>
                  {formatDelta(entry.delta)}
                </span>
              </span>
            ))}
          </div>
        }
      >
        {entries.filter((entry) =>
          entry.kind !== 'main' && !assigned.has(entry)
        ).map((entry, index) => (
          <div
            key={index}
            data-review-ledger={entry.why}
            className='mt-3 flex items-baseline justify-between gap-3 border-t border-(--border-soft) pt-3'
          >
            <span className='text-xs text-(--foreground-subtle)'>
              {entry.side ? sideName(labels, entry.side) : entry.name} ·{' '}
              {entry.why}
            </span>
            <span
              className={cn(
                'shrink-0 font-mono text-sm font-semibold',
                entry.delta > 0
                  ? 'text-(--success)'
                  : entry.delta < 0
                  ? 'text-(--accent)'
                  : 'text-(--foreground-subtle)',
              )}
            >
              {formatDelta(entry.delta)}
            </span>
          </div>
        ))}
        {ledger?.leftover.length
          ? (
            <p className='mt-3 whitespace-pre-wrap text-xs text-(--foreground-muted)'>
              {ledger.leftover.join('\n')}
            </p>
          )
          : null}
      </VerdictEventRow>
    </section>
  )
}

export function MatchEnding(
  { match, verdict, labels, trace, showTrace }: {
    match: MatchDetail
    verdict: VerdictDTO
    labels: SpeakerLabels
    trace: string | null
    showTrace: boolean
  },
) {
  const court = ['shangyang-court', 'honnoji-decision'].includes(
    match.summary.scenarioID,
  )
  const trolley = match.summary.scenarioID === 'trolley-problem'
  let reviewed = verdict
  let judgmentContent: ReactNode
  try {
    const payload = JSON.parse(verdict.output)
    const fields: Record<string, unknown> = {}
    if (court) fields['判决'] = payload.judgment
    else if (trolley) {
      fields['判决'] = {
        '第一案·原始电车': payload.A,
        '第二案·自动驾驶车': payload.B,
        '第三案·缸中之脑': payload.C,
      }
      if (
        [payload.A, payload.B, payload.C].every((value) =>
          typeof value === 'string' && value.trim()
        )
      ) {
        judgmentContent = (
          <dl className='grid divide-y divide-(--border-soft) sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
            {Object.entries(fields['判决'] as Record<string, string>).map((
              [name, result],
            ) => (
              <div
                key={name}
                className='flex items-baseline justify-between gap-3 py-2 sm:block sm:px-5 sm:py-1 sm:first:pl-0 sm:last:pr-0'
              >
                <dt className='text-[11px] text-(--foreground-muted)'>
                  {name}
                </dt>
                <dd className='text-base font-semibold text-(--foreground) sm:mt-1'>
                  {result}
                </dd>
              </div>
            ))}
          </dl>
        )
      }
    } else fields['判决'] = `${payload.side} · ${payload.scheme}`
    fields['判词'] = typeof payload.speech === 'string'
      ? payload.speech.replace(/\\n/g, '\n')
      : payload.speech
    reviewed = { ...verdict, output: JSON.stringify(fields) }
  } catch {
    // Retain verbatim output for historical unstructured verdicts.
  }
  return (
    <div className='space-y-6' data-review-ending>
      <VerdictCard
        verdict={reviewed}
        title={trolley ? '裁判裁决' : undefined}
        labels={labels}
        interim={false}
        trace={trace}
        showTrace={showTrace}
        judgmentContent={judgmentContent}
      />
      {court && <GoalsAndScoring match={match} labels={labels} />}
    </div>
  )
}
