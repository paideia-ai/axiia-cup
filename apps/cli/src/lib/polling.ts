import type { TournamentDetail, TournamentMatchSummary } from '@axiia/shared'

import { apiFetch } from './http'

export type RoundPollStatus = {
  errored: number
  queued: number
  running: number
  scored: number
  total: number
}

export type RoundPollResult = {
  allScored: boolean
  erroredMatchIds: number[]
  matches: TournamentMatchSummary[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function pollRoundCompletion(params: {
  intervalMs?: number
  onProgress?: (status: RoundPollStatus) => void
  roundNumber: number
  tournamentId: number
}): Promise<RoundPollResult> {
  const interval = params.intervalMs ?? 5000

  while (true) {
    const detail = await apiFetch<TournamentDetail>(
      `/api/tournaments/${params.tournamentId}`,
      undefined,
      true,
    )

    const round = detail.rounds.find(
      (r) => r.roundNumber === params.roundNumber,
    )

    if (!round) {
      throw new Error(`Round ${params.roundNumber} not found in tournament`)
    }

    const scored = round.matches.filter((m) => m.status === 'scored').length
    const errored = round.matches.filter((m) => m.status === 'error').length
    const running = round.matches.filter(
      (m) => m.status === 'running' || m.status === 'judging',
    ).length
    const queued = round.matches.filter((m) => m.status === 'queued').length
    const total = round.matches.length

    params.onProgress?.({ scored, errored, running, queued, total })

    if (scored + errored === total) {
      return {
        allScored: errored === 0,
        erroredMatchIds: round.matches
          .filter((m) => m.status === 'error')
          .map((m) => m.id),
        matches: round.matches,
      }
    }

    await sleep(interval)
  }
}
