export const submissionModelIds = [
  'deepseek-v3.2',
  'kimi-k2.5',
  'qwen3.5-397b-a17b',
] as const

export const evaluationOnlyModelIds = [
  'gpt-4.1',
  'gpt-5.4',
  'gpt-5.4-mini',
  'claude-sonnet-4',
  'claude-sonnet-4-5',
  'claude-opus-4-5',
] as const

export const evaluationModelIds = [
  ...submissionModelIds,
  ...evaluationOnlyModelIds,
] as const

export const modelIds = evaluationModelIds

export type SubmissionModelId = (typeof submissionModelIds)[number]
export type EvaluationModelId = (typeof evaluationModelIds)[number]
export type ModelId = EvaluationModelId
export type ModelProvider = 'anthropic' | 'openai' | 'siliconflow'

type ModelDefinition = {
  apiModel: string
  id: ModelId
  label: string
  provider: ModelProvider
  surfaces: readonly ('evaluation' | 'submission')[]
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
] as const satisfies readonly ModelDefinition[]

type ModelSurface = 'evaluation' | 'submission'

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
export type EvaluationModelOption = PublicModelOption<EvaluationModelId>

export const modelOptions = modelCatalog
  .filter((entry) => supportsSurface(entry, 'submission'))
  .map((entry) => toPublicModelOption(entry)) as readonly ModelOption[]

export const evaluationModelOptions = modelCatalog
  .filter((entry) => supportsSurface(entry, 'evaluation'))
  .map((entry) =>
    toPublicModelOption(entry),
  ) as readonly EvaluationModelOption[]

export function getModelDefinition(id: ModelId) {
  const model = modelCatalog.find((entry) => entry.id === id)

  if (!model) {
    throw new Error(`Unknown model id: ${id}`)
  }

  return model
}

export const MIN_SWISS_ROUNDS = 2

export function computeSwissRounds(playerCount: number): number {
  if (playerCount < 2) return 0
  return Math.max(MIN_SWISS_ROUNDS, Math.ceil(Math.log2(playerCount)))
}
