import { modelOptions, type ModelId } from '@axiia/shared'
import OpenAI from 'openai'

import type { LlmCallPhase, LlmCallSide } from '../db/schema'
import { llmCalls } from '../db/schema'
import { initializeLangfuseTracing, observeOpenAIClient } from '../lib/langfuse'

const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1'
const LLM_PROVIDER = 'siliconflow'

let _client: OpenAI | null = null
let _dbModulePromise: Promise<typeof import('../db/client')> | null = null

initializeLangfuseTracing()

function getSiliconFlowApiKey() {
  const apiKey = process.env.SILICONFLOW_API_KEY

  if (!apiKey) {
    throw new Error('SILICONFLOW_API_KEY is required')
  }

  return apiKey
}

const SILICONFLOW_API_KEY = getSiliconFlowApiKey()

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

export type ChatCompletionTrace = {
  attempt?: number
  matchId?: number
  phase: LlmCallPhase
  playgroundRunId?: number
  side: LlmCallSide
  turnIndex?: number | null
}

function getClient() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: SILICONFLOW_API_KEY,
      baseURL: SILICONFLOW_BASE_URL,
    })
  }

  return _client
}

function getObservedClient(trace: ChatCompletionTrace | undefined, model: ModelId) {
  const sessionId =
    trace?.matchId != null
      ? `match:${trace.matchId}`
      : trace?.playgroundRunId != null
        ? `playground:${trace.playgroundRunId}`
        : undefined

  return observeOpenAIClient(getClient(), {
    generationMetadata: {
      attempt: trace?.attempt,
      matchId: trace?.matchId,
      modelId: model,
      phase: trace?.phase,
      playgroundRunId: trace?.playgroundRunId,
      provider: LLM_PROVIDER,
      side: trace?.side,
      turnIndex: trace?.turnIndex ?? null,
    },
    generationName: trace ? `axiia:${trace.phase}:${trace.side}` : 'axiia:chat',
    sessionId,
    tags: [
      `provider:${LLM_PROVIDER}`,
      `model:${model}`,
      trace?.phase ? `phase:${trace.phase}` : null,
      trace?.side ? `side:${trace.side}` : null,
    ].filter((value): value is string => value !== null),
    traceName: sessionId ?? 'axiia:llm',
  })
}

function getDbModule() {
  if (!_dbModulePromise) {
    _dbModulePromise = import('../db/client')
  }

  return _dbModulePromise
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return JSON.stringify({ error: 'Failed to serialize JSON payload' })
  }
}

async function persistLlmCall(
  trace: ChatCompletionTrace | undefined,
  record: {
    durationMs: number
    error: string | null
    model: ModelId
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

    db.insert(llmCalls)
      .values({
        attempt: trace.attempt ?? 1,
        durationMs: record.durationMs,
        error: record.error,
        matchId: trace.matchId,
        model: record.model,
        phase: trace.phase,
        playgroundRunId: trace.playgroundRunId,
        provider: LLM_PROVIDER,
        requestJson: record.requestJson,
        responseContent: record.responseContent,
        responseJson: record.responseJson,
        side: trace.side,
        turnIndex: trace.turnIndex ?? null,
      })
      .run()
  } catch (error) {
    console.error('[llm] failed to persist llm call', error)
  }
}

export async function chatCompletion(params: {
  model: ModelId
  systemPrompt: string
  messages: ChatMessage[]
  temperature?: number
  jsonMode?: boolean
  trace?: ChatCompletionTrace
}): Promise<string> {
  const client = getObservedClient(params.trace, params.model)
  const requestPayload = {
    model: modelOptions.find((m) => m.id === params.model)!.apiModel,
    messages: [
      { role: 'system' as const, content: params.systemPrompt },
      ...params.messages,
    ],
    response_format: params.jsonMode
      ? { type: 'json_object' as const }
      : undefined,
    temperature: params.temperature ?? 0,
  }
  const requestJson = safeStringify(requestPayload)
  const startedAt = Date.now()

  try {
    const response = await client.chat.completions.create(requestPayload)

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('Empty completion response')
    }

    await persistLlmCall(params.trace, {
      durationMs: Date.now() - startedAt,
      error: null,
      model: params.model,
      requestJson,
      responseContent: content,
      responseJson: safeStringify(response),
    })

    return content
  } catch (error) {
    const durationMs = Date.now() - startedAt

    if (error instanceof Error) {
      const status =
        'status' in error
          ? String((error as { status?: number }).status ?? 'unknown')
          : 'unknown'
      const message = `SiliconFlow request failed (${status}): ${error.message}`

      await persistLlmCall(params.trace, {
        durationMs,
        error: message,
        model: params.model,
        requestJson,
        responseContent: null,
        responseJson: null,
      })

      throw new Error(message, { cause: error })
    }

    await persistLlmCall(params.trace, {
      durationMs,
      error: 'SiliconFlow request failed (unknown): non-Error thrown',
      model: params.model,
      requestJson,
      responseContent: null,
      responseJson: null,
    })

    throw error
  }
}
