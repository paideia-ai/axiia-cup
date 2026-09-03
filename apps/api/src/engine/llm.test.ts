import { describe, expect, it } from 'bun:test'

import {
  buildAnthropicRequest,
  buildOpenAICompatibleRequest,
  createOpenAIStreamState,
  extractTokenUsage,
  foldOpenAIStreamChunk,
  readAnthropicStream,
  toLangfuseUsageDetails,
} from './llm'

describe('buildAnthropicRequest', () => {
  const baseParams = {
    messages: [{ role: 'user' as const, content: '请做出你的裁决。' }],
    systemPrompt: '你是秦孝公。',
  }

  it('routes DeepSeek models to the official API with effort high', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'deepseek-v4-pro',
    })

    expect(request.model).toBe('deepseek-v4-pro')
    expect(request.output_config).toEqual({ effort: 'high' })
    expect(request.system).toBe('你是秦孝公。')
    expect(request.temperature).toBe(0)
    // Thinking models need headroom beyond the default 4096: reasoning
    // tokens count toward max_tokens and can truncate the visible answer.
    expect(request.max_tokens).toBe(16_384)
  })

  it('routes DeepSeek V4 Flash the same way', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'deepseek-v4-flash',
    })

    expect(request.model).toBe('deepseek-v4-flash')
    expect(request.output_config).toEqual({ effort: 'high' })
    expect(request.max_tokens).toBe(16_384)
  })

  it('gives MiniMax the thinking budget without DeepSeek output_config', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'minimax-m2.5',
    })

    expect(request.model).toBe('MiniMax-M2.5')
    expect('output_config' in request).toBe(false)
    expect('thinking' in request).toBe(false)
    // M2.x always thinks; reasoning tokens count toward max_tokens.
    expect(request.max_tokens).toBe(16_384)
  })

  it('omits output_config for models without an effort setting', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'claude-opus-4-6',
    })

    expect(request.model).toBe('claude-opus-4-6')
    expect('output_config' in request).toBe(false)
    expect('thinking' in request).toBe(false)
    expect(request.max_tokens).toBe(4096)
  })

  it('passes an explicit temperature through', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'deepseek-v4-flash',
      temperature: 0.7,
    })

    expect(request.temperature).toBe(0.7)
  })
})

describe('buildOpenAICompatibleRequest', () => {
  const baseParams = {
    messages: [{ role: 'user' as const, content: '请做出你的裁决。' }],
    systemPrompt: '你是秦孝公。',
  }

  it('omits temperature entirely for Moonshot models', () => {
    // Moonshot's kimi-k2.x endpoint returns HTTP 400 for any temperature
    // other than 1; omitting the field lets the API apply its forced
    // default.
    const request = buildOpenAICompatibleRequest({
      ...baseParams,
      model: 'kimi-k2.6',
      temperature: 0.7,
    })

    expect('temperature' in request).toBe(false)
  })

  it('defaults temperature to 0 for non-Moonshot models', () => {
    const request = buildOpenAICompatibleRequest({
      ...baseParams,
      model: 'qwen3.6-27b',
    })

    expect(request.temperature).toBe(0)
  })

  it('passes an explicit temperature through for non-Moonshot models', () => {
    const request = buildOpenAICompatibleRequest({
      ...baseParams,
      model: 'qwen3.6-27b',
      temperature: 0.7,
    })

    expect(request.temperature).toBe(0.7)
  })

  it('routes the new Qwen models to their exact DashScope model ids with thinking available', () => {
    for (const model of ['qwen3.8-27b', 'qwen3.8-max'] as const) {
      const request = buildOpenAICompatibleRequest({
        ...baseParams,
        jsonMode: true,
        model,
      })

      expect(request.model).toBe(model)
      expect(request.response_format).toEqual({ type: 'json_object' })
      expect(request.temperature).toBe(0)
      expect('enable_thinking' in request).toBe(false)
    }
  })

  it('routes GLM-5.3 to the Zhipu model id without trying to disable required thinking', () => {
    const request = buildOpenAICompatibleRequest({
      ...baseParams,
      jsonMode: true,
      model: 'glm-5.3',
    })

    expect(request.model).toBe('glm-5.3')
    expect(request.response_format).toEqual({ type: 'json_object' })
    expect(request.temperature).toBe(0)
    expect('enable_thinking' in request).toBe(false)
  })
})

describe('extractTokenUsage', () => {
  it('treats OpenAI-dialect prompt_tokens as cache-inclusive', () => {
    const usage = extractTokenUsage(
      JSON.stringify({
        usage: {
          completion_tokens: 100,
          prompt_cache_hit_tokens: 800,
          prompt_tokens: 1000,
        },
      }),
    )

    expect(usage.promptTokens).toBe(1000)
    expect(usage.cachedTokens).toBe(800)
  })

  it('normalizes Anthropic-dialect input_tokens, which exclude cache reads', () => {
    // Observed on DeepSeek's Anthropic endpoint: input_tokens 124 with
    // cache_read_input_tokens 2048 — the full prompt is the sum.
    const usage = extractTokenUsage(
      JSON.stringify({
        usage: {
          cache_read_input_tokens: 2048,
          input_tokens: 124,
          output_tokens: 215,
        },
      }),
    )

    expect(usage.promptTokens).toBe(2172)
    expect(usage.cachedTokens).toBe(2048)
    expect(usage.completionTokens).toBe(215)
  })
})

describe('toLangfuseUsageDetails', () => {
  it('uses the input/output/total keys Langfuse buckets by', () => {
    expect(
      toLangfuseUsageDetails({
        cachedTokens: null,
        completionTokens: 97,
        promptTokens: 167,
        reasoningTokens: null,
      }),
    ).toEqual({ input: 167, output: 97, total: 264 })
  })

  it('carves cached and reasoning tokens out of the base buckets', () => {
    // Buckets must be mutually exclusive or Langfuse double-counts the
    // total (the original promptTokens/completionTokens bug, reborn).
    expect(
      toLangfuseUsageDetails({
        cachedTokens: 100,
        completionTokens: 300,
        promptTokens: 1000,
        reasoningTokens: 120,
      }),
    ).toEqual({
      input: 900,
      input_cached_tokens: 100,
      output: 180,
      output_reasoning_tokens: 120,
      total: 1300,
    })
  })

  it('returns undefined when the provider reported no usage', () => {
    expect(
      toLangfuseUsageDetails({
        cachedTokens: null,
        completionTokens: null,
        promptTokens: null,
        reasoningTokens: null,
      }),
    ).toBeUndefined()
  })
})

describe('foldOpenAIStreamChunk', () => {
  it('accumulates content and captures both latency marks', () => {
    const state = createOpenAIStreamState()

    foldOpenAIStreamChunk(
      state,
      { choices: [{ delta: { reasoning_content: '先想' } }] },
      120,
    )
    foldOpenAIStreamChunk(
      state,
      { choices: [{ delta: { reasoning_content: '一想' } }] },
      150,
    )
    foldOpenAIStreamChunk(
      state,
      { choices: [{ delta: { content: '好' } }] },
      900,
    )
    foldOpenAIStreamChunk(
      state,
      { choices: [{ delta: { content: '的' }, finish_reason: 'stop' }] },
      950,
    )
    foldOpenAIStreamChunk(state, { usage: { prompt_tokens: 10 } }, 960)

    expect(state.content).toBe('好的')
    expect(state.reasoning).toBe('先想一想')
    expect(state.ttftMs).toBe(120)
    expect(state.firstContentMs).toBe(900)
    expect(state.finishReason).toBe('stop')
    expect(state.usage).toEqual({ prompt_tokens: 10 })
  })

  it('marks ttft and first content together for non-thinking models', () => {
    const state = createOpenAIStreamState()

    foldOpenAIStreamChunk(state, { choices: [{ delta: { content: 'A' } }] }, 80)

    expect(state.ttftMs).toBe(80)
    expect(state.firstContentMs).toBe(80)
  })
})

function sseBody(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event))
      }

      controller.close()
    },
  })
}

describe('readAnthropicStream', () => {
  it('reconstructs blocks, usage, and latency from the event stream', async () => {
    let tick = 0
    const clock = () => {
      tick += 100
      return tick
    }

    const result = await readAnthropicStream(
      sseBody([
        'event: message_start\n',
        'data: {"type":"message_start","message":{"usage":{"input_tokens":124,"cache_read_input_tokens":2048}}}\n\n',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"thinking"}}\n\n',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"推理"}}\n\n',
        // Chunk boundary splitting a data line must not break parsing.
        'data: {"type":"content_block_start","index":1,"content_bl',
        'ock":{"type":"text"}}\n\n',
        'data: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"裁决"}}\n\n',
        'data: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"如下"}}\n\n',
        'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":215}}\n\n',
        'data: {"type":"message_stop"}\n\n',
      ]),
      clock,
    )

    expect(result.response.content).toEqual([
      { thinking: '推理', type: 'thinking' },
      { text: '裁决如下', type: 'text' },
    ])
    expect(result.response.stop_reason).toBe('end_turn')
    expect(result.response.usage).toEqual({
      cache_read_input_tokens: 2048,
      input_tokens: 124,
      output_tokens: 215,
    })
    // First delta of any kind was the thinking delta; first content came
    // later.
    expect(result.ttftMs).not.toBeNull()
    expect(result.firstContentMs).not.toBeNull()
    expect(result.firstContentMs).toBeGreaterThan(result.ttftMs ?? 0)
  })

  it('throws on an error event', async () => {
    await expect(
      readAnthropicStream(
        sseBody([
          'data: {"type":"error","error":{"type":"overloaded_error","message":"服务繁忙"}}\n\n',
        ]),
        () => 1,
      ),
    ).rejects.toThrow('overloaded_error')
  })
})
