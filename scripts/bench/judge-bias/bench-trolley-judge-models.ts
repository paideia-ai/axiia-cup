import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import {
  evaluationModelIds,
  getModelDefinition,
  resolveModelLabel,
  TROLLEY_SCENARIO_ID,
  trolleyCases,
  type EvaluationModelId,
  type InfoAssignment,
  type TranscriptTurn,
} from '../../../packages/shared/src'
import type { ScenarioRecord } from '../../../apps/api/src/db/schema'
import {
  buildJudgePrompt,
  formatDebateTranscriptForJudge,
} from '../../../apps/api/src/engine/core'
import { chatCompletion } from '../../../apps/api/src/engine/llm'

const BENCHMARK_NAME = 'trolley-judge-models'
const DEFAULT_RUNS_DIR = 'docs/bench/judge-bias/runs/trolley'
const DEFAULT_INVENTORY_PATH =
  'docs/bench/inputs/user-prompt-samples/trolley/inventory.json'
const DEFAULT_CONCURRENCY = 8
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

type SideWinner = 'a' | 'b' | 'unknown'
type MatchWinner = 'a' | 'b' | 'draw' | null

type ScenarioSnapshot = Pick<
  ScenarioRecord,
  | 'agentPromptTemplate'
  | 'examinationQuestionTemplate'
  | 'falseInfoCount'
  | 'id'
  | 'judgeModel'
  | 'judgePrompt'
  | 'openingLine'
  | 'roleAHiddenInfo'
  | 'roleAName'
  | 'roleAOptions'
  | 'roleARequests'
  | 'roleBHiddenInfo'
  | 'roleBName'
  | 'roleBOptions'
  | 'roleBRequests'
  | 'scorerModel'
  | 'scorerPrompt'
  | 'subject'
  | 'title'
  | 'trueRequestCount'
  | 'turnCount'
> & { judgeOsPrompt?: string }

type PromptInventory = {
  kind: 'trolley.prompt_inventory'
  scenario: ScenarioSnapshot & {
    judgePromptHash?: string
    scenarioSnapshotHash?: string
  }
}

type SourceMiniCase = {
  caseId: string
  judgment: string | null
  winner: SideWinner
}

type SourceBenchResult = {
  caseSet: string
  error: string | null
  fiveSampleId: string
  jobId: string
  judgeDecision: string | null
  judgmentParseError: string | null
  judgments: Record<string, string>
  miniCases: SourceMiniCase[]
  models: {
    agentA: string
    agentB: string
    judge: string
  }
  oneSampleId: string
  scoreA: number | null
  scoreB: number | null
  selectedCaseIds: string[]
  status: 'error' | 'ok'
  transcript: TranscriptTurn[] | null
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
  kind: 'trolley.win_rate_results'
  results: SourceBenchResult[]
}

type JudgeBenchJob = {
  id: string
  judgeModel: EvaluationModelId
  repeatIndex: number
  source: SourceBenchResult
}

type JudgeMiniCaseObservation = {
  agreesWithBaseline: boolean | null
  baselineWinner: SideWinner | null
  caseId: string
  judgment: string | null
  winner: SideWinner
}

type JudgeBenchResult = {
  baseline: {
    agreedMiniCases: number
    comparableMiniCases: number
    judgeModel: string | null
    scoreA: number | null
    scoreB: number | null
    winner: MatchWinner
  }
  caseSet: string
  durationMs: number
  error: string | null
  fiveSampleId: string
  generatedAt: string
  jobId: string
  judgeDecision: string | null
  judgeModel: EvaluationModelId
  judgmentParseError: string | null
  judgments: Record<string, string>
  langfuseSessionId: string
  miniCases: JudgeMiniCaseObservation[]
  oneSampleId: string
  repeatIndex: number
  scoreA: number | null
  scoreB: number | null
  selectedCaseIds: string[]
  sourceJobId: string
  sourceRunId: string
  status: 'error' | 'ok'
  winner: MatchWinner
}

type ModelConfigSummary = {
  apiModel: string
  gatewayProvider: string
  id: EvaluationModelId
  label: string
  underlyingProvider: string
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

type ModelAggregate = {
  avgDurationMs: number | null
  baselineAgreementRate: number | null
  baselineAgreements: number
  baselineComparableMiniCases: number
  byMiniCase: Record<
    string,
    {
      fiveWins: number
      oneWins: number
      total: number
      unknown: number
    }
  >
  completed: number
  errored: number
  fiveCaseWins: number
  fiveMatchWins: number
  oneCaseWins: number
  oneMatchWins: number
  parseErrors: number
  totalCaseJudgments: number
  totalJobs: number
  unknownCaseWins: number
  winnerDraws: number
}

type JudgeBenchmarkReport = {
  config: JudgeBenchmarkConfig
  generatedAt: string
  kind: 'trolley.judge_model_results'
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
  bun scripts/bench/judge-bias/bench-trolley-judge-models.ts run [options]

Options:
  --input <path>             Source trolley win-rate results.json.
                             Defaults to the newest non-smoke trolley-win-rate run.
  --inventory <path>         Prompt inventory with scenario snapshot.
                             Defaults to ${DEFAULT_INVENTORY_PATH}.
  --output-dir <path>        Output directory. Defaults to ${DEFAULT_RUNS_DIR}/<run-id>.
  --run-id <id>              Benchmark run id.
  --judge-models <ids>       Comma-separated evaluation model ids, or "frontier"/"all".
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

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

async function findDefaultInputPath() {
  const entries = await readdir(DEFAULT_RUNS_DIR, { withFileTypes: true })
  const candidates = entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith('trolley-win-rate-') &&
        !entry.name.includes('smoke'),
    )
    .map((entry) => entry.name)
    .sort()
    .reverse()

  for (const name of candidates) {
    const path = join(DEFAULT_RUNS_DIR, name, 'results.json')
    if (existsSync(path)) {
      return path
    }
  }

  throw new Error(
    `No non-smoke trolley-win-rate results.json found under ${DEFAULT_RUNS_DIR}; pass --input`,
  )
}

function validateEvaluationModel(value: string): value is EvaluationModelId {
  return (evaluationModelIds as readonly string[]).includes(value)
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)]
}

function parseJudgeModels(value: string | undefined): EvaluationModelId[] {
  if (!value || value === 'frontier') {
    return [...DEFAULT_FRONTIER_JUDGE_MODELS]
  }

  if (value === 'all') {
    return [...evaluationModelIds] as EvaluationModelId[]
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

function scenarioRecordFromSnapshot(
  snapshot: ScenarioSnapshot,
  judgeModel: EvaluationModelId,
): ScenarioRecord {
  return {
    ...snapshot,
    createdAt: '',
    judgeModel,
    judgeOsPrompt: snapshot.judgeOsPrompt ?? '',
  }
}

function trolleyAssignment(selectedCaseIds: string[]): InfoAssignment {
  return {
    roleAFalseInfoIds: [],
    roleATrueRequestIds: [],
    roleBFalseInfoIds: [],
    roleBTrueRequestIds: [],
    selectedCaseIds,
  }
}

function buildExaminationSummary(roleName: string) {
  return `【${roleName}】未完成问询。`
}

function stripMarkdownCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function extractBalancedObject(text: string, start: number) {
  let depth = 0
  let inString = false
  let escaped = false

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

function parseJsonRecord(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown

    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function asString(value: unknown) {
  if (value == null) {
    return null
  }

  return String(value).trim() || null
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
  const parsed = objectText ? parseJsonRecord(objectText) : null

  return asStringRecord(parsed)
}

function parseJudgeJudgments(raw: string) {
  const stripped = stripMarkdownCodeFence(raw)
  const firstObjectStart = stripped.indexOf('{')
  const objectText =
    firstObjectStart >= 0
      ? extractBalancedObject(stripped, firstObjectStart)
      : null

  if (!objectText) {
    const judgments = extractObjectField(stripped, 'judgments')

    return {
      error:
        Object.keys(judgments).length > 0
          ? null
          : 'No JSON object found in judge decision',
      judgments,
    }
  }

  try {
    const parsed = parseJsonRecord(objectText)

    if (!parsed) {
      const judgments = extractObjectField(stripped, 'judgments')
      return {
        error:
          Object.keys(judgments).length > 0
            ? null
            : 'Judge decision JSON is not an object',
        judgments,
      }
    }

    const judgments = parsed.judgments
    if (
      !judgments ||
      typeof judgments !== 'object' ||
      Array.isArray(judgments)
    ) {
      const fallbackJudgments = extractObjectField(stripped, 'judgments')
      return {
        error:
          Object.keys(fallbackJudgments).length > 0
            ? null
            : 'Judge decision has no judgments object',
        judgments: fallbackJudgments,
      }
    }

    return {
      error: null,
      judgments: asStringRecord(judgments),
    }
  } catch (error) {
    const judgments = extractObjectField(stripped, 'judgments')

    return {
      error:
        Object.keys(judgments).length > 0
          ? null
          : error instanceof Error
            ? error.message
            : String(error),
      judgments,
    }
  }
}

function normalizeJudgmentWinner(judgment: string | null): SideWinner {
  if (judgment === '一人侧') {
    return 'a'
  }

  if (judgment === '五人侧') {
    return 'b'
  }

  return 'unknown'
}

function baselineWinnerForCase(source: SourceBenchResult, caseId: string) {
  return source.miniCases.find((item) => item.caseId === caseId)?.winner ?? null
}

function scoreJudgments(
  selectedCaseIds: string[],
  judgments: Record<string, string>,
  source: SourceBenchResult,
) {
  let scoreA = 0
  let scoreB = 0
  let agreedMiniCases = 0
  let comparableMiniCases = 0

  const miniCases = selectedCaseIds.map((caseId) => {
    const judgment = judgments[caseId] ?? null
    const winner = normalizeJudgmentWinner(judgment)
    const baselineWinner = baselineWinnerForCase(source, caseId)
    let agreesWithBaseline: boolean | null = null

    if (
      baselineWinner != null &&
      baselineWinner !== 'unknown' &&
      winner !== 'unknown'
    ) {
      comparableMiniCases += 1
      agreesWithBaseline = winner === baselineWinner
      if (agreesWithBaseline) {
        agreedMiniCases += 1
      }
    }

    if (winner === 'a') {
      scoreA += 1
    } else if (winner === 'b') {
      scoreB += 1
    }

    return {
      agreesWithBaseline,
      baselineWinner,
      caseId,
      judgment,
      winner,
    } satisfies JudgeMiniCaseObservation
  })

  const winner: MatchWinner =
    scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'draw'

  return {
    agreedMiniCases,
    comparableMiniCases,
    miniCases,
    scoreA,
    scoreB,
    winner,
  }
}

function reparseExistingResult(
  result: JudgeBenchResult,
  source: SourceBenchResult | undefined,
) {
  if (result.status !== 'ok' || !result.judgeDecision || !source) {
    return result
  }

  const parsed = parseJudgeJudgments(result.judgeDecision)
  const scored = scoreJudgments(
    result.selectedCaseIds,
    parsed.judgments,
    source,
  )

  return {
    ...result,
    baseline: {
      ...result.baseline,
      agreedMiniCases: scored.agreedMiniCases,
      comparableMiniCases: scored.comparableMiniCases,
    },
    judgmentParseError: parsed.error,
    judgments: parsed.judgments,
    miniCases: scored.miniCases,
    scoreA: scored.scoreA,
    scoreB: scored.scoreB,
    winner: scored.winner,
  } satisfies JudgeBenchResult
}

async function runOneJob(params: {
  job: JudgeBenchJob
  jobTimeoutMs: number
  runId: string
  scenario: ScenarioSnapshot
  sourceRunId: string
}) {
  const startedAt = Date.now()
  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort(
      `Judge benchmark job timed out after ${params.jobTimeoutMs}ms`,
    )
  }, params.jobTimeoutMs)
  const scenario = scenarioRecordFromSnapshot(
    params.scenario,
    params.job.judgeModel,
  )

  try {
    const assignment = trolleyAssignment(params.job.source.selectedCaseIds)
    const debate = formatDebateTranscriptForJudge(
      scenario,
      assignment,
      params.job.source.transcript ?? [],
    )
    const judgePrompt = buildJudgePrompt(scenario, assignment, {
      debate,
      examinationA: buildExaminationSummary(scenario.roleAName),
      examinationB: buildExaminationSummary(scenario.roleBName),
    })

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
          scenarioId: TROLLEY_SCENARIO_ID,
          side: 'judge',
          turnIndex: params.job.source.transcript?.length ?? null,
        },
      })
    ).trim()

    clearTimeout(timeout)
    const parsed = parseJudgeJudgments(judgeDecision)
    const scored = scoreJudgments(
      params.job.source.selectedCaseIds,
      parsed.judgments,
      params.job.source,
    )

    return {
      baseline: {
        agreedMiniCases: scored.agreedMiniCases,
        comparableMiniCases: scored.comparableMiniCases,
        judgeModel: params.job.source.models.judge ?? null,
        scoreA: params.job.source.scoreA,
        scoreB: params.job.source.scoreB,
        winner: params.job.source.winner,
      },
      caseSet: params.job.source.caseSet,
      durationMs: Date.now() - startedAt,
      error: null,
      fiveSampleId: params.job.source.fiveSampleId,
      generatedAt: new Date().toISOString(),
      jobId: params.job.id,
      judgeDecision,
      judgeModel: params.job.judgeModel,
      judgmentParseError: parsed.error,
      judgments: parsed.judgments,
      langfuseSessionId: `benchmark:${params.runId}`,
      miniCases: scored.miniCases,
      oneSampleId: params.job.source.oneSampleId,
      repeatIndex: params.job.repeatIndex,
      scoreA: scored.scoreA,
      scoreB: scored.scoreB,
      selectedCaseIds: params.job.source.selectedCaseIds,
      sourceJobId: params.job.source.jobId,
      sourceRunId: params.sourceRunId,
      status: 'ok',
      winner: scored.winner,
    } satisfies JudgeBenchResult
  } catch (error) {
    clearTimeout(timeout)

    return {
      baseline: {
        agreedMiniCases: 0,
        comparableMiniCases: 0,
        judgeModel: params.job.source.models.judge ?? null,
        scoreA: params.job.source.scoreA,
        scoreB: params.job.source.scoreB,
        winner: params.job.source.winner,
      },
      caseSet: params.job.source.caseSet,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      fiveSampleId: params.job.source.fiveSampleId,
      generatedAt: new Date().toISOString(),
      jobId: params.job.id,
      judgeDecision: null,
      judgeModel: params.job.judgeModel,
      judgmentParseError: null,
      judgments: {},
      langfuseSessionId: `benchmark:${params.runId}`,
      miniCases: params.job.source.selectedCaseIds.map((caseId) => ({
        agreesWithBaseline: null,
        baselineWinner: baselineWinnerForCase(params.job.source, caseId),
        caseId,
        judgment: null,
        winner: 'unknown',
      })),
      oneSampleId: params.job.source.oneSampleId,
      repeatIndex: params.job.repeatIndex,
      scoreA: null,
      scoreB: null,
      selectedCaseIds: params.job.source.selectedCaseIds,
      sourceJobId: params.job.source.jobId,
      sourceRunId: params.sourceRunId,
      status: 'error',
      winner: null,
    } satisfies JudgeBenchResult
  }
}

function emptyByMiniCase(): ModelAggregate['byMiniCase'] {
  return Object.fromEntries(
    trolleyCases.map((item) => [
      item.id,
      { fiveWins: 0, oneWins: 0, total: 0, unknown: 0 },
    ]),
  ) as ModelAggregate['byMiniCase']
}

function emptyAggregate(totalJobs: number): ModelAggregate {
  return {
    avgDurationMs: null,
    baselineAgreementRate: null,
    baselineAgreements: 0,
    baselineComparableMiniCases: 0,
    byMiniCase: emptyByMiniCase(),
    completed: 0,
    errored: 0,
    fiveCaseWins: 0,
    fiveMatchWins: 0,
    oneCaseWins: 0,
    oneMatchWins: 0,
    parseErrors: 0,
    totalCaseJudgments: 0,
    totalJobs,
    unknownCaseWins: 0,
    winnerDraws: 0,
  }
}

function summarizeResults(
  results: JudgeBenchResult[],
  params: {
    judgeModels: readonly EvaluationModelId[]
    sourceHistories: number
    totalJobs: number
  },
) {
  const byJudgeModel = Object.fromEntries(
    params.judgeModels.map((model) => [
      model,
      emptyAggregate(params.sourceHistories),
    ]),
  ) as Record<string, ModelAggregate>

  for (const result of results) {
    const aggregate =
      byJudgeModel[result.judgeModel] ??
      (byJudgeModel[result.judgeModel] = emptyAggregate(0))

    if (result.status === 'ok') {
      aggregate.completed += 1
    } else {
      aggregate.errored += 1
    }

    if (result.judgmentParseError) {
      aggregate.parseErrors += 1
    }

    if (result.winner === 'a') {
      aggregate.oneMatchWins += 1
    } else if (result.winner === 'b') {
      aggregate.fiveMatchWins += 1
    } else if (result.winner === 'draw') {
      aggregate.winnerDraws += 1
    }

    aggregate.baselineAgreements += result.baseline.agreedMiniCases
    aggregate.baselineComparableMiniCases += result.baseline.comparableMiniCases

    for (const observation of result.miniCases) {
      const row = aggregate.byMiniCase[observation.caseId]
      if (!row) {
        continue
      }

      row.total += 1
      aggregate.totalCaseJudgments += 1

      if (observation.winner === 'a') {
        row.oneWins += 1
        aggregate.oneCaseWins += 1
      } else if (observation.winner === 'b') {
        row.fiveWins += 1
        aggregate.fiveCaseWins += 1
      } else {
        row.unknown += 1
        aggregate.unknownCaseWins += 1
      }
    }
  }

  for (const aggregate of Object.values(byJudgeModel)) {
    const completed = results.filter(
      (result) =>
        result.status === 'ok' && byJudgeModel[result.judgeModel] === aggregate,
    )

    aggregate.avgDurationMs =
      completed.length === 0
        ? null
        : Math.round(
            completed.reduce((sum, result) => sum + result.durationMs, 0) /
              completed.length,
          )
    aggregate.baselineAgreementRate =
      aggregate.baselineComparableMiniCases === 0
        ? null
        : aggregate.baselineAgreements / aggregate.baselineComparableMiniCases
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
    kind: 'trolley.judge_model_results',
    results: sortedResults,
    summary: summarizeResults(sortedResults, {
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
    '# Trolley Judge-Model Benchmark',
    '',
    `Generated: ${report.generatedAt}`,
    `Run ID: ${report.config.runId}`,
    `Source run: ${report.config.sourceRunId}`,
    `Source histories: ${report.summary.sourceHistories}`,
    `Judge models: ${report.config.judgeModels.map((model) => model.id).join(', ')}`,
    `Jobs: ${report.summary.completed}/${report.summary.totalJobs} completed, ${report.summary.errored} errored, ${report.summary.parseErrors} parse errors`,
    '',
    '## Model Summary',
    '',
    '| Judge model | Jobs | Errors | Parse errors | One-side match wins | Five-side match wins | Draws | Case one-side wins | Case five-side wins | Unknown cases | Baseline agreement | Avg duration |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const model of report.config.judgeModels) {
    const row = report.summary.byJudgeModel[model.id] ?? emptyAggregate(0)
    lines.push(
      `| ${modelName(model.id)} | ${row.completed}/${row.totalJobs} | ${row.errored} | ${row.parseErrors} | ${row.oneMatchWins} | ${row.fiveMatchWins} | ${row.winnerDraws} | ${row.oneCaseWins} | ${row.fiveCaseWins} | ${row.unknownCaseWins} | ${pctValue(row.baselineAgreementRate)} | ${avgMs(row.avgDurationMs)} |`,
    )
  }

  lines.push(
    '',
    '## Mini-Case Results By Model',
    '',
    '| Judge model | Case | One-side wins | Five-side wins | Unknown | Total | One-side rate | Five-side rate |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  )

  for (const model of report.config.judgeModels) {
    const aggregate = report.summary.byJudgeModel[model.id] ?? emptyAggregate(0)
    for (const item of trolleyCases) {
      const row = aggregate.byMiniCase[item.id] ?? {
        fiveWins: 0,
        oneWins: 0,
        total: 0,
        unknown: 0,
      }
      lines.push(
        `| ${model.id} | ${item.id} ${item.title} | ${row.oneWins} | ${row.fiveWins} | ${row.unknown} | ${row.total} | ${pct(row.oneWins, row.total)} | ${pct(row.fiveWins, row.total)} |`,
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
      const row = report.summary.byJudgeModel[model.id] ?? emptyAggregate(0)
      return `<tr><td>${escapeHtml(modelName(model.id))}</td><td>${row.completed}/${row.totalJobs}</td><td>${row.errored}</td><td>${row.parseErrors}</td><td>${row.oneMatchWins}</td><td>${row.fiveMatchWins}</td><td>${row.winnerDraws}</td><td>${row.oneCaseWins}</td><td>${row.fiveCaseWins}</td><td>${row.unknownCaseWins}</td><td>${pctValue(row.baselineAgreementRate)}</td><td>${avgMs(row.avgDurationMs)}</td></tr>`
    })
    .join('\n')

  const caseRows = report.config.judgeModels
    .flatMap((model) => {
      const aggregate =
        report.summary.byJudgeModel[model.id] ?? emptyAggregate(0)
      return trolleyCases.map((item) => {
        const row = aggregate.byMiniCase[item.id] ?? {
          fiveWins: 0,
          oneWins: 0,
          total: 0,
          unknown: 0,
        }
        return `<tr><td>${escapeHtml(model.id)}</td><td>${escapeHtml(item.id)} ${escapeHtml(item.title)}</td><td>${row.oneWins}</td><td>${row.fiveWins}</td><td>${row.unknown}</td><td>${row.total}</td><td>${pct(row.oneWins, row.total)}</td><td>${pct(row.fiveWins, row.total)}</td></tr>`
      })
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Trolley Judge-Model Benchmark</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #111827; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 32px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Trolley Judge-Model Benchmark</h1>
  <p>Run <code>${escapeHtml(report.config.runId)}</code>. Source run <code>${escapeHtml(report.config.sourceRunId)}</code>.</p>
  <p>${report.summary.completed}/${report.summary.totalJobs} jobs completed; ${report.summary.errored} errored; ${report.summary.parseErrors} parse errors.</p>
  <h2>Model Summary</h2>
  <table>
    <thead><tr><th>Judge model</th><th>Jobs</th><th>Errors</th><th>Parse errors</th><th>One-side match wins</th><th>Five-side match wins</th><th>Draws</th><th>Case one-side wins</th><th>Case five-side wins</th><th>Unknown cases</th><th>Baseline agreement</th><th>Avg duration</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>
  <h2>Mini-Case Results By Model</h2>
  <table>
    <thead><tr><th>Judge model</th><th>Case</th><th>One-side wins</th><th>Five-side wins</th><th>Unknown</th><th>Total</th><th>One-side rate</th><th>Five-side rate</th></tr></thead>
    <tbody>${caseRows}</tbody>
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
          id: `${source.jobId}__${judgeModel}__r${repeatIndex}`,
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
      result.selectedCaseIds.length > 0,
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
  if (sourceReport.kind !== 'trolley.win_rate_results') {
    throw new Error(`Input is not trolley win-rate results: ${inputPath}`)
  }

  const inventoryPath =
    getStringOption(options, 'inventory') ??
    sourceReport.config.inventoryPath ??
    DEFAULT_INVENTORY_PATH
  const inventory = await readJsonFile<PromptInventory>(inventoryPath)
  if (inventory.kind !== 'trolley.prompt_inventory') {
    throw new Error(
      `Inventory is not trolley.prompt_inventory: ${inventoryPath}`,
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
    scenarioId: TROLLEY_SCENARIO_ID,
    scenarioSnapshotHash:
      inventory.scenario.scenarioSnapshotHash ?? sha256(inventory.scenario.id),
    sourceJudgeModel: sourceReport.config.judgeModel ?? null,
    sourceRunId: sourceReport.config.runId ?? basename(inputPath),
  }

  const jobs = buildJobs({
    judgeModels,
    repeats,
    sourceResults,
  })
  const sourceByJobId = new Map(
    sourceResults.map((result) => [result.jobId, result] as const),
  )
  const existingResults = config.resume
    ? (await readExistingResults(outputDir)).map((result) =>
        reparseExistingResult(result, sourceByJobId.get(result.sourceJobId)),
      )
    : []
  const completedJobIds = new Set(existingResults.map((result) => result.jobId))
  const pendingJobs = jobs.filter((job) => !completedJobIds.has(job.id))
  const results = [...existingResults]

  console.log(
    JSON.stringify(
      {
        dryRun: config.dryRun,
        inputPath,
        judgeModels,
        outputDir,
        pendingJobs: pendingJobs.length,
        repeats,
        runId,
        sourceHistories: sourceResults.length,
        totalJobs: jobs.length,
      },
      null,
      2,
    ),
  )

  await writeArtifacts({
    config,
    judgeModels,
    results,
    sourceHistories: sourceResults.length,
    totalJobs: jobs.length,
  })

  if (config.dryRun) {
    return
  }

  await workerPool(pendingJobs, concurrency, async (job) => {
    console.log(`[judge-bench] ${job.id}`)
    const result = await runOneJob({
      job,
      jobTimeoutMs,
      runId,
      scenario: inventory.scenario,
      sourceRunId: config.sourceRunId,
    })
    results.push(result)
    await writeArtifacts({
      config,
      judgeModels,
      results,
      sourceHistories: sourceResults.length,
      totalJobs: jobs.length,
    })
    console.log(
      `[judge-bench] -> ${result.status}${result.judgmentParseError ? ` parse_error=${result.judgmentParseError}` : ''} ${result.durationMs}ms`,
    )
  })
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
