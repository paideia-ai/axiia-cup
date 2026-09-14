import type { JSONValue, ScenarioSummary, Side } from '../api/types'
import { fengyitingReal } from './fengyiting-real'
import { honnojiDecision } from './honnoji-decision'
import { legalHarborMurderJury } from './legal-harbor-murder-jury'
import { shangyangCourt } from './shangyang-court'
import { trolleyProblem } from './trolley-problem'
import type { ScenarioEducation, ScenarioModule, ScenarioRole } from './types'

export type { ScenarioModule, ScenarioRole } from './types'

export const DIFFICULTY_LABEL = { 1: '简单', 2: '中等', 3: '困难' } as const
const SERVER_DIFFICULTY = { easy: 1, medium: 2, hard: 3 } as const

// Server metadata wins field by field. Missing fields may use reviewed local
// copy, but beginner suitability is independent of the difficulty level.
export function scenarioGuidance(
  summary: ScenarioSummary,
  education: ScenarioEducation | null,
) {
  return {
    difficulty: summary.difficulty != null
      ? SERVER_DIFFICULTY[summary.difficulty]
      : education?.difficulty,
    minutes: summary.estimatedMinutes ?? education?.minutes,
    noviceFriendly: summary.beginnerFriendly ?? education?.noviceFriendly,
  }
}

// Every scenario the SPA knows something extra about. A scenario absent from here
// is not broken: it renders through the generic, server-driven path.
const MODULES: ScenarioModule[] = [
  shangyangCourt,
  honnojiDecision,
  fengyitingReal,
  trolleyProblem,
  legalHarborMurderJury,
]

export function scenarioModule(
  slotID: string | null | undefined,
): ScenarioModule | null {
  if (!slotID) return null
  return MODULES.find((module) => module.slotID === slotID) ?? null
}

export function rolesForSide(
  module: ScenarioModule | null,
  side: Side,
): ScenarioRole[] {
  return module?.roles.filter((role) => role.side === side) ?? []
}

export function roleByKey(
  module: ScenarioModule | null,
  key: string | null | undefined,
): ScenarioRole | null {
  if (!key) return null
  return module?.roles.find((role) => role.key === key) ?? null
}

// What the save API stores verbatim, and what the script parses back out.
export function roleOptions(roleKey: string): string {
  return JSON.stringify({ role: roleKey })
}

// An options blob reaches us either already parsed or as the JSON string it is
// stored as; both are worth reading, neither is worth trusting.
export function roleOfOptions(
  module: ScenarioModule | null,
  options: JSONValue | string | null | undefined,
): ScenarioRole | null {
  if (options == null) return null
  let value: unknown = options
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const role = (value as Record<string, unknown>).role
  return typeof role === 'string' ? roleByKey(module, role) : null
}
