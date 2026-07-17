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

// `||` (not `??`): docker-compose passes unset variables through as empty
// strings, which must still fall back to the defaults.
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic'
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || '2023-06-01'
const ANTHROPIC_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4096)
// Thinking tokens count toward max_tokens on Anthropic-compatible APIs, so
// reasoning models need a much larger budget or the visible answer gets
// truncated (observed: DeepSeek effort=max spends >4096 tokens thinking).
const THINKING_MAX_TOKENS = Number(process.env.THINKING_MAX_TOKENS ?? 16_384)
const LLM_REQUEST_TIMEOUT_MS = Number(
  process.env.LLM_REQUEST_TIMEOUT_MS ?? 180_000,
)

let _dbModulePromise: Promise<typeof import('../db/client')> | null = null
let _openAiClients: Partial<Record<OpenAICompatibleProvider, OpenAI>> = {}

initializeLangfuseTracing()

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

type OpenAICompatibleProvider =
  | 'dashscope'
  | 'minimax'
  | 'moonshot'
  | 'openai'
  | 'siliconflow'
  | 'zhipu'

// Each lab's own OpenAI-compatible endpoint. Base URLs are overridable via
// env; verify each default against the vendor docs at cutover time before
// flipping a catalog entry to that provider.
const openAiCompatibleConfigs: Record<
  OpenAICompatibleProvider,
  { apiKeyEnv: string; baseUrl: string; label: string }
> = {
  dashscope: {
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    baseUrl:
      process.env.DASHSCOPE_BASE_URL ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
    label: 'DashScope',
  },
  minimax: {
    apiKeyEnv: 'MINIMAX_API_KEY',
    baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1',
    label: 'MiniMax',
  },
  moonshot: {
    apiKeyEnv: 'MOONSHOT_API_KEY',
    baseUrl: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1',
    label: 'Moonshot',
  },
  openai: {
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    label: 'OpenAI',
  },
  siliconflow: {
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl:
      process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
    label: 'SiliconFlow',
  },
  zhipu: {
    apiKeyEnv: 'ZHIPU_API_KEY',
    baseUrl:
      process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    label: 'Zhipu',
  },
}

type AnthropicCompatibleProvider = 'anthropic' | 'deepseek'

const anthropicCompatibleConfigs: Record<
  AnthropicCompatibleProvider,
  { apiKeyEnv: string; baseUrl: string; label: string }
> = {
  anthropic: {
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    baseUrl: ANTHROPIC_BASE_URL,
    label: 'Anthropic',
  },
  deepseek: {
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseUrl: DEEPSEEK_BASE_URL,
    label: 'DeepSeek',
  },
}

type AnthropicResponse = {
  content?: Array<{ text?: string; thinking?: string; type: string }>
  stop_reason?: string
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

function getOpenAICompatibleClient(provider: OpenAICompatibleProvider) {
  const existing = _openAiClients[provider]

  if (existing) {
    return existing
  }

  const providerConfig = openAiCompatibleConfigs[provider]
  const client = new OpenAI({
    apiKey: getRequiredEnv(providerConfig.apiKeyEnv),
    baseURL: providerConfig.baseUrl,
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
  provider: AnthropicCompatibleProvider
  requestPayload: AnthropicRequestPayload
  trace: ChatCompletionTrace | undefined
}): LangfuseGeneration | null {
  if (!initializeLangfuseTracing()) {
    return null
  }

  try {
    const provider: ModelProvider = params.provider

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

export function buildAnthropicRequest(params: {
  jsonMode?: boolean
  messages: ChatMessage[]
  model: ModelId
  systemPrompt: string
  temperature?: number
}) {
  const modelDefinition = getModelDefinition(params.model)
  const maxTokens = modelDefinition.effort
    ? THINKING_MAX_TOKENS
    : ANTHROPIC_MAX_TOKENS

  return {
    max_tokens: Number.isFinite(maxTokens) ? Math.max(1, maxTokens) : 4096,
    messages: params.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    model: modelDefinition.apiModel,
    system: params.systemPrompt,
    temperature: params.temperature ?? 0,
    // DeepSeek's Anthropic-compatible API exposes reasoning effort via
    // output_config; it only supports 'high' (default) and 'max'.
    ...(modelDefinition.effort
      ? { output_config: { effort: modelDefinition.effort } }
      : {}),
    ...(modelDefinition.thinking === 'disabled'
      ? { thinking: { type: 'disabled' as const } }
      : {}),
  }
}

function withRequestTimeout(signal: AbortSignal | undefined) {
  if (!Number.isFinite(LLM_REQUEST_TIMEOUT_MS) || LLM_REQUEST_TIMEOUT_MS <= 0) {
    return signal
  }

  const timeoutSignal = AbortSignal.timeout(LLM_REQUEST_TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
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
      const providerLabel = openAiCompatibleConfigs[provider].label
      // The OpenAI SDK's message can be as vague as "403 status code (no
      // body)" even when the provider returned a useful JSON body (observed
      // with SiliconFlow's balance-insufficient 30001). Append the parsed
      // error payload when the SDK captured one.
      const serializedBody = safeStringify((error as { error?: unknown }).error)
      const bodyDetail =
        serializedBody &&
        serializedBody !== 'null' &&
        !error.message.includes(serializedBody)
          ? ` ${serializedBody}`
          : ''
      const message = `${providerLabel} request failed (${status}): ${error.message}${bodyDetail}`

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

async function callAnthropicChatCompletion(
  params: {
    model: ModelId
    systemPrompt: string
    messages: ChatMessage[]
    temperature?: number
    jsonMode?: boolean
    signal?: AbortSignal
    trace?: ChatCompletionTrace
  },
  provider: AnthropicCompatibleProvider,
) {
  const providerConfig = anthropicCompatibleConfigs[provider]
  const requestPayload = buildAnthropicRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  const langfuseGeneration = startAnthropicLangfuseGeneration({
    model: params.model,
    provider,
    requestPayload,
    trace: params.trace,
  })
  let responseText: string | null = null

  try {
    const response = await fetch(
      resolveUrl(providerConfig.baseUrl, 'v1/messages'),
      {
        method: 'POST',
        headers: {
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
          'x-api-key': getRequiredEnv(providerConfig.apiKeyEnv),
        },
        body: requestJson,
        signal: withRequestTimeout(params.signal),
      },
    )

    responseText = await response.text()

    if (!response.ok) {
      throw new Error(
        `${providerConfig.label} request failed (${response.status}): ${responseText.slice(0, 400)}`,
      )
    }

    const parsed = JSON.parse(responseText) as AnthropicResponse

    if (parsed.stop_reason === 'max_tokens') {
      throw new Error(
        `${providerConfig.label} response truncated: max_tokens (${requestPayload.max_tokens}) reached before the answer completed`,
      )
    }

    const content = parsed.content
      ?.filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')

    if (!content) {
      throw new Error('Empty completion response')
    }

    // The engine only consumes the text, but the thinking blocks are what
    // you want when debugging a verdict — surface them in the trace.
    const thinking = parsed.content
      ?.filter((block) => block.type === 'thinking' && block.thinking)
      .map((block) => block.thinking ?? '')
      .join('\n')

    finishAnthropicLangfuseGeneration(langfuseGeneration, {
      output: thinking ? { text: content, thinking } : content,
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

    const message = `${providerConfig.label} request failed (unknown): non-Error thrown`

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
    case 'dashscope':
    case 'minimax':
    case 'moonshot':
    case 'openai':
    case 'siliconflow':
    case 'zhipu':
      return callOpenAICompatibleChatCompletion(params, provider)
    case 'anthropic':
      return callAnthropicChatCompletion(params, 'anthropic')
    case 'deepseek':
      return callAnthropicChatCompletion(params, 'deepseek')
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
