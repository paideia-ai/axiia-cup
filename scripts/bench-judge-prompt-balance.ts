import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

import {
  evaluationModelIds,
  getModelDefinition,
  playerSelectableModelIds,
  roleOptionSchema,
  submissionModelIds,
  trolleyCases,
  type EvaluationModelId,
  type InfoAssignment,
  type JudgeQA,
  type RoleOption,
  type SubmissionModelId,
  type TranscriptTurn,
} from '../packages/shared/src'
import type { ScenarioRecord } from '../apps/api/src/db/schema'
import {
  buildJudgeRuntimeSystemPrompt,
  executeMatchSession,
} from '../apps/api/src/engine/core'
import {
  chatCompletion,
  type ChatCompletionCapture,
} from '../apps/api/src/engine/llm'

export const BENCHMARK_NAME = 'judge-prompt-balance'
export const LEVEL_3_PROMPT = '-'
export const DEFAULT_PLAYER_MODELS = [
  'deepseek-v4-pro',
  'kimi-k2.6',
  'minimax-m3',
  'glm-5.2',
] as const satisfies readonly SubmissionModelId[]

const SHANGYANG_SCENARIO_ID = 'shangyang-court'
const HONNOJI_SCENARIO_ID = 'honnoji-decision'
const TROLLEY_SCENARIO_ID = 'trolley-problem'
const ALL_SCENARIO_IDS = [
  SHANGYANG_SCENARIO_ID,
  HONNOJI_SCENARIO_ID,
  TROLLEY_SCENARIO_ID,
] as const
const DEFAULT_HISTORIES_PER_MODEL = 2
const DEFAULT_JUDGE_REPEATS = 6
const DEFAULT_HISTORY_CONCURRENCY = 5
const DEFAULT_JUDGE_CONCURRENCY = 100
const DEFAULT_JUDGE_MODEL = 'glm-5.2' as const satisfies EvaluationModelId
const DEFAULT_JOB_TIMEOUT_MS = 3_600_000
const DEFAULT_JUDGE_CALL_TIMEOUT_MS = 240_000
const MAX_ATTEMPTS = 3
export const DEFAULT_JUDGE_PROMPT_SNAPSHOT_PATH =
  'docs/bench/runs/judge-sensitivity-prod-20260708T200403Z/scenario-snapshots.json'

export type CalibrationScenarioId = (typeof ALL_SCENARIO_IDS)[number]
export type PolicySide = 'a' | 'b' | 'unknown'
export type RequestItem = { content: string; id: string }
type Command =
  | 'add-candidate'
  | 'judge'
  | 'preflight'
  | 'prepare'
  | 'report'
  | 'run-histories'

export type ScenarioSnapshot = ScenarioRecord & {
  agentPromptTemplateHash: string
  examinationQuestionTemplateHash: string
  judgePromptChars: number
  judgePromptHash: string
  scenarioSnapshotHash: string
  scorerPromptHash: string
}

export type CalibrationUnit = {
  assignment: InfoAssignment
  canonicalSide: 'a'
  id: string
  label: string
  roleAKey: string
  roleAName: string
  roleARequests: RequestItem[]
  roleBKey: string
  roleBName: string
  roleBRequests: RequestItem[]
  scenarioId: CalibrationScenarioId
}

export type HistoryJob = CalibrationUnit & {
  historyIndex: number
  jobId: string
  playerModel: SubmissionModelId
  promptA: typeof LEVEL_3_PROMPT
  promptB: typeof LEVEL_3_PROMPT
  scenarioSnapshotHash: string
}

export type CalibrationManifest = {
  counts: {
    historiesByScenario: Record<CalibrationScenarioId, number>
    normalJudgeCallsByScenario: Record<CalibrationScenarioId, number>
    totalHistories: number
    totalNormalJudgeCallsPerCandidate: number
    unitsByScenario: Record<CalibrationScenarioId, number>
  }
  dryRun: true
  generatedAt: string
  historiesPerModel: number
  jobs: HistoryJob[]
  judgeModel: EvaluationModelId
  judgeRepeats: number
  kind: 'judge_prompt_balance.manifest'
  level3Prompt: typeof LEVEL_3_PROMPT
  level3PromptHash: string
  manifestHash: string
  playerModelDefinitions: Array<
    ReturnType<typeof getModelDefinition> & { selectedAsPlayerStratum: true }
  >
  playerModels: SubmissionModelId[]
  scenarioIds: CalibrationScenarioId[]
  stabilityGate: false
  units: CalibrationUnit[]
  validationDeferred: true
}

type RunConfig = {
  benchmarkName: typeof BENCHMARK_NAME
  createdAt: string
  git: {
    branch: string | null
    commit: string | null
    dirty: boolean | null
  }
  historiesPerModel: number
  historyConcurrency: number
  judgeCallTimeoutMs: number
  judgeConcurrency: number
  judgeModel: EvaluationModelId
  judgePromptSource: JudgePromptSource
  judgeRepeats: number
  kind: 'judge_prompt_balance.config'
  level3Prompt: typeof LEVEL_3_PROMPT
  outputDir: string
  playerModels: SubmissionModelId[]
  productionSource: {
    apiOrigin: string
    apiUrl: string
    retrievedAt: string
    sourceNote: string | null
  }
  runId: string
  scenarioIds: CalibrationScenarioId[]
  stabilityGate: false
  validationDeferred: true
}

type JudgePromptSourceEntry = {
  byteIdenticalToProduction: boolean
  promptChars: number
  promptHash: string
  productionPromptChars: number
  productionPromptHash: string
}

type JudgePromptSource = {
  generatedAt: string | null
  kind: 'judge-sensitivity-snapshot'
  path: string
  scenarios: Partial<Record<CalibrationScenarioId, JudgePromptSourceEntry>>
}

type ScenarioSnapshotsArtifact = {
  generatedAt: string
  judgePromptSource: JudgePromptSource
  kind: 'judge_prompt_balance.scenario_snapshots'
  productionSource: RunConfig['productionSource']
  scenarios: Partial<Record<CalibrationScenarioId, ScenarioSnapshot>>
}

export type CandidateRecord = {
  benchmarkBaseline: boolean
  candidateId: string
  createdAt: string
  evidence: string | null
  exactDiffFromParent: string
  hypothesis: string | null
  kind: 'judge_prompt_balance.candidate'
  observedFailure: string | null
  parentCandidateId: string | null
  prediction: string | null
  productionBaseline: boolean
  prompt: string
  promptChars: number
  promptHash: string
  scenarioId: CalibrationScenarioId
}

export type HistoryResult = {
  assignment: InfoAssignment
  durationMs: number
  error: string | null
  generatedAt: string
  historyIndex: number
  jobId: string
  judgeTranscriptA: JudgeQA[]
  judgeTranscriptB: JudgeQA[]
  models: { agentA: SubmissionModelId; agentB: SubmissionModelId }
  playerModel: SubmissionModelId
  promptA: typeof LEVEL_3_PROMPT
  promptAHash: string
  promptB: typeof LEVEL_3_PROMPT
  promptBHash: string
  roleAKey: string
  roleAName: string
  roleARequests: RequestItem[]
  roleBKey: string
  roleBName: string
  roleBRequests: RequestItem[]
  scenarioId: CalibrationScenarioId
  status: 'error' | 'ok'
  transcript: TranscriptTurn[]
  unitId: string
  unitLabel: string
}

type HistoriesArtifact = {
  generatedAt: string
  histories: HistoryResult[]
  kind: 'judge_prompt_balance.histories'
  manifestHash: string
  summary: {
    completed: number
    errored: number
    expected: number
  }
}

export type ThinkingVerification = {
  evidence: {
    reasoningContentChars: number
    reasoningTokens: number | null
  }
  errors: string[]
  passed: boolean
  providerResponseIdPresent: boolean
  requestControl: Record<string, unknown> | null
}

type PreflightArtifact = {
  capture: ChatCompletionCapture | null
  candidateId: string
  error: string | null
  generatedAt: string
  judgeModel: EvaluationModelId
  kind: 'judge_prompt_balance.thinking_preflight'
  parsedPolicy: ParsedJudgePolicy | null
  status: 'failed' | 'passed'
  verification: ThinkingVerification | null
}

export type ParsedJudgePolicy = {
  judgment: string | null
  judgments: Record<string, string>
  parseError: string | null
  policyWinner: PolicySide
  requests: Record<string, string>
}

type JudgeAttempt = {
  attempt: number
  capture: ChatCompletionCapture | null
  durationMs: number
  error: string | null
  thinkingVerification: ThinkingVerification | null
}

export type JudgeResult = {
  attempts: JudgeAttempt[]
  cachePhase: 'replay' | 'warmup'
  cachedPromptTokens: number | null
  candidateId: string
  durationMs: number
  error: string | null
  generatedAt: string
  historyJobId: string
  id: string
  judgeModel: EvaluationModelId
  judgePromptChars: number
  judgePromptHash: string
  parsedPolicy: ParsedJudgePolicy
  playerModel: SubmissionModelId
  promptTokens: number | null
  providerCreatedAt: number | null
  providerResponseId: string | null
  rawOutput: string | null
  reasoningContentChars: number | null
  reasoningTokens: number | null
  repeatIndex: number
  scenarioId: CalibrationScenarioId
  status: 'error' | 'ok'
  thinkingVerified: boolean
  unitId: string
}

type JudgeResultsArtifact = {
  candidateId: string
  generatedAt: string
  kind: 'judge_prompt_balance.judge_results'
  manifestHash: string
  results: JudgeResult[]
  summary: {
    achievedConcurrency: number
    completed: number
    duplicateProviderResponseIds: number
    errored: number
    expected: number
    missingProviderResponseIds: number
    rateLimitAttempts: number
    retries: number
  }
}

type HistoryDiagnostic = {
  agreementRate: number | null
  canonicalRate: number | null
  historyJobId: string
  validJudgments: number
}

type ModelRate = {
  canonicalRate: number | null
  canonicalWins: number
  expectedJudgments: number
  playerModel: SubmissionModelId
  validJudgments: number
}

type UnitSummary = {
  canonicalRate: number | null
  canonicalWins: number
  expectedJudgments: number
  fixedHistoryInstability: number | null
  histories: HistoryDiagnostic[]
  label: string
  modelRates: ModelRate[]
  pass: boolean
  unitId: string
  validJudgments: number
}

export type CandidateSummary = {
  balanceStopConditionMet: boolean
  cache: {
    cachedCalls: number
    reportedUncachedAverageDurationMs: number | null
    reportedUncachedCalls: number
    replayAverageDurationMsExcludedFromUncachedLatency: number | null
    usageReportedCalls: number
    warmupAverageDurationMs: number | null
  }
  candidateId: string
  candidatePass: boolean
  generatedAt: string
  judgeModel: EvaluationModelId
  kind: 'judge_prompt_balance.candidate_summary'
  responseGenerationCheck: {
    duplicateProviderResponseIds: string[]
    missingProviderResponseIds: number
    passed: boolean
  }
  runCompleteAndValid: boolean
  scenarioId: CalibrationScenarioId
  stabilityAffectsPass: false
  units: UnitSummary[]
  worstUnitDeviationFromFifty: number | null
}

export type PromptResultUnit = {
  canonicalPolicyLabel: string
  canonicalRoleName: string
  canonicalSide: 'a'
  canonicalWins: number | null
  estimatedCanonicalWinProbability: number | null
  expectedJudgments: number
  label: string
  modelProbabilities: Array<{
    canonicalWins: number
    estimatedCanonicalWinProbability: number | null
    expectedJudgments: number
    playerModel: SubmissionModelId
    validJudgments: number
  }>
  pass: boolean | null
  unitId: string
  validJudgments: number | null
}

export type PromptResultEntry = {
  benchmarkBaseline: boolean
  candidateId: string
  candidatePass: boolean | null
  createdAt: string
  evaluationGeneratedAt: string | null
  evaluationStatus: 'complete' | 'incomplete' | 'not-run'
  evidence: string | null
  exactDiffFromParent: string
  hypothesis: string | null
  observedFailure: string | null
  parentCandidateId: string | null
  prediction: string | null
  productionBaseline: boolean
  prompt: string
  promptChars: number
  promptHash: string
  promptVersion: string
  scenarioId: CalibrationScenarioId
  unitProbabilities: PromptResultUnit[]
}

export type PromptResultsSummaryArtifact = {
  balanceRange: { maximum: 0.7; minimum: 0.3 }
  generatedAt: string
  judgeModel: EvaluationModelId
  judgeRepeats: number
  kind: 'judge_prompt_balance.prompt_results_summary'
  manifestHash: string
  playerModels: SubmissionModelId[]
  probabilityDefinition: string
  prompts: PromptResultEntry[]
  runId: string
}

type CandidateEvidenceFile = {
  evidence: string
  hypothesis: string
  observedFailure: string
  prediction: string
}

function usage(exitCode = 1): never {
  const output = `Usage:
  bun scripts/bench-judge-prompt-balance.ts prepare --scenario <id|csv> [options]
  bun scripts/bench-judge-prompt-balance.ts run-histories --output-dir <run-dir> [options]
  bun scripts/bench-judge-prompt-balance.ts preflight --output-dir <run-dir> [--candidate <id>]
  bun scripts/bench-judge-prompt-balance.ts add-candidate --output-dir <run-dir> --scenario <id> --id <id> --parent <id> --prompt-file <path> --evidence-file <path>
  bun scripts/bench-judge-prompt-balance.ts judge --output-dir <run-dir> --candidate <id> [options]
  bun scripts/bench-judge-prompt-balance.ts report --output-dir <run-dir> --candidate <id>

Prepare options:
  --scenario <id|csv>          Required. shangyang-court, honnoji-decision, trolley-problem
  --output-dir <path>          Default: docs/bench/runs/judge-prompt-balance-<timestamp>
  --api-url <url>              Falls back to AXIIA_API_URL
  --auth-token <token>         Falls back to AXIIA_AUTH_TOKEN; never persisted
  --player-models <csv>        Default: ${DEFAULT_PLAYER_MODELS.join(',')}
  --histories-per-model <n>    Default: ${DEFAULT_HISTORIES_PER_MODEL}
  --judge-repeats <n>          Default: ${DEFAULT_JUDGE_REPEATS}
  --judge-model <id>           Default: ${DEFAULT_JUDGE_MODEL}
  --history-concurrency <n>    Default: ${DEFAULT_HISTORY_CONCURRENCY}
  --judge-concurrency <n>      Default: ${DEFAULT_JUDGE_CONCURRENCY}
  --judge-prompt-snapshot <p>  Default: ${DEFAULT_JUDGE_PROMPT_SNAPSHOT_PATH}
  --source-note <text>         Optional provenance note

Execution options:
  --history-concurrency <n>    Override configured history concurrency
  --judge-concurrency <n>      Override configured judge concurrency
  --job-timeout-ms <n>         Default: ${DEFAULT_JOB_TIMEOUT_MS}
  --judge-call-timeout-ms <n>  Default: ${DEFAULT_JUDGE_CALL_TIMEOUT_MS}

prepare only performs an authenticated GET, reads the local Judge Sensitivity
prompt snapshot, and writes a dry-run manifest. It does not call a player or
judge model. Validation phases are intentionally not implemented in this
command set yet. Each run also maintains
prompt-results-summary.md and prompt-results-summary.json across P0, P1, and
later candidates.
`
  if (exitCode === 0) console.log(output)
  else console.error(output)
  process.exit(exitCode)
}

function parseArgs() {
  const [command, ...args] = process.argv.slice(2)
  if (command === '--help' || command === '-h') usage(0)
  const commands: Command[] = [
    'add-candidate',
    'judge',
    'preflight',
    'prepare',
    'report',
    'run-histories',
  ]

  if (!commands.includes(command as Command)) {
    usage()
  }

  const options: Record<string, string> = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg?.startsWith('--')) {
      usage()
    }

    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      usage()
    }

    options[arg.slice(2)] = value
    index += 1
  }

  return { command: command as Command, options }
}

function option(options: Record<string, string>, key: string, fallback = '') {
  return options[key] ?? fallback
}

function requiredOption(options: Record<string, string>, key: string) {
  const value = option(options, key)
  if (!value) {
    throw new Error(`--${key} is required`)
  }
  return value
}

function positiveInteger(value: string, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return parsed
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/gu, '-')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right),
  )
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}

function sha256(value: unknown) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : stableStringify(value))
    .digest('hex')
}

function gitOutput(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function gitState(): RunConfig['git'] {
  const status = gitOutput(['status', '--porcelain'])
  return {
    branch: gitOutput(['branch', '--show-current']),
    commit: gitOutput(['rev-parse', 'HEAD']),
    dirty: status == null ? null : status.length > 0,
  }
}

function parseScenarioIds(raw: string): CalibrationScenarioId[] {
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (values.length === 0) {
    throw new Error('--scenario must contain at least one scenario id')
  }
  for (const value of values) {
    if (!ALL_SCENARIO_IDS.includes(value as CalibrationScenarioId)) {
      throw new Error(`Unsupported scenario id: ${value}`)
    }
  }
  return [...new Set(values)] as CalibrationScenarioId[]
}

function parsePlayerModels(raw: string): SubmissionModelId[] {
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (values.length === 0) {
    throw new Error('--player-models must contain at least one model')
  }
  for (const value of values) {
    if (!(submissionModelIds as readonly string[]).includes(value)) {
      throw new Error(`Unknown submission model: ${value}`)
    }
    if (!(playerSelectableModelIds as readonly string[]).includes(value)) {
      throw new Error(`Model is not currently player-selectable: ${value}`)
    }
  }
  return [...new Set(values)] as SubmissionModelId[]
}

function parseJudgeModel(raw: string): EvaluationModelId {
  if (!(evaluationModelIds as readonly string[]).includes(raw)) {
    throw new Error(`Unknown judge model: ${raw}`)
  }
  return raw as EvaluationModelId
}

function parseJsonArray<T>(raw: string, label: string): T[] {
  const parsed = JSON.parse(raw || '[]') as unknown
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array`)
  }
  return parsed as T[]
}

function scenarioSnapshot(scenario: ScenarioRecord): ScenarioSnapshot {
  return {
    ...scenario,
    agentPromptTemplateHash: sha256(scenario.agentPromptTemplate),
    examinationQuestionTemplateHash: sha256(
      scenario.examinationQuestionTemplate,
    ),
    judgePromptChars: scenario.judgePrompt.length,
    judgePromptHash: sha256(scenario.judgePrompt),
    scenarioSnapshotHash: sha256(scenario),
    scorerPromptHash: sha256(scenario.scorerPrompt),
  }
}

function scenarioRecordFromSnapshot(
  snapshot: ScenarioSnapshot,
): ScenarioRecord {
  const {
    agentPromptTemplateHash: _agentPromptTemplateHash,
    examinationQuestionTemplateHash: _examinationQuestionTemplateHash,
    judgePromptChars: _judgePromptChars,
    judgePromptHash: _judgePromptHash,
    scenarioSnapshotHash: _scenarioSnapshotHash,
    scorerPromptHash: _scorerPromptHash,
    ...scenario
  } = snapshot
  return scenario
}

function stringifyScenarioField(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value ?? [])
}

function scenarioFromApi(value: unknown): ScenarioRecord {
  const row = value as Record<string, unknown>
  const stringField = (key: string) => {
    const field = row[key]
    return typeof field === 'string' ? field : ''
  }
  const numberField = (key: string) => {
    const field = row[key]
    if (typeof field !== 'number') {
      throw new Error(`Production scenario field ${key} is not a number`)
    }
    return field
  }

  return {
    agentPromptTemplate: stringField('agentPromptTemplate'),
    createdAt: stringField('createdAt'),
    examinationQuestionTemplate: stringField('examinationQuestionTemplate'),
    falseInfoCount: numberField('falseInfoCount'),
    id: stringField('id'),
    judgeModel: stringField('judgeModel'),
    judgeOsPrompt: stringField('judgeOsPrompt'),
    judgePrompt: stringField('judgePrompt'),
    openingLine: stringField('openingLine'),
    roleAHiddenInfo: stringifyScenarioField(row.roleAHiddenInfo),
    roleAName: stringField('roleAName'),
    roleAOptions: stringifyScenarioField(row.roleAOptions),
    roleARequests: stringifyScenarioField(row.roleARequests),
    roleBHiddenInfo: stringifyScenarioField(row.roleBHiddenInfo),
    roleBName: stringField('roleBName'),
    roleBOptions: stringifyScenarioField(row.roleBOptions),
    roleBRequests: stringifyScenarioField(row.roleBRequests),
    scorerModel: stringField('scorerModel'),
    scorerPrompt: stringField('scorerPrompt'),
    subject: stringField('subject'),
    title: stringField('title'),
    trueRequestCount: numberField('trueRequestCount'),
    turnCount: numberField('turnCount'),
  }
}

async function fetchProductionScenarios(params: {
  apiUrl: string
  authToken: string
  scenarioIds: CalibrationScenarioId[]
}) {
  if (!params.apiUrl || !params.authToken) {
    throw new Error('AXIIA_API_URL and AXIIA_AUTH_TOKEN are required')
  }
  const endpoint = `${params.apiUrl.replace(/\/+$/u, '')}/api/admin/scenarios`
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${params.authToken}` },
    method: 'GET',
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `GET /api/admin/scenarios failed: ${response.status} ${response.statusText} ${text.slice(0, 500)}`,
    )
  }
  const rows = JSON.parse(text) as unknown[]
  const scenarios: Partial<Record<CalibrationScenarioId, ScenarioSnapshot>> = {}
  for (const scenarioId of params.scenarioIds) {
    const raw = rows.find(
      (row) =>
        typeof row === 'object' &&
        row !== null &&
        (row as Record<string, unknown>).id === scenarioId,
    )
    if (!raw) {
      throw new Error(`Production scenario not found: ${scenarioId}`)
    }
    scenarios[scenarioId] = scenarioSnapshot(scenarioFromApi(raw))
  }
  return scenarios
}

type JudgeSensitivitySnapshotInput = {
  generatedAt?: unknown
  scenarios?: Record<string, unknown>
}

function assertTrolleySingleCaseJudgePrompt(prompt: string) {
  const requiredVariables = ['cases', 'debate', 'caseId1']
  const missingVariables = requiredVariables.filter(
    (variable) => !prompt.includes(`{{${variable}}}`),
  )
  const forbiddenVariables = ['caseId2', 'caseId3'].filter((variable) =>
    prompt.includes(`{{${variable}}}`),
  )
  if (
    missingVariables.length > 0 ||
    forbiddenVariables.length > 0 ||
    prompt.includes('你必须对三个案件分别裁决') ||
    /["“]winner["”]/u.test(prompt)
  ) {
    throw new Error(
      [
        'Trolley judge-prompt baseline is not the expected one-mini-case contract.',
        missingVariables.length > 0
          ? `Missing variables: ${missingVariables.join(', ')}`
          : null,
        forbiddenVariables.length > 0
          ? `Forbidden variables: ${forbiddenVariables.join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    )
  }
}

export function applyJudgeSensitivityPromptSnapshot(params: {
  productionScenarios: Partial<Record<CalibrationScenarioId, ScenarioSnapshot>>
  scenarioIds: CalibrationScenarioId[]
  snapshot: JudgeSensitivitySnapshotInput
  sourcePath: string
}) {
  if (!params.snapshot.scenarios) {
    throw new Error(
      `Judge Sensitivity snapshot has no scenarios: ${params.sourcePath}`,
    )
  }

  const scenarios: Partial<Record<CalibrationScenarioId, ScenarioSnapshot>> = {}
  const sourceEntries: JudgePromptSource['scenarios'] = {}

  for (const scenarioId of params.scenarioIds) {
    const productionSnapshot = params.productionScenarios[scenarioId]
    if (!productionSnapshot) {
      throw new Error(`Missing production scenario: ${scenarioId}`)
    }
    const raw = params.snapshot.scenarios[scenarioId]
    if (!raw || typeof raw !== 'object') {
      throw new Error(
        `Judge Sensitivity snapshot is missing scenario: ${scenarioId}`,
      )
    }
    const row = raw as Record<string, unknown>
    const prompt = row.judgePrompt
    if (typeof prompt !== 'string' || prompt.length === 0) {
      throw new Error(
        `Judge Sensitivity snapshot has no judge prompt for ${scenarioId}`,
      )
    }
    const promptHash = sha256(prompt)
    if (
      typeof row.judgePromptHash === 'string' &&
      row.judgePromptHash !== promptHash
    ) {
      throw new Error(
        `Judge Sensitivity prompt hash mismatch for ${scenarioId}`,
      )
    }
    if (scenarioId === TROLLEY_SCENARIO_ID) {
      assertTrolleySingleCaseJudgePrompt(prompt)
    }

    const productionScenario = scenarioRecordFromSnapshot(productionSnapshot)
    scenarios[scenarioId] = scenarioSnapshot({
      ...productionScenario,
      judgePrompt: prompt,
    })
    sourceEntries[scenarioId] = {
      byteIdenticalToProduction: prompt === productionScenario.judgePrompt,
      productionPromptChars: productionScenario.judgePrompt.length,
      productionPromptHash: sha256(productionScenario.judgePrompt),
      promptChars: prompt.length,
      promptHash,
    }
  }

  const generatedAt =
    typeof params.snapshot.generatedAt === 'string'
      ? params.snapshot.generatedAt
      : null
  const source: JudgePromptSource = {
    generatedAt,
    kind: 'judge-sensitivity-snapshot',
    path: params.sourcePath,
    scenarios: sourceEntries,
  }
  return { scenarios, source }
}

async function loadJudgeSensitivityPromptSnapshot(params: {
  path: string
  productionScenarios: Partial<Record<CalibrationScenarioId, ScenarioSnapshot>>
  scenarioIds: CalibrationScenarioId[]
}) {
  const absolutePath = resolve(params.path)
  if (!existsSync(absolutePath)) {
    throw new Error(`Judge Sensitivity snapshot not found: ${absolutePath}`)
  }
  const snapshot = await readJson<JudgeSensitivitySnapshotInput>(absolutePath)
  const sourcePath = relative(process.cwd(), absolutePath) || absolutePath
  return applyJudgeSensitivityPromptSnapshot({
    productionScenarios: params.productionScenarios,
    scenarioIds: params.scenarioIds,
    snapshot,
    sourcePath,
  })
}

function firstRequest(requests: RequestItem[], label: string) {
  const request = requests[0]
  if (!request) {
    throw new Error(`${label} has no request to use as the frozen true request`)
  }
  return request.id
}

function buildShangyangUnits(scenario: ScenarioRecord): CalibrationUnit[] {
  const roleARequests = parseJsonArray<RequestItem>(
    scenario.roleARequests,
    'Shangyang roleARequests',
  )
  const roleBRequests = parseJsonArray<RequestItem>(
    scenario.roleBRequests,
    'Shangyang roleBRequests',
  )
  return [
    {
      assignment: {
        roleAFalseInfoIds: [],
        roleATrueRequestIds: [firstRequest(roleARequests, scenario.roleAName)],
        roleBFalseInfoIds: [],
        roleBTrueRequestIds: [firstRequest(roleBRequests, scenario.roleBName)],
        selectedCaseIds: [],
      },
      canonicalSide: 'a',
      id: 'reform-vs-status-quo',
      label: `${scenario.roleAName} vs. ${scenario.roleBName}`,
      roleAKey: 'shangyang',
      roleAName: scenario.roleAName,
      roleARequests,
      roleBKey: 'ganlong',
      roleBName: scenario.roleBName,
      roleBRequests,
      scenarioId: SHANGYANG_SCENARIO_ID,
    },
  ]
}

function parseRoleOptions(raw: string): RoleOption[] {
  return roleOptionSchema.array().parse(JSON.parse(raw || '[]'))
}

function buildHonnojiUnits(scenario: ScenarioRecord): CalibrationUnit[] {
  const roleAOptions = parseRoleOptions(scenario.roleAOptions)
  const roleBOptions = parseRoleOptions(scenario.roleBOptions)
  const units: CalibrationUnit[] = []

  for (const roleA of roleAOptions) {
    for (const roleB of roleBOptions) {
      units.push({
        assignment: {
          roleAFalseInfoIds: [],
          roleATrueRequestIds: [
            firstRequest(roleA.requests, `Honnoji ${roleA.name}`),
          ],
          roleBFalseInfoIds: [],
          roleBTrueRequestIds: [
            firstRequest(roleB.requests, `Honnoji ${roleB.name}`),
          ],
          selectedCaseIds: [],
        },
        canonicalSide: 'a',
        id: `${roleA.id}__${roleB.id}`,
        label: `${roleA.name} vs. ${roleB.name}`,
        roleAKey: roleA.id,
        roleAName: roleA.name,
        roleARequests: roleA.requests,
        roleBKey: roleB.id,
        roleBName: roleB.name,
        roleBRequests: roleB.requests,
        scenarioId: HONNOJI_SCENARIO_ID,
      })
    }
  }

  if (units.length !== 4) {
    throw new Error(
      `Honnoji must resolve to four matchups; found ${units.length}`,
    )
  }
  return units
}

function buildTrolleyUnits(scenario: ScenarioRecord): CalibrationUnit[] {
  return trolleyCases.map((trolleyCase) => ({
    assignment: {
      roleAFalseInfoIds: [],
      roleATrueRequestIds: [],
      roleBFalseInfoIds: [],
      roleBTrueRequestIds: [],
      selectedCaseIds: [trolleyCase.id],
    },
    canonicalSide: 'a' as const,
    id: `case-${trolleyCase.id}`,
    label: `${trolleyCase.id}. ${trolleyCase.title}`,
    roleAKey: 'one-side',
    roleAName: scenario.roleAName,
    roleARequests: [],
    roleBKey: 'five-side',
    roleBName: scenario.roleBName,
    roleBRequests: [],
    scenarioId: TROLLEY_SCENARIO_ID,
  }))
}

export function buildCalibrationUnits(
  scenarioId: CalibrationScenarioId,
  scenario: ScenarioRecord,
) {
  if (scenarioId === SHANGYANG_SCENARIO_ID) {
    return buildShangyangUnits(scenario)
  }
  if (scenarioId === HONNOJI_SCENARIO_ID) {
    return buildHonnojiUnits(scenario)
  }
  return buildTrolleyUnits(scenario)
}

function emptyScenarioCounts() {
  return {
    [HONNOJI_SCENARIO_ID]: 0,
    [SHANGYANG_SCENARIO_ID]: 0,
    [TROLLEY_SCENARIO_ID]: 0,
  }
}

export function buildCalibrationManifest(params: {
  historiesPerModel?: number
  judgeModel?: EvaluationModelId
  judgeRepeats?: number
  now?: Date
  playerModels?: SubmissionModelId[]
  scenarioIds: CalibrationScenarioId[]
  scenarios: Partial<Record<CalibrationScenarioId, ScenarioSnapshot>>
}): CalibrationManifest {
  const historiesPerModel =
    params.historiesPerModel ?? DEFAULT_HISTORIES_PER_MODEL
  const judgeRepeats = params.judgeRepeats ?? DEFAULT_JUDGE_REPEATS
  const playerModels = [...(params.playerModels ?? DEFAULT_PLAYER_MODELS)]
  const units: CalibrationUnit[] = []
  const jobs: HistoryJob[] = []

  for (const scenarioId of params.scenarioIds) {
    const scenario = params.scenarios[scenarioId]
    if (!scenario) {
      throw new Error(`Missing scenario snapshot: ${scenarioId}`)
    }
    const scenarioUnits = buildCalibrationUnits(scenarioId, scenario)
    units.push(...scenarioUnits)
    for (const unit of scenarioUnits) {
      for (const playerModel of playerModels) {
        for (
          let historyIndex = 1;
          historyIndex <= historiesPerModel;
          historyIndex += 1
        ) {
          jobs.push({
            ...unit,
            historyIndex,
            jobId: `${scenarioId}__${unit.id}__${playerModel}__history-${historyIndex}`,
            playerModel,
            promptA: LEVEL_3_PROMPT,
            promptB: LEVEL_3_PROMPT,
            scenarioSnapshotHash: scenario.scenarioSnapshotHash,
          })
        }
      }
    }
  }

  const historiesByScenario = emptyScenarioCounts()
  const normalJudgeCallsByScenario = emptyScenarioCounts()
  const unitsByScenario = emptyScenarioCounts()
  for (const scenarioId of ALL_SCENARIO_IDS) {
    historiesByScenario[scenarioId] = jobs.filter(
      (job) => job.scenarioId === scenarioId,
    ).length
    normalJudgeCallsByScenario[scenarioId] =
      historiesByScenario[scenarioId] * judgeRepeats
    unitsByScenario[scenarioId] = units.filter(
      (unit) => unit.scenarioId === scenarioId,
    ).length
  }

  const withoutHash: Omit<CalibrationManifest, 'manifestHash'> = {
    counts: {
      historiesByScenario,
      normalJudgeCallsByScenario,
      totalHistories: jobs.length,
      totalNormalJudgeCallsPerCandidate: jobs.length * judgeRepeats,
      unitsByScenario,
    },
    dryRun: true as const,
    generatedAt: (params.now ?? new Date()).toISOString(),
    historiesPerModel,
    jobs,
    judgeModel: params.judgeModel ?? DEFAULT_JUDGE_MODEL,
    judgeRepeats,
    kind: 'judge_prompt_balance.manifest' as const,
    level3Prompt: LEVEL_3_PROMPT,
    level3PromptHash: sha256(LEVEL_3_PROMPT),
    playerModelDefinitions: playerModels.map((model) => ({
      ...getModelDefinition(model),
      selectedAsPlayerStratum: true as const,
    })),
    playerModels,
    scenarioIds: [...params.scenarioIds],
    stabilityGate: false as const,
    units,
    validationDeferred: true as const,
  }
  return { ...withoutHash, manifestHash: sha256(withoutHash) }
}

function assertTrolleyOnlyManifest(manifest: CalibrationManifest) {
  if (
    manifest.scenarioIds.length !== 1 ||
    manifest.scenarioIds[0] !== TROLLEY_SCENARIO_ID
  ) {
    return
  }
  const errors: string[] = []
  if (manifest.counts.unitsByScenario[TROLLEY_SCENARIO_ID] !== 5) {
    errors.push('active trolley units must be 5')
  }
  if (manifest.counts.historiesByScenario[TROLLEY_SCENARIO_ID] !== 40) {
    errors.push('trolley development histories must be 40')
  }
  if (manifest.counts.normalJudgeCallsByScenario[TROLLEY_SCENARIO_ID] !== 240) {
    errors.push('trolley judge calls per candidate must be 240')
  }
  if (manifest.counts.historiesByScenario[SHANGYANG_SCENARIO_ID] !== 0) {
    errors.push('Shangyang histories must be 0')
  }
  if (manifest.counts.historiesByScenario[HONNOJI_SCENARIO_ID] !== 0) {
    errors.push('Honnoji histories must be 0')
  }
  if (errors.length > 0) {
    throw new Error(`Trolley-only manifest guard failed: ${errors.join('; ')}`)
  }
}

async function writeTextAtomic(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.tmp-${process.pid}-${randomUUID()}`
  await writeFile(temporaryPath, content, 'utf8')
  await rename(temporaryPath, path)
}

async function writeJsonAtomic(path: string, value: unknown) {
  await writeTextAtomic(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

function scenarioSnapshotsPath(outputDir: string) {
  return join(outputDir, 'scenario-snapshots.json')
}

function manifestPath(outputDir: string) {
  return join(outputDir, 'manifest.json')
}

function historiesPath(outputDir: string) {
  return join(outputDir, 'histories.json')
}

function candidateDir(outputDir: string, candidateId: string) {
  return join(outputDir, 'candidates', candidateId)
}

function candidateRecordPath(outputDir: string, candidateId: string) {
  return join(candidateDir(outputDir, candidateId), 'candidate.json')
}

function candidateResultsPath(outputDir: string, candidateId: string) {
  return join(candidateDir(outputDir, candidateId), 'judge-results.json')
}

function candidateSummaryPath(outputDir: string, candidateId: string) {
  return join(candidateDir(outputDir, candidateId), 'summary.json')
}

function promptResultsSummaryJsonPath(outputDir: string) {
  return join(outputDir, 'prompt-results-summary.json')
}

function promptResultsSummaryMarkdownPath(outputDir: string) {
  return join(outputDir, 'prompt-results-summary.md')
}

function preflightPath(outputDir: string) {
  return join(outputDir, 'thinking-preflight.json')
}

function candidatePrefix(scenarioId: CalibrationScenarioId) {
  if (scenarioId === SHANGYANG_SCENARIO_ID) return 'SY'
  if (scenarioId === HONNOJI_SCENARIO_ID) return 'HN'
  return 'TR'
}

function renderCandidateMarkdown(candidate: CandidateRecord) {
  return [
    `# ${candidate.candidateId}`,
    '',
    `- Scenario: \`${candidate.scenarioId}\``,
    `- Frozen benchmark baseline: ${candidate.benchmarkBaseline ? 'yes' : 'no'}`,
    `- Byte-identical to live production prompt: ${candidate.productionBaseline ? 'yes' : 'no'}`,
    `- Parent: ${candidate.parentCandidateId ? `\`${candidate.parentCandidateId}\`` : 'none'}`,
    `- Prompt SHA-256: \`${candidate.promptHash}\``,
    `- Prompt characters: ${candidate.promptChars}`,
    `- Observed failure: ${candidate.observedFailure ?? 'none (frozen P0)'}`,
    `- Evidence: ${candidate.evidence ?? 'none (frozen P0)'}`,
    `- Hypothesis: ${candidate.hypothesis ?? 'none (frozen P0)'}`,
    `- Prediction: ${candidate.prediction ?? 'none (frozen P0)'}`,
    '',
    '## Diff From Parent',
    '',
    candidate.exactDiffFromParent
      ? `\`\`\`diff\n${candidate.exactDiffFromParent.trimEnd()}\n\`\`\``
      : 'P0 is byte-for-byte identical to the frozen Judge Sensitivity baseline prompt.',
    '',
    '## Prompt',
    '',
    '```text',
    candidate.prompt,
    '```',
    '',
  ].join('\n')
}

function promptVersion(candidateId: string) {
  return candidateId.match(/P\d+$/u)?.[0] ?? candidateId
}

function compareCandidates(left: CandidateRecord, right: CandidateRecord) {
  const scenarioDifference =
    ALL_SCENARIO_IDS.indexOf(left.scenarioId) -
    ALL_SCENARIO_IDS.indexOf(right.scenarioId)
  if (scenarioDifference !== 0) return scenarioDifference
  const leftVersion = Number.parseInt(
    promptVersion(left.candidateId).slice(1),
    10,
  )
  const rightVersion = Number.parseInt(
    promptVersion(right.candidateId).slice(1),
    10,
  )
  return (
    leftVersion - rightVersion ||
    left.candidateId.localeCompare(right.candidateId)
  )
}

function canonicalPolicyLabel(scenarioId: CalibrationScenarioId) {
  if (scenarioId === SHANGYANG_SCENARIO_ID) return '变法'
  if (scenarioId === HONNOJI_SCENARIO_ID) return '刺杀信长'
  return '一人侧'
}

export function buildPromptResultsSummaryArtifact(params: {
  candidates: Array<{
    candidate: CandidateRecord
    summary: CandidateSummary | null
  }>
  config: Pick<RunConfig, 'judgeModel' | 'runId'>
  generatedAt?: string
  manifest: CalibrationManifest
}): PromptResultsSummaryArtifact {
  const prompts = [...params.candidates]
    .sort((left, right) => compareCandidates(left.candidate, right.candidate))
    .map(({ candidate, summary }): PromptResultEntry => {
      const unitProbabilities = params.manifest.units
        .filter((unit) => unit.scenarioId === candidate.scenarioId)
        .map((unit): PromptResultUnit => {
          const result = summary?.units.find((item) => item.unitId === unit.id)
          const expectedJudgments =
            params.manifest.jobs.filter((job) => job.id === unit.id).length *
            params.manifest.judgeRepeats
          return {
            canonicalPolicyLabel: canonicalPolicyLabel(unit.scenarioId),
            canonicalRoleName: unit.roleAName,
            canonicalSide: unit.canonicalSide,
            canonicalWins: result?.canonicalWins ?? null,
            estimatedCanonicalWinProbability: result?.canonicalRate ?? null,
            expectedJudgments,
            label: unit.label,
            modelProbabilities:
              result?.modelRates.map((model) => ({
                canonicalWins: model.canonicalWins,
                estimatedCanonicalWinProbability: model.canonicalRate,
                expectedJudgments: model.expectedJudgments,
                playerModel: model.playerModel,
                validJudgments: model.validJudgments,
              })) ?? [],
            pass: result?.pass ?? null,
            unitId: unit.id,
            validJudgments: result?.validJudgments ?? null,
          }
        })
      return {
        benchmarkBaseline: candidate.benchmarkBaseline,
        candidateId: candidate.candidateId,
        candidatePass: summary?.candidatePass ?? null,
        createdAt: candidate.createdAt,
        evaluationGeneratedAt: summary?.generatedAt ?? null,
        evaluationStatus: summary
          ? summary.runCompleteAndValid
            ? 'complete'
            : 'incomplete'
          : 'not-run',
        evidence: candidate.evidence,
        exactDiffFromParent: candidate.exactDiffFromParent,
        hypothesis: candidate.hypothesis,
        observedFailure: candidate.observedFailure,
        parentCandidateId: candidate.parentCandidateId,
        prediction: candidate.prediction,
        productionBaseline: candidate.productionBaseline,
        prompt: candidate.prompt,
        promptChars: candidate.promptChars,
        promptHash: candidate.promptHash,
        promptVersion: promptVersion(candidate.candidateId),
        scenarioId: candidate.scenarioId,
        unitProbabilities,
      }
    })
  return {
    balanceRange: { maximum: 0.7, minimum: 0.3 },
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    judgeModel: params.config.judgeModel,
    judgeRepeats: params.manifest.judgeRepeats,
    kind: 'judge_prompt_balance.prompt_results_summary',
    manifestHash: params.manifest.manifestHash,
    playerModels: params.manifest.playerModels,
    probabilityDefinition:
      'Empirical probability that the categorical judge decision selects the canonical side, estimated from the frozen-history repeat judgments and equally weighted across player-model strata.',
    prompts,
    runId: params.config.runId,
  }
}

export function renderPromptResultsSummary(
  artifact: PromptResultsSummaryArtifact,
) {
  const resultRows = artifact.prompts.flatMap((candidate) =>
    candidate.unitProbabilities.map(
      (unit) =>
        `| ${candidate.promptVersion} | ${candidate.candidateId} | ${candidate.scenarioId} | ${unit.unitId} | ${unit.label} | ${unit.canonicalPolicyLabel} | ${unit.canonicalRoleName} | ${percent(unit.estimatedCanonicalWinProbability)} | ${unit.canonicalWins ?? 'n/a'}/${unit.validJudgments ?? 'n/a'} (${unit.expectedJudgments} expected) | ${unit.pass == null ? 'NOT RUN' : unit.pass ? 'PASS' : 'FAIL'} |`,
    ),
  )
  const candidateSections = artifact.prompts.flatMap((candidate) => [
    `## ${candidate.promptVersion}: ${candidate.candidateId}`,
    '',
    `- Scenario: \`${candidate.scenarioId}\``,
    `- Parent: ${candidate.parentCandidateId ? `\`${candidate.parentCandidateId}\`` : 'none'}`,
    `- Frozen benchmark baseline: ${candidate.benchmarkBaseline ? 'yes' : 'no'}`,
    `- Byte-identical to live production prompt: ${candidate.productionBaseline ? 'yes' : 'no'}`,
    `- Evaluation status: ${candidate.evaluationStatus}`,
    `- Candidate pass: ${candidate.candidatePass == null ? 'not evaluated' : candidate.candidatePass ? 'YES' : 'NO'}`,
    `- Prompt SHA-256: \`${candidate.promptHash}\``,
    `- Prompt characters: ${candidate.promptChars}`,
    `- Observed failure: ${candidate.observedFailure ?? 'none'}`,
    `- Evidence: ${candidate.evidence ?? 'none'}`,
    `- Hypothesis: ${candidate.hypothesis ?? 'none'}`,
    `- Prediction: ${candidate.prediction ?? 'none'}`,
    '',
    '### Exact Prompt',
    '',
    '```text',
    candidate.prompt,
    '```',
    '',
    '### Exact Diff From Parent',
    '',
    candidate.exactDiffFromParent
      ? `\`\`\`diff\n${candidate.exactDiffFromParent.trimEnd()}\n\`\`\``
      : 'P0 is byte-for-byte identical to the frozen Judge Sensitivity baseline prompt.',
    '',
  ])
  return [
    '# Prompt Results Summary',
    '',
    `- Manifest SHA-256: \`${artifact.manifestHash}\``,
    `- Judge model: \`${artifact.judgeModel}\``,
    `- Judge repeats per history: ${artifact.judgeRepeats}`,
    `- Player-model strata: ${artifact.playerModels.map((model) => `\`${model}\``).join(', ')}`,
    '- Passing interval: inclusive 30%-70% for every active unit',
    '',
    `**Estimated win probability:** ${artifact.probabilityDefinition}`,
    '',
    'The judge emits categorical decisions, not calibrated confidence scores. The probability below is therefore an empirical estimate; wins and valid/expected judgment counts are preserved beside it.',
    '',
    '| Version | Candidate | Scenario | Unit | Label | Canonical policy outcome | Canonical role | Estimated canonical-policy win probability | Canonical wins/valid judgments | Result |',
    '| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |',
    ...resultRows,
    '',
    ...candidateSections,
  ].join('\n')
}

async function writePromptResultsSummary(outputDir: string) {
  const [config, manifest, entries] = await Promise.all([
    readJson<RunConfig>(join(outputDir, 'config.json')),
    readJson<CalibrationManifest>(manifestPath(outputDir)),
    readdir(join(outputDir, 'candidates'), { withFileTypes: true }),
  ])
  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const candidate = await readJson<CandidateRecord>(
          candidateRecordPath(outputDir, entry.name),
        )
        const summaryPath = candidateSummaryPath(outputDir, entry.name)
        const summary = existsSync(summaryPath)
          ? await readJson<CandidateSummary>(summaryPath)
          : null
        return { candidate, summary }
      }),
  )
  const artifact = buildPromptResultsSummaryArtifact({
    candidates,
    config,
    manifest,
  })
  await Promise.all([
    writeJsonAtomic(promptResultsSummaryJsonPath(outputDir), artifact),
    writeTextAtomic(
      promptResultsSummaryMarkdownPath(outputDir),
      renderPromptResultsSummary(artifact),
    ),
  ])
}

async function writeCandidate(outputDir: string, candidate: CandidateRecord) {
  const directory = candidateDir(outputDir, candidate.candidateId)
  await mkdir(directory, { recursive: true })
  await Promise.all([
    writeJsonAtomic(join(directory, 'candidate.json'), candidate),
    writeTextAtomic(
      join(directory, 'candidate.md'),
      renderCandidateMarkdown(candidate),
    ),
    writeTextAtomic(join(directory, 'prompt.txt'), candidate.prompt),
  ])
}

function renderManifestMarkdown(
  manifest: CalibrationManifest,
  judgePromptSource: JudgePromptSource,
) {
  const scenarioRows = ALL_SCENARIO_IDS.map(
    (scenarioId) =>
      `| ${scenarioId} | ${manifest.counts.unitsByScenario[scenarioId]} | ${manifest.counts.historiesByScenario[scenarioId]} | ${manifest.counts.normalJudgeCallsByScenario[scenarioId]} |`,
  )
  const unitRows = manifest.units.map(
    (unit) =>
      `| ${unit.scenarioId} | ${unit.id} | ${unit.label} | ${unit.canonicalSide} |`,
  )
  const promptSourceRows = manifest.scenarioIds.map((scenarioId) => {
    const source = judgePromptSource.scenarios[scenarioId]
    if (!source) throw new Error(`Missing prompt source for ${scenarioId}`)
    return `| ${scenarioId} | \`${source.promptHash}\` | \`${source.productionPromptHash}\` | ${source.byteIdenticalToProduction ? 'yes' : 'no'} |`
  })
  return [
    '# Judge Prompt Balance Dry-Run Manifest',
    '',
    `- Manifest SHA-256: \`${manifest.manifestHash}\``,
    `- Scenarios: ${manifest.scenarioIds.map((id) => `\`${id}\``).join(', ')}`,
    `- Player models: ${manifest.playerModels.map((id) => `\`${id}\``).join(', ')}`,
    `- Histories per unit/model: ${manifest.historiesPerModel}`,
    `- Judge model: \`${manifest.judgeModel}\``,
    `- Judge repeats per history: ${manifest.judgeRepeats}`,
    `- Level 3 prompt: \`${manifest.level3Prompt}\``,
    `- Judge prompt baseline: \`${judgePromptSource.path}\``,
    '- Stability gate: disabled (diagnostic only)',
    '- Validation: deferred',
    '',
    '## Judge Prompt Provenance',
    '',
    '| Scenario | Frozen baseline SHA-256 | Live production SHA-256 | Byte-identical |',
    '| --- | --- | --- | --- |',
    ...promptSourceRows,
    '',
    '| Scenario | Units | Histories | Normal judge calls/candidate |',
    '| --- | ---: | ---: | ---: |',
    ...scenarioRows,
    `| **Total** | **${manifest.units.length}** | **${manifest.counts.totalHistories}** | **${manifest.counts.totalNormalJudgeCallsPerCandidate}** |`,
    '',
    '## Units',
    '',
    '| Scenario | Unit | Label | Canonical side |',
    '| --- | --- | --- | --- |',
    ...unitRows,
    '',
    'No player or judge API call was made while producing this manifest.',
    '',
  ].join('\n')
}

async function runPrepare(options: Record<string, string>) {
  const scenarioIds = parseScenarioIds(requiredOption(options, 'scenario'))
  const outputDir = resolve(
    option(
      options,
      'output-dir',
      `docs/bench/runs/judge-prompt-balance-${timestampSlug()}`,
    ),
  )
  if (
    existsSync(join(outputDir, 'config.json')) ||
    existsSync(manifestPath(outputDir))
  ) {
    throw new Error(
      `Output directory already contains a calibration run: ${outputDir}`,
    )
  }
  const apiUrl = option(options, 'api-url', process.env.AXIIA_API_URL ?? '')
  const authToken = option(
    options,
    'auth-token',
    process.env.AXIIA_AUTH_TOKEN ?? '',
  )
  const playerModels = parsePlayerModels(
    option(options, 'player-models', DEFAULT_PLAYER_MODELS.join(',')),
  )
  const historiesPerModel = positiveInteger(
    option(options, 'histories-per-model', String(DEFAULT_HISTORIES_PER_MODEL)),
    '--histories-per-model',
  )
  const judgeRepeats = positiveInteger(
    option(options, 'judge-repeats', String(DEFAULT_JUDGE_REPEATS)),
    '--judge-repeats',
  )
  const judgeModel = parseJudgeModel(
    option(options, 'judge-model', DEFAULT_JUDGE_MODEL),
  )
  const retrievedAt = new Date().toISOString()
  const productionScenarios = await fetchProductionScenarios({
    apiUrl,
    authToken,
    scenarioIds,
  })
  const judgePromptSnapshotPath = option(
    options,
    'judge-prompt-snapshot',
    DEFAULT_JUDGE_PROMPT_SNAPSHOT_PATH,
  )
  const { scenarios, source: judgePromptSource } =
    await loadJudgeSensitivityPromptSnapshot({
      path: judgePromptSnapshotPath,
      productionScenarios,
      scenarioIds,
    })
  const source: RunConfig['productionSource'] = {
    apiOrigin: new URL(apiUrl).origin,
    apiUrl: apiUrl.replace(/\/+$/u, ''),
    retrievedAt,
    sourceNote: option(options, 'source-note') || null,
  }
  const config: RunConfig = {
    benchmarkName: BENCHMARK_NAME,
    createdAt: retrievedAt,
    git: gitState(),
    historiesPerModel,
    historyConcurrency: positiveInteger(
      option(
        options,
        'history-concurrency',
        String(DEFAULT_HISTORY_CONCURRENCY),
      ),
      '--history-concurrency',
    ),
    judgeCallTimeoutMs: positiveInteger(
      option(
        options,
        'judge-call-timeout-ms',
        String(DEFAULT_JUDGE_CALL_TIMEOUT_MS),
      ),
      '--judge-call-timeout-ms',
    ),
    judgeConcurrency: positiveInteger(
      option(options, 'judge-concurrency', String(DEFAULT_JUDGE_CONCURRENCY)),
      '--judge-concurrency',
    ),
    judgeModel,
    judgePromptSource,
    judgeRepeats,
    kind: 'judge_prompt_balance.config',
    level3Prompt: LEVEL_3_PROMPT,
    outputDir,
    playerModels,
    productionSource: source,
    runId: randomUUID(),
    scenarioIds,
    stabilityGate: false,
    validationDeferred: true,
  }
  const manifest = buildCalibrationManifest({
    historiesPerModel,
    judgeModel,
    judgeRepeats,
    playerModels,
    scenarioIds,
    scenarios,
  })
  assertTrolleyOnlyManifest(manifest)
  const snapshotsArtifact: ScenarioSnapshotsArtifact = {
    generatedAt: retrievedAt,
    judgePromptSource,
    kind: 'judge_prompt_balance.scenario_snapshots',
    productionSource: source,
    scenarios,
  }

  await mkdir(outputDir, { recursive: true })
  await Promise.all([
    writeJsonAtomic(join(outputDir, 'config.json'), config),
    writeJsonAtomic(scenarioSnapshotsPath(outputDir), snapshotsArtifact),
    writeJsonAtomic(manifestPath(outputDir), manifest),
    writeTextAtomic(
      join(outputDir, 'manifest.md'),
      renderManifestMarkdown(manifest, judgePromptSource),
    ),
  ])

  for (const scenarioId of scenarioIds) {
    const scenario = scenarios[scenarioId]
    if (!scenario) throw new Error(`Missing prepared scenario: ${scenarioId}`)
    const promptSource = judgePromptSource.scenarios[scenarioId]
    if (!promptSource) {
      throw new Error(`Missing judge-prompt provenance: ${scenarioId}`)
    }
    const candidateId = `${candidatePrefix(scenarioId)}-P0`
    await writeCandidate(outputDir, {
      benchmarkBaseline: true,
      candidateId,
      createdAt: retrievedAt,
      evidence: null,
      exactDiffFromParent: '',
      hypothesis: null,
      kind: 'judge_prompt_balance.candidate',
      observedFailure: null,
      parentCandidateId: null,
      prediction: null,
      productionBaseline: promptSource.byteIdenticalToProduction,
      prompt: scenario.judgePrompt,
      promptChars: scenario.judgePrompt.length,
      promptHash: sha256(scenario.judgePrompt),
      scenarioId,
    })
  }
  await writePromptResultsSummary(outputDir)

  console.log(
    `[judge-prompt-balance] dry-run manifest: ${join(outputDir, 'manifest.md')}`,
  )
  console.log(
    `[judge-prompt-balance] histories=${manifest.counts.totalHistories} judge-calls/candidate=${manifest.counts.totalNormalJudgeCallsPerCandidate}`,
  )
}

async function loadRun(outputDir: string) {
  const [config, snapshots, manifest] = await Promise.all([
    readJson<RunConfig>(join(outputDir, 'config.json')),
    readJson<ScenarioSnapshotsArtifact>(scenarioSnapshotsPath(outputDir)),
    readJson<CalibrationManifest>(manifestPath(outputDir)),
  ])
  const { manifestHash: _manifestHash, ...withoutHash } = manifest
  if (sha256(withoutHash) !== manifest.manifestHash) {
    throw new Error('Manifest hash mismatch; refusing to run modified jobs')
  }
  if (
    sha256(snapshots.judgePromptSource) !== sha256(config.judgePromptSource) ||
    sha256(snapshots.productionSource) !== sha256(config.productionSource)
  ) {
    throw new Error('Scenario source provenance mismatch')
  }
  for (const scenarioId of config.scenarioIds) {
    const scenario = snapshots.scenarios[scenarioId]
    if (!scenario) throw new Error(`Missing frozen scenario ${scenarioId}`)
    if (
      scenarioSnapshot(scenarioRecordFromSnapshot(scenario))
        .scenarioSnapshotHash !== scenario.scenarioSnapshotHash
    ) {
      throw new Error(`Frozen scenario hash mismatch: ${scenarioId}`)
    }
    const p0 = await readJson<CandidateRecord>(
      candidateRecordPath(outputDir, `${candidatePrefix(scenarioId)}-P0`),
    )
    const promptSource = config.judgePromptSource.scenarios[scenarioId]
    if (!promptSource) {
      throw new Error(`Missing judge-prompt provenance: ${scenarioId}`)
    }
    if (
      !p0.benchmarkBaseline ||
      p0.prompt !== scenario.judgePrompt ||
      p0.promptHash !== scenario.judgePromptHash ||
      p0.productionBaseline !== promptSource.byteIdenticalToProduction
    ) {
      throw new Error(
        `${p0.candidateId} is not byte-for-byte frozen benchmark P0`,
      )
    }
  }
  assertTrolleyOnlyManifest(manifest)
  return { config, manifest, snapshots }
}

function scenarioForJob(
  snapshot: ScenarioSnapshot,
  job: Pick<
    HistoryJob | HistoryResult,
    'roleAName' | 'roleARequests' | 'roleBName' | 'roleBRequests'
  >,
  judgePrompt = snapshot.judgePrompt,
) {
  return {
    ...snapshot,
    judgeOsPrompt: '',
    judgePrompt,
    roleAName: job.roleAName,
    roleARequests: JSON.stringify(job.roleARequests),
    roleBName: job.roleBName,
    roleBRequests: JSON.stringify(job.roleBRequests),
  } satisfies ScenarioRecord
}

function dummyJudgeOutput(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
) {
  if (scenario.id === SHANGYANG_SCENARIO_ID) {
    const requests = [
      ...parseJsonArray<RequestItem>(scenario.roleARequests, 'roleARequests'),
      ...parseJsonArray<RequestItem>(scenario.roleBRequests, 'roleBRequests'),
    ]
    return JSON.stringify({
      judgment: '变法',
      requests: Object.fromEntries(
        requests.map((request) => [request.id, '不同意']),
      ),
      speech: '变法。',
    })
  }
  if (scenario.id === HONNOJI_SCENARIO_ID) {
    const requests = [
      ...parseJsonArray<RequestItem>(scenario.roleARequests, 'roleARequests'),
      ...parseJsonArray<RequestItem>(scenario.roleBRequests, 'roleBRequests'),
    ]
    return JSON.stringify({
      judgment: '袭击本能寺',
      requests: Object.fromEntries(
        requests.map((request) => [request.id, '不同意']),
      ),
      speech: '敌在本能寺！',
    })
  }
  return JSON.stringify({
    judgments: Object.fromEntries(
      (assignment.selectedCaseIds ?? []).map((caseId) => [caseId, '一人侧']),
    ),
    speech: '本次占位裁决只用于停止历史生成流程。',
    winner: '一人侧',
  })
}

async function runHistoryJob(params: {
  existing: HistoryResult | null
  job: HistoryJob
  jobTimeoutMs: number
  runId: string
  snapshot: ScenarioSnapshot
}) {
  const startedAt = Date.now()
  const scenario = scenarioForJob(params.snapshot, params.job)
  let transcript = [...(params.existing?.transcript ?? [])]
  let judgeTranscriptA = [...(params.existing?.judgeTranscriptA ?? [])]
  let judgeTranscriptB = [...(params.existing?.judgeTranscriptB ?? [])]
  const controller = new AbortController()
  const timeout = setTimeout(
    () =>
      controller.abort(`History job timed out after ${params.jobTimeoutMs}ms`),
    params.jobTimeoutMs,
  )
  const completeChat: typeof chatCompletion = async (completionParams) => {
    if (completionParams.trace?.phase === 'judgment') {
      return dummyJudgeOutput(scenario, params.job.assignment)
    }
    if (completionParams.trace?.phase === 'scoring') {
      throw new Error(
        'Unexpected external scorer call during history generation',
      )
    }
    return chatCompletion(completionParams)
  }

  try {
    const result = await executeMatchSession({
      benchmarkCaseId: params.job.jobId,
      benchmarkName: BENCHMARK_NAME,
      benchmarkRunId: params.runId,
      completeChat,
      infoAssignment: params.job.assignment,
      judgeTranscriptA,
      judgeTranscriptB,
      modelA: params.job.playerModel,
      modelB: params.job.playerModel,
      onDialogueTurn: (nextTranscript) => {
        transcript = [...nextTranscript]
      },
      onJudgeTranscriptA: (next) => {
        judgeTranscriptA = [...next]
      },
      onJudgeTranscriptB: (next) => {
        judgeTranscriptB = [...next]
      },
      promptA: LEVEL_3_PROMPT,
      promptB: LEVEL_3_PROMPT,
      scenario,
      signal: controller.signal,
      transcript,
    })
    clearTimeout(timeout)
    return historyResult(params.job, {
      durationMs: Date.now() - startedAt,
      error: null,
      judgeTranscriptA: result.judgeTranscriptA,
      judgeTranscriptB: result.judgeTranscriptB,
      status: 'ok',
      transcript: result.transcript,
    })
  } catch (error) {
    clearTimeout(timeout)
    return historyResult(params.job, {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      judgeTranscriptA,
      judgeTranscriptB,
      status: 'error',
      transcript,
    })
  }
}

function historyResult(
  job: HistoryJob,
  result: Pick<
    HistoryResult,
    | 'durationMs'
    | 'error'
    | 'judgeTranscriptA'
    | 'judgeTranscriptB'
    | 'status'
    | 'transcript'
  >,
): HistoryResult {
  return {
    assignment: job.assignment,
    durationMs: result.durationMs,
    error: result.error,
    generatedAt: new Date().toISOString(),
    historyIndex: job.historyIndex,
    jobId: job.jobId,
    judgeTranscriptA: result.judgeTranscriptA,
    judgeTranscriptB: result.judgeTranscriptB,
    models: { agentA: job.playerModel, agentB: job.playerModel },
    playerModel: job.playerModel,
    promptA: LEVEL_3_PROMPT,
    promptAHash: sha256(LEVEL_3_PROMPT),
    promptB: LEVEL_3_PROMPT,
    promptBHash: sha256(LEVEL_3_PROMPT),
    roleAKey: job.roleAKey,
    roleAName: job.roleAName,
    roleARequests: job.roleARequests,
    roleBKey: job.roleBKey,
    roleBName: job.roleBName,
    roleBRequests: job.roleBRequests,
    scenarioId: job.scenarioId,
    status: result.status,
    transcript: result.transcript,
    unitId: job.id,
    unitLabel: job.label,
  }
}

async function workerPool<T>(params: {
  concurrency: number
  items: T[]
  task: (item: T) => Promise<void>
}) {
  let cursor = 0
  let active = 0
  let achievedConcurrency = 0
  const workers = Array.from(
    { length: Math.min(params.concurrency, params.items.length) },
    async () => {
      for (;;) {
        const index = cursor
        cursor += 1
        const item = params.items[index]
        if (item == null) return
        active += 1
        achievedConcurrency = Math.max(achievedConcurrency, active)
        try {
          await params.task(item)
        } finally {
          active -= 1
        }
      }
    },
  )
  await Promise.all(workers)
  return { achievedConcurrency }
}

function sortedHistories(
  histories: HistoryResult[],
  manifest: CalibrationManifest,
) {
  const order = new Map(manifest.jobs.map((job, index) => [job.jobId, index]))
  return [...histories].sort(
    (left, right) =>
      (order.get(left.jobId) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.jobId) ?? Number.MAX_SAFE_INTEGER),
  )
}

function historiesArtifact(
  histories: HistoryResult[],
  manifest: CalibrationManifest,
): HistoriesArtifact {
  const sorted = sortedHistories(histories, manifest)
  return {
    generatedAt: new Date().toISOString(),
    histories: sorted,
    kind: 'judge_prompt_balance.histories',
    manifestHash: manifest.manifestHash,
    summary: {
      completed: sorted.filter((history) => history.status === 'ok').length,
      errored: sorted.filter((history) => history.status === 'error').length,
      expected: manifest.jobs.length,
    },
  }
}

function renderExamination(examination: JudgeQA[]) {
  if (examination.length === 0) return 'None.'
  return examination
    .map(
      (item) =>
        `- Selected: \`${item.selectedInfoId ?? 'none'}\`; correct: ${item.isCorrect == null ? 'unknown' : item.isCorrect ? 'yes' : 'no'}; answer: ${item.answer}`,
    )
    .join('\n')
}

function renderHistoriesMarkdown(artifact: HistoriesArtifact) {
  const lines = [
    '# Neutral Level-3 Debate Histories',
    '',
    `- Completed: ${artifact.summary.completed}/${artifact.summary.expected}`,
    `- Errors: ${artifact.summary.errored}`,
    `- Level-3 prompt on both sides: \`${LEVEL_3_PROMPT}\``,
    '',
  ]
  for (const history of artifact.histories) {
    lines.push(
      `<details${history.status === 'error' ? ' open' : ''}>`,
      `<summary>${history.jobId} (${history.status})</summary>`,
      '',
      `- Unit: ${history.unitLabel}`,
      `- Player model on both sides: \`${history.playerModel}\``,
      `- Duration: ${history.durationMs} ms`,
      `- Error: ${history.error ?? 'none'}`,
      '',
      '### Debate',
      '',
    )
    if (history.transcript.length === 0) {
      lines.push('No completed turns.')
    } else {
      for (const [index, turn] of history.transcript.entries()) {
        lines.push(
          `**Turn ${index + 1} - ${turn.role} (${turn.speaker})**`,
          '',
          turn.content,
          '',
        )
      }
    }
    lines.push(
      '### Examination A',
      '',
      renderExamination(history.judgeTranscriptA),
      '',
      '### Examination B',
      '',
      renderExamination(history.judgeTranscriptB),
      '',
      '</details>',
      '',
    )
  }
  return lines.join('\n')
}

async function runHistories(options: Record<string, string>) {
  const outputDir = resolve(requiredOption(options, 'output-dir'))
  const { config, manifest, snapshots } = await loadRun(outputDir)
  const concurrency = positiveInteger(
    option(options, 'history-concurrency', String(config.historyConcurrency)),
    '--history-concurrency',
  )
  const jobTimeoutMs = positiveInteger(
    option(options, 'job-timeout-ms', String(DEFAULT_JOB_TIMEOUT_MS)),
    '--job-timeout-ms',
  )
  const existingArtifact = existsSync(historiesPath(outputDir))
    ? await readJson<HistoriesArtifact>(historiesPath(outputDir))
    : null
  if (
    existingArtifact &&
    existingArtifact.manifestHash !== manifest.manifestHash
  ) {
    throw new Error('Existing histories were generated from another manifest')
  }
  const resultMap = new Map(
    (existingArtifact?.histories ?? []).map((history) => [
      history.jobId,
      history,
    ]),
  )
  const pending = manifest.jobs.filter(
    (job) => resultMap.get(job.jobId)?.status !== 'ok',
  )
  let writeQueue = Promise.resolve()
  const persist = () => {
    const artifact = historiesArtifact([...resultMap.values()], manifest)
    writeQueue = writeQueue.then(() =>
      Promise.all([
        writeJsonAtomic(historiesPath(outputDir), artifact),
        writeTextAtomic(
          join(outputDir, 'histories.md'),
          renderHistoriesMarkdown(artifact),
        ),
      ]).then(() => undefined),
    )
    return writeQueue
  }

  console.log(
    `[judge-prompt-balance] history jobs pending=${pending.length} concurrency=${concurrency}`,
  )
  await workerPool({
    concurrency,
    items: pending,
    task: async (job) => {
      const snapshot = snapshots.scenarios[job.scenarioId]
      if (!snapshot) throw new Error(`Missing snapshot: ${job.scenarioId}`)
      const result = await runHistoryJob({
        existing: resultMap.get(job.jobId) ?? null,
        job,
        jobTimeoutMs,
        runId: config.runId,
        snapshot,
      })
      resultMap.set(job.jobId, result)
      await persist()
      console.log(
        `[judge-prompt-balance] history ${result.status} ${result.jobId} turns=${result.transcript.length}`,
      )
    },
  })
  await persist()
  await writeQueue
  const finalArtifact = historiesArtifact([...resultMap.values()], manifest)
  if (
    finalArtifact.summary.completed !== finalArtifact.summary.expected ||
    finalArtifact.summary.errored > 0
  ) {
    throw new Error(
      `History panel incomplete: ${finalArtifact.summary.completed}/${finalArtifact.summary.expected} completed, ${finalArtifact.summary.errored} errors`,
    )
  }
}

function stripMarkdownCodeFence(raw: string) {
  const trimmed = raw.trim()
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/iu)
  return match?.[1]?.trim() ?? trimmed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJsonRecord(raw: string) {
  try {
    const parsed = JSON.parse(stripMarkdownCodeFence(raw)) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function extractBalancedObject(text: string, start: number) {
  let depth = 0
  let escaped = false
  let inString = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, index + 1)
    }
  }
  return null
}

function extractFirstJsonRecord(raw: string) {
  const direct = parseJsonRecord(raw)
  if (direct) return direct
  const start = raw.indexOf('{')
  if (start < 0) return null
  const object = extractBalancedObject(raw, start)
  return object ? parseJsonRecord(object) : null
}

function stringValue(value: unknown) {
  if (value == null) return null
  return String(value).trim() || null
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, String(entry)]),
  )
}

function winnerFromPolicyText(
  scenarioId: CalibrationScenarioId,
  value: string | null,
) {
  const text = value ?? ''
  if (scenarioId === SHANGYANG_SCENARIO_ID) {
    if (text.includes('维持现状')) return 'b'
    if (text.includes('变法')) return 'a'
    return 'unknown'
  }
  if (scenarioId === HONNOJI_SCENARIO_ID) {
    if (
      text.includes('西进毛利') ||
      text.includes('避免刺杀') ||
      text.includes('不杀信长')
    ) {
      return 'b'
    }
    if (
      text.includes('袭击本能寺') ||
      text.includes('攻打本能寺') ||
      text.includes('刺杀信长') ||
      text.includes('杀信长')
    ) {
      return 'a'
    }
    return 'unknown'
  }
  if (text.includes('一人侧')) return 'a'
  if (text.includes('五人侧')) return 'b'
  return 'unknown'
}

export function parseJudgeOutput(params: {
  caseId?: string | null
  rawOutput: string
  scenarioId: CalibrationScenarioId
}): ParsedJudgePolicy {
  const record = extractFirstJsonRecord(params.rawOutput)
  const judgment = stringValue(record?.judgment)
  const judgments = stringRecord(record?.judgments)
  const requests = stringRecord(record?.requests)
  const policyText =
    params.scenarioId === TROLLEY_SCENARIO_ID && params.caseId
      ? (judgments[params.caseId] ?? null)
      : judgment
  const policyWinner = winnerFromPolicyText(params.scenarioId, policyText)
  return {
    judgment,
    judgments,
    parseError: !record
      ? 'No JSON object parsed'
      : policyWinner === 'unknown'
        ? 'Could not resolve canonical policy side'
        : null,
    policyWinner,
    requests,
  }
}

export function verifyThinkingCapture(
  capture: ChatCompletionCapture,
): ThinkingVerification {
  const errors: string[] = []
  const requestControl = capture.thinkingRequestControl
  const nativeControl = requestControl?.thinking
  const enabledByNativeControl =
    isRecord(nativeControl) && nativeControl.type === 'enabled'
  const enabledByBooleanControl = requestControl?.enable_thinking === true
  if (!enabledByNativeControl && !enabledByBooleanControl) {
    errors.push('request did not contain an explicit thinking-on control')
  }
  if (capture.thinkingMode !== 'enabled') {
    errors.push(`captured thinking mode was ${capture.thinkingMode}`)
  }
  if (
    capture.reasoningContentChars <= 0 &&
    (capture.tokenUsage.reasoningTokens == null ||
      capture.tokenUsage.reasoningTokens <= 0)
  ) {
    errors.push('response contained no observable reasoning evidence')
  }
  if (!capture.providerResponseId) {
    errors.push('provider response ID was missing')
  }
  return {
    evidence: {
      reasoningContentChars: capture.reasoningContentChars,
      reasoningTokens: capture.tokenUsage.reasoningTokens,
    },
    errors,
    passed: errors.length === 0,
    providerResponseIdPresent: capture.providerResponseId != null,
    requestControl,
  }
}

async function capturedCompletion(
  params: Omit<Parameters<typeof chatCompletion>[0], 'capture'>,
) {
  let capture: ChatCompletionCapture | null = null
  const content = await chatCompletion({
    ...params,
    capture: (value) => {
      capture = value
    },
  })
  if (capture == null) {
    throw new Error('LLM completion returned without capture metadata')
  }
  return { capture: capture as ChatCompletionCapture, content }
}

async function loadHistoriesComplete(
  outputDir: string,
  manifest: CalibrationManifest,
) {
  const artifact = await readJson<HistoriesArtifact>(historiesPath(outputDir))
  if (artifact.manifestHash !== manifest.manifestHash) {
    throw new Error('Histories do not belong to this manifest')
  }
  if (
    artifact.summary.completed !== manifest.jobs.length ||
    artifact.summary.errored > 0
  ) {
    throw new Error(
      `Histories are incomplete: ${artifact.summary.completed}/${manifest.jobs.length}`,
    )
  }
  return artifact
}

async function loadCandidate(outputDir: string, candidateId: string) {
  const candidate = await readJson<CandidateRecord>(
    candidateRecordPath(outputDir, candidateId),
  )
  if (candidate.promptHash !== sha256(candidate.prompt)) {
    throw new Error(`Candidate prompt hash mismatch: ${candidateId}`)
  }
  return candidate
}

function buildCandidateJudgePrompt(params: {
  candidate: CandidateRecord
  history: HistoryResult
  snapshot: ScenarioSnapshot
}) {
  const scenario = scenarioForJob(
    params.snapshot,
    params.history,
    params.candidate.prompt,
  )
  return {
    judgePrompt: buildJudgeRuntimeSystemPrompt(
      scenario,
      params.history.assignment,
      params.history.transcript,
      params.history.judgeTranscriptA,
      params.history.judgeTranscriptB,
    ),
    scenario,
  }
}

function renderPreflightMarkdown(artifact: PreflightArtifact) {
  return [
    '# Judge Thinking Preflight',
    '',
    `- Status: **${artifact.status}**`,
    `- Judge model: \`${artifact.judgeModel}\``,
    `- Candidate used: \`${artifact.candidateId}\``,
    `- Provider: \`${artifact.capture?.provider ?? 'unknown'}\``,
    `- API model: \`${artifact.capture?.apiModel ?? 'unknown'}\``,
    `- Request control: \`${JSON.stringify(artifact.verification?.requestControl ?? null)}\``,
    `- Reasoning content characters: ${artifact.verification?.evidence.reasoningContentChars ?? 0}`,
    `- Reasoning tokens: ${artifact.verification?.evidence.reasoningTokens ?? 'unreported'}`,
    `- Provider response ID present: ${artifact.verification?.providerResponseIdPresent ? 'yes' : 'no'}`,
    `- Verdict parse: ${artifact.parsedPolicy?.parseError == null && artifact.parsedPolicy ? 'passed' : 'failed'}`,
    `- Parsed policy side: ${artifact.parsedPolicy?.policyWinner ?? 'unknown'}`,
    `- Error: ${artifact.error ?? 'none'}`,
    '',
  ].join('\n')
}

async function runPreflight(options: Record<string, string>) {
  const outputDir = resolve(requiredOption(options, 'output-dir'))
  const { config, manifest, snapshots } = await loadRun(outputDir)
  const histories = await loadHistoriesComplete(outputDir, manifest)
  const candidateId = option(
    options,
    'candidate',
    `${candidatePrefix(config.scenarioIds[0]!)}-P0`,
  )
  const candidate = await loadCandidate(outputDir, candidateId)
  const history = histories.histories.find(
    (item) => item.scenarioId === candidate.scenarioId,
  )
  const snapshot = snapshots.scenarios[candidate.scenarioId]
  if (!history || !snapshot) {
    throw new Error(`No frozen history for preflight candidate ${candidateId}`)
  }
  const { judgePrompt } = buildCandidateJudgePrompt({
    candidate,
    history,
    snapshot,
  })
  let artifact: PreflightArtifact
  try {
    const completion = await capturedCompletion({
      messages: [{ role: 'user', content: '请做出你的裁决。' }],
      model: config.judgeModel,
      systemPrompt: judgePrompt,
      temperature: 0,
      thinkingMode: 'enabled',
      trace: {
        benchmarkCaseId: 'thinking-preflight',
        benchmarkName: BENCHMARK_NAME,
        benchmarkRunId: config.runId,
        phase: 'judgment',
        scenarioId: candidate.scenarioId,
        side: 'judge',
      },
    })
    const verification = verifyThinkingCapture(completion.capture)
    const parsedPolicy = parseJudgeOutput({
      caseId: history.assignment.selectedCaseIds?.[0] ?? null,
      rawOutput: completion.content,
      scenarioId: history.scenarioId,
    })
    const errors = [
      ...verification.errors,
      ...(parsedPolicy.parseError ? [parsedPolicy.parseError] : []),
    ]
    artifact = {
      capture: completion.capture,
      candidateId,
      error: errors.length === 0 ? null : errors.join('; '),
      generatedAt: new Date().toISOString(),
      judgeModel: config.judgeModel,
      kind: 'judge_prompt_balance.thinking_preflight',
      parsedPolicy,
      status: errors.length === 0 ? 'passed' : 'failed',
      verification,
    }
  } catch (error) {
    artifact = {
      capture: null,
      candidateId,
      error: error instanceof Error ? error.message : String(error),
      generatedAt: new Date().toISOString(),
      judgeModel: config.judgeModel,
      kind: 'judge_prompt_balance.thinking_preflight',
      parsedPolicy: null,
      status: 'failed',
      verification: null,
    }
  }
  await Promise.all([
    writeJsonAtomic(preflightPath(outputDir), artifact),
    writeTextAtomic(
      join(outputDir, 'thinking-preflight.md'),
      renderPreflightMarkdown(artifact),
    ),
  ])
  if (artifact.status !== 'passed') {
    throw new Error(`Judge preflight failed: ${artifact.error}`)
  }
  console.log(
    `[judge-prompt-balance] judge preflight passed response-id=${artifact.capture?.providerResponseId}`,
  )
}

function promptVariables(prompt: string) {
  const counts = new Map<string, number>()
  for (const match of prompt.matchAll(/\{\{(\w+)\}\}/gu)) {
    const key = match[1]!
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  )
}

function unifiedDiff(params: {
  childId: string
  childPath: string
  parentId: string
  parentPath: string
}) {
  try {
    return execFileSync(
      'diff',
      [
        '-u',
        '--label',
        params.parentId,
        '--label',
        params.childId,
        params.parentPath,
        params.childPath,
      ],
      { encoding: 'utf8' },
    )
  } catch (error) {
    const stdout = (error as { stdout?: Buffer | string }).stdout
    if (typeof stdout === 'string') return stdout
    if (stdout) return stdout.toString('utf8')
    throw error
  }
}

async function runAddCandidate(options: Record<string, string>) {
  const outputDir = resolve(requiredOption(options, 'output-dir'))
  const scenarioId = parseScenarioIds(requiredOption(options, 'scenario'))[0]!
  const candidateId = requiredOption(options, 'id')
  const parentId = requiredOption(options, 'parent')
  const promptFile = resolve(requiredOption(options, 'prompt-file'))
  const evidenceFile = resolve(requiredOption(options, 'evidence-file'))
  const { config } = await loadRun(outputDir)
  if (!config.scenarioIds.includes(scenarioId)) {
    throw new Error(`Scenario ${scenarioId} is outside this run manifest`)
  }
  if (
    !new RegExp(`^${candidatePrefix(scenarioId)}-P\\d+$`, 'u').test(candidateId)
  ) {
    throw new Error(
      `Candidate id must use the ${candidatePrefix(scenarioId)}-Pn form`,
    )
  }
  if (existsSync(candidateRecordPath(outputDir, candidateId))) {
    throw new Error(`Candidate already exists: ${candidateId}`)
  }
  const parent = await loadCandidate(outputDir, parentId)
  if (parent.scenarioId !== scenarioId) {
    throw new Error('Candidate and parent scenario IDs differ')
  }
  const [prompt, evidence] = await Promise.all([
    readFile(promptFile, 'utf8'),
    readJson<CandidateEvidenceFile>(evidenceFile),
  ])
  if (prompt === parent.prompt) {
    throw new Error('Candidate prompt is unchanged from its parent')
  }
  if (
    JSON.stringify(promptVariables(prompt)) !==
    JSON.stringify(promptVariables(parent.prompt))
  ) {
    throw new Error(
      'Candidate changed the production template-variable contract',
    )
  }
  for (const key of [
    'evidence',
    'hypothesis',
    'observedFailure',
    'prediction',
  ] as const) {
    if (!evidence[key]?.trim()) {
      throw new Error(`Candidate evidence file is missing ${key}`)
    }
  }

  const directory = candidateDir(outputDir, candidateId)
  await mkdir(directory, { recursive: true })
  const childPromptPath = join(directory, 'prompt.txt')
  await writeTextAtomic(childPromptPath, prompt)
  const diff = unifiedDiff({
    childId: candidateId,
    childPath: childPromptPath,
    parentId,
    parentPath: join(candidateDir(outputDir, parentId), 'prompt.txt'),
  })
  await writeCandidate(outputDir, {
    benchmarkBaseline: false,
    candidateId,
    createdAt: new Date().toISOString(),
    evidence: evidence.evidence.trim(),
    exactDiffFromParent: diff,
    hypothesis: evidence.hypothesis.trim(),
    kind: 'judge_prompt_balance.candidate',
    observedFailure: evidence.observedFailure.trim(),
    parentCandidateId: parentId,
    prediction: evidence.prediction.trim(),
    productionBaseline: false,
    prompt,
    promptChars: prompt.length,
    promptHash: sha256(prompt),
    scenarioId,
  })
  await writePromptResultsSummary(outputDir)
  console.log(`[judge-prompt-balance] added ${candidateId}`)
}

function sleep(delayMs: number) {
  return new Promise((done) => setTimeout(done, delayMs))
}

function isRateLimitError(message: string) {
  return /\b429\b|rate.?limit|too many requests/iu.test(message)
}

async function runJudgeJob(params: {
  cachePhase: 'replay' | 'warmup'
  candidate: CandidateRecord
  config: RunConfig
  history: HistoryResult
  repeatIndex: number
  snapshot: ScenarioSnapshot
}) {
  const id = `${params.candidate.candidateId}__${params.history.jobId}__repeat-${params.repeatIndex}`
  const { judgePrompt } = buildCandidateJudgePrompt({
    candidate: params.candidate,
    history: params.history,
    snapshot: params.snapshot,
  })
  const attempts: JudgeAttempt[] = []

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const attemptStartedAt = Date.now()
    try {
      const completion = await capturedCompletion({
        messages: [{ role: 'user', content: '请做出你的裁决。' }],
        model: params.config.judgeModel,
        signal: AbortSignal.timeout(params.config.judgeCallTimeoutMs),
        systemPrompt: judgePrompt,
        temperature: 0,
        thinkingMode: 'enabled',
        trace: {
          attempt,
          benchmarkCaseId: id,
          benchmarkName: BENCHMARK_NAME,
          benchmarkRunId: params.config.runId,
          phase: 'judgment',
          scenarioId: params.history.scenarioId,
          side: 'judge',
          turnIndex: params.history.transcript.length,
        },
      })
      const verification = verifyThinkingCapture(completion.capture)
      attempts.push({
        attempt,
        capture: completion.capture,
        durationMs: Date.now() - attemptStartedAt,
        error: verification.passed ? null : verification.errors.join('; '),
        thinkingVerification: verification,
      })
      if (!verification.passed) {
        throw new Error(verification.errors.join('; '))
      }
      const parsedPolicy = parseJudgeOutput({
        caseId: params.history.assignment.selectedCaseIds?.[0] ?? null,
        rawOutput: completion.content,
        scenarioId: params.history.scenarioId,
      })
      if (parsedPolicy.parseError) {
        throw new Error(parsedPolicy.parseError)
      }
      return {
        attempts,
        cachePhase: params.cachePhase,
        cachedPromptTokens: completion.capture.tokenUsage.cachedTokens,
        candidateId: params.candidate.candidateId,
        durationMs: completion.capture.durationMs,
        error: null,
        generatedAt: new Date().toISOString(),
        historyJobId: params.history.jobId,
        id,
        judgeModel: params.config.judgeModel,
        judgePromptChars: judgePrompt.length,
        judgePromptHash: sha256(judgePrompt),
        parsedPolicy,
        playerModel: params.history.playerModel,
        promptTokens: completion.capture.tokenUsage.promptTokens,
        providerCreatedAt: completion.capture.providerCreatedAt,
        providerResponseId: completion.capture.providerResponseId,
        rawOutput: completion.content,
        reasoningContentChars: completion.capture.reasoningContentChars,
        reasoningTokens: completion.capture.tokenUsage.reasoningTokens,
        repeatIndex: params.repeatIndex,
        scenarioId: params.history.scenarioId,
        status: 'ok',
        thinkingVerified: true,
        unitId: params.history.unitId,
      } satisfies JudgeResult
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const existingAttempt = attempts.find((item) => item.attempt === attempt)
      if (existingAttempt) {
        existingAttempt.error ??= message
      } else {
        attempts.push({
          attempt,
          capture: null,
          durationMs: Date.now() - attemptStartedAt,
          error: message,
          thinkingVerification: null,
        })
      }
      if (attempt < MAX_ATTEMPTS) {
        await sleep(2000 * attempt)
        continue
      }
      return {
        attempts,
        cachePhase: params.cachePhase,
        cachedPromptTokens: null,
        candidateId: params.candidate.candidateId,
        durationMs: attempts.reduce(
          (total, item) => total + item.durationMs,
          0,
        ),
        error: message,
        generatedAt: new Date().toISOString(),
        historyJobId: params.history.jobId,
        id,
        judgeModel: params.config.judgeModel,
        judgePromptChars: judgePrompt.length,
        judgePromptHash: sha256(judgePrompt),
        parsedPolicy: {
          judgment: null,
          judgments: {},
          parseError: message,
          policyWinner: 'unknown',
          requests: {},
        },
        playerModel: params.history.playerModel,
        promptTokens: null,
        providerCreatedAt: null,
        providerResponseId: null,
        rawOutput: null,
        reasoningContentChars: null,
        reasoningTokens: null,
        repeatIndex: params.repeatIndex,
        scenarioId: params.history.scenarioId,
        status: 'error',
        thinkingVerified: false,
        unitId: params.history.unitId,
      } satisfies JudgeResult
    }
  }
  throw new Error('Unreachable judge retry state')
}

function sortedJudgeResults(
  results: JudgeResult[],
  manifest: CalibrationManifest,
) {
  const order = new Map(manifest.jobs.map((job, index) => [job.jobId, index]))
  return [...results].sort((left, right) => {
    const historyDifference =
      (order.get(left.historyJobId) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.historyJobId) ?? Number.MAX_SAFE_INTEGER)
    return historyDifference || left.repeatIndex - right.repeatIndex
  })
}

function duplicateResponseIds(results: JudgeResult[]) {
  const counts = new Map<string, number>()
  for (const result of results) {
    const attemptIds = result.attempts
      .map((attempt) => attempt.capture?.providerResponseId ?? null)
      .filter((id): id is string => id != null)
    const ids =
      attemptIds.length > 0
        ? attemptIds
        : result.providerResponseId
          ? [result.providerResponseId]
          : []
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
}

function judgeResultsArtifact(params: {
  achievedConcurrency: number
  candidate: CandidateRecord
  expected: number
  manifest: CalibrationManifest
  results: JudgeResult[]
}): JudgeResultsArtifact {
  const results = sortedJudgeResults(params.results, params.manifest)
  return {
    candidateId: params.candidate.candidateId,
    generatedAt: new Date().toISOString(),
    kind: 'judge_prompt_balance.judge_results',
    manifestHash: params.manifest.manifestHash,
    results,
    summary: {
      achievedConcurrency: params.achievedConcurrency,
      completed: results.filter((result) => result.status === 'ok').length,
      duplicateProviderResponseIds: duplicateResponseIds(results).length,
      errored: results.filter((result) => result.status === 'error').length,
      expected: params.expected,
      missingProviderResponseIds: results.filter(
        (result) => result.status === 'ok' && !result.providerResponseId,
      ).length,
      rateLimitAttempts: results.reduce(
        (total, result) =>
          total +
          result.attempts.filter((attempt) =>
            isRateLimitError(attempt.error ?? ''),
          ).length,
        0,
      ),
      retries: results.reduce(
        (total, result) => total + Math.max(0, result.attempts.length - 1),
        0,
      ),
    },
  }
}

function average(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length
}

export function summarizeCandidateResults(params: {
  candidate: CandidateRecord
  histories: HistoryResult[]
  judgeModel: EvaluationModelId
  judgeRepeats: number
  results: JudgeResult[]
  units: CalibrationUnit[]
}): CandidateSummary {
  const scenarioHistories = params.histories.filter(
    (history) => history.scenarioId === params.candidate.scenarioId,
  )
  const scenarioUnits = params.units.filter(
    (unit) => unit.scenarioId === params.candidate.scenarioId,
  )
  const scenarioResults = params.results.filter(
    (result) =>
      result.candidateId === params.candidate.candidateId &&
      result.scenarioId === params.candidate.scenarioId,
  )
  const duplicateIds = duplicateResponseIds(scenarioResults)
  const missingProviderResponseIds = scenarioResults.filter(
    (result) => result.status === 'ok' && !result.providerResponseId,
  ).length
  const responseGenerationCheck = {
    duplicateProviderResponseIds: duplicateIds,
    missingProviderResponseIds,
    passed: duplicateIds.length === 0 && missingProviderResponseIds === 0,
  }
  const units = scenarioUnits.map((unit): UnitSummary => {
    const unitHistories = scenarioHistories.filter(
      (history) => history.unitId === unit.id,
    )
    const unitResults = scenarioResults.filter(
      (result) => result.unitId === unit.id,
    )
    const validResults = unitResults.filter(
      (result) =>
        result.status === 'ok' &&
        result.thinkingVerified &&
        result.parsedPolicy.policyWinner !== 'unknown',
    )
    const expectedJudgments = unitHistories.length * params.judgeRepeats
    const canonicalWins = validResults.filter(
      (result) => result.parsedPolicy.policyWinner === unit.canonicalSide,
    ).length
    const histories = unitHistories.map((history): HistoryDiagnostic => {
      const historyResults = validResults.filter(
        (result) => result.historyJobId === history.jobId,
      )
      const historyCanonicalWins = historyResults.filter(
        (result) => result.parsedPolicy.policyWinner === unit.canonicalSide,
      ).length
      const historyCanonicalRate =
        historyResults.length > 0
          ? historyCanonicalWins / historyResults.length
          : null
      return {
        agreementRate:
          historyCanonicalRate == null
            ? null
            : Math.max(historyCanonicalRate, 1 - historyCanonicalRate),
        canonicalRate: historyCanonicalRate,
        historyJobId: history.jobId,
        validJudgments: historyResults.length,
      }
    })
    const modelRates = [
      ...new Set(unitHistories.map((history) => history.playerModel)),
    ].map((playerModel): ModelRate => {
      const modelHistories = unitHistories.filter(
        (history) => history.playerModel === playerModel,
      )
      const historyIds = new Set(modelHistories.map((history) => history.jobId))
      const modelResults = validResults.filter((result) =>
        historyIds.has(result.historyJobId),
      )
      const modelWins = modelResults.filter(
        (result) => result.parsedPolicy.policyWinner === unit.canonicalSide,
      ).length
      return {
        canonicalRate:
          modelResults.length > 0 ? modelWins / modelResults.length : null,
        canonicalWins: modelWins,
        expectedJudgments: modelHistories.length * params.judgeRepeats,
        playerModel,
        validJudgments: modelResults.length,
      }
    })
    const modelRateValues = modelRates
      .map((model) => model.canonicalRate)
      .filter((value): value is number => value != null)
    const canonicalRate =
      modelRateValues.length === modelRates.length
        ? average(modelRateValues)
        : null
    const instabilityValues = histories
      .map((history) => history.canonicalRate)
      .filter((value): value is number => value != null)
      .map((value) => value * (1 - value))
    return {
      canonicalRate,
      canonicalWins,
      expectedJudgments,
      fixedHistoryInstability: average(instabilityValues),
      histories,
      label: unit.label,
      modelRates,
      pass:
        validResults.length === expectedJudgments &&
        canonicalRate != null &&
        canonicalRate >= 0.3 &&
        canonicalRate <= 0.7,
      unitId: unit.id,
      validJudgments: validResults.length,
    }
  })
  const expected = scenarioHistories.length * params.judgeRepeats
  const runCompleteAndValid =
    scenarioResults.length === expected &&
    scenarioResults.every(
      (result) =>
        result.status === 'ok' &&
        result.thinkingVerified &&
        result.parsedPolicy.parseError == null,
    )
  const balanceStopConditionMet =
    units.length > 0 && units.every((unit) => unit.pass)
  const rates = units
    .map((unit) => unit.canonicalRate)
    .filter((value): value is number => value != null)
  const warmups = scenarioResults.filter(
    (result) => result.status === 'ok' && result.cachePhase === 'warmup',
  )
  const replays = scenarioResults.filter(
    (result) => result.status === 'ok' && result.cachePhase === 'replay',
  )
  const reportedUncached = scenarioResults.filter(
    (result) => result.status === 'ok' && result.cachedPromptTokens === 0,
  )
  return {
    balanceStopConditionMet,
    cache: {
      cachedCalls: scenarioResults.filter(
        (result) =>
          result.status === 'ok' && (result.cachedPromptTokens ?? 0) > 0,
      ).length,
      reportedUncachedAverageDurationMs: average(
        reportedUncached.map((result) => result.durationMs),
      ),
      reportedUncachedCalls: reportedUncached.length,
      replayAverageDurationMsExcludedFromUncachedLatency: average(
        replays.map((result) => result.durationMs),
      ),
      usageReportedCalls: scenarioResults.filter(
        (result) => result.status === 'ok' && result.promptTokens != null,
      ).length,
      warmupAverageDurationMs: average(
        warmups.map((result) => result.durationMs),
      ),
    },
    candidateId: params.candidate.candidateId,
    candidatePass:
      balanceStopConditionMet &&
      runCompleteAndValid &&
      responseGenerationCheck.passed,
    generatedAt: new Date().toISOString(),
    judgeModel: params.judgeModel,
    kind: 'judge_prompt_balance.candidate_summary',
    responseGenerationCheck,
    runCompleteAndValid,
    scenarioId: params.candidate.scenarioId,
    stabilityAffectsPass: false,
    units,
    worstUnitDeviationFromFifty:
      rates.length === units.length
        ? Math.max(...rates.map((rate) => Math.abs(rate - 0.5)))
        : null,
  }
}

function percent(value: number | null) {
  return value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`
}

function formatDurationMs(value: number | null) {
  return value == null ? 'unreported' : `${Math.round(value)} ms`
}

function renderCandidateSummary(summary: CandidateSummary) {
  const unitRows = summary.units.map(
    (unit) =>
      `| ${unit.unitId} | ${unit.label} | ${percent(unit.canonicalRate)} | ${unit.canonicalWins}/${unit.expectedJudgments} | ${unit.validJudgments}/${unit.expectedJudgments} | ${unit.pass ? 'PASS' : 'FAIL'} | ${percent(unit.fixedHistoryInstability)} |`,
  )
  const modelRows = summary.units.flatMap((unit) =>
    unit.modelRates.map(
      (model) =>
        `| ${unit.unitId} | ${model.playerModel} | ${percent(model.canonicalRate)} | ${model.canonicalWins}/${model.expectedJudgments} | ${model.validJudgments}/${model.expectedJudgments} |`,
    ),
  )
  return [
    `# ${summary.candidateId} Balance Result`,
    '',
    `- Candidate pass: **${summary.candidatePass ? 'YES' : 'NO'}**`,
    `- All unit rates in inclusive 30%-70%: ${summary.balanceStopConditionMet ? 'yes' : 'no'}`,
    `- Run complete and thinking/output valid: ${summary.runCompleteAndValid ? 'yes' : 'no'}`,
    `- Response IDs unique and present: ${summary.responseGenerationCheck.passed ? 'yes' : 'no'}`,
    `- Worst-unit deviation from 50%: ${percent(summary.worstUnitDeviationFromFifty)}`,
    '- Fixed-history stability is diagnostic only and does not affect pass/fail.',
    '- Holdout, sensitivity, presentation-swap, and bundle validations were not run.',
    '',
    '## Unit Results',
    '',
    '| Unit | Label | Canonical-side win rate | Wins/expected | Valid/expected | Gate | Instability diagnostic |',
    '| --- | --- | ---: | ---: | ---: | --- | ---: |',
    ...unitRows,
    '',
    '## Player-Model Diagnostics',
    '',
    '| Unit | Same model on both sides | Canonical-side win rate | Wins/expected | Valid/expected |',
    '| --- | --- | ---: | ---: | ---: |',
    ...modelRows,
    '',
    '## Cache And Latency',
    '',
    `- Cache usage reported: ${summary.cache.usageReportedCalls} calls`,
    `- Calls reporting cached prompt tokens: ${summary.cache.cachedCalls}`,
    `- Calls reporting zero cached prompt tokens: ${summary.cache.reportedUncachedCalls}`,
    `- Average reported-uncached latency: ${formatDurationMs(summary.cache.reportedUncachedAverageDurationMs)}`,
    `- Warmup-call latency: ${formatDurationMs(summary.cache.warmupAverageDurationMs)}`,
    `- Replay latency (reported but excluded from uncached latency): ${formatDurationMs(summary.cache.replayAverageDurationMsExcludedFromUncachedLatency)}`,
    '',
    'Every history was judged six times. Repeats measure fixed-history judge nondeterminism; they are not six independent debates.',
    '',
  ].join('\n')
}

async function writeCandidateReport(params: {
  candidate: CandidateRecord
  config: RunConfig
  histories: HistoriesArtifact
  manifest: CalibrationManifest
  results: JudgeResult[]
}) {
  const summary = summarizeCandidateResults({
    candidate: params.candidate,
    histories: params.histories.histories,
    judgeModel: params.config.judgeModel,
    judgeRepeats: params.manifest.judgeRepeats,
    results: params.results,
    units: params.manifest.units,
  })
  await Promise.all([
    writeJsonAtomic(
      candidateSummaryPath(
        params.config.outputDir,
        params.candidate.candidateId,
      ),
      summary,
    ),
    writeTextAtomic(
      join(
        candidateDir(params.config.outputDir, params.candidate.candidateId),
        'summary.md',
      ),
      renderCandidateSummary(summary),
    ),
  ])
  await writePromptResultsSummary(params.config.outputDir)
  return summary
}

async function assertPassedPreflight(
  outputDir: string,
  config: RunConfig,
  candidateId: string,
) {
  if (!existsSync(preflightPath(outputDir))) {
    throw new Error('Run the candidate judge preflight before judge replay')
  }
  const preflight = await readJson<PreflightArtifact>(preflightPath(outputDir))
  if (
    preflight.status !== 'passed' ||
    preflight.candidateId !== candidateId ||
    preflight.judgeModel !== config.judgeModel ||
    preflight.verification?.passed !== true ||
    preflight.parsedPolicy?.parseError != null ||
    preflight.parsedPolicy?.policyWinner === 'unknown'
  ) {
    throw new Error(
      'Saved judge preflight is absent, failed, or for another candidate/model',
    )
  }
  return preflight
}

async function runJudgePhase(params: {
  cachePhase: 'replay' | 'warmup'
  candidate: CandidateRecord
  concurrency: number
  config: RunConfig
  histories: HistoryResult[]
  repeatIndices: number[]
  resultMap: Map<string, JudgeResult>
  snapshots: ScenarioSnapshotsArtifact
  writeArtifact: (achievedConcurrency: number) => Promise<void>
}) {
  const jobs = params.histories.flatMap((history) =>
    params.repeatIndices.map((repeatIndex) => ({ history, repeatIndex })),
  )
  const pending = jobs.filter(({ history, repeatIndex }) => {
    const id = `${params.candidate.candidateId}__${history.jobId}__repeat-${repeatIndex}`
    return params.resultMap.get(id)?.status !== 'ok'
  })
  let completedSinceCheckpoint = 0
  const pool = await workerPool({
    concurrency: params.concurrency,
    items: pending,
    task: async ({ history, repeatIndex }) => {
      const snapshot = params.snapshots.scenarios[history.scenarioId]
      if (!snapshot) throw new Error(`Missing snapshot: ${history.scenarioId}`)
      const result = await runJudgeJob({
        cachePhase: params.cachePhase,
        candidate: params.candidate,
        config: params.config,
        history,
        repeatIndex,
        snapshot,
      })
      params.resultMap.set(result.id, result)
      completedSinceCheckpoint += 1
      if (completedSinceCheckpoint % 10 === 0) {
        void params.writeArtifact(0).catch(() => undefined)
      }
      console.log(
        `[judge-prompt-balance] ${result.status} ${result.id} ${result.durationMs}ms cached=${result.cachedPromptTokens ?? 'unreported'} response-id=${result.providerResponseId ?? 'missing'}`,
      )
    },
  })
  await params.writeArtifact(pool.achievedConcurrency)
  return pool
}

async function runJudge(options: Record<string, string>) {
  const outputDir = resolve(requiredOption(options, 'output-dir'))
  const candidateId = requiredOption(options, 'candidate')
  const { config, manifest, snapshots } = await loadRun(outputDir)
  const candidate = await loadCandidate(outputDir, candidateId)
  const preflight = await assertPassedPreflight(outputDir, config, candidateId)
  const histories = await loadHistoriesComplete(outputDir, manifest)
  if (!config.scenarioIds.includes(candidate.scenarioId)) {
    throw new Error(`Candidate ${candidateId} is outside this run manifest`)
  }
  const concurrency = positiveInteger(
    option(options, 'judge-concurrency', String(config.judgeConcurrency)),
    '--judge-concurrency',
  )
  const judgeCallTimeoutMs = positiveInteger(
    option(options, 'judge-call-timeout-ms', String(config.judgeCallTimeoutMs)),
    '--judge-call-timeout-ms',
  )
  const effectiveConfig = { ...config, judgeCallTimeoutMs }
  const candidateHistories = histories.histories.filter(
    (history) => history.scenarioId === candidate.scenarioId,
  )
  const expected = candidateHistories.length * manifest.judgeRepeats
  const existingArtifact = existsSync(
    candidateResultsPath(outputDir, candidateId),
  )
    ? await readJson<JudgeResultsArtifact>(
        candidateResultsPath(outputDir, candidateId),
      )
    : null
  if (
    existingArtifact &&
    existingArtifact.manifestHash !== manifest.manifestHash
  ) {
    throw new Error('Existing judge results belong to another manifest')
  }
  const resultMap = new Map(
    (existingArtifact?.results ?? []).map((result) => [result.id, result]),
  )
  let achievedConcurrency = existingArtifact?.summary.achievedConcurrency ?? 0
  let writeQueue = Promise.resolve()
  const persist = (phaseAchievedConcurrency: number) => {
    achievedConcurrency = Math.max(
      achievedConcurrency,
      phaseAchievedConcurrency,
    )
    const artifact = judgeResultsArtifact({
      achievedConcurrency,
      candidate,
      expected,
      manifest,
      results: [...resultMap.values()],
    })
    writeQueue = writeQueue.then(() =>
      writeJsonAtomic(candidateResultsPath(outputDir, candidateId), artifact),
    )
    return writeQueue
  }

  console.log(
    `[judge-prompt-balance] warmups=${candidateHistories.length} concurrency=${concurrency}`,
  )
  const warmupPool = await runJudgePhase({
    cachePhase: 'warmup',
    candidate,
    concurrency,
    config: effectiveConfig,
    histories: candidateHistories,
    repeatIndices: [1],
    resultMap,
    snapshots,
    writeArtifact: persist,
  })
  achievedConcurrency = Math.max(
    achievedConcurrency,
    warmupPool.achievedConcurrency,
  )
  await writeQueue
  const warmupResults = [...resultMap.values()].filter(
    (result) => result.candidateId === candidateId && result.repeatIndex === 1,
  )
  const warmupDuplicates = duplicateResponseIds(warmupResults)
  const preflightResponseId = preflight.capture?.providerResponseId ?? null
  const preflightReused =
    preflightResponseId != null &&
    warmupResults.some((result) =>
      result.attempts.some(
        (attempt) =>
          attempt.capture?.providerResponseId === preflightResponseId,
      ),
    )
  if (warmupDuplicates.length > 0 || preflightReused) {
    throw new Error(
      `Possible response-cache reuse during warmup: duplicate provider response IDs ${[
        ...warmupDuplicates,
        ...(preflightReused && preflightResponseId
          ? [preflightResponseId]
          : []),
      ].join(', ')}`,
    )
  }
  const successfulWarmupHistoryIds = new Set(
    warmupResults
      .filter((result) => result.status === 'ok')
      .map((result) => result.historyJobId),
  )
  const replayHistories = candidateHistories.filter((history) =>
    successfulWarmupHistoryIds.has(history.jobId),
  )
  console.log(
    `[judge-prompt-balance] replays=${replayHistories.length * Math.max(0, manifest.judgeRepeats - 1)} concurrency=${concurrency}`,
  )
  const replayPool = await runJudgePhase({
    cachePhase: 'replay',
    candidate,
    concurrency,
    config: effectiveConfig,
    histories: replayHistories,
    repeatIndices: Array.from(
      { length: Math.max(0, manifest.judgeRepeats - 1) },
      (_, index) => index + 2,
    ),
    resultMap,
    snapshots,
    writeArtifact: persist,
  })
  achievedConcurrency = Math.max(
    achievedConcurrency,
    replayPool.achievedConcurrency,
  )
  await persist(achievedConcurrency)
  await writeQueue

  const finalResults = [...resultMap.values()]
  const duplicateIds = duplicateResponseIds(finalResults)
  if (duplicateIds.length > 0) {
    throw new Error(
      `Possible response-cache reuse: duplicate provider response IDs ${duplicateIds.join(', ')}`,
    )
  }
  const summary = await writeCandidateReport({
    candidate,
    config,
    histories,
    manifest,
    results: finalResults,
  })
  console.log(
    `[judge-prompt-balance] ${candidateId} pass=${summary.candidatePass} units=${summary.units.map((unit) => `${unit.unitId}:${percent(unit.canonicalRate)}`).join(' ')}`,
  )
}

async function runReport(options: Record<string, string>) {
  const outputDir = resolve(requiredOption(options, 'output-dir'))
  const candidateId = requiredOption(options, 'candidate')
  const { config, manifest } = await loadRun(outputDir)
  const [candidate, histories, results] = await Promise.all([
    loadCandidate(outputDir, candidateId),
    loadHistoriesComplete(outputDir, manifest),
    readJson<JudgeResultsArtifact>(
      candidateResultsPath(outputDir, candidateId),
    ),
  ])
  const summary = await writeCandidateReport({
    candidate,
    config,
    histories,
    manifest,
    results: results.results,
  })
  console.log(
    `[judge-prompt-balance] report ${candidateId} pass=${summary.candidatePass}`,
  )
}

async function main() {
  const { command, options } = parseArgs()
  if (command === 'prepare') return runPrepare(options)
  if (command === 'run-histories') return runHistories(options)
  if (command === 'preflight') return runPreflight(options)
  if (command === 'add-candidate') return runAddCandidate(options)
  if (command === 'judge') return runJudge(options)
  return runReport(options)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(
      `[judge-prompt-balance] failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    )
    process.exit(1)
  })
}
