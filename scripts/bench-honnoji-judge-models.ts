import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import {
  evaluationModelIds,
  getModelDefinition,
  resolveModelLabel,
  type EvaluationModelId,
  type InfoAssignment,
  type JudgeQA,
  type TranscriptTurn,
} from '../packages/shared/src'
import type { ScenarioRecord } from '../apps/api/src/db/schema'
import {
  buildJudgePrompt,
  formatDebateTranscriptForJudge,
} from '../apps/api/src/engine/core'
import { chatCompletion } from '../apps/api/src/engine/llm'
import { computeProgrammaticScore } from '../apps/api/src/engine/programmatic-scorer'

const BENCHMARK_NAME = 'honnoji-judge-models'
const HONNOJI_SCENARIO_ID = 'honnoji-decision'
const DEFAULT_RUNS_DIR = 'docs/bench/runs'
const DEFAULT_INVENTORY_PATH =
  'docs/competition/prompts/honnoji-user-samples/inventory.json'
const DEFAULT_CONCURRENCY = 4
const DEFAULT_JOB_TIMEOUT_MS = 300_000

const DEFAULT_FRONTIER_JUDGE_MODELS = [
  'deepseek-v4-pro',
  'kimi-k2.6',
  'qwen3.6-27b',
  'glm-5.1',
  'minimax-m2.5',
  'gpt-5.4',
  'claude-opus-4-6',
] as const satisfies readonly EvaluationModelId[]

type PolicyWinner = 'a' | 'b' | 'unknown'
type MatchWinner = 'a' | 'b' | 'draw' | null

type CharacterPair = {
  id: string
  roleAName: string
  roleAOptionId: string
  roleARequests: Array<{ content: string; id: string }>
  roleBName: string
  roleBOptionId: string
  roleBRequests: Array<{ content: string; id: string }>
}

type ScenarioSnapshot = ScenarioRecord & {
  agentPromptTemplateHash?: string
  judgePromptChars?: number
  judgePromptHash?: string
  scenarioSnapshotHash?: string
  scorerPromptHash?: string
}

type PromptInventory = {
  characterPairs: CharacterPair[]
  kind: 'honnoji.prompt_inventory'
  scenario: ScenarioSnapshot
}

type SourceBenchResult = {
  attackSampleId: string
  characterPair: Omit<CharacterPair, 'roleARequests' | 'roleBRequests'>
  defenseSampleId: string
  error: string | null
  infoAssignment: InfoAssignment
  jobId: string
  judgeDecision: string | null
  judgeTranscriptA: JudgeQA[] | null
  judgeTranscriptB: JudgeQA[] | null
  judgment: string | null
  judgmentParseError: string | null
  models: {
    agentA: string
    agentB: string
    judge: string
  }
  policyWinner: PolicyWinner
  requestDecisions: Record<string, string>
  scoreA: number | null
  scoreB: number | null
  status: 'error' | 'ok'
  transcript: TranscriptTurn[] | null
  trueRequestPairId: string
  winner: MatchWinner
}

type SourceWinRateReport = {
  config: {
    inventoryPath?: string | null
    judgeModel?: string | null
    runId: string
    scenarioId: string
  }
  generatedAt: string
  kind: 'honnoji.win_rate_results'
  results: SourceBenchResult[]
}

type JudgeBenchJob = {
  id: string
  judgeModel: EvaluationModelId
  repeatIndex: number
  source: SourceBenchResult
}

type JudgeDecisionSummary = {
  judgment: string | null
  parseError: string | null
  policyWinner: PolicyWinner
  requests: Record<string, string>
}

type ModelConfigSummary = {
  apiModel: string
  gatewayProvider: string
  id: EvaluationModelId
  label: string
  underlyingProvider: string
}

type JudgeBenchResult = {
  attackSampleId: string
  baseline: {
    judgeDecision: string | null
    judgeModel: string | null
    judgment: string | null
    policyWinner: PolicyWinner
    scoreA: number | null
    scoreB: number | null
    scoreWinner: MatchWinner
  }
  characterPair: Omit<CharacterPair, 'roleARequests' | 'roleBRequests'>
  defenseSampleId: string
  durationMs: number
  error: string | null
  generatedAt: string
  infoAssignment: InfoAssignment
  jobId: string
  judgeDecision: string | null
  judgeModel: EvaluationModelId
  judgment: string | null
  judgmentParseError: string | null
  langfuseSessionId: string
  models: {
    agentA: string
    agentB: string
    baselineJudge: string | null
    judge: EvaluationModelId
  }
  policyAgreesWithBaseline: boolean | null
  policyWinner: PolicyWinner
  repeatIndex: number
  requestDecisions: Record<string, string>
  scoreA: number | null
  scoreAgreesWithBaseline: boolean | null
  scoreB: number | null
  scorerReasoning: string | null
  sourceJobId: string
  sourceRunId: string
  status: 'error' | 'ok'
  trueRequestPairId: string
  winner: MatchWinner
}

type PairAggregate = {
  completed: number
  errored: number
  pairId: string
  policyAgreements: number
  policyComparable: number
  policyAssassinationWins: number
  policyAvoidWins: number
  policyUnknown: number
  roleAName: string
  roleAOptionId: string
  roleBName: string
  roleBOptionId: string
  scoreAgreements: number
  scoreComparable: number
  scoreAssassinationWins: number
  scoreAvoidWins: number
  scoreDraws: number
  total: number
}

type ModelAggregate = {
  avgDurationMs: number | null
  byPair: Record<string, PairAggregate>
  completed: number
  errored: number
  parseErrors: number
  policyAgreements: number
  policyComparable: number
  policyAgreementRate: number | null
  policyAssassinationWins: number
  policyAvoidWins: number
  policyUnknown: number
  scoreAgreements: number
  scoreComparable: number
  scoreAgreementRate: number | null
  scoreAssassinationWins: number
  scoreAvoidWins: number
  scoreDraws: number
  totalJobs: number
}

type JudgeBenchmarkConfig = {
  concurrency: number
  dryRun: boolean
  inputPath: string
  inventoryPath: string
  jobTimeoutMs: number
  judgeModels: ModelConfigSummary[]
  limitHistories: number | null
  outputDir: string
  repeats: number
  resume: boolean
  runId: string
  scenarioId: string
  scenarioSnapshotHash: string
  sourceJudgeModel: string | null
  sourceRunId: string
}

type JudgeBenchmarkReport = {
  config: JudgeBenchmarkConfig
  generatedAt: string
  kind: 'honnoji.judge_model_results'
  results: JudgeBenchResult[]
  summary: {
    byJudgeModel: Record<string, ModelAggregate>
    completed: number
    errored: number
    parseErrors: number
    sourceHistories: number
    totalJobs: number
  }
}

type CliOptions = Record<string, string | true>

function usage() {
  console.log(`Usage:
  bun scripts/bench-honnoji-judge-models.ts run [options]

Options:
  --input <path>             Source Honnoji win-rate results.json.
                             Defaults to the newest completed honnoji-win-rate run.
  --inventory <path>         Prompt inventory with scenario snapshot.
                             Defaults to ${DEFAULT_INVENTORY_PATH}.
  --output-dir <path>        Output directory. Defaults to docs/bench/runs/<run-id>.
  --run-id <id>              Benchmark run id.
  --judge-models <ids>       Comma-separated evaluation model ids, or "frontier".
                             Default frontier set: ${DEFAULT_FRONTIER_JUDGE_MODELS.join(',')}.
  --concurrency <n>          Parallel judge calls. Default: ${DEFAULT_CONCURRENCY}.
  --repeats <n>              Rejudge each transcript n times per model. Default: 1.
  --limit <n>                Use only first n source debate histories.
  --job-timeout-ms <n>       Timeout per judge call. Default: ${DEFAULT_JOB_TIMEOUT_MS}.
  --resume                   Reuse completed results in output-dir/results.json.
  --dry-run                  Write config and print planned job count without model calls.
  --help                     Show this help.
`)
}

function parseArgs() {
  const args = Bun.argv.slice(2)
  let command = 'run'
  let start = 0

  if (args[0] && !args[0].startsWith('-')) {
    command = args[0]
    start = 1
  }

  const options: CliOptions = {}
  for (let index = start; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`)
    }

    const eqIndex = arg.indexOf('=')
    if (eqIndex >= 0) {
      options[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1)
      continue
    }

    const key = arg.slice(2)
    const next = args[index + 1]
    if (next && !next.startsWith('--')) {
      options[key] = next
      index += 1
    } else {
      options[key] = true
    }
  }

  return { command, options }
}

function getStringOption(
  options: CliOptions,
  key: string,
  defaultValue?: string,
) {
  const value = options[key]
  if (value === true) {
    throw new Error(`--${key} requires a value`)
  }

  return value ?? defaultValue
}

function parsePositiveInteger(
  value: string | undefined,
  label: string,
  defaultValue: number,
) {
  if (value == null) {
    return defaultValue
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return parsed
}

function timestampForRunId() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

async function readJsonFile<T>(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

function sha256(value: unknown) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex')
}

async function findDefaultInputPath() {
  const entries = await readdir(DEFAULT_RUNS_DIR, { withFileTypes: true })
  const candidates = entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith('honnoji-win-rate-') &&
        !entry.name.includes('akechi-deepseek'),
    )
    .map((entry) => entry.name)
    .sort()
    .reverse()

  for (const name of candidates) {
    const path = join(DEFAULT_RUNS_DIR, name, 'results.json')
    if (!existsSync(path)) {
      continue
    }

    const report = await readJsonFile<SourceWinRateReport>(path)
    if (
      report.kind === 'honnoji.win_rate_results' &&
      report.results.some(
        (result) =>
          result.status === 'ok' &&
          result.transcript &&
          result.transcript.length > 0,
      )
    ) {
      return path
    }
  }

  throw new Error(
    `No usable honnoji-win-rate results.json found under ${DEFAULT_RUNS_DIR}; pass --input`,
  )
}

function validateEvaluationModel(value: string): value is EvaluationModelId {
  return (evaluationModelIds as readonly string[]).includes(value)
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)]
}

function parseJudgeModels(value: string | undefined): EvaluationModelId[] {
  if (!value || value === 'frontier' || value === 'all') {
    return [...DEFAULT_FRONTIER_JUDGE_MODELS]
  }

  const parsed = uniqueValues(
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  )

  if (parsed.length === 0) {
    throw new Error('--judge-models must include at least one model id')
  }

  const models: EvaluationModelId[] = []
  for (const model of parsed) {
    if (!validateEvaluationModel(model)) {
      throw new Error(`Invalid judge model: ${model}`)
    }

    models.push(model)
  }

  return models
}

function modelSummary(id: EvaluationModelId): ModelConfigSummary {
  const definition = getModelDefinition(id)

  return {
    apiModel: definition.apiModel,
    gatewayProvider: definition.provider,
    id,
    label: resolveModelLabel(id),
    underlyingProvider: definition.underlyingProvider,
  }
}

function pairIdentity(pair: CharacterPair) {
  const {
    roleARequests: _roleARequests,
    roleBRequests: _roleBRequests,
    ...identity
  } = pair

  return identity
}

function scenarioForPair(params: {
  judgeModel: EvaluationModelId
  pair: CharacterPair
  scenario: ScenarioSnapshot
}): ScenarioRecord {
  return {
    ...params.scenario,
    createdAt: params.scenario.createdAt ?? '',
    judgeModel: params.judgeModel,
    roleAName: params.pair.roleAName,
    roleARequests: JSON.stringify(params.pair.roleARequests),
    roleBName: params.pair.roleBName,
    roleBRequests: JSON.stringify(params.pair.roleBRequests),
  }
}

function buildExaminationSummary(roleName: string, examination: JudgeQA[]) {
  if (examination.length === 0) {
    return `【${roleName}】未完成问询。`
  }

  return examination
    .map((item) =>
      [
        `【${roleName}】`,
        `- 指认编号：${item.selectedInfoId ?? '未作答'}`,
        `- 系统判定：${item.isCorrect == null ? '未判定' : item.isCorrect ? '正确' : '错误'}`,
        `- 回答：${item.answer}`,
      ].join('\n'),
    )
    .join('\n\n')
}

function stripMarkdownCodeFence(raw: string) {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

  return fenced ? fenced[1]!.trim() : trimmed
}

function extractBalancedObject(text: string, start: number) {
  let depth = 0
  let escaped = false
  let inString = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return value == null ? null : String(value).trim() || null
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const text = asString(entry)
      return text ? [[key, text] as const] : []
    }),
  )
}

function extractStringField(text: string, field: string) {
  const match = text.match(
    new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`),
  )
  if (!match?.[1]) {
    return null
  }

  try {
    return JSON.parse(`"${match[1]}"`) as string
  } catch {
    return match[1]
  }
}

function extractObjectField(text: string, field: string) {
  const fieldMatch = new RegExp(`"${field}"\\s*:`).exec(text)
  if (!fieldMatch) {
    return {}
  }

  const start = text.indexOf('{', fieldMatch.index + fieldMatch[0].length)
  if (start < 0) {
    return {}
  }

  const objectText = extractBalancedObject(text, start)
  if (!objectText) {
    return {}
  }

  try {
    const parsed = JSON.parse(objectText) as unknown
    return asStringRecord(parsed)
  } catch {
    return {}
  }
}

function parseHonnojiJudgeDecision(raw: string): JudgeDecisionSummary {
  const stripped = stripMarkdownCodeFence(raw)
  const firstObjectStart = stripped.indexOf('{')
  const objectText =
    firstObjectStart >= 0
      ? extractBalancedObject(stripped, firstObjectStart)
      : null

  if (!objectText) {
    return {
      judgment: null,
      parseError: 'No JSON object found in judge decision',
      policyWinner: 'unknown',
      requests: {},
    }
  }

  try {
    const parsed = JSON.parse(objectText) as unknown
    if (!isRecord(parsed)) {
      return {
        judgment: null,
        parseError: 'Judge decision JSON is not an object',
        policyWinner: 'unknown',
        requests: {},
      }
    }

    const judgment = asString(parsed.judgment)
    const policyWinner =
      judgment === '袭击本能寺'
        ? 'a'
        : judgment === '西进毛利'
          ? 'b'
          : 'unknown'

    return {
      judgment,
      parseError: judgment ? null : 'Judge decision has no judgment field',
      policyWinner,
      requests: asStringRecord(parsed.requests),
    }
  } catch (error) {
    const judgment = extractStringField(stripped, 'judgment')
    const requests = extractObjectField(stripped, 'requests')
    const policyWinner =
      judgment === '袭击本能寺'
        ? 'a'
        : judgment === '西进毛利'
          ? 'b'
          : 'unknown'

    if (judgment || Object.keys(requests).length > 0) {
      return {
        judgment,
        parseError: judgment ? null : 'Judge decision has no judgment field',
        policyWinner,
        requests,
      }
    }

    return {
      judgment: null,
      parseError: error instanceof Error ? error.message : String(error),
      policyWinner: 'unknown',
      requests: {},
    }
  }
}

function reparseExistingResult(result: JudgeBenchResult): JudgeBenchResult {
  if (result.status !== 'ok' || !result.judgeDecision) {
    return result
  }

  const parsed = parseHonnojiJudgeDecision(result.judgeDecision)

  return {
    ...result,
    judgment: parsed.judgment,
    judgmentParseError: parsed.parseError,
    policyWinner: parsed.policyWinner,
    requestDecisions: parsed.requests,
  }
}

function comparePolicy(left: PolicyWinner, right: PolicyWinner) {
  return left === 'unknown' || right === 'unknown' ? null : left === right
}

function compareScore(left: MatchWinner, right: MatchWinner) {
  return left == null || right == null ? null : left === right
}

async function runOneJob(params: {
  job: JudgeBenchJob
  jobTimeoutMs: number
  runId: string
  scenario: ScenarioSnapshot
  sourceRunId: string
  pairsById: Map<string, CharacterPair>
}) {
  const startedAt = Date.now()
  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort(
      `Judge benchmark job timed out after ${params.jobTimeoutMs}ms`,
    )
  }, params.jobTimeoutMs)
  const sourcePairId = params.job.source.characterPair.id
  const pair = params.pairsById.get(sourcePairId)
  if (!pair) {
    clearTimeout(timeout)
    throw new Error(`Missing inventory character pair ${sourcePairId}`)
  }
  const scenario = scenarioForPair({
    judgeModel: params.job.judgeModel,
    pair,
    scenario: params.scenario,
  })

  try {
    const examinationA = params.job.source.judgeTranscriptA ?? []
    const examinationB = params.job.source.judgeTranscriptB ?? []
    const debate = formatDebateTranscriptForJudge(
      scenario,
      params.job.source.infoAssignment,
      params.job.source.transcript ?? [],
    )
    const judgePrompt = buildJudgePrompt(
      scenario,
      params.job.source.infoAssignment,
      {
        debate,
        examinationA: buildExaminationSummary(scenario.roleAName, examinationA),
        examinationB: buildExaminationSummary(scenario.roleBName, examinationB),
      },
    )

    const judgeDecision = (
      await chatCompletion({
        messages: [{ role: 'user', content: '请做出你的裁决。' }],
        model: params.job.judgeModel,
        signal: abortController.signal,
        systemPrompt: judgePrompt,
        temperature: 0,
        trace: {
          attempt: 1,
          benchmarkCaseId: params.job.id,
          benchmarkName: BENCHMARK_NAME,
          benchmarkRunId: params.runId,
          phase: 'judgment',
          scenarioId: HONNOJI_SCENARIO_ID,
          side: 'judge',
          turnIndex: params.job.source.transcript?.length ?? null,
        },
      })
    ).trim()

    clearTimeout(timeout)
    const parsed = parseHonnojiJudgeDecision(judgeDecision)
    const score = computeProgrammaticScore({
      assignment: params.job.source.infoAssignment,
      examinationA,
      examinationB,
      judgeOutput: judgeDecision,
      scenario,
    })

    if (!score) {
      throw new Error('Programmatic scorer did not return a Honnoji score')
    }

    const policyAgreesWithBaseline = comparePolicy(
      parsed.policyWinner,
      params.job.source.policyWinner,
    )
    const scoreAgreesWithBaseline = compareScore(
      score.winner,
      params.job.source.winner,
    )

    return {
      attackSampleId: params.job.source.attackSampleId,
      baseline: {
        judgeDecision: params.job.source.judgeDecision,
        judgeModel: params.job.source.models.judge ?? null,
        judgment: params.job.source.judgment,
        policyWinner: params.job.source.policyWinner,
        scoreA: params.job.source.scoreA,
        scoreB: params.job.source.scoreB,
        scoreWinner: params.job.source.winner,
      },
      characterPair: pairIdentity(pair),
      defenseSampleId: params.job.source.defenseSampleId,
      durationMs: Date.now() - startedAt,
      error: null,
      generatedAt: new Date().toISOString(),
      infoAssignment: params.job.source.infoAssignment,
      jobId: params.job.id,
      judgeDecision,
      judgeModel: params.job.judgeModel,
      judgment: parsed.judgment,
      judgmentParseError: parsed.parseError,
      langfuseSessionId: `benchmark:${params.runId}`,
      models: {
        agentA: params.job.source.models.agentA,
        agentB: params.job.source.models.agentB,
        baselineJudge: params.job.source.models.judge ?? null,
        judge: params.job.judgeModel,
      },
      policyAgreesWithBaseline,
      policyWinner: parsed.policyWinner,
      repeatIndex: params.job.repeatIndex,
      requestDecisions: parsed.requests,
      scoreA: score.scoreA,
      scoreAgreesWithBaseline,
      scoreB: score.scoreB,
      scorerReasoning: score.reasoning,
      sourceJobId: params.job.source.jobId,
      sourceRunId: params.sourceRunId,
      status: 'ok',
      trueRequestPairId: params.job.source.trueRequestPairId,
      winner: score.winner,
    } satisfies JudgeBenchResult
  } catch (error) {
    clearTimeout(timeout)

    return {
      attackSampleId: params.job.source.attackSampleId,
      baseline: {
        judgeDecision: params.job.source.judgeDecision,
        judgeModel: params.job.source.models.judge ?? null,
        judgment: params.job.source.judgment,
        policyWinner: params.job.source.policyWinner,
        scoreA: params.job.source.scoreA,
        scoreB: params.job.source.scoreB,
        scoreWinner: params.job.source.winner,
      },
      characterPair: pairIdentity(pair),
      defenseSampleId: params.job.source.defenseSampleId,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      generatedAt: new Date().toISOString(),
      infoAssignment: params.job.source.infoAssignment,
      jobId: params.job.id,
      judgeDecision: null,
      judgeModel: params.job.judgeModel,
      judgment: null,
      judgmentParseError: null,
      langfuseSessionId: `benchmark:${params.runId}`,
      models: {
        agentA: params.job.source.models.agentA,
        agentB: params.job.source.models.agentB,
        baselineJudge: params.job.source.models.judge ?? null,
        judge: params.job.judgeModel,
      },
      policyAgreesWithBaseline: null,
      policyWinner: 'unknown',
      repeatIndex: params.job.repeatIndex,
      requestDecisions: {},
      scoreA: null,
      scoreAgreesWithBaseline: null,
      scoreB: null,
      scorerReasoning: null,
      sourceJobId: params.job.source.jobId,
      sourceRunId: params.sourceRunId,
      status: 'error',
      trueRequestPairId: params.job.source.trueRequestPairId,
      winner: null,
    } satisfies JudgeBenchResult
  }
}

function emptyPairAggregate(pair: CharacterPair): PairAggregate {
  return {
    completed: 0,
    errored: 0,
    pairId: pair.id,
    policyAgreements: 0,
    policyComparable: 0,
    policyAssassinationWins: 0,
    policyAvoidWins: 0,
    policyUnknown: 0,
    roleAName: pair.roleAName,
    roleAOptionId: pair.roleAOptionId,
    roleBName: pair.roleBName,
    roleBOptionId: pair.roleBOptionId,
    scoreAgreements: 0,
    scoreComparable: 0,
    scoreAssassinationWins: 0,
    scoreAvoidWins: 0,
    scoreDraws: 0,
    total: 0,
  }
}

function emptyModelAggregate(
  pairs: readonly CharacterPair[],
  totalJobs: number,
): ModelAggregate {
  return {
    avgDurationMs: null,
    byPair: Object.fromEntries(
      pairs.map((pair) => [pair.id, emptyPairAggregate(pair)]),
    ) as Record<string, PairAggregate>,
    completed: 0,
    errored: 0,
    parseErrors: 0,
    policyAgreements: 0,
    policyComparable: 0,
    policyAgreementRate: null,
    policyAssassinationWins: 0,
    policyAvoidWins: 0,
    policyUnknown: 0,
    scoreAgreements: 0,
    scoreComparable: 0,
    scoreAgreementRate: null,
    scoreAssassinationWins: 0,
    scoreAvoidWins: 0,
    scoreDraws: 0,
    totalJobs,
  }
}

function summarizeResults(
  results: JudgeBenchResult[],
  params: {
    characterPairs: readonly CharacterPair[]
    judgeModels: readonly EvaluationModelId[]
    sourceHistories: number
    totalJobs: number
  },
) {
  const byJudgeModel = Object.fromEntries(
    params.judgeModels.map((model) => [
      model,
      emptyModelAggregate(params.characterPairs, params.sourceHistories),
    ]),
  ) as Record<string, ModelAggregate>

  for (const result of results) {
    const aggregate =
      byJudgeModel[result.judgeModel] ??
      (byJudgeModel[result.judgeModel] = emptyModelAggregate(
        params.characterPairs,
        0,
      ))
    const pair =
      aggregate.byPair[result.characterPair.id] ??
      (aggregate.byPair[result.characterPair.id] = {
        ...emptyPairAggregate({
          ...result.characterPair,
          roleARequests: [],
          roleBRequests: [],
        }),
      })

    pair.total += 1

    if (result.status === 'ok') {
      aggregate.completed += 1
      pair.completed += 1
    } else {
      aggregate.errored += 1
      pair.errored += 1
      continue
    }

    if (result.judgmentParseError) {
      aggregate.parseErrors += 1
    }

    if (result.policyWinner === 'a') {
      aggregate.policyAssassinationWins += 1
      pair.policyAssassinationWins += 1
    } else if (result.policyWinner === 'b') {
      aggregate.policyAvoidWins += 1
      pair.policyAvoidWins += 1
    } else {
      aggregate.policyUnknown += 1
      pair.policyUnknown += 1
    }

    if (result.winner === 'a') {
      aggregate.scoreAssassinationWins += 1
      pair.scoreAssassinationWins += 1
    } else if (result.winner === 'b') {
      aggregate.scoreAvoidWins += 1
      pair.scoreAvoidWins += 1
    } else if (result.winner === 'draw') {
      aggregate.scoreDraws += 1
      pair.scoreDraws += 1
    }

    if (result.policyAgreesWithBaseline != null) {
      aggregate.policyComparable += 1
      pair.policyComparable += 1
      if (result.policyAgreesWithBaseline) {
        aggregate.policyAgreements += 1
        pair.policyAgreements += 1
      }
    }

    if (result.scoreAgreesWithBaseline != null) {
      aggregate.scoreComparable += 1
      pair.scoreComparable += 1
      if (result.scoreAgreesWithBaseline) {
        aggregate.scoreAgreements += 1
        pair.scoreAgreements += 1
      }
    }
  }

  for (const [model, aggregate] of Object.entries(byJudgeModel)) {
    const completed = results.filter(
      (result) => result.status === 'ok' && result.judgeModel === model,
    )

    aggregate.avgDurationMs =
      completed.length === 0
        ? null
        : Math.round(
            completed.reduce((sum, result) => sum + result.durationMs, 0) /
              completed.length,
          )
    aggregate.policyAgreementRate =
      aggregate.policyComparable === 0
        ? null
        : aggregate.policyAgreements / aggregate.policyComparable
    aggregate.scoreAgreementRate =
      aggregate.scoreComparable === 0
        ? null
        : aggregate.scoreAgreements / aggregate.scoreComparable
  }

  return {
    byJudgeModel,
    completed: results.filter((result) => result.status === 'ok').length,
    errored: results.filter((result) => result.status === 'error').length,
    parseErrors: results.filter((result) => result.judgmentParseError).length,
    sourceHistories: params.sourceHistories,
    totalJobs: params.totalJobs,
  }
}

function sortResults(results: JudgeBenchResult[]) {
  return [...results].sort((left, right) => {
    return (
      left.judgeModel.localeCompare(right.judgeModel) ||
      left.sourceJobId.localeCompare(right.sourceJobId) ||
      left.repeatIndex - right.repeatIndex
    )
  })
}

async function writeArtifacts(params: {
  characterPairs: readonly CharacterPair[]
  config: JudgeBenchmarkConfig
  judgeModels: readonly EvaluationModelId[]
  results: JudgeBenchResult[]
  sourceHistories: number
  totalJobs: number
}) {
  await mkdir(params.config.outputDir, { recursive: true })
  const sortedResults = sortResults(params.results)
  const report: JudgeBenchmarkReport = {
    config: params.config,
    generatedAt: new Date().toISOString(),
    kind: 'honnoji.judge_model_results',
    results: sortedResults,
    summary: summarizeResults(sortedResults, {
      characterPairs: params.characterPairs,
      judgeModels: params.judgeModels,
      sourceHistories: params.sourceHistories * params.config.repeats,
      totalJobs: params.totalJobs,
    }),
  }

  await writeFile(
    join(params.config.outputDir, 'config.json'),
    `${JSON.stringify(params.config, null, 2)}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'results.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'summary.md'),
    renderSummary(report),
  )
  await writeFile(
    join(params.config.outputDir, 'index.html'),
    renderHtml(report),
  )
}

function pct(numerator: number, denominator: number) {
  return denominator === 0
    ? 'n/a'
    : `${((numerator / denominator) * 100).toFixed(1)}%`
}

function pctValue(value: number | null) {
  return value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`
}

function avgMs(value: number | null) {
  return value == null ? 'n/a' : `${value}ms`
}

function modelName(modelId: string) {
  return `${resolveModelLabel(modelId)} (${modelId})`
}

function renderSummary(report: JudgeBenchmarkReport) {
  const lines = [
    '# Honnoji Judge-Model Benchmark',
    '',
    `Generated: ${report.generatedAt}`,
    `Run ID: ${report.config.runId}`,
    `Source run: ${report.config.sourceRunId}`,
    `Source histories: ${report.summary.sourceHistories}`,
    `Judge models: ${report.config.judgeModels.map((model) => model.id).join(', ')}`,
    `Jobs: ${report.summary.completed}/${report.summary.totalJobs} completed, ${report.summary.errored} errored, ${report.summary.parseErrors} parse errors`,
    '',
    'A camp is the assassination side: 光秀袭击本能寺. B camp is the avoid-assassination side: 光秀西进毛利.',
    '',
    '## Model Summary',
    '',
    '| Judge model | Jobs | Errors | Parse errors | Policy A wins | Policy B wins | Policy unknown | Score A wins | Score B wins | Draws | Policy agreement | Score agreement | Avg duration |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const model of report.config.judgeModels) {
    const row =
      report.summary.byJudgeModel[model.id] ??
      emptyModelAggregate([], 0)
    lines.push(
      `| ${modelName(model.id)} | ${row.completed}/${row.totalJobs} | ${row.errored} | ${row.parseErrors} | ${row.policyAssassinationWins} | ${row.policyAvoidWins} | ${row.policyUnknown} | ${row.scoreAssassinationWins} | ${row.scoreAvoidWins} | ${row.scoreDraws} | ${pctValue(row.policyAgreementRate)} | ${pctValue(row.scoreAgreementRate)} | ${avgMs(row.avgDurationMs)} |`,
    )
  }

  lines.push(
    '',
    '## Pair Results By Model',
    '',
    '| Judge model | Pair | Completed | Errors | Policy A wins | Policy B wins | Policy unknown | Policy A rate | Policy B rate | Score A wins | Score B wins | Draws | Score A rate | Score B rate |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  )

  for (const model of report.config.judgeModels) {
    const aggregate =
      report.summary.byJudgeModel[model.id] ?? emptyModelAggregate([], 0)

    for (const pair of Object.values(aggregate.byPair)) {
      const label = `${pair.roleAName} vs ${pair.roleBName}`
      lines.push(
        `| ${model.id} | ${label} | ${pair.completed} | ${pair.errored} | ${pair.policyAssassinationWins} | ${pair.policyAvoidWins} | ${pair.policyUnknown} | ${pct(pair.policyAssassinationWins, pair.completed)} | ${pct(pair.policyAvoidWins, pair.completed)} | ${pair.scoreAssassinationWins} | ${pair.scoreAvoidWins} | ${pair.scoreDraws} | ${pct(pair.scoreAssassinationWins, pair.completed)} | ${pct(pair.scoreAvoidWins, pair.completed)} |`,
      )
    }
  }

  lines.push('')

  return `${lines.join('\n')}\n`
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderHtml(report: JudgeBenchmarkReport) {
  const summaryRows = report.config.judgeModels
    .map((model) => {
      const row =
        report.summary.byJudgeModel[model.id] ?? emptyModelAggregate([], 0)
      return `<tr><td>${escapeHtml(modelName(model.id))}</td><td>${row.completed}/${row.totalJobs}</td><td>${row.errored}</td><td>${row.parseErrors}</td><td>${row.policyAssassinationWins}</td><td>${row.policyAvoidWins}</td><td>${row.policyUnknown}</td><td>${row.scoreAssassinationWins}</td><td>${row.scoreAvoidWins}</td><td>${row.scoreDraws}</td><td>${pctValue(row.policyAgreementRate)}</td><td>${pctValue(row.scoreAgreementRate)}</td><td>${avgMs(row.avgDurationMs)}</td></tr>`
    })
    .join('\n')

  const pairRows = report.config.judgeModels
    .flatMap((model) => {
      const aggregate =
        report.summary.byJudgeModel[model.id] ?? emptyModelAggregate([], 0)
      return Object.values(aggregate.byPair).map((pair) => {
        const label = `${pair.roleAName} vs ${pair.roleBName}`
        return `<tr><td>${escapeHtml(model.id)}</td><td>${escapeHtml(label)}</td><td>${pair.completed}</td><td>${pair.errored}</td><td>${pair.policyAssassinationWins}</td><td>${pair.policyAvoidWins}</td><td>${pair.policyUnknown}</td><td>${pct(pair.policyAssassinationWins, pair.completed)}</td><td>${pct(pair.policyAvoidWins, pair.completed)}</td><td>${pair.scoreAssassinationWins}</td><td>${pair.scoreAvoidWins}</td><td>${pair.scoreDraws}</td><td>${pct(pair.scoreAssassinationWins, pair.completed)}</td><td>${pct(pair.scoreAvoidWins, pair.completed)}</td></tr>`
      })
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Honnoji Judge-Model Benchmark</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #111827; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 32px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Honnoji Judge-Model Benchmark</h1>
  <p>Run <code>${escapeHtml(report.config.runId)}</code>. Source run <code>${escapeHtml(report.config.sourceRunId)}</code>.</p>
  <p>${report.summary.completed}/${report.summary.totalJobs} jobs completed; ${report.summary.errored} errored; ${report.summary.parseErrors} parse errors.</p>
  <h2>Model Summary</h2>
  <table>
    <thead><tr><th>Judge model</th><th>Jobs</th><th>Errors</th><th>Parse errors</th><th>Policy A wins</th><th>Policy B wins</th><th>Policy unknown</th><th>Score A wins</th><th>Score B wins</th><th>Draws</th><th>Policy agreement</th><th>Score agreement</th><th>Avg duration</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>
  <h2>Pair Results By Model</h2>
  <table>
    <thead><tr><th>Judge model</th><th>Pair</th><th>Completed</th><th>Errors</th><th>Policy A wins</th><th>Policy B wins</th><th>Policy unknown</th><th>Policy A rate</th><th>Policy B rate</th><th>Score A wins</th><th>Score B wins</th><th>Draws</th><th>Score A rate</th><th>Score B rate</th></tr></thead>
    <tbody>${pairRows}</tbody>
  </table>
  <p>Raw data is in <code>results.json</code>.</p>
</body>
</html>
`
}

async function workerPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (index < items.length) {
        const current = items[index]
        index += 1
        await worker(current!)
      }
    },
  )

  await Promise.all(workers)
}

async function readExistingResults(outputDir: string) {
  const resultsPath = join(outputDir, 'results.json')
  if (!existsSync(resultsPath)) {
    return []
  }

  const report = await readJsonFile<JudgeBenchmarkReport>(resultsPath)
  return report.results
}

function buildJobs(params: {
  judgeModels: readonly EvaluationModelId[]
  repeats: number
  sourceResults: SourceBenchResult[]
}) {
  const jobs: JudgeBenchJob[] = []

  for (const source of params.sourceResults) {
    for (const judgeModel of params.judgeModels) {
      for (let repeatIndex = 1; repeatIndex <= params.repeats; repeatIndex++) {
        jobs.push({
          id: `${source.jobId}__${judgeModel}__r${repeatIndex}`.replace(
            /[^A-Za-z0-9_.:-]+/g,
            '-',
          ),
          judgeModel,
          repeatIndex,
          source,
        })
      }
    }
  }

  return jobs
}

function filterSourceResults(
  report: SourceWinRateReport,
  limitHistories: number | null,
) {
  const usable = report.results.filter(
    (result) =>
      result.status === 'ok' &&
      result.transcript &&
      result.transcript.length > 0 &&
      result.judgeTranscriptA &&
      result.judgeTranscriptB,
  )

  return limitHistories == null ? usable : usable.slice(0, limitHistories)
}

async function run() {
  const { command, options } = parseArgs()

  if (options.help || command === 'help') {
    usage()
    return
  }

  if (command !== 'run') {
    throw new Error(`Unknown command: ${command}`)
  }

  process.env.AXIIA_DISABLE_LLM_CALL_PERSISTENCE ??= '1'

  const inputPath =
    getStringOption(options, 'input') ?? (await findDefaultInputPath())
  const sourceReport = await readJsonFile<SourceWinRateReport>(inputPath)
  if (sourceReport.kind !== 'honnoji.win_rate_results') {
    throw new Error(`Input is not Honnoji win-rate results: ${inputPath}`)
  }

  const inventoryPath =
    getStringOption(options, 'inventory') ??
    sourceReport.config.inventoryPath ??
    DEFAULT_INVENTORY_PATH
  const inventory = await readJsonFile<PromptInventory>(inventoryPath)
  if (inventory.kind !== 'honnoji.prompt_inventory') {
    throw new Error(
      `Inventory is not honnoji.prompt_inventory: ${inventoryPath}`,
    )
  }

  const judgeModels = parseJudgeModels(
    getStringOption(options, 'judge-models') ??
      getStringOption(options, 'models'),
  )
  const concurrency = parsePositiveInteger(
    getStringOption(options, 'concurrency'),
    'concurrency',
    DEFAULT_CONCURRENCY,
  )
  const repeats = parsePositiveInteger(
    getStringOption(options, 'repeats'),
    'repeats',
    1,
  )
  const jobTimeoutMs = parsePositiveInteger(
    getStringOption(options, 'job-timeout-ms'),
    'job-timeout-ms',
    DEFAULT_JOB_TIMEOUT_MS,
  )
  const limitHistories =
    options.limit == null
      ? null
      : parsePositiveInteger(getStringOption(options, 'limit'), 'limit', 0)

  const sourceResults = filterSourceResults(sourceReport, limitHistories)
  const sourcePairIds = uniqueValues(
    sourceResults.map((result) => result.characterPair.id),
  )
  const pairsById = new Map(
    inventory.characterPairs.map((pair) => [pair.id, pair]),
  )
  const characterPairs = sourcePairIds.map((id) => {
    const pair = pairsById.get(id)
    if (!pair) {
      throw new Error(`Inventory missing character pair used by source: ${id}`)
    }
    return pair
  })
  const runId =
    getStringOption(options, 'run-id') ??
    `${BENCHMARK_NAME}-${timestampForRunId()}`
  const outputDir =
    getStringOption(options, 'output-dir') ?? join(DEFAULT_RUNS_DIR, runId)
  const config: JudgeBenchmarkConfig = {
    concurrency,
    dryRun: Boolean(options['dry-run']),
    inputPath,
    inventoryPath,
    jobTimeoutMs,
    judgeModels: judgeModels.map(modelSummary),
    limitHistories,
    outputDir,
    repeats,
    resume: Boolean(options.resume),
    runId,
    scenarioId: HONNOJI_SCENARIO_ID,
    scenarioSnapshotHash:
      inventory.scenario.scenarioSnapshotHash ?? sha256(inventory.scenario),
    sourceJudgeModel: sourceReport.config.judgeModel ?? null,
    sourceRunId: sourceReport.config.runId ?? basename(inputPath),
  }

  const jobs = buildJobs({
    judgeModels,
    repeats,
    sourceResults,
  })
  let results = options.resume ? await readExistingResults(outputDir) : []
  results = results.map(reparseExistingResult)
  const completed = new Set(
    results
      .filter((result) => result.status === 'ok')
      .map((result) => result.jobId),
  )
  const pendingJobs = jobs.filter((job) => !completed.has(job.id))

  await writeArtifacts({
    characterPairs,
    config,
    judgeModels,
    results,
    sourceHistories: sourceResults.length,
    totalJobs: jobs.length,
  })

  console.log(
    JSON.stringify(
      {
        dryRun: config.dryRun,
        judgeModels,
        outputDir,
        pendingJobs: pendingJobs.length,
        runId,
        sourceHistories: sourceResults.length,
        totalJobs: jobs.length,
      },
      null,
      2,
    ),
  )

  if (config.dryRun) {
    return
  }

  await workerPool(pendingJobs, concurrency, async (job) => {
    console.log(`[honnoji-judge-bench] ${job.id}`)
    const result = await runOneJob({
      job,
      jobTimeoutMs,
      pairsById,
      runId,
      scenario: inventory.scenario,
      sourceRunId: config.sourceRunId,
    })
    results = [...results.filter((item) => item.jobId !== result.jobId), result]
    await writeArtifacts({
      characterPairs,
      config,
      judgeModels,
      results,
      sourceHistories: sourceResults.length,
      totalJobs: jobs.length,
    })
    console.log(
      `[honnoji-judge-bench] -> ${result.status} ${result.durationMs}ms ${result.error ?? ''}`.trim(),
    )
  })
}

await run()
