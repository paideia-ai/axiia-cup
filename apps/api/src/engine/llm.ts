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
} from '@langfuse/tracing'
import OpenAI from 'openai'

import { llmCalls } from '../db/schema'
import { initializeLangfuseTracing } from '../lib/langfuse'
import {
  getPlaygroundInterruptMessage,
  isPlaygroundRunInterruptedError,
  PlaygroundRunInterruptedError,
} from './playground-interrupt'
import {
  buildLangfuseTraceUrl,
  buildLlmObservabilityMetadata,
  type LlmCallTraceContext,
} from './llm-observability'

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

export type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

export type ChatCompletionThinkingMode =
  | 'disabled'
  | 'enabled'
  | 'provider-default'

export type ChatCompletionCapture = {
  apiModel: string
  content: string
  durationMs: number
  firstContentMs: number | null
  provider: ModelProvider
  providerCreatedAt: number | null
  providerResponseId: string | null
  reasoningContentChars: number
  requestJson: string
  responseJson: string
  thinkingMode: ChatCompletionThinkingMode
  thinkingRequestControl: Record<string, unknown> | null
  tokenUsage: ExtractedTokenUsage
  ttftMs: number | null
}

export type ChatCompletionParams = {
  capture?: (capture: ChatCompletionCapture) => void
  jsonMode?: boolean
  messages: ChatMessage[]
  model: ModelId
  signal?: AbortSignal
  systemPrompt: string
  temperature?: number
  thinkingMode?: ChatCompletionThinkingMode
  trace?: ChatCompletionTrace
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
  id?: string
  model?: string
  stop_reason?: string
  usage?: {
    cache_read_input_tokens?: number
    input_tokens?: number
    output_tokens?: number
  }
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

function getLangfuseLinkInfo(
  observation: LangfuseGeneration | null | undefined,
): LangfuseLinkInfo {
  if (!observation) {
    return {
      langfuseObservationId: null,
      langfuseTraceUrl: null,
      otelSpanId: null,
      otelTraceId: null,
    }
  }

  return {
    langfuseObservationId: observation.id,
    langfuseTraceUrl: buildLangfuseTraceUrl(observation.traceId),
    otelSpanId: observation.id,
    otelTraceId: observation.traceId,
  }
}

function getLangfuseGenerationMetadata(
  trace: ChatCompletionTrace | undefined,
  model: ModelId,
  jsonMode?: boolean,
): Record<string, unknown> {
  return buildLlmObservabilityMetadata({ jsonMode, model, trace })
    .generationMetadata
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
  jsonMode?: boolean
  model: ModelId
  modelParameters: Record<string, number>
  trace: ChatCompletionTrace | undefined
}): LangfuseGeneration | null {
  if (!initializeLangfuseTracing()) {
    return null
  }

  try {
    const observability = buildLlmObservabilityMetadata({
      jsonMode: params.jsonMode,
      model: params.model,
      trace: params.trace,
    })

    return propagateAttributes(
      {
        metadata: observability.propagatedMetadata,
        sessionId: observability.sessionId,
        tags: observability.tags,
        traceName: observability.traceName,
        userId:
          params.trace?.userId != null
            ? String(params.trace.userId)
            : undefined,
      },
      () => {
        const generation = startObservation(
          observability.generationName,
          {
            input: params.input,
            metadata: observability.generationMetadata,
            model: params.apiModel,
            modelParameters: params.modelParameters,
          },
          { asType: 'generation' },
        )

        generation.otelSpan.setAttributes(observability.otelAttributes)
        return generation
      },
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

export type ExtractedTokenUsage = {
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

export type StreamTimings = {
  /** ms from request start to the first non-reasoning content token. */
  firstContentMs: number | null
  /** ms from request start to the first streamed token of any kind. */
  ttftMs: number | null
}

export type OpenAIStreamState = StreamTimings & {
  content: string
  finishReason: string | null
  providerCreatedAt: number | null
  providerResponseId: string | null
  reasoning: string
  usage: unknown
}

export function createOpenAIStreamState(): OpenAIStreamState {
  return {
    content: '',
    finishReason: null,
    firstContentMs: null,
    providerCreatedAt: null,
    providerResponseId: null,
    reasoning: '',
    ttftMs: null,
    usage: null,
  }
}

type OpenAIStreamChunk = {
  choices?: Array<{
    delta?: { content?: string | null; reasoning_content?: string | null }
    finish_reason?: string | null
  }>
  created?: number
  id?: string
  usage?: unknown
}

export function foldOpenAIStreamChunk(
  state: OpenAIStreamState,
  chunk: OpenAIStreamChunk,
  elapsedMs: number,
) {
  state.providerResponseId ??= chunk.id ?? null
  state.providerCreatedAt ??= chunk.created ?? null

  if (chunk.usage) {
    state.usage = chunk.usage
  }

  const choice = chunk.choices?.[0]

  if (!choice) {
    return
  }

  if (choice.finish_reason) {
    state.finishReason = choice.finish_reason
  }

  const reasoning = choice.delta?.reasoning_content

  if (reasoning) {
    state.reasoning += reasoning
    state.ttftMs ??= elapsedMs
  }

  const content = choice.delta?.content

  if (content) {
    state.content += content
    state.ttftMs ??= elapsedMs
    state.firstContentMs ??= elapsedMs
  }
}

type AnthropicStreamBlock = { text: string; thinking: string; type: string }

export type AnthropicStreamResult = StreamTimings & {
  response: AnthropicResponse
}

/**
 * Minimal parser for the Anthropic-dialect SSE stream (DeepSeek, MiniMax).
 * Reconstructs a non-streaming-shaped response so raw persistence and usage
 * extraction stay identical to the old path.
 */
export async function readAnthropicStream(
  body: ReadableStream<Uint8Array>,
  elapsed: () => number,
): Promise<AnthropicStreamResult> {
  const decoder = new TextDecoder()
  const blocks: AnthropicStreamBlock[] = []
  const usage: {
    cache_read_input_tokens?: number
    input_tokens?: number
    output_tokens?: number
  } = {}
  let responseId: string | undefined
  let responseModel: string | undefined
  let stopReason: string | undefined
  let ttftMs: number | null = null
  let firstContentMs: number | null = null
  let buffer = ''

  const handleEvent = (payload: string) => {
    const event = JSON.parse(payload) as {
      content_block?: { type?: string }
      delta?: {
        stop_reason?: string
        text?: string
        thinking?: string
        type?: string
      }
      error?: { message?: string; type?: string }
      index?: number
      message?: { id?: string; model?: string; usage?: typeof usage }
      type?: string
      usage?: { output_tokens?: number }
    }

    switch (event.type) {
      case 'message_start': {
        Object.assign(usage, event.message?.usage ?? {})
        responseId = event.message?.id
        responseModel = event.message?.model
        break
      }
      case 'content_block_start': {
        blocks[event.index ?? blocks.length] = {
          text: '',
          thinking: '',
          type: event.content_block?.type ?? 'text',
        }
        break
      }
      case 'content_block_delta': {
        const block = blocks[event.index ?? blocks.length - 1]

        if (!block) {
          break
        }

        if (event.delta?.type === 'thinking_delta' && event.delta.thinking) {
          block.thinking += event.delta.thinking
          ttftMs ??= elapsed()
        }

        if (event.delta?.type === 'text_delta' && event.delta.text) {
          block.text += event.delta.text
          ttftMs ??= elapsed()
          firstContentMs ??= elapsed()
        }

        break
      }
      case 'message_delta': {
        if (event.usage?.output_tokens != null) {
          usage.output_tokens = event.usage.output_tokens
        }

        if (event.delta?.stop_reason) {
          stopReason = event.delta.stop_reason
        }

        break
      }
      case 'error': {
        throw new Error(
          `stream error: ${event.error?.type ?? 'unknown'}: ${event.error?.message ?? payload.slice(0, 200)}`,
        )
      }
      default:
        break
    }
  }

  const reader = body.getReader()

  try {
    for (;;) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      let newlineIndex = buffer.indexOf('\n')

      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim()

          if (payload && payload !== '[DONE]') {
            handleEvent(payload)
          }
        }

        newlineIndex = buffer.indexOf('\n')
      }
    }
  } finally {
    reader.releaseLock()
  }

  return {
    firstContentMs,
    response: {
      content: blocks.map((block) =>
        block.type === 'thinking'
          ? { thinking: block.thinking, type: block.type }
          : { text: block.text, type: block.type },
      ),
      id: responseId,
      model: responseModel,
      stop_reason: stopReason,
      usage,
    },
    ttftMs,
  }
}

async function persistLlmCall(
  trace: ChatCompletionTrace | undefined,
  record: {
    durationMs: number
    error: string | null
    firstContentMs?: number | null
    langfuseGeneration?: LangfuseGeneration | null
    model: ModelId
    provider: ModelProvider
    requestJson: string
    responseContent: string | null
    responseJson: string | null
    ttftMs?: number | null
  },
) {
  const benchmarkOnlyTrace =
    trace?.benchmarkRunId &&
    trace.matchId == null &&
    trace.playgroundRunId == null

  if (
    !trace ||
    benchmarkOnlyTrace ||
    process.env.AXIIA_DISABLE_LLM_CALL_PERSISTENCE === '1'
  ) {
    return
  }

  try {
    const { db } = await getDbModule()
    const observability = buildLlmObservabilityMetadata({
      model: record.model,
      trace,
    })
    const langfuse = getLangfuseLinkInfo(record.langfuseGeneration)
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
        gatewayProvider: observability.gatewayProvider,
        langfuseObservationId: langfuse.langfuseObservationId,
        langfuseTraceUrl: langfuse.langfuseTraceUrl,
        matchId: trace.matchId,
        model: record.model,
        otelSpanId: langfuse.otelSpanId,
        otelTraceId: langfuse.otelTraceId,
        phase: trace.phase,
        playgroundRunId: trace.playgroundRunId,
        promptTokens,
        provider: record.provider,
        reasoningTokens,
        requestJson: record.requestJson,
        responseContent: record.responseContent,
        responseJson: record.responseJson,
        firstContentMs: record.firstContentMs ?? null,
        scenarioId: trace.scenarioId ?? null,
        side: trace.side,
        source: observability.source,
        ttftMs: record.ttftMs ?? null,
        turnIndex: trace.turnIndex ?? null,
        underlyingProvider: observability.underlyingProvider,
        userId: trace.userId ?? null,
      })
      .run()
  } catch (error) {
    console.error('[llm] failed to persist llm call', error)
  }
}

function buildOpenAICompatibleThinkingControl(params: {
  model: ModelId
  thinkingMode?: ChatCompletionThinkingMode
}): {
  enable_thinking?: boolean
  thinking?: { type: 'disabled' | 'enabled' }
} {
  const modelDefinition = getModelDefinition(params.model)
  const thinkingMode = params.thinkingMode ?? 'provider-default'

  if (thinkingMode === 'provider-default') {
    return modelDefinition.thinking === 'disabled'
      ? { enable_thinking: false }
      : {}
  }

  if (modelDefinition.provider === 'zhipu') {
    return { thinking: { type: thinkingMode } }
  }

  if (
    modelDefinition.provider === 'dashscope' ||
    modelDefinition.provider === 'moonshot' ||
    modelDefinition.provider === 'siliconflow'
  ) {
    return { enable_thinking: thinkingMode === 'enabled' }
  }

  throw new Error(
    `Explicit thinking mode is not implemented for ${modelDefinition.provider}/${params.model}`,
  )
}

function extractThinkingRequestControl(
  requestPayload: Record<string, unknown>,
): Record<string, unknown> | null {
  if ('thinking' in requestPayload) {
    return { thinking: requestPayload.thinking }
  }

  if ('enable_thinking' in requestPayload) {
    return { enable_thinking: requestPayload.enable_thinking }
  }

  if ('output_config' in requestPayload) {
    return { output_config: requestPayload.output_config }
  }

  return null
}

export function buildOpenAICompatibleRequest(params: {
  jsonMode?: boolean
  messages: ChatMessage[]
  model: ModelId
  systemPrompt: string
  temperature?: number
  thinkingMode?: ChatCompletionThinkingMode
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
    // Moonshot rejects any temperature other than 1 with HTTP 400 ("invalid
    // temperature: only 1 is allowed for this model"); omit the field so the
    // API applies its forced default.
    ...(modelDefinition.provider === 'moonshot'
      ? {}
      : { temperature: params.temperature ?? 0 }),
    ...buildOpenAICompatibleThinkingControl(params),
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
  params: ChatCompletionParams,
  provider: OpenAICompatibleProvider,
) {
  const client = getOpenAICompatibleClient(provider)
  const requestPayload = buildOpenAICompatibleRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  const langfuseGeneration = startLlmLangfuseGeneration({
    apiModel: requestPayload.model,
    input: requestPayload,
    jsonMode: params.jsonMode,
    model: params.model,
    modelParameters:
      requestPayload.temperature != null
        ? { temperature: requestPayload.temperature }
        : {},
    trace: params.trace,
  })

  try {
    const stream = await client.chat.completions.create(
      {
        ...requestPayload,
        stream: true,
        // Zhipu's dialect emits usage in the final chunk on its own and is
        // the one holdout we have not verified accepts stream_options.
        ...(provider === 'zhipu'
          ? {}
          : { stream_options: { include_usage: true } }),
      },
      { signal: params.signal },
    )

    const state = createOpenAIStreamState()

    for await (const chunk of stream) {
      foldOpenAIStreamChunk(state, chunk, Date.now() - startedAt)
    }

    const content = state.content

    if (!content) {
      throw new Error('Empty completion response')
    }

    // Reconstruct a non-streaming-shaped payload so llm_calls keeps raw-ish
    // provider data and the usage extractor stays dialect-agnostic.
    const responseJson = safeStringify({
      choices: [
        {
          finish_reason: state.finishReason,
          message: {
            content,
            ...(state.reasoning ? { reasoning_content: state.reasoning } : {}),
          },
        },
      ],
      created: state.providerCreatedAt,
      id: state.providerResponseId,
      streamed: true,
      usage: state.usage,
    })
    const tokenUsage = extractTokenUsage(responseJson)

    finishLlmLangfuseGeneration(langfuseGeneration, {
      ...(state.ttftMs != null
        ? { completionStartTime: new Date(startedAt + state.ttftMs) }
        : {}),
      costDetails: toLangfuseCostDetails(params.model, tokenUsage),
      metadata: {
        ...getLangfuseGenerationMetadata(
          params.trace,
          params.model,
          params.jsonMode,
        ),
        firstContentMs: state.firstContentMs,
        ttftMs: state.ttftMs,
      },
      output: state.reasoning
        ? { text: content, thinking: state.reasoning }
        : content,
      usageDetails: toLangfuseUsageDetails(tokenUsage),
    })

    await persistLlmCall(params.trace, {
      durationMs: Date.now() - startedAt,
      error: null,
      firstContentMs: state.firstContentMs,
      langfuseGeneration,
      model: params.model,
      provider,
      requestJson,
      responseContent: content,
      responseJson,
      ttftMs: state.ttftMs,
    })

    params.capture?.({
      apiModel: requestPayload.model,
      content,
      durationMs: Date.now() - startedAt,
      firstContentMs: state.firstContentMs,
      provider,
      providerCreatedAt: state.providerCreatedAt,
      providerResponseId: state.providerResponseId,
      reasoningContentChars: state.reasoning.length,
      requestJson,
      responseJson,
      thinkingMode: params.thinkingMode ?? 'provider-default',
      thinkingRequestControl: extractThinkingRequestControl(
        requestPayload as Record<string, unknown>,
      ),
      tokenUsage,
      ttftMs: state.ttftMs,
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
        langfuseGeneration,
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
        langfuseGeneration,
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
      langfuseGeneration,
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
  params: ChatCompletionParams,
  provider: AnthropicCompatibleProvider,
) {
  const providerConfig = anthropicCompatibleConfigs[provider]
  if (
    params.thinkingMode != null &&
    params.thinkingMode !== 'provider-default'
  ) {
    throw new Error(
      `Explicit thinking mode is not implemented for ${provider}/${params.model}`,
    )
  }
  const requestPayload = buildAnthropicRequest(params)
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()
  const langfuseGeneration = startLlmLangfuseGeneration({
    apiModel: requestPayload.model,
    input: requestPayload,
    jsonMode: params.jsonMode,
    model: params.model,
    modelParameters: getAnthropicModelParameters(requestPayload),
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
        body: safeStringify({ ...requestPayload, stream: true }),
        signal: withRequestTimeout(params.signal),
      },
    )

    if (!response.ok) {
      responseText = await response.text()
      throw new Error(
        `${providerConfig.label} request failed (${response.status}): ${responseText.slice(0, 400)}`,
      )
    }

    if (!response.body) {
      throw new Error(`${providerConfig.label} returned an empty stream body`)
    }

    const streamed = await readAnthropicStream(
      response.body,
      () => Date.now() - startedAt,
    )
    const parsed = streamed.response
    responseText = safeStringify({ ...parsed, streamed: true })

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
      ...(streamed.ttftMs != null
        ? { completionStartTime: new Date(startedAt + streamed.ttftMs) }
        : {}),
      costDetails: toLangfuseCostDetails(params.model, tokenUsage),
      metadata: {
        ...getLangfuseGenerationMetadata(
          params.trace,
          params.model,
          params.jsonMode,
        ),
        firstContentMs: streamed.firstContentMs,
        ttftMs: streamed.ttftMs,
      },
      output: thinking ? { text: content, thinking } : content,
      usageDetails: toLangfuseUsageDetails(tokenUsage),
    })

    await persistLlmCall(params.trace, {
      durationMs: Date.now() - startedAt,
      error: null,
      firstContentMs: streamed.firstContentMs,
      langfuseGeneration,
      model: params.model,
      provider,
      requestJson,
      responseContent: content,
      responseJson: responseText,
      ttftMs: streamed.ttftMs,
    })

    params.capture?.({
      apiModel: requestPayload.model,
      content,
      durationMs: Date.now() - startedAt,
      firstContentMs: streamed.firstContentMs,
      provider,
      providerCreatedAt: null,
      providerResponseId: parsed.id ?? null,
      reasoningContentChars: thinking?.length ?? 0,
      requestJson,
      responseJson: responseText,
      thinkingMode: params.thinkingMode ?? 'provider-default',
      thinkingRequestControl: extractThinkingRequestControl(
        requestPayload as Record<string, unknown>,
      ),
      tokenUsage,
      ttftMs: streamed.ttftMs,
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
        langfuseGeneration,
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
        langfuseGeneration,
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
      langfuseGeneration,
      model: params.model,
      provider,
      requestJson,
      responseContent: null,
      responseJson: null,
    })

    throw error
  }
}

export async function chatCompletion(
  params: ChatCompletionParams,
): Promise<string> {
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
