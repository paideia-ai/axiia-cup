import { describe, expect, it } from 'bun:test'

import {
  createSubmissionSchema,
  evaluationModelOptions,
  getModelDefinition,
  getUnderlyingModelProvider,
  modelOptions,
  modelIds,
  playerModelOptions,
  playerSelectableModelIds,
  resolveModelLabel,
  submissionModelIdSchema,
  updateScenarioSchema,
} from '@axiia/shared'

const chosenPlayerModelIds = [
  'deepseek-v4-pro',
  'kimi-k2.6',
  'qwen3.6-27b',
  'minimax-m2.5',
  'glm-5.2',
] as const

describe('model catalog', () => {
  it('exposes only the chosen current Chinese lab models to players', () => {
    expect([...playerSelectableModelIds]).toEqual([...chosenPlayerModelIds])
    expect(playerModelOptions.map((option) => option.id)).toEqual([
      ...chosenPlayerModelIds,
    ])
    expect(playerModelOptions.map((option) => option.id)).not.toContain(
      'deepseek-v3.2',
    )
    expect(playerModelOptions.map((option) => option.id)).not.toContain(
      'minimax-m3',
    )
    expect(playerModelOptions.map((option) => option.id)).not.toContain(
      'glm-5.1',
    )
  })

  it('makes the chosen current Chinese lab models available for judging and scoring', () => {
    const evaluationIds = evaluationModelOptions.map((option) => option.id)

    for (const modelId of chosenPlayerModelIds) {
      expect(evaluationIds).toContain(modelId)
    }

    expect(
      updateScenarioSchema.safeParse({
        agentPromptTemplate: 'agent',
        examinationQuestionTemplate: '',
        falseInfoCount: 0,
        judgeModel: 'deepseek-v4-pro',
        judgePrompt: 'judge',
        openingLine: 'opening',
        roleAHiddenInfo: [],
        roleAName: 'A',
        roleAOptions: [],
        roleARequests: [],
        roleBHiddenInfo: [],
        roleBName: 'B',
        roleBOptions: [],
        roleBRequests: [],
        scorerModel: 'glm-5.2',
        scorerPrompt: 'score',
        trueRequestCount: 0,
        turnCount: 10,
      }).success,
    ).toBe(true)
  })

  it('keeps legacy submission models resolvable for historical records', () => {
    expect(modelOptions.map((option) => option.id)).toContain('deepseek-v3.2')
    expect(resolveModelLabel('deepseek-v3.2')).toBe('DeepSeek V3.2')
    expect(submissionModelIdSchema.parse('deepseek-v3.2')).toBe('deepseek-v3.2')
    expect(resolveModelLabel('kimi-k2.5')).toBe('Kimi K2.5')
    expect(resolveModelLabel('minimax-m3')).toBe('MiniMax M3')
    expect(resolveModelLabel('qwen3.5-397b-a17b')).toBe('Qwen3.5')
    expect(resolveModelLabel('glm-5.1')).toBe('GLM-5.1')
    expect(submissionModelIdSchema.parse('glm-5.1')).toBe('glm-5.1')
  })

  it('rejects legacy model ids for newly created player submissions', () => {
    const validInput = {
      modelA: 'deepseek-v4-pro',
      modelB: 'glm-5.2',
      promptA: '你是甲方',
      promptB: '你是乙方',
      scenarioId: 'shangyang-court',
    }

    expect(createSubmissionSchema.safeParse(validInput).success).toBe(true)
    expect(
      createSubmissionSchema.safeParse({
        ...validInput,
        modelA: 'deepseek-v3.2',
      }).success,
    ).toBe(false)
    expect(
      createSubmissionSchema.safeParse({
        ...validInput,
        modelA: 'glm-5.1',
      }).success,
    ).toBe(false)
  })

  it('maps the chosen ids to the intended SiliconFlow models', () => {
    expect(getModelDefinition('deepseek-v4-pro').apiModel).toBe(
      'deepseek-ai/DeepSeek-V4-Pro',
    )
    expect(getModelDefinition('kimi-k2.6').apiModel).toBe(
      'Pro/moonshotai/Kimi-K2.6',
    )
    expect(getModelDefinition('qwen3.6-27b')).toMatchObject({
      apiModel: 'Qwen/Qwen3.6-27B',
      thinking: 'disabled',
    })
    expect(getModelDefinition('minimax-m2.5').apiModel).toBe(
      'MiniMaxAI/MiniMax-M2.5',
    )
    expect(getModelDefinition('glm-5.2').apiModel).toBe('zai-org/GLM-5.2')
  })

  it('does not change the default evaluation model order', () => {
    expect(evaluationModelOptions[0]?.id).toBe('deepseek-v3.2')
  })

  it('has a catalog entry for every valid model id', () => {
    for (const modelId of modelIds) {
      expect(getModelDefinition(modelId).id).toBe(modelId)
      expect(getUnderlyingModelProvider(modelId)).toBe(
        getModelDefinition(modelId).underlyingProvider,
      )
    }
  })
})
