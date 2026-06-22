import {
  getModelDefinition,
  type ModelId,
  type ModelProvider,
} from '@axiia/shared'
import {
  propagateAttributes,
  startObservation,
  type LangfuseGeneration,
  type LangfuseGenerationAttributes,
  type PropagateAttributesParams,
} from '@langfuse/tracing'
import OpenAI from 'openai'

import type { LlmCallPhase, LlmCallSide } from '../db/schema'
import { llmCalls } from '../db/schema'
import { initializeLangfuseTracing, observeOpenAIClient } from '../lib/langfuse'
import {
  getPlaygroundInterruptMessage,
  isPlaygroundRunInterruptedError,
  PlaygroundRunInterruptedError,
} from './playground-interrupt'

const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1'
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION ?? '2023-06-01'
const ANTHROPIC_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4096)

let _dbModulePromise: Promise<typeof import('../db/client')> | null = null
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

export type ChatCompletionTrace = {
  attempt?: number
  matchId?: number
  phase: LlmCallPhase
  playgroundRunId?: number
  side: LlmCallSide
  turnIndex?: number | null
  userId?: number | null
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

function getLangfuseSessionId(trace: ChatCompletionTrace | undefined) {
  return trace?.matchId != null
    ? `match:${trace.matchId}`
    : trace?.playgroundRunId != null
      ? `playground:${trace.playgroundRunId}`
      : undefined
}

function getLangfuseGenerationName(trace: ChatCompletionTrace | undefined) {
  return trace ? `axiia:${trace.phase}:${trace.side}` : 'axiia:chat'
}

function getLangfuseTags(
  trace: ChatCompletionTrace | undefined,
  model: ModelId,
  provider: ModelProvider,
) {
  return [
    `provider:${provider}`,
    `model:${model}`,
    trace?.phase ? `phase:${trace.phase}` : null,
    trace?.side ? `side:${trace.side}` : null,
  ].filter((value): value is string => value !== null)
}

function getLangfuseGenerationMetadata(
  trace: ChatCompletionTrace | undefined,
  model: ModelId,
  provider: ModelProvider,
): Record<string, unknown> {
  return {
    attempt: trace?.attempt,
    matchId: trace?.matchId,
    modelId: model,
    phase: trace?.phase,
    playgroundRunId: trace?.playgroundRunId,
    provider,
    side: trace?.side,
    turnIndex: trace?.turnIndex ?? null,
  }
}

function getLangfuseTraceAttributes(
  trace: ChatCompletionTrace | undefined,
  model: ModelId,
  provider: ModelProvider,
): PropagateAttributesParams {
  const sessionId = getLangfuseSessionId(trace)

  return {
    sessionId,
    tags: getLangfuseTags(trace, model, provider),
    traceName: sessionId ?? 'axiia:llm',
  }
}

function getObservedOpenAIClient(
  trace: ChatCompletionTrace | undefined,
  model: ModelId,
  provider: OpenAICompatibleProvider,
) {
  const sessionId = getLangfuseSessionId(trace)

  return observeOpenAIClient(getOpenAICompatibleClient(provider), {
    generationMetadata: getLangfuseGenerationMetadata(trace, model, provider),
    generationName: getLangfuseGenerationName(trace),
    sessionId,
    tags: getLangfuseTags(trace, model, provider),
    traceName: sessionId ?? 'axiia:llm',
  })
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
  model: ModelId
  requestPayload: AnthropicRequestPayload
  trace: ChatCompletionTrace | undefined
}): LangfuseGeneration | null {
  if (!initializeLangfuseTracing()) {
    return null
  }

  try {
    const provider: ModelProvider = 'anthropic'

    return propagateAttributes(
      getLangfuseTraceAttributes(params.trace, params.model, provider),
      () =>
        startObservation(
          getLangfuseGenerationName(params.trace),
          {
            input: params.requestPayload,
            metadata: getLangfuseGenerationMetadata(
              params.trace,
              params.model,
              provider,
            ),
            model: params.requestPayload.model,
            modelParameters: getAnthropicModelParameters(params.requestPayload),
          },
          { asType: 'generation' },
        ),
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
    model: ModelId
    provider: ModelProvider
    requestJson: string
    responseContent: string | null
    responseJson: string | null
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
        matchId: trace.matchId,
        model: record.model,
        phase: trace.phase,
        playgroundRunId: trace.playgroundRunId,
        promptTokens,
        provider: record.provider,
        requestJson: record.requestJson,
        responseContent: record.responseContent,
        responseJson: record.responseJson,
        side: trace.side,
        turnIndex: trace.turnIndex ?? null,
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
  const client = getObservedOpenAIClient(params.trace, params.model, provider)
  const requestPayload = buildOpenAICompatibleRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()

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
      model: params.model,
      provider,
      requestJson,
      responseContent: content,
      responseJson: safeStringify(response),
    })

    return content
  } catch (error) {
    const durationMs = Date.now() - startedAt

    if (isPlaygroundRunInterruptedError(error) || params.signal?.aborted) {
      const message = getPlaygroundInterruptMessage(params.signal)

      await persistLlmCall(params.trace, {
        durationMs,
        error: message,
        model: params.model,
        provider,
        requestJson,
        responseContent: null,
        responseJson: null,
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

      await persistLlmCall(params.trace, {
        durationMs,
        error: message,
        model: params.model,
        provider,
        requestJson,
        responseContent: null,
        responseJson: null,
      })

      throw new Error(message, { cause: error })
    }

    const message = `${provider} request failed (unknown): non-Error thrown`

    await persistLlmCall(params.trace, {
      durationMs,
      error: message,
      model: params.model,
      provider,
      requestJson,
      responseContent: null,
      responseJson: null,
    })

    throw error
  }
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
  const provider: ModelProvider = 'anthropic'
  const requestPayload = buildAnthropicRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  const langfuseGeneration = startAnthropicLangfuseGeneration({
    model: params.model,
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
      model: params.model,
      provider,
      requestJson,
      responseContent: content,
      responseJson: responseText,
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
        model: params.model,
        provider,
        requestJson,
        responseContent: null,
        responseJson: null,
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
        model: params.model,
        provider,
        requestJson,
        responseContent: null,
        responseJson: null,
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
      model: params.model,
      provider,
      requestJson,
      responseContent: null,
      responseJson: null,
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
