import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { scorerOutputSchema } from '../packages/shared/src/schemas'

const JSON_PROMPT_SENTENCE =
  '输出必须是可被 JSON.parse 直接解析的合法 JSON；reasoning 内引用内容请用「」或单引号，禁止未转义英文双引号。'

const DEFAULT_CASE_LIMIT = 10
const DEFAULT_BATTLE_LIMIT = 200
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION ?? '2023-06-01'
const ANTHROPIC_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4096)
const REQUEST_TIMEOUT_MS = Number(process.env.BENCH_REQUEST_TIMEOUT_MS ?? 60_000)

type Provider = 'anthropic' | 'openai' | 'siliconflow'
type Currency = 'CNY' | 'USD'

type ChatMessage = {
  content: string
  role: 'assistant' | 'user'
}

type ModelConfig = {
  apiModel: string
  currency: Currency
  inputPricePerMillion: number
  label: string
  outputPricePerMillion: number
  provider: Provider
  repoModelId: string | null
  settingsLabel: string
  omitTemperature?: boolean
  useAnthropicLowEffort?: boolean
  useOpenAiLowReasoning?: boolean
  useSiliconFlowThinkingOff?: boolean
}

type BattleSummary = {
  error?: string | null
  id: number
  scenarioId: string
  source: 'playground' | 'tournament'
  status: string
}

type LlmCallExport = {
  attempt?: number | null
  completionTokens?: number | null
  durationMs?: number | null
  error?: string | null
  id?: number
  model?: string
  phase?: string
  promptTokens?: number | null
  provider?: string
  requestJson?: unknown
  responseContent?: string | null
  responseJson?: unknown
  side?: string
}

type BattleExport = {
  kind: string
  llmCalls: LlmCallExport[]
  match?: { scenarioId?: string }
  run?: { scenarioId?: string }
  scenario?: { id?: string; title?: string }
  summary?: BattleSummary | null
}

type BenchCase = {
  battleError: string | null
  battleId: number
  errorToken: string | null
  messages: ChatMessage[]
  scenarioId: string
  scenarioTitle: string | null
  source: 'playground' | 'tournament'
  systemPrompt: string
}

type BenchCaseSummary = Omit<BenchCase, 'messages' | 'systemPrompt'> & {
  messageCount: number
  systemPromptChars: number
}

type ProviderCallResult = {
  completionTokens: number | null
  content: string | null
  error: string | null
  promptTokens: number | null
  requestBody: unknown
  responseJson: unknown
  status: number | null
}

type BenchResult = {
  battleError: string | null
  battleId: number
  completionTokens: number | null
  cost: number | null
  currency: Currency
  durationMs: number
  error: string | null
  errorClass: string | null
  errorToken: string | null
  jsonParseOk: boolean
  model: string
  parseError: string | null
  promptTokens: number | null
  provider: Provider
  rawContentPreview: string | null
  scenarioId: string
  schemaError: string | null
  schemaOk: boolean
  scoreA: number | null
  scoreB: number | null
  settingsLabel: string
  source: 'playground' | 'tournament'
  status: number | null
}

type BenchmarkReport = {
  cases: BenchCaseSummary[]
  generatedAt: string
  models: Array<
    Pick<
      ModelConfig,
      | 'apiModel'
      | 'currency'
      | 'inputPricePerMillion'
      | 'label'
      | 'outputPricePerMillion'
      | 'provider'
      | 'repoModelId'
      | 'settingsLabel'
    >
  >
  options: {
    battleLimit: number
    caseLimit: number
    dryRun: boolean
    includeCases?: string[]
    models: string[]
  }
  results: BenchResult[]
  summary: ModelSummary[]
}

type ModelSummary = {
  avgDurationMs: number | null
  avgOutputTokens: number | null
  avgPromptTokens: number | null
  currency: Currency
  estimatedCost: number
  jsonParseRate: number
  maxDurationMs: number | null
  medianDurationMs: number | null
  model: string
  p90DurationMs: number | null
  providerErrorCount: number
  schemaRate: number
  total: number
}

type CorrectnessReport = {
  generatedAt: string
  input: string
  results: Array<{
    battleId: number
    expectedScoreA: number
    expectedScoreB: number
    model: string
    scenarioId: string
    scoreA: number | null
    scoreB: number | null
    scoreCorrect: boolean
    scoreDeltaA: number | null
    scoreDeltaB: number | null
    source: 'playground' | 'tournament'
  }>
  summary: Array<{
    avgAbsDelta: number | null
    correct: number
    model: string
    scoreCorrectRate: number
    total: number
  }>
}

const modelConfigs: ModelConfig[] = [
  {
    apiModel: 'Qwen/Qwen3.6-27B',
    currency: 'CNY',
    inputPricePerMillion: 0.6,
    label: 'Qwen3.6 27B',
    outputPricePerMillion: 4.8,
    provider: 'siliconflow',
    repoModelId: 'qwen3.6-27b',
    settingsLabel:
      'response_format=json_object; temperature=0; enable_thinking=false',
    useSiliconFlowThinkingOff: true,
  },
  {
    apiModel: 'Pro/zai-org/GLM-5.1',
    currency: 'CNY',
    inputPricePerMillion: 6,
    label: 'GLM-5.1',
    outputPricePerMillion: 24,
    provider: 'siliconflow',
    repoModelId: 'glm-5.1',
    settingsLabel: 'response_format=json_object; temperature=0',
  },
  {
    apiModel: 'deepseek-ai/DeepSeek-V4-Flash',
    currency: 'CNY',
    inputPricePerMillion: 1,
    label: 'DeepSeek V4 Flash',
    outputPricePerMillion: 2,
    provider: 'siliconflow',
    repoModelId: 'deepseek-v4-flash',
    settingsLabel: 'response_format=json_object; temperature=0',
  },
  {
    apiModel: 'deepseek-ai/DeepSeek-V4-Pro',
    currency: 'CNY',
    inputPricePerMillion: 3,
    label: 'DeepSeek V4 Pro',
    outputPricePerMillion: 6,
    provider: 'siliconflow',
    repoModelId: 'deepseek-v4-pro',
    settingsLabel: 'response_format=json_object; temperature=0',
  },
  {
    apiModel: 'gpt-5.4',
    currency: 'USD',
    inputPricePerMillion: 2.5,
    label: 'GPT-5.4',
    outputPricePerMillion: 15,
    provider: 'openai',
    repoModelId: 'gpt-5.4',
    settingsLabel:
      'response_format=json_object; default temperature; reasoning_effort=low',
    omitTemperature: true,
    useOpenAiLowReasoning: true,
  },
  {
    apiModel: 'gpt-5.4-mini',
    currency: 'USD',
    inputPricePerMillion: 0.75,
    label: 'GPT-5.4 mini',
    outputPricePerMillion: 4.5,
    provider: 'openai',
    repoModelId: 'gpt-5.4-mini',
    settingsLabel:
      'response_format=json_object; default temperature; reasoning_effort=low',
    omitTemperature: true,
    useOpenAiLowReasoning: true,
  },
  {
    apiModel: 'gpt-4.1',
    currency: 'USD',
    inputPricePerMillion: 2,
    label: 'GPT-4.1',
    outputPricePerMillion: 8,
    provider: 'openai',
    repoModelId: 'gpt-4.1',
    settingsLabel: 'response_format=json_object; temperature=0',
  },
  {
    apiModel: 'claude-sonnet-4-5',
    currency: 'USD',
    inputPricePerMillion: 3,
    label: 'Claude Sonnet 4.5',
    outputPricePerMillion: 15,
    provider: 'anthropic',
    repoModelId: 'claude-sonnet-4-5',
    settingsLabel: 'prompt-only JSON; temperature=0',
  },
  {
    apiModel: 'claude-opus-4-5-20251101',
    currency: 'USD',
    inputPricePerMillion: 5,
    label: 'Claude Opus 4.5',
    outputPricePerMillion: 25,
    provider: 'anthropic',
    repoModelId: 'claude-opus-4-5',
    settingsLabel: 'prompt-only JSON; temperature=0',
  },
  {
    apiModel: 'claude-opus-4-8',
    currency: 'USD',
    inputPricePerMillion: 5,
    label: 'Claude Opus 4.8',
    outputPricePerMillion: 25,
    provider: 'anthropic',
    repoModelId: null,
    settingsLabel:
      'prompt-only JSON; thinking=adaptive; output_config.effort=low; no sampling params',
    useAnthropicLowEffort: true,
  },
  {
    apiModel: 'claude-opus-4-7',
    currency: 'USD',
    inputPricePerMillion: 5,
    label: 'Claude Opus 4.7',
    outputPricePerMillion: 25,
    provider: 'anthropic',
    repoModelId: null,
    settingsLabel:
      'prompt-only JSON; thinking=adaptive; output_config.effort=low; no sampling params',
    useAnthropicLowEffort: true,
  },
]

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function getOptionalEnv(name: string) {
  const value = process.env[name]
  return value && value.trim() ? value : null
}

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {
    battleLimit: DEFAULT_BATTLE_LIMIT,
    caseLimit: DEFAULT_CASE_LIMIT,
    dryRun: false,
    excludeCases: [] as string[],
    correctnessResults: '',
    mergeResults: [] as string[],
    includeCases: [] as string[],
    models: [] as string[],
    outputDir: '',
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      result.dryRun = true
      continue
    }

    if (arg === '--case-limit') {
      result.caseLimit = Number(args[index + 1])
      index += 1
      continue
    }

    if (arg === '--battle-limit') {
      result.battleLimit = Number(args[index + 1])
      index += 1
      continue
    }

    if (arg === '--output-dir') {
      result.outputDir = args[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg === '--models') {
      result.models = (args[index + 1] ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--exclude-cases') {
      result.excludeCases = (args[index + 1] ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--include-cases') {
      result.includeCases = (args[index + 1] ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--merge-results') {
      result.mergeResults = (args[index + 1] ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--correctness-results') {
      result.correctnessResults = args[index + 1] ?? ''
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!Number.isInteger(result.caseLimit) || result.caseLimit <= 0) {
    throw new Error('--case-limit must be a positive integer')
  }

  if (!Number.isInteger(result.battleLimit) || result.battleLimit <= 0) {
    throw new Error('--battle-limit must be a positive integer')
  }

  return result
}

function selectModels(modelFilter: string[]) {
  if (modelFilter.length === 0) {
    return modelConfigs
  }

  const normalized = new Set(modelFilter.map((value) => value.toLowerCase()))
  const selected = modelConfigs.filter((model) => {
    return (
      normalized.has(model.label.toLowerCase()) ||
      normalized.has(model.apiModel.toLowerCase()) ||
      (model.repoModelId != null && normalized.has(model.repoModelId.toLowerCase()))
    )
  })

  if (selected.length !== modelFilter.length) {
    const matched = new Set(
      selected.flatMap((model) =>
        [model.label, model.apiModel, model.repoModelId]
          .filter((value): value is string => value != null)
          .map((value) => value.toLowerCase()),
      ),
    )
    const missing = modelFilter.filter((value) => !matched.has(value.toLowerCase()))
    throw new Error(`Unknown model filter: ${missing.join(', ')}`)
  }

  return selected
}

function validateProviderKeys() {
  const missing = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'SILICONFLOW_API_KEY',
  ].filter((name) => !getOptionalEnv(name))

  if (missing.length > 0) {
    throw new Error(`Missing provider API keys: ${missing.join(', ')}`)
  }
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

async function fetchWithTimeout(input: string | URL, init: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`, {
        cause: error,
      })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const baseUrl = getRequiredEnv('AXIIA_API_URL')
  const token = getRequiredEnv('AXIIA_AUTH_TOKEN')
  const response = await fetchWithTimeout(new URL(path, normalizeBaseUrl(baseUrl)), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${await response.text()}`)
  }

  return (await response.json()) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function extractMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const messages: ChatMessage[] = []
  for (const item of value) {
    if (!isRecord(item)) {
      return null
    }
    const role = item.role
    const content = item.content
    if ((role !== 'assistant' && role !== 'user') || typeof content !== 'string') {
      return null
    }
    messages.push({ content, role })
  }
  return messages
}

function extractErrorToken(error: string | null | undefined) {
  if (!error) {
    return null
  }
  return error.match(/Unrecognized token '([^']+)'/)?.[1] ?? null
}

function ensurePromptSentence(systemPrompt: string) {
  if (systemPrompt.includes(JSON_PROMPT_SENTENCE)) {
    return systemPrompt
  }
  return `${systemPrompt.trimEnd()}\n\n${JSON_PROMPT_SENTENCE}`
}

function extractScorerCase(exported: BattleExport, summary: BattleSummary) {
  const scorerCall = exported.llmCalls.find(
    (call) => call.phase === 'scoring' && call.side === 'scorer',
  )

  if (!scorerCall || !isRecord(scorerCall.requestJson)) {
    return null
  }

  const systemPrompt = asString(scorerCall.requestJson.system)
  const messages = extractMessages(scorerCall.requestJson.messages)

  if (!systemPrompt || !messages) {
    return null
  }

  return {
    battleError: summary.error ?? null,
    battleId: summary.id,
    errorToken: extractErrorToken(summary.error),
    messages,
    scenarioId:
      exported.scenario?.id ??
      exported.match?.scenarioId ??
      exported.run?.scenarioId ??
      summary.scenarioId,
    scenarioTitle: exported.scenario?.title ?? null,
    source: summary.source,
    systemPrompt: ensurePromptSentence(systemPrompt),
  } satisfies BenchCase
}

function parseIncludedCaseKey(key: string) {
  const [source, rawId] = key.split(':')
  const id = Number(rawId)

  if ((source !== 'playground' && source !== 'tournament') || !Number.isInteger(id)) {
    throw new Error(`Invalid included case key: ${key}`)
  }

  return { id, source }
}

async function collectCases(
  limit: number,
  battleLimit: number,
  excludeCases: string[],
  includeCases: string[],
) {
  const excluded = new Set(excludeCases)

  if (includeCases.length > 0) {
    const selected: BenchCase[] = []

    for (const key of includeCases) {
      const { id, source } = parseIncludedCaseKey(key)
      const exported = await apiFetch<BattleExport>(
        `/api/admin/analytics/battles/${source}/${id}/export`,
      )
      const summary = exported.summary ?? {
        error: null,
        id,
        scenarioId:
          exported.scenario?.id ??
          exported.match?.scenarioId ??
          exported.run?.scenarioId ??
          '',
        source,
        status: 'unknown',
      }
      const benchCase = extractScorerCase(exported, summary)

      if (!benchCase) {
        throw new Error(`Included case has no scorer call: ${key}`)
      }

      selected.push(benchCase)
    }

    return selected.slice(0, limit)
  }

  const battles = await apiFetch<BattleSummary[]>(
    `/api/admin/analytics/battles?status=error&limit=${battleLimit}`,
  )
  const parseErrorBattles = battles.filter((battle) =>
    battle.error?.includes('JSON Parse error'),
  )
  const cases: BenchCase[] = []

  for (const battle of parseErrorBattles) {
    const exported = await apiFetch<BattleExport>(
      `/api/admin/analytics/battles/${battle.source}/${battle.id}/export`,
    )
    const benchCase = extractScorerCase(exported, battle)
    if (
      benchCase &&
      !excluded.has(`${benchCase.source}:${benchCase.battleId}`)
    ) {
      cases.push(benchCase)
    }
  }

  const shangyang = cases.filter((item) => item.scenarioId === 'shangyang-court')
  const honnoji = cases.filter((item) => item.scenarioId === 'honnoji-decision')
  const selected: BenchCase[] = []

  selected.push(...honnoji.slice(0, Math.min(8, limit)))

  if (selected.length < limit) {
    selected.push(...shangyang.slice(0, limit - selected.length))
  }

  for (const item of cases) {
    if (selected.length >= limit) {
      break
    }
    if (
      !selected.some(
        (selectedItem) =>
          selectedItem.source === item.source &&
          selectedItem.battleId === item.battleId,
      )
    ) {
      selected.push(item)
    }
  }

  return selected.slice(0, limit)
}

function sanitizeJsonResponse(raw: string) {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  return fenced ? fenced[1].trim() : trimmed
}

function classifyInvalidOutput(content: string | null, error: string | null) {
  if (error) {
    return 'provider_error'
  }
  if (!content) {
    return 'empty_response'
  }
  if (/```/.test(content)) {
    return 'markdown_fence'
  }
  if (/"reasoning"\s*:\s*"[\s\S]*?为"[\s\S]*?"/.test(content)) {
    return 'likely_unescaped_quote'
  }
  if (!content.trim().startsWith('{')) {
    return 'prose_outside_json'
  }
  return 'invalid_json_or_schema'
}

function estimateCost(
  model: ModelConfig,
  promptTokens: number | null,
  completionTokens: number | null,
) {
  if (promptTokens == null || completionTokens == null) {
    return null
  }

  return (
    (promptTokens / 1_000_000) * model.inputPricePerMillion +
    (completionTokens / 1_000_000) * model.outputPricePerMillion
  )
}

function openAiCompatibleRequestBody(model: ModelConfig, testCase: BenchCase) {
  return {
    messages: [
      { content: testCase.systemPrompt, role: 'system' },
      ...testCase.messages,
    ],
    model: model.apiModel,
    response_format: { type: 'json_object' },
    ...(model.omitTemperature ? {} : { temperature: 0 }),
    ...(model.useSiliconFlowThinkingOff ? { enable_thinking: false } : {}),
    ...(model.useOpenAiLowReasoning ? { reasoning_effort: 'low' } : {}),
  }
}

function anthropicRequestBody(model: ModelConfig, testCase: BenchCase) {
  return {
    max_tokens: Number.isFinite(ANTHROPIC_MAX_TOKENS)
      ? Math.max(1, ANTHROPIC_MAX_TOKENS)
      : 4096,
    messages: testCase.messages,
    model: model.apiModel,
    system: testCase.systemPrompt,
    ...(model.useAnthropicLowEffort
      ? {
          output_config: { effort: 'low' },
          thinking: { display: 'omitted', type: 'adaptive' },
        }
      : { temperature: 0 }),
  }
}

function extractOpenAiContent(responseJson: unknown) {
  if (!isRecord(responseJson)) {
    return null
  }
  const choices = responseJson.choices
  if (!Array.isArray(choices)) {
    return null
  }
  const first = choices[0]
  if (!isRecord(first) || !isRecord(first.message)) {
    return null
  }
  return asString(first.message.content)
}

function extractOpenAiUsage(responseJson: unknown) {
  if (!isRecord(responseJson) || !isRecord(responseJson.usage)) {
    return { completionTokens: null, promptTokens: null }
  }
  return {
    completionTokens:
      typeof responseJson.usage.completion_tokens === 'number'
        ? responseJson.usage.completion_tokens
        : null,
    promptTokens:
      typeof responseJson.usage.prompt_tokens === 'number'
        ? responseJson.usage.prompt_tokens
        : null,
  }
}

function extractAnthropicContent(responseJson: unknown) {
  if (!isRecord(responseJson) || !Array.isArray(responseJson.content)) {
    return null
  }
  const textBlocks = responseJson.content
    .filter((block): block is { text: string; type: string } => {
      return (
        isRecord(block) &&
        block.type === 'text' &&
        typeof block.text === 'string'
      )
    })
    .map((block) => block.text.trim())
    .filter(Boolean)
  return textBlocks.length > 0 ? textBlocks.join('\n') : null
}

function extractAnthropicUsage(responseJson: unknown) {
  if (!isRecord(responseJson) || !isRecord(responseJson.usage)) {
    return { completionTokens: null, promptTokens: null }
  }
  return {
    completionTokens:
      typeof responseJson.usage.output_tokens === 'number'
        ? responseJson.usage.output_tokens
        : null,
    promptTokens:
      typeof responseJson.usage.input_tokens === 'number'
        ? responseJson.usage.input_tokens
        : null,
  }
}

async function callProvider(
  model: ModelConfig,
  testCase: BenchCase,
): Promise<ProviderCallResult> {
  if (model.provider === 'anthropic') {
    const baseUrl =
      getOptionalEnv('ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com'
    const requestBody = anthropicRequestBody(model, testCase)
    const response = await fetchWithTimeout(
      new URL('v1/messages', normalizeBaseUrl(baseUrl)),
      {
        body: JSON.stringify(requestBody),
        headers: {
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
          'x-api-key': getRequiredEnv('ANTHROPIC_API_KEY'),
        },
        method: 'POST',
      },
    )
    const responseText = await response.text()
    const responseJson = safeJsonParse(responseText)
    const usage = extractAnthropicUsage(responseJson)
    const content = extractAnthropicContent(responseJson)

    return {
      completionTokens: usage.completionTokens,
      content,
      error: response.ok ? null : responseText.slice(0, 1000),
      promptTokens: usage.promptTokens,
      requestBody,
      responseJson,
      status: response.status,
    }
  }

  const baseUrl =
    model.provider === 'openai'
      ? getOptionalEnv('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1'
      : getOptionalEnv('SILICONFLOW_BASE_URL') ?? 'https://api.siliconflow.cn/v1'
  const apiKey =
    model.provider === 'openai'
      ? getRequiredEnv('OPENAI_API_KEY')
      : getRequiredEnv('SILICONFLOW_API_KEY')
  const requestBody = openAiCompatibleRequestBody(model, testCase)
  const response = await fetchWithTimeout(
    new URL('chat/completions', normalizeBaseUrl(baseUrl)),
    {
      body: JSON.stringify(requestBody),
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    },
  )
  const responseText = await response.text()
  const responseJson = safeJsonParse(responseText)
  const usage = extractOpenAiUsage(responseJson)
  const content = extractOpenAiContent(responseJson)

  return {
    completionTokens: usage.completionTokens,
    content,
    error: response.ok ? null : responseText.slice(0, 1000),
    promptTokens: usage.promptTokens,
    requestBody,
    responseJson,
    status: response.status,
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function preview(value: string | null) {
  if (value == null) {
    return null
  }
  return value.length > 1200 ? `${value.slice(0, 1200)}...` : value
}

function parseScorerOutput(content: string | null) {
  if (!content) {
    return {
      jsonParseOk: false,
      parseError: 'empty response',
      schemaError: null,
      schemaOk: false,
      scoreA: null,
      scoreB: null,
    }
  }

  try {
    const parsed = JSON.parse(sanitizeJsonResponse(content))
    const schemaResult = scorerOutputSchema.safeParse(parsed)
    if (!schemaResult.success) {
      return {
        jsonParseOk: true,
        parseError: null,
        schemaError: schemaResult.error.message,
        schemaOk: false,
        scoreA: null,
        scoreB: null,
      }
    }
    return {
      jsonParseOk: true,
      parseError: null,
      schemaError: null,
      schemaOk: true,
      scoreA: schemaResult.data.scoreA,
      scoreB: schemaResult.data.scoreB,
    }
  } catch (error) {
    return {
      jsonParseOk: false,
      parseError: error instanceof Error ? error.message : String(error),
      schemaError: null,
      schemaOk: false,
      scoreA: null,
      scoreB: null,
    }
  }
}

async function runOne(model: ModelConfig, testCase: BenchCase) {
  const startedAt = Date.now()
  try {
    const response = await callProvider(model, testCase)
    const parsed = parseScorerOutput(response.content)
    const errorClass =
      response.error || !parsed.schemaOk
        ? classifyInvalidOutput(response.content, response.error)
        : null

    return {
      battleError: testCase.battleError,
      battleId: testCase.battleId,
      completionTokens: response.completionTokens,
      cost: estimateCost(model, response.promptTokens, response.completionTokens),
      currency: model.currency,
      durationMs: Date.now() - startedAt,
      error: response.error,
      errorClass,
      errorToken: testCase.errorToken,
      jsonParseOk: parsed.jsonParseOk,
      model: model.label,
      parseError: parsed.parseError,
      promptTokens: response.promptTokens,
      provider: model.provider,
      rawContentPreview: preview(response.content),
      scenarioId: testCase.scenarioId,
      schemaError: parsed.schemaError,
      schemaOk: parsed.schemaOk,
      scoreA: parsed.scoreA,
      scoreB: parsed.scoreB,
      settingsLabel: model.settingsLabel,
      source: testCase.source,
      status: response.status,
    } satisfies BenchResult
  } catch (error) {
    return {
      battleError: testCase.battleError,
      battleId: testCase.battleId,
      completionTokens: null,
      cost: null,
      currency: model.currency,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      errorClass: 'runner_error',
      errorToken: testCase.errorToken,
      jsonParseOk: false,
      model: model.label,
      parseError: null,
      promptTokens: null,
      provider: model.provider,
      rawContentPreview: null,
      scenarioId: testCase.scenarioId,
      schemaError: null,
      schemaOk: false,
      scoreA: null,
      scoreB: null,
      settingsLabel: model.settingsLabel,
      source: testCase.source,
      status: null,
    } satisfies BenchResult
  }
}

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return null
  }
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))] ?? null
}

function rate(count: number, total: number) {
  return total === 0 ? 0 : count / total
}

function summarize(results: BenchResult[], models: ModelConfig[]) {
  return models.map((model) => {
    const rows = results.filter((row) => row.model === model.label)
    const durations = rows.map((row) => row.durationMs)
    const promptTokens = rows
      .map((row) => row.promptTokens)
      .filter((value): value is number => typeof value === 'number')
    const outputTokens = rows
      .map((row) => row.completionTokens)
      .filter((value): value is number => typeof value === 'number')
    const costs = rows
      .map((row) => row.cost)
      .filter((value): value is number => typeof value === 'number')

    return {
      avgDurationMs: average(durations),
      avgOutputTokens: average(outputTokens),
      avgPromptTokens: average(promptTokens),
      currency: model.currency,
      estimatedCost: costs.reduce((sum, value) => sum + value, 0),
      jsonParseRate: rate(
        rows.filter((row) => row.jsonParseOk).length,
        rows.length,
      ),
      maxDurationMs: durations.length > 0 ? Math.max(...durations) : null,
      medianDurationMs: percentile(durations, 50),
      model: model.label,
      p90DurationMs: percentile(durations, 90),
      providerErrorCount: rows.filter((row) => row.error).length,
      schemaRate: rate(rows.filter((row) => row.schemaOk).length, rows.length),
      total: rows.length,
    } satisfies ModelSummary
  })
}

function formatNumber(value: number | null, digits = 0) {
  if (value == null || Number.isNaN(value)) {
    return '-'
  }
  return value.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function formatRateValue(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function correctnessClass(value: number) {
  if (value === 1) {
    return 'good'
  }
  return value >= 0.95 ? 'warn' : 'bad'
}

function renderCorrectnessSection(report: CorrectnessReport | null) {
  if (!report) {
    return ''
  }

  const failures = report.results.filter((item) => !item.scoreCorrect)

  return `
  <h2>Score Correctness</h2>
  <p class="note">Expected scores are computed deterministically from each persisted scorer prompt, including accepted requests and examination penalties.</p>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Correct</th>
        <th>Total</th>
        <th>Score correctness</th>
        <th>Avg absolute delta</th>
      </tr>
    </thead>
    <tbody>
      ${report.summary
        .map(
          (item) => `<tr>
        <td>${escapeHtml(item.model)}</td>
        <td>${item.correct}</td>
        <td>${item.total}</td>
        <td class="${correctnessClass(item.scoreCorrectRate)}">${formatRateValue(item.scoreCorrectRate)}</td>
        <td>${formatNumber(item.avgAbsDelta, 3)}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>

  <h2>Score Failures</h2>
  ${
    failures.length === 0
      ? '<p class="good">No score correctness failures.</p>'
      : `<table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Battle</th>
        <th>Scenario</th>
        <th>Expected score</th>
        <th>Actual score</th>
        <th>Delta</th>
      </tr>
    </thead>
    <tbody>
      ${failures
        .map(
          (item) => `<tr>
        <td>${escapeHtml(item.model)}</td>
        <td>${escapeHtml(item.source)}:${item.battleId}</td>
        <td>${escapeHtml(item.scenarioId)}</td>
        <td>${item.expectedScoreA}, ${item.expectedScoreB}</td>
        <td>${escapeHtml(item.scoreA)}, ${escapeHtml(item.scoreB)}</td>
        <td>${escapeHtml(item.scoreDeltaA)}, ${escapeHtml(item.scoreDeltaB)}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>`
  }
`
}

function renderHtml(
  report: BenchmarkReport,
  correctnessReport: CorrectnessReport | null,
) {
  const sourceLinks = [
    ['OpenAI API pricing', 'https://developers.openai.com/api/docs/pricing'],
    ['OpenAI GPT-4.1 pricing', 'https://openai.com/index/gpt-4-1/'],
    [
      'Anthropic pricing',
      'https://docs.anthropic.com/en/docs/about-claude/pricing',
    ],
    [
      'Anthropic effort',
      'https://platform.claude.com/docs/en/build-with-claude/effort',
    ],
    [
      'Anthropic adaptive thinking',
      'https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking',
    ],
    ['SiliconFlow pricing', 'https://siliconflow.cn/pricing'],
    [
      'SiliconFlow JSON mode',
      'https://docs.siliconflow.com/en/userguide/guides/json-mode',
    ],
  ]

  const failureRows = report.results
    .filter((result) => result.error || !result.schemaOk)
    .slice(0, 20)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Axiia Scoring Benchmark</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f4;
      --ink: #17201b;
      --muted: #66736b;
      --line: #d9ded8;
      --panel: #ffffff;
      --good: #0f7a4c;
      --bad: #a33a2a;
      --warn: #9b6a1b;
    }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
      margin: 0;
    }
    main {
      margin: 0 auto;
      max-width: 1180px;
      padding: 32px 20px 56px;
    }
    h1, h2 {
      letter-spacing: 0;
      line-height: 1.15;
    }
    h1 {
      font-size: 34px;
      margin: 0 0 6px;
    }
    h2 {
      border-top: 1px solid var(--line);
      font-size: 22px;
      margin: 34px 0 14px;
      padding-top: 24px;
    }
    .meta, .note {
      color: var(--muted);
    }
    .grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin: 18px 0;
    }
    .metric {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px 16px;
    }
    .metric strong {
      display: block;
      font-size: 26px;
    }
    table {
      background: var(--panel);
      border-collapse: collapse;
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      width: 100%;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #edf2ee;
      font-size: 13px;
    }
    tr:last-child td {
      border-bottom: 0;
    }
    code, pre {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }
    pre {
      background: #1c211d;
      border-radius: 8px;
      color: #edf2ee;
      max-height: 220px;
      overflow: auto;
      padding: 12px;
      white-space: pre-wrap;
    }
    .good { color: var(--good); font-weight: 700; }
    .bad { color: var(--bad); font-weight: 700; }
    .warn { color: var(--warn); font-weight: 700; }
    a { color: #255f85; }
  </style>
</head>
<body>
<main>
  <h1>Axiia Scoring Benchmark</h1>
  <p class="meta">Generated at ${escapeHtml(report.generatedAt)}. Case limit: ${report.options.caseLimit}. Dry run: ${report.options.dryRun ? 'yes' : 'no'}.</p>

  <div class="grid">
    <div class="metric"><span>Models</span><strong>${report.models.length}</strong></div>
    <div class="metric"><span>Cases</span><strong>${report.cases.length}</strong></div>
    <div class="metric"><span>Calls</span><strong>${report.results.length}</strong></div>
    <div class="metric"><span>JSON sentence</span><strong>${report.cases.length > 0 ? 'added' : '-'}</strong></div>
  </div>

  <h2>Prompt Change</h2>
  <pre>${escapeHtml(JSON_PROMPT_SENTENCE)}</pre>

  <h2>Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Total</th>
        <th>JSON parse</th>
        <th>Schema</th>
        <th>Provider errors</th>
        <th>Avg ms</th>
        <th>P50 ms</th>
        <th>P90 ms</th>
        <th>Avg input tokens</th>
        <th>Avg output tokens</th>
        <th>Cost</th>
      </tr>
    </thead>
    <tbody>
      ${report.summary
        .map(
          (row) => `<tr>
        <td>${escapeHtml(row.model)}</td>
        <td>${row.total}</td>
        <td class="${row.jsonParseRate === 1 ? 'good' : row.jsonParseRate === 0 ? 'bad' : 'warn'}">${formatRateValue(row.jsonParseRate)}</td>
        <td class="${row.schemaRate === 1 ? 'good' : row.schemaRate === 0 ? 'bad' : 'warn'}">${formatRateValue(row.schemaRate)}</td>
        <td>${row.providerErrorCount}</td>
        <td>${formatNumber(row.avgDurationMs)}</td>
        <td>${formatNumber(row.medianDurationMs)}</td>
        <td>${formatNumber(row.p90DurationMs)}</td>
        <td>${formatNumber(row.avgPromptTokens)}</td>
        <td>${formatNumber(row.avgOutputTokens)}</td>
        <td>${escapeHtml(row.currency)} ${formatNumber(row.estimatedCost, 4)}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>

  <h2>Model Settings</h2>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Provider</th>
        <th>API model</th>
        <th>Repo id</th>
        <th>Settings</th>
        <th>Input price</th>
        <th>Output price</th>
      </tr>
    </thead>
    <tbody>
      ${report.models
        .map(
          (model) => `<tr>
        <td>${escapeHtml(model.label)}</td>
        <td>${escapeHtml(model.provider)}</td>
        <td><code>${escapeHtml(model.apiModel)}</code></td>
        <td>${model.repoModelId ? `<code>${escapeHtml(model.repoModelId)}</code>` : 'benchmark-only'}</td>
        <td>${escapeHtml(model.settingsLabel)}</td>
        <td>${escapeHtml(model.currency)} ${model.inputPricePerMillion} / 1M</td>
        <td>${escapeHtml(model.currency)} ${model.outputPricePerMillion} / 1M</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>

  ${renderCorrectnessSection(correctnessReport)}

  <h2>Cases</h2>
  <table>
    <thead>
      <tr>
        <th>Battle</th>
        <th>Source</th>
        <th>Scenario</th>
        <th>Error token</th>
        <th>Prompt chars</th>
        <th>Messages</th>
      </tr>
    </thead>
    <tbody>
      ${report.cases
        .map(
          (item) => `<tr>
        <td>${item.battleId}</td>
        <td>${escapeHtml(item.source)}</td>
        <td>${escapeHtml(item.scenarioId)}</td>
        <td>${escapeHtml(item.errorToken ?? '')}</td>
        <td>${item.systemPromptChars}</td>
        <td>${item.messageCount}</td>
      </tr>`,
        )
        .join('\n')}
    </tbody>
  </table>

  <h2>Failure Examples</h2>
  ${
    failureRows.length === 0
      ? '<p class="good">No failures in this run.</p>'
      : failureRows
          .map(
            (row) => `<section>
    <p><strong>${escapeHtml(row.model)}</strong> on ${escapeHtml(row.source)}:${row.battleId} (${escapeHtml(row.scenarioId)}) - ${escapeHtml(row.errorClass ?? row.parseError ?? row.schemaError ?? row.error ?? 'unknown')}</p>
    <pre>${escapeHtml(row.rawContentPreview ?? row.error ?? '')}</pre>
  </section>`,
          )
          .join('\n')
  }

  <h2>Sources</h2>
  <ul>
    ${sourceLinks
      .map(
        ([label, href]) =>
          `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
      )
      .join('\n')}
  </ul>

  <p class="note">Raw benchmark data is in <code>results.json</code>. Prompt text and full request bodies are intentionally not written into this HTML.</p>
</main>
</body>
</html>`
}

async function writeBenchmarkReport(
  outputDir: string,
  report: BenchmarkReport,
  correctnessReport: CorrectnessReport | null = null,
) {
  await mkdir(outputDir, { recursive: true })
  await writeFile(
    join(outputDir, 'results.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    join(outputDir, 'index.html'),
    renderHtml(report, correctnessReport),
    'utf8',
  )
}

async function writeReport(
  outputDir: string,
  cases: BenchCase[],
  results: BenchResult[],
  models: ModelConfig[],
  options: {
    battleLimit: number
    caseLimit: number
    dryRun: boolean
    excludeCases: string[]
    includeCases: string[]
    models: string[]
  },
) {
  const report: BenchmarkReport = {
    cases: cases.map((item) => ({
      battleError: item.battleError,
      battleId: item.battleId,
      errorToken: item.errorToken,
      messageCount: item.messages.length,
      scenarioId: item.scenarioId,
      scenarioTitle: item.scenarioTitle,
      source: item.source,
      systemPromptChars: item.systemPrompt.length,
    })),
    generatedAt: new Date().toISOString(),
    models: models.map((model) => ({
      apiModel: model.apiModel,
      currency: model.currency,
      inputPricePerMillion: model.inputPricePerMillion,
      label: model.label,
      outputPricePerMillion: model.outputPricePerMillion,
      provider: model.provider,
      repoModelId: model.repoModelId,
      settingsLabel: model.settingsLabel,
    })),
    options: { ...options, caseLimit: cases.length },
    results,
    summary: summarize(results, models),
  }

  await writeBenchmarkReport(outputDir, report)
}

async function readBenchmarkReport(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as BenchmarkReport
}

async function readCorrectnessReport(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as CorrectnessReport
}

function caseKey(item: BenchCaseSummary) {
  return `${item.source}:${item.battleId}`
}

function resultKey(item: BenchResult) {
  return `${item.model}:${item.source}:${item.battleId}`
}

function mergeReports(
  reports: BenchmarkReport[],
  models: ModelConfig[],
  options: BenchmarkReport['options'],
) {
  const selectedModelLabels = new Set(models.map((model) => model.label))
  const cases: BenchCaseSummary[] = []
  const caseKeys = new Set<string>()
  const results: BenchResult[] = []
  const resultIndexes = new Map<string, number>()

  for (const report of reports) {
    for (const item of report.cases) {
      const key = caseKey(item)
      if (!caseKeys.has(key)) {
        caseKeys.add(key)
        cases.push(item)
      }
    }

    for (const item of report.results) {
      if (!selectedModelLabels.has(item.model)) {
        continue
      }

      const key = resultKey(item)
      const existingIndex = resultIndexes.get(key)
      if (existingIndex == null) {
        resultIndexes.set(key, results.length)
        results.push(item)
      } else {
        results[existingIndex] = item
      }
    }
  }

  return {
    cases,
    generatedAt: new Date().toISOString(),
    models: models.map((model) => ({
      apiModel: model.apiModel,
      currency: model.currency,
      inputPricePerMillion: model.inputPricePerMillion,
      label: model.label,
      outputPricePerMillion: model.outputPricePerMillion,
      provider: model.provider,
      repoModelId: model.repoModelId,
      settingsLabel: model.settingsLabel,
    })),
    options,
    results,
    summary: summarize(results, models),
  } satisfies BenchmarkReport
}

async function main() {
  const options = parseArgs()
  if (!options.dryRun && options.mergeResults.length === 0) {
    validateProviderKeys()
  }

  const selectedModels = selectModels(options.models)
  const outputDir =
    options.outputDir || join('docs', 'bench', 'runs', `scoring-${timestampSlug()}`)

  if (options.mergeResults.length > 0) {
    const reports = await Promise.all(options.mergeResults.map(readBenchmarkReport))
    const correctnessReport = options.correctnessResults
      ? await readCorrectnessReport(options.correctnessResults)
      : null
    const report = mergeReports(reports, selectedModels, {
      battleLimit: options.battleLimit,
      caseLimit: options.caseLimit,
      dryRun: false,
      includeCases: options.includeCases,
      models: options.models,
    })
    await writeBenchmarkReport(outputDir, report, correctnessReport)
    console.log(
      JSON.stringify(
        {
          cases: report.cases.length,
          outputDir,
          results: report.results.length,
        },
        null,
        2,
      ),
    )
    return
  }

  const cases = await collectCases(
    options.caseLimit,
    options.battleLimit,
    options.excludeCases,
    options.includeCases,
  )

  if (cases.length === 0) {
    throw new Error('No scorer benchmark cases found')
  }

  console.log(
    JSON.stringify(
      {
        cases: cases.map((item) => ({
          battleId: item.battleId,
          errorToken: item.errorToken,
          scenarioId: item.scenarioId,
          source: item.source,
          systemPromptChars: item.systemPrompt.length,
        })),
        dryRun: options.dryRun,
        outputDir,
      },
      null,
      2,
    ),
  )

  const results: BenchResult[] = []

  if (!options.dryRun) {
    for (const model of selectedModels) {
      for (const testCase of cases) {
        console.log(
          `[bench] ${model.label} ${testCase.source}:${testCase.battleId}`,
        )
        const result = await runOne(model, testCase)
        results.push(result)
        console.log(
          `[bench] -> schema=${result.schemaOk ? 'ok' : 'fail'} json=${result.jsonParseOk ? 'ok' : 'fail'} duration=${result.durationMs}ms`,
        )
      }
    }
  }

  await writeReport(outputDir, cases, results, selectedModels, {
    battleLimit: options.battleLimit,
    caseLimit: options.caseLimit,
    dryRun: options.dryRun,
    excludeCases: options.excludeCases,
    includeCases: options.includeCases,
    models: options.models,
  })

  console.log(JSON.stringify({ outputDir, results: results.length }, null, 2))
}

await main()
