import { describe, expect, it } from 'bun:test'

import type { ScenarioRecord } from '../db/schema'
import { shangyangJudgeOsPrompt } from '../db/shangyang-judge-os-prompt'
import type { chatCompletion } from './llm'
import { executeMatchSession } from './core'
import { PlaygroundRunInterruptedError } from './playground-interrupt'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

const scenario: ScenarioRecord = {
  id: 'shangyang-court',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  turnCount: 10,
  judgeModel: 'glm-5.1',
  scorerModel: 'deepseek-v3.2',
  openingLine: '请开始辩论。',
  agentPromptTemplate: '你是{{roleName}}。',
  examinationQuestionTemplate: '',
  judgePrompt: '{{debate}}',
  judgeOsPrompt: shangyangJudgeOsPrompt,
  scorerPrompt: 'scorer',
  roleAName: '商鞅',
  roleAHiddenInfo: '[]',
  roleAOptions: '[]',
  roleARequests: '[]',
  roleBName: '甘龙',
  roleBHiddenInfo: '[]',
  roleBOptions: '[]',
  roleBRequests: '[]',
  falseInfoCount: 0,
  trueRequestCount: 0,
  createdAt: '2026-07-17T00:00:00.000Z',
}

describe('Judge OS match session integration', () => {
  it('shows dialogue immediately, skips the final pair, and starts judging before OS settles', async () => {
    const firstJudgeOs = deferred<string>()
    const events: string[] = []
    const judgeOsStarts: number[] = []
    const publishedStates: Array<{
      entries: number[]
      failedTurns: number[]
    }> = []
    let firstJudgeOsCompleted = false
    let judgmentStartedBeforeFirstJudgeOsCompleted = false

    const completeChat: typeof chatCompletion = async (request) => {
      const phase = request.trace?.phase
      const turnIndex = request.trace?.turnIndex ?? 0

      if (phase === 'dialogue') {
        events.push(`dialogue-generated:${turnIndex + 1}`)
        return `第 ${turnIndex + 1} 回合发言`
      }

      if (phase === 'judge_os') {
        judgeOsStarts.push(turnIndex)
        events.push(`os-start:${turnIndex}`)

        if (turnIndex === 2) {
          const response = await firstJudgeOs.promise
          firstJudgeOsCompleted = true
          return response
        }

        return JSON.stringify({
          afterTurn: turnIndex,
          tendency: turnIndex % 4 === 0 ? '商鞅' : '甘龙',
          reason: `第 ${turnIndex - 1}–${turnIndex} 回合的即时理由`,
        })
      }

      if (phase === 'judgment') {
        events.push('judgment-start')
        judgmentStartedBeforeFirstJudgeOsCompleted = !firstJudgeOsCompleted
        firstJudgeOs.resolve(
          JSON.stringify({
            afterTurn: 2,
            tendency: '甘龙',
            reason: '第 1–2 回合的即时理由',
          }),
        )
        return JSON.stringify({
          judgment: '变法',
          requests: {},
          speech: '寡人意已决。',
        })
      }

      throw new Error(`Unexpected phase: ${phase}`)
    }

    const result = await executeMatchSession({
      completeChat,
      infoAssignment: {
        roleAFalseInfoIds: [],
        roleATrueRequestIds: [],
        roleBFalseInfoIds: [],
        roleBTrueRequestIds: [],
      },
      modelA: 'qwen3.6-27b',
      modelB: 'qwen3.6-27b',
      onDialogueTurn: (transcript) => {
        events.push(`dialogue-visible:${transcript.length}`)
      },
      onJudgeOsState: (state) => {
        publishedStates.push({
          entries: state.entries.map((entry) => entry.afterTurn),
          failedTurns: state.failedTurns,
        })
      },
      promptA: '商鞅策略',
      promptB: '甘龙策略',
      scenario,
    })

    expect(result.transcript).toHaveLength(10)
    expect(judgeOsStarts).toEqual([2, 4, 6, 8])
    expect(result.judgeOs.map((entry) => entry.afterTurn)).toEqual([2, 4, 6, 8])
    expect(result.judgeOsFailedTurns).toEqual([])
    expect(result.judgeOsProvenance).toMatchObject({
      contextVariant: 'C0',
      dialogueTurnCount: 10,
      finalTurnExcluded: true,
      model: 'glm-5.1',
      systemPrompt: shangyangJudgeOsPrompt,
    })
    expect(judgmentStartedBeforeFirstJudgeOsCompleted).toBe(true)
    expect(events.indexOf('dialogue-visible:2')).toBeLessThan(
      events.indexOf('os-start:2'),
    )
    expect(publishedStates.at(-1)).toEqual({
      entries: [2, 4, 6, 8],
      failedTurns: [],
    })
  })

  it('keeps the match successful when a Judge OS call fails', async () => {
    const completeChat: typeof chatCompletion = async (request) => {
      if (request.trace?.phase === 'dialogue') {
        return `第 ${(request.trace.turnIndex ?? 0) + 1} 回合发言`
      }
      if (request.trace?.phase === 'judge_os') {
        throw new PlaygroundRunInterruptedError('synthetic Judge OS failure')
      }
      if (request.trace?.phase === 'judgment') {
        return JSON.stringify({
          judgment: '维持现状',
          requests: {},
          speech: '寡人意已决。',
        })
      }
      throw new Error(`Unexpected phase: ${request.trace?.phase}`)
    }

    const result = await executeMatchSession({
      completeChat,
      infoAssignment: {
        roleAFalseInfoIds: [],
        roleATrueRequestIds: [],
        roleBFalseInfoIds: [],
        roleBTrueRequestIds: [],
      },
      modelA: 'qwen3.6-27b',
      modelB: 'qwen3.6-27b',
      promptA: '商鞅策略',
      promptB: '甘龙策略',
      scenario: { ...scenario, turnCount: 4 },
    })

    expect(result.transcript).toHaveLength(4)
    expect(result.judgeDecision).toContain('维持现状')
    expect(result.judgeOs).toEqual([])
    expect(result.judgeOsFailedTurns).toEqual([2])
  })
})
