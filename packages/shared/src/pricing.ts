import type { ModelId } from './constants'

// Official list prices for each lab's own API, in CNY per 1M tokens.
// Sources are the labs' pricing pages; keep this table in sync when a lab
// reprices. Models without an entry (legacy SiliconFlow-era ids, OpenAI /
// Anthropic escape hatches) produce a null cost rather than a guess.

export type ModelRates = {
  /** Cache-hit input price; omit when the provider has no prompt caching. */
  cacheHitInputPer1M?: number
  inputPer1M: number
  outputPer1M: number
}

export type ModelPricing = ModelRates & {
  /**
   * Higher rates once the prompt reaches a threshold (Zhipu ≥32K, Qwen3.5
   * ≥128K, MiniMax >512K all tier by input length). Base rates are the
   * smallest tier.
   */
  largeInput?: ModelRates & { fromInputTokens: number }
  /**
   * Off-peak discount window (DeepSeek 峰谷定价). Minutes since midnight
   * Beijing time (labs bill in CST; China has no DST). A window may wrap
   * midnight (start > end). Mutually exclusive with largeInput in practice;
   * when both exist the off-peak rates win inside the window.
   */
  offPeak?: ModelRates & { endMinute: number; startMinute: number }
}

/** Fixed conversion for observability display only (Langfuse shows $). */
export const CNY_PER_USD = 7.25

// Official list prices, accessed 2026-07-17:
// - DeepSeek: api-docs.deepseek.com/zh-cn/quick_start/pricing (flat; the
//   reported V4 峰谷 windows are NOT in official docs yet — add offPeak once
//   the 调价 email/console confirms exact windows).
// - MiniMax: platform.minimaxi.com/docs/guides/pricing-paygo (Standard tier,
//   includes the current 永久五折 discount).
// - Moonshot: platform.kimi.com/docs/pricing/chat-k26 and chat-k25.
// - Zhipu: bigmodel.cn/pricing (domestic CNY, corroborated via third-party
//   mirrors; glm-5.1 assumed identical to glm-5.2 — z.ai lists them the
//   same — unconfirmed domestically).
// - DashScope: alibabacloud.com/help/zh/model-studio/model-pricing
//   Beijing-region prices (USD display converted back to the clean CNY list
//   prices; deepseek-v3.2 lands on exactly ¥2/¥3, validating the rate).
const PRICING_TABLE: Partial<Record<ModelId, ModelPricing>> = {
  'deepseek-v4-pro': {
    cacheHitInputPer1M: 0.025,
    inputPer1M: 3,
    outputPer1M: 6,
  },
  'deepseek-v4-flash': {
    cacheHitInputPer1M: 0.02,
    inputPer1M: 1,
    outputPer1M: 2,
  },
  'deepseek-v3.2': {
    // Aliyun-hosted on Bailian (no prompt caching surfaced there).
    inputPer1M: 2,
    outputPer1M: 3,
  },
  'kimi-k2.6': {
    cacheHitInputPer1M: 1.1,
    inputPer1M: 6.5,
    outputPer1M: 27,
  },
  'kimi-k2.5': {
    cacheHitInputPer1M: 0.7,
    inputPer1M: 4,
    outputPer1M: 21,
  },
  'minimax-m3': {
    cacheHitInputPer1M: 0.42,
    inputPer1M: 2.1,
    largeInput: {
      cacheHitInputPer1M: 0.84,
      fromInputTokens: 512_000,
      inputPer1M: 4.2,
      outputPer1M: 16.8,
    },
    outputPer1M: 8.4,
  },
  'minimax-m2.5': {
    cacheHitInputPer1M: 0.21,
    inputPer1M: 2.1,
    outputPer1M: 8.4,
  },
  'glm-5.2': {
    cacheHitInputPer1M: 1.3,
    inputPer1M: 6,
    largeInput: {
      cacheHitInputPer1M: 2,
      fromInputTokens: 32_000,
      inputPer1M: 8,
      outputPer1M: 28,
    },
    outputPer1M: 24,
  },
  'glm-5.1': {
    cacheHitInputPer1M: 1.3,
    inputPer1M: 6,
    largeInput: {
      cacheHitInputPer1M: 2,
      fromInputTokens: 32_000,
      inputPer1M: 8,
      outputPer1M: 28,
    },
    outputPer1M: 24,
  },
  'qwen3.6-27b': {
    inputPer1M: 3,
    outputPer1M: 18,
  },
  // Pricing keys are catalog ModelIds but rates follow what the lab bills,
  // i.e. the apiModel: catalog 'qwen3.5-397b-a17b' calls qwen3.5-27b
  // upstream, and legacy 'qwen3.5-397b' calls qwen3.5-397b-a17b.
  'qwen3.5-397b-a17b': {
    inputPer1M: 0.625,
    largeInput: {
      fromInputTokens: 128_000,
      inputPer1M: 1.875,
      outputPer1M: 15,
    },
    outputPer1M: 5,
  },
  'qwen3.5-397b': {
    inputPer1M: 1.25,
    largeInput: {
      fromInputTokens: 128_000,
      inputPer1M: 3.125,
      outputPer1M: 18.75,
    },
    outputPer1M: 7.5,
  },
}

export function getModelPricing(modelId: ModelId): ModelPricing | null {
  return PRICING_TABLE[modelId] ?? null
}

function beijingMinuteOfDay(at: Date): number {
  return (at.getUTCHours() * 60 + at.getUTCMinutes() + 8 * 60) % 1440
}

export function getModelRatesAt(pricing: ModelPricing, at: Date): ModelRates {
  if (!pricing.offPeak) {
    return pricing
  }

  const minute = beijingMinuteOfDay(at)
  const { startMinute, endMinute } = pricing.offPeak
  const inWindow =
    startMinute <= endMinute
      ? minute >= startMinute && minute < endMinute
      : minute >= startMinute || minute < endMinute

  return inWindow ? pricing.offPeak : pricing
}

export function computeCallCostCny(params: {
  at: Date
  cachedTokens?: number | null
  inputTokens: number | null
  modelId: ModelId
  outputTokens: number | null
}): number | null {
  const pricing = getModelPricing(params.modelId)

  if (!pricing || (params.inputTokens == null && params.outputTokens == null)) {
    return null
  }

  const inputTokens = params.inputTokens ?? 0
  const outputTokens = params.outputTokens ?? 0
  const tiered =
    pricing.largeInput && inputTokens >= pricing.largeInput.fromInputTokens
      ? { ...pricing, ...pricing.largeInput }
      : pricing
  const rates = getModelRatesAt(tiered, params.at)
  // Cache-hit tokens are treated as a subset of input tokens (the DeepSeek /
  // Moonshot OpenAI-dialect accounting). If a provider reports cache reads
  // outside input_tokens the cost slightly underestimates; refine per
  // provider if observed.
  const cachedTokens = Math.min(params.cachedTokens ?? 0, inputTokens)
  const missTokens = inputTokens - cachedTokens
  const cacheHitRate = rates.cacheHitInputPer1M ?? rates.inputPer1M

  const cost =
    (missTokens * rates.inputPer1M +
      cachedTokens * cacheHitRate +
      outputTokens * rates.outputPer1M) /
    1_000_000

  return Number.isFinite(cost) ? cost : null
}
