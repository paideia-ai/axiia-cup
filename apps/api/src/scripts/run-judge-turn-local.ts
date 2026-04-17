import path from 'node:path'

import type { ScenarioRecord } from '../db/schema'
import { executeJudgeTurn } from '../engine/core'

import { getRepoRootPath, loadRepoEnv } from './_helpers'

type JudgeTurnInput = {
  infoAssignment: {
    roleAFalseInfoIds: string[]
    roleATrueRequestIds: string[]
    roleBFalseInfoIds: string[]
    roleBTrueRequestIds: string[]
  }
  judgeTranscriptA: Array<{
    answer: string
    isCorrect: boolean | null
    question: string
    round: number
    selectedInfoId: string
  }>
  judgeTranscriptB: Array<{
    answer: string
    isCorrect: boolean | null
    question: string
    round: number
    selectedInfoId: string
  }>
  scenario: ScenarioRecord
  transcript: Array<{
    content: string
    role: string
    speaker: 'a' | 'b'
  }>
}

function getInputPath() {
  const explicitPath = process.argv[2]

  if (!explicitPath) {
    return getRepoRootPath(
      'apps/api/src/scripts/fixtures/judge-turn-sample.json',
    )
  }

  return path.isAbsolute(explicitPath)
    ? explicitPath
    : path.resolve(process.cwd(), explicitPath)
}

function getOptionalFlag(name: string) {
  const index = process.argv.indexOf(name)
  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

async function main() {
  loadRepoEnv()

  const inputPath = getInputPath()
  const text = await Bun.file(inputPath).text()
  const input = JSON.parse(text) as JudgeTurnInput

  const judgeModel = getOptionalFlag('--judge-model')
  const scorerModel = getOptionalFlag('--scorer-model')

  const scenario: ScenarioRecord = {
    ...input.scenario,
    judgeModel: judgeModel ?? input.scenario.judgeModel,
    scorerModel: scorerModel ?? input.scenario.scorerModel,
  }

  const result = await executeJudgeTurn({
    infoAssignment: input.infoAssignment,
    judgeTranscriptA: input.judgeTranscriptA,
    judgeTranscriptB: input.judgeTranscriptB,
    scenario,
    transcript: input.transcript,
  })

  console.log(
    JSON.stringify(
      {
        inputPath,
        judgeModel: scenario.judgeModel,
        scorerModel: scenario.scorerModel,
        result,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
