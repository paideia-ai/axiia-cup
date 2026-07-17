export const submissionModelIds = [
  'deepseek-v3.2',
  'kimi-k2.5',
  'qwen3.5-397b-a17b',
  'deepseek-v4-pro',
  'kimi-k2.6',
  'qwen3.6-27b',
  'minimax-m2.5',
  'glm-5.1',
  'glm-5.2',
  'deepseek-v4-flash',
] as const

// minimax-m2.5 was withdrawn from player selection when the shared
// SiliconFlow account died: zero recorded LLM calls ever, not worth a
// dedicated MiniMax account. The catalog entry stays for historical records.
export const playerSelectableModelIds = [
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'kimi-k2.6',
  'qwen3.6-27b',
  'glm-5.2',
] as const

export const retiredModelIds = ['minimax-m3'] as const

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
}

export const modelCatalog = [
  {
    id: 'deepseek-v3.2',
    label: 'DeepSeek V3.2',
    apiModel: 'deepseek-ai/DeepSeek-V3.2',
    provider: 'siliconflow',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'kimi-k2.5',
    label: 'Kimi K2.5',
    apiModel: 'Pro/moonshotai/Kimi-K2.5',
    provider: 'siliconflow',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'qwen3.5-397b-a17b',
    label: 'Qwen3.5',
    apiModel: 'Qwen/Qwen3.5-27B',
    provider: 'siliconflow',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    apiModel: 'deepseek-v4-pro',
    provider: 'deepseek',
    surfaces: ['submission', 'evaluation'],
    effort: 'high',
  },
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    apiModel: 'deepseek-v4-flash',
    provider: 'deepseek',
    surfaces: ['submission', 'evaluation'],
    effort: 'high',
  },
  {
    id: 'kimi-k2.6',
    label: 'Kimi K2.6',
    apiModel: 'kimi-k2.6',
    provider: 'moonshot',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'qwen3.6-27b',
    label: 'Qwen3.6 27B',
    apiModel: 'qwen3.6-27b',
    provider: 'dashscope',
    surfaces: ['submission', 'evaluation'],
    thinking: 'disabled',
  },
  {
    id: 'minimax-m3',
    label: 'MiniMax M3',
    apiModel: 'MiniMaxAI/MiniMax-M3',
    provider: 'siliconflow',
    surfaces: [],
  },
  {
    id: 'minimax-m2.5',
    label: 'MiniMax M2.5',
    apiModel: 'MiniMaxAI/MiniMax-M2.5',
    provider: 'siliconflow',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'glm-5.1',
    label: 'GLM-5.1',
    apiModel: 'glm-5.1',
    provider: 'zhipu',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'glm-5.2',
    label: 'GLM-5.2',
    apiModel: 'glm-5.2',
    provider: 'zhipu',
    surfaces: ['submission', 'evaluation'],
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    apiModel: 'gpt-4.1',
    provider: 'openai',
    surfaces: ['evaluation'],
  },
  {
    id: 'gpt-5.4',
    label: 'GPT-5.4',
    apiModel: 'gpt-5.4',
    provider: 'openai',
    surfaces: ['evaluation'],
  },
  {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4 mini',
    apiModel: 'gpt-5.4-mini',
    provider: 'openai',
    surfaces: ['evaluation'],
  },
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    apiModel: 'claude-sonnet-4',
    provider: 'anthropic',
    surfaces: ['evaluation'],
  },
  {
    id: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    apiModel: 'claude-sonnet-4-5',
    provider: 'anthropic',
    surfaces: ['evaluation'],
  },
  {
    id: 'claude-opus-4-5',
    label: 'Claude Opus 4.5',
    apiModel: 'claude-opus-4-5-20251101',
    provider: 'anthropic',
    surfaces: ['evaluation'],
  },
  {
    id: 'claude-opus-4-6',
    label: 'Claude Opus 4.6',
    apiModel: 'claude-opus-4-6',
    provider: 'anthropic',
    surfaces: ['evaluation'],
  },
  {
    id: 'qwen3.5-397b',
    label: 'Qwen3.5 397B',
    apiModel: 'Qwen/Qwen3.5-397B-A17B',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
    thinking: 'disabled',
  },
  {
    id: 'glm-4.6',
    label: 'GLM-4.6',
    apiModel: 'zai-org/GLM-4.6',
    provider: 'siliconflow',
    surfaces: ['evaluation'],
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

export function resolveModelLabel(modelId: string): string {
  return modelCatalog.find((entry) => entry.id === modelId)?.label ?? modelId
}

export const MIN_SWISS_ROUNDS = 2

export function computeSwissRounds(playerCount: number): number {
  if (playerCount < 2) return 0
  return Math.max(MIN_SWISS_ROUNDS, Math.ceil(Math.log2(playerCount)))
}
