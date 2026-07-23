import {
  getModelDefinition,
  type ModelId,
  type ModelProvider,
} from '@axiia/shared'

import type { LlmCallPhase, LlmCallSide } from '../db/schema'

export type LlmRunSource = 'playground' | 'tournament'

export type LlmCallTraceContext = {
  attempt?: number
  benchmarkCaseId?: string
  benchmarkName?: string
  benchmarkRunId?: string
  judgePromptCandidateId?: string
  matchId?: number
  phase: LlmCallPhase
  playgroundRunId?: number
  scenarioId?: string
  side: LlmCallSide
  source?: LlmRunSource
  turnIndex?: number | null
  userId?: number | null
}

type OtelAttributeValue = boolean | number | string

export type LlmObservabilityMetadata = {
  apiModel: string
  gatewayProvider: ModelProvider
  generationMetadata: Record<string, unknown>
  generationName: string
  otelAttributes: Record<string, OtelAttributeValue>
  propagatedMetadata: Record<string, string>
  sessionId: string | undefined
  source: LlmRunSource | null
  tags: string[]
  traceName: string
  underlyingProvider: string
}

function getRunSource(trace: LlmCallTraceContext | undefined) {
  if (trace?.source) {
    return trace.source
  }

  if (trace?.matchId != null) {
    return 'tournament'
  }

  if (trace?.playgroundRunId != null) {
    return 'playground'
  }

  return null
}

export function getLangfuseSessionId(trace: LlmCallTraceContext | undefined) {
  if (trace?.benchmarkRunId) {
    return `benchmark:${trace.benchmarkRunId}`
  }

  return trace?.matchId != null
    ? `match:${trace.matchId}`
    : trace?.playgroundRunId != null
      ? `playground:${trace.playgroundRunId}`
      : undefined
}

function getLangfuseGenerationName(trace: LlmCallTraceContext | undefined) {
  return trace ? `axiia:${trace.phase}:${trace.side}` : 'axiia:chat'
}

export function getJudgePromptVersion(candidateId: string | undefined) {
  const match = candidateId?.match(/(?:^|-)P(\d+)$/iu)
  return match ? `P${match[1]}` : undefined
}

function setStringIfPresent(
  target: Record<string, string>,
  key: string,
  value: number | string | null | undefined,
) {
  if (value == null) {
    return
  }

  target[key] = String(value)
}

function setAttributeIfPresent(
  target: Record<string, OtelAttributeValue>,
  key: string,
  value: OtelAttributeValue | null | undefined,
) {
  if (value == null) {
    return
  }

  target[key] = value
}

export function buildLlmObservabilityMetadata(params: {
  jsonMode?: boolean
  model: ModelId
  trace: LlmCallTraceContext | undefined
}): LlmObservabilityMetadata {
  const definition = getModelDefinition(params.model)
  const source = getRunSource(params.trace)
  const sessionId = getLangfuseSessionId(params.trace)
  const generationName = getLangfuseGenerationName(params.trace)
  const traceName = sessionId ?? 'axiia:llm'
  const gatewayProvider = definition.provider
  const underlyingProvider = definition.underlyingProvider
  const outputType = params.jsonMode ? 'json' : 'text'
  const judgePromptVersion = getJudgePromptVersion(
    params.trace?.judgePromptCandidateId,
  )

  const propagatedMetadata: Record<string, string> = {
    apiModel: definition.apiModel,
    gatewayProvider,
    modelId: params.model,
    outputType,
    underlyingProvider,
  }

  setStringIfPresent(
    propagatedMetadata,
    'attempt',
    params.trace?.attempt ?? null,
  )
  setStringIfPresent(
    propagatedMetadata,
    'benchmarkCaseId',
    params.trace?.benchmarkCaseId,
  )
  setStringIfPresent(
    propagatedMetadata,
    'benchmarkName',
    params.trace?.benchmarkName,
  )
  setStringIfPresent(
    propagatedMetadata,
    'benchmarkRunId',
    params.trace?.benchmarkRunId,
  )
  setStringIfPresent(
    propagatedMetadata,
    'judgePromptCandidateId',
    params.trace?.judgePromptCandidateId,
  )
  setStringIfPresent(
    propagatedMetadata,
    'judgePromptVersion',
    judgePromptVersion,
  )
  setStringIfPresent(propagatedMetadata, 'matchId', params.trace?.matchId)
  setStringIfPresent(propagatedMetadata, 'phase', params.trace?.phase)
  setStringIfPresent(
    propagatedMetadata,
    'playgroundRunId',
    params.trace?.playgroundRunId,
  )
  setStringIfPresent(propagatedMetadata, 'scenarioId', params.trace?.scenarioId)
  setStringIfPresent(propagatedMetadata, 'side', params.trace?.side)
  setStringIfPresent(propagatedMetadata, 'source', source)
  setStringIfPresent(
    propagatedMetadata,
    'turnIndex',
    params.trace?.turnIndex ?? null,
  )

  const generationMetadata: Record<string, unknown> = {
    ...propagatedMetadata,
    attempt: params.trace?.attempt,
    benchmarkCaseId: params.trace?.benchmarkCaseId,
    benchmarkName: params.trace?.benchmarkName,
    benchmarkRunId: params.trace?.benchmarkRunId,
    matchId: params.trace?.matchId,
    playgroundRunId: params.trace?.playgroundRunId,
    turnIndex: params.trace?.turnIndex ?? null,
    userId: params.trace?.userId,
  }

  const otelAttributes: Record<string, OtelAttributeValue> = {
    'axiia.gateway.provider': gatewayProvider,
    'axiia.model.id': params.model,
    'axiia.provider.underlying': underlyingProvider,
    'gen_ai.operation.name': 'chat',
    'gen_ai.output.type': outputType,
    'gen_ai.provider.name': underlyingProvider,
    'gen_ai.request.model': definition.apiModel,
  }

  setAttributeIfPresent(otelAttributes, 'axiia.attempt', params.trace?.attempt)
  setAttributeIfPresent(
    otelAttributes,
    'axiia.benchmark.case_id',
    params.trace?.benchmarkCaseId,
  )
  setAttributeIfPresent(
    otelAttributes,
    'axiia.benchmark.name',
    params.trace?.benchmarkName,
  )
  setAttributeIfPresent(
    otelAttributes,
    'axiia.benchmark.run_id',
    params.trace?.benchmarkRunId,
  )
  setAttributeIfPresent(
    otelAttributes,
    'axiia.judge_prompt.candidate_id',
    params.trace?.judgePromptCandidateId,
  )
  setAttributeIfPresent(
    otelAttributes,
    'axiia.judge_prompt.version',
    judgePromptVersion,
  )
  setAttributeIfPresent(otelAttributes, 'axiia.match.id', params.trace?.matchId)
  setAttributeIfPresent(otelAttributes, 'axiia.phase', params.trace?.phase)
  setAttributeIfPresent(
    otelAttributes,
    'axiia.playground_run.id',
    params.trace?.playgroundRunId,
  )
  setAttributeIfPresent(otelAttributes, 'axiia.run.source', source ?? undefined)
  setAttributeIfPresent(
    otelAttributes,
    'axiia.scenario.id',
    params.trace?.scenarioId,
  )
  setAttributeIfPresent(otelAttributes, 'axiia.side', params.trace?.side)
  setAttributeIfPresent(
    otelAttributes,
    'axiia.turn_index',
    params.trace?.turnIndex ?? undefined,
  )
  setAttributeIfPresent(otelAttributes, 'user.id', params.trace?.userId)

  return {
    apiModel: definition.apiModel,
    gatewayProvider,
    generationMetadata,
    generationName,
    otelAttributes,
    propagatedMetadata,
    sessionId,
    source,
    tags: [
      `provider:${underlyingProvider}`,
      `gateway:${gatewayProvider}`,
      `model:${params.model}`,
      params.trace?.scenarioId ? `scenario:${params.trace.scenarioId}` : null,
      params.trace?.benchmarkName
        ? `benchmark:${params.trace.benchmarkName}`
        : null,
      params.trace?.benchmarkRunId
        ? `benchmarkRun:${params.trace.benchmarkRunId}`
        : null,
      params.trace?.judgePromptCandidateId
        ? `judgePromptCandidate:${params.trace.judgePromptCandidateId}`
        : null,
      judgePromptVersion ? `judgePromptVersion:${judgePromptVersion}` : null,
      source ? `source:${source}` : null,
      params.trace?.phase ? `phase:${params.trace.phase}` : null,
      params.trace?.side ? `side:${params.trace.side}` : null,
    ].filter((value): value is string => value !== null),
    traceName,
    underlyingProvider,
  }
}

export function buildLangfuseTraceUrl(traceId: string | null | undefined) {
  const baseUrl = process.env.LANGFUSE_BASE_URL?.replace(/\/+$/, '')
  const projectId = process.env.LANGFUSE_PROJECT_ID?.trim()

  if (!baseUrl || !projectId || !traceId) {
    return null
  }

  return `${baseUrl}/project/${encodeURIComponent(projectId)}/traces/${encodeURIComponent(traceId)}`
}
