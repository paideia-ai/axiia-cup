import type { TurnDTO } from '../api/types'
import { eventNumber, eventRecord, eventType, scriptEvent } from './event'

const PROGRAMMATIC_SCORING_DETAIL_PREFIX = '程序化计分明细：'

export function formatScoringReasoning(reasoning: string | null | undefined) {
  if (!reasoning) {
    return ''
  }

  return reasoning
    .replace(
      new RegExp(`^\\s*${PROGRAMMATIC_SCORING_DETAIL_PREFIX}\\s*\\n?`),
      '',
    )
    .trimStart()
}

// The structured half of the 计分推导 section (#69): a scenario that emits a
// `score` event carries true targets, guesses and totals; the request rulings
// ride on its `verdict` event. A scenario that emits neither returns null and the
// page falls back to the prose ledger or a guided empty line.
export interface ScoreBreakdown {
  trueRequests: Record<string, string> | null
  guesses: Record<string, string> | null
  rulings: Record<string, string> | null
  scoreA: number | null
  scoreB: number | null
}

export function deriveScoreBreakdown(turns: TurnDTO[]): ScoreBreakdown | null {
  let score: ReturnType<typeof scriptEvent> = null
  let rulings: Record<string, string> | null = null
  for (const turn of turns) {
    if (turn.kind !== 'event') continue
    const event = scriptEvent(turn)
    if (event == null) continue
    const type = eventType(event)
    if (type === 'score') score = event
    else if (type === 'verdict') {
      rulings = eventRecord(event, 'requests') ?? rulings
    }
  }
  if (score == null && rulings == null) return null
  return {
    trueRequests: score ? eventRecord(score, 'trueRequests') : null,
    guesses: score ? eventRecord(score, 'guesses') : null,
    rulings,
    scoreA: score ? eventNumber(score, 'scoreA') : null,
    scoreB: score ? eventNumber(score, 'scoreB') : null,
  }
}
