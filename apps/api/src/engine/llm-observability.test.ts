import { afterEach, describe, expect, it } from 'bun:test'

import {
  buildLangfuseTraceUrl,
  buildLlmObservabilityMetadata,
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
      model: 'deepseek-v3.2',
      trace: {
        attempt: 2,
        matchId: 42,
        phase: 'scoring',
        scenarioId: 'trolley-problem',
        side: 'scorer',
        source: 'tournament',
        turnIndex: 10,
        userId: 7,
      },
    })

    expect(metadata.gatewayProvider).toBe('dashscope')
    expect(metadata.underlyingProvider).toBe('deepseek')
    expect(metadata.source).toBe('tournament')
    expect(metadata.sessionId).toBe('match:42')
    expect(metadata.traceName).toBe('match:42')
    expect(metadata.generationName).toBe('axiia:scoring:scorer')
    expect(metadata.propagatedMetadata).toMatchObject({
      attempt: '2',
      gatewayProvider: 'dashscope',
      matchId: '42',
      modelId: 'deepseek-v3.2',
      outputType: 'json',
      phase: 'scoring',
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
      'axiia.gateway.provider': 'dashscope',
      'axiia.match.id': 42,
      'axiia.model.id': 'deepseek-v3.2',
      'axiia.phase': 'scoring',
      'axiia.provider.underlying': 'deepseek',
      'axiia.run.source': 'tournament',
      'axiia.scenario.id': 'trolley-problem',
      'axiia.side': 'scorer',
      'axiia.turn_index': 10,
      'gen_ai.operation.name': 'chat',
      'gen_ai.output.type': 'json',
      'gen_ai.provider.name': 'deepseek',
      'gen_ai.request.model': 'deepseek-v3.2',
      'user.id': 7,
    })
    expect(metadata.tags).toEqual(
      expect.arrayContaining([
        'gateway:dashscope',
        'model:deepseek-v3.2',
        'phase:scoring',
        'provider:deepseek',
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

  it('tags benchmark traces without assigning them to gameplay sources', () => {
    const metadata = buildLlmObservabilityMetadata({
      model: 'deepseek-v4-pro',
      trace: {
        benchmarkCaseId: 'vivian-yisiliu-ABC',
        benchmarkName: 'trolley-win-rate',
        benchmarkRunId: 'bench-run-1',
        phase: 'dialogue',
        scenarioId: 'trolley-problem',
        side: 'a',
        turnIndex: 0,
        userId: 14,
      },
    })

    expect(metadata.source).toBeNull()
    expect(metadata.sessionId).toBe('benchmark:bench-run-1')
    expect(metadata.traceName).toBe('benchmark:bench-run-1')
    expect(metadata.propagatedMetadata).toMatchObject({
      benchmarkCaseId: 'vivian-yisiliu-ABC',
      benchmarkName: 'trolley-win-rate',
      benchmarkRunId: 'bench-run-1',
      modelId: 'deepseek-v4-pro',
      phase: 'dialogue',
      scenarioId: 'trolley-problem',
      side: 'a',
      turnIndex: '0',
    })
    expect(metadata.propagatedMetadata).not.toHaveProperty('source')
    expect(metadata.otelAttributes).toMatchObject({
      'axiia.benchmark.case_id': 'vivian-yisiliu-ABC',
      'axiia.benchmark.name': 'trolley-win-rate',
      'axiia.benchmark.run_id': 'bench-run-1',
    })
    expect(metadata.otelAttributes).not.toHaveProperty('axiia.run.source')
    expect(metadata.tags).toEqual(
      expect.arrayContaining([
        'benchmark:trolley-win-rate',
        'benchmarkRun:bench-run-1',
        'scenario:trolley-problem',
      ]),
    )
    expect(metadata.tags).not.toContain('source:playground')
    expect(metadata.tags).not.toContain('source:tournament')
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
