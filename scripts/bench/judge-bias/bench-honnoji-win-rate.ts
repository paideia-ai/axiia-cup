import { randomUUID, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { Database } from 'bun:sqlite'

import {
  evaluationModelIds,
  roleOptionSchema,
  submissionModelIds,
  type EvaluationModelId,
  type InfoAssignment,
  type JudgeQA,
  type RoleOption,
  type SubmissionModelId,
  type TranscriptTurn,
} from '../../../packages/shared/src'
import type { ScenarioRecord } from '../../../apps/api/src/db/schema'
import type { executeMatchSession as executeMatchSessionFn } from '../../../apps/api/src/engine/core'

const BENCHMARK_NAME = 'honnoji-win-rate'
const HONNOJI_SCENARIO_ID = 'honnoji-decision'
const DEFAULT_INVENTORY_OUTPUT =
  'docs/bench/inputs/user-prompt-samples/honnoji/inventory.json'
const SAVED_MODEL_UPGRADES: Record<string, SubmissionModelId> = {
  'deepseek-v3.2': 'deepseek-v4-pro',
  'kimi-k2.5': 'kimi-k2.6',
  'minimax-m3': 'minimax-m2.5',
  'qwen3.5-397b-a17b': 'qwen3.6-27b',
}

type Command = 'inventory' | 'run' | 'select'
type PolicyWinner = 'a' | 'b' | 'unknown'

type ScenarioSnapshot = ScenarioRecord & {
  agentPromptTemplateHash: string
  judgePromptChars: number
  judgePromptHash: string
  scenarioSnapshotHash: string
  scorerPromptHash: string
}

type NumberSummary = {
  avg: number | null
  max: number | null
  min: number | null
}

type CharacterPair = {
  id: string
  roleAName: string
  roleAOptionId: string
  roleARequests: Array<{ content: string; id: string }>
  roleBName: string
  roleBOptionId: string
  roleBRequests: Array<{ content: string; id: string }>
}

type PromptInventoryItem = {
  displayName: string
  email: string
  modelA: string
  modelAValid: boolean
  modelB: string
  modelBValid: boolean
  pairId: string | null
  promptA: string
  promptAChars: number
  promptAHash: string
  promptB: string
  promptBChars: number
  promptBHash: string
  retiredAt: string | null
  roleAOptionId: string | null
  roleAOptionName: string | null
  roleAOptionValid: boolean
  roleBOptionId: string | null
  roleBOptionName: string | null
  roleBOptionValid: boolean
  sampleId: string
  submittedAt: string
  submissionId: number
  userId: number
  version: number
}

type PromptInventory = {
  characterPairs: CharacterPair[]
  counts: {
    activePromptVersions: number
    invalidModelA: number
    invalidModelB: number
    invalidRoleAOption: number
    invalidRoleBOption: number
    latestActivePlayers: number
    modelA: Record<string, number>
    modelB: Record<string, number>
    promptAChars: NumberSummary
    promptBChars: NumberSummary
    roleAOptions: Record<string, number>
    roleBOptions: Record<string, number>
    rolePairs: Record<string, number>
    totalPromptVersions: number
    usersWithSubmissions: number
  }
  generatedAt: string
  kind: 'honnoji.prompt_inventory'
  scenario: ScenarioSnapshot
  source:
    | {
        dbPath: string
        scenarioId: string
        type: 'db'
      }
    | {
        apiUrl: string
        latestActivePlayerCount: number
        scenarioId: string
        type: 'api'
        userCount: number
        usersWithSubmissions: number
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
  retiredAt?: string | null
  roleAOptionId?: string | null
  roleBOptionId?: string | null
  sampleId?: string
  submittedAt?: string
  submissionId?: number
  userId?: number
  version?: number
}

type SelectedPairSelection = {
  attackSamples: SelectedPromptSample[]
  defenseSamples: SelectedPromptSample[]
  roleAName?: string
  roleAOptionId: string
  roleBName?: string
  roleBOptionId: string
}

type SelectedSamplesFile = {
  kind?: string
  pairSelections: SelectedPairSelection[]
  sourceInventory?: string
}

type ResolvedPromptSample = {
  displayName: string | null
  email: string | null
  model: SubmissionModelId
  modelWasUpgraded: boolean
  prompt: string
  promptChars: number
  promptHash: string
  roleAOptionId: string
  roleBOptionId: string
  sampleId: string
  savedModel: string
  side: 'a' | 'b'
  sourceSubmissionId: number | null
  userId: number | null
  version: number | null
}

type BenchJob = {
  assignment: InfoAssignment
  attack: ResolvedPromptSample
  characterPair: CharacterPair
  defense: ResolvedPromptSample
  id: string
  trueRequestPairId: string
}

type JudgeDecisionSummary = {
  judgment: string | null
  parseError: string | null
  policyWinner: PolicyWinner
  requests: Record<string, string>
}

type BenchResult = {
  attackSampleId: string
  characterPair: Omit<CharacterPair, 'roleARequests' | 'roleBRequests'>
  defenseSampleId: string
  durationMs: number
  error: string | null
  generatedAt: string
  infoAssignment: InfoAssignment
  jobId: string
  judgeDecision: string | null
  judgeTranscriptA: JudgeQA[] | null
  judgeTranscriptB: JudgeQA[] | null
  judgment: string | null
  judgmentParseError: string | null
  langfuseSessionId: string
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
  winner: 'a' | 'b' | 'draw' | null
}

type PairSummary = {
  completed: number
  errored: number
  pairId: string
  policyAssassinationWins: number
  policyAvoidWins: number
  policyUnknown: number
  roleAName: string
  roleAOptionId: string
  roleBName: string
  roleBOptionId: string
  scoreAssassinationWins: number
  scoreAvoidWins: number
  scoreDraws: number
  total: number
}

type BenchmarkRunReport = {
  config: BenchmarkRunConfig
  generatedAt: string
  kind: 'honnoji.win_rate_results'
  results: BenchResult[]
  summary: {
    byPair: Record<string, PairSummary>
    completed: number
    errored: number
    totalJobs: number
  }
}

type BenchmarkRunConfig = {
  agentModelPolicy: 'fixed' | 'saved'
  characterPairs: Array<Omit<CharacterPair, 'roleARequests' | 'roleBRequests'>>
  concurrency: number
  dbPath: string | null
  dryRun: boolean
  inventoryPath: string | null
  judgeModel: EvaluationModelId
  judgeModelPolicy: 'fixed' | 'scenario-current'
  judgePromptHash: string
  jobTimeoutMs: number
  outputDir: string
  persistLlmCalls: boolean
  runId: string
  savedModelUpgradePolicy: {
    enabled: boolean
    mappings: Record<string, SubmissionModelId>
  }
  scenarioId: string
  scenarioSource: 'db' | 'inventory'
  scenarioSnapshotHash: string
  selectedSamplesPath: string
  selectedPairs: string[]
  selectedSamples: {
    attack: Array<Omit<ResolvedPromptSample, 'prompt'>>
    defense: Array<Omit<ResolvedPromptSample, 'prompt'>>
  }
  trueRequestPairCount: number
}

let executeMatchSessionPromise: Promise<typeof executeMatchSessionFn> | null =
  null

async function getExecuteMatchSession() {
  executeMatchSessionPromise ??=
    import('../../../apps/api/src/engine/core').then(
      (module) => module.executeMatchSession,
    )

  return executeMatchSessionPromise
}

function usage(): never {
  console.error(`Usage:
  bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts inventory --db <snapshot.db> [--output <path>]
  bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts inventory --api-url <url> (--auth-token <token> | --email <email> --password <password>) [--output <path>]
  bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts select --inventory <inventory.json> [--output <selected-samples.json>]
  bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts run --inventory <inventory.json> --samples <selected-samples.json> [options]
  bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts run --db <snapshot.db> --samples <selected-samples.json> [options]

Inventory options:
  --scenario-id <id>       Default: ${HONNOJI_SCENARIO_ID}
  --output <path>          Default: ${DEFAULT_INVENTORY_OUTPUT}
  --api-url <url>          Authenticated production/staging API base URL
  --auth-token <token>     Reuse an admin bearer token instead of logging in
  --email <email>          Admin login email; falls back to AXIIA_ADMIN_EMAIL
  --password <password>    Admin login password; falls back to AXIIA_ADMIN_PASSWORD

Select options:
  --inventory <path>       Inventory generated by the inventory command
  --output <path>          Default: selected-samples.json next to inventory
  --exclude-samples <csv>  Inventory sample IDs to skip while selecting

Run options:
  --output-dir <path>      Default: docs/bench/judge-bias/runs/honnoji/honnoji-win-rate-<timestamp>
  --pairs <csv>            Pair IDs like chosokabe__hosokawa_fujitaka. Default: all scenario pairs
  --concurrency <n>        Default: 2
  --dry-run                Build jobs and write config, but do not call models
  --resume                 Reuse existing results.json in output-dir
  --run-id <id>            Default: random UUID
  --job-timeout-ms <n>     Default: 900000 (15 minutes per match)
  --judge-model <id>       Override scenario judge model
  --agent-model <id>       Override both player-side models
  --agent-model-a <id>     Override assassination-camp model
  --agent-model-b <id>     Override avoid-assassination-camp model
  --preserve-saved-models  Keep old saved model IDs instead of upgrading to current same-lab models
  --persist-llm-calls      Reserved for explicit DB-backed runs; benchmark-only traces skip llm_calls by default
`)
  process.exit(1)
}

function parseArgs() {
  const [command, ...args] = process.argv.slice(2)

  if (command !== 'inventory' && command !== 'run' && command !== 'select') {
    usage()
  }

  const options: Record<string, string | true> = {}

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (!arg?.startsWith('--')) {
      usage()
    }

    const key = arg.slice(2)

    if (
      [
        'dry-run',
        'persist-llm-calls',
        'preserve-saved-models',
        'resume',
      ].includes(key)
    ) {
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

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function countNullable(values: Array<string | null>) {
  return countBy(values.map((value) => value ?? '(missing)'))
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

function parseRoleOptions(value: unknown): RoleOption[] {
  return roleOptionSchema
    .array()
    .parse(typeof value === 'string' ? JSON.parse(value) : value)
}

function pairId(roleAOptionId: string, roleBOptionId: string) {
  return `${roleAOptionId}__${roleBOptionId}`
}

function getCharacterPairs(scenario: ScenarioRecord): CharacterPair[] {
  const roleAOptions = parseRoleOptions(scenario.roleAOptions)
  const roleBOptions = parseRoleOptions(scenario.roleBOptions)

  if (roleAOptions.length === 0 || roleBOptions.length === 0) {
    throw new Error('Honnoji benchmark requires role options on both sides')
  }

  const pairs: CharacterPair[] = []

  for (const roleAOption of roleAOptions) {
    for (const roleBOption of roleBOptions) {
      pairs.push({
        id: pairId(roleAOption.id, roleBOption.id),
        roleAName: roleAOption.name,
        roleAOptionId: roleAOption.id,
        roleARequests: roleAOption.requests,
        roleBName: roleBOption.name,
        roleBOptionId: roleBOption.id,
        roleBRequests: roleBOption.requests,
      })
    }
  }

  return pairs
}

function pairIdentity(pair: CharacterPair) {
  const {
    roleARequests: _roleARequests,
    roleBRequests: _roleBRequests,
    ...identity
  } = pair

  return identity
}

function scenarioWithHashes(scenario: ScenarioRecord): ScenarioSnapshot {
  return {
    ...scenario,
    agentPromptTemplateHash: sha256(scenario.agentPromptTemplate),
    judgePromptChars: scenario.judgePrompt.length,
    judgePromptHash: sha256(scenario.judgePrompt),
    scenarioSnapshotHash: sha256(scenario),
    scorerPromptHash: sha256(scenario.scorerPrompt),
  }
}

function openReadonlyDb(dbPath: string) {
  if (!existsSync(dbPath)) {
    throw new Error(`DB not found: ${dbPath}`)
  }

  return new Database(dbPath, { readonly: true })
}

function loadScenarioFromDb(db: Database, scenarioId: string): ScenarioRecord {
  const row = db
    .query<ScenarioRecord, [string]>(`
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
        true_request_count AS trueRequestCount,
        created_at AS createdAt
      FROM scenarios
      WHERE id = ?
    `)
    .get(scenarioId)

  if (!row) {
    throw new Error(`Scenario not found in DB: ${scenarioId}`)
  }

  return row
}

function normalizeOptionId(value: string | null | undefined) {
  return value?.trim() || null
}

function normalizeInventoryItem(
  row: {
    displayName: string
    email: string
    modelA: string
    modelB: string
    promptA: string
    promptB: string
    roleAOptionId: string | null
    roleBOptionId: string | null
    retiredAt: string | null
    submittedAt: string
    submissionId: number
    userId: number
    version: number
  },
  pairsById: Map<string, CharacterPair>,
): PromptInventoryItem {
  const roleAOptionId = normalizeOptionId(row.roleAOptionId)
  const roleBOptionId = normalizeOptionId(row.roleBOptionId)
  const currentPairId =
    roleAOptionId && roleBOptionId ? pairId(roleAOptionId, roleBOptionId) : null
  const currentPair = currentPairId ? pairsById.get(currentPairId) : null

  return {
    ...row,
    modelAValid: validateSubmissionModel(row.modelA),
    modelBValid: validateSubmissionModel(row.modelB),
    pairId: currentPair?.id ?? currentPairId,
    promptAChars: row.promptA.length,
    promptAHash: sha256(row.promptA),
    promptBChars: row.promptB.length,
    promptBHash: sha256(row.promptB),
    roleAOptionId,
    roleAOptionName: currentPair?.roleAName ?? null,
    roleAOptionValid: Boolean(currentPair),
    roleBOptionId,
    roleBOptionName: currentPair?.roleBName ?? null,
    roleBOptionValid: Boolean(currentPair),
    sampleId: `sub-${row.submissionId}-v${row.version}-u${row.userId}`,
  }
}

function buildInventory(params: {
  items: PromptInventoryItem[]
  latestActivePlayers?: number
  scenario: ScenarioRecord
  source: PromptInventory['source']
}): PromptInventory {
  const { items, scenario, source } = params

  return {
    characterPairs: getCharacterPairs(scenario),
    counts: {
      activePromptVersions: items.filter((item) => item.retiredAt === null)
        .length,
      invalidModelA: items.filter((item) => !item.modelAValid).length,
      invalidModelB: items.filter((item) => !item.modelBValid).length,
      invalidRoleAOption: items.filter((item) => !item.roleAOptionValid).length,
      invalidRoleBOption: items.filter((item) => !item.roleBOptionValid).length,
      latestActivePlayers: params.latestActivePlayers ?? items.length,
      modelA: countBy(items.map((item) => item.modelA)),
      modelB: countBy(items.map((item) => item.modelB)),
      promptAChars: summarizeNumbers(items.map((item) => item.promptAChars)),
      promptBChars: summarizeNumbers(items.map((item) => item.promptBChars)),
      roleAOptions: countNullable(items.map((item) => item.roleAOptionId)),
      roleBOptions: countNullable(items.map((item) => item.roleBOptionId)),
      rolePairs: countNullable(items.map((item) => item.pairId)),
      totalPromptVersions: items.length,
      usersWithSubmissions: new Set(items.map((item) => item.userId)).size,
    },
    generatedAt: new Date().toISOString(),
    kind: 'honnoji.prompt_inventory',
    items,
    scenario: scenarioWithHashes(scenario),
    source,
  }
}

function loadInventoryFromDb(dbPath: string, scenarioId: string) {
  const db = openReadonlyDb(dbPath)

  try {
    const scenario = loadScenarioFromDb(db, scenarioId)
    const pairsById = new Map(
      getCharacterPairs(scenario).map((pair) => [pair.id, pair]),
    )
    const rows = db
      .query<
        {
          displayName: string
          email: string
          modelA: string
          modelB: string
          promptA: string
          promptB: string
          roleAOptionId: string | null
          roleBOptionId: string | null
          retiredAt: string | null
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
          role_a_option_id AS roleAOptionId,
          role_b_option_id AS roleBOptionId,
          retired_at AS retiredAt,
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
      items: rows.map((row) => normalizeInventoryItem(row, pairsById)),
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

type ScenarioJsonField =
  | 'roleAHiddenInfo'
  | 'roleAOptions'
  | 'roleARequests'
  | 'roleBHiddenInfo'
  | 'roleBOptions'
  | 'roleBRequests'

type ApiAdminScenario = Omit<ScenarioRecord, ScenarioJsonField | 'createdAt'> &
  Record<ScenarioJsonField, unknown> & {
    createdAt?: string
    locked?: boolean
  }

type ApiAdminUser = {
  createdAt: string
  disabled: boolean
  displayName: string
  email: string
  id: number
  isAdmin: boolean
}

type ApiSubmission = {
  createdAt: string
  id: number
  modelA: string
  modelB: string
  promptA: string
  promptB: string
  retiredAt: string | null
  roleAOptionId?: string | null
  roleBOptionId?: string | null
  scenarioId: string
  version: number
}

type ApiLatestPlayer = {
  userId: number
}

function stringifyScenarioField(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value ?? [])
}

function scenarioFromApiScenario(scenario: ApiAdminScenario): ScenarioRecord {
  const {
    createdAt,
    locked: _locked,
    roleAHiddenInfo,
    roleAOptions,
    roleARequests,
    roleBHiddenInfo,
    roleBOptions,
    roleBRequests,
    ...rest
  } = scenario

  return {
    ...rest,
    createdAt: createdAt ?? '',
    roleAHiddenInfo: stringifyScenarioField(roleAHiddenInfo),
    roleAOptions: stringifyScenarioField(roleAOptions),
    roleARequests: stringifyScenarioField(roleARequests),
    roleBHiddenInfo: stringifyScenarioField(roleBHiddenInfo),
    roleBOptions: stringifyScenarioField(roleBOptions),
    roleBRequests: stringifyScenarioField(roleBRequests),
  }
}

function apiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  label: string,
): Promise<T> {
  const response = await fetch(url, init)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `${label} failed: ${response.status} ${response.statusText} ${text}`,
    )
  }

  return JSON.parse(text) as T
}

async function getApiToken(
  apiBaseUrl: string,
  options: Record<string, string | true>,
) {
  const explicitToken = getStringOption(options, 'auth-token')
  if (explicitToken) {
    return explicitToken
  }

  const email = getStringOption(
    options,
    'email',
    process.env.AXIIA_ADMIN_EMAIL ?? '',
  )
  const password = getStringOption(
    options,
    'password',
    process.env.AXIIA_ADMIN_PASSWORD ?? '',
  )

  if (!email || !password) {
    throw new Error(
      'API inventory requires --auth-token or --email/--password (or AXIIA_ADMIN_EMAIL/AXIIA_ADMIN_PASSWORD)',
    )
  }

  const login = await fetchJson<{ token?: string }>(
    apiUrl(apiBaseUrl, '/api/auth/login'),
    {
      body: JSON.stringify({ email, password }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
    'admin login',
  )

  if (!login.token) {
    throw new Error('Admin login response did not include a token')
  }

  return login.token
}

async function apiGet<T>(apiBaseUrl: string, token: string, path: string) {
  return fetchJson<T>(
    apiUrl(apiBaseUrl, path),
    {
      headers: { authorization: `Bearer ${token}` },
    },
    `GET ${path}`,
  )
}

async function loadInventoryFromApi(params: {
  apiBaseUrl: string
  scenarioId: string
  token: string
}) {
  const scenarios = await apiGet<ApiAdminScenario[]>(
    params.apiBaseUrl,
    params.token,
    '/api/admin/scenarios',
  )
  const apiScenario = scenarios.find(
    (scenario) => scenario.id === params.scenarioId,
  )

  if (!apiScenario) {
    throw new Error(`Scenario not found from API: ${params.scenarioId}`)
  }

  const scenario = scenarioFromApiScenario(apiScenario)
  const pairsById = new Map(
    getCharacterPairs(scenario).map((pair) => [pair.id, pair]),
  )
  const latestPlayers = await apiGet<ApiLatestPlayer[]>(
    params.apiBaseUrl,
    params.token,
    `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(
      params.scenarioId,
    )}`,
  )
  const users = await apiGet<ApiAdminUser[]>(
    params.apiBaseUrl,
    params.token,
    '/api/admin/users',
  )
  const rows: PromptInventoryItem[] = []
  let usersWithSubmissions = 0

  for (const user of users) {
    const submissions = await apiGet<ApiSubmission[]>(
      params.apiBaseUrl,
      params.token,
      `/api/submissions/my/${encodeURIComponent(
        params.scenarioId,
      )}?asUserId=${user.id}`,
    )
    const scenarioSubmissions = submissions.filter(
      (submission) => submission.scenarioId === params.scenarioId,
    )

    if (scenarioSubmissions.length > 0) {
      usersWithSubmissions += 1
      console.log(
        `[honnoji-bench] user ${user.id} ${scenarioSubmissions.length} historical submissions`,
      )
    }

    rows.push(
      ...scenarioSubmissions.map((submission) =>
        normalizeInventoryItem(
          {
            displayName: user.displayName,
            email: user.email,
            modelA: submission.modelA,
            modelB: submission.modelB,
            promptA: submission.promptA,
            promptB: submission.promptB,
            retiredAt: submission.retiredAt,
            roleAOptionId: submission.roleAOptionId ?? null,
            roleBOptionId: submission.roleBOptionId ?? null,
            submittedAt: submission.createdAt,
            submissionId: submission.id,
            userId: user.id,
            version: submission.version,
          },
          pairsById,
        ),
      ),
    )
  }

  rows.sort(
    (left, right) =>
      left.userId - right.userId ||
      right.version - left.version ||
      right.submissionId - left.submissionId,
  )

  return buildInventory({
    items: rows,
    latestActivePlayers: latestPlayers.length,
    scenario,
    source: {
      apiUrl: params.apiBaseUrl,
      latestActivePlayerCount: latestPlayers.length,
      scenarioId: params.scenarioId,
      type: 'api',
      userCount: users.length,
      usersWithSubmissions,
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
          kind: 'honnoji.selected_samples',
          sourceInventory: basename(output),
          pairSelections: inventory.characterPairs.map((pair) => ({
            roleAOptionId: pair.roleAOptionId,
            roleAName: pair.roleAName,
            roleBOptionId: pair.roleBOptionId,
            roleBName: pair.roleBName,
            attackSamples: [],
            defenseSamples: [],
          })),
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
      '# Honnoji User Prompt Samples',
      '',
      '`inventory.json` is generated by `bun scripts/bench/judge-bias/bench-honnoji-win-rate.ts inventory` from a DB snapshot or authenticated read-only production API endpoints.',
      '',
      'The inventory keeps production user identity metadata because this benchmark is an internal competition analysis artifact.',
      '',
      'Use `selected-samples.template.json` as the starting point. For each character pair, copy representative inventory items into `attackSamples` and `defenseSamples` before running the benchmark.',
      '',
    ].join('\n'),
  )
}

async function runInventory(options: Record<string, string | true>) {
  const scenarioId = getStringOption(
    options,
    'scenario-id',
    HONNOJI_SCENARIO_ID,
  )
  const output = getStringOption(options, 'output', DEFAULT_INVENTORY_OUTPUT)
  const dbPath = getStringOption(options, 'db')
  const apiBaseUrl = getStringOption(
    options,
    'api-url',
    process.env.AXIIA_API_URL ?? '',
  )

  if ((dbPath ? 1 : 0) + (apiBaseUrl ? 1 : 0) !== 1) {
    throw new Error('Inventory requires exactly one of --db or --api-url')
  }

  const inventory = dbPath
    ? loadInventoryFromDb(dbPath, scenarioId)
    : await loadInventoryFromApi({
        apiBaseUrl,
        scenarioId,
        token: await getApiToken(apiBaseUrl, options),
      })

  await writeInventoryArtifacts(inventory, output)

  console.log(
    JSON.stringify(
      {
        count: inventory.items.length,
        invalidModelA: inventory.counts.invalidModelA,
        invalidModelB: inventory.counts.invalidModelB,
        invalidRoleAOption: inventory.counts.invalidRoleAOption,
        invalidRoleBOption: inventory.counts.invalidRoleBOption,
        output,
        rolePairs: inventory.counts.rolePairs,
        scenarioId,
        source: inventory.source.type,
        totalPromptVersions: inventory.counts.totalPromptVersions,
        usersWithSubmissions: inventory.counts.usersWithSubmissions,
      },
      null,
      2,
    ),
  )
}

function readJsonFile<T>(path: string): Promise<T> {
  return readFile(path, 'utf8').then((raw) => JSON.parse(raw) as T)
}

function isResolvableSavedModel(model: string) {
  const upgraded = normalizeSavedModel({
    model,
    preserveSavedModels: false,
  })

  return validateSubmissionModel(upgraded)
}

function candidatePromptChars(item: PromptInventoryItem, side: 'a' | 'b') {
  return side === 'a' ? item.promptAChars : item.promptBChars
}

function candidateModel(item: PromptInventoryItem, side: 'a' | 'b') {
  return side === 'a' ? item.modelA : item.modelB
}

function isBetterPromptCandidate(
  candidate: PromptInventoryItem,
  current: PromptInventoryItem | undefined,
  side: 'a' | 'b',
) {
  if (!current) {
    return true
  }

  const candidateRank = [
    candidate.retiredAt === null ? 1 : 0,
    candidatePromptChars(candidate, side) >= 50 ? 1 : 0,
    candidate.submittedAt,
    candidate.version,
    candidate.submissionId,
  ] as const
  const currentRank = [
    current.retiredAt === null ? 1 : 0,
    candidatePromptChars(current, side) >= 50 ? 1 : 0,
    current.submittedAt,
    current.version,
    current.submissionId,
  ] as const

  for (let index = 0; index < candidateRank.length; index += 1) {
    const left = candidateRank[index]
    const right = currentRank[index]

    if (left === right) {
      continue
    }

    return left > right
  }

  return false
}

function selectByCharacter(
  inventory: PromptInventory,
  side: 'a' | 'b',
  excludeSampleIds: Set<string>,
): Map<string, PromptInventoryItem> {
  const optionIds = new Set(
    inventory.characterPairs.map((pair) =>
      side === 'a' ? pair.roleAOptionId : pair.roleBOptionId,
    ),
  )
  const selected = new Map<string, PromptInventoryItem>()

  for (const item of inventory.items) {
    const optionId = side === 'a' ? item.roleAOptionId : item.roleBOptionId
    const prompt = side === 'a' ? item.promptA : item.promptB

    if (
      excludeSampleIds.has(item.sampleId) ||
      !optionId ||
      !optionIds.has(optionId) ||
      !prompt.trim() ||
      !isResolvableSavedModel(candidateModel(item, side))
    ) {
      continue
    }

    if (isBetterPromptCandidate(item, selected.get(optionId), side)) {
      selected.set(optionId, item)
    }
  }

  return selected
}

function selectedPromptFromInventoryItem(
  item: PromptInventoryItem,
  side: 'a' | 'b',
): SelectedPromptSample {
  const roleOptionId = side === 'a' ? item.roleAOptionId : item.roleBOptionId
  const sampleId = `${item.sampleId}-${side}-${roleOptionId}`

  return side === 'a'
    ? {
        displayName: item.displayName,
        email: item.email,
        inventorySampleId: item.sampleId,
        label: `${item.roleAOptionName ?? item.roleAOptionId} ${item.displayName} v${item.version}`,
        modelA: item.modelA,
        promptA: item.promptA,
        retiredAt: item.retiredAt,
        roleAOptionId: item.roleAOptionId,
        sampleId,
        submittedAt: item.submittedAt,
        submissionId: item.submissionId,
        userId: item.userId,
        version: item.version,
      }
    : {
        displayName: item.displayName,
        email: item.email,
        inventorySampleId: item.sampleId,
        label: `${item.roleBOptionName ?? item.roleBOptionId} ${item.displayName} v${item.version}`,
        modelB: item.modelB,
        promptB: item.promptB,
        retiredAt: item.retiredAt,
        roleBOptionId: item.roleBOptionId,
        sampleId,
        submittedAt: item.submittedAt,
        submissionId: item.submissionId,
        userId: item.userId,
        version: item.version,
      }
}

function buildSelectedSamplesFromInventory(
  inventory: PromptInventory,
  sourceInventory: string,
  excludeSampleIds = new Set<string>(),
): SelectedSamplesFile {
  const attackByRole = selectByCharacter(inventory, 'a', excludeSampleIds)
  const defenseByRole = selectByCharacter(inventory, 'b', excludeSampleIds)
  const missingAttackRoles = [
    ...new Set(inventory.characterPairs.map((pair) => pair.roleAOptionId)),
  ].filter((roleId) => !attackByRole.has(roleId))
  const missingDefenseRoles = [
    ...new Set(inventory.characterPairs.map((pair) => pair.roleBOptionId)),
  ].filter((roleId) => !defenseByRole.has(roleId))

  if (missingAttackRoles.length > 0 || missingDefenseRoles.length > 0) {
    throw new Error(
      `Missing representative prompts: attack=${
        missingAttackRoles.join(', ') || 'none'
      } defense=${missingDefenseRoles.join(', ') || 'none'}`,
    )
  }

  return {
    kind: 'honnoji.selected_samples',
    sourceInventory: basename(sourceInventory),
    pairSelections: inventory.characterPairs.map((pair) => ({
      attackSamples: [
        selectedPromptFromInventoryItem(
          attackByRole.get(pair.roleAOptionId)!,
          'a',
        ),
      ],
      defenseSamples: [
        selectedPromptFromInventoryItem(
          defenseByRole.get(pair.roleBOptionId)!,
          'b',
        ),
      ],
      roleAName: pair.roleAName,
      roleAOptionId: pair.roleAOptionId,
      roleBName: pair.roleBName,
      roleBOptionId: pair.roleBOptionId,
    })),
  }
}

async function runSelect(options: Record<string, string | true>) {
  const inventoryPath = getRequiredOption(options, 'inventory')
  const output = getStringOption(
    options,
    'output',
    join(dirname(inventoryPath), 'selected-samples.json'),
  )
  const inventory = await readJsonFile<PromptInventory>(inventoryPath)
  const excludeSampleIds = new Set(
    parseCsvOption(getStringOption(options, 'exclude-samples')),
  )
  const selected = buildSelectedSamplesFromInventory(
    inventory,
    inventoryPath,
    excludeSampleIds,
  )

  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(selected, null, 2)}\n`)

  console.log(
    JSON.stringify(
      {
        output,
        pairSelections: selected.pairSelections.length,
        selectedAttackSamples: [
          ...new Map(
            selected.pairSelections.flatMap((pair) =>
              pair.attackSamples.map((sample) => [
                pair.roleAOptionId,
                sample.sampleId,
              ]),
            ),
          ),
        ],
        selectedDefenseSamples: [
          ...new Map(
            selected.pairSelections.flatMap((pair) =>
              pair.defenseSamples.map((sample) => [
                pair.roleBOptionId,
                sample.sampleId,
              ]),
            ),
          ),
        ],
      },
      null,
      2,
    ),
  )
}

function getSamplePrompt(sample: SelectedPromptSample, side: 'a' | 'b') {
  const value =
    sample.prompt ?? (side === 'a' ? sample.promptA : sample.promptB)

  if (!value?.trim()) {
    const sampleLabel = sample.sampleId ?? sample.inventorySampleId ?? 'sample'
    throw new Error(`Missing prompt for ${sampleLabel} side ${side}`)
  }

  return value
}

function getSampleModel(sample: SelectedPromptSample, side: 'a' | 'b') {
  return sample.model ?? (side === 'a' ? sample.modelA : sample.modelB)
}

function normalizeSavedModel(params: {
  model: string
  preserveSavedModels: boolean
}) {
  if (params.preserveSavedModels) {
    return params.model
  }

  return SAVED_MODEL_UPGRADES[params.model] ?? params.model
}

function assertSamplePair(
  sample: SelectedPromptSample,
  pair: CharacterPair,
  side: 'a' | 'b',
) {
  const roleAOptionId = normalizeOptionId(sample.roleAOptionId)
  const roleBOptionId = normalizeOptionId(sample.roleBOptionId)
  const sampleLabel = sample.sampleId ?? sample.inventorySampleId ?? 'sample'

  if (side === 'a' && roleAOptionId && roleAOptionId !== pair.roleAOptionId) {
    throw new Error(
      `${sampleLabel} side ${side} has roleAOptionId=${roleAOptionId}, expected ${pair.roleAOptionId}`,
    )
  }

  if (side === 'b' && roleBOptionId && roleBOptionId !== pair.roleBOptionId) {
    throw new Error(
      `${sampleLabel} side ${side} has roleBOptionId=${roleBOptionId}, expected ${pair.roleBOptionId}`,
    )
  }
}

function resolvePromptSample(params: {
  agentModelOverride: string
  pair: CharacterPair
  preserveSavedModels: boolean
  sample: SelectedPromptSample
  side: 'a' | 'b'
}) {
  assertSamplePair(params.sample, params.pair, params.side)
  const prompt = getSamplePrompt(params.sample, params.side)
  const savedModel =
    params.agentModelOverride ||
    getSampleModel(params.sample, params.side) ||
    ''
  const rawModel = params.agentModelOverride
    ? savedModel
    : normalizeSavedModel({
        model: savedModel,
        preserveSavedModels: params.preserveSavedModels,
      })

  if (!savedModel) {
    const sampleLabel =
      params.sample.sampleId ?? params.sample.inventorySampleId ?? 'sample'
    throw new Error(`Missing model for ${sampleLabel} side ${params.side}`)
  }

  if (!validateSubmissionModel(rawModel)) {
    const sampleLabel =
      params.sample.sampleId ?? params.sample.inventorySampleId ?? 'sample'
    throw new Error(`Invalid submission model for ${sampleLabel}: ${rawModel}`)
  }

  const sampleId =
    params.sample.sampleId ??
    params.sample.inventorySampleId ??
    params.sample.label ??
    `${params.side}-${sha256(prompt).slice(0, 12)}`

  return {
    displayName: params.sample.displayName ?? null,
    email: params.sample.email ?? null,
    model: rawModel,
    modelWasUpgraded: rawModel !== savedModel,
    prompt,
    promptChars: prompt.length,
    promptHash: sha256(prompt),
    roleAOptionId: params.pair.roleAOptionId,
    roleBOptionId: params.pair.roleBOptionId,
    sampleId,
    savedModel,
    side: params.side,
    sourceSubmissionId: params.sample.submissionId ?? null,
    userId: params.sample.userId ?? null,
    version: params.sample.version ?? null,
  } satisfies ResolvedPromptSample
}

function getSelectedPairIds(value: string, allPairs: CharacterPair[]) {
  const allPairIds = new Set(allPairs.map((pair) => pair.id))
  const requested = value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : allPairs.map((pair) => pair.id)

  for (const requestedPair of requested) {
    if (!allPairIds.has(requestedPair)) {
      throw new Error(
        `Invalid pair: ${requestedPair}. Expected one of ${[...allPairIds].join(
          ', ',
        )}`,
      )
    }
  }

  return requested
}

function parseCsvOption(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function honnojiAssignment(roleARequestId: string, roleBRequestId: string) {
  return {
    roleAFalseInfoIds: [],
    roleATrueRequestIds: [roleARequestId],
    roleBFalseInfoIds: [],
    roleBTrueRequestIds: [roleBRequestId],
    selectedCaseIds: [],
  } satisfies InfoAssignment
}

function buildTrueRequestPairs(pair: CharacterPair) {
  const requestPairs: Array<{
    assignment: InfoAssignment
    id: string
  }> = []

  for (const roleARequest of pair.roleARequests) {
    for (const roleBRequest of pair.roleBRequests) {
      requestPairs.push({
        assignment: honnojiAssignment(roleARequest.id, roleBRequest.id),
        id: `${roleARequest.id}-${roleBRequest.id}`,
      })
    }
  }

  return requestPairs
}

function buildJobs(params: {
  agentModelAOverride: string
  agentModelBOverride: string
  pairs: CharacterPair[]
  preserveSavedModels: boolean
  selected: SelectedSamplesFile
  selectedPairIds: string[]
}) {
  const selectionsByPair = new Map(
    params.selected.pairSelections.map((selection) => [
      pairId(selection.roleAOptionId, selection.roleBOptionId),
      selection,
    ]),
  )
  const attackSamples: ResolvedPromptSample[] = []
  const defenseSamples: ResolvedPromptSample[] = []
  const jobs: BenchJob[] = []

  for (const pair of params.pairs) {
    if (!params.selectedPairIds.includes(pair.id)) {
      continue
    }

    const selection = selectionsByPair.get(pair.id)
    if (!selection) {
      throw new Error(`Selected samples missing character pair ${pair.id}`)
    }

    const pairAttackSamples = selection.attackSamples.map((sample) =>
      resolvePromptSample({
        agentModelOverride: params.agentModelAOverride,
        pair,
        preserveSavedModels: params.preserveSavedModels,
        sample,
        side: 'a',
      }),
    )
    const pairDefenseSamples = selection.defenseSamples.map((sample) =>
      resolvePromptSample({
        agentModelOverride: params.agentModelBOverride,
        pair,
        preserveSavedModels: params.preserveSavedModels,
        sample,
        side: 'b',
      }),
    )

    if (pairAttackSamples.length === 0 || pairDefenseSamples.length === 0) {
      throw new Error(
        `Selected pair ${pair.id} must include at least one attack sample and one defense sample`,
      )
    }

    attackSamples.push(...pairAttackSamples)
    defenseSamples.push(...pairDefenseSamples)

    for (const attack of pairAttackSamples) {
      for (const defense of pairDefenseSamples) {
        for (const requestPair of buildTrueRequestPairs(pair)) {
          jobs.push({
            assignment: requestPair.assignment,
            attack,
            characterPair: pair,
            defense,
            id: `${pair.id}__${attack.sampleId}__${defense.sampleId}__${requestPair.id}`.replace(
              /[^A-Za-z0-9_.:-]+/g,
              '-',
            ),
            trueRequestPairId: requestPair.id,
          })
        }
      }
    }
  }

  return { attackSamples, defenseSamples, jobs }
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
    return {
      judgment: null,
      parseError: error instanceof Error ? error.message : String(error),
      policyWinner: 'unknown',
      requests: {},
    }
  }
}

function resolveScenarioRoleOptions(
  scenario: ScenarioRecord,
  pair: CharacterPair,
): ScenarioRecord {
  return {
    ...scenario,
    roleAName: pair.roleAName,
    roleARequests: JSON.stringify(pair.roleARequests),
    roleBName: pair.roleBName,
    roleBRequests: JSON.stringify(pair.roleBRequests),
  }
}

function toScenarioRecord(scenario: ScenarioRecord): ScenarioRecord {
  return {
    ...scenario,
    createdAt: scenario.createdAt ?? '',
  }
}

async function runOneJob(params: {
  job: BenchJob
  jobTimeoutMs: number
  judgeModel: EvaluationModelId
  runId: string
  scenario: ScenarioRecord
}) {
  const startedAt = Date.now()
  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort(
      `Benchmark job timed out after ${params.jobTimeoutMs}ms`,
    )
  }, params.jobTimeoutMs)
  const scenario = resolveScenarioRoleOptions(
    {
      ...toScenarioRecord(params.scenario),
      judgeModel: params.judgeModel,
    },
    params.job.characterPair,
  )

  try {
    const executeMatchSession = await getExecuteMatchSession()
    const result = await executeMatchSession({
      benchmarkCaseId: params.job.id,
      benchmarkName: BENCHMARK_NAME,
      benchmarkRunId: params.runId,
      infoAssignment: params.job.assignment,
      modelA: params.job.attack.model,
      modelB: params.job.defense.model,
      onDialogueTurn: (transcript) => {
        console.log(
          `[honnoji-bench] ${params.job.id} dialogue ${transcript.length}/${scenario.turnCount}`,
        )
      },
      onJudgingStart: () => {
        console.log(`[honnoji-bench] ${params.job.id} judging`)
      },
      promptA: params.job.attack.prompt,
      promptB: params.job.defense.prompt,
      scenario,
      signal: abortController.signal,
      userIdA: params.job.attack.userId ?? undefined,
      userIdB: params.job.defense.userId ?? undefined,
    })
    clearTimeout(timeout)
    const parsed = parseHonnojiJudgeDecision(result.judgeDecision)

    return {
      attackSampleId: params.job.attack.sampleId,
      characterPair: pairIdentity(params.job.characterPair),
      defenseSampleId: params.job.defense.sampleId,
      durationMs: Date.now() - startedAt,
      error: null,
      generatedAt: new Date().toISOString(),
      infoAssignment: result.infoAssignment,
      jobId: params.job.id,
      judgeDecision: result.judgeDecision,
      judgeTranscriptA: result.judgeTranscriptA,
      judgeTranscriptB: result.judgeTranscriptB,
      judgment: parsed.judgment,
      judgmentParseError: parsed.parseError,
      langfuseSessionId: `benchmark:${params.runId}`,
      models: {
        agentA: params.job.attack.model,
        agentB: params.job.defense.model,
        judge: params.judgeModel,
      },
      policyWinner: parsed.policyWinner,
      requestDecisions: parsed.requests,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      status: 'ok',
      transcript: result.transcript,
      trueRequestPairId: params.job.trueRequestPairId,
      winner: result.winner,
    } satisfies BenchResult
  } catch (error) {
    clearTimeout(timeout)
    return {
      attackSampleId: params.job.attack.sampleId,
      characterPair: pairIdentity(params.job.characterPair),
      defenseSampleId: params.job.defense.sampleId,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      generatedAt: new Date().toISOString(),
      infoAssignment: params.job.assignment,
      jobId: params.job.id,
      judgeDecision: null,
      judgeTranscriptA: null,
      judgeTranscriptB: null,
      judgment: null,
      judgmentParseError: null,
      langfuseSessionId: `benchmark:${params.runId}`,
      models: {
        agentA: params.job.attack.model,
        agentB: params.job.defense.model,
        judge: params.judgeModel,
      },
      policyWinner: 'unknown',
      requestDecisions: {},
      scoreA: null,
      scoreB: null,
      status: 'error',
      transcript: null,
      trueRequestPairId: params.job.trueRequestPairId,
      winner: null,
    } satisfies BenchResult
  }
}

function emptyPairSummary(pair: CharacterPair): PairSummary {
  return {
    completed: 0,
    errored: 0,
    pairId: pair.id,
    policyAssassinationWins: 0,
    policyAvoidWins: 0,
    policyUnknown: 0,
    roleAName: pair.roleAName,
    roleAOptionId: pair.roleAOptionId,
    roleBName: pair.roleBName,
    roleBOptionId: pair.roleBOptionId,
    scoreAssassinationWins: 0,
    scoreAvoidWins: 0,
    scoreDraws: 0,
    total: 0,
  }
}

function summarizeResults(
  results: BenchResult[],
  totalJobs: number,
  characterPairs: CharacterPair[],
) {
  const byPair = Object.fromEntries(
    characterPairs.map((pair) => [pair.id, emptyPairSummary(pair)]),
  ) as Record<string, PairSummary>

  for (const result of results) {
    const entry = byPair[result.characterPair.id]
    if (!entry) {
      continue
    }

    entry.total += 1

    if (result.status === 'error') {
      entry.errored += 1
      continue
    }

    entry.completed += 1

    if (result.policyWinner === 'a') {
      entry.policyAssassinationWins += 1
    } else if (result.policyWinner === 'b') {
      entry.policyAvoidWins += 1
    } else {
      entry.policyUnknown += 1
    }

    if (result.winner === 'a') {
      entry.scoreAssassinationWins += 1
    } else if (result.winner === 'b') {
      entry.scoreAvoidWins += 1
    } else {
      entry.scoreDraws += 1
    }
  }

  return {
    byPair,
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
  characterPairs: CharacterPair[]
  config: BenchmarkRunConfig
  results: BenchResult[]
  totalJobs: number
}) {
  await mkdir(params.config.outputDir, { recursive: true })
  const report: BenchmarkRunReport = {
    config: params.config,
    generatedAt: new Date().toISOString(),
    kind: 'honnoji.win_rate_results',
    results: params.results.sort((left, right) =>
      left.jobId.localeCompare(right.jobId),
    ),
    summary: summarizeResults(
      params.results,
      params.totalJobs,
      params.characterPairs,
    ),
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
    '# Honnoji Win-Rate Benchmark',
    '',
    `Generated: ${report.generatedAt}`,
    `Run ID: ${report.config.runId}`,
    `Judge model: ${report.config.judgeModel}`,
    `Judge prompt hash: ${report.config.judgePromptHash}`,
    `Jobs: ${report.summary.completed}/${report.summary.totalJobs} completed, ${report.summary.errored} errored`,
    '',
    'A camp is the assassination side: 光秀袭击本能寺. B camp is the avoid-assassination side: 光秀西进毛利.',
    '',
    '## Character Pair Results',
    '',
    '| Pair | Completed | Errors | Policy A wins | Policy B wins | Policy unknown | Policy A rate | Policy B rate | Score A wins | Score B wins | Draws | Score A rate | Score B rate |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const pair of report.config.characterPairs) {
    const row = report.summary.byPair[pair.id] ?? {
      completed: 0,
      errored: 0,
      pairId: pair.id,
      policyAssassinationWins: 0,
      policyAvoidWins: 0,
      policyUnknown: 0,
      roleAName: pair.roleAName,
      roleAOptionId: pair.roleAOptionId,
      roleBName: pair.roleBName,
      roleBOptionId: pair.roleBOptionId,
      scoreAssassinationWins: 0,
      scoreAvoidWins: 0,
      scoreDraws: 0,
      total: 0,
    }
    const label = `${pair.roleAName} vs ${pair.roleBName}`
    lines.push(
      `| ${label} | ${row.completed} | ${row.errored} | ${row.policyAssassinationWins} | ${row.policyAvoidWins} | ${row.policyUnknown} | ${pct(row.policyAssassinationWins, row.completed)} | ${pct(row.policyAvoidWins, row.completed)} | ${row.scoreAssassinationWins} | ${row.scoreAvoidWins} | ${row.scoreDraws} | ${pct(row.scoreAssassinationWins, row.completed)} | ${pct(row.scoreAvoidWins, row.completed)} |`,
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
  const rows = report.config.characterPairs
    .map((pair) => {
      const row = report.summary.byPair[pair.id] ?? {
        completed: 0,
        errored: 0,
        pairId: pair.id,
        policyAssassinationWins: 0,
        policyAvoidWins: 0,
        policyUnknown: 0,
        roleAName: pair.roleAName,
        roleAOptionId: pair.roleAOptionId,
        roleBName: pair.roleBName,
        roleBOptionId: pair.roleBOptionId,
        scoreAssassinationWins: 0,
        scoreAvoidWins: 0,
        scoreDraws: 0,
        total: 0,
      }
      return `<tr><td>${escapeHtml(pair.roleAName)} vs ${escapeHtml(pair.roleBName)}</td><td>${row.completed}</td><td>${row.errored}</td><td>${row.policyAssassinationWins}</td><td>${row.policyAvoidWins}</td><td>${row.policyUnknown}</td><td>${pct(row.policyAssassinationWins, row.completed)}</td><td>${pct(row.policyAvoidWins, row.completed)}</td><td>${row.scoreAssassinationWins}</td><td>${row.scoreAvoidWins}</td><td>${row.scoreDraws}</td><td>${pct(row.scoreAssassinationWins, row.completed)}</td><td>${pct(row.scoreAvoidWins, row.completed)}</td></tr>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Honnoji Win-Rate Benchmark</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #111827; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Honnoji Win-Rate Benchmark</h1>
  <p>Run <code>${escapeHtml(report.config.runId)}</code>. Judge model <code>${escapeHtml(report.config.judgeModel)}</code>.</p>
  <p>${report.summary.completed}/${report.summary.totalJobs} jobs completed; ${report.summary.errored} errored.</p>
  <table>
    <thead><tr><th>Pair</th><th>Completed</th><th>Errors</th><th>Policy A wins</th><th>Policy B wins</th><th>Policy unknown</th><th>Policy A rate</th><th>Policy B rate</th><th>Score A wins</th><th>Score B wins</th><th>Draws</th><th>Score A rate</th><th>Score B rate</th></tr></thead>
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

function loadScenarioForRun(params: { dbPath: string; inventoryPath: string }) {
  if (params.dbPath) {
    const db = openReadonlyDb(params.dbPath)
    try {
      return loadScenarioFromDb(db, HONNOJI_SCENARIO_ID)
    } finally {
      db.close()
    }
  }

  return readJsonFile<PromptInventory>(params.inventoryPath).then(
    (inventory) => inventory.scenario,
  )
}

async function runBenchmark(options: Record<string, string | true>) {
  const dbPath = getStringOption(options, 'db')
  const inventoryPath = getStringOption(options, 'inventory')

  if ((dbPath ? 1 : 0) + (inventoryPath ? 1 : 0) !== 1) {
    throw new Error('Provide exactly one of --db or --inventory')
  }

  const selectedSamplesPath = getRequiredOption(options, 'samples')
  const selected = await readJsonFile<SelectedSamplesFile>(selectedSamplesPath)
  const scenario = await loadScenarioForRun({ dbPath, inventoryPath })
  const allPairs = getCharacterPairs(scenario)
  const selectedPairIds = getSelectedPairIds(
    getStringOption(options, 'pairs'),
    allPairs,
  )
  const selectedPairs = allPairs.filter((pair) =>
    selectedPairIds.includes(pair.id),
  )
  const concurrency = parsePositiveInteger(
    getStringOption(options, 'concurrency', '2'),
    '--concurrency',
  )
  const outputDir = getStringOption(
    options,
    'output-dir',
    join(
      'docs',
      'bench',
      'judge-bias',
      'runs',
      'honnoji',
      `honnoji-win-rate-${timestampSlug()}`,
    ),
  )
  const runId = getStringOption(options, 'run-id', randomUUID())
  const dryRun = options['dry-run'] === true
  const persistLlmCalls = options['persist-llm-calls'] === true
  const preserveSavedModels = options['preserve-saved-models'] === true
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

  const { attackSamples, defenseSamples, jobs } = buildJobs({
    agentModelAOverride: agentModelA,
    agentModelBOverride: agentModelB,
    pairs: selectedPairs,
    preserveSavedModels,
    selected,
    selectedPairIds,
  })
  const config: BenchmarkRunConfig = {
    agentModelPolicy: agentModelA || agentModelB ? 'fixed' : 'saved',
    characterPairs: selectedPairs.map(pairIdentity),
    concurrency,
    dbPath: dbPath || null,
    dryRun,
    inventoryPath: inventoryPath || null,
    judgeModel: judgeModelRaw,
    judgeModelPolicy: options['judge-model'] ? 'fixed' : 'scenario-current',
    judgePromptHash: sha256(scenario.judgePrompt),
    jobTimeoutMs,
    outputDir,
    persistLlmCalls,
    runId,
    savedModelUpgradePolicy: {
      enabled: !preserveSavedModels && !agentModelA && !agentModelB,
      mappings: SAVED_MODEL_UPGRADES,
    },
    scenarioId: scenario.id,
    scenarioSource: dbPath ? 'db' : 'inventory',
    scenarioSnapshotHash: sha256(scenario),
    selectedPairs: selectedPairIds,
    selectedSamples: {
      attack: attackSamples.map(withoutPrompt),
      defense: defenseSamples.map(withoutPrompt),
    },
    selectedSamplesPath,
    trueRequestPairCount: selectedPairs.reduce(
      (count, pair) => count + buildTrueRequestPairs(pair).length,
      0,
    ),
  }

  let results = options.resume ? await readExistingResults(outputDir) : []
  const completed = new Set(
    results
      .filter((result) => result.status === 'ok')
      .map((result) => result.jobId),
  )
  const pendingJobs = jobs.filter((job) => !completed.has(job.id))

  await writeRunArtifacts({
    characterPairs: selectedPairs,
    config,
    results,
    totalJobs: jobs.length,
  })

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
    console.log(`[honnoji-bench] ${job.id}`)
    const result = await runOneJob({
      job,
      jobTimeoutMs,
      judgeModel: judgeModelRaw,
      runId,
      scenario,
    })
    results = [...results.filter((item) => item.jobId !== result.jobId), result]
    await writeRunArtifacts({
      characterPairs: selectedPairs,
      config,
      results,
      totalJobs: jobs.length,
    })
    console.log(
      `[honnoji-bench] -> ${result.status} ${result.durationMs}ms ${result.error ?? ''}`.trim(),
    )
  })
}

async function main() {
  const { command, options } = parseArgs()

  if (command === 'inventory') {
    await runInventory(options)
    return
  }

  if (command === 'select') {
    await runSelect(options)
    return
  }

  await runBenchmark(options)
}

await main()
