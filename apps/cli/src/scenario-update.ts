import {
  updateScenarioSchema,
  type AdminScenario,
  type UpdateScenario,
} from '@axiia/shared'

const updateScenarioKeys = [
  'turnCount',
  'judgeModel',
  'openingLine',
  'agentPromptTemplate',
  'examinationQuestionTemplate',
  'judgePrompt',
  'scorerPrompt',
  'roleAName',
  'roleAHiddenInfo',
  'roleARequests',
  'roleBName',
  'roleBHiddenInfo',
  'roleBRequests',
  'falseInfoCount',
  'trueRequestCount',
] as const satisfies readonly (keyof UpdateScenario)[]

export function toEditableScenario(scenario: AdminScenario): UpdateScenario {
  return {
    turnCount: scenario.turnCount,
    judgeModel: scenario.judgeModel,
    openingLine: scenario.openingLine,
    agentPromptTemplate: scenario.agentPromptTemplate,
    examinationQuestionTemplate: scenario.examinationQuestionTemplate,
    judgePrompt: scenario.judgePrompt,
    scorerPrompt: scenario.scorerPrompt,
    roleAName: scenario.roleAName,
    roleAHiddenInfo: scenario.roleAHiddenInfo,
    roleARequests: scenario.roleARequests,
    roleBName: scenario.roleBName,
    roleBHiddenInfo: scenario.roleBHiddenInfo,
    roleBRequests: scenario.roleBRequests,
    falseInfoCount: scenario.falseInfoCount,
    trueRequestCount: scenario.trueRequestCount,
  }
}

function buildUpdateCandidate(
  raw: Record<string, unknown>,
): Partial<UpdateScenario> {
  return Object.fromEntries(
    updateScenarioKeys.map((key) => [key, raw[key]]),
  ) as Partial<UpdateScenario>
}

export function parseScenarioUpdateInput(raw: unknown): UpdateScenario {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Scenario update payload must be a JSON object')
  }

  const candidate =
    'scenario' in (raw as Record<string, unknown>) &&
    (raw as Record<string, unknown>).scenario &&
    typeof (raw as Record<string, unknown>).scenario === 'object' &&
    !Array.isArray((raw as Record<string, unknown>).scenario)
      ? ((raw as Record<string, unknown>).scenario as Record<string, unknown>)
      : (raw as Record<string, unknown>)

  const parsed = updateScenarioSchema.safeParse(
    buildUpdateCandidate(candidate),
  )

  if (parsed.success) {
    return parsed.data
  }

  const issues = parsed.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
    return `${path}: ${issue.message}`
  })

  throw new Error(`Invalid scenario update payload: ${issues.join('; ')}`)
}
