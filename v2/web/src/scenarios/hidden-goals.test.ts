import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import { fengyitingReal } from './fengyiting-real'
import { honnojiDecision } from './honnoji-decision'
import { legalHarborMurderJury } from './legal-harbor-murder-jury'
import { shangyangCourt } from './shangyang-court'
import { trolleyProblem } from './trolley-problem'
import type { ScenarioHiddenGoalOption, ScenarioModule } from './types'

function optionsOf(module: ScenarioModule): ScenarioHiddenGoalOption[] {
  return Object.values(module.hiddenGoals ?? {}).flatMap((side) =>
    side?.groups.flatMap((group) => group.options) ?? []
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function expectOptionsMatchScript(
  module: ScenarioModule,
  scriptURL: URL,
  expectedCount: number,
) {
  const script = await readFile(scriptURL, 'utf8')
  const options = optionsOf(module)
  expect(options).toHaveLength(expectedCount)
  for (const option of options) {
    expect(script).toMatch(
      new RegExp(
        `id:\\s*'${escapeRegExp(option.id)}'\\s*,\\s*content:\\s*'${
          escapeRegExp(option.text)
        }'`,
      ),
    )
  }
}

describe('public hidden-goal candidate lists', () => {
  it('matches every Shangyang request in the executable script', async () => {
    await expectOptionsMatchScript(
      shangyangCourt,
      new URL(
        '../../../scenarios/scenarios/shangyang-court/script.js',
        import.meta.url,
      ),
      6,
    )
  })

  it('matches every Honnoji role request in the executable script', async () => {
    await expectOptionsMatchScript(
      honnojiDecision,
      new URL(
        '../../../scenarios/scenarios/honnoji-decision/script.js',
        import.meta.url,
      ),
      12,
    )
  })

  it('stays absent from scenarios without true/fake request mechanics', () => {
    expect(trolleyProblem.hiddenGoals).toBeUndefined()
    expect(fengyitingReal.hiddenGoals).toBeUndefined()
    expect(legalHarborMurderJury.hiddenGoals).toBeUndefined()
  })

  it('keeps the V1 request-discovery penalties for structured scoring', () => {
    expect(shangyangCourt.requestScoring?.discoveryPenalty).toBe(1)
    expect(honnojiDecision.requestScoring?.discoveryPenalty).toBe(0.75)
  })
})
