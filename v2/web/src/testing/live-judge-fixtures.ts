import type { MatchDetail } from '../api/types'

/** A historical transcript prefix, with all unfinished-match result fields cleared. */
export function liveJudgeMatch(
  match: MatchDetail,
  turnCount: number,
): MatchDetail {
  const turns = match.turns.slice(0, turnCount)
  return {
    ...match,
    summary: {
      ...match.summary,
      finished: false,
      scored: false,
      finishedAt: null,
      winner: null,
    },
    currentTurn: turns.length,
    turns,
    verdicts: match.verdicts.filter((verdict) =>
      verdict.afterSeq <= turns.length
    ),
    scoreA: null,
    scoreB: null,
    reasoning: null,
  }
}
