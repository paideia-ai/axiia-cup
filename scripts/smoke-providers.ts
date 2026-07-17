#!/usr/bin/env bun
/**
 * Per-provider LLM smoke test. One minimal chat call per provider whose API
 * key is present in the environment, using the same request shape as the
 * engine (apps/api/src/engine/llm.ts). Providers without a key are skipped.
 *
 * Run locally:   bun scripts/smoke-providers.ts
 * Run on server (scripts/ is not baked into the api image):
 *   docker cp scripts/smoke-providers.ts deploy-api-1:/tmp/ &&
 *   docker exec deploy-api-1 bun /tmp/smoke-providers.ts
 *
 * Exit code is nonzero if any configured provider fails, so this can back a
 * cron/CI balance-and-key watchdog.
 */

const env = (name: string) => process.env[name]?.trim() || null

type SmokeResult = { detail: string; name: string; ok: boolean; skipped?: true }

const SMOKE_PROMPT = '只回复一个字：好'

async function smokeOpenAICompatible(params: {
  apiKey: string | null
  baseUrl: string
  extraBody?: Record<string, unknown>
  model: string
  name: string
}): Promise<SmokeResult> {
  if (!params.apiKey) {
    return { detail: 'no API key set', name: params.name, ok: true, skipped: true }
  }

  const startedAt = Date.now()
  try {
    const response = await fetch(`${params.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: SMOKE_PROMPT }],
        max_tokens: 512,
        ...params.extraBody,
      }),
      signal: AbortSignal.timeout(60_000),
    })
    const body = await response.text()

    if (!response.ok) {
      return {
        detail: `HTTP ${response.status} ${body.slice(0, 160)}`,
        name: params.name,
        ok: false,
      }
    }

    const content = JSON.parse(body).choices?.[0]?.message?.content ?? ''
    return {
      detail: `${Date.now() - startedAt}ms, ${params.model} said ${JSON.stringify(content.slice(0, 20))}`,
      name: params.name,
      ok: content.length > 0,
    }
  } catch (error) {
    return {
      detail: `fetch failed: ${(error as Error).message}`,
      name: params.name,
      ok: false,
    }
  }
}

async function smokeDeepSeekAnthropic(): Promise<SmokeResult> {
  const apiKey = env('DEEPSEEK_API_KEY')
  if (!apiKey) {
    return { detail: 'no API key set', name: 'deepseek', ok: true, skipped: true }
  }

  const baseUrl = env('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com/anthropic'
  const startedAt = Date.now()
  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        max_tokens: 64,
        thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: SMOKE_PROMPT }],
      }),
      signal: AbortSignal.timeout(60_000),
    })
    const body = await response.text()

    if (!response.ok) {
      return {
        detail: `HTTP ${response.status} ${body.slice(0, 160)}`,
        name: 'deepseek',
        ok: false,
      }
    }

    const text = (JSON.parse(body).content ?? [])
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text?: string }) => block.text ?? '')
      .join('')
    return {
      detail: `${Date.now() - startedAt}ms, deepseek-v4-flash said ${JSON.stringify(text.slice(0, 20))}`,
      name: 'deepseek',
      ok: text.length > 0,
    }
  } catch (error) {
    return {
      detail: `fetch failed: ${(error as Error).message}`,
      name: 'deepseek',
      ok: false,
    }
  }
}

const results = await Promise.all([
  smokeOpenAICompatible({
    apiKey: env('MOONSHOT_API_KEY'),
    baseUrl: env('MOONSHOT_BASE_URL') || 'https://api.moonshot.cn/v1',
    model: 'kimi-k2.6',
    name: 'moonshot',
  }),
  smokeOpenAICompatible({
    apiKey: env('ZHIPU_API_KEY'),
    baseUrl: env('ZHIPU_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-5.2',
    name: 'zhipu',
  }),
  smokeOpenAICompatible({
    apiKey: env('DASHSCOPE_API_KEY'),
    baseUrl:
      env('DASHSCOPE_BASE_URL') ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
    // DashScope rejects non-streaming calls to thinking-capable open models
    // unless thinking is explicitly disabled — mirrors the engine's config
    // for qwen3.6-27b.
    extraBody: { enable_thinking: false },
    model: 'qwen3.6-27b',
    name: 'dashscope',
  }),
  smokeOpenAICompatible({
    apiKey: env('SILICONFLOW_API_KEY'),
    baseUrl: env('SILICONFLOW_BASE_URL') || 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3.2',
    name: 'siliconflow',
  }),
  smokeDeepSeekAnthropic(),
])

let failed = 0
for (const result of results) {
  const status = result.skipped ? 'SKIP' : result.ok ? 'OK  ' : 'FAIL'
  if (!result.ok) failed += 1
  console.log(`${status} ${result.name.padEnd(12)} ${result.detail}`)
}

process.exit(failed > 0 ? 1 : 0)
