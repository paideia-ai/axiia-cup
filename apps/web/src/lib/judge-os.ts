import type { JudgeOsEntry } from '@axiia/shared'

export function getSettledJudgeOsTurns(
  entries: JudgeOsEntry[],
  failedTurns: number[],
  expectedCount: number,
) {
  return [
    ...new Set([...entries.map((entry) => entry.afterTurn), ...failedTurns]),
  ]
    .filter(
      (afterTurn) =>
        Number.isInteger(afterTurn) &&
        afterTurn > 0 &&
        afterTurn % 2 === 0 &&
        afterTurn / 2 <= expectedCount,
    )
    .sort((left, right) => left - right)
}
