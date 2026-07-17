import { describe, expect, it } from 'bun:test'

import { buildAnthropicRequest } from './llm'

describe('buildAnthropicRequest', () => {
  const baseParams = {
    messages: [{ role: 'user' as const, content: '请做出你的裁决。' }],
    systemPrompt: '你是秦孝公。',
  }

  it('maps DeepSeek official models with reasoning effort', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'deepseek-v4-pro-max',
    })

    expect(request.model).toBe('deepseek-v4-pro')
    expect(request.output_config).toEqual({ effort: 'max' })
    expect(request.system).toBe('你是秦孝公。')
    expect(request.temperature).toBe(0)
  })

  it('uses effort high for the high variants', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'deepseek-v4-flash-high',
    })

    expect(request.model).toBe('deepseek-v4-flash')
    expect(request.output_config).toEqual({ effort: 'high' })
  })

  it('omits output_config for models without an effort setting', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'claude-opus-4-6',
    })

    expect(request.model).toBe('claude-opus-4-6')
    expect('output_config' in request).toBe(false)
    expect('thinking' in request).toBe(false)
  })

  it('passes an explicit temperature through', () => {
    const request = buildAnthropicRequest({
      ...baseParams,
      model: 'deepseek-v4-pro-high',
      temperature: 0.7,
    })

    expect(request.temperature).toBe(0.7)
  })
})
