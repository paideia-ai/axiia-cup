import { afterEach, describe, expect, it } from 'bun:test'

import {
  buildLangfuseTraceUrl,
  buildLlmObservabilityMetadata,
  buildLlmRunObservabilityMetadata,
} from './llm-observability'

const originalLangfuseBaseUrl = process.env.LANGFUSE_BASE_URL
const originalLangfuseProjectId = process.env.LANGFUSE_PROJECT_ID

afterEach(() => {
  if (originalLangfuseBaseUrl == null) {
    delete process.env.LANGFUSE_BASE_URL
  } else {
    process.env.LANGFUSE_BASE_URL = originalLangfuseBaseUrl
  }

  if (originalLangfuseProjectId == null) {
    delete process.env.LANGFUSE_PROJECT_ID
  } else {
    process.env.LANGFUSE_PROJECT_ID = originalLangfuseProjectId
  }
})

describe('buildLlmObservabilityMetadata', () => {
  it('separates gateway provider from underlying provider for gateway models', () => {
    const metadata = buildLlmObservabilityMetadata({
      jsonMode: true,
      model: 'deepseek-v4-pro',
      trace: {
        attempt: 2,
        matchId: 42,
        phase: 'scoring',
        purpose: 'game',
        scenarioId: 'trolley-problem',
        side: 'scorer',
        source: 'tournament',
        turnIndex: 10,
        userId: 7,
      },
    })

    expect(metadata.gatewayProvider).toBe('siliconflow')
    expect(metadata.underlyingProvider).toBe('deepseek')
    expect(metadata.source).toBe('tournament')
    expect(metadata.sessionId).toBe('match:42')
    expect(metadata.traceName).toBe('match:42')
    expect(metadata.generationName).toBe('axiia:scoring:scorer')
    expect(metadata.propagatedMetadata).toMatchObject({
      attempt: '2',
      gatewayProvider: 'siliconflow',
      matchId: '42',
      modelId: 'deepseek-v4-pro',
      outputType: 'json',
      phase: 'scoring',
      purpose: 'game',
      scenarioId: 'trolley-problem',
      side: 'scorer',
      source: 'tournament',
      turnIndex: '10',
      underlyingProvider: 'deepseek',
    })
    expect(metadata.generationMetadata).toMatchObject({
      attempt: 2,
      matchId: 42,
      userId: 7,
    })
    expect(metadata.otelAttributes).toMatchObject({
      'axiia.attempt': 2,
      'axiia.gateway.provider': 'siliconflow',
      'axiia.match.id': 42,
      'axiia.model.id': 'deepseek-v4-pro',
      'axiia.phase': 'scoring',
      'axiia.call.purpose': 'game',
      'axiia.provider.underlying': 'deepseek',
      'axiia.run.source': 'tournament',
      'axiia.scenario.id': 'trolley-problem',
      'axiia.side': 'scorer',
      'axiia.turn_index': 10,
      'gen_ai.operation.name': 'chat',
      'gen_ai.output.type': 'json',
      'gen_ai.provider.name': 'deepseek',
      'gen_ai.request.model': 'deepseek-ai/DeepSeek-V4-Pro',
      'user.id': 7,
    })
    expect(metadata.tags).toEqual(
      expect.arrayContaining([
        'gateway:siliconflow',
        'model:deepseek-v4-pro',
        'phase:scoring',
        'provider:deepseek',
        'purpose:game',
        'scenario:trolley-problem',
        'side:scorer',
        'source:tournament',
      ]),
    )
  })

  it('infers playground source and handles direct Anthropic provider models', () => {
    const metadata = buildLlmObservabilityMetadata({
      model: 'claude-opus-4-5',
      trace: {
        phase: 'judgment',
        playgroundRunId: 9,
        purpose: 'game',
        scenarioId: 'honnoji-decision',
        side: 'judge',
      },
    })

    expect(metadata.gatewayProvider).toBe('anthropic')
    expect(metadata.underlyingProvider).toBe('anthropic')
    expect(metadata.source).toBe('playground')
    expect(metadata.sessionId).toBe('playground:9')
    expect(metadata.propagatedMetadata).toMatchObject({
      gatewayProvider: 'anthropic',
      modelId: 'claude-opus-4-5',
      phase: 'judgment',
      playgroundRunId: '9',
      purpose: 'game',
      scenarioId: 'honnoji-decision',
      side: 'judge',
      source: 'playground',
      underlyingProvider: 'anthropic',
    })
    expect(metadata.otelAttributes).toMatchObject({
      'axiia.gateway.provider': 'anthropic',
      'axiia.playground_run.id': 9,
      'axiia.provider.underlying': 'anthropic',
      'gen_ai.output.type': 'text',
      'gen_ai.provider.name': 'anthropic',
      'gen_ai.request.model': 'claude-opus-4-5-20251101',
    })
  })
})

describe('buildLlmRunObservabilityMetadata', () => {
  it('builds game and phase metadata for a complete match trace', () => {
    const metadata = buildLlmRunObservabilityMetadata({
      matchId: 42,
      phase: 'judgment',
      purpose: 'game',
      scenarioId: 'trolley-problem',
      source: 'tournament',
    })

    expect(metadata.sessionId).toBe('match:42')
    expect(metadata.traceName).toBe('match:42')
    expect(metadata.metadata).toMatchObject({
      matchId: '42',
      phase: 'judgment',
      purpose: 'game',
      scenarioId: 'trolley-problem',
      source: 'tournament',
    })
    expect(metadata.otelAttributes).toMatchObject({
      'axiia.call.purpose': 'game',
      'axiia.match.id': 42,
      'axiia.phase': 'judgment',
      'axiia.run.source': 'tournament',
      'axiia.scenario.id': 'trolley-problem',
    })
    expect(metadata.tags).toEqual(
      expect.arrayContaining([
        'phase:judgment',
        'purpose:game',
        'scenario:trolley-problem',
        'source:tournament',
      ]),
    )
  })

  it('marks research rejudges separately from game traffic', () => {
    const metadata = buildLlmRunObservabilityMetadata({
      matchId: 42,
      purpose: 'rejudge',
      scenarioId: 'trolley-problem',
      source: 'tournament',
    })

    expect(metadata.metadata.purpose).toBe('rejudge')
    expect(metadata.otelAttributes['axiia.call.purpose']).toBe('rejudge')
    expect(metadata.tags).toContain('purpose:rejudge')
  })
})

describe('buildLangfuseTraceUrl', () => {
  it('builds a project trace URL only when all required pieces are configured', () => {
    delete process.env.LANGFUSE_PROJECT_ID
    process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com/'

    expect(buildLangfuseTraceUrl('trace 1')).toBeNull()

    process.env.LANGFUSE_PROJECT_ID = 'project/with space'

    expect(buildLangfuseTraceUrl('trace 1')).toBe(
      'https://cloud.langfuse.com/project/project%2Fwith%20space/traces/trace%201',
    )
  })
})
