import { randomUUID, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { Database } from 'bun:sqlite'

import {
  evaluationModelIds,
  modelIds,
  submissionModelIds,
  TROLLEY_SCENARIO_ID,
  trolleyCases,
  type EvaluationModelId,
  type InfoAssignment,
  type ModelId,
  type SubmissionModelId,
  type TranscriptTurn,
} from '../packages/shared/src'
import type { ScenarioRecord } from '../apps/api/src/db/schema'

const BENCHMARK_NAME = 'trolley-win-rate'
const DEFAULT_INVENTORY_OUTPUT =
  'docs/competition/prompts/trolley-user-samples/inventory.json'
const DEFAULT_CASE_SETS = ['ABC', 'ABD', 'ABE', 'ACD', 'ACE', 'ADE'] as const

type Command = 'inventory' | 'run'
type SourceType = 'api' | 'db'
type SideWinner = 'a' | 'b' | 'unknown'

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

type PromptInventoryItem = {
  displayName: string
  email: string
  modelA: string
  modelAValid: boolean
  modelB: string
  modelBValid: boolean
  promptA: string
  promptAChars: number
  promptAHash: string
  promptB: string
  promptBChars: number
  promptBHash: string
  sampleId: string
  submittedAt: string
  submissionId: number
  userId: number
  version: number
}

type PromptInventory = {
  counts: {
    invalidModelA: number
    invalidModelB: number
    latestActivePlayers: number
    modelA: Record<string, number>
    modelB: Record<string, number>
    promptAChars: NumberSummary
    promptBChars: NumberSummary
  }
  generatedAt: string
  kind: 'trolley.prompt_inventory'
  scenario: ScenarioSnapshot & {
    agentPromptTemplateHash: string
    judgePromptChars: number
    judgePromptHash: string
    scenarioSnapshotHash: string
    scorerPromptHash: string
  }
  source: {
    apiUrl?: string
    dbPath?: string
    scenarioId: string
    type: SourceType
  }
  items: PromptInventoryItem[]
}

type SelectedPromptSample = {
  displayName?: string
  email?: string
  inventorySampleId?: string
  label?: string
  model?: string
  modelA?: string
  modelB?: string
  prompt?: string
  promptA?: string
  promptB?: string
  sampleId: string
  submissionId?: number
  userId?: number
  version?: number
}

type SelectedSamplesFile = {
  fiveSideSamples: SelectedPromptSample[]
  kind?: string
  oneSideSamples: SelectedPromptSample[]
  sourceInventory?: string
}

type ResolvedPromptSample = {
  displayName: string | null
  email: string | null
  model: SubmissionModelId
  prompt: string
  promptChars: number
  promptHash: string
  sampleId: string
  side: 'a' | 'b'
  sourceSubmissionId: number | null
  userId: number | null
  version: number | null
}

type BenchJob = {
  caseSet: string
  five: ResolvedPromptSample
  id: string
  one: ResolvedPromptSample
  selectedCaseIds: string[]
}

type MiniCaseObservation = {
  caseId: string
  judgment: string | null
  winner: SideWinner
}

type BenchResult = {
  caseSet: string
  durationMs: number
  error: string | null
  fiveSampleId: string
  generatedAt: string
  jobId: string
  judgeDecision: string | null
  judgmentParseError: string | null
  judgments: Record<string, string>
  langfuseSessionId: string
  miniCases: MiniCaseObservation[]
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
  winner: 'a' | 'b' | 'draw' | null
}

type BenchmarkRunReport = {
  config: BenchmarkRunConfig
  generatedAt: string
  kind: 'trolley.win_rate_results'
  results: BenchResult[]
  summary: {
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
    totalJobs: number
  }
}

type BenchmarkRunConfig = {
  agentModelPolicy: 'fixed' | 'saved'
  caseSets: string[]
  concurrency: number
  dbPath: string | null
  dryRun: boolean
  fiveSideSamples: Array<Omit<ResolvedPromptSample, 'prompt'>>
  inventoryPath: string | null
  judgeModel: EvaluationModelId
  judgeModelPolicy: 'fixed' | 'scenario-current'
  judgePromptHash: string
  jobTimeoutMs: number
  oneSideSamples: Array<Omit<ResolvedPromptSample, 'prompt'>>
  outputDir: string
  persistLlmCalls: boolean
  runId: string
  scenarioId: string
  scenarioSource: 'db' | 'inventory'
  scenarioSnapshotHash: string
  selectedSamplesPath: string
}

type NumberSummary = {
  avg: number | null
  max: number | null
  min: number | null
}

let executeMatchSessionPromise: Promise<
  typeof import('../apps/api/src/engine/core').executeMatchSession
> | null = null

async function getExecuteMatchSession() {
  executeMatchSessionPromise ??= import('../apps/api/src/engine/core').then(
    (module) => module.executeMatchSession,
  )

  return executeMatchSessionPromise
}

function usage(): never {
  console.error(`Usage:
  bun scripts/bench-trolley-win-rate.ts inventory --db <snapshot.db> [--output <path>]
  bun scripts/bench-trolley-win-rate.ts inventory --api-url <url> [--output <path>]
  bun scripts/bench-trolley-win-rate.ts run --db <snapshot.db> --samples <selected-samples.json> [options]
  bun scripts/bench-trolley-win-rate.ts run --inventory <inventory.json> --samples <selected-samples.json> [options]

Inventory options:
  --scenario-id <id>       Default: trolley-problem
  --output <path>          Default: ${DEFAULT_INVENTORY_OUTPUT}

Run options:
  --output-dir <path>      Default: docs/bench/runs/trolley-win-rate-<timestamp>
  --case-sets <csv>        Default: ${DEFAULT_CASE_SETS.join(',')}
  --concurrency <n>        Default: 2
  --dry-run                Build jobs and write config, but do not call models
  --resume                 Reuse existing results.json in output-dir
  --run-id <id>            Default: random UUID
  --job-timeout-ms <n>     Default: 900000 (15 minutes per 3-case match)
  --judge-model <id>       Override scenario judge model
  --agent-model <id>       Override both player-side models
  --agent-model-a <id>     Override one-person side model
  --agent-model-b <id>     Override five-people side model
  --persist-llm-calls      Reserved for future DB-backed runs; benchmark-only traces still skip llm_calls
`)
  process.exit(1)
}

function parseArgs() {
  const [command, ...args] = process.argv.slice(2)

  if (command !== 'inventory' && command !== 'run') {
    usage()
  }

  const options: Record<string, string | true> = {}

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (!arg?.startsWith('--')) {
      usage()
    }

    const key = arg.slice(2)

    if (['dry-run', 'persist-llm-calls', 'resume'].includes(key)) {
      options[key] = true
      continue
    }

    const value = args[index + 1]

    if (!value || value.startsWith('--')) {
      usage()
    }

    options[key] = value
    index += 1
  }

  return { command: command as Command, options }
}

function getStringOption(
  options: Record<string, string | true>,
  key: string,
  fallback = '',
) {
  const value = options[key]

  return typeof value === 'string' ? value : fallback
}

function getRequiredOption(
  options: Record<string, string | true>,
  key: string,
) {
  const value = getStringOption(options, key)

  if (!value) {
    throw new Error(`Missing --${key}`)
  }

  return value
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return parsed
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function sha256(value: unknown) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : stableJson(value))
    .digest('hex')
}

function stableJson(value: unknown) {
  return JSON.stringify(value, Object.keys(flattenKeys(value)).sort(), 2)
}

function flattenKeys(value: unknown, keys = new Set<string>()) {
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      keys.add(key)
      flattenKeys(entry, keys)
    }
  }

  return keys
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function summarizeNumbers(values: number[]): NumberSummary {
  if (values.length === 0) {
    return { avg: null, max: null, min: null }
  }

  return {
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
  }
}

function validateSubmissionModel(value: string): value is SubmissionModelId {
  return (submissionModelIds as readonly string[]).includes(value)
}

function validateEvaluationModel(value: string): value is EvaluationModelId {
  return (evaluationModelIds as readonly string[]).includes(value)
}

function validateModel(value: string): value is ModelId {
  return (modelIds as readonly string[]).includes(value)
}

function scenarioWithHashes(scenario: ScenarioSnapshot) {
  return {
    ...scenario,
    agentPromptTemplateHash: sha256(scenario.agentPromptTemplate),
    judgePromptChars: scenario.judgePrompt.length,
    judgePromptHash: sha256(scenario.judgePrompt),
    scenarioSnapshotHash: sha256(scenario),
    scorerPromptHash: sha256(scenario.scorerPrompt),
  }
}

function normalizeInventoryItem(row: {
  displayName: string
  email: string
  modelA: string
  modelB: string
  promptA: string
  promptB: string
  submittedAt: string
  submissionId: number
  userId: number
  version: number
}): PromptInventoryItem {
  return {
    ...row,
    modelAValid: validateSubmissionModel(row.modelA),
    modelBValid: validateSubmissionModel(row.modelB),
    promptAChars: row.promptA.length,
    promptAHash: sha256(row.promptA),
    promptBChars: row.promptB.length,
    promptBHash: sha256(row.promptB),
    sampleId: `sub-${row.submissionId}-v${row.version}-u${row.userId}`,
  }
}

function buildInventory(params: {
  items: PromptInventoryItem[]
  scenario: ScenarioSnapshot
  source: PromptInventory['source']
}): PromptInventory {
  const { items, scenario, source } = params

  return {
    counts: {
      invalidModelA: items.filter((item) => !item.modelAValid).length,
      invalidModelB: items.filter((item) => !item.modelBValid).length,
      latestActivePlayers: items.length,
      modelA: countBy(items.map((item) => item.modelA)),
      modelB: countBy(items.map((item) => item.modelB)),
      promptAChars: summarizeNumbers(items.map((item) => item.promptAChars)),
      promptBChars: summarizeNumbers(items.map((item) => item.promptBChars)),
    },
    generatedAt: new Date().toISOString(),
    kind: 'trolley.prompt_inventory',
    items,
    scenario: scenarioWithHashes(scenario),
    source,
  }
}

function openReadonlyDb(dbPath: string) {
  if (!existsSync(dbPath)) {
    throw new Error(`DB not found: ${dbPath}`)
  }

  return new Database(dbPath, { readonly: true })
}

function loadScenarioFromDb(
  db: Database,
  scenarioId: string,
): ScenarioSnapshot {
  const row = db
    .query<ScenarioSnapshot, [string]>(`
      SELECT
        id,
        title,
        subject,
        turn_count AS turnCount,
        judge_model AS judgeModel,
        scorer_model AS scorerModel,
        opening_line AS openingLine,
        agent_prompt_template AS agentPromptTemplate,
        examination_question_template AS examinationQuestionTemplate,
        judge_prompt AS judgePrompt,
        scorer_prompt AS scorerPrompt,
        role_a_name AS roleAName,
        role_a_hidden_info AS roleAHiddenInfo,
        role_a_options AS roleAOptions,
        role_a_requests AS roleARequests,
        role_b_name AS roleBName,
        role_b_hidden_info AS roleBHiddenInfo,
        role_b_options AS roleBOptions,
        role_b_requests AS roleBRequests,
        false_info_count AS falseInfoCount,
        true_request_count AS trueRequestCount
      FROM scenarios
      WHERE id = ?
    `)
    .get(scenarioId)

  if (!row) {
    throw new Error(`Scenario not found in DB: ${scenarioId}`)
  }

  return row
}

function loadInventoryFromDb(dbPath: string, scenarioId: string) {
  const db = openReadonlyDb(dbPath)

  try {
    const scenario = loadScenarioFromDb(db, scenarioId)
    const rows = db
      .query<
        {
          displayName: string
          email: string
          modelA: string
          modelB: string
          promptA: string
          promptB: string
          submittedAt: string
          submissionId: number
          userId: number
          version: number
        },
        [string]
      >(`
        SELECT
          display_name AS displayName,
          email,
          model_a AS modelA,
          model_b AS modelB,
          prompt_a AS promptA,
          prompt_b AS promptB,
          created_at AS submittedAt,
          id AS submissionId,
          user_id AS userId,
          version
        FROM (
          SELECT
            s.*,
            u.display_name,
            u.email,
            ROW_NUMBER() OVER (
              PARTITION BY s.user_id
              ORDER BY s.created_at DESC, s.version DESC, s.id DESC
            ) AS row_number
          FROM submissions s
          INNER JOIN users u ON u.id = s.user_id
          WHERE s.scenario_id = ?
            AND u.is_admin = 0
            AND u.disabled = 0
            AND s.retired_at IS NULL
        )
        WHERE row_number = 1
        ORDER BY user_id ASC
      `)
      .all(scenarioId)

    return buildInventory({
      items: rows.map(normalizeInventoryItem),
      scenario,
      source: {
        dbPath,
        scenarioId,
        type: 'db',
      },
    })
  } finally {
    db.close()
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

async function apiFetch<T>(apiUrl: string, path: string): Promise<T> {
  const token = getRequiredEnv('AXIIA_AUTH_TOKEN')
  const response = await fetch(new URL(path, normalizeBaseUrl(apiUrl)), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(
      `${path} failed (${response.status}): ${await response.text()}`,
    )
  }

  return (await response.json()) as T
}

function stringifyJsonField(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value ?? [])
}

function scenarioFromApi(row: Record<string, unknown>): ScenarioSnapshot {
  return {
    agentPromptTemplate: String(row.agentPromptTemplate ?? ''),
    examinationQuestionTemplate: String(row.examinationQuestionTemplate ?? ''),
    falseInfoCount: Number(row.falseInfoCount ?? 0),
    id: String(row.id ?? ''),
    judgeModel: String(row.judgeModel ?? ''),
    judgePrompt: String(row.judgePrompt ?? ''),
    openingLine: String(row.openingLine ?? ''),
    roleAHiddenInfo: stringifyJsonField(row.roleAHiddenInfo),
    roleAName: String(row.roleAName ?? ''),
    roleAOptions: stringifyJsonField(row.roleAOptions),
    roleARequests: stringifyJsonField(row.roleARequests),
    roleBHiddenInfo: stringifyJsonField(row.roleBHiddenInfo),
    roleBName: String(row.roleBName ?? ''),
    roleBOptions: stringifyJsonField(row.roleBOptions),
    roleBRequests: stringifyJsonField(row.roleBRequests),
    scorerModel: String(row.scorerModel ?? ''),
    scorerPrompt: String(row.scorerPrompt ?? ''),
    subject: String(row.subject ?? ''),
    title: String(row.title ?? ''),
    trueRequestCount: Number(row.trueRequestCount ?? 0),
    turnCount: Number(row.turnCount ?? 0),
  }
}

async function loadInventoryFromApi(apiUrl: string, scenarioId: string) {
  const [scenarios, promptRows] = await Promise.all([
    apiFetch<Array<Record<string, unknown>>>(apiUrl, '/api/admin/scenarios'),
    apiFetch<
      Array<{
        displayName: string
        email: string
        modelA: string
        modelB: string
        promptA: string
        promptB: string
        submittedAt: string
        submissionId: number
        userId: number
        version: number
      }>
    >(
      apiUrl,
      `/api/admin/tournaments/players/prompts?scenarioId=${encodeURIComponent(
        scenarioId,
      )}`,
    ),
  ])
  const scenarioRow = scenarios.find((item) => item.id === scenarioId)

  if (!scenarioRow) {
    throw new Error(`Scenario not found from API: ${scenarioId}`)
  }

  return buildInventory({
    items: promptRows.map(normalizeInventoryItem),
    scenario: scenarioFromApi(scenarioRow),
    source: {
      apiUrl,
      scenarioId,
      type: 'api',
    },
  })
}

async function writeInventoryArtifacts(
  inventory: PromptInventory,
  output: string,
) {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`)

  const selectedTemplatePath = join(
    dirname(output),
    'selected-samples.template.json',
  )
  if (!existsSync(selectedTemplatePath)) {
    await writeFile(
      selectedTemplatePath,
      `${JSON.stringify(
        {
          kind: 'trolley.selected_samples',
          sourceInventory: basename(output),
          oneSideSamples: [],
          fiveSideSamples: [],
        },
        null,
        2,
      )}\n`,
    )
  }

  const readmePath = join(dirname(output), 'README.md')
  await writeFile(
    readmePath,
    [
      '# Trolley User Prompt Samples',
      '',
      '`inventory.json` is generated by `bun scripts/bench-trolley-win-rate.ts inventory`.',
      '',
      'The inventory keeps production user identity metadata because this benchmark is an internal competition analysis artifact.',
      '',
      'Use `selected-samples.template.json` as the starting point for selecting 2-3 one-side prompts and 2-3 five-side prompts before running the benchmark.',
      '',
    ].join('\n'),
  )
}

async function runInventory(options: Record<string, string | true>) {
  const scenarioId = getStringOption(
    options,
    'scenario-id',
    TROLLEY_SCENARIO_ID,
  )
  const output = getStringOption(options, 'output', DEFAULT_INVENTORY_OUTPUT)
  const dbPath = getStringOption(options, 'db')
  const apiUrl = getStringOption(options, 'api-url')

  if ((dbPath ? 1 : 0) + (apiUrl ? 1 : 0) !== 1) {
    throw new Error('Provide exactly one of --db or --api-url')
  }

  const inventory = dbPath
    ? loadInventoryFromDb(dbPath, scenarioId)
    : await loadInventoryFromApi(apiUrl, scenarioId)

  await writeInventoryArtifacts(inventory, output)

  console.log(
    JSON.stringify(
      {
        count: inventory.items.length,
        invalidModelA: inventory.counts.invalidModelA,
        invalidModelB: inventory.counts.invalidModelB,
        output,
        scenarioId,
        source: inventory.source.type,
      },
      null,
      2,
    ),
  )
}

function parseCaseSets(value: string) {
  const requested = value
    ? value
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    : [...DEFAULT_CASE_SETS]
  const known = new Set(DEFAULT_CASE_SETS)

  for (const item of requested) {
    if (!known.has(item as (typeof DEFAULT_CASE_SETS)[number])) {
      throw new Error(
        `Invalid case set: ${item}. Expected one of ${[...known].join(', ')}`,
      )
    }
  }

  return requested
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

function readJsonFile<T>(path: string): Promise<T> {
  return readFile(path, 'utf8').then((raw) => JSON.parse(raw) as T)
}

function getSamplePrompt(sample: SelectedPromptSample, side: 'a' | 'b') {
  const value =
    sample.prompt ?? (side === 'a' ? sample.promptA : sample.promptB)

  if (!value?.trim()) {
    throw new Error(`Missing prompt for ${sample.sampleId} side ${side}`)
  }

  return value
}

function getSampleModel(sample: SelectedPromptSample, side: 'a' | 'b') {
  return sample.model ?? (side === 'a' ? sample.modelA : sample.modelB)
}

function resolvePromptSample(params: {
  agentModelOverride: string
  sample: SelectedPromptSample
  side: 'a' | 'b'
}) {
  const prompt = getSamplePrompt(params.sample, params.side)
  const rawModel =
    params.agentModelOverride || getSampleModel(params.sample, params.side)

  if (!rawModel) {
    throw new Error(
      `Missing model for ${params.sample.sampleId} side ${params.side}`,
    )
  }

  if (!validateSubmissionModel(rawModel)) {
    throw new Error(
      `Invalid submission model for ${params.sample.sampleId}: ${rawModel}`,
    )
  }

  return {
    displayName: params.sample.displayName ?? null,
    email: params.sample.email ?? null,
    model: rawModel,
    prompt,
    promptChars: prompt.length,
    promptHash: sha256(prompt),
    sampleId: params.sample.sampleId,
    side: params.side,
    sourceSubmissionId: params.sample.submissionId ?? null,
    userId: params.sample.userId ?? null,
    version: params.sample.version ?? null,
  } satisfies ResolvedPromptSample
}

function buildJobs(params: {
  agentModelAOverride: string
  agentModelBOverride: string
  caseSets: string[]
  selected: SelectedSamplesFile
}) {
  const oneSideSamples = params.selected.oneSideSamples.map((sample) =>
    resolvePromptSample({
      agentModelOverride: params.agentModelAOverride,
      sample,
      side: 'a',
    }),
  )
  const fiveSideSamples = params.selected.fiveSideSamples.map((sample) =>
    resolvePromptSample({
      agentModelOverride: params.agentModelBOverride,
      sample,
      side: 'b',
    }),
  )

  if (oneSideSamples.length === 0 || fiveSideSamples.length === 0) {
    throw new Error(
      'Selected samples must include at least one prompt for each side',
    )
  }

  const jobs: BenchJob[] = []

  for (const one of oneSideSamples) {
    for (const five of fiveSideSamples) {
      for (const caseSet of params.caseSets) {
        jobs.push({
          caseSet,
          five,
          id: `${one.sampleId}__${five.sampleId}__${caseSet}`.replace(
            /[^A-Za-z0-9_.:-]+/g,
            '-',
          ),
          one,
          selectedCaseIds: caseSet.split(''),
        })
      }
    }
  }

  return { fiveSideSamples, jobs, oneSideSamples }
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

function parseJudgeJudgments(raw: string) {
  const stripped = stripMarkdownCodeFence(raw)
  const firstObjectStart = stripped.indexOf('{')
  const objectText =
    firstObjectStart >= 0
      ? extractBalancedObject(stripped, firstObjectStart)
      : null

  if (!objectText) {
    return {
      error: 'No JSON object found in judge decision',
      judgments: {} as Record<string, string>,
    }
  }

  try {
    const parsed = JSON.parse(objectText) as unknown

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        error: 'Judge decision JSON is not an object',
        judgments: {} as Record<string, string>,
      }
    }

    const judgments = (parsed as { judgments?: unknown }).judgments
    if (
      !judgments ||
      typeof judgments !== 'object' ||
      Array.isArray(judgments)
    ) {
      return {
        error: 'Judge decision has no judgments object',
        judgments: {} as Record<string, string>,
      }
    }

    return {
      error: null,
      judgments: Object.fromEntries(
        Object.entries(judgments).map(([key, value]) => [key, String(value)]),
      ),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      judgments: {} as Record<string, string>,
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

function miniCaseObservations(
  selectedCaseIds: string[],
  judgments: Record<string, string>,
) {
  return selectedCaseIds.map((caseId) => {
    const judgment = judgments[caseId] ?? null

    return {
      caseId,
      judgment,
      winner: normalizeJudgmentWinner(judgment),
    } satisfies MiniCaseObservation
  })
}

async function runOneJob(params: {
  job: BenchJob
  jobTimeoutMs: number
  judgeModel: EvaluationModelId
  runId: string
  scenario: ScenarioSnapshot
}) {
  const startedAt = Date.now()
  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort(
      `Benchmark job timed out after ${params.jobTimeoutMs}ms`,
    )
  }, params.jobTimeoutMs)
  const scenario: ScenarioRecord = {
    ...params.scenario,
    createdAt: '',
    judgeModel: params.judgeModel,
    judgeOsPrompt: params.scenario.judgeOsPrompt ?? '',
  }

  try {
    const executeMatchSession = await getExecuteMatchSession()
    const result = await executeMatchSession({
      benchmarkCaseId: params.job.id,
      benchmarkName: BENCHMARK_NAME,
      benchmarkRunId: params.runId,
      infoAssignment: trolleyAssignment(params.job.selectedCaseIds),
      modelA: params.job.one.model,
      modelB: params.job.five.model,
      onDialogueTurn: (transcript) => {
        console.log(
          `[trolley-bench] ${params.job.id} dialogue ${transcript.length}/30`,
        )
      },
      onJudgingStart: () => {
        console.log(`[trolley-bench] ${params.job.id} judging`)
      },
      promptA: params.job.one.prompt,
      promptB: params.job.five.prompt,
      scenario,
      signal: abortController.signal,
      userIdA: params.job.one.userId ?? undefined,
      userIdB: params.job.five.userId ?? undefined,
    })
    clearTimeout(timeout)
    const parsed = parseJudgeJudgments(result.judgeDecision)

    return {
      caseSet: params.job.caseSet,
      durationMs: Date.now() - startedAt,
      error: null,
      fiveSampleId: params.job.five.sampleId,
      generatedAt: new Date().toISOString(),
      jobId: params.job.id,
      judgeDecision: result.judgeDecision,
      judgmentParseError: parsed.error,
      judgments: parsed.judgments,
      langfuseSessionId: `benchmark:${params.runId}`,
      miniCases: miniCaseObservations(
        params.job.selectedCaseIds,
        parsed.judgments,
      ),
      models: {
        agentA: params.job.one.model,
        agentB: params.job.five.model,
        judge: params.judgeModel,
      },
      oneSampleId: params.job.one.sampleId,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      selectedCaseIds: params.job.selectedCaseIds,
      status: 'ok',
      transcript: result.transcript,
      winner: result.winner,
    } satisfies BenchResult
  } catch (error) {
    clearTimeout(timeout)
    return {
      caseSet: params.job.caseSet,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      fiveSampleId: params.job.five.sampleId,
      generatedAt: new Date().toISOString(),
      jobId: params.job.id,
      judgeDecision: null,
      judgmentParseError: null,
      judgments: {},
      langfuseSessionId: `benchmark:${params.runId}`,
      miniCases: params.job.selectedCaseIds.map((caseId) => ({
        caseId,
        judgment: null,
        winner: 'unknown',
      })),
      models: {
        agentA: params.job.one.model,
        agentB: params.job.five.model,
        judge: params.judgeModel,
      },
      oneSampleId: params.job.one.sampleId,
      scoreA: null,
      scoreB: null,
      selectedCaseIds: params.job.selectedCaseIds,
      status: 'error',
      transcript: null,
      winner: null,
    } satisfies BenchResult
  }
}

function summarizeResults(results: BenchResult[], totalJobs: number) {
  const byMiniCase = Object.fromEntries(
    trolleyCases.map((item) => [
      item.id,
      { fiveWins: 0, oneWins: 0, total: 0, unknown: 0 },
    ]),
  ) as BenchmarkRunReport['summary']['byMiniCase']

  for (const result of results) {
    for (const observation of result.miniCases) {
      const entry = byMiniCase[observation.caseId]
      if (!entry) {
        continue
      }
      entry.total += 1
      if (observation.winner === 'a') {
        entry.oneWins += 1
      } else if (observation.winner === 'b') {
        entry.fiveWins += 1
      } else {
        entry.unknown += 1
      }
    }
  }

  return {
    byMiniCase,
    completed: results.filter((result) => result.status === 'ok').length,
    errored: results.filter((result) => result.status === 'error').length,
    totalJobs,
  }
}

function withoutPrompt(sample: ResolvedPromptSample) {
  const { prompt: _prompt, ...rest } = sample
  return rest
}

async function writeRunArtifacts(params: {
  config: BenchmarkRunConfig
  results: BenchResult[]
  totalJobs: number
}) {
  await mkdir(params.config.outputDir, { recursive: true })
  const report: BenchmarkRunReport = {
    config: params.config,
    generatedAt: new Date().toISOString(),
    kind: 'trolley.win_rate_results',
    results: params.results.sort((left, right) =>
      left.jobId.localeCompare(right.jobId),
    ),
    summary: summarizeResults(params.results, params.totalJobs),
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

function renderSummary(report: BenchmarkRunReport) {
  const lines = [
    '# Trolley Win-Rate Benchmark',
    '',
    `Generated: ${report.generatedAt}`,
    `Run ID: ${report.config.runId}`,
    `Judge model: ${report.config.judgeModel}`,
    `Judge prompt hash: ${report.config.judgePromptHash}`,
    `Jobs: ${report.summary.completed}/${report.summary.totalJobs} completed, ${report.summary.errored} errored`,
    '',
    '## Mini-Case Results',
    '',
    '| Case | One-side wins | Five-side wins | Unknown | Total | One-side rate | Five-side rate |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const item of trolleyCases) {
    const row = report.summary.byMiniCase[item.id] ?? {
      fiveWins: 0,
      oneWins: 0,
      total: 0,
      unknown: 0,
    }
    lines.push(
      `| ${item.id} ${item.title} | ${row.oneWins} | ${row.fiveWins} | ${row.unknown} | ${row.total} | ${pct(row.oneWins, row.total)} | ${pct(row.fiveWins, row.total)} |`,
    )
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

function renderHtml(report: BenchmarkRunReport) {
  const rows = trolleyCases
    .map((item) => {
      const row = report.summary.byMiniCase[item.id] ?? {
        fiveWins: 0,
        oneWins: 0,
        total: 0,
        unknown: 0,
      }
      return `<tr><td>${escapeHtml(item.id)} ${escapeHtml(item.title)}</td><td>${row.oneWins}</td><td>${row.fiveWins}</td><td>${row.unknown}</td><td>${row.total}</td><td>${pct(row.oneWins, row.total)}</td><td>${pct(row.fiveWins, row.total)}</td></tr>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Trolley Win-Rate Benchmark</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #111827; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Trolley Win-Rate Benchmark</h1>
  <p>Run <code>${escapeHtml(report.config.runId)}</code>. Judge model <code>${escapeHtml(report.config.judgeModel)}</code>.</p>
  <p>${report.summary.completed}/${report.summary.totalJobs} jobs completed; ${report.summary.errored} errored.</p>
  <table>
    <thead><tr><th>Case</th><th>One-side wins</th><th>Five-side wins</th><th>Unknown</th><th>Total</th><th>One-side rate</th><th>Five-side rate</th></tr></thead>
    <tbody>${rows}</tbody>
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

  const report = await readJsonFile<BenchmarkRunReport>(resultsPath)
  return report.results
}

async function runBenchmark(options: Record<string, string | true>) {
  const dbPath = getStringOption(options, 'db')
  const inventoryPath = getStringOption(options, 'inventory')

  if ((dbPath ? 1 : 0) + (inventoryPath ? 1 : 0) !== 1) {
    throw new Error('Provide exactly one of --db or --inventory')
  }

  const selectedSamplesPath = getRequiredOption(options, 'samples')
  const selected = await readJsonFile<SelectedSamplesFile>(selectedSamplesPath)
  const scenario = dbPath
    ? loadScenarioFromDb(openReadonlyDb(dbPath), TROLLEY_SCENARIO_ID)
    : (await readJsonFile<PromptInventory>(inventoryPath)).scenario
  const caseSets = parseCaseSets(getStringOption(options, 'case-sets'))
  const concurrency = parsePositiveInteger(
    getStringOption(options, 'concurrency', '2'),
    '--concurrency',
  )
  const outputDir = getStringOption(
    options,
    'output-dir',
    join('docs', 'bench', 'runs', `trolley-win-rate-${timestampSlug()}`),
  )
  const runId = getStringOption(options, 'run-id', randomUUID())
  const dryRun = options['dry-run'] === true
  const persistLlmCalls = options['persist-llm-calls'] === true
  const jobTimeoutMs = parsePositiveInteger(
    getStringOption(options, 'job-timeout-ms', '900000'),
    '--job-timeout-ms',
  )
  const agentModel = getStringOption(options, 'agent-model')
  const agentModelA = getStringOption(options, 'agent-model-a', agentModel)
  const agentModelB = getStringOption(options, 'agent-model-b', agentModel)

  if (agentModelA && !validateSubmissionModel(agentModelA)) {
    throw new Error(`Invalid --agent-model-a: ${agentModelA}`)
  }
  if (agentModelB && !validateSubmissionModel(agentModelB)) {
    throw new Error(`Invalid --agent-model-b: ${agentModelB}`)
  }

  const judgeModelRaw = getStringOption(
    options,
    'judge-model',
    scenario.judgeModel,
  )
  if (!validateEvaluationModel(judgeModelRaw)) {
    throw new Error(`Invalid judge model: ${judgeModelRaw}`)
  }

  const { fiveSideSamples, jobs, oneSideSamples } = buildJobs({
    agentModelAOverride: agentModelA,
    agentModelBOverride: agentModelB,
    caseSets,
    selected,
  })
  const config: BenchmarkRunConfig = {
    agentModelPolicy: agentModelA || agentModelB ? 'fixed' : 'saved',
    caseSets,
    concurrency,
    dbPath: dbPath || null,
    dryRun,
    fiveSideSamples: fiveSideSamples.map(withoutPrompt),
    inventoryPath: inventoryPath || null,
    judgeModel: judgeModelRaw,
    judgeModelPolicy: options['judge-model'] ? 'fixed' : 'scenario-current',
    judgePromptHash: sha256(scenario.judgePrompt),
    jobTimeoutMs,
    oneSideSamples: oneSideSamples.map(withoutPrompt),
    outputDir,
    persistLlmCalls,
    runId,
    scenarioId: scenario.id,
    scenarioSource: dbPath ? 'db' : 'inventory',
    scenarioSnapshotHash: sha256(scenario),
    selectedSamplesPath,
  }

  let results = options.resume ? await readExistingResults(outputDir) : []
  const completed = new Set(results.map((result) => result.jobId))
  const pendingJobs = jobs.filter((job) => !completed.has(job.id))

  await writeRunArtifacts({ config, results, totalJobs: jobs.length })

  console.log(
    JSON.stringify(
      {
        dryRun,
        outputDir,
        pendingJobs: pendingJobs.length,
        runId,
        totalJobs: jobs.length,
      },
      null,
      2,
    ),
  )

  if (dryRun) {
    return
  }

  if (!persistLlmCalls) {
    process.env.AXIIA_DISABLE_LLM_CALL_PERSISTENCE = '1'
  }

  await workerPool(pendingJobs, concurrency, async (job) => {
    console.log(`[trolley-bench] ${job.id}`)
    const result = await runOneJob({
      job,
      jobTimeoutMs,
      judgeModel: judgeModelRaw,
      runId,
      scenario,
    })
    results = [...results.filter((item) => item.jobId !== result.jobId), result]
    await writeRunArtifacts({ config, results, totalJobs: jobs.length })
    console.log(
      `[trolley-bench] -> ${result.status} ${result.durationMs}ms ${result.error ?? ''}`.trim(),
    )
  })
}

async function main() {
  const { command, options } = parseArgs()

  if (command === 'inventory') {
    await runInventory(options)
    return
  }

  await runBenchmark(options)
}

await main()
