import type { ReactNode } from 'react'

import type { TurnDTO } from '../../api/types'
import type { ScriptEvent } from '../../lib/event'
import {
  eventNumber,
  eventRecord,
  eventString,
  eventSummary,
  eventType,
  scriptEvent,
} from '../../lib/event'
import type { SpeakerLabels } from './labels'
import { renderJuryEvent } from './jury-event-row'
import { speakerName } from './labels'

// One rendering per `game.emit` type. An unknown type is still a row: its own text
// if it carries one, its type name otherwise, with the payload behind a fold. The
// SPA never dumps raw JSON into the reading flow.

function Narration({ children }: { children: ReactNode }) {
  return (
    <div className='rounded-lg border border-dashed border-(--border) bg-white/2 px-4 py-3 text-center'>
      {children}
    </div>
  )
}

function SceneRow({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const actor = eventString(event, 'actor')
  const text = eventString(event, 'text') ?? ''
  return (
    <Narration>
      {actor
        ? (
          <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
            {speakerName(labels, actor)}
          </p>
        )
        : null}
      <p className='mt-1 whitespace-pre-wrap text-sm text-(--foreground-subtle)'>
        {text}
      </p>
    </Narration>
  )
}

function OrderRow({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const actor = eventString(event, 'actor')
  const first = eventString(event, 'first')
  const second = eventString(event, 'second')
  return (
    <div className='rounded-lg border border-(--border) bg-[rgba(96,165,250,0.06)] px-4 py-3'>
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--info)'>
        次序已定{actor ? ` · ${speakerName(labels, actor)}` : ''}
      </p>
      <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-(--foreground)'>
        <span className='rounded-md bg-white/6 px-2.5 py-1'>
          先 · {first ? speakerName(labels, first) : '—'}
        </span>
        <span className='text-(--foreground-muted)'>然后</span>
        <span className='rounded-md bg-white/6 px-2.5 py-1'>
          后 · {second ? speakerName(labels, second) : '—'}
        </span>
      </div>
    </div>
  )
}

function GestureRow({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const actor = eventString(event, 'actor')
  const opened = event.opened === true
  const who = actor ? speakerName(labels, actor) : '他'
  return (
    <p
      className={`px-4 py-1.5 text-center text-sm italic ${
        opened ? 'text-(--warning)' : 'text-(--foreground-muted)'
      }`}
    >
      （{opened ? `${who}拆开密函，细读` : `${who}始终未拆密函`}）
    </p>
  )
}

function VerdictEventRow({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const actor = eventString(event, 'actor')
  const judgment = eventString(event, 'judgment') ??
    eventString(event, 'scheme')
  const winner = eventString(event, 'winner')
  const requests = eventRecord(event, 'requests')
  return (
    <div className='rounded-xl border border-(--border) bg-[rgba(224,74,47,0.06)] px-4 py-4'>
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--accent)'>
        裁决{actor ? ` · ${speakerName(labels, actor)}` : ''}
      </p>
      {judgment
        ? (
          <p className='mt-2 text-base font-semibold text-(--foreground)'>
            {judgment}
          </p>
        )
        : null}
      {winner
        ? (
          <p className='mt-1 text-sm text-(--foreground-subtle)'>
            采信 {speakerName(labels, winner)}
          </p>
        )
        : null}
      {requests
        ? (
          <div className='mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3'>
            {Object.entries(requests).map(([id, decision]) => (
              <div
                key={id}
                className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                  decision === '同意'
                    ? 'bg-[rgba(52,211,153,0.12)] text-(--success)'
                    : 'bg-white/4 text-(--foreground-muted)'
                }`}
              >
                <span className='font-mono'>{id}</span>
                <span>{decision}</span>
              </div>
            ))}
          </div>
        )
        : null}
    </div>
  )
}

function ScoreRow({
  event,
  labels,
}: {
  event: ScriptEvent
  labels: SpeakerLabels
}) {
  const scoreA = eventNumber(event, 'scoreA')
  const scoreB = eventNumber(event, 'scoreB')
  const winner = eventString(event, 'winner')
  const trueRequests = eventRecord(event, 'trueRequests')
  const guesses = eventRecord(event, 'guesses')
  // Whichever keys the script chose to break the ledger down by — sides in one
  // scenario, role or NPC lanes in the next.
  const sides = [
    ...new Set([
      ...Object.keys(trueRequests ?? {}),
      ...Object.keys(guesses ?? {}),
    ]),
  ]
  return (
    <div className='rounded-xl border border-(--border) bg-white/2 px-4 py-4'>
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        计分
      </p>
      <div className='mt-2 flex items-baseline gap-3 text-sm text-(--foreground)'>
        <span className='text-lg font-black'>
          {scoreA ?? '—'} : {scoreB ?? '—'}
        </span>
        {winner
          ? (
            <span className='text-(--foreground-subtle)'>
              胜方 {speakerName(labels, winner)}
            </span>
          )
          : null}
      </div>
      {trueRequests || guesses
        ? (
          <div className='mt-3 space-y-1 text-xs text-(--foreground-subtle)'>
            {sides.map((side) => {
              const truth = trueRequests?.[side]
              const guess = guesses?.[side]
              if (!truth && !guess) return null
              // F2（#69）：原本要两行对读才知道的「猜中/被识破」就地标注，
              // 与结果卡、隐藏目标区块同一口径。只在恰好两侧对猜时有定义。
              const other = sides.length === 2
                ? sides.find((key) =>
                  key !== side
                )
                : undefined
              const otherTruth = other != null
                ? trueRequests?.[other]
                : undefined
              const otherGuess = other != null ? guesses?.[other] : undefined
              return (
                <p key={side}>
                  {speakerName(labels, side)}
                  {truth
                    ? (
                      <>
                        {' '}真目标{' '}
                        <span className='font-mono text-(--foreground)'>
                          {truth}
                        </span>
                        {otherGuess != null && otherGuess === truth
                          ? <span className='text-(--accent)'>（被识破）</span>
                          : null}
                      </>
                    )
                    : null}
                  {guess
                    ? (
                      <>
                        {' '}· 猜{' '}
                        <span className='font-mono text-(--foreground)'>
                          {guess}
                        </span>
                        {otherTruth != null && guess === otherTruth
                          ? <span className='text-(--success)'>（猜中）</span>
                          : null}
                      </>
                    )
                    : null}
                </p>
              )
            })}
          </div>
        )
        : null}
    </div>
  )
}

function GenericRow({
  event,
  turn,
  labels,
}: {
  event: ScriptEvent | null
  turn: TurnDTO
  labels: SpeakerLabels
}) {
  const type = event ? eventType(event) : null
  const summary = event ? eventSummary(event) : null
  const line = summary ?? turn.finalText
  return (
    <Narration>
      <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
        {speakerName(labels, turn.speaker)}
        {type ? ` · ${type}` : ''}
      </p>
      <p className='mt-1 whitespace-pre-wrap text-sm text-(--foreground-subtle)'>
        {line || '（本场景的一个事件，此版本尚未适配呈现）'}
      </p>
      {event
        ? (
          <details className='mt-2 text-left'>
            <summary className='cursor-pointer text-[11px] text-(--foreground-muted)'>
              原始数据
            </summary>
            <pre className='mt-1 overflow-x-auto rounded-md bg-black/30 p-2 text-[11px] text-(--foreground-muted)'>
              {JSON.stringify(event, null, 2)}
            </pre>
          </details>
        )
        : null}
    </Narration>
  )
}

// Event rows are narration the engine committed without an LLM call — a 密函
// delivery, not somebody speaking. They must never read as a speech bubble.
export function EventRow({
  turn,
  labels,
  scenarioID,
  showReasoning,
}: {
  turn: TurnDTO
  labels: SpeakerLabels
  scenarioID: string
  showReasoning: boolean
}) {
  const event = scriptEvent(turn)
  const juryRow = event && scenarioID === 'legal-harbor-murder-jury'
    ? renderJuryEvent(event, labels, showReasoning)
    : null
  if (juryRow) return juryRow
  switch (event ? eventType(event) : null) {
    case 'scene':
      return <SceneRow event={event!} labels={labels} />
    case 'order':
      return <OrderRow event={event!} labels={labels} />
    case 'gesture':
      return <GestureRow event={event!} labels={labels} />
    case 'verdict':
      return <VerdictEventRow event={event!} labels={labels} />
    case 'score':
      return <ScoreRow event={event!} labels={labels} />
    default:
      return <GenericRow event={event} turn={turn} labels={labels} />
  }
}
