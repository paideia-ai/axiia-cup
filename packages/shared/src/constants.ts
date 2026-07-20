export const submissionModelIds = [
  'deepseek-v3.2',
  'kimi-k2.5',
  'qwen3.5-397b-a17b',
  'deepseek-v4-pro',
  'kimi-k2.6',
  'qwen3.6-27b',
  'minimax-m2.5',
  'minimax-m3',
  'glm-5.1',
  'glm-5.2',
  'deepseek-v4-flash',
] as const

export const playerSelectableModelIds = [
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'kimi-k2.6',
  'qwen3.6-27b',
  'minimax-m3',
  'glm-5.2',
] as const

export const retiredModelIds = [] as const

export const evaluationOnlyModelIds = [
  'gpt-4.1',
  'gpt-5.4',
  'gpt-5.4-mini',
  'claude-sonnet-4',
  'claude-sonnet-4-5',
  'claude-opus-4-5',
  'claude-opus-4-6',
  'qwen3.5-397b',
  'glm-4.6',
] as const

export const evaluationModelIds = [
  ...submissionModelIds,
  ...evaluationOnlyModelIds,
] as const

export const modelIds = evaluationModelIds

export const programmaticScorerScenarioIds = [
  'shangyang-court',
  'honnoji-decision',
  'trolley-problem',
] as const

export const SHANGYANG_JUDGE_OS_SCENARIO_ID = 'shangyang-court'

export function scenarioUsesProgrammaticScorer(scenarioId: string) {
  return (programmaticScorerScenarioIds as readonly string[]).includes(
    scenarioId,
  )
}

export type SubmissionModelId = (typeof submissionModelIds)[number]
export type PlayerSelectableModelId = (typeof playerSelectableModelIds)[number]
export type EvaluationModelId = (typeof evaluationModelIds)[number]
export type ModelId = EvaluationModelId
export type RetiredModelId = (typeof retiredModelIds)[number]
export type ProgrammaticScorerScenarioId =
  (typeof programmaticScorerScenarioIds)[number]
// 'moonshot' | 'zhipu' | 'minimax' | 'dashscope' are the labs' own
// OpenAI-compatible endpoints, replacing the shared SiliconFlow account so
// each vendor fails (and bills) independently.
export type ModelProvider =
  | 'anthropic'
  | 'dashscope'
  | 'deepseek'
  | 'minimax'
  | 'moonshot'
  | 'openai'
  | 'siliconflow'
  | 'zhipu'
export type UnderlyingModelProvider =
  | 'anthropic'
  | 'deepseek'
  | 'minimax'
  | 'moonshot'
  | 'openai'
  | 'qwen'
  | 'zai'

type ModelSurface = 'evaluation' | 'submission'
type CatalogModelId = ModelId | RetiredModelId

type ModelDefinition = {
  apiModel: string
  // Reasoning effort for Anthropic-compatible providers that support
  // output_config.effort (DeepSeek official API: 'high' is the default,
  // 'max' is the only other level).
  effort?: 'high' | 'max'
  id: CatalogModelId
  label: string
  provider: ModelProvider
  surfaces: readonly ModelSurface[]
  thinking?: 'disabled'
  underlyingProvider: UnderlyingModelProvider
}

export const modelCatalog = [
  // Aliyun-hosted: the official DeepSeek API retires v3-era models on
  // 2026-07-24, and several scenario judges are tuned to V3.2's voice.
  {
    id: 'deepseek-v3.2',
    label: 'DeepSeek V3.2',
    apiModel: 'deepseek-v3.2',
    provider: 'dashscope',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'deepseek',
  },
  {
    id: 'kimi-k2.5',
    label: 'Kimi K2.5',
    apiModel: 'kimi-k2.5',
    provider: 'moonshot',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'moonshot',
  },
  {
    id: 'qwen3.5-397b-a17b',
    label: 'Qwen3.5',
    apiModel: 'qwen3.5-27b',
    provider: 'dashscope',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'qwen',
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    apiModel: 'deepseek-v4-pro',
    provider: 'deepseek',
    surfaces: ['submission', 'evaluation'],
    effort: 'high',
    underlyingProvider: 'deepseek',
  },
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    apiModel: 'deepseek-v4-flash',
    provider: 'deepseek',
    surfaces: ['submission', 'evaluation'],
    effort: 'high',
    underlyingProvider: 'deepseek',
  },
  {
    id: 'kimi-k2.6',
    label: 'Kimi K2.6',
    apiModel: 'kimi-k2.6',
    provider: 'moonshot',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'moonshot',
  },
  {
    id: 'qwen3.6-27b',
    label: 'Qwen3.6 27B',
    apiModel: 'qwen3.6-27b',
    provider: 'dashscope',
    surfaces: ['submission', 'evaluation'],
    thinking: 'disabled',
    underlyingProvider: 'qwen',
  },
  {
    id: 'minimax-m3',
    label: 'MiniMax M3',
    apiModel: 'MiniMax-M3',
    provider: 'minimax',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'minimax',
  },
  {
    id: 'minimax-m2.5',
    label: 'MiniMax M2.5',
    apiModel: 'MiniMax-M2.5',
    provider: 'minimax',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'minimax',
  },
  {
    id: 'glm-5.1',
    label: 'GLM-5.1',
    apiModel: 'glm-5.1',
    provider: 'zhipu',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'zai',
  },
  {
    id: 'glm-5.2',
    label: 'GLM-5.2',
    apiModel: 'glm-5.2',
    provider: 'zhipu',
    surfaces: ['submission', 'evaluation'],
    underlyingProvider: 'zai',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    apiModel: 'gpt-4.1',
    provider: 'openai',
    surfaces: ['evaluation'],
    underlyingProvider: 'openai',
  },
  {
    id: 'gpt-5.4',
    label: 'GPT-5.4',
    apiModel: 'gpt-5.4',
    provider: 'openai',
    surfaces: ['evaluation'],
    underlyingProvider: 'openai',
  },
  {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4 mini',
    apiModel: 'gpt-5.4-mini',
    provider: 'openai',
    surfaces: ['evaluation'],
    underlyingProvider: 'openai',
  },
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    apiModel: 'claude-sonnet-4',
    provider: 'anthropic',
    surfaces: ['evaluation'],
    underlyingProvider: 'anthropic',
  },
  {
    id: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    apiModel: 'claude-sonnet-4-5',
    provider: 'anthropic',
    surfaces: ['evaluation'],
    underlyingProvider: 'anthropic',
  },
  {
    id: 'claude-opus-4-5',
    label: 'Claude Opus 4.5',
    apiModel: 'claude-opus-4-5-20251101',
    provider: 'anthropic',
    surfaces: ['evaluation'],
    underlyingProvider: 'anthropic',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Claude Opus 4.6',
    apiModel: 'claude-opus-4-6',
    provider: 'anthropic',
    surfaces: ['evaluation'],
    underlyingProvider: 'anthropic',
  },
  {
    id: 'qwen3.5-397b',
    label: 'Qwen3.5 397B',
    apiModel: 'qwen3.5-397b-a17b',
    provider: 'dashscope',
    surfaces: ['evaluation'],
    thinking: 'disabled',
    underlyingProvider: 'qwen',
  },
  {
    id: 'glm-4.6',
    label: 'GLM-4.6',
    apiModel: 'glm-4.6',
    provider: 'zhipu',
    surfaces: ['evaluation'],
    underlyingProvider: 'zai',
  },
] as const satisfies readonly ModelDefinition[]

type PublicModelOption<TId extends ModelId> = {
  id: TId
  label: string
}

function supportsSurface(entry: ModelDefinition, surface: ModelSurface) {
  return entry.surfaces.some((value) => value === surface)
}

function toPublicModelOption<TId extends ModelId>(
  entry: ModelDefinition,
): PublicModelOption<TId> {
  return {
    id: entry.id as TId,
    label: entry.label,
  }
}

export type ModelOption = PublicModelOption<SubmissionModelId>
export type PlayerModelOption = PublicModelOption<PlayerSelectableModelId>
export type EvaluationModelOption = PublicModelOption<EvaluationModelId>

const playerSelectableModelIdSet = new Set<string>(playerSelectableModelIds)

export const modelOptions = modelCatalog
  .filter((entry) => supportsSurface(entry, 'submission'))
  .map((entry) => toPublicModelOption(entry)) as readonly ModelOption[]

export const playerModelOptions = modelCatalog
  .filter((entry) => playerSelectableModelIdSet.has(entry.id))
  .map((entry) => toPublicModelOption(entry)) as readonly PlayerModelOption[]

export const evaluationModelOptions = modelCatalog
  .filter((entry) => supportsSurface(entry, 'evaluation'))
  .map((entry) =>
    toPublicModelOption(entry),
  ) as readonly EvaluationModelOption[]

export function getModelDefinition(id: ModelId): ModelDefinition {
  const model = modelCatalog.find((entry) => entry.id === id)

  if (!model) {
    throw new Error(`Unknown model id: ${id}`)
  }

  return model as ModelDefinition
}

export function getUnderlyingModelProvider(
  id: ModelId,
): UnderlyingModelProvider {
  return getModelDefinition(id).underlyingProvider
}

export function resolveModelLabel(modelId: string): string {
  return modelCatalog.find((entry) => entry.id === modelId)?.label ?? modelId
}

export const MIN_SWISS_ROUNDS = 2

export function computeSwissRounds(playerCount: number): number {
  if (playerCount < 2) return 0
  return Math.max(MIN_SWISS_ROUNDS, Math.ceil(Math.log2(playerCount)))
}
