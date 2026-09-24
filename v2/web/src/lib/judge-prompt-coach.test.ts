import { describe, expect, it } from 'vitest'

import {
  completeJudgePromptCoachAfterSave,
  judgePromptCoachCompleted,
  markJudgePromptViewed,
} from './judge-prompt-coach'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('judge prompt coaching', () => {
  it('completes only after the same account has viewed and then saved in the scenario', () => {
    const storage = memoryStorage()
    const scope = { accountID: 'vivian', scenarioID: 'shangyang-court' }

    expect(completeJudgePromptCoachAfterSave(scope, storage)).toBe(false)
    expect(judgePromptCoachCompleted(scope, storage)).toBe(false)

    markJudgePromptViewed(scope, storage)
    expect(judgePromptCoachCompleted(scope, storage)).toBe(false)
    expect(completeJudgePromptCoachAfterSave(scope, storage)).toBe(true)
    expect(judgePromptCoachCompleted(scope, storage)).toBe(true)
  })

  it('shares completion between agents in one scenario but not between scenarios or accounts', () => {
    const storage = memoryStorage()
    const completed = { accountID: 'vivian', scenarioID: 'shangyang-court' }
    markJudgePromptViewed(completed, storage)
    completeJudgePromptCoachAfterSave(completed, storage)

    expect(judgePromptCoachCompleted(completed, storage)).toBe(true)
    expect(judgePromptCoachCompleted(
      { accountID: 'vivian', scenarioID: 'trolley-problem' },
      storage,
    )).toBe(false)
    expect(judgePromptCoachCompleted(
      { accountID: 'another-tester', scenarioID: 'shangyang-court' },
      storage,
    )).toBe(false)
  })
})
