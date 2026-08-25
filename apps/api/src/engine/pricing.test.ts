import { describe, expect, it } from 'bun:test'

import {
  computeCallCostCny,
  getModelPricing,
  getModelRatesAt,
  type ModelPricing,
} from '@axiia/shared'

// 峰谷 windows are stated in Beijing time (UTC+8, no DST); pick UTC instants
// and assert which side of the window they land on.
const utc = (hours: number, minutes: number) =>
  new Date(Date.UTC(2026, 6, 17, hours, minutes))

describe('getModelRatesAt', () => {
  const pricing: ModelPricing = {
    inputPer1M: 4,
    outputPer1M: 16,
    offPeak: {
      // 00:30–08:30 Beijing = 16:30–00:30 UTC
      endMinute: 8 * 60 + 30,
      inputPer1M: 2,
      outputPer1M: 8,
      startMinute: 30,
    },
  }

  it('returns peak rates outside the window', () => {
    // 12:00 Beijing
    expect(getModelRatesAt(pricing, utc(4, 0)).inputPer1M).toBe(4)
    // 00:29 Beijing — one minute before the window opens
    expect(getModelRatesAt(pricing, utc(16, 29)).inputPer1M).toBe(4)
    // 08:30 Beijing — window end is exclusive
    expect(getModelRatesAt(pricing, utc(0, 30)).inputPer1M).toBe(4)
  })

  it('returns off-peak rates inside the window', () => {
    // 00:30 Beijing — window start is inclusive
    expect(getModelRatesAt(pricing, utc(16, 30)).inputPer1M).toBe(2)
    // 04:00 Beijing
    expect(getModelRatesAt(pricing, utc(20, 0)).outputPer1M).toBe(8)
    // 08:29 Beijing
    expect(getModelRatesAt(pricing, utc(0, 29)).inputPer1M).toBe(2)
  })

  it('handles windows that wrap midnight', () => {
    const wrapped: ModelPricing = {
      inputPer1M: 4,
      outputPer1M: 16,
      offPeak: {
        // 23:00–01:00 Beijing
        endMinute: 60,
        inputPer1M: 1,
        outputPer1M: 4,
        startMinute: 23 * 60,
      },
    }

    // 23:30 Beijing = 15:30 UTC
    expect(getModelRatesAt(wrapped, utc(15, 30)).inputPer1M).toBe(1)
    // 00:30 Beijing = 16:30 UTC
    expect(getModelRatesAt(wrapped, utc(16, 30)).inputPer1M).toBe(1)
    // 02:00 Beijing = 18:00 UTC
    expect(getModelRatesAt(wrapped, utc(18, 0)).inputPer1M).toBe(4)
  })
})

describe('computeCallCostCny', () => {
  it('returns null for models without a pricing entry', () => {
    expect(
      computeCallCostCny({
        at: utc(4, 0),
        inputTokens: 1000,
        modelId: 'claude-opus-4-6',
        outputTokens: 1000,
      }),
    ).toBeNull()
  })

  it('prices cache-hit tokens at the cache rate as a subset of input', () => {
    const pricing = getModelPricing('deepseek-v4-pro')

    if (!pricing?.cacheHitInputPer1M) {
      throw new Error('deepseek-v4-pro pricing must include a cache-hit rate')
    }

    const cost = computeCallCostCny({
      at: utc(4, 0), // midday Beijing: peak rates
      cachedTokens: 400_000,
      inputTokens: 1_000_000,
      modelId: 'deepseek-v4-pro',
      outputTokens: 0,
    })

    expect(cost).toBeCloseTo(
      0.6 * pricing.inputPer1M + 0.4 * pricing.cacheHitInputPer1M,
      6,
    )
  })

  it('applies the large-input tier from the threshold', () => {
    // glm-5.2: ¥6/1M input below 32K tokens, ¥8/1M at or above.
    const below = computeCallCostCny({
      at: utc(4, 0),
      inputTokens: 31_999,
      modelId: 'glm-5.2',
      outputTokens: 0,
    })
    const above = computeCallCostCny({
      at: utc(4, 0),
      inputTokens: 32_000,
      modelId: 'glm-5.2',
      outputTokens: 0,
    })

    expect(below).toBeCloseTo((31_999 * 6) / 1_000_000, 6)
    expect(above).toBeCloseTo((32_000 * 8) / 1_000_000, 6)
  })

  it('uses the current Beijing list prices for Qwen3.8', () => {
    expect(getModelPricing('qwen3.8-27b')).toEqual({
      cacheHitInputPer1M: 0.6,
      inputPer1M: 3,
      outputPer1M: 12,
    })
    expect(getModelPricing('qwen3.8-max')).toEqual({
      cacheHitInputPer1M: 1.5,
      inputPer1M: 12,
      outputPer1M: 36,
    })
  })

  it('has pricing for every current model with a published direct-API list price', () => {
    for (const modelId of [
      'deepseek-v4-pro',
      'deepseek-v4-flash',
      'deepseek-v3.2',
      'kimi-k2.5',
      'kimi-k2.6',
      'qwen3.6-27b',
      'qwen3.8-27b',
      'qwen3.8-max',
      'minimax-m3',
      'minimax-m2.5',
      'glm-5.1',
      'glm-5.2',
    ] as const) {
      expect(getModelPricing(modelId)).not.toBeNull()
    }
  })

  it('does not guess a domestic direct-API price for GLM-5.3', () => {
    expect(getModelPricing('glm-5.3')).toBeNull()
  })
})
