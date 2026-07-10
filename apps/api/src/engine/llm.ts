import {
  getModelDefinition,
  type ModelId,
  type ModelProvider,
} from '@axiia/shared'
import {
  propagateAttributes,
  startActiveObservation,
  startObservation,
  type LangfuseGeneration,
  type LangfuseGenerationAttributes,
  type LangfuseSpan,
  type PropagateAttributesParams,
} from '@langfuse/tracing'
import OpenAI from 'openai'

import type * as DbClientModule from '../db/client'
import { llmCalls } from '../db/schema'
import { initializeLangfuseTracing, observeOpenAIClient } from '../lib/langfuse'
import {
  getPlaygroundInterruptMessage,
  isPlaygroundRunInterruptedError,
  PlaygroundRunInterruptedError,
} from './playground-interrupt'
import {
  buildLangfuseTraceUrl,
  buildLlmObservabilityMetadata,
  buildLlmRunObservabilityMetadata,
  type LlmCallTraceContext,
  type LlmObservabilityMetadata,
  type LlmPhaseTraceContext,
  type LlmRunTraceContext,
} from './llm-observability'

const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1'
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION ?? '2023-06-01'
const ANTHROPIC_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4096)

let _dbModulePromise: Promise<typeof DbClientModule> | null = null
let _openAiClients: Partial<Record<'openai' | 'siliconflow', OpenAI>> = {}

initializeLangfuseTracing()

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

type OpenAICompatibleProvider = 'openai' | 'siliconflow'

type AnthropicResponse = {
  content?: Array<{ text?: string; type: string }>
  usage?: { input_tokens?: number; output_tokens?: number }
}

type AnthropicRequestPayload = ReturnType<typeof buildAnthropicRequest>

export type ChatCompletionTrace = LlmCallTraceContext

type LangfuseLinkInfo = {
  langfuseObservationId: string | null
  langfuseTraceUrl: string | null
  otelSpanId: string | null
  otelTraceId: string | null
}

function getDbModule() {
  if (!_dbModulePromise) {
    _dbModulePromise = import('../db/client')
  }

  return _dbModulePromise
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function getOpenAICompatibleBaseUrl(provider: OpenAICompatibleProvider) {
  return provider === 'openai' ? OPENAI_BASE_URL : SILICONFLOW_BASE_URL
}

function getOpenAICompatibleApiKey(provider: OpenAICompatibleProvider) {
  return provider === 'openai'
    ? getRequiredEnv('OPENAI_API_KEY')
    : getRequiredEnv('SILICONFLOW_API_KEY')
}

function getOpenAICompatibleClient(provider: OpenAICompatibleProvider) {
  const existing = _openAiClients[provider]

  if (existing) {
    return existing
  }

  const client = new OpenAI({
    apiKey: getOpenAICompatibleApiKey(provider),
    baseURL: getOpenAICompatibleBaseUrl(provider),
  })

  _openAiClients[provider] = client
  return client
}

function getLangfusePropagationAttributes(
  trace: ChatCompletionTrace | undefined,
  observability: LlmObservabilityMetadata,
): PropagateAttributesParams {
  return {
    metadata: observability.propagatedMetadata,
    sessionId: observability.sessionId,
    tags: observability.tags,
    traceName: observability.traceName,
    userId: trace?.userId != null ? String(trace.userId) : undefined,
  }
}

function getObservedOpenAIClient(
  observability: LlmObservabilityMetadata,
  parentSpan: LangfuseSpan | null,
  provider: OpenAICompatibleProvider,
) {
  return observeOpenAIClient(getOpenAICompatibleClient(provider), {
    generationMetadata: observability.generationMetadata,
    generationName: observability.generationName,
    parentSpanContext: parentSpan?.otelSpan.spanContext(),
    sessionId: observability.sessionId,
    tags: observability.tags,
    traceName: observability.traceName,
  })
}

function emptyLangfuseLinkInfo(): LangfuseLinkInfo {
  return {
    langfuseObservationId: null,
    langfuseTraceUrl: null,
    otelSpanId: null,
    otelTraceId: null,
  }
}

function getLangfuseLinkInfo(
  observation: LangfuseGeneration | LangfuseSpan | null,
): LangfuseLinkInfo {
  if (!observation) {
    return emptyLangfuseLinkInfo()
  }

  return {
    langfuseObservationId: observation.id,
    langfuseTraceUrl: buildLangfuseTraceUrl(observation.traceId),
    otelSpanId: observation.id,
    otelTraceId: observation.traceId,
  }
}

function withLangfusePropagation<T>(
  trace: ChatCompletionTrace | undefined,
  observability: LlmObservabilityMetadata,
  fn: () => T,
): T {
  if (!initializeLangfuseTracing()) {
    return fn()
  }

  return propagateAttributes(
    getLangfusePropagationAttributes(trace, observability),
    fn,
  )
}

async function withLangfuseRunSpan<T>(
  name: string,
  trace: LlmRunTraceContext | LlmPhaseTraceContext,
  fn: () => Promise<T>,
): Promise<T> {
  if (!initializeLangfuseTracing()) {
    return await fn()
  }

  const observability = buildLlmRunObservabilityMetadata(trace)
  let operationStarted = false
  let operationCompleted = false
  let operationFailed = false
  let operationError: unknown
  let operationResult: T | undefined

  try {
    return await propagateAttributes(
      {
        metadata: observability.metadata,
        sessionId: observability.sessionId,
        tags: observability.tags,
        traceName: observability.traceName,
      },
      () =>
        startActiveObservation(name, async (span) => {
          span.update({ metadata: observability.metadata })
          span.otelSpan.setAttributes(observability.otelAttributes)
          operationStarted = true

          try {
            operationResult = await fn()
            operationCompleted = true
            return operationResult
          } catch (error) {
            operationFailed = true
            operationError = error
            throw error
          }
        }),
    )
  } catch (error) {
    if (operationFailed) {
      throw operationError
    }

    if (operationCompleted) {
      console.error(`[langfuse] failed to finish ${name} span`, error)
      return operationResult as T
    }

    if (operationStarted) {
      throw error
    }

    console.error(`[langfuse] failed to start ${name} span`, error)
    return await fn()
  }
}

export function withLlmRunTrace<T>(
  trace: LlmRunTraceContext,
  fn: () => Promise<T>,
) {
  return withLangfuseRunSpan('axiia:run', trace, fn)
}

export function withLlmPhaseTrace<T>(
  trace: LlmPhaseTraceContext,
  fn: () => Promise<T>,
) {
  return withLangfuseRunSpan(`axiia:phase:${trace.phase}`, trace, fn)
}

function startOpenAILangfuseSpan(
  observability: LlmObservabilityMetadata,
): LangfuseSpan | null {
  if (!initializeLangfuseTracing()) {
    return null
  }

  try {
    const span = startObservation(observability.generationName, {
      metadata: observability.generationMetadata,
    })

    span.otelSpan.setAttributes(observability.otelAttributes)
    return span
  } catch (error) {
    console.error('[langfuse] failed to start LLM span', error)
    return null
  }
}

function finishOpenAILangfuseSpan(
  span: LangfuseSpan | null,
  attributes?: { level?: 'ERROR'; statusMessage?: string },
) {
  if (!span) {
    return
  }

  if (attributes) {
    try {
      span.update(attributes)
    } catch (error) {
      console.error('[langfuse] failed to update LLM span', error)
    }
  }

  try {
    span.end()
  } catch (error) {
    console.error('[langfuse] failed to end LLM span', error)
  }
}

function getAnthropicModelParameters(
  requestPayload: AnthropicRequestPayload,
): Record<string, number> {
  return {
    max_tokens: requestPayload.max_tokens,
    temperature: requestPayload.temperature,
  }
}

function getAnthropicUsageDetails(
  response: AnthropicResponse,
): Record<string, number> | undefined {
  const promptTokens = response.usage?.input_tokens
  const completionTokens = response.usage?.output_tokens

  if (promptTokens == null && completionTokens == null) {
    return undefined
  }

  return {
    ...(promptTokens != null ? { promptTokens } : {}),
    ...(completionTokens != null ? { completionTokens } : {}),
    ...(promptTokens != null && completionTokens != null
      ? { totalTokens: promptTokens + completionTokens }
      : {}),
  }
}

function startAnthropicLangfuseGeneration(params: {
  observability: LlmObservabilityMetadata
  requestPayload: AnthropicRequestPayload
  trace: ChatCompletionTrace | undefined
}): LangfuseGeneration | null {
  if (!initializeLangfuseTracing()) {
    return null
  }

  try {
    return propagateAttributes(
      getLangfusePropagationAttributes(params.trace, params.observability),
      () => {
        const generation = startObservation(
          params.observability.generationName,
          {
            input: params.requestPayload,
            metadata: params.observability.generationMetadata,
            model: params.requestPayload.model,
            modelParameters: getAnthropicModelParameters(params.requestPayload),
          },
          { asType: 'generation' },
        )

        generation.otelSpan.setAttributes(params.observability.otelAttributes)
        return generation
      },
    )
  } catch (error) {
    console.error('[langfuse] failed to start Anthropic generation', error)
    return null
  }
}

function finishAnthropicLangfuseGeneration(
  generation: LangfuseGeneration | null,
  attributes: LangfuseGenerationAttributes,
) {
  if (!generation) {
    return
  }

  try {
    generation.update(attributes)
  } catch (error) {
    console.error('[langfuse] failed to update Anthropic generation', error)
  }

  try {
    generation.end()
  } catch (error) {
    console.error('[langfuse] failed to end Anthropic generation', error)
  }
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return JSON.stringify({ error: 'Failed to serialize JSON payload' })
  }
}

function extractTokenUsage(responseJson: string | null): {
  promptTokens: number | null
  completionTokens: number | null
} {
  if (!responseJson) {
    return { promptTokens: null, completionTokens: null }
  }

  try {
    const parsed = JSON.parse(responseJson) as {
      usage?: {
        completion_tokens?: number
        input_tokens?: number
        output_tokens?: number
        prompt_tokens?: number
      }
    }
    return {
      promptTokens:
        parsed.usage?.prompt_tokens ?? parsed.usage?.input_tokens ?? null,
      completionTokens:
        parsed.usage?.completion_tokens ?? parsed.usage?.output_tokens ?? null,
    }
  } catch {
    return { promptTokens: null, completionTokens: null }
  }
}

async function persistLlmCall(
  trace: ChatCompletionTrace | undefined,
  record: {
    durationMs: number
    error: string | null
    gatewayProvider: ModelProvider
    langfuse: LangfuseLinkInfo
    model: ModelId
    requestJson: string
    responseContent: string | null
    responseJson: string | null
    source: 'playground' | 'tournament' | null
    underlyingProvider: string
  },
) {
  if (!trace) {
    return
  }

  try {
    const { db } = await getDbModule()
    const { promptTokens, completionTokens } = extractTokenUsage(
      record.responseJson,
    )

    db.insert(llmCalls)
      .values({
        attempt: trace.attempt ?? 1,
        completionTokens,
        durationMs: record.durationMs,
        error: record.error,
        gatewayProvider: record.gatewayProvider,
        langfuseObservationId: record.langfuse.langfuseObservationId,
        langfuseTraceUrl: record.langfuse.langfuseTraceUrl,
        matchId: trace.matchId,
        model: record.model,
        otelSpanId: record.langfuse.otelSpanId,
        otelTraceId: record.langfuse.otelTraceId,
        phase: trace.phase,
        playgroundRunId: trace.playgroundRunId,
        promptTokens,
        provider: record.gatewayProvider,
        purpose: trace.purpose,
        requestJson: record.requestJson,
        responseContent: record.responseContent,
        responseJson: record.responseJson,
        scenarioId: trace.scenarioId ?? null,
        side: trace.side,
        source: record.source,
        turnIndex: trace.turnIndex ?? null,
        underlyingProvider: record.underlyingProvider,
        userId: trace.userId ?? null,
      })
      .run()
  } catch (error) {
    console.error('[llm] failed to persist llm call', error)
  }
}

function buildOpenAICompatibleRequest(params: {
  jsonMode?: boolean
  messages: ChatMessage[]
  model: ModelId
  systemPrompt: string
  temperature?: number
}) {
  const modelDefinition = getModelDefinition(params.model)

  return {
    model: modelDefinition.apiModel,
    messages: [
      { role: 'system' as const, content: params.systemPrompt },
      ...params.messages,
    ],
    response_format: params.jsonMode
      ? { type: 'json_object' as const }
      : undefined,
    temperature: params.temperature ?? 0,
    // Some SiliconFlow models (e.g. Qwen3 thinking variants) require explicitly
    // disabling thinking mode; otherwise the API returns 400.
    ...(modelDefinition.thinking === 'disabled'
      ? { enable_thinking: false }
      : {}),
  }
}

function resolveUrl(baseUrl: string, pathname: string) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return new URL(pathname.replace(/^\/+/, ''), normalizedBase).toString()
}

function buildAnthropicRequest(params: {
  jsonMode?: boolean
  messages: ChatMessage[]
  model: ModelId
  systemPrompt: string
  temperature?: number
}) {
  const modelDefinition = getModelDefinition(params.model)

  return {
    max_tokens: Number.isFinite(ANTHROPIC_MAX_TOKENS)
      ? Math.max(1, ANTHROPIC_MAX_TOKENS)
      : 4096,
    messages: params.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    model: modelDefinition.apiModel,
    system: params.systemPrompt,
    temperature: params.temperature ?? 0,
  }
}

async function callOpenAICompatibleChatCompletion(
  params: {
    model: ModelId
    systemPrompt: string
    messages: ChatMessage[]
    temperature?: number
    jsonMode?: boolean
    signal?: AbortSignal
    trace?: ChatCompletionTrace
  },
  provider: OpenAICompatibleProvider,
) {
  const observability = buildLlmObservabilityMetadata({
    jsonMode: params.jsonMode,
    model: params.model,
    trace: params.trace,
  })
  const requestPayload = buildOpenAICompatibleRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  let langfuseSpan: LangfuseSpan | null = null

  return await withLangfusePropagation(
    params.trace,
    observability,
    async () => {
      langfuseSpan = startOpenAILangfuseSpan(observability)
      const client = getObservedOpenAIClient(
        observability,
        langfuseSpan,
        provider,
      )

      try {
        const response = await client.chat.completions.create(requestPayload, {
          signal: params.signal,
        })

        const content = response.choices[0]?.message?.content

        if (!content) {
          throw new Error('Empty completion response')
        }

        await persistLlmCall(params.trace, {
          durationMs: Date.now() - startedAt,
          error: null,
          gatewayProvider: observability.gatewayProvider,
          langfuse: getLangfuseLinkInfo(langfuseSpan),
          model: params.model,
          requestJson,
          responseContent: content,
          responseJson: safeStringify(response),
          source: observability.source,
          underlyingProvider: observability.underlyingProvider,
        })

        return content
      } catch (error) {
        const durationMs = Date.now() - startedAt

        if (isPlaygroundRunInterruptedError(error) || params.signal?.aborted) {
          const message = getPlaygroundInterruptMessage(params.signal)
          const langfuse = getLangfuseLinkInfo(langfuseSpan)

          finishOpenAILangfuseSpan(langfuseSpan, {
            level: 'ERROR',
            statusMessage: message,
          })
          langfuseSpan = null

          await persistLlmCall(params.trace, {
            durationMs,
            error: message,
            gatewayProvider: observability.gatewayProvider,
            langfuse,
            model: params.model,
            requestJson,
            responseContent: null,
            responseJson: null,
            source: observability.source,
            underlyingProvider: observability.underlyingProvider,
          })

          throw new PlaygroundRunInterruptedError(message)
        }

        if (error instanceof Error) {
          const status =
            'status' in error
              ? String((error as { status?: number }).status ?? 'unknown')
              : 'unknown'
          const providerLabel = provider === 'openai' ? 'OpenAI' : 'SiliconFlow'
          const message = `${providerLabel} request failed (${status}): ${error.message}`
          const langfuse = getLangfuseLinkInfo(langfuseSpan)

          finishOpenAILangfuseSpan(langfuseSpan, {
            level: 'ERROR',
            statusMessage: message,
          })
          langfuseSpan = null

          await persistLlmCall(params.trace, {
            durationMs,
            error: message,
            gatewayProvider: observability.gatewayProvider,
            langfuse,
            model: params.model,
            requestJson,
            responseContent: null,
            responseJson: null,
            source: observability.source,
            underlyingProvider: observability.underlyingProvider,
          })

          throw new Error(message, { cause: error })
        }

        const message = `${provider} request failed (unknown): non-Error thrown`
        const langfuse = getLangfuseLinkInfo(langfuseSpan)

        finishOpenAILangfuseSpan(langfuseSpan, {
          level: 'ERROR',
          statusMessage: message,
        })
        langfuseSpan = null

        await persistLlmCall(params.trace, {
          durationMs,
          error: message,
          gatewayProvider: observability.gatewayProvider,
          langfuse,
          model: params.model,
          requestJson,
          responseContent: null,
          responseJson: null,
          source: observability.source,
          underlyingProvider: observability.underlyingProvider,
        })

        throw error
      } finally {
        finishOpenAILangfuseSpan(langfuseSpan)
      }
    },
  )
}

async function callAnthropicChatCompletion(params: {
  model: ModelId
  systemPrompt: string
  messages: ChatMessage[]
  temperature?: number
  jsonMode?: boolean
  signal?: AbortSignal
  trace?: ChatCompletionTrace
}) {
  const observability = buildLlmObservabilityMetadata({
    jsonMode: params.jsonMode,
    model: params.model,
    trace: params.trace,
  })
  const requestPayload = buildAnthropicRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  const langfuseGeneration = startAnthropicLangfuseGeneration({
    observability,
    requestPayload,
    trace: params.trace,
  })
  let responseText: string | null = null

  try {
    const response = await fetch(
      resolveUrl(ANTHROPIC_BASE_URL, 'v1/messages'),
      {
        method: 'POST',
        headers: {
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
          'x-api-key': getRequiredEnv('ANTHROPIC_API_KEY'),
        },
        body: requestJson,
        signal: params.signal,
      },
    )

    responseText = await response.text()

    if (!response.ok) {
      throw new Error(
        `Anthropic request failed (${response.status}): ${responseText.slice(0, 400)}`,
      )
    }

    const parsed = JSON.parse(responseText) as AnthropicResponse
    const content = parsed.content
      ?.filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')

    if (!content) {
      throw new Error('Empty completion response')
    }

    finishAnthropicLangfuseGeneration(langfuseGeneration, {
      output: content,
      usageDetails: getAnthropicUsageDetails(parsed),
    })

    await persistLlmCall(params.trace, {
      durationMs: Date.now() - startedAt,
      error: null,
      gatewayProvider: observability.gatewayProvider,
      langfuse: getLangfuseLinkInfo(langfuseGeneration),
      model: params.model,
      requestJson,
      responseContent: content,
      responseJson: responseText,
      source: observability.source,
      underlyingProvider: observability.underlyingProvider,
    })

    return content
  } catch (error) {
    const durationMs = Date.now() - startedAt

    if (isPlaygroundRunInterruptedError(error) || params.signal?.aborted) {
      const message = getPlaygroundInterruptMessage(params.signal)

      finishAnthropicLangfuseGeneration(langfuseGeneration, {
        level: 'ERROR',
        output: responseText ?? { error: message },
        statusMessage: message,
      })

      await persistLlmCall(params.trace, {
        durationMs,
        error: message,
        gatewayProvider: observability.gatewayProvider,
        langfuse: getLangfuseLinkInfo(langfuseGeneration),
        model: params.model,
        requestJson,
        responseContent: null,
        responseJson: null,
        source: observability.source,
        underlyingProvider: observability.underlyingProvider,
      })

      throw new PlaygroundRunInterruptedError(message)
    }

    if (error instanceof Error) {
      finishAnthropicLangfuseGeneration(langfuseGeneration, {
        level: 'ERROR',
        output: responseText ?? { error: error.message },
        statusMessage: error.message,
      })

      await persistLlmCall(params.trace, {
        durationMs,
        error: error.message,
        gatewayProvider: observability.gatewayProvider,
        langfuse: getLangfuseLinkInfo(langfuseGeneration),
        model: params.model,
        requestJson,
        responseContent: null,
        responseJson: null,
        source: observability.source,
        underlyingProvider: observability.underlyingProvider,
      })

      throw error
    }

    const message = 'Anthropic request failed (unknown): non-Error thrown'

    finishAnthropicLangfuseGeneration(langfuseGeneration, {
      level: 'ERROR',
      output: responseText ?? { error: message },
      statusMessage: message,
    })

    await persistLlmCall(params.trace, {
      durationMs,
      error: message,
      gatewayProvider: observability.gatewayProvider,
      langfuse: getLangfuseLinkInfo(langfuseGeneration),
      model: params.model,
      requestJson,
      responseContent: null,
      responseJson: null,
      source: observability.source,
      underlyingProvider: observability.underlyingProvider,
    })

    throw error
  }
}

export async function chatCompletion(params: {
  model: ModelId
  systemPrompt: string
  messages: ChatMessage[]
  temperature?: number
  jsonMode?: boolean
  signal?: AbortSignal
  trace?: ChatCompletionTrace
}): Promise<string> {
  const provider = getModelDefinition(params.model).provider

  switch (provider) {
    case 'openai':
      return callOpenAICompatibleChatCompletion(params, 'openai')
    case 'siliconflow':
      return callOpenAICompatibleChatCompletion(params, 'siliconflow')
    case 'anthropic':
      return callAnthropicChatCompletion(params)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
