import { computeProgrammaticScore } from '../apps/api/src/engine/programmatic-scorer'
import { programmaticScorerVerificationCases } from '../apps/api/src/engine/programmatic-scorer-verification-cases'

const EPSILON = 1e-9

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function scoresEqual(actual: number, expected: number) {
  return Math.abs(actual - expected) <= EPSILON
}

const failures: string[] = []

for (const item of programmaticScorerVerificationCases) {
  try {
    const result = computeProgrammaticScore(item.params)

    if ('expectedError' in item) {
      failures.push(
        `${item.id}: expected error containing "${item.expectedError}", but scoring succeeded`,
      )
      continue
    }

    if (!result) {
      failures.push(
        `${item.id}: expected score result, but scorer returned null`,
      )
      continue
    }

    if (!('expected' in item)) {
      failures.push(
        `${item.id}: expected an error, but scorer returned a result`,
      )
      continue
    }

    const { expected } = item
    const matches =
      scoresEqual(result.scoreA, expected.scoreA) &&
      scoresEqual(result.scoreB, expected.scoreB) &&
      result.winner === expected.winner

    if (!matches) {
      failures.push(
        [
          `${item.id}: score mismatch`,
          `  expected: scoreA=${expected.scoreA}, scoreB=${expected.scoreB}, winner=${expected.winner}`,
          `  actual:   scoreA=${result.scoreA}, scoreB=${result.scoreB}, winner=${result.winner}`,
        ].join('\n'),
      )
    }
  } catch (error) {
    const message = getErrorMessage(error)

    if (
      'expectedError' in item &&
      typeof item.expectedError === 'string' &&
      message.includes(item.expectedError)
    ) {
      continue
    }

    failures.push(`${item.id}: unexpected error: ${message}`)
  }
}

const total = programmaticScorerVerificationCases.length
const passed = total - failures.length

console.log(`Programmatic scorer verification: ${passed}/${total} passed`)

if (failures.length > 0) {
  console.error(failures.join('\n\n'))
  process.exitCode = 1
}
