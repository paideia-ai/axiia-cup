import type OpenAI from 'openai'

import { observeOpenAI, type LangfuseConfig } from '@langfuse/openai'
import { LangfuseSpanProcessor } from '@langfuse/otel'
import { NodeSDK } from '@opentelemetry/sdk-node'

type LangfuseState = {
  enabled: boolean
  initialized: boolean
  sdk: NodeSDK | null
}

const globalLangfuseState = globalThis as typeof globalThis & {
  __axiiaLangfuseState?: LangfuseState
}

function getState() {
  if (!globalLangfuseState.__axiiaLangfuseState) {
    globalLangfuseState.__axiiaLangfuseState = {
      enabled: false,
      initialized: false,
      sdk: null,
    }
  }

  return globalLangfuseState.__axiiaLangfuseState
}

function hasLangfuseConfig() {
  return Boolean(
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_BASE_URL,
  )
}

export function initializeLangfuseTracing() {
  const state = getState()

  if (state.initialized) {
    return state.enabled
  }

  state.initialized = true

  if (!hasLangfuseConfig()) {
    return false
  }

  // The build bakes the git SHA into the image as APP_BUILD_SHA; surface it
  // as the Langfuse release so traces are attributable to a deploy. An
  // explicit LANGFUSE_RELEASE still wins.
  if (!process.env.LANGFUSE_RELEASE && process.env.APP_BUILD_SHA) {
    process.env.LANGFUSE_RELEASE = process.env.APP_BUILD_SHA
  }

  try {
    const sdk = new NodeSDK({
      spanProcessors: [new LangfuseSpanProcessor()],
    })

    void Promise.resolve(sdk.start()).catch((error) => {
      console.error('[langfuse] tracing startup failed', error)
      state.enabled = false
      state.sdk = null
    })

    state.sdk = sdk
    state.enabled = true
    return true
  } catch (error) {
    console.error('[langfuse] tracing init failed', error)
    state.enabled = false
    return false
  }
}

export async function shutdownLangfuseTracing() {
  const state = getState()

  if (!state.sdk) {
    return
  }

  await state.sdk.shutdown()
  state.sdk = null
  state.enabled = false
  state.initialized = false
}

export function observeOpenAIClient(
  client: OpenAI,
  config?: LangfuseConfig,
): OpenAI {
  if (!initializeLangfuseTracing()) {
    return client
  }

  return observeOpenAI(client, config)
}
