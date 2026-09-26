import type { MatchDetail, VerdictDTO } from '../api/types'
import type { SpeakerLabels } from '../components/timeline/labels'
import { eventRecord, scriptEvent } from './event'
import {
  deriveScoreBreakdown,
  ledgerFromScore,
  parseLedger,
} from './scoring-reasoning'

// Consolidate only contracts whose contents remain represented in the ending.
// Incomplete/historical records retain the generic verdict and scoring report.
export function canConsolidateEnding(
  match: MatchDetail,
  verdict: VerdictDTO | null,
  labels: SpeakerLabels,
): boolean {
  if (!match.summary.finished || !match.summary.scored) return false
  const scenario = match.summary.scenarioID
  if (scenario === 'legal-harbor-murder-jury') {
    return match.turns.some((turn) =>
      scriptEvent(turn)?.type === 'final_vote_reveal'
    )
  }
  if (!verdict) return false
  let payload: Record<string, unknown>
  try {
    const value: unknown = JSON.parse(verdict.output)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false
    }
    payload = value as Record<string, unknown>
  } catch {
    return false
  }
  const text = (key: string) =>
    typeof payload[key] === 'string' && !!payload[key].trim()
  const exactKeys = (keys: string[]) =>
    Object.keys(payload).every((key) => keys.includes(key)) && keys.every(text)
  if (scenario === 'trolley-problem') {
    return exactKeys(['A', 'B', 'C', 'speech'])
  }
  if (scenario === 'fengyiting-real') {
    return exactKeys(['scheme', 'side', 'speech'])
  }
  if (!['shangyang-court', 'honnoji-decision'].includes(scenario)) return false

  const events = match.turns.map(scriptEvent)
  const verdicts = events.filter((event) => event?.type === 'verdict')
  if (
    verdicts.length !== 1 ||
    events.filter((event) => event?.type === 'score').length !== 1
  ) return false
  const event = verdicts[0]!
  const requests = eventRecord(event, 'requests')
  if (!requests || Object.keys(requests).length !== 6) return false
  if (
    !exactKeys(['judgment', 'speech', ...Object.keys(requests)]) ||
    payload.judgment !== event.judgment
  ) return false
  if (
    Object.entries(requests).some(([id, ruling]) =>
      !['同意', '不同意'].includes(ruling) || payload[id] !== ruling
    )
  ) return false
  const breakdown = deriveScoreBreakdown(match.turns)
  const ids = new Set<string>()
  for (const side of ['a', 'b'] as const) {
    const options =
      labels.module?.hiddenGoals?.[side]?.groups.flatMap((group) =>
        group.options
      ) ?? []
    const selected = options.filter((option) => option.id in requests)
    if (
      selected.length !== 3 ||
      !selected.some((option) => option.id === breakdown?.trueRequests?.[side])
    ) return false
    selected.forEach((option) => ids.add(option.id))
  }
  if (ids.size !== 6) return false
  const context = {
    slotID: scenario,
    lanes: match.speakerLabels,
    speakers: labels.speakers,
    participants: match.summary.participants,
  }
  const ledger = ledgerFromScore(match.turns, context) ??
    parseLedger(match.reasoning, context)
  if (!ledger.subtotals || ledger.leftover.length) return false
  return (['a', 'b'] as const).every((side) => {
    const total = side === 'a' ? match.scoreA : match.scoreB
    const eventTotal = side === 'a' ? breakdown?.scoreA : breakdown?.scoreB
    return typeof total === 'number' && Number.isFinite(total) &&
      eventTotal === total && Math.abs(ledger.subtotals![side] - total) < 1e-8
  })
}
