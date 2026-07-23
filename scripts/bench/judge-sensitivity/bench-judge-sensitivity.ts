import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { Database } from 'bun:sqlite'

import {
  evaluationModelIds,
  formatTrolleyCaseForPrompt,
  getModelDefinition,
  roleOptionSchema,
  submissionModelIds,
  TROLLEY_SCENARIO_ID,
  trolleyCases,
  type EvaluationModelId,
  type InfoAssignment,
  type JudgeQA,
  type ModelProvider,
  type RequestItem,
  type RoleOption,
  type SubmissionModelId,
  type TranscriptTurn,
} from '../../../packages/shared/src'
import type { ScenarioRecord } from '../../../apps/api/src/db/schema'
import {
  buildAgentRuntimeSystemPrompt,
  buildJudgePrompt,
  formatDebateTranscriptForJudge,
  getScenarioDialogueTurnLimit,
} from '../../../apps/api/src/engine/core'
import {
  chatCompletion,
  type ChatCompletionCapture,
  type ChatCompletionReasoningEffort,
  type ChatCompletionThinkingMode,
} from '../../../apps/api/src/engine/llm'
import {
  computeProgrammaticScore,
  type ProgrammaticScoreResult,
} from '../../../apps/api/src/engine/programmatic-scorer'
import { shutdownLangfuseTracing } from '../../../apps/api/src/lib/langfuse'

const BENCHMARK_NAME = 'judge-sensitivity'
const SHANGYANG_SCENARIO_ID = 'shangyang-court'
const HONNOJI_SCENARIO_ID = 'honnoji-decision'
const ALL_SCENARIO_IDS = [
  SHANGYANG_SCENARIO_ID,
  HONNOJI_SCENARIO_ID,
  TROLLEY_SCENARIO_ID,
] as const
const PROMPT_LEVELS = [1, 2, 3, 4] as const
const GLM_REASONING_EFFORTS = ['high', 'max'] as const
const DEFAULT_PLAYER_MODEL = 'glm-5.2' satisfies SubmissionModelId
const DOMESTIC_JUDGE_MODELS = [
  'deepseek-v3.2',
  'deepseek-v4-pro',
  'kimi-k2.6',
  'qwen3.6-27b',
  'minimax-m2.5',
  'glm-5.1',
  'glm-5.2',
  'qwen3.5-397b',
] satisfies EvaluationModelId[]
const DEFAULT_JUDGE_MODELS = [
  ...DOMESTIC_JUDGE_MODELS,
  'deepseek-v4-flash',
  'deepseek-r1',
  'qwen3.6-35b-a3b',
  'glm-4.5-air',
  'kimi-k2.7-code',
  'gpt-4.1',
  'gpt-5.4-mini',
] satisfies BenchJudgeModelId[]
const EXPERIMENTAL_BENCH_JUDGE_MODELS = {
  'deepseek-v3.2-thinking-explicitly-on': {
    apiModel: 'deepseek-ai/DeepSeek-V3.2',
    id: 'deepseek-v3.2-thinking-explicitly-on',
    label: 'DeepSeek V3.2 (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'deepseek',
    verifyReasoningEnabled: true,
  },
  'deepseek-v3.2-thinking-explicitly-off': {
    apiModel: 'deepseek-ai/DeepSeek-V3.2',
    id: 'deepseek-v3.2-thinking-explicitly-off',
    label: 'DeepSeek V3.2 (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'deepseek',
    verifyReasoningDisabled: true,
  },
  'deepseek-v4-pro-thinking-explicitly-on': {
    apiModel: 'deepseek-ai/DeepSeek-V4-Pro',
    id: 'deepseek-v4-pro-thinking-explicitly-on',
    label: 'DeepSeek V4 Pro (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'deepseek',
    verifyReasoningEnabled: true,
  },
  'deepseek-v4-flash': {
    apiModel: 'deepseek-ai/DeepSeek-V4-Flash',
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    underlyingProvider: 'deepseek',
  },
  'deepseek-v4-flash-thinking-explicitly-on': {
    apiModel: 'deepseek-ai/DeepSeek-V4-Flash',
    id: 'deepseek-v4-flash-thinking-explicitly-on',
    label: 'DeepSeek V4 Flash (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'deepseek',
    verifyReasoningEnabled: true,
  },
  'deepseek-v4-flash-thinking-explicitly-off': {
    apiModel: 'deepseek-ai/DeepSeek-V4-Flash',
    id: 'deepseek-v4-flash-thinking-explicitly-off',
    label: 'DeepSeek V4 Flash (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'deepseek',
    verifyReasoningDisabled: true,
  },
  'deepseek-r1': {
    apiModel: 'deepseek-ai/DeepSeek-R1',
    id: 'deepseek-r1',
    label: 'DeepSeek R1',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    underlyingProvider: 'deepseek',
  },
  'deepseek-r1-thinking-explicitly-on': {
    apiModel: 'deepseek-ai/DeepSeek-R1',
    id: 'deepseek-r1-thinking-explicitly-on',
    label: 'DeepSeek R1 (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'deepseek',
    verifyReasoningEnabled: true,
  },
  'deepseek-r1-thinking-explicitly-off': {
    apiModel: 'deepseek-ai/DeepSeek-R1',
    id: 'deepseek-r1-thinking-explicitly-off',
    label: 'DeepSeek R1 (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'deepseek',
    verifyReasoningDisabled: true,
  },
  'glm-4.5-air': {
    apiModel: 'zai-org/GLM-4.5-Air',
    id: 'glm-4.5-air',
    label: 'GLM-4.5 Air',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    underlyingProvider: 'zai',
  },
  'glm-5.1-thinking-explicitly-off': {
    apiModel: 'Pro/zai-org/GLM-5.1',
    id: 'glm-5.1-thinking-explicitly-off',
    label: 'GLM 5.1 (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'zai',
    verifyReasoningDisabled: true,
  },
  'glm-5.1-thinking-explicitly-on': {
    apiModel: 'Pro/zai-org/GLM-5.1',
    id: 'glm-5.1-thinking-explicitly-on',
    label: 'GLM 5.1 (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'zai',
    verifyReasoningEnabled: true,
  },
  'glm-5.2-thinking-explicitly-off': {
    apiModel: 'zai-org/GLM-5.2',
    id: 'glm-5.2-thinking-explicitly-off',
    label: 'GLM 5.2 (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'native-thinking-disabled',
    underlyingProvider: 'zai',
    verifyReasoningDisabled: true,
  },
  'glm-5.2-thinking-explicitly-on': {
    apiModel: 'zai-org/GLM-5.2',
    id: 'glm-5.2-thinking-explicitly-on',
    label: 'GLM 5.2 (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'native-thinking-enabled',
    underlyingProvider: 'zai',
    verifyReasoningEnabled: true,
  },
  'glm-5.2-reasoning-high': {
    allowMissingReasoningWhenEnabled: true,
    apiModel: 'glm-5.2',
    baseModel: 'glm-5.2',
    id: 'glm-5.2-reasoning-high',
    label: 'GLM-5.2 (reasoning high)',
    provider: 'zhipu',
    reasoningEffort: 'high',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'native-thinking-enabled',
    underlyingProvider: 'zai',
    verifyReasoningEnabled: true,
  },
  'glm-5.2-reasoning-max': {
    allowMissingReasoningWhenEnabled: true,
    apiModel: 'glm-5.2',
    baseModel: 'glm-5.2',
    id: 'glm-5.2-reasoning-max',
    label: 'GLM-5.2 (reasoning max)',
    provider: 'zhipu',
    reasoningEffort: 'max',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'native-thinking-enabled',
    underlyingProvider: 'zai',
    verifyReasoningEnabled: true,
  },
  'kimi-k2.6-thinking-explicitly-on': {
    apiModel: 'Pro/moonshotai/Kimi-K2.6',
    id: 'kimi-k2.6-thinking-explicitly-on',
    label: 'Kimi K2.6 (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'both',
    underlyingProvider: 'moonshot',
    verifyReasoningEnabled: true,
  },
  'kimi-k2.6-thinking-explicitly-off': {
    apiModel: 'Pro/moonshotai/Kimi-K2.6',
    id: 'kimi-k2.6-thinking-explicitly-off',
    label: 'Kimi K2.6 (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'both',
    underlyingProvider: 'moonshot',
    verifyReasoningDisabled: true,
  },
  'kimi-k2.7-code': {
    apiModel: 'moonshotai/Kimi-K2.7-Code',
    id: 'kimi-k2.7-code',
    label: 'Kimi K2.7 Code',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinking: 'disabled',
    underlyingProvider: 'moonshot',
  },
  'kimi-k2.7-code-thinking-always-on': {
    apiModel: 'moonshotai/Kimi-K2.7-Code',
    id: 'kimi-k2.7-code-thinking-always-on',
    label: 'Kimi K2.7 Code (thinking always on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    underlyingProvider: 'moonshot',
    verifyReasoningEnabled: true,
  },
  'minimax-m2.5-thinking-explicitly-on': {
    apiModel: 'MiniMaxAI/MiniMax-M2.5',
    id: 'minimax-m2.5-thinking-explicitly-on',
    label: 'MiniMax M2.5 (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'minimax',
    verifyReasoningEnabled: true,
  },
  'qwen3.6-35b-a3b': {
    apiModel: 'Qwen/Qwen3.6-35B-A3B',
    id: 'qwen3.6-35b-a3b',
    label: 'Qwen3.6 35B A3B',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinking: 'disabled',
    underlyingProvider: 'qwen',
  },
  'qwen3.6-35b-a3b-thinking-explicitly-off': {
    allowMissingReasoningTokensWhenDisabled: true,
    apiModel: 'Qwen/Qwen3.6-35B-A3B',
    id: 'qwen3.6-35b-a3b-thinking-explicitly-off',
    label: 'Qwen3.6 35B A3B (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'qwen',
    verifyReasoningDisabled: true,
  },
  'qwen3.5-397b-thinking-explicitly-on': {
    apiModel: 'Qwen/Qwen3.5-397B-A17B',
    id: 'qwen3.5-397b-thinking-explicitly-on',
    label: 'Qwen3.5 397B (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'qwen',
    verifyReasoningEnabled: true,
  },
  'qwen3.5-397b-thinking-explicitly-off': {
    apiModel: 'Qwen/Qwen3.5-397B-A17B',
    id: 'qwen3.5-397b-thinking-explicitly-off',
    label: 'Qwen3.5 397B (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'qwen',
    verifyReasoningDisabled: true,
  },
  'qwen3.6-27b-thinking-explicitly-on': {
    apiModel: 'Qwen/Qwen3.6-27B',
    id: 'qwen3.6-27b-thinking-explicitly-on',
    label: 'Qwen3.6 27B (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'qwen',
    verifyReasoningEnabled: true,
  },
  'qwen3.6-27b-thinking-explicitly-off': {
    allowMissingReasoningTokensWhenDisabled: true,
    apiModel: 'Qwen/Qwen3.6-27B',
    id: 'qwen3.6-27b-thinking-explicitly-off',
    label: 'Qwen3.6 27B (thinking explicitly off)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOffRequest: 'enable-thinking-false',
    underlyingProvider: 'qwen',
    verifyReasoningDisabled: true,
  },
  'qwen3.6-35b-a3b-thinking-explicitly-on': {
    apiModel: 'Qwen/Qwen3.6-35B-A3B',
    id: 'qwen3.6-35b-a3b-thinking-explicitly-on',
    label: 'Qwen3.6 35B A3B (thinking explicitly on)',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinkingOnRequest: 'enable-thinking-true',
    underlyingProvider: 'qwen',
    verifyReasoningEnabled: true,
  },
} as const satisfies Record<string, BenchJudgeModelDefinition>
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1'
const ZHIPU_BASE_URL =
  process.env.ZHIPU_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4'
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION ?? '2023-06-01'
const ANTHROPIC_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4096)
const DEFAULT_HISTORY_CONCURRENCY = 2
const DEFAULT_JUDGE_CONCURRENCY = 4
const DEFAULT_JUDGE_REPEATS = 10
const DEFAULT_LLM_CALL_TIMEOUT_MS = 120000
const DEFAULT_RUNS_ROOT = 'docs/bench/judge-sensitivity/runs'
const DEFAULT_SCRATCHPAD_PROMPT =
  'docs/bench/judge-sensitivity/plans/original-request.md'
const DEFAULT_PLAN = 'docs/bench/judge-sensitivity/plans/benchmark-plan.md'
const DEFAULT_HONNOJI_SELECTED_SAMPLES =
  'docs/bench/inputs/user-prompt-samples/honnoji/selected-samples.json'
const DEFAULT_TROLLEY_SELECTED_SAMPLES =
  'docs/bench/inputs/user-prompt-samples/trolley/selected-samples.json'
const SHANGYANG_ROLE_KEYS = {
  a: 'shangyang',
  b: 'ganlong',
} as const
const TROLLEY_ROLE_KEYS = {
  a: 'one-side',
  b: 'five-side',
} as const
const HONNOJI_TRUE_REQUESTS: Record<string, string> = {
  akechi_ashigaru: 'AS1',
  chosokabe: 'CM1',
  hosokawa_fujitaka: 'HF1',
  yoshiaki_envoy: 'YA1',
}

type Command = 'judge' | 'plan' | 'report' | 'run-histories'
type ScenarioId = (typeof ALL_SCENARIO_IDS)[number]
type ScenarioSource = 'api' | 'db'
type Side = 'a' | 'b'
type PromptLevel = (typeof PROMPT_LEVELS)[number]
type GlmReasoningEffort = (typeof GLM_REASONING_EFFORTS)[number]
type PolicyWinner = Side | 'unknown'
type BenchJudgeProvider = 'anthropic' | 'openai' | 'siliconflow' | 'zhipu'
type BenchJudgeModelDefinition = {
  allowMissingReasoningWhenEnabled?: boolean
  allowMissingReasoningTokensWhenDisabled?: boolean
  apiModel: string
  baseModel?: EvaluationModelId
  id: string
  label: string
  provider: BenchJudgeProvider
  reasoningEffort?: ChatCompletionReasoningEffort
  surfaces: readonly ['evaluation']
  thinking?: 'disabled'
  thinkingOffRequest?:
    'both' | 'enable-thinking-false' | 'native-thinking-disabled'
  thinkingOnRequest?:
    'both' | 'enable-thinking-true' | 'native-thinking-enabled'
  underlyingProvider: string
  verifyReasoningDisabled?: boolean
  verifyReasoningEnabled?: boolean
}
type ExperimentalBenchJudgeModelId =
  keyof typeof EXPERIMENTAL_BENCH_JUDGE_MODELS
type BenchJudgeModelId = EvaluationModelId | ExperimentalBenchJudgeModelId
type BenchChatMessage = {
  content: string
  role: 'assistant' | 'user'
}
type BenchJudgeModelDefinitionRecord =
  BenchJudgeModelDefinition | ReturnType<typeof getModelDefinition>

type ScenarioSnapshot = ScenarioRecord & {
  agentPromptTemplateHash: string
  examinationQuestionTemplateHash: string
  judgePromptChars: number
  judgePromptHash: string
  scenarioSnapshotHash: string
  scorerPromptHash: string
}

type PromptSampleMetadata = {
  displayName: string | null
  email: string | null
  inventorySampleId: string | null
  label: string | null
  modelA: string | null
  modelB: string | null
  promptChars: number
  promptHash: string
  retiredAt: string | null
  sampleId: string | null
  submittedAt: string | null
  submissionId: number | null
  userId: number | null
  version: number | null
}

type PromptLevelRecord = {
  body: string
  hash: string
  label: string
  level: PromptLevel
  metadata?: PromptSampleMetadata
  source: string
}

type RolePromptLevels = {
  levels: Record<PromptLevel, PromptLevelRecord>
  roleKey: string
  roleName: string
  side: Side
}

type PromptLevelsByScenario = Record<
  string,
  {
    roleAName: string
    roleBName: string
    roles: Record<string, RolePromptLevels>
  }
>

type HistoryJob = {
  assignment: InfoAssignment
  baselineLevel: PromptLevel
  baselineSide: Side
  caseId: string | null
  caseTitle: string | null
  id: string
  levelA: PromptLevel
  levelB: PromptLevel
  pairId: string | null
  reusedFromJobId: string | null
  roleAKey: string
  roleAName: string
  roleARequests: RequestItem[]
  roleBKey: string
  roleBName: string
  roleBRequests: RequestItem[]
  scenarioId: ScenarioId
  variedLevel: PromptLevel
  variedSide: Side
}

type HistoryResult = {
  assignment: InfoAssignment
  baselineLevel: PromptLevel
  baselineSide: Side
  caseId: string | null
  caseTitle: string | null
  durationMs: number
  error: string | null
  generatedAt: string
  id: string
  jobId: string
  judgeTranscriptA: JudgeQA[]
  judgeTranscriptB: JudgeQA[]
  levelA: PromptLevel
  levelB: PromptLevel
  models: {
    agentA: SubmissionModelId
    agentB: SubmissionModelId
  }
  pairId: string | null
  promptAHash: string
  promptBHash: string
  reusedFromJobId: string | null
  roleAKey: string
  roleAName: string
  roleARequests: RequestItem[]
  roleBKey: string
  roleBName: string
  roleBRequests: RequestItem[]
  scenarioId: ScenarioId
  skippedPhases: Array<'examination' | 'judgment' | 'scoring'>
  status: 'error' | 'ok'
  transcript: TranscriptTurn[]
  variedLevel: PromptLevel
  variedSide: Side
}

type BenchmarkRunConfig = {
  benchmarkName: string
  caseFilter?: string | null
  caseFilters?: string[] | null
  command: Command
  concurrency: number
  dryRun: boolean
  git: {
    branch: string | null
    commit: string | null
    dirty: boolean | null
  }
  historyCountExpected: number
  historyExecutionCountExpected: number
  jobTimeoutMs: number
  judgeCacheStrategy?: 'warm-first-per-model-history'
  judgeConcurrency: number
  judgeCaseFilters?: string[] | null
  judgeModels: BenchJudgeModelId[]
  judgeModelDefinitions: BenchJudgeModelDefinitionRecord[]
  judgePromptPatch?: JudgePromptPatchMetadata
  trolleyJudgePromptOverride?: TrolleyJudgePromptOverrideMetadata
  judgeRepeats: number
  judgeScenarioIds?: ScenarioId[] | null
  judgeThinkingMode?: BenchJudgeThinkingMode
  glmReasoningEfforts?: GlmReasoningEffort[] | null
  levels: PromptLevel[]
  llmCallTimeoutMs: number
  outputDir: string
  pairFilter: string | null
  persistLlmCalls: boolean
  planPath: string
  playerModel: SubmissionModelId
  playerModelDefinition: ReturnType<typeof getModelDefinition>
  promptSourcePath: string
  resume: boolean
  runId: string
  runLabel?: string
  scenarioIds: ScenarioId[]
  scenarioSource: {
    apiUrl?: string
    dbPath?: string
    note?: string
    type: ScenarioSource
  }
  selectedSamplePaths: {
    honnoji: string
    trolley: string
  }
  temperature: number
}

type HistoriesArtifact = {
  generatedAt: string
  histories: HistoryResult[]
  kind: 'judge_sensitivity.histories'
  summary: {
    completed: number
    errored: number
    expected: number
    executableExpected: number
    reused: number
    totalRows: number
  }
}

type JudgePolicyParse = {
  judgment: string | null
  judgments: Record<string, string>
  parseError: string | null
  policyWinner: PolicyWinner
  requests: Record<string, string>
}

type JudgeResult = {
  cachePhase: PromptCachePhase
  cacheUsage: PromptCacheUsage | null
  caseId: string | null
  diagnosticNoExaminationScore: ProgrammaticScoreResult | null
  durationMs: number
  error: string | null
  generatedAt: string
  historyJobId: string
  id: string
  judgeModel: BenchJudgeModelId
  judgePromptChars: number
  judgePromptHash: string
  pairId: string | null
  parsedPolicy: JudgePolicyParse
  providerCreatedAt: number | null
  providerResponseId: string | null
  rawOutput: string | null
  reasoningVerification: ReasoningVerification | null
  requestProvenance?: JudgeRequestProvenance | null
  repeatIndex: number
  roleAName: string
  roleBName: string
  scenarioId: ScenarioId
  status: 'error' | 'ok'
  variedLevel: PromptLevel
  variedSide: Side
}

type PromptCachePhase = 'replay' | 'warmup'

type PromptCacheUsage = {
  cachedPromptTokens: number | null
  promptCacheHitTokens: number | null
  promptCacheMissTokens: number | null
  promptTokens: number | null
}

type ReasoningVerification = {
  enableThinkingFalse: boolean
  enableThinkingTrue: boolean
  nativeThinkingDisabled: boolean
  nativeThinkingEnabled: boolean
  reasoningContentChars: number
  effort?: 'high' | 'max'
  reasoningTokensOmittedAllowed?: true
  reasoningTokens: number | null
  requestControlVerifiedOn?: true
  reasoningSkippedByModelAllowed?: true
  verifiedOff?: true
  verifiedOn?: true
}

type BenchJudgeThinkingMode = Extract<
  ChatCompletionThinkingMode,
  'enabled' | 'provider-default'
>

type JudgePromptPatchMetadata = {
  block1Hash: string
  block2Hash: string
  originalJudgePromptHash: string
  patchedJudgePromptHash: string
  scenarioId: typeof SHANGYANG_SCENARIO_ID
  sourceHash: string
  sourcePath: string
}

type TrolleyJudgePromptOverrideMetadata = {
  candidateId: string | null
  originalJudgePromptHash: string
  overrideJudgePromptHash: string
  parentCandidateId: string | null
  scenarioId: typeof TROLLEY_SCENARIO_ID
  sourceHash: string
  sourcePath: string
}

type JudgeRequestProvenance = {
  apiModel: string
  configuredEffort: 'high' | 'max' | null
  provider: ModelProvider
  reasoningContentChars: number
  reasoningTokens: number | null
  thinkingMode: ChatCompletionThinkingMode
  thinkingRequestControl: Record<string, unknown> | null
}

type BenchJudgeCompletion = {
  cacheUsage: PromptCacheUsage | null
  content: string
  providerCreatedAt: number | null
  providerResponseId: string | null
  reasoningVerification: ReasoningVerification | null
  requestProvenance: JudgeRequestProvenance | null
}

type JudgeResultsArtifact = {
  dryRun: boolean
  generatedAt: string
  kind: 'judge_sensitivity.judge_results'
  plannedJobs: number
  results: JudgeResult[]
  summary: {
    completed: number
    duplicateProviderResponseIds: number
    errored: number
    expected: number
    promptCacheHitCalls: number
    promptCacheHitTokens: number
    promptCacheMissCalls: number
    promptCacheMissTokens: number
    promptCacheUsageReported: number
    parseFailures: number
    providerResponseIdsRecorded: number
    reasoningVerifiedOff: number
    reasoningVerifiedOn: number
  }
}

type SummaryArtifact = ReturnType<typeof buildSummaryArtifact>

type ApiAdminScenario = Omit<
  ScenarioRecord,
  | 'createdAt'
  | 'roleAHiddenInfo'
  | 'roleAOptions'
  | 'roleARequests'
  | 'roleBHiddenInfo'
  | 'roleBOptions'
  | 'roleBRequests'
> &
  Record<
    | 'roleAHiddenInfo'
    | 'roleAOptions'
    | 'roleARequests'
    | 'roleBHiddenInfo'
    | 'roleBOptions'
    | 'roleBRequests',
    unknown
  > & {
    createdAt?: string
    locked?: boolean
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

type HonnojiSelectedSamplesFile = {
  kind?: string
  pairSelections: Array<{
    attackSamples: SelectedPromptSample[]
    defenseSamples: SelectedPromptSample[]
    roleAName?: string
    roleAOptionId: string
    roleBName?: string
    roleBOptionId: string
  }>
  sourceInventory?: string
}

type TrolleySelectedSamplesFile = {
  fiveSideSamples: SelectedPromptSample[]
  kind?: string
  oneSideSamples: SelectedPromptSample[]
  sourceInventory?: string
}

function usage(): never {
  console.error(`Usage:
  bun scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts plan (--db <snapshot.db> | --api-url <url>) [options]
  bun scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts run-histories (--db <snapshot.db> | --api-url <url>) [options]
  bun scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts judge --output-dir <run-dir> [options]
  bun scripts/bench/judge-sensitivity/bench-judge-sensitivity.ts report --output-dir <run-dir>

Options:
  --scenario <id|all>       Default: all. Also accepts comma-separated ids.
  --output-dir <path>       Default: ${DEFAULT_RUNS_ROOT}/<scenario>/judge-sensitivity-<timestamp>
  --run-id <id>             Default: random UUID
  --agent-model <id>        Default: glm-5.2
  --concurrency <n>         History concurrency. Default: ${DEFAULT_HISTORY_CONCURRENCY}
  --judge-concurrency <n>   Judge replay concurrency. Default: ${DEFAULT_JUDGE_CONCURRENCY}
  --judge-repeats <n>       Default: ${DEFAULT_JUDGE_REPEATS}
  --judge-models <ids>      Comma-separated. Default: ${DEFAULT_JUDGE_MODELS.join(',')}
  --judge-thinking <mode>   provider-default or enabled. Default: provider-default
  --glm-reasoning-efforts <efforts>
                            GLM-5.2 only: high,max. Requires --judge-thinking enabled
  --judge-prompt-patch <p>  Judge-only Shangyang patch Markdown with Block 1/2 quotes
  --trolley-judge-prompt <p>
                            Trolley single-case judge prompt.txt override
  --levels <ids>            Prompt levels to vary. Default: 1,2,3,4
  --pair <a:b>              Honnoji smoke filter, e.g. chosokabe:hosokawa_fujitaka
  --cases <ids>             Trolley case filter for histories or judge replay, e.g. A,D,E
  --case <id>               Backward-compatible single-case alias
  --job-timeout-ms <n>      Default: 900000
  --llm-call-timeout-ms <n> Per model call timeout. Default: ${DEFAULT_LLM_CALL_TIMEOUT_MS}
  --prompt-source <path>    Default: ${DEFAULT_SCRATCHPAD_PROMPT}
  --plan-path <path>        Default: ${DEFAULT_PLAN}
  --honnoji-samples <path>  Default: ${DEFAULT_HONNOJI_SELECTED_SAMPLES}
  --trolley-samples <path>  Default: ${DEFAULT_TROLLEY_SELECTED_SAMPLES}
  --source-note <text>      Optional note saved next to the scenario source
  --run-label <text>        Optional human-readable run label
  --auth-token <token>      API token; falls back to AXIIA_AUTH_TOKEN
  --dry-run                 Write artifacts without model calls
  --resume                  Reuse completed rows in output-dir
  --persist-llm-calls       Default benchmark traces do not persist llm_calls
`)
  process.exit(1)
}

function parseArgs() {
  const [command, ...args] = process.argv.slice(2)

  if (
    command !== 'plan' &&
    command !== 'run-histories' &&
    command !== 'judge' &&
    command !== 'report'
  ) {
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

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return parsed
}

function parsePromptLevels(raw: string): PromptLevel[] {
  const values = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))

  if (values.length === 0) {
    throw new Error('--levels must include at least one level')
  }

  const levels: PromptLevel[] = []
  for (const value of values) {
    if (!PROMPT_LEVELS.includes(value as PromptLevel)) {
      throw new Error(`Invalid prompt level: ${value}`)
    }
    levels.push(value as PromptLevel)
  }

  return [...new Set(levels)]
}

export function parseTrolleyCaseIds(raw: string) {
  const requested = raw
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)

  if (requested.length === 0) {
    throw new Error('--cases must include at least one Trolley case id')
  }

  const available = new Set(trolleyCases.map((item) => item.id))
  for (const caseId of requested) {
    if (!available.has(caseId)) {
      throw new Error(
        `Unsupported Trolley case id: ${caseId}. Expected one of ${[...available].join(',')}`,
      )
    }
  }

  const requestedSet = new Set(requested)
  return trolleyCases
    .map((item) => item.id)
    .filter((caseId) => requestedSet.has(caseId))
}

export function parseTrolleyCaseFilters(
  options: Record<string, string | true>,
) {
  const single = getStringOption(options, 'case')
  const multiple = getStringOption(options, 'cases')

  if (single && multiple) {
    throw new Error('Use either --case or --cases, not both')
  }

  return single || multiple ? parseTrolleyCaseIds(multiple || single) : null
}

function configuredHistoryCaseFilters(config: BenchmarkRunConfig) {
  if (config.caseFilters?.length) {
    return config.caseFilters
  }
  return config.caseFilter ? [config.caseFilter] : null
}

export function parseGlmReasoningEfforts(raw: string): GlmReasoningEffort[] {
  const efforts = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (efforts.length === 0) {
    throw new Error('--glm-reasoning-efforts must include high or max')
  }

  for (const effort of efforts) {
    if (!GLM_REASONING_EFFORTS.includes(effort as GlmReasoningEffort)) {
      throw new Error(
        `Unsupported GLM-5.2 reasoning effort: ${effort}. Expected high or max`,
      )
    }
  }

  return [...new Set(efforts)] as GlmReasoningEffort[]
}

function parseScenarioIds(raw: string): ScenarioId[] {
  if (raw === 'all') {
    return [...ALL_SCENARIO_IDS]
  }

  const scenarioIds = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (scenarioIds.length === 0) {
    throw new Error('--scenario must include at least one scenario id')
  }

  for (const scenarioId of scenarioIds) {
    if (!ALL_SCENARIO_IDS.includes(scenarioId as ScenarioId)) {
      throw new Error(`Unsupported scenario id: ${scenarioId}`)
    }
  }

  return scenarioIds as ScenarioId[]
}

function scenarioRunFolder(scenarioIds: ScenarioId[]) {
  if (scenarioIds.length !== 1) {
    return 'multi-scenario'
  }

  switch (scenarioIds[0]) {
    case SHANGYANG_SCENARIO_ID:
      return 'shangyang'
    case HONNOJI_SCENARIO_ID:
      return 'honnoji'
    case TROLLEY_SCENARIO_ID:
      return 'trolley'
  }
}

function parseJudgeModels(raw: string): BenchJudgeModelId[] {
  const modelIds = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (modelIds.length === 0) {
    throw new Error('--judge-models must include at least one model')
  }

  for (const modelId of modelIds) {
    if (!validateBenchJudgeModel(modelId)) {
      throw new Error(`Invalid judge model: ${modelId}`)
    }
  }

  return modelIds as BenchJudgeModelId[]
}

function glmReasoningVariantId(
  effort: GlmReasoningEffort,
): ExperimentalBenchJudgeModelId {
  return `glm-5.2-reasoning-${effort}`
}

export function expandGlmReasoningEffortModels(
  models: BenchJudgeModelId[],
  efforts: GlmReasoningEffort[] | null,
) {
  if (!efforts?.length) {
    return models
  }

  if (models.length !== 1 || models[0] !== 'glm-5.2') {
    throw new Error('--glm-reasoning-efforts requires --judge-models glm-5.2')
  }

  return efforts.map(glmReasoningVariantId)
}

function modelsRequireExplicitThinking(models: BenchJudgeModelId[]) {
  return models.some((model) => model.startsWith('glm-5.2-reasoning-'))
}

function assertCompatibleThinkingMode(
  models: BenchJudgeModelId[],
  thinkingMode: BenchJudgeThinkingMode,
) {
  if (modelsRequireExplicitThinking(models) && thinkingMode !== 'enabled') {
    throw new Error(
      'GLM-5.2 reasoning-effort lanes require --judge-thinking enabled',
    )
  }
}

function parseBenchJudgeThinkingMode(raw: string): BenchJudgeThinkingMode {
  if (raw === 'enabled' || raw === 'provider-default') {
    return raw
  }

  throw new Error(
    `--judge-thinking must be provider-default or enabled, received: ${raw}`,
  )
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

function getGitState() {
  const status = gitOutput(['status', '--porcelain'])

  return {
    branch: gitOutput(['branch', '--show-current']),
    commit: gitOutput(['rev-parse', 'HEAD']),
    dirty: status == null ? null : status.length > 0,
  }
}

function validateSubmissionModel(value: string): value is SubmissionModelId {
  return (submissionModelIds as readonly string[]).includes(value)
}

function validateEvaluationModel(value: string): value is EvaluationModelId {
  return (evaluationModelIds as readonly string[]).includes(value)
}

function validateExperimentalBenchJudgeModel(
  value: string,
): value is ExperimentalBenchJudgeModelId {
  return Object.prototype.hasOwnProperty.call(
    EXPERIMENTAL_BENCH_JUDGE_MODELS,
    value,
  )
}

function validateBenchJudgeModel(value: string): value is BenchJudgeModelId {
  return (
    validateEvaluationModel(value) || validateExperimentalBenchJudgeModel(value)
  )
}

function getExperimentalBenchJudgeModel(
  model: BenchJudgeModelId,
): BenchJudgeModelDefinition | null {
  return validateExperimentalBenchJudgeModel(model)
    ? EXPERIMENTAL_BENCH_JUDGE_MODELS[model]
    : null
}

function getBenchJudgeModelDefinition(
  model: BenchJudgeModelId,
): BenchJudgeModelDefinitionRecord {
  const experimentalDefinition = getExperimentalBenchJudgeModel(model)
  if (experimentalDefinition) {
    return experimentalDefinition
  }
  if (!validateEvaluationModel(model)) {
    throw new Error(`Missing benchmark judge model definition: ${model}`)
  }
  return getModelDefinition(model)
}

function supportsBenchJsonMode(definition: BenchJudgeModelDefinitionRecord) {
  return !(
    definition.provider === 'siliconflow' &&
    definition.underlyingProvider === 'zai'
  )
}

function assertJudgeModelDefinitions(models: BenchJudgeModelId[]) {
  return models.map((model) => getBenchJudgeModelDefinition(model))
}

function judgeModelLabel(config: BenchmarkRunConfig, model: BenchJudgeModelId) {
  return (
    config.judgeModelDefinitions.find((definition) => definition.id === model)
      ?.label ?? model
  )
}

function scenarioWithHashes(scenario: ScenarioRecord): ScenarioSnapshot {
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

type LoadedJudgePromptPatch = {
  block1: string
  block2: string
  sourceHash: string
  sourcePath: string
}

function extractQuotedPatchBlock(raw: string, heading: string) {
  const lines = raw.split(/\r?\n/u)
  const headingIndex = lines.findIndex((line) => line.startsWith(heading))
  if (headingIndex < 0) {
    throw new Error(`Judge prompt patch is missing heading: ${heading}`)
  }

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && line.startsWith('## '),
  )
  const section = lines.slice(
    headingIndex + 1,
    nextHeadingIndex < 0 ? undefined : nextHeadingIndex,
  )
  const quoteStart = section.findIndex((line) => line.startsWith('>'))
  if (quoteStart < 0) {
    throw new Error(`Judge prompt patch has no quoted block under: ${heading}`)
  }

  const quotedLines: string[] = []
  for (const line of section.slice(quoteStart)) {
    if (!line.startsWith('>')) {
      break
    }
    quotedLines.push(line.replace(/^> ?/u, ''))
  }

  const block = quotedLines.join('\n').trim()
  if (!block) {
    throw new Error(`Judge prompt patch block is empty under: ${heading}`)
  }
  return block
}

async function loadJudgePromptPatch(
  sourcePath: string,
): Promise<LoadedJudgePromptPatch> {
  const raw = await readFile(sourcePath, 'utf8')
  return {
    block1: extractQuotedPatchBlock(raw, '## Block 1'),
    block2: extractQuotedPatchBlock(raw, '## Block 2'),
    sourceHash: sha256(raw),
    sourcePath,
  }
}

function insertPromptBlockBeforeAnchor(params: {
  anchor: string
  block: string
  prompt: string
}) {
  if (params.prompt.includes(params.block)) {
    return params.prompt
  }

  const anchorIndex = params.prompt.indexOf(params.anchor)
  if (anchorIndex < 0) {
    throw new Error(`Judge prompt patch anchor not found: ${params.anchor}`)
  }
  if (params.prompt.indexOf(params.anchor, anchorIndex + 1) >= 0) {
    throw new Error(`Judge prompt patch anchor is not unique: ${params.anchor}`)
  }

  return [
    params.prompt.slice(0, anchorIndex).trimEnd(),
    '',
    params.block,
    '',
    params.prompt.slice(anchorIndex),
  ].join('\n')
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

function applyShangyangJudgePromptPatch(params: {
  patch: LoadedJudgePromptPatch
  snapshot: ScenarioSnapshot
}) {
  const scenario = scenarioRecordFromSnapshot(params.snapshot)
  const originalJudgePromptHash = sha256(scenario.judgePrompt)
  const withVerdictStandard = insertPromptBlockBeforeAnchor({
    anchor: '**二、双方请求**',
    block: params.patch.block1,
    prompt: scenario.judgePrompt,
  })
  const patchedJudgePrompt = insertPromptBlockBeforeAnchor({
    anchor: '=== 输出格式 ===',
    block: params.patch.block2,
    prompt: withVerdictStandard,
  })
  const patchedSnapshot = scenarioWithHashes({
    ...scenario,
    judgePrompt: patchedJudgePrompt,
  })

  return {
    metadata: {
      block1Hash: sha256(params.patch.block1),
      block2Hash: sha256(params.patch.block2),
      originalJudgePromptHash,
      patchedJudgePromptHash: patchedSnapshot.judgePromptHash,
      scenarioId: SHANGYANG_SCENARIO_ID,
      sourceHash: params.patch.sourceHash,
      sourcePath: params.patch.sourcePath,
    } satisfies JudgePromptPatchMetadata,
    snapshot: patchedSnapshot,
  }
}

type LoadedTrolleyJudgePromptOverride = {
  candidateId: string | null
  parentCandidateId: string | null
  prompt: string
  sourceHash: string
  sourcePath: string
}

export function assertTrolleySingleCaseJudgePrompt(prompt: string) {
  const requiredPlaceholders = ['{{cases}}', '{{debate}}', '{{caseId1}}']
  for (const placeholder of requiredPlaceholders) {
    if (!prompt.includes(placeholder)) {
      throw new Error(
        `Trolley judge prompt is missing required single-case placeholder: ${placeholder}`,
      )
    }
  }

  if (/\{\{caseId(?:2|3)\}\}/u.test(prompt)) {
    throw new Error(
      'Trolley judge prompt still expects multiple mini-cases (caseId2/caseId3)',
    )
  }
}

async function loadTrolleyJudgePromptOverride(
  sourcePath: string,
): Promise<LoadedTrolleyJudgePromptOverride> {
  const prompt = await readFile(sourcePath, 'utf8')
  assertTrolleySingleCaseJudgePrompt(prompt)
  const sourceHash = sha256(prompt)
  const candidatePath = join(dirname(sourcePath), 'candidate.json')

  if (!existsSync(candidatePath)) {
    return {
      candidateId: null,
      parentCandidateId: null,
      prompt,
      sourceHash,
      sourcePath,
    }
  }

  const candidate = await readJsonFile<{
    candidateId?: unknown
    parentCandidateId?: unknown
    prompt?: unknown
    promptHash?: unknown
    scenarioId?: unknown
  }>(candidatePath)
  if (candidate.scenarioId !== TROLLEY_SCENARIO_ID) {
    throw new Error(
      `Trolley judge prompt candidate has scenarioId ${String(candidate.scenarioId)}`,
    )
  }
  if (
    typeof candidate.candidateId !== 'string' ||
    candidate.candidateId !== basename(dirname(sourcePath))
  ) {
    throw new Error(
      'Trolley judge prompt candidateId does not match its directory name',
    )
  }
  if (candidate.prompt !== prompt || candidate.promptHash !== sourceHash) {
    throw new Error(
      'Trolley judge prompt.txt does not match its candidate.json provenance',
    )
  }
  if (
    candidate.parentCandidateId !== null &&
    typeof candidate.parentCandidateId !== 'string'
  ) {
    throw new Error('Trolley judge prompt parentCandidateId is invalid')
  }

  return {
    candidateId: candidate.candidateId,
    parentCandidateId: candidate.parentCandidateId,
    prompt,
    sourceHash,
    sourcePath,
  }
}

export function applyTrolleyJudgePromptOverride(params: {
  override: LoadedTrolleyJudgePromptOverride
  snapshot: ScenarioSnapshot
}) {
  if (params.snapshot.id !== TROLLEY_SCENARIO_ID) {
    throw new Error(
      `Trolley judge prompt override cannot be applied to ${params.snapshot.id}`,
    )
  }

  const scenario = scenarioRecordFromSnapshot(params.snapshot)
  const originalJudgePromptHash = sha256(scenario.judgePrompt)
  const overrideSnapshot = scenarioWithHashes({
    ...scenario,
    judgePrompt: params.override.prompt,
  })

  return {
    metadata: {
      candidateId: params.override.candidateId,
      originalJudgePromptHash,
      overrideJudgePromptHash: overrideSnapshot.judgePromptHash,
      parentCandidateId: params.override.parentCandidateId,
      scenarioId: TROLLEY_SCENARIO_ID,
      sourceHash: params.override.sourceHash,
      sourcePath: params.override.sourcePath,
    } satisfies TrolleyJudgePromptOverrideMetadata,
    snapshot: overrideSnapshot,
  }
}

function openReadonlyDb(dbPath: string) {
  if (!existsSync(dbPath)) {
    throw new Error(`DB not found: ${dbPath}`)
  }

  const db = new Database(dbPath, { readonly: true })
  db.exec('PRAGMA busy_timeout = 5000')
  return db
}

function loadScenarioFromDb(dbPath: string, scenarioId: string) {
  const db = openReadonlyDb(dbPath)

  try {
    const row = db
      .query<ScenarioRecord, [string]>(
        `
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
      `,
      )
      .get(scenarioId)

    if (!row) {
      throw new Error(`Scenario not found in DB: ${scenarioId}`)
    }

    return row
  } finally {
    db.close()
  }
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

async function loadScenarioFromApi(params: {
  apiBaseUrl: string
  authToken: string
  scenarioId: string
}) {
  if (!params.authToken) {
    throw new Error(
      'API scenario loading requires --auth-token or AXIIA_AUTH_TOKEN',
    )
  }

  const response = await fetch(
    apiUrl(params.apiBaseUrl, '/api/admin/scenarios'),
    {
      headers: { authorization: `Bearer ${params.authToken}` },
    },
  )
  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `GET /api/admin/scenarios failed: ${response.status} ${response.statusText} ${text}`,
    )
  }

  const rows = JSON.parse(text) as ApiAdminScenario[]
  const scenario = rows.find((item) => item.id === params.scenarioId)

  if (!scenario) {
    throw new Error(`Scenario not found from API: ${params.scenarioId}`)
  }

  return scenarioFromApiScenario(scenario)
}

async function loadScenarios(params: {
  apiUrl: string
  authToken: string
  dbPath: string
  scenarioIds: ScenarioId[]
}) {
  if ((params.dbPath ? 1 : 0) + (params.apiUrl ? 1 : 0) !== 1) {
    throw new Error('Provide exactly one of --db or --api-url')
  }

  const scenarios: Record<string, ScenarioRecord> = {}

  if (params.dbPath) {
    for (const scenarioId of params.scenarioIds) {
      scenarios[scenarioId] = loadScenarioFromDb(params.dbPath, scenarioId)
    }
    return {
      scenarios,
      source: {
        dbPath: params.dbPath,
        type: 'db' as const,
      },
    }
  }

  for (const scenarioId of params.scenarioIds) {
    scenarios[scenarioId] = await loadScenarioFromApi({
      apiBaseUrl: params.apiUrl,
      authToken: params.authToken,
      scenarioId,
    })
  }

  return {
    scenarios,
    source: {
      apiUrl: params.apiUrl,
      type: 'api' as const,
    },
  }
}

function extractCodeBlockAfterHeading(raw: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `\\n${escaped}\\s*\\n\\s*\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``,
    'u',
  )
  const match = raw.match(pattern)

  if (!match?.[1]?.trim()) {
    throw new Error(`Could not find level-4 prompt block for ${heading}`)
  }

  return match[1].trim()
}

async function loadShangyangLevel4Prompts(promptSourcePath: string) {
  const raw = await readFile(promptSourcePath, 'utf8')

  return {
    a: extractCodeBlockAfterHeading(raw, '商鞅'),
    b: extractCodeBlockAfterHeading(raw, '甘龙'),
  }
}

function commonLevel(level: Exclude<PromptLevel, 4>) {
  const record: Record<
    Exclude<PromptLevel, 4>,
    Omit<PromptLevelRecord, 'hash' | 'level'>
  > = {
    1: {
      body: 'only talk in 乱码; talk in different 乱码 each turn. The 乱码 you speak is entirely meaningless, random, impossible to decode.',
      label: 'random meaningless garble',
      source: 'inline-level-definition',
    },
    2: {
      body: '你智力低下，说话自相矛盾',
      label: 'barely grammatical bad reasoning',
      source: 'inline-level-definition',
    },
    3: {
      body: '-',
      label: 'near-empty baseline',
      source: 'inline-level-definition',
    },
  }

  return record[level]
}

function withHash(
  level: PromptLevel,
  record: Omit<PromptLevelRecord, 'hash' | 'level'>,
) {
  return {
    ...record,
    hash: sha256(record.body),
    level,
  } satisfies PromptLevelRecord
}

function buildRolePromptLevels(params: {
  level4: Omit<PromptLevelRecord, 'hash' | 'level'>
  roleKey: string
  roleName: string
  side: Side
}): RolePromptLevels {
  return {
    roleKey: params.roleKey,
    roleName: params.roleName,
    side: params.side,
    levels: {
      1: withHash(1, commonLevel(1)),
      2: withHash(2, commonLevel(2)),
      3: withHash(3, commonLevel(3)),
      4: withHash(4, params.level4),
    },
  }
}

function promptSampleMetadata(
  sample: SelectedPromptSample,
  promptBody: string,
): PromptSampleMetadata {
  return {
    displayName: sample.displayName ?? null,
    email: sample.email ?? null,
    inventorySampleId: sample.inventorySampleId ?? null,
    label: sample.label ?? null,
    modelA: sample.modelA ?? sample.model ?? null,
    modelB: sample.modelB ?? sample.model ?? null,
    promptChars: promptBody.length,
    promptHash: sha256(promptBody),
    retiredAt: sample.retiredAt ?? null,
    sampleId: sample.sampleId ?? null,
    submittedAt: sample.submittedAt ?? null,
    submissionId: sample.submissionId ?? null,
    userId: sample.userId ?? null,
    version: sample.version ?? null,
  }
}

async function readJsonFile<T>(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

function parseJsonArray(raw: string, label: string): unknown[] {
  const parsed = JSON.parse(raw || '[]') as unknown
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array`)
  }
  return parsed
}

function parseRoleOptions(raw: string, label: string): RoleOption[] {
  return roleOptionSchema.array().parse(parseJsonArray(raw, label))
}

function findRoleOption(options: RoleOption[], roleKey: string, label: string) {
  const option = options.find((item) => item.id === roleKey)
  if (!option) {
    throw new Error(`Missing ${label} role option: ${roleKey}`)
  }
  return option
}

function normalizePairFilter(value: string | null) {
  return value ? value.replace(':', '__') : null
}

function buildAssignment(params: {
  roleAKey: string
  roleBKey: string
  scenarioId: ScenarioId
  selectedCaseId?: string
}): InfoAssignment {
  if (params.scenarioId === SHANGYANG_SCENARIO_ID) {
    return {
      roleAFalseInfoIds: [],
      roleATrueRequestIds: ['SR1'],
      roleBFalseInfoIds: [],
      roleBTrueRequestIds: ['GR1'],
      selectedCaseIds: [],
    }
  }

  if (params.scenarioId === HONNOJI_SCENARIO_ID) {
    const roleATrue = HONNOJI_TRUE_REQUESTS[params.roleAKey]
    const roleBTrue = HONNOJI_TRUE_REQUESTS[params.roleBKey]
    if (!roleATrue || !roleBTrue) {
      throw new Error(
        `Missing Honnoji true request mapping for ${params.roleAKey}/${params.roleBKey}`,
      )
    }

    return {
      roleAFalseInfoIds: [],
      roleATrueRequestIds: [roleATrue],
      roleBFalseInfoIds: [],
      roleBTrueRequestIds: [roleBTrue],
      selectedCaseIds: [],
    }
  }

  return {
    roleAFalseInfoIds: [],
    roleATrueRequestIds: [],
    roleBFalseInfoIds: [],
    roleBTrueRequestIds: [],
    selectedCaseIds: params.selectedCaseId ? [params.selectedCaseId] : [],
  }
}

function unitJobs(params: {
  assignment: InfoAssignment
  caseId: string | null
  caseTitle: string | null
  levels: PromptLevel[]
  pairId: string | null
  roleAKey: string
  roleAName: string
  roleARequests: RequestItem[]
  roleBKey: string
  roleBName: string
  roleBRequests: RequestItem[]
  scenarioId: ScenarioId
  unitId: string
}) {
  const jobs: HistoryJob[] = []
  let canonicalLevel3Id: string | null = null

  for (const level of params.levels) {
    const id = `${params.unitId}__varied-a-l${level}__baseline-b-l3`
    if (level === 3) {
      canonicalLevel3Id = id
    }
    jobs.push({
      assignment: params.assignment,
      baselineLevel: 3,
      baselineSide: 'b',
      caseId: params.caseId,
      caseTitle: params.caseTitle,
      id,
      levelA: level,
      levelB: 3,
      pairId: params.pairId,
      reusedFromJobId: null,
      roleAKey: params.roleAKey,
      roleAName: params.roleAName,
      roleARequests: params.roleARequests,
      roleBKey: params.roleBKey,
      roleBName: params.roleBName,
      roleBRequests: params.roleBRequests,
      scenarioId: params.scenarioId,
      variedLevel: level,
      variedSide: 'a',
    })
  }

  for (const level of params.levels) {
    jobs.push({
      assignment: params.assignment,
      baselineLevel: 3,
      baselineSide: 'a',
      caseId: params.caseId,
      caseTitle: params.caseTitle,
      id: `${params.unitId}__varied-b-l${level}__baseline-a-l3`,
      levelA: 3,
      levelB: level,
      pairId: params.pairId,
      reusedFromJobId: level === 3 ? canonicalLevel3Id : null,
      roleAKey: params.roleAKey,
      roleAName: params.roleAName,
      roleARequests: params.roleARequests,
      roleBKey: params.roleBKey,
      roleBName: params.roleBName,
      roleBRequests: params.roleBRequests,
      scenarioId: params.scenarioId,
      variedLevel: level,
      variedSide: 'b',
    })
  }

  return jobs
}

async function addShangyangDesign(params: {
  jobs: HistoryJob[]
  levels: PromptLevel[]
  promptLevels: PromptLevelsByScenario
  promptSourcePath: string
  scenario: ScenarioRecord
}) {
  const level4 = await loadShangyangLevel4Prompts(params.promptSourcePath)
  const roleAKey = SHANGYANG_ROLE_KEYS.a
  const roleBKey = SHANGYANG_ROLE_KEYS.b

  params.promptLevels[SHANGYANG_SCENARIO_ID] = {
    roleAName: params.scenario.roleAName,
    roleBName: params.scenario.roleBName,
    roles: {
      [roleAKey]: buildRolePromptLevels({
        level4: {
          body: level4.a,
          label: 'Kurt Shangyang strong prompt',
          source: params.promptSourcePath,
        },
        roleKey: roleAKey,
        roleName: params.scenario.roleAName,
        side: 'a',
      }),
      [roleBKey]: buildRolePromptLevels({
        level4: {
          body: level4.b,
          label: 'Kurt Ganlong strong prompt',
          source: params.promptSourcePath,
        },
        roleKey: roleBKey,
        roleName: params.scenario.roleBName,
        side: 'b',
      }),
    },
  }

  params.jobs.push(
    ...unitJobs({
      assignment: buildAssignment({
        roleAKey,
        roleBKey,
        scenarioId: SHANGYANG_SCENARIO_ID,
      }),
      caseId: null,
      caseTitle: null,
      levels: params.levels,
      pairId: null,
      roleAKey,
      roleAName: params.scenario.roleAName,
      roleARequests: JSON.parse(
        params.scenario.roleARequests || '[]',
      ) as RequestItem[],
      roleBKey,
      roleBName: params.scenario.roleBName,
      roleBRequests: JSON.parse(
        params.scenario.roleBRequests || '[]',
      ) as RequestItem[],
      scenarioId: SHANGYANG_SCENARIO_ID,
      unitId: SHANGYANG_SCENARIO_ID,
    }),
  )
}

async function addHonnojiDesign(params: {
  jobs: HistoryJob[]
  levels: PromptLevel[]
  pairFilter: string | null
  promptLevels: PromptLevelsByScenario
  scenario: ScenarioRecord
  selectedSamplesPath: string
}) {
  const selected = await readJsonFile<HonnojiSelectedSamplesFile>(
    params.selectedSamplesPath,
  )
  const roleAOptions = parseRoleOptions(
    params.scenario.roleAOptions,
    'roleAOptions',
  )
  const roleBOptions = parseRoleOptions(
    params.scenario.roleBOptions,
    'roleBOptions',
  )
  const roles: Record<string, RolePromptLevels> = {}
  const pairFilter = normalizePairFilter(params.pairFilter)

  for (const pair of selected.pairSelections) {
    const pairId = `${pair.roleAOptionId}__${pair.roleBOptionId}`
    if (pairFilter && pairFilter !== pairId) {
      continue
    }

    const attackSample = pair.attackSamples[0]
    const defenseSample = pair.defenseSamples[0]
    if (!attackSample?.promptA || !defenseSample?.promptB) {
      throw new Error(`Honnoji selected samples missing prompts for ${pairId}`)
    }

    const roleA = findRoleOption(roleAOptions, pair.roleAOptionId, 'Honnoji A')
    const roleB = findRoleOption(roleBOptions, pair.roleBOptionId, 'Honnoji B')

    roles[pair.roleAOptionId] ??= buildRolePromptLevels({
      level4: {
        body: attackSample.promptA,
        label:
          attackSample.label ??
          `${roleA.name} ${attackSample.displayName ?? 'selected'} v${attackSample.version ?? '?'}`,
        metadata: promptSampleMetadata(attackSample, attackSample.promptA),
        source: params.selectedSamplesPath,
      },
      roleKey: pair.roleAOptionId,
      roleName: roleA.name,
      side: 'a',
    })
    roles[pair.roleBOptionId] ??= buildRolePromptLevels({
      level4: {
        body: defenseSample.promptB,
        label:
          defenseSample.label ??
          `${roleB.name} ${defenseSample.displayName ?? 'selected'} v${defenseSample.version ?? '?'}`,
        metadata: promptSampleMetadata(defenseSample, defenseSample.promptB),
        source: params.selectedSamplesPath,
      },
      roleKey: pair.roleBOptionId,
      roleName: roleB.name,
      side: 'b',
    })

    params.jobs.push(
      ...unitJobs({
        assignment: buildAssignment({
          roleAKey: pair.roleAOptionId,
          roleBKey: pair.roleBOptionId,
          scenarioId: HONNOJI_SCENARIO_ID,
        }),
        caseId: null,
        caseTitle: null,
        levels: params.levels,
        pairId,
        roleAKey: pair.roleAOptionId,
        roleAName: roleA.name,
        roleARequests: roleA.requests,
        roleBKey: pair.roleBOptionId,
        roleBName: roleB.name,
        roleBRequests: roleB.requests,
        scenarioId: HONNOJI_SCENARIO_ID,
        unitId: `${HONNOJI_SCENARIO_ID}__${pairId}`,
      }),
    )
  }

  if (Object.keys(roles).length === 0) {
    throw new Error(
      pairFilter
        ? `No Honnoji selected pair matched --pair ${params.pairFilter}`
        : 'No Honnoji selected pairs found',
    )
  }

  params.promptLevels[HONNOJI_SCENARIO_ID] = {
    roleAName: params.scenario.roleAName,
    roleBName: params.scenario.roleBName,
    roles,
  }
}

function findTrolleySample(
  samples: SelectedPromptSample[],
  label: 'oneSideSamples' | 'fiveSideSamples',
) {
  const sample = samples.find(
    (item) => item.displayName === 'yisiliu' && item.version === 49,
  )
  if (!sample) {
    throw new Error(`Could not find yisiliu v49 in ${label}`)
  }
  return sample
}

async function addTrolleyDesign(params: {
  caseFilters: string[] | null
  jobs: HistoryJob[]
  levels: PromptLevel[]
  promptLevels: PromptLevelsByScenario
  scenario: ScenarioRecord
  selectedSamplesPath: string
}) {
  const selected = await readJsonFile<TrolleySelectedSamplesFile>(
    params.selectedSamplesPath,
  )
  const oneSample = findTrolleySample(selected.oneSideSamples, 'oneSideSamples')
  const fiveSample = findTrolleySample(
    selected.fiveSideSamples,
    'fiveSideSamples',
  )

  if (!oneSample.promptA || !fiveSample.promptB) {
    throw new Error(
      'Trolley yisiliu v49 selected sample is missing promptA/promptB',
    )
  }

  const roleAKey = TROLLEY_ROLE_KEYS.a
  const roleBKey = TROLLEY_ROLE_KEYS.b
  params.promptLevels[TROLLEY_SCENARIO_ID] = {
    roleAName: params.scenario.roleAName,
    roleBName: params.scenario.roleBName,
    roles: {
      [roleAKey]: buildRolePromptLevels({
        level4: {
          body: oneSample.promptA,
          label: 'yisiliu v49 one-side strong prompt',
          metadata: promptSampleMetadata(oneSample, oneSample.promptA),
          source: params.selectedSamplesPath,
        },
        roleKey: roleAKey,
        roleName: params.scenario.roleAName,
        side: 'a',
      }),
      [roleBKey]: buildRolePromptLevels({
        level4: {
          body: fiveSample.promptB,
          label: 'yisiliu v49 five-side strong prompt',
          metadata: promptSampleMetadata(fiveSample, fiveSample.promptB),
          source: params.selectedSamplesPath,
        },
        roleKey: roleBKey,
        roleName: params.scenario.roleBName,
        side: 'b',
      }),
    },
  }

  const cases = params.caseFilters
    ? trolleyCases.filter((item) => params.caseFilters!.includes(item.id))
    : trolleyCases

  if (cases.length === 0) {
    throw new Error(
      `No Trolley mini-case matched --cases ${params.caseFilters?.join(',') ?? ''}`,
    )
  }

  for (const trolleyCase of cases) {
    params.jobs.push(
      ...unitJobs({
        assignment: buildAssignment({
          roleAKey,
          roleBKey,
          scenarioId: TROLLEY_SCENARIO_ID,
          selectedCaseId: trolleyCase.id,
        }),
        caseId: trolleyCase.id,
        caseTitle: trolleyCase.title,
        levels: params.levels,
        pairId: null,
        roleAKey,
        roleAName: params.scenario.roleAName,
        roleARequests: [],
        roleBKey,
        roleBName: params.scenario.roleBName,
        roleBRequests: [],
        scenarioId: TROLLEY_SCENARIO_ID,
        unitId: `${TROLLEY_SCENARIO_ID}__case-${trolleyCase.id}`,
      }),
    )
  }
}

async function buildBenchmarkDesign(params: {
  caseFilters: string[] | null
  levels: PromptLevel[]
  pairFilter: string | null
  promptSourcePath: string
  scenarios: Record<string, ScenarioRecord>
  selectedSamplePaths: BenchmarkRunConfig['selectedSamplePaths']
}) {
  const jobs: HistoryJob[] = []
  const promptLevels: PromptLevelsByScenario = {}

  if (params.scenarios[SHANGYANG_SCENARIO_ID]) {
    await addShangyangDesign({
      jobs,
      levels: params.levels,
      promptLevels,
      promptSourcePath: params.promptSourcePath,
      scenario: params.scenarios[SHANGYANG_SCENARIO_ID]!,
    })
  }

  if (params.scenarios[HONNOJI_SCENARIO_ID]) {
    await addHonnojiDesign({
      jobs,
      levels: params.levels,
      pairFilter: params.pairFilter,
      promptLevels,
      scenario: params.scenarios[HONNOJI_SCENARIO_ID]!,
      selectedSamplesPath: params.selectedSamplePaths.honnoji,
    })
  }

  if (params.scenarios[TROLLEY_SCENARIO_ID]) {
    await addTrolleyDesign({
      caseFilters: params.caseFilters,
      jobs,
      levels: params.levels,
      promptLevels,
      scenario: params.scenarios[TROLLEY_SCENARIO_ID]!,
      selectedSamplesPath: params.selectedSamplePaths.trolley,
    })
  }

  return { jobs, promptLevels }
}

function scenarioForJob(
  scenario: ScenarioRecord,
  job: Pick<
    HistoryJob | HistoryResult,
    'roleAName' | 'roleARequests' | 'roleBName' | 'roleBRequests'
  >,
  judgeModel?: BenchJudgeModelId,
): ScenarioRecord {
  return {
    ...scenario,
    judgeModel:
      judgeModel && validateEvaluationModel(judgeModel)
        ? judgeModel
        : scenario.judgeModel,
    roleAName: job.roleAName,
    roleARequests: JSON.stringify(job.roleARequests),
    roleBName: job.roleBName,
    roleBRequests: JSON.stringify(job.roleBRequests),
  }
}

type TrolleyDialogueScope = {
  caseId: string
  caseIndex: number
  caseTranscript: TranscriptTurn[]
  selectedCaseIds: string[]
}

function getTrolleyDialogueScope(
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
  transcript: TranscriptTurn[],
): TrolleyDialogueScope | null {
  if (scenario.id !== TROLLEY_SCENARIO_ID) {
    return null
  }

  const selectedCaseIds =
    assignment.selectedCaseIds && assignment.selectedCaseIds.length > 0
      ? assignment.selectedCaseIds
      : [trolleyCases[0]!.id]
  const caseIndex = Math.min(
    Math.floor(transcript.length / scenario.turnCount),
    selectedCaseIds.length - 1,
  )
  const startIndex = caseIndex * scenario.turnCount

  return {
    caseId: selectedCaseIds[caseIndex] ?? '',
    caseIndex,
    caseTranscript: transcript.slice(
      startIndex,
      startIndex + scenario.turnCount,
    ),
    selectedCaseIds,
  }
}

function buildTrolleyCaseOpening(
  scenario: ScenarioRecord,
  scope: TrolleyDialogueScope,
) {
  const caseText = formatTrolleyCaseForPrompt(scope.caseId)

  return [
    `现在进入案件 ${scope.caseId}（第 ${scope.caseIndex + 1}/${scope.selectedCaseIds.length} 个入局案件）。`,
    `本案件单独辩论 ${scenario.turnCount} 轮，只围绕当前案件发言；不要把其他案件合并进本案件。`,
    '',
    '=== 当前案件 ===',
    caseText || scope.caseId,
    '',
    `请${scenario.roleAName}先发言。`,
  ].join('\n')
}

function buildDialogueMessages(
  transcript: TranscriptTurn[],
  speaker: Side,
  scenario: ScenarioRecord,
  assignment: InfoAssignment,
) {
  const trolleyScope = getTrolleyDialogueScope(scenario, assignment, transcript)
  const contextTranscript = trolleyScope
    ? trolleyScope.caseTranscript
    : transcript
  const messages: { role: 'assistant' | 'user'; content: string }[] = []

  if (trolleyScope) {
    messages.push({
      role: 'user',
      content: buildTrolleyCaseOpening(scenario, trolleyScope),
    })
  } else if (transcript.length === 0) {
    messages.push({ role: 'user', content: scenario.openingLine })
  }

  messages.push(
    ...contextTranscript.map((turn) => ({
      role:
        turn.speaker === speaker ? ('assistant' as const) : ('user' as const),
      content: turn.content,
    })),
  )

  return messages
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error(String(signal?.reason ?? 'aborted')))
      return
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve(undefined)
    }, ms)

    const onAbort = () => {
      cleanup()
      reject(new Error(String(signal?.reason ?? 'aborted')))
    }

    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

async function withRetry<T>(
  task: (attempt: number, signal: AbortSignal) => Promise<T>,
  signal: AbortSignal | undefined,
  callTimeoutMs: number,
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const attemptController = new AbortController()
    let timeout: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        const error = new Error(
          `LLM call attempt timed out after ${callTimeoutMs}ms`,
        )
        attemptController.abort(error.message)
        reject(error)
      }, callTimeoutMs)
    })
    const onAbort = () => {
      attemptController.abort(signal?.reason ?? 'parent aborted')
    }

    try {
      if (signal?.aborted) {
        throw new Error(String(signal.reason ?? 'aborted'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      return await Promise.race([
        task(attempt, attemptController.signal),
        timeoutPromise,
      ])
    } catch (error) {
      lastError = error

      if (attempt < 3) {
        await sleep(2000 * attempt, signal)
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }
      signal?.removeEventListener('abort', onAbort)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function promptForJob(
  promptLevels: PromptLevelsByScenario,
  job: HistoryJob,
  side: Side,
) {
  const roleKey = side === 'a' ? job.roleAKey : job.roleBKey
  const level = side === 'a' ? job.levelA : job.levelB
  const prompt = promptLevels[job.scenarioId]?.roles[roleKey]?.levels[level]

  if (!prompt) {
    throw new Error(
      `Missing prompt level ${level} for ${job.scenarioId}/${roleKey}`,
    )
  }

  return prompt
}

async function runDialogueJob(params: {
  initialTranscript?: TranscriptTurn[]
  job: HistoryJob
  jobTimeoutMs: number
  llmCallTimeoutMs: number
  playerModel: SubmissionModelId
  promptLevels: PromptLevelsByScenario
  runId: string
  scenario: ScenarioRecord
}) {
  const startedAt = Date.now()
  const transcript: TranscriptTurn[] = [...(params.initialTranscript ?? [])]
  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort(
      `Benchmark history job timed out after ${params.jobTimeoutMs}ms`,
    )
  }, params.jobTimeoutMs)
  const scenario = scenarioForJob(params.scenario, params.job)

  try {
    const dialogueTurnLimit = getScenarioDialogueTurnLimit(
      scenario,
      params.job.assignment,
    )

    for (
      let turnIndex = transcript.length;
      turnIndex < dialogueTurnLimit;
      turnIndex += 1
    ) {
      const speaker: Side = turnIndex % 2 === 0 ? 'a' : 'b'
      const speakerPrompt = promptForJob(
        params.promptLevels,
        params.job,
        speaker,
      ).body
      const systemPrompt = buildAgentRuntimeSystemPrompt(
        scenario,
        speaker,
        params.job.assignment,
        speakerPrompt,
      )
      const messages = buildDialogueMessages(
        transcript,
        speaker,
        scenario,
        params.job.assignment,
      )

      const response = await withRetry(
        (attempt, signal) =>
          chatCompletion({
            messages,
            model: params.playerModel,
            signal,
            systemPrompt,
            temperature: 0,
            trace: {
              attempt,
              benchmarkCaseId: params.job.id,
              benchmarkName: BENCHMARK_NAME,
              benchmarkRunId: params.runId,
              phase: 'dialogue',
              scenarioId: scenario.id,
              side: speaker,
              turnIndex,
            },
          }),
        abortController.signal,
        params.llmCallTimeoutMs,
      )

      transcript.push({
        content: response.trim(),
        role: speaker === 'a' ? scenario.roleAName : scenario.roleBName,
        speaker,
      })

      console.log(
        `[judge-sensitivity] ${params.job.id} dialogue ${transcript.length}/${dialogueTurnLimit}`,
      )
    }

    clearTimeout(timeout)
    return historyResultFromJob(params.job, {
      durationMs: Date.now() - startedAt,
      error: null,
      playerModel: params.playerModel,
      promptAHash: promptForJob(params.promptLevels, params.job, 'a').hash,
      promptBHash: promptForJob(params.promptLevels, params.job, 'b').hash,
      status: 'ok',
      transcript,
    })
  } catch (error) {
    clearTimeout(timeout)
    return historyResultFromJob(params.job, {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      playerModel: params.playerModel,
      promptAHash: promptForJob(params.promptLevels, params.job, 'a').hash,
      promptBHash: promptForJob(params.promptLevels, params.job, 'b').hash,
      status: 'error',
      transcript,
    })
  }
}

function historyResultFromJob(
  job: HistoryJob,
  params: {
    durationMs: number
    error: string | null
    playerModel: SubmissionModelId
    promptAHash: string
    promptBHash: string
    status: 'error' | 'ok'
    transcript: TranscriptTurn[]
  },
): HistoryResult {
  return {
    assignment: job.assignment,
    baselineLevel: job.baselineLevel,
    baselineSide: job.baselineSide,
    caseId: job.caseId,
    caseTitle: job.caseTitle,
    durationMs: params.durationMs,
    error: params.error,
    generatedAt: new Date().toISOString(),
    id: job.id,
    jobId: job.id,
    judgeTranscriptA: [],
    judgeTranscriptB: [],
    levelA: job.levelA,
    levelB: job.levelB,
    models: {
      agentA: params.playerModel,
      agentB: params.playerModel,
    },
    pairId: job.pairId,
    promptAHash: params.promptAHash,
    promptBHash: params.promptBHash,
    reusedFromJobId: job.reusedFromJobId,
    roleAKey: job.roleAKey,
    roleAName: job.roleAName,
    roleARequests: job.roleARequests,
    roleBKey: job.roleBKey,
    roleBName: job.roleBName,
    roleBRequests: job.roleBRequests,
    scenarioId: job.scenarioId,
    skippedPhases: ['examination', 'judgment', 'scoring'],
    status: params.status,
    transcript: params.transcript,
    variedLevel: job.variedLevel,
    variedSide: job.variedSide,
  }
}

function syncReusedHistories(jobs: HistoryJob[], histories: HistoryResult[]) {
  const byJobId = new Map(histories.map((history) => [history.jobId, history]))
  const synced = [...histories]

  for (const job of jobs) {
    if (!job.reusedFromJobId || byJobId.has(job.id)) {
      continue
    }

    const source = byJobId.get(job.reusedFromJobId)
    if (!source || source.status !== 'ok') {
      continue
    }

    const clone: HistoryResult = {
      ...source,
      assignment: job.assignment,
      baselineLevel: job.baselineLevel,
      baselineSide: job.baselineSide,
      caseId: job.caseId,
      caseTitle: job.caseTitle,
      durationMs: 0,
      error: null,
      generatedAt: new Date().toISOString(),
      id: job.id,
      jobId: job.id,
      levelA: job.levelA,
      levelB: job.levelB,
      pairId: job.pairId,
      reusedFromJobId: job.reusedFromJobId,
      roleAKey: job.roleAKey,
      roleAName: job.roleAName,
      roleARequests: job.roleARequests,
      roleBKey: job.roleBKey,
      roleBName: job.roleBName,
      roleBRequests: job.roleBRequests,
      scenarioId: job.scenarioId,
      variedLevel: job.variedLevel,
      variedSide: job.variedSide,
    }

    synced.push(clone)
    byJobId.set(job.id, clone)
  }

  return synced
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
        const item = items[index]
        index += 1
        await worker(item!)
      }
    },
  )

  await Promise.all(workers)
}

function summarizeHistories(
  histories: HistoryResult[],
  expected: number,
  executableExpected: number,
) {
  return {
    completed: histories.filter((history) => history.status === 'ok').length,
    errored: histories.filter((history) => history.status === 'error').length,
    expected,
    executableExpected,
    reused: histories.filter((history) => history.reusedFromJobId).length,
    totalRows: histories.length,
  }
}

function summarizeJudgeResults(results: JudgeResult[], expected: number) {
  const providerResponseIds = results
    .map((result) => result.providerResponseId)
    .filter((id): id is string => Boolean(id))
  const cacheUsages = results
    .map((result) => result.cacheUsage)
    .filter((cacheUsage): cacheUsage is PromptCacheUsage => cacheUsage != null)

  return {
    completed: results.filter((result) => result.status === 'ok').length,
    duplicateProviderResponseIds:
      providerResponseIds.length - new Set(providerResponseIds).size,
    errored: results.filter((result) => result.status === 'error').length,
    expected,
    promptCacheHitCalls: cacheUsages.filter(
      (cacheUsage) => (cacheUsage.promptCacheHitTokens ?? 0) > 0,
    ).length,
    promptCacheHitTokens: cacheUsages.reduce(
      (total, cacheUsage) => total + (cacheUsage.promptCacheHitTokens ?? 0),
      0,
    ),
    promptCacheMissCalls: cacheUsages.filter(
      (cacheUsage) => (cacheUsage.promptCacheMissTokens ?? 0) > 0,
    ).length,
    promptCacheMissTokens: cacheUsages.reduce(
      (total, cacheUsage) => total + (cacheUsage.promptCacheMissTokens ?? 0),
      0,
    ),
    promptCacheUsageReported: cacheUsages.length,
    parseFailures: results.filter(
      (result) =>
        result.status === 'ok' &&
        (result.parsedPolicy.parseError ||
          result.parsedPolicy.policyWinner === 'unknown'),
    ).length,
    reasoningVerifiedOff: results.filter(
      (result) => result.reasoningVerification?.verifiedOff === true,
    ).length,
    reasoningVerifiedOn: results.filter(
      (result) => result.reasoningVerification?.verifiedOn === true,
    ).length,
    providerResponseIdsRecorded: providerResponseIds.length,
  }
}

async function readExistingHistories(outputDir: string) {
  const path = join(outputDir, 'histories.json')
  if (!existsSync(path)) {
    return []
  }

  const artifact = await readJsonFile<HistoriesArtifact>(path)
  return artifact.histories
}

async function readExistingJudgeResults(outputDir: string) {
  const path = join(outputDir, 'judge-results.json')
  if (!existsSync(path)) {
    return []
  }

  const artifact = await readJsonFile<JudgeResultsArtifact>(path)
  const byId = new Map<string, JudgeResult>()

  for (const result of artifact.results) {
    const existing = byId.get(result.id)
    if (!existing) {
      byId.set(result.id, result)
      continue
    }

    const existingIsValid =
      existing.status === 'ok' && !existing.parsedPolicy.parseError
    const resultIsValid =
      result.status === 'ok' && !result.parsedPolicy.parseError

    if (
      (resultIsValid && !existingIsValid) ||
      (resultIsValid === existingIsValid &&
        result.generatedAt >= existing.generatedAt)
    ) {
      byId.set(result.id, result)
    }
  }

  return [...byId.values()]
}

function sortHistories(histories: HistoryResult[], jobs: HistoryJob[]) {
  const order = new Map(jobs.map((job, index) => [job.id, index]))
  return [...histories].sort(
    (left, right) =>
      (order.get(left.jobId) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(right.jobId) ?? Number.MAX_SAFE_INTEGER) ||
      left.jobId.localeCompare(right.jobId),
  )
}

function sortJudgeResults(results: JudgeResult[]) {
  return [...results].sort((left, right) => left.id.localeCompare(right.id))
}

async function writeRunArtifacts(params: {
  config: BenchmarkRunConfig
  histories: HistoryResult[]
  jobs: HistoryJob[]
  judgeResults?: JudgeResult[]
  judgeResultsDryRun?: boolean
  promptLevels: PromptLevelsByScenario
  scenarioSnapshots: Record<string, ScenarioSnapshot>
}) {
  await mkdir(params.config.outputDir, { recursive: true })

  const executableExpected = params.jobs.filter(
    (job) => !job.reusedFromJobId,
  ).length
  const histories = sortHistories(params.histories, params.jobs)
  const judgeResults = sortJudgeResults(params.judgeResults ?? [])
  const plannedReplayJobs = buildJudgeReplayJobs({
    caseFilters: params.config.judgeCaseFilters ?? null,
    histories,
    judgeModels: params.config.judgeModels,
    repeats: params.config.judgeRepeats,
    scenarioIds:
      params.config.judgeScenarioIds ?? params.config.scenarioIds ?? undefined,
  })
  const plannedJudgeJobs = plannedReplayJobs.length
  const plannedJudgeIds = new Set(plannedReplayJobs.map((job) => job.id))
  const activeJudgeResults = judgeResults.filter((result) =>
    plannedJudgeIds.has(result.id),
  )
  const historiesArtifact: HistoriesArtifact = {
    generatedAt: new Date().toISOString(),
    histories,
    kind: 'judge_sensitivity.histories',
    summary: summarizeHistories(
      histories,
      params.config.historyCountExpected,
      executableExpected,
    ),
  }
  const judgeResultsArtifact: JudgeResultsArtifact = {
    dryRun: params.judgeResultsDryRun ?? judgeResults.length === 0,
    generatedAt: new Date().toISOString(),
    kind: 'judge_sensitivity.judge_results',
    plannedJobs: plannedJudgeJobs,
    results: judgeResults,
    summary: summarizeJudgeResults(activeJudgeResults, plannedJudgeJobs),
  }
  const summary = buildSummaryArtifact({
    config: params.config,
    histories,
    judgeResults: activeJudgeResults,
    plannedJudgeJobs,
  })

  await writeFile(
    join(params.config.outputDir, 'config.json'),
    `${JSON.stringify(params.config, null, 2)}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'scenario-snapshots.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        kind: 'judge_sensitivity.scenario_snapshots',
        scenarios: params.scenarioSnapshots,
      },
      null,
      2,
    )}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'prompt-levels.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        kind: 'judge_sensitivity.prompt_levels',
        scenarios: params.promptLevels,
      },
      null,
      2,
    )}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'histories.json'),
    `${JSON.stringify(historiesArtifact, null, 2)}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'judge-results.json'),
    `${JSON.stringify(judgeResultsArtifact, null, 2)}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  )
  await writeFile(
    join(params.config.outputDir, 'summary.md'),
    renderSummaryMarkdown(summary),
  )
  await writeFile(
    join(params.config.outputDir, 'histories.md'),
    renderHistoriesMarkdown({
      config: params.config,
      histories,
      promptLevels: params.promptLevels,
    }),
  )
  await writeFile(
    join(params.config.outputDir, 'index.html'),
    renderHtmlReport(summary),
  )
}

function groupCount<T extends string>(values: T[], key: (value: T) => string) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const group = key(value)
    acc[group] = (acc[group] ?? 0) + 1
    return acc
  }, {})
}

function unitLabel(
  history: Pick<HistoryResult, 'caseId' | 'pairId' | 'scenarioId'>,
) {
  if (history.pairId) {
    return history.pairId
  }
  if (history.caseId) {
    return `case-${history.caseId}`
  }
  return history.scenarioId
}

function variedSideWon(result: JudgeResult) {
  return result.parsedPolicy.policyWinner === result.variedSide
}

function rawMarginForWinner(winner: PolicyWinner) {
  if (winner === 'a') {
    return 1
  }
  if (winner === 'b') {
    return -1
  }
  return 0
}

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildJudgeSensitivitySummary(results: JudgeResult[]) {
  const ok = results.filter((result) => result.status === 'ok')
  const groupMap = new Map<
    string,
    {
      caseId: string | null
      judgeModel: BenchJudgeModelId
      pairId: string | null
      rawMargin: number
      scenarioId: ScenarioId
      total: number
      unit: string
      variedLevel: PromptLevel
      variedSide: Side
      variedWins: number
    }
  >()

  for (const result of ok) {
    const unit =
      result.pairId ??
      (result.caseId ? `case-${result.caseId}` : result.scenarioId)
    const key = [
      result.judgeModel,
      result.scenarioId,
      unit,
      result.variedSide,
      result.variedLevel,
    ].join('|')
    const row = groupMap.get(key) ?? {
      caseId: result.caseId,
      judgeModel: result.judgeModel,
      pairId: result.pairId,
      rawMargin: 0,
      scenarioId: result.scenarioId,
      total: 0,
      unit,
      variedLevel: result.variedLevel,
      variedSide: result.variedSide,
      variedWins: 0,
    }

    row.total += 1
    row.rawMargin += rawMarginForWinner(result.parsedPolicy.policyWinner)
    if (variedSideWon(result)) {
      row.variedWins += 1
    }
    groupMap.set(key, row)
  }

  const details = [...groupMap.values()].map((row) => ({
    ...row,
    rawMargin: row.total > 0 ? row.rawMargin / row.total : null,
    variedSideWinRate: row.total > 0 ? row.variedWins / row.total : null,
  }))

  const modelRows = new Map<
    BenchJudgeModelId,
    {
      absoluteSensitivity: number[]
      badToGoodSensitivity: number[]
      fixedHistoryVariance: number[]
      level3To4Sensitivity: number[]
    }
  >()

  const observedJudgeModels = [
    ...new Set(details.map((row) => row.judgeModel)),
  ].sort()

  for (const judgeModel of observedJudgeModels) {
    modelRows.set(judgeModel, {
      absoluteSensitivity: [],
      badToGoodSensitivity: [],
      fixedHistoryVariance: [],
      level3To4Sensitivity: [],
    })
  }

  const byModelUnitSide = new Map<string, typeof details>()
  for (const row of details) {
    const key = [row.judgeModel, row.scenarioId, row.unit, row.variedSide].join(
      '|',
    )
    byModelUnitSide.set(key, [...(byModelUnitSide.get(key) ?? []), row])
  }

  for (const rows of byModelUnitSide.values()) {
    const modelRow = modelRows.get(rows[0]!.judgeModel)
    if (!modelRow) {
      continue
    }
    const byLevel = new Map(rows.map((row) => [row.variedLevel, row]))
    const level3 = byLevel.get(3)?.variedSideWinRate
    if (level3 == null) {
      continue
    }

    for (const level of [1, 2, 4] as const) {
      const rate = byLevel.get(level)?.variedSideWinRate
      if (rate != null) {
        modelRow.absoluteSensitivity.push(Math.abs(rate - level3))
      }
    }

    const level4 = byLevel.get(4)?.variedSideWinRate
    if (level4 != null) {
      modelRow.level3To4Sensitivity.push(level4 - level3)
    }

    const badRates = [
      byLevel.get(1)?.variedSideWinRate,
      byLevel.get(2)?.variedSideWinRate,
    ].filter((value): value is number => value != null)
    const goodRates = [
      byLevel.get(3)?.variedSideWinRate,
      byLevel.get(4)?.variedSideWinRate,
    ].filter((value): value is number => value != null)
    const badAvg = average(badRates)
    const goodAvg = average(goodRates)
    if (badAvg != null && goodAvg != null) {
      modelRow.badToGoodSensitivity.push(goodAvg - badAvg)
    }
  }

  const byHistoryModel = new Map<string, JudgeResult[]>()
  for (const result of ok) {
    const key = [result.judgeModel, result.historyJobId].join('|')
    byHistoryModel.set(key, [...(byHistoryModel.get(key) ?? []), result])
  }
  for (const rows of byHistoryModel.values()) {
    const modelRow = modelRows.get(rows[0]!.judgeModel)
    if (!modelRow) {
      continue
    }
    const aRate =
      rows.filter((row) => row.parsedPolicy.policyWinner === 'a').length /
      rows.length
    modelRow.fixedHistoryVariance.push(aRate * (1 - aRate))
  }

  return {
    details,
    modelLevel: [...modelRows.entries()].map(([judgeModel, row]) => ({
      averageAbsoluteSensitivity: average(row.absoluteSensitivity),
      badToGoodSensitivity: average(row.badToGoodSensitivity),
      fixedHistoryInstability: average(row.fixedHistoryVariance),
      judgeModel,
      level3To4Sensitivity: average(row.level3To4Sensitivity),
    })),
  }
}

function buildJudgeRequestProfiles(results: JudgeResult[]) {
  const profiles = new Map<
    BenchJudgeModelId,
    {
      apiModels: Set<string>
      calls: number
      callsWithReasoning: number
      efforts: Set<string>
      judgeModel: BenchJudgeModelId
      providers: Set<string>
      reasoningTokensReported: number
      requestControls: Set<string>
      thinkingModes: Set<string>
    }
  >()

  for (const result of results.filter((item) => item.status === 'ok')) {
    const provenance = result.requestProvenance
    if (!provenance) {
      continue
    }
    const row = profiles.get(result.judgeModel) ?? {
      apiModels: new Set<string>(),
      calls: 0,
      callsWithReasoning: 0,
      efforts: new Set<string>(),
      judgeModel: result.judgeModel,
      providers: new Set<string>(),
      reasoningTokensReported: 0,
      requestControls: new Set<string>(),
      thinkingModes: new Set<string>(),
    }
    row.apiModels.add(provenance.apiModel)
    row.calls += 1
    if (
      provenance.reasoningContentChars > 0 ||
      (provenance.reasoningTokens ?? 0) > 0
    ) {
      row.callsWithReasoning += 1
    }
    if (provenance.configuredEffort) {
      row.efforts.add(provenance.configuredEffort)
    }
    row.providers.add(provenance.provider)
    if (provenance.reasoningTokens != null) {
      row.reasoningTokensReported += 1
    }
    row.requestControls.add(
      provenance.thinkingRequestControl == null
        ? 'none'
        : stableStringify(provenance.thinkingRequestControl),
    )
    row.thinkingModes.add(provenance.thinkingMode)
    profiles.set(result.judgeModel, row)
  }

  return [...profiles.values()].map((row) => ({
    apiModels: [...row.apiModels].sort(),
    calls: row.calls,
    callsWithReasoning: row.callsWithReasoning,
    efforts: [...row.efforts].sort(),
    judgeModel: row.judgeModel,
    providers: [...row.providers].sort(),
    reasoningTokensReported: row.reasoningTokensReported,
    requestControls: [...row.requestControls].sort(),
    thinkingModes: [...row.thinkingModes].sort(),
  }))
}

function buildSummaryArtifact(params: {
  config: BenchmarkRunConfig
  histories: HistoryResult[]
  judgeResults: JudgeResult[]
  plannedJudgeJobs: number
}) {
  const historySummary = summarizeHistories(
    params.histories,
    params.config.historyCountExpected,
    params.config.historyExecutionCountExpected,
  )
  const configuredTrolleyCases = configuredHistoryCaseFilters(params.config)
  const historyByScenario = ALL_SCENARIO_IDS.reduce<
    Record<
      string,
      { completed: number; errored: number; expected: number; rows: number }
    >
  >((acc, scenarioId) => {
    const rows = params.histories.filter(
      (history) => history.scenarioId === scenarioId,
    )
    const expected = params.config.scenarioIds.includes(scenarioId)
      ? params.config.scenarioIds.includes(HONNOJI_SCENARIO_ID) &&
        scenarioId === HONNOJI_SCENARIO_ID &&
        params.config.pairFilter
        ? 8
        : params.config.scenarioIds.includes(TROLLEY_SCENARIO_ID) &&
            scenarioId === TROLLEY_SCENARIO_ID &&
            configuredTrolleyCases
          ? configuredTrolleyCases.length * 8
          : scenarioId === SHANGYANG_SCENARIO_ID
            ? 8
            : scenarioId === HONNOJI_SCENARIO_ID
              ? 32
              : 40
      : 0
    acc[scenarioId] = {
      completed: rows.filter((history) => history.status === 'ok').length,
      errored: rows.filter((history) => history.status === 'error').length,
      expected,
      rows: rows.length,
    }
    return acc
  }, {})
  const judgeSummary = summarizeJudgeResults(
    params.judgeResults,
    params.plannedJudgeJobs,
  )

  return {
    config: params.config,
    generatedAt: new Date().toISOString(),
    histories: {
      byScenario: historyByScenario,
      byStatus: groupCount(
        params.histories.map((history) => history.status),
        (status) => status,
      ),
      summary: historySummary,
    },
    judge: {
      plannedJobs: params.plannedJudgeJobs,
      requestProfiles: buildJudgeRequestProfiles(params.judgeResults),
      results: judgeSummary,
      sensitivity: buildJudgeSensitivitySummary(params.judgeResults),
    },
    kind: 'judge_sensitivity.summary' as const,
  }
}

function markdownInlineCode(value: string) {
  return `\`${value.replaceAll('`', '\\`')}\``
}

function markdownQuote(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '> （空）'
  }

  return trimmed
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
}

function percent(value: number | null) {
  return value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`
}

function renderSummaryMarkdown(summary: SummaryArtifact) {
  const config = summary.config
  const sourceLine = config.scenarioSource.dbPath
    ? `DB path: ${config.scenarioSource.dbPath}`
    : `API URL: ${config.scenarioSource.apiUrl}`
  const lines = [
    '# Judge Sensitivity Benchmark',
    '',
    `Generated: ${summary.generatedAt}`,
    `Run ID: ${config.runId}`,
    config.runLabel ? `Run label: ${config.runLabel}` : null,
    `Scenarios: ${config.scenarioIds.join(', ')}`,
    `Source: ${config.scenarioSource.type}`,
    sourceLine,
    config.scenarioSource.note
      ? `Source note: ${config.scenarioSource.note}`
      : null,
    `Player model: ${config.playerModel}`,
    `Judge models: ${config.judgeModels.map((model) => judgeModelLabel(config, model)).join(', ')}`,
    `Judge repeats: ${config.judgeRepeats}`,
    `Judge thinking mode: ${config.judgeThinkingMode ?? 'provider-default'}`,
    config.judgePromptPatch
      ? `Judge prompt patch: ${config.judgePromptPatch.sourcePath}`
      : null,
    config.judgePromptPatch
      ? `Judge prompt patch source SHA-256: ${config.judgePromptPatch.sourceHash}`
      : null,
    config.judgePromptPatch
      ? `Patched judge prompt SHA-256: ${config.judgePromptPatch.patchedJudgePromptHash}`
      : null,
    config.trolleyJudgePromptOverride
      ? `Trolley judge prompt candidate: ${config.trolleyJudgePromptOverride.candidateId ?? 'unlabeled'}`
      : null,
    config.trolleyJudgePromptOverride
      ? `Trolley judge prompt source: ${config.trolleyJudgePromptOverride.sourcePath}`
      : null,
    config.trolleyJudgePromptOverride
      ? `Trolley baseline judge prompt SHA-256: ${config.trolleyJudgePromptOverride.originalJudgePromptHash}`
      : null,
    config.trolleyJudgePromptOverride
      ? `Trolley active judge prompt SHA-256: ${config.trolleyJudgePromptOverride.overrideJudgePromptHash}`
      : null,
    `Judge cache strategy: ${config.judgeCacheStrategy ?? 'legacy-unrecorded'}`,
    `History concurrency: ${config.concurrency}`,
    `Judge concurrency: ${config.judgeConcurrency}`,
    `Prompt levels: ${config.levels.join(', ')}`,
    '',
    '## History Status',
    '',
    `Rows: ${summary.histories.summary.completed}/${summary.histories.summary.expected} completed, ${summary.histories.summary.errored} errored, ${summary.histories.summary.reused} physically reused`,
    `Executable history jobs: ${summary.histories.summary.executableExpected}`,
    '',
    '| Scenario | Rows | Completed | Errored | Expected |',
    '| --- | ---: | ---: | ---: | ---: |',
  ].filter((line): line is string => line !== null)

  for (const scenarioId of config.scenarioIds) {
    const row = summary.histories.byScenario[scenarioId]
    lines.push(
      `| ${scenarioId} | ${row?.rows ?? 0} | ${row?.completed ?? 0} | ${row?.errored ?? 0} | ${row?.expected ?? 0} |`,
    )
  }

  lines.push(
    '',
    '## Judge Replay',
    '',
    `Planned judge calls: ${summary.judge.plannedJobs}`,
    `Completed judge calls: ${summary.judge.results.completed}`,
    `Errored judge calls: ${summary.judge.results.errored}`,
    `Parse failures: ${summary.judge.results.parseFailures}`,
    `Reasoning-off verifications: ${summary.judge.results.reasoningVerifiedOff}`,
    `Reasoning-on verifications: ${summary.judge.results.reasoningVerifiedOn}`,
    `Prompt-cache usage reports: ${summary.judge.results.promptCacheUsageReported}`,
    `Prompt-cache hit calls / tokens: ${summary.judge.results.promptCacheHitCalls} / ${summary.judge.results.promptCacheHitTokens}`,
    `Prompt-cache miss calls / tokens: ${summary.judge.results.promptCacheMissCalls} / ${summary.judge.results.promptCacheMissTokens}`,
    `Provider response IDs / duplicates: ${summary.judge.results.providerResponseIdsRecorded} / ${summary.judge.results.duplicateProviderResponseIds}`,
    '',
  )

  if (summary.judge.requestProfiles.length > 0) {
    lines.push(
      '## Judge Request / Reasoning Provenance',
      '',
      '| Judge model | Provider | API model | Thinking mode | Request control | Configured effort | Calls with reasoning | Reasoning tokens reported | Calls |',
      '| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |',
    )

    for (const row of summary.judge.requestProfiles) {
      lines.push(
        `| ${judgeModelLabel(config, row.judgeModel)} | ${row.providers.join(', ') || 'n/a'} | ${row.apiModels.join(', ') || 'n/a'} | ${row.thinkingModes.join(', ') || 'n/a'} | ${row.requestControls.map((control) => markdownInlineCode(control)).join(', ')} | ${row.efforts.join(', ') || 'n/a'} | ${row.callsWithReasoning} | ${row.reasoningTokensReported} | ${row.calls} |`,
      )
    }
    lines.push('')
  }

  if (summary.judge.results.completed === 0) {
    lines.push(
      'Judge replay has not been executed. The prepared command is saved in this run config; run `judge --output-dir <run-dir>` after approval.',
      '',
    )
  } else {
    lines.push(
      '## Model-Level Sensitivity',
      '',
      '| Judge model | Avg abs sensitivity | Bad->good sensitivity | Level 3->4 | Fixed-history instability |',
      '| --- | ---: | ---: | ---: | ---: |',
    )

    for (const row of summary.judge.sensitivity.modelLevel) {
      lines.push(
        `| ${judgeModelLabel(config, row.judgeModel)} | ${percent(row.averageAbsoluteSensitivity)} | ${percent(row.badToGoodSensitivity)} | ${percent(row.level3To4Sensitivity)} | ${percent(row.fixedHistoryInstability)} |`,
      )
    }

    lines.push(
      '',
      '## Scenario/Pair/Case Details',
      '',
      '| Judge model | Scenario | Unit | Varied side | Level | Varied-side win rate | Raw A-B margin | N |',
      '| --- | --- | --- | --- | ---: | ---: | ---: | ---: |',
    )

    for (const row of summary.judge.sensitivity.details) {
      lines.push(
        `| ${judgeModelLabel(config, row.judgeModel)} | ${row.scenarioId} | ${row.unit} | ${row.variedSide} | ${row.variedLevel} | ${percent(row.variedSideWinRate)} | ${row.rawMargin == null ? 'n/a' : row.rawMargin.toFixed(3)} | ${row.total} |`,
      )
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function renderPromptLevelTable(promptLevels: PromptLevelsByScenario) {
  const lines = [
    '| Scenario | Role | Side | Level | Label | Prompt hash | Source | Sample |',
    '| --- | --- | --- | ---: | --- | --- | --- | --- |',
  ]

  for (const [scenarioId, scenario] of Object.entries(promptLevels)) {
    for (const role of Object.values(scenario.roles)) {
      for (const level of PROMPT_LEVELS) {
        const promptLevel = role.levels[level]
        const sample = promptLevel.metadata
          ? [
              promptLevel.metadata.displayName,
              promptLevel.metadata.version == null
                ? null
                : `v${promptLevel.metadata.version}`,
              promptLevel.metadata.sampleId,
            ]
              .filter(Boolean)
              .join(' ')
          : ''
        lines.push(
          `| ${scenarioId} | ${role.roleName} | ${role.side} | ${level} | ${promptLevel.label} | ${markdownInlineCode(promptLevel.hash.slice(0, 12))} | ${promptLevel.source} | ${sample} |`,
        )
      }
    }
  }

  return lines.join('\n')
}

function renderHistoriesMarkdown(params: {
  config: BenchmarkRunConfig
  histories: HistoryResult[]
  promptLevels: PromptLevelsByScenario
}) {
  const summary = summarizeHistories(
    params.histories,
    params.config.historyCountExpected,
    params.config.historyExecutionCountExpected,
  )
  const sourceLine = params.config.scenarioSource.dbPath
    ? `DB path: ${params.config.scenarioSource.dbPath}`
    : `API URL: ${params.config.scenarioSource.apiUrl}`
  const lines = [
    '# Judge Sensitivity Debate Histories',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Run ID: ${params.config.runId}`,
    params.config.runLabel ? `Run label: ${params.config.runLabel}` : null,
    `Scenarios: ${params.config.scenarioIds.join(', ')}`,
    `Source: ${params.config.scenarioSource.type}`,
    sourceLine,
    params.config.scenarioSource.note
      ? `Source note: ${params.config.scenarioSource.note}`
      : null,
    `Player model: ${params.config.playerModel}`,
    `Rows: ${summary.completed}/${summary.expected} completed, ${summary.errored} errored, ${summary.reused} physically reused`,
    `Skipped phases: examination, judgment, scoring`,
    '',
    '## Prompt Levels',
    '',
    renderPromptLevelTable(params.promptLevels),
    '',
    '## Runs',
    '',
  ].filter((line): line is string => line !== null)

  params.histories.forEach((history, index) => {
    const unit = history.pairId
      ? `Pair ${history.pairId}`
      : history.caseId
        ? `Mini-case ${history.caseId} ${history.caseTitle ?? ''}`.trim()
        : 'Scenario-level matchup'
    lines.push(
      `### ${index + 1}. ${history.jobId}`,
      '',
      `- Status: ${history.status}`,
      `- Scenario: ${history.scenarioId}`,
      `- Unit: ${unit}`,
      `- Varied side: ${history.variedSide === 'a' ? history.roleAName : history.roleBName} (${history.variedSide})`,
      `- Varied level: ${history.variedLevel}`,
      `- Matchup: ${history.roleAName} L${history.levelA} vs ${history.roleBName} L${history.levelB}`,
      `- True requests: ${history.assignment.roleATrueRequestIds.join(', ') || 'none'} / ${history.assignment.roleBTrueRequestIds.join(', ') || 'none'}`,
    )
    if (history.assignment.selectedCaseIds?.length) {
      lines.push(
        `- Selected cases: ${history.assignment.selectedCaseIds.join(', ')}`,
      )
    }
    lines.push(`- Duration: ${history.durationMs} ms`)
    if (history.reusedFromJobId) {
      lines.push(`- Reused from: ${history.reusedFromJobId}`)
    }
    lines.push(
      `- Prompt hashes: A ${markdownInlineCode(history.promptAHash.slice(0, 12))}, B ${markdownInlineCode(history.promptBHash.slice(0, 12))}`,
      `- Error: ${history.error ?? 'none'}`,
      '',
      '#### Transcript',
      '',
    )

    if (history.transcript.length === 0) {
      lines.push('（No transcript turns saved.）', '')
      return
    }

    history.transcript.forEach((turn, turnIndex) => {
      lines.push(
        `**Turn ${turnIndex + 1} - ${turn.role} (${turn.speaker})**`,
        '',
        markdownQuote(turn.content),
        '',
      )
    })
  })

  return `${lines.filter((line): line is string => line !== null).join('\n')}\n`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderHtmlReport(summary: SummaryArtifact) {
  const detailRows = summary.judge.sensitivity.details
    .map(
      (row) =>
        `<tr><td>${escapeHtml(judgeModelLabel(summary.config, row.judgeModel))}</td><td>${escapeHtml(row.scenarioId)}</td><td>${escapeHtml(row.unit)}</td><td>${row.variedSide}</td><td>${row.variedLevel}</td><td>${percent(row.variedSideWinRate)}</td><td>${row.rawMargin == null ? 'n/a' : row.rawMargin.toFixed(3)}</td><td>${row.total}</td></tr>`,
    )
    .join('\n')
  const modelRows = summary.judge.sensitivity.modelLevel
    .map(
      (row) =>
        `<tr><td>${escapeHtml(judgeModelLabel(summary.config, row.judgeModel))}</td><td>${percent(row.averageAbsoluteSensitivity)}</td><td>${percent(row.badToGoodSensitivity)}</td><td>${percent(row.level3To4Sensitivity)}</td><td>${percent(row.fixedHistoryInstability)}</td></tr>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Judge Sensitivity Benchmark</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #111827; }
    h1, h2 { margin-bottom: 8px; }
    .meta { color: #4b5563; line-height: 1.55; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 28px; font-size: 14px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Judge Sensitivity Benchmark</h1>
  <div class="meta">
    <div>Run ID: <code>${escapeHtml(summary.config.runId)}</code></div>
    <div>Scenarios: ${escapeHtml(summary.config.scenarioIds.join(', '))}</div>
    <div>Histories: ${summary.histories.summary.completed}/${summary.histories.summary.expected} completed</div>
    <div>Planned judge calls: ${summary.judge.plannedJobs}; completed: ${summary.judge.results.completed}</div>
    <div>Reasoning-off verifications: ${summary.judge.results.reasoningVerifiedOff}</div>
    <div>Reasoning-on verifications: ${summary.judge.results.reasoningVerifiedOn}</div>
    <div>Prompt-cache usage reports: ${summary.judge.results.promptCacheUsageReported}</div>
    <div>Prompt-cache hit calls / tokens: ${summary.judge.results.promptCacheHitCalls} / ${summary.judge.results.promptCacheHitTokens}</div>
    <div>Prompt-cache miss calls / tokens: ${summary.judge.results.promptCacheMissCalls} / ${summary.judge.results.promptCacheMissTokens}</div>
    <div>Provider response IDs / duplicates: ${summary.judge.results.providerResponseIdsRecorded} / ${summary.judge.results.duplicateProviderResponseIds}</div>
  </div>
  <h2>Model-Level Sensitivity</h2>
  <table>
    <thead><tr><th>Judge model</th><th>Avg abs sensitivity</th><th>Bad to good</th><th>Level 3 to 4</th><th>Fixed-history instability</th></tr></thead>
    <tbody>${modelRows || '<tr><td colspan="5">Judge replay not run yet.</td></tr>'}</tbody>
  </table>
  <h2>Scenario / Pair / Case Details</h2>
  <table>
    <thead><tr><th>Judge model</th><th>Scenario</th><th>Unit</th><th>Varied side</th><th>Level</th><th>Varied-side win rate</th><th>Raw A-B margin</th><th>N</th></tr></thead>
    <tbody>${detailRows || '<tr><td colspan="8">Judge replay not run yet.</td></tr>'}</tbody>
  </table>
</body>
</html>
`
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

function extractFirstJsonRecord(text: string) {
  const direct = parseJsonRecord(text)
  if (direct) {
    return direct
  }

  const start = text.indexOf('{')
  if (start < 0) {
    return null
  }

  const objectText = extractBalancedObject(text, start)
  return objectText ? parseJsonRecord(objectText) : null
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
    Object.entries(value).map(([key, entry]) => [key, String(entry)]),
  )
}

function winnerFromPolicyText(scenarioId: ScenarioId, text: string | null) {
  const value = text ?? ''

  if (scenarioId === SHANGYANG_SCENARIO_ID) {
    if (value.includes('维持现状')) {
      return 'b'
    }
    if (
      value.includes('变法') ||
      value.includes('推行变法') ||
      value.includes('支持变法')
    ) {
      return 'a'
    }
    return 'unknown'
  }

  if (scenarioId === HONNOJI_SCENARIO_ID) {
    if (
      value.includes('西进毛利') ||
      value.includes('避免刺杀') ||
      value.includes('不杀信长')
    ) {
      return 'b'
    }
    if (
      value.includes('袭击本能寺') ||
      value.includes('攻打本能寺') ||
      value.includes('刺杀信长') ||
      value.includes('杀信长')
    ) {
      return 'a'
    }
    return 'unknown'
  }

  if (value.includes('一人侧')) {
    return 'a'
  }
  if (value.includes('五人侧')) {
    return 'b'
  }
  return 'unknown'
}

function parseJudgePolicy(
  raw: string,
  history: HistoryResult,
): JudgePolicyParse {
  const record = extractFirstJsonRecord(raw)
  const requests = asStringRecord(record?.requests)
  const judgments = asStringRecord(record?.judgments)
  const judgment = asString(record?.judgment)
  const caseId =
    history.caseId ?? history.assignment.selectedCaseIds?.[0] ?? null
  const policyText =
    history.scenarioId === TROLLEY_SCENARIO_ID && caseId
      ? (judgments[caseId] ?? judgment)
      : judgment
  const policyWinner = winnerFromPolicyText(
    history.scenarioId,
    policyText ?? raw,
  )
  const parseError = !record
    ? 'No JSON object parsed'
    : policyWinner === 'unknown'
      ? 'Could not resolve policy winner'
      : null

  return {
    judgment,
    judgments,
    parseError,
    policyWinner,
    requests,
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function providerBaseUrl(provider: BenchJudgeProvider) {
  if (provider === 'openai') {
    return OPENAI_BASE_URL
  }
  if (provider === 'siliconflow') {
    return SILICONFLOW_BASE_URL
  }
  if (provider === 'zhipu') {
    return ZHIPU_BASE_URL
  }
  return ANTHROPIC_BASE_URL
}

function providerApiKey(provider: BenchJudgeProvider) {
  if (provider === 'openai') {
    return getRequiredEnv('OPENAI_API_KEY')
  }
  if (provider === 'siliconflow') {
    return getRequiredEnv('SILICONFLOW_API_KEY')
  }
  if (provider === 'zhipu') {
    return getRequiredEnv('ZHIPU_API_KEY')
  }
  return getRequiredEnv('ANTHROPIC_API_KEY')
}

function endpointUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/u, '')}/${path.replace(/^\/+/u, '')}`
}

function errorSnippet(text: string) {
  return text.replace(/\s+/gu, ' ').trim().slice(0, 500)
}

async function parseResponseJson(
  response: Response,
  provider: BenchJudgeProvider,
) {
  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `${provider} experimental judge request failed (${response.status} ${response.statusText}): ${errorSnippet(text)}`,
    )
  }

  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    throw new Error(
      `${provider} experimental judge response was not JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

function finiteNumberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function extractOpenAICompatibleContent(
  payload: unknown,
  definition: BenchJudgeModelDefinition,
): BenchJudgeCompletion {
  const record = payload as {
    created?: unknown
    choices?: Array<{
      message?: { content?: unknown; reasoning_content?: unknown }
    }>
    id?: unknown
    usage?: {
      completion_tokens_details?: { reasoning_tokens?: unknown }
      prompt_cache_hit_tokens?: unknown
      prompt_cache_miss_tokens?: unknown
      prompt_tokens?: unknown
      prompt_tokens_details?: { cached_tokens?: unknown }
    }
  }
  const message = record.choices?.[0]?.message
  const content = message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI-compatible experimental judge response was empty')
  }

  const cachedPromptTokens = finiteNumberOrNull(
    record.usage?.prompt_tokens_details?.cached_tokens,
  )
  const explicitPromptCacheHitTokens = finiteNumberOrNull(
    record.usage?.prompt_cache_hit_tokens,
  )
  const promptCacheMissTokens = finiteNumberOrNull(
    record.usage?.prompt_cache_miss_tokens,
  )
  const promptTokens = finiteNumberOrNull(record.usage?.prompt_tokens)
  const cacheUsage =
    cachedPromptTokens == null &&
    explicitPromptCacheHitTokens == null &&
    promptCacheMissTokens == null &&
    promptTokens == null
      ? null
      : {
          cachedPromptTokens,
          promptCacheHitTokens:
            explicitPromptCacheHitTokens ?? cachedPromptTokens,
          promptCacheMissTokens,
          promptTokens,
        }
  const completionBase = {
    cacheUsage,
    content,
    providerCreatedAt: finiteNumberOrNull(record.created),
    providerResponseId: typeof record.id === 'string' ? record.id : null,
    requestProvenance: null,
  }

  if (
    !definition.verifyReasoningDisabled &&
    !definition.verifyReasoningEnabled
  ) {
    return { ...completionBase, reasoningVerification: null }
  }

  if (definition.verifyReasoningDisabled && definition.verifyReasoningEnabled) {
    throw new Error(`Conflicting reasoning verification for ${definition.id}`)
  }

  const reasoningContentChars =
    typeof message?.reasoning_content === 'string'
      ? message.reasoning_content.length
      : 0
  const rawReasoningTokens =
    record.usage?.completion_tokens_details?.reasoning_tokens
  const reasoningTokens =
    typeof rawReasoningTokens === 'number' ? rawReasoningTokens : null

  if (
    definition.verifyReasoningDisabled &&
    (reasoningContentChars > 0 ||
      (reasoningTokens !== 0 &&
        !(
          reasoningTokens == null &&
          definition.allowMissingReasoningTokensWhenDisabled
        )))
  ) {
    throw new Error(
      `Reasoning-disable verification failed for ${definition.id}: ` +
        `reasoning_content=${reasoningContentChars} chars, ` +
        `reasoning_tokens=${reasoningTokens ?? 'missing'}`,
    )
  }

  if (
    definition.verifyReasoningEnabled &&
    reasoningContentChars === 0 &&
    (reasoningTokens == null || reasoningTokens <= 0)
  ) {
    throw new Error(
      `Reasoning-enable verification failed for ${definition.id}: ` +
        `reasoning_content=${reasoningContentChars} chars, ` +
        `reasoning_tokens=${reasoningTokens ?? 'missing'}`,
    )
  }

  const thinkingOffRequest = definition.thinkingOffRequest
  const thinkingOnRequest = definition.thinkingOnRequest
  return {
    ...completionBase,
    reasoningVerification: {
      enableThinkingFalse:
        thinkingOffRequest === 'both' ||
        thinkingOffRequest === 'enable-thinking-false',
      enableThinkingTrue:
        thinkingOnRequest === 'both' ||
        thinkingOnRequest === 'enable-thinking-true',
      nativeThinkingDisabled:
        thinkingOffRequest === 'both' ||
        thinkingOffRequest === 'native-thinking-disabled',
      nativeThinkingEnabled:
        thinkingOnRequest === 'both' ||
        thinkingOnRequest === 'native-thinking-enabled',
      reasoningContentChars,
      ...(definition.allowMissingReasoningTokensWhenDisabled &&
      reasoningTokens == null
        ? { reasoningTokensOmittedAllowed: true as const }
        : {}),
      reasoningTokens,
      ...(definition.verifyReasoningDisabled ? { verifiedOff: true } : {}),
      ...(definition.verifyReasoningEnabled ? { verifiedOn: true } : {}),
    },
  }
}

function extractAnthropicContent(payload: unknown): BenchJudgeCompletion {
  const record = payload as {
    content?: Array<{ text?: unknown; type?: string }>
  }
  const content =
    record.content
      ?.map((block) => (typeof block.text === 'string' ? block.text : ''))
      .join('')
      .trim() ?? ''

  if (!content) {
    throw new Error('Anthropic experimental judge response was empty')
  }

  return {
    cacheUsage: null,
    content,
    providerCreatedAt: null,
    providerResponseId: null,
    reasoningVerification: null,
    requestProvenance: null,
  }
}

function configuredEffort(
  definition: BenchJudgeModelDefinitionRecord,
): 'high' | 'max' | null {
  if (
    'reasoningEffort' in definition &&
    (definition.reasoningEffort === 'high' ||
      definition.reasoningEffort === 'max')
  ) {
    return definition.reasoningEffort
  }
  if (!('effort' in definition)) {
    return null
  }
  return definition.effort === 'high' || definition.effort === 'max'
    ? definition.effort
    : null
}

function directJudgeThinkingMode(params: {
  definition: BenchJudgeModelDefinitionRecord
  requested: BenchJudgeThinkingMode
}): ChatCompletionThinkingMode {
  if (params.requested === 'provider-default') {
    return 'provider-default'
  }

  if (
    params.definition.provider === 'zhipu' ||
    params.definition.provider === 'dashscope' ||
    params.definition.provider === 'moonshot' ||
    params.definition.provider === 'siliconflow'
  ) {
    return 'enabled'
  }

  if (
    configuredEffort(params.definition) != null ||
    params.definition.provider === 'minimax'
  ) {
    return 'provider-default'
  }

  throw new Error(
    `Thinking-on benchmark mode is not implemented for ${params.definition.provider}/${params.definition.id}`,
  )
}

export function completionFromCapture(params: {
  capture: ChatCompletionCapture
  definition: BenchJudgeModelDefinitionRecord
  requestedThinkingMode: BenchJudgeThinkingMode
}): BenchJudgeCompletion {
  const effort = configuredEffort(params.definition)
  const reasoningTokens = params.capture.tokenUsage.reasoningTokens
  const reasoningObserved =
    params.capture.reasoningContentChars > 0 ||
    (reasoningTokens != null && reasoningTokens > 0)
  const thinkingControl = params.capture.thinkingRequestControl
  const nativeThinkingEnabled =
    isRecord(thinkingControl?.thinking) &&
    thinkingControl.thinking.type === 'enabled'
  const enableThinkingTrue = thinkingControl?.enable_thinking === true
  const allowMissingReasoning =
    'allowMissingReasoningWhenEnabled' in params.definition &&
    params.definition.allowMissingReasoningWhenEnabled === true

  if (
    params.requestedThinkingMode === 'enabled' &&
    !reasoningObserved &&
    (!allowMissingReasoning || (!nativeThinkingEnabled && !enableThinkingTrue))
  ) {
    throw new Error(
      `Reasoning-enable verification failed for ${params.definition.id}: ` +
        `reasoning_content=${params.capture.reasoningContentChars} chars, ` +
        `reasoning_tokens=${reasoningTokens ?? 'missing'}`,
    )
  }

  return {
    cacheUsage: {
      cachedPromptTokens: params.capture.tokenUsage.cachedTokens,
      promptCacheHitTokens: params.capture.tokenUsage.cachedTokens,
      promptCacheMissTokens: null,
      promptTokens: params.capture.tokenUsage.promptTokens,
    },
    content: params.capture.content,
    providerCreatedAt: params.capture.providerCreatedAt,
    providerResponseId: params.capture.providerResponseId,
    reasoningVerification:
      params.requestedThinkingMode === 'enabled'
        ? {
            effort: effort ?? undefined,
            enableThinkingFalse: false,
            enableThinkingTrue,
            nativeThinkingDisabled: false,
            nativeThinkingEnabled,
            reasoningContentChars: params.capture.reasoningContentChars,
            reasoningTokens,
            ...(reasoningObserved
              ? { verifiedOn: true as const }
              : {
                  reasoningSkippedByModelAllowed: true as const,
                  requestControlVerifiedOn: true as const,
                }),
          }
        : null,
    requestProvenance: {
      apiModel: params.capture.apiModel,
      configuredEffort: effort,
      provider: params.capture.provider,
      reasoningContentChars: params.capture.reasoningContentChars,
      reasoningTokens,
      thinkingMode: params.capture.thinkingMode,
      thinkingRequestControl: params.capture.thinkingRequestControl,
    },
  }
}

async function callExperimentalOpenAICompatibleJudge(params: {
  definition: BenchJudgeModelDefinition
  messages: BenchChatMessage[]
  signal?: AbortSignal
  systemPrompt: string
  temperature: number
}) {
  const thinkingOffRequest = params.definition.thinkingOffRequest
  const thinkingOnRequest = params.definition.thinkingOnRequest
  const body = {
    ...(params.definition.thinking === 'disabled' ||
    thinkingOffRequest === 'both' ||
    thinkingOffRequest === 'enable-thinking-false'
      ? { enable_thinking: false }
      : {}),
    ...(thinkingOnRequest === 'both' ||
    thinkingOnRequest === 'enable-thinking-true'
      ? { enable_thinking: true }
      : {}),
    ...(thinkingOffRequest === 'both' ||
    thinkingOffRequest === 'native-thinking-disabled'
      ? { thinking: { type: 'disabled' } }
      : {}),
    ...(thinkingOnRequest === 'both' ||
    thinkingOnRequest === 'native-thinking-enabled'
      ? { thinking: { type: 'enabled' } }
      : {}),
    messages: [
      { content: params.systemPrompt, role: 'system' },
      ...params.messages,
    ],
    model: params.definition.apiModel,
    response_format: supportsBenchJsonMode(params.definition)
      ? { type: 'json_object' }
      : undefined,
    temperature: params.temperature,
  }
  const response = await fetch(
    endpointUrl(
      providerBaseUrl(params.definition.provider),
      '/chat/completions',
    ),
    {
      body: JSON.stringify(body),
      headers: {
        authorization: `Bearer ${providerApiKey(params.definition.provider)}`,
        'content-type': 'application/json',
      },
      method: 'POST',
      signal: params.signal,
    },
  )
  return extractOpenAICompatibleContent(
    await parseResponseJson(response, params.definition.provider),
    params.definition,
  )
}

async function callExperimentalAnthropicJudge(params: {
  definition: BenchJudgeModelDefinition
  messages: BenchChatMessage[]
  signal?: AbortSignal
  systemPrompt: string
  temperature: number
}) {
  const response = await fetch(
    endpointUrl(ANTHROPIC_BASE_URL, '/v1/messages'),
    {
      body: JSON.stringify({
        max_tokens: Number.isFinite(ANTHROPIC_MAX_TOKENS)
          ? Math.max(1, ANTHROPIC_MAX_TOKENS)
          : 4096,
        messages: params.messages,
        model: params.definition.apiModel,
        system: params.systemPrompt,
        temperature: params.temperature,
      }),
      headers: {
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
        'x-api-key': providerApiKey('anthropic'),
      },
      method: 'POST',
      signal: params.signal,
    },
  )

  return extractAnthropicContent(await parseResponseJson(response, 'anthropic'))
}

async function runBenchJudgeCompletion(params: {
  messages: BenchChatMessage[]
  model: BenchJudgeModelId
  signal?: AbortSignal
  systemPrompt: string
  temperature: number
  thinkingMode: BenchJudgeThinkingMode
  trace: Parameters<typeof chatCompletion>[0]['trace']
}) {
  const experimentalDefinition = getExperimentalBenchJudgeModel(params.model)

  if (!experimentalDefinition) {
    if (!validateEvaluationModel(params.model)) {
      throw new Error(
        `Missing benchmark judge model definition: ${params.model}`,
      )
    }
    const definition = getBenchJudgeModelDefinition(params.model)
    const thinkingMode = directJudgeThinkingMode({
      definition,
      requested: params.thinkingMode,
    })
    let capture: ChatCompletionCapture | null = null
    const content = await chatCompletion({
      capture: (value) => {
        capture = value
      },
      jsonMode: supportsBenchJsonMode(definition),
      messages: params.messages,
      model: params.model,
      signal: params.signal,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature,
      thinkingMode,
      trace: params.trace,
    })
    if (!capture) {
      throw new Error(`Missing completion capture for ${params.model}`)
    }
    if (capture.content !== content) {
      throw new Error(`Completion capture mismatch for ${params.model}`)
    }
    return completionFromCapture({
      capture,
      definition,
      requestedThinkingMode: params.thinkingMode,
    })
  }

  if (experimentalDefinition.baseModel) {
    if (
      experimentalDefinition.reasoningEffort &&
      params.thinkingMode !== 'enabled'
    ) {
      throw new Error(
        `${experimentalDefinition.id} requires --judge-thinking enabled`,
      )
    }

    let capture: ChatCompletionCapture | null = null
    const content = await chatCompletion({
      capture: (value) => {
        capture = value
      },
      jsonMode: supportsBenchJsonMode(experimentalDefinition),
      messages: params.messages,
      model: experimentalDefinition.baseModel,
      reasoningEffort: experimentalDefinition.reasoningEffort,
      signal: params.signal,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature,
      thinkingMode: directJudgeThinkingMode({
        definition: experimentalDefinition,
        requested: params.thinkingMode,
      }),
      trace: params.trace,
    })
    if (!capture) {
      throw new Error(`Missing completion capture for ${params.model}`)
    }
    if (capture.content !== content) {
      throw new Error(`Completion capture mismatch for ${params.model}`)
    }
    return completionFromCapture({
      capture,
      definition: experimentalDefinition,
      requestedThinkingMode: params.thinkingMode,
    })
  }

  if (
    params.thinkingMode === 'enabled' &&
    !experimentalDefinition.verifyReasoningEnabled
  ) {
    throw new Error(
      `Experimental judge ${params.model} does not verify thinking-on mode`,
    )
  }

  if (experimentalDefinition.provider === 'anthropic') {
    return callExperimentalAnthropicJudge({
      definition: experimentalDefinition,
      messages: params.messages,
      signal: params.signal,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature,
    })
  }

  return callExperimentalOpenAICompatibleJudge({
    definition: experimentalDefinition,
    messages: params.messages,
    signal: params.signal,
    systemPrompt: params.systemPrompt,
    temperature: params.temperature,
  })
}

function prepareJudgeReplayPrompt(params: {
  history: HistoryResult
  judgeModel: BenchJudgeModelId
  scenario: ScenarioRecord
}) {
  const scenario = scenarioForJob(
    params.scenario,
    params.history,
    params.judgeModel,
  )
  const debate = formatDebateTranscriptForJudge(
    scenario,
    params.history.assignment,
    params.history.transcript,
  )
  const judgePrompt = buildJudgePrompt(scenario, params.history.assignment, {
    debate,
    examinationA: buildExaminationSummary(scenario.roleAName, []),
    examinationB: buildExaminationSummary(scenario.roleBName, []),
  })

  return { judgePrompt, scenario }
}

async function runJudgeJob(params: {
  cachePhase: PromptCachePhase
  history: HistoryResult
  jobTimeoutMs: number
  judgeModel: BenchJudgeModelId
  judgePromptCandidateId: string | null
  judgeThinkingMode: BenchJudgeThinkingMode
  llmCallTimeoutMs: number
  repeatIndex: number
  runId: string
  scenario: ScenarioRecord
}) {
  const startedAt = Date.now()
  const abortController = new AbortController()
  const timeout = setTimeout(() => {
    abortController.abort(
      `Benchmark judge job timed out after ${params.jobTimeoutMs}ms`,
    )
  }, params.jobTimeoutMs)
  const { judgePrompt, scenario } = prepareJudgeReplayPrompt(params)
  const id = [
    params.history.jobId,
    `judge-${params.judgeModel}`,
    `repeat-${params.repeatIndex}`,
  ].join('__')

  try {
    const completion = await withRetry(
      (attempt, signal) =>
        runBenchJudgeCompletion({
          messages: [{ role: 'user', content: '请做出你的裁决。' }],
          model: params.judgeModel,
          signal,
          systemPrompt: judgePrompt,
          temperature: 0,
          thinkingMode: params.judgeThinkingMode,
          trace: {
            attempt,
            benchmarkCaseId: id,
            benchmarkName: BENCHMARK_NAME,
            benchmarkRunId: params.runId,
            judgePromptCandidateId: params.judgePromptCandidateId ?? undefined,
            phase: 'judgment',
            scenarioId: scenario.id,
            side: 'judge',
            turnIndex: null,
          },
        }),
      abortController.signal,
      params.llmCallTimeoutMs,
    )
    const rawOutput = completion.content
    const parsedPolicy = parseJudgePolicy(rawOutput, params.history)
    let diagnosticNoExaminationScore: ProgrammaticScoreResult | null = null

    try {
      diagnosticNoExaminationScore = computeProgrammaticScore({
        assignment: params.history.assignment,
        examinationA: [],
        examinationB: [],
        judgeOutput: rawOutput,
        scenario,
      })
    } catch (error) {
      parsedPolicy.parseError = [
        parsedPolicy.parseError,
        `Programmatic score failed: ${error instanceof Error ? error.message : String(error)}`,
      ]
        .filter(Boolean)
        .join('; ')
    }

    clearTimeout(timeout)
    return {
      cachePhase: params.cachePhase,
      cacheUsage: completion.cacheUsage,
      caseId: params.history.caseId,
      diagnosticNoExaminationScore,
      durationMs: Date.now() - startedAt,
      error: null,
      generatedAt: new Date().toISOString(),
      historyJobId: params.history.jobId,
      id,
      judgeModel: params.judgeModel,
      judgePromptChars: judgePrompt.length,
      judgePromptHash: sha256(judgePrompt),
      pairId: params.history.pairId,
      parsedPolicy,
      providerCreatedAt: completion.providerCreatedAt,
      providerResponseId: completion.providerResponseId,
      rawOutput,
      reasoningVerification: completion.reasoningVerification,
      requestProvenance: completion.requestProvenance,
      repeatIndex: params.repeatIndex,
      roleAName: params.history.roleAName,
      roleBName: params.history.roleBName,
      scenarioId: params.history.scenarioId,
      status: 'ok',
      variedLevel: params.history.variedLevel,
      variedSide: params.history.variedSide,
    } satisfies JudgeResult
  } catch (error) {
    clearTimeout(timeout)
    return {
      cachePhase: params.cachePhase,
      cacheUsage: null,
      caseId: params.history.caseId,
      diagnosticNoExaminationScore: null,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      generatedAt: new Date().toISOString(),
      historyJobId: params.history.jobId,
      id,
      judgeModel: params.judgeModel,
      judgePromptChars: judgePrompt.length,
      judgePromptHash: sha256(judgePrompt),
      pairId: params.history.pairId,
      parsedPolicy: {
        judgment: null,
        judgments: {},
        parseError: null,
        policyWinner: 'unknown',
        requests: {},
      },
      providerCreatedAt: null,
      providerResponseId: null,
      rawOutput: null,
      reasoningVerification: null,
      requestProvenance: null,
      repeatIndex: params.repeatIndex,
      roleAName: params.history.roleAName,
      roleBName: params.history.roleBName,
      scenarioId: params.history.scenarioId,
      status: 'error',
      variedLevel: params.history.variedLevel,
      variedSide: params.history.variedSide,
    } satisfies JudgeResult
  }
}

async function buildRunState(
  command: Command,
  options: Record<string, string | true>,
) {
  const scenarioIds = parseScenarioIds(
    getStringOption(options, 'scenario', 'all'),
  )
  const playerModel = getStringOption(
    options,
    'agent-model',
    DEFAULT_PLAYER_MODEL,
  )
  if (!validateSubmissionModel(playerModel)) {
    throw new Error(`Invalid --agent-model: ${playerModel}`)
  }

  const caseFilters = parseTrolleyCaseFilters(options)
  if (caseFilters && !scenarioIds.includes(TROLLEY_SCENARIO_ID)) {
    throw new Error('--cases requires the trolley-problem scenario')
  }
  const trolleyJudgePromptPath = getStringOption(
    options,
    'trolley-judge-prompt',
  )
  if (trolleyJudgePromptPath && !scenarioIds.includes(TROLLEY_SCENARIO_ID)) {
    throw new Error(
      '--trolley-judge-prompt requires the trolley-problem scenario',
    )
  }
  const rawGlmReasoningEfforts = getStringOption(
    options,
    'glm-reasoning-efforts',
  )
  if (rawGlmReasoningEfforts && !getStringOption(options, 'judge-models')) {
    throw new Error(
      '--glm-reasoning-efforts requires an explicit --judge-models glm-5.2',
    )
  }
  const glmReasoningEfforts = rawGlmReasoningEfforts
    ? parseGlmReasoningEfforts(rawGlmReasoningEfforts)
    : null
  const requestedJudgeModels = parseJudgeModels(
    getStringOption(options, 'judge-models', DEFAULT_JUDGE_MODELS.join(',')),
  )
  const judgeModels = expandGlmReasoningEffortModels(
    requestedJudgeModels,
    glmReasoningEfforts,
  )
  const judgeThinkingMode = parseBenchJudgeThinkingMode(
    getStringOption(options, 'judge-thinking', 'provider-default'),
  )
  assertCompatibleThinkingMode(judgeModels, judgeThinkingMode)
  const outputDir = getStringOption(
    options,
    'output-dir',
    join(
      DEFAULT_RUNS_ROOT,
      scenarioRunFolder(scenarioIds),
      `judge-sensitivity-${timestampSlug()}`,
    ),
  )
  const runId = getStringOption(options, 'run-id', randomUUID())
  const promptSourcePath = getStringOption(
    options,
    'prompt-source',
    DEFAULT_SCRATCHPAD_PROMPT,
  )
  const planPath = getStringOption(options, 'plan-path', DEFAULT_PLAN)
  const honnojiSamplesPath = getStringOption(
    options,
    'honnoji-samples',
    DEFAULT_HONNOJI_SELECTED_SAMPLES,
  )
  const trolleySamplesPath = getStringOption(
    options,
    'trolley-samples',
    DEFAULT_TROLLEY_SELECTED_SAMPLES,
  )
  const concurrency = parsePositiveInteger(
    getStringOption(
      options,
      'concurrency',
      String(DEFAULT_HISTORY_CONCURRENCY),
    ),
    '--concurrency',
  )
  const judgeConcurrency = parsePositiveInteger(
    getStringOption(
      options,
      'judge-concurrency',
      String(DEFAULT_JUDGE_CONCURRENCY),
    ),
    '--judge-concurrency',
  )
  const judgeRepeats = parsePositiveInteger(
    getStringOption(options, 'judge-repeats', String(DEFAULT_JUDGE_REPEATS)),
    '--judge-repeats',
  )
  const jobTimeoutMs = parsePositiveInteger(
    getStringOption(options, 'job-timeout-ms', '900000'),
    '--job-timeout-ms',
  )
  const llmCallTimeoutMs = parsePositiveInteger(
    getStringOption(
      options,
      'llm-call-timeout-ms',
      String(DEFAULT_LLM_CALL_TIMEOUT_MS),
    ),
    '--llm-call-timeout-ms',
  )
  const levels = parsePromptLevels(
    getStringOption(options, 'levels', '1,2,3,4'),
  )
  const dbPath = getStringOption(options, 'db')
  const apiBaseUrl = getStringOption(
    options,
    'api-url',
    dbPath ? '' : (process.env.AXIIA_API_URL ?? ''),
  )
  const authToken = getStringOption(
    options,
    'auth-token',
    process.env.AXIIA_AUTH_TOKEN ?? '',
  )
  const { scenarios, source } = await loadScenarios({
    apiUrl: apiBaseUrl,
    authToken,
    dbPath,
    scenarioIds,
  })
  const sourceNote = getStringOption(options, 'source-note')
  const scenarioSource: BenchmarkRunConfig['scenarioSource'] = sourceNote
    ? { ...source, note: sourceNote }
    : source

  const selectedSamplePaths = {
    honnoji: honnojiSamplesPath,
    trolley: trolleySamplesPath,
  }
  const { jobs, promptLevels } = await buildBenchmarkDesign({
    caseFilters,
    levels,
    pairFilter: getStringOption(options, 'pair') || null,
    promptSourcePath,
    scenarios,
    selectedSamplePaths,
  })
  const scenarioSnapshots = Object.fromEntries(
    Object.entries(scenarios).map(([scenarioId, scenario]) => [
      scenarioId,
      scenarioWithHashes(scenario),
    ]),
  )
  let trolleyJudgePromptOverride: TrolleyJudgePromptOverrideMetadata | undefined
  if (trolleyJudgePromptPath) {
    const trolleySnapshot = scenarioSnapshots[TROLLEY_SCENARIO_ID]
    if (!trolleySnapshot) {
      throw new Error(
        `Trolley judge prompt override requires ${TROLLEY_SCENARIO_ID} in scenario snapshots`,
      )
    }
    const applied = applyTrolleyJudgePromptOverride({
      override: await loadTrolleyJudgePromptOverride(trolleyJudgePromptPath),
      snapshot: trolleySnapshot,
    })
    scenarioSnapshots[TROLLEY_SCENARIO_ID] = applied.snapshot
    scenarios[TROLLEY_SCENARIO_ID] = scenarioRecordFromSnapshot(
      applied.snapshot,
    )
    trolleyJudgePromptOverride = applied.metadata
  }

  const config: BenchmarkRunConfig = {
    benchmarkName: BENCHMARK_NAME,
    caseFilter: caseFilters?.length === 1 ? caseFilters[0]! : null,
    caseFilters,
    command,
    concurrency,
    dryRun: options['dry-run'] === true,
    git: getGitState(),
    historyCountExpected: jobs.length,
    historyExecutionCountExpected: jobs.filter((job) => !job.reusedFromJobId)
      .length,
    jobTimeoutMs,
    judgeCaseFilters: caseFilters,
    judgeConcurrency,
    judgeModels,
    judgeModelDefinitions: assertJudgeModelDefinitions(judgeModels),
    judgeRepeats,
    judgeScenarioIds: scenarioIds,
    judgeThinkingMode,
    glmReasoningEfforts,
    levels,
    llmCallTimeoutMs,
    outputDir,
    pairFilter: getStringOption(options, 'pair') || null,
    persistLlmCalls: options['persist-llm-calls'] === true,
    planPath,
    playerModel,
    playerModelDefinition: getModelDefinition(playerModel),
    promptSourcePath,
    resume: options.resume === true,
    runId,
    runLabel: getStringOption(options, 'run-label') || undefined,
    scenarioIds,
    scenarioSource,
    selectedSamplePaths,
    temperature: 0,
    trolleyJudgePromptOverride,
  }

  return {
    config,
    jobs,
    promptLevels,
    scenarios,
    scenarioSnapshots,
  }
}

async function runPlan(options: Record<string, string | true>) {
  const state = await buildRunState('plan', options)
  await writeRunArtifacts({
    config: state.config,
    histories: [],
    jobs: state.jobs,
    promptLevels: state.promptLevels,
    scenarioSnapshots: state.scenarioSnapshots,
  })

  console.log(
    JSON.stringify(
      {
        executableJobs: state.config.historyExecutionCountExpected,
        historyRows: state.config.historyCountExpected,
        outputDir: state.config.outputDir,
        plannedJudgeCalls:
          state.config.historyCountExpected *
          state.config.judgeModels.length *
          state.config.judgeRepeats,
        scenarioIds: state.config.scenarioIds,
      },
      null,
      2,
    ),
  )
}

async function runHistories(options: Record<string, string | true>) {
  const state = await buildRunState('run-histories', options)
  let histories = state.config.resume
    ? await readExistingHistories(state.config.outputDir)
    : []
  histories = syncReusedHistories(state.jobs, histories)

  const completed = new Set(
    histories
      .filter((history) => history.status === 'ok')
      .map((history) => history.jobId),
  )
  const pendingJobs = state.jobs.filter(
    (job) => !job.reusedFromJobId && !completed.has(job.id),
  )

  await writeRunArtifacts({
    config: state.config,
    histories,
    jobs: state.jobs,
    promptLevels: state.promptLevels,
    scenarioSnapshots: state.scenarioSnapshots,
  })

  console.log(
    JSON.stringify(
      {
        dryRun: state.config.dryRun,
        executableJobs: state.config.historyExecutionCountExpected,
        historyRows: state.config.historyCountExpected,
        outputDir: state.config.outputDir,
        pendingJobs: pendingJobs.length,
        runId: state.config.runId,
        scenarioIds: state.config.scenarioIds,
      },
      null,
      2,
    ),
  )

  if (state.config.dryRun) {
    return
  }

  if (!state.config.persistLlmCalls) {
    process.env.AXIIA_DISABLE_LLM_CALL_PERSISTENCE = '1'
  }

  await workerPool(pendingJobs, state.config.concurrency, async (job) => {
    console.log(`[judge-sensitivity] history ${job.id}`)
    const scenario = state.scenarios[job.scenarioId]
    if (!scenario) {
      throw new Error(`Missing scenario for job ${job.id}: ${job.scenarioId}`)
    }
    const existing = histories.find((history) => history.jobId === job.id)

    const result = await runDialogueJob({
      initialTranscript:
        existing?.status === 'error' && existing.transcript.length > 0
          ? existing.transcript
          : [],
      job,
      jobTimeoutMs: state.config.jobTimeoutMs,
      llmCallTimeoutMs: state.config.llmCallTimeoutMs,
      playerModel: state.config.playerModel,
      promptLevels: state.promptLevels,
      runId: state.config.runId,
      scenario,
    })

    histories = [
      ...histories.filter((history) => history.jobId !== result.jobId),
      result,
    ]
    histories = syncReusedHistories(state.jobs, histories)
    await writeRunArtifacts({
      config: state.config,
      histories,
      jobs: state.jobs,
      promptLevels: state.promptLevels,
      scenarioSnapshots: state.scenarioSnapshots,
    })
    console.log(
      `[judge-sensitivity] -> ${result.status} ${result.jobId} ${result.durationMs}ms ${result.error ?? ''}`.trim(),
    )
  })
}

type JudgeReplayJob = {
  history: HistoryResult
  id: string
  judgeModel: BenchJudgeModelId
  repeatIndex: number
}

type JudgeReplayGroup = {
  id: string
  jobs: JudgeReplayJob[]
}

export function historyMatchesTrolleyCaseFilters(
  history: Pick<HistoryResult, 'caseId' | 'scenarioId'>,
  caseFilters: string[] | null,
) {
  if (!caseFilters) {
    return true
  }

  return (
    history.scenarioId === TROLLEY_SCENARIO_ID &&
    history.caseId != null &&
    caseFilters.includes(history.caseId)
  )
}

export function buildJudgeReplayJobs(params: {
  caseFilters?: string[] | null
  histories: HistoryResult[]
  judgeModels: BenchJudgeModelId[]
  repeats: number
  scenarioIds?: ScenarioId[]
}) {
  const jobs: JudgeReplayJob[] = []

  const scenarioFilter = params.scenarioIds
    ? new Set<ScenarioId>(params.scenarioIds)
    : null

  for (const history of params.histories.filter(
    (item) =>
      item.status === 'ok' &&
      (!scenarioFilter || scenarioFilter.has(item.scenarioId)) &&
      historyMatchesTrolleyCaseFilters(item, params.caseFilters ?? null),
  )) {
    for (const judgeModel of params.judgeModels) {
      for (
        let repeatIndex = 1;
        repeatIndex <= params.repeats;
        repeatIndex += 1
      ) {
        jobs.push({
          history,
          id: [
            history.jobId,
            `judge-${judgeModel}`,
            `repeat-${repeatIndex}`,
          ].join('__'),
          judgeModel,
          repeatIndex,
        })
      }
    }
  }

  return jobs
}

function groupPendingJudgeReplayJobs(jobs: JudgeReplayJob[]) {
  const groups = new Map<string, JudgeReplayGroup>()

  for (const job of jobs) {
    const id = `${job.judgeModel}\u0000${job.history.jobId}`
    const group = groups.get(id) ?? { id, jobs: [] }
    group.jobs.push(job)
    groups.set(id, group)
  }

  for (const group of groups.values()) {
    group.jobs.sort((left, right) => left.repeatIndex - right.repeatIndex)
  }

  return [...groups.values()]
}

async function runJudge(options: Record<string, string | true>) {
  const outputDir = getStringOption(options, 'output-dir')
  if (!outputDir) {
    throw new Error('judge requires --output-dir')
  }

  const config = await readJsonFile<BenchmarkRunConfig>(
    join(outputDir, 'config.json'),
  )
  const historiesArtifact = await readJsonFile<HistoriesArtifact>(
    join(outputDir, 'histories.json'),
  )
  const scenarioSnapshots = await readJsonFile<{
    scenarios: Record<string, ScenarioSnapshot>
  }>(join(outputDir, 'scenario-snapshots.json'))
  const promptLevelArtifact = await readJsonFile<{
    scenarios: PromptLevelsByScenario
  }>(join(outputDir, 'prompt-levels.json'))

  const rawGlmReasoningEfforts = getStringOption(
    options,
    'glm-reasoning-efforts',
  )
  if (rawGlmReasoningEfforts && !getStringOption(options, 'judge-models')) {
    throw new Error(
      '--glm-reasoning-efforts requires an explicit --judge-models glm-5.2',
    )
  }
  const explicitGlmReasoningEfforts = rawGlmReasoningEfforts
    ? parseGlmReasoningEfforts(rawGlmReasoningEfforts)
    : null
  const requestedJudgeModels = parseJudgeModels(
    getStringOption(options, 'judge-models', config.judgeModels.join(',')),
  )
  const judgeModels = expandGlmReasoningEffortModels(
    requestedJudgeModels,
    explicitGlmReasoningEfforts,
  )
  const judgeRepeats = parsePositiveInteger(
    getStringOption(options, 'judge-repeats', String(config.judgeRepeats)),
    '--judge-repeats',
  )
  const judgeConcurrency = parsePositiveInteger(
    getStringOption(
      options,
      'judge-concurrency',
      String(config.judgeConcurrency),
    ),
    '--judge-concurrency',
  )
  const judgeThinkingMode = parseBenchJudgeThinkingMode(
    getStringOption(
      options,
      'judge-thinking',
      config.judgeThinkingMode ?? 'provider-default',
    ),
  )
  assertCompatibleThinkingMode(judgeModels, judgeThinkingMode)
  const jobTimeoutMs = parsePositiveInteger(
    getStringOption(options, 'job-timeout-ms', String(config.jobTimeoutMs)),
    '--job-timeout-ms',
  )
  const llmCallTimeoutMs = parsePositiveInteger(
    getStringOption(
      options,
      'llm-call-timeout-ms',
      String(config.llmCallTimeoutMs ?? DEFAULT_LLM_CALL_TIMEOUT_MS),
    ),
    '--llm-call-timeout-ms',
  )
  const dryRun = options['dry-run'] === true
  const scenarioIds = getStringOption(options, 'scenario')
    ? parseScenarioIds(getStringOption(options, 'scenario'))
    : undefined
  const judgeScenarioIds =
    scenarioIds ?? config.judgeScenarioIds ?? config.scenarioIds
  const explicitJudgeCaseFilters = parseTrolleyCaseFilters(options)
  const judgeCaseFilters =
    explicitJudgeCaseFilters ??
    config.judgeCaseFilters ??
    configuredHistoryCaseFilters(config)
  if (judgeCaseFilters && !judgeScenarioIds.includes(TROLLEY_SCENARIO_ID)) {
    throw new Error('--cases requires the trolley-problem scenario')
  }
  const judgePromptPatchPath = getStringOption(options, 'judge-prompt-patch')
  let judgePromptPatch = config.judgePromptPatch

  if (judgePromptPatchPath) {
    const loadedPatch = await loadJudgePromptPatch(judgePromptPatchPath)
    const shangyangSnapshot = scenarioSnapshots.scenarios[SHANGYANG_SCENARIO_ID]
    if (!shangyangSnapshot) {
      throw new Error(
        `Judge prompt patch requires ${SHANGYANG_SCENARIO_ID} in scenario snapshots`,
      )
    }

    if (judgePromptPatch) {
      if (judgePromptPatch.sourceHash !== loadedPatch.sourceHash) {
        throw new Error(
          'Judge prompt patch source changed since this run was prepared',
        )
      }
      if (
        shangyangSnapshot.judgePromptHash !==
        judgePromptPatch.patchedJudgePromptHash
      ) {
        throw new Error(
          'Patched Shangyang prompt hash no longer matches the run config',
        )
      }
    } else {
      const patched = applyShangyangJudgePromptPatch({
        patch: loadedPatch,
        snapshot: shangyangSnapshot,
      })
      scenarioSnapshots.scenarios[SHANGYANG_SCENARIO_ID] = patched.snapshot
      judgePromptPatch = patched.metadata
    }
  }
  const trolleyJudgePromptPath = getStringOption(
    options,
    'trolley-judge-prompt',
    config.trolleyJudgePromptOverride?.sourcePath ?? '',
  )
  let trolleyJudgePromptOverride = config.trolleyJudgePromptOverride

  if (trolleyJudgePromptPath) {
    if (!judgeScenarioIds.includes(TROLLEY_SCENARIO_ID)) {
      throw new Error(
        '--trolley-judge-prompt requires the trolley-problem scenario',
      )
    }
    const loadedOverride = await loadTrolleyJudgePromptOverride(
      trolleyJudgePromptPath,
    )
    const trolleySnapshot = scenarioSnapshots.scenarios[TROLLEY_SCENARIO_ID]
    if (!trolleySnapshot) {
      throw new Error(
        `Trolley judge prompt override requires ${TROLLEY_SCENARIO_ID} in scenario snapshots`,
      )
    }

    if (trolleyJudgePromptOverride) {
      if (
        trolleyJudgePromptOverride.sourceHash !== loadedOverride.sourceHash ||
        trolleyJudgePromptOverride.overrideJudgePromptHash !==
          loadedOverride.sourceHash ||
        trolleyJudgePromptOverride.candidateId !== loadedOverride.candidateId ||
        trolleyJudgePromptOverride.parentCandidateId !==
          loadedOverride.parentCandidateId
      ) {
        throw new Error(
          'Trolley judge prompt source or candidate lineage changed since this run was prepared',
        )
      }
      if (
        trolleySnapshot.judgePromptHash !==
        trolleyJudgePromptOverride.overrideJudgePromptHash
      ) {
        throw new Error(
          'Active Trolley judge prompt hash no longer matches the run config',
        )
      }
    } else {
      const applied = applyTrolleyJudgePromptOverride({
        override: loadedOverride,
        snapshot: trolleySnapshot,
      })
      scenarioSnapshots.scenarios[TROLLEY_SCENARIO_ID] = applied.snapshot
      trolleyJudgePromptOverride = applied.metadata
    }
  }
  let judgeResults = config.resume
    ? await readExistingJudgeResults(outputDir)
    : await readExistingJudgeResults(outputDir)

  const replayJobs = buildJudgeReplayJobs({
    caseFilters: judgeCaseFilters,
    histories: historiesArtifact.histories,
    judgeModels,
    repeats: judgeRepeats,
    scenarioIds: judgeScenarioIds,
  })
  const activeJudgePromptHashes = new Map(
    replayJobs.map((job) => {
      const scenario = scenarioSnapshots.scenarios[job.history.scenarioId]
      if (!scenario) {
        throw new Error(`Missing scenario snapshot: ${job.history.scenarioId}`)
      }
      return [
        job.id,
        sha256(
          prepareJudgeReplayPrompt({
            history: job.history,
            judgeModel: job.judgeModel,
            scenario,
          }).judgePrompt,
        ),
      ] as const
    }),
  )
  const completed = new Set(
    judgeResults
      .filter(
        (result) =>
          result.status === 'ok' &&
          !result.parsedPolicy.parseError &&
          result.judgePromptHash === activeJudgePromptHashes.get(result.id),
      )
      .map((result) => result.id),
  )
  const pendingJobs = replayJobs.filter((job) => !completed.has(job.id))
  const pendingJobGroups = groupPendingJudgeReplayJobs(pendingJobs)

  const judgeConfig: BenchmarkRunConfig = {
    ...config,
    command: 'judge',
    dryRun,
    git: getGitState(),
    judgeCacheStrategy: 'warm-first-per-model-history',
    judgeCaseFilters,
    judgeConcurrency,
    judgeModels,
    judgeModelDefinitions: assertJudgeModelDefinitions(judgeModels),
    judgePromptPatch,
    judgeRepeats,
    judgeScenarioIds,
    judgeThinkingMode,
    glmReasoningEfforts:
      explicitGlmReasoningEfforts ?? config.glmReasoningEfforts ?? null,
    jobTimeoutMs,
    llmCallTimeoutMs,
    outputDir,
    runId: getStringOption(options, 'run-id', config.runId),
    runLabel: getStringOption(options, 'run-label', config.runLabel ?? ''),
    trolleyJudgePromptOverride,
  }

  await writeRunArtifacts({
    config: judgeConfig,
    histories: historiesArtifact.histories,
    jobs: historiesArtifact.histories.map(historyToSyntheticJob),
    judgeResults,
    judgeResultsDryRun: dryRun,
    promptLevels: promptLevelArtifact.scenarios,
    scenarioSnapshots: scenarioSnapshots.scenarios,
  })

  console.log(
    JSON.stringify(
      {
        dryRun,
        outputDir,
        pendingCacheGroups: pendingJobGroups.length,
        pendingJobs: pendingJobs.length,
        plannedJobs: replayJobs.length,
        selectedCases: judgeCaseFilters,
        scenarioIds: judgeScenarioIds,
      },
      null,
      2,
    ),
  )

  if (dryRun) {
    return
  }

  if (!judgeConfig.persistLlmCalls) {
    process.env.AXIIA_DISABLE_LLM_CALL_PERSISTENCE = '1'
  }

  let artifactWriteQueue = Promise.resolve()

  await workerPool(pendingJobGroups, judgeConcurrency, async (group) => {
    const firstJob = group.jobs[0]!
    const scenario = scenarioSnapshots.scenarios[firstJob.history.scenarioId]
    if (!scenario) {
      throw new Error(
        `Missing scenario snapshot: ${firstJob.history.scenarioId}`,
      )
    }

    for (const [groupIndex, job] of group.jobs.entries()) {
      const cachePhase: PromptCachePhase =
        groupIndex === 0 ? 'warmup' : 'replay'
      console.log(
        `[judge-sensitivity] judge ${job.id} cache-phase=${cachePhase}`,
      )
      const result = await runJudgeJob({
        cachePhase,
        history: job.history,
        jobTimeoutMs: judgeConfig.jobTimeoutMs,
        judgeModel: job.judgeModel,
        judgePromptCandidateId:
          job.history.scenarioId === TROLLEY_SCENARIO_ID
            ? (judgeConfig.trolleyJudgePromptOverride?.candidateId ?? null)
            : null,
        judgeThinkingMode: judgeConfig.judgeThinkingMode ?? 'provider-default',
        llmCallTimeoutMs: judgeConfig.llmCallTimeoutMs,
        repeatIndex: job.repeatIndex,
        runId: judgeConfig.runId,
        scenario,
      })

      if (result.status === 'ok') {
        const definition = getExperimentalBenchJudgeModel(result.judgeModel)
        if (
          definition?.provider === 'siliconflow' &&
          !result.providerResponseId
        ) {
          throw new Error(
            `SiliconFlow response omitted its provider response ID: ${result.id}`,
          )
        }
        const duplicateResponse = result.providerResponseId
          ? judgeResults.find(
              (item) =>
                item.id !== result.id &&
                item.providerResponseId === result.providerResponseId,
            )
          : null
        if (duplicateResponse) {
          throw new Error(
            `Possible response-cache reuse: provider response ID ${result.providerResponseId} was returned for both ${duplicateResponse.id} and ${result.id}`,
          )
        }
      }

      judgeResults = [
        ...judgeResults.filter((item) => item.id !== result.id),
        result,
      ]
      const judgeResultsSnapshot = judgeResults
      artifactWriteQueue = artifactWriteQueue.then(() =>
        writeRunArtifacts({
          config: judgeConfig,
          histories: historiesArtifact.histories,
          jobs: historiesArtifact.histories.map(historyToSyntheticJob),
          judgeResults: judgeResultsSnapshot,
          judgeResultsDryRun: false,
          promptLevels: promptLevelArtifact.scenarios,
          scenarioSnapshots: scenarioSnapshots.scenarios,
        }),
      )
      await artifactWriteQueue
      const cacheUsage = result.cacheUsage
      console.log(
        `[judge-sensitivity] -> ${result.status} ${result.id} ${result.durationMs}ms cache-hit=${cacheUsage?.promptCacheHitTokens ?? 'unreported'} cache-miss=${cacheUsage?.promptCacheMissTokens ?? 'unreported'} response-id=${result.providerResponseId ?? 'unreported'} ${result.error ?? result.parsedPolicy.parseError ?? ''}`.trim(),
      )
    }
  })
}

function historyToSyntheticJob(history: HistoryResult): HistoryJob {
  return {
    assignment: history.assignment,
    baselineLevel: history.baselineLevel,
    baselineSide: history.baselineSide,
    caseId: history.caseId,
    caseTitle: history.caseTitle,
    id: history.jobId,
    levelA: history.levelA,
    levelB: history.levelB,
    pairId: history.pairId,
    reusedFromJobId: history.reusedFromJobId,
    roleAKey: history.roleAKey,
    roleAName: history.roleAName,
    roleARequests: history.roleARequests,
    roleBKey: history.roleBKey,
    roleBName: history.roleBName,
    roleBRequests: history.roleBRequests,
    scenarioId: history.scenarioId,
    variedLevel: history.variedLevel,
    variedSide: history.variedSide,
  }
}

async function runReport(options: Record<string, string | true>) {
  const outputDir = getStringOption(options, 'output-dir')

  if (!outputDir) {
    throw new Error('report requires --output-dir')
  }

  const config = await readJsonFile<BenchmarkRunConfig>(
    join(outputDir, 'config.json'),
  )
  const historiesArtifact = await readJsonFile<HistoriesArtifact>(
    join(outputDir, 'histories.json'),
  )
  const scenarioSnapshots = await readJsonFile<{
    scenarios: Record<string, ScenarioSnapshot>
  }>(join(outputDir, 'scenario-snapshots.json'))
  const promptLevelArtifact = await readJsonFile<{
    scenarios: PromptLevelsByScenario
  }>(join(outputDir, 'prompt-levels.json'))
  const judgeResults = await readExistingJudgeResults(outputDir)

  await writeRunArtifacts({
    config,
    histories: historiesArtifact.histories,
    jobs: historiesArtifact.histories.map(historyToSyntheticJob),
    judgeResults,
    judgeResultsDryRun: judgeResults.length === 0,
    promptLevels: promptLevelArtifact.scenarios,
    scenarioSnapshots: scenarioSnapshots.scenarios,
  })

  console.log(
    JSON.stringify(
      {
        histories: historiesArtifact.histories.length,
        output: join(outputDir, 'summary.md'),
        summary: historiesArtifact.summary,
      },
      null,
      2,
    ),
  )
}

async function main() {
  const { command, options } = parseArgs()

  if (command === 'plan') {
    await runPlan(options)
    return
  }

  if (command === 'run-histories') {
    await runHistories(options)
    return
  }

  if (command === 'judge') {
    await runJudge(options)
    return
  }

  await runReport(options)
}

if (import.meta.main) {
  try {
    await main()
  } finally {
    await shutdownLangfuseTracing().catch((error) => {
      console.error('[judge-sensitivity] Langfuse shutdown failed', error)
    })
  }
}
