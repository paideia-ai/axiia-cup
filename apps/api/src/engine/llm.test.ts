import { describe, expect, it } from 'bun:test'

import { buildAnthropicRequest } from './llm'

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
