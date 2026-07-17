import {
  CNY_PER_USD,
  computeCallCostCny,
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
import { initializeLangfuseTracing } from '../lib/langfuse'
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

type AnthropicCompatibleProvider = 'anthropic' | 'deepseek' | 'minimax'

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
  // MiniMax recommends their Anthropic-compatible endpoint over the OpenAI
  // one; M2.x thinking arrives as typed thinking blocks there.
  minimax: {
    apiKeyEnv: 'MINIMAX_API_KEY',
    baseUrl:
      process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/anthropic',
    label: 'MiniMax',
  },
}

type AnthropicResponse = {
  content?: Array<{ text?: string; thinking?: string; type: string }>
  stop_reason?: string
  usage?: {
    cache_read_input_tokens?: number
    input_tokens?: number
    output_tokens?: number
  }
}

type AnthropicRequestPayload = ReturnType<typeof buildAnthropicRequest>

export type ChatCompletionTrace = {
  attempt?: number
  matchId?: number
  phase: LlmCallPhase
  playgroundRunId?: number
  scenarioId?: string
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
    trace?.scenarioId ? `scenario:${trace.scenarioId}` : null,
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
    scenarioId: trace?.scenarioId ?? null,
    side: trace?.side,
    turnIndex: trace?.turnIndex ?? null,
    userId: trace?.userId ?? null,
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
    userId: trace?.userId != null ? String(trace.userId) : undefined,
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

// Langfuse buckets usage under flat, MUTUALLY EXCLUSIVE keys. Keys
// containing "input"/"output" group into the UI's input/output totals, and
// anything else lands in "Other" and double-counts the total — so cached and
// reasoning tokens are carved OUT of the base buckets, not repeated beside
// them.
export function toLangfuseUsageDetails(
  usage: ExtractedTokenUsage,
): Record<string, number> | undefined {
  const prompt = usage.promptTokens
  const completion = usage.completionTokens

  if (prompt == null && completion == null) {
    return undefined
  }

  const cached = Math.min(usage.cachedTokens ?? 0, prompt ?? 0)
  const reasoning = Math.min(usage.reasoningTokens ?? 0, completion ?? 0)

  return {
    ...(prompt != null ? { input: prompt - cached } : {}),
    ...(cached > 0 ? { input_cached_tokens: cached } : {}),
    ...(completion != null ? { output: completion - reasoning } : {}),
    ...(reasoning > 0 ? { output_reasoning_tokens: reasoning } : {}),
    ...(prompt != null && completion != null
      ? { total: prompt + completion }
      : {}),
  }
}

function toLangfuseCostDetails(
  model: ModelId,
  usage: ExtractedTokenUsage,
): Record<string, number> | undefined {
  const costCny = computeCallCostCny({
    at: new Date(),
    cachedTokens: usage.cachedTokens,
    inputTokens: usage.promptTokens,
    modelId: model,
    outputTokens: usage.completionTokens,
  })

  if (costCny == null) {
    return undefined
  }

  // Langfuse displays costs as USD; the CNY source of truth lives in
  // llm_calls.cost_cny.
  return { total: costCny / CNY_PER_USD }
}

function startLlmLangfuseGeneration(params: {
  apiModel: string
  input: unknown
  model: ModelId
  modelParameters: Record<string, number>
  provider: ModelProvider
  trace: ChatCompletionTrace | undefined
}): LangfuseGeneration | null {
  if (!initializeLangfuseTracing()) {
    return null
  }

  try {
    return propagateAttributes(
      getLangfuseTraceAttributes(params.trace, params.model, params.provider),
      () =>
        startObservation(
          getLangfuseGenerationName(params.trace),
          {
            input: params.input,
            metadata: getLangfuseGenerationMetadata(
              params.trace,
              params.model,
              params.provider,
            ),
            model: params.apiModel,
            modelParameters: params.modelParameters,
          },
          { asType: 'generation' },
        ),
    )
  } catch (error) {
    console.error('[langfuse] failed to start generation', error)
    return null
  }
}

function finishLlmLangfuseGeneration(
  generation: LangfuseGeneration | null,
  attributes: LangfuseGenerationAttributes,
) {
  if (!generation) {
    return
  }

  try {
    generation.update(attributes)
  } catch (error) {
    console.error('[langfuse] failed to update generation', error)
  }

  try {
    generation.end()
  } catch (error) {
    console.error('[langfuse] failed to end generation', error)
  }
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return JSON.stringify({ error: 'Failed to serialize JSON payload' })
  }
}

type ExtractedTokenUsage = {
  cachedTokens: number | null
  completionTokens: number | null
  promptTokens: number | null
  reasoningTokens: number | null
}

const emptyTokenUsage: ExtractedTokenUsage = {
  cachedTokens: null,
  completionTokens: null,
  promptTokens: null,
  reasoningTokens: null,
}

export function extractTokenUsage(
  responseJson: string | null,
): ExtractedTokenUsage {
  if (!responseJson) {
    return emptyTokenUsage
  }

  try {
    const parsed = JSON.parse(responseJson) as {
      usage?: {
        // Anthropic-dialect cache accounting (DeepSeek, MiniMax)
        cache_read_input_tokens?: number
        completion_tokens?: number
        // OpenAI-dialect reasoning/cache splits (DashScope, Moonshot, Zhipu)
        completion_tokens_details?: { reasoning_tokens?: number }
        input_tokens?: number
        output_tokens?: number
        // DeepSeek OpenAI-dialect cache accounting
        prompt_cache_hit_tokens?: number
        prompt_tokens?: number
        prompt_tokens_details?: { cached_tokens?: number }
      }
    }
    const usage = parsed.usage
    const cachedTokens =
      usage?.prompt_tokens_details?.cached_tokens ??
      usage?.prompt_cache_hit_tokens ??
      usage?.cache_read_input_tokens ??
      null
    // OpenAI-dialect prompt_tokens includes cache hits; Anthropic-dialect
    // input_tokens EXCLUDES cache reads (observed: DeepSeek returns
    // input_tokens 124 with cache_read_input_tokens 2048). Normalize
    // promptTokens to the full prompt so downstream cost math and Langfuse
    // buckets can always treat cached as a subset.
    const promptTokens =
      usage?.prompt_tokens ??
      (usage?.input_tokens != null
        ? usage.input_tokens + (usage.cache_read_input_tokens ?? 0)
        : null)

    return {
      cachedTokens,
      completionTokens:
        usage?.completion_tokens ?? usage?.output_tokens ?? null,
      promptTokens,
      reasoningTokens:
        usage?.completion_tokens_details?.reasoning_tokens ?? null,
    }
  } catch {
    return emptyTokenUsage
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
    const { promptTokens, completionTokens, cachedTokens, reasoningTokens } =
      extractTokenUsage(record.responseJson)
    const costCny = computeCallCostCny({
      at: new Date(),
      cachedTokens,
      inputTokens: promptTokens,
      modelId: record.model,
      outputTokens: completionTokens,
    })

    db.insert(llmCalls)
      .values({
        attempt: trace.attempt ?? 1,
        cachedTokens,
        completionTokens,
        costCny,
        durationMs: record.durationMs,
        error: record.error,
        matchId: trace.matchId,
        model: record.model,
        phase: trace.phase,
        playgroundRunId: trace.playgroundRunId,
        promptTokens,
        provider: record.provider,
        reasoningTokens,
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
  // Models that always think (DeepSeek with effort set, MiniMax M2.x with
  // interleaved thinking) spend reasoning tokens inside max_tokens; give them
  // the larger budget or the visible answer gets truncated.
  const alwaysThinks =
    modelDefinition.effort != null || modelDefinition.provider === 'minimax'
  const maxTokens = alwaysThinks ? THINKING_MAX_TOKENS : ANTHROPIC_MAX_TOKENS

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
  const client = getOpenAICompatibleClient(provider)
  const requestPayload = buildOpenAICompatibleRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  const langfuseGeneration = startLlmLangfuseGeneration({
    apiModel: requestPayload.model,
    input: requestPayload,
    model: params.model,
    modelParameters: { temperature: requestPayload.temperature },
    provider,
    trace: params.trace,
  })

  try {
    const response = await client.chat.completions.create(requestPayload, {
      signal: params.signal,
    })

    const message = response.choices[0]?.message
    const content = message?.content

    if (!content) {
      throw new Error('Empty completion response')
    }

    const responseJson = safeStringify(response)
    const tokenUsage = extractTokenUsage(responseJson)
    // Zhipu / DashScope surface thinking as reasoning_content on the message.
    const reasoning = (message as { reasoning_content?: string })
      .reasoning_content

    finishLlmLangfuseGeneration(langfuseGeneration, {
      costDetails: toLangfuseCostDetails(params.model, tokenUsage),
      output: reasoning ? { text: content, thinking: reasoning } : content,
      usageDetails: toLangfuseUsageDetails(tokenUsage),
    })

    await persistLlmCall(params.trace, {
      durationMs: Date.now() - startedAt,
      error: null,
      model: params.model,
      provider,
      requestJson,
      responseContent: content,
      responseJson,
    })

    return content
  } catch (error) {
    const durationMs = Date.now() - startedAt

    if (isPlaygroundRunInterruptedError(error) || params.signal?.aborted) {
      const message = getPlaygroundInterruptMessage(params.signal)

      finishLlmLangfuseGeneration(langfuseGeneration, {
        level: 'ERROR',
        output: { error: message },
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

      finishLlmLangfuseGeneration(langfuseGeneration, {
        level: 'ERROR',
        output: { error: message },
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

      throw new Error(message, { cause: error })
    }

    const message = `${provider} request failed (unknown): non-Error thrown`

    finishLlmLangfuseGeneration(langfuseGeneration, {
      level: 'ERROR',
      output: { error: message },
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
  const langfuseGeneration = startLlmLangfuseGeneration({
    apiModel: requestPayload.model,
    input: requestPayload,
    model: params.model,
    modelParameters: getAnthropicModelParameters(requestPayload),
    provider,
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

    const tokenUsage = extractTokenUsage(responseText)

    finishLlmLangfuseGeneration(langfuseGeneration, {
      costDetails: toLangfuseCostDetails(params.model, tokenUsage),
      output: thinking ? { text: content, thinking } : content,
      usageDetails: toLangfuseUsageDetails(tokenUsage),
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

      finishLlmLangfuseGeneration(langfuseGeneration, {
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
      finishLlmLangfuseGeneration(langfuseGeneration, {
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

    finishLlmLangfuseGeneration(langfuseGeneration, {
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
    case 'moonshot':
    case 'openai':
    case 'siliconflow':
    case 'zhipu':
      return callOpenAICompatibleChatCompletion(params, provider)
    case 'anthropic':
      return callAnthropicChatCompletion(params, 'anthropic')
    case 'deepseek':
      return callAnthropicChatCompletion(params, 'deepseek')
    case 'minimax':
      return callAnthropicChatCompletion(params, 'minimax')
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
