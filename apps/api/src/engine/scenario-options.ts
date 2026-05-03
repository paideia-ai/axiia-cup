import { roleOptionSchema, type RoleOption } from '@axiia/shared'

import type { ScenarioRecord } from '../db/schema'

function parseRoleOptions(jsonText: string): RoleOption[] {
  return roleOptionSchema.array().parse(JSON.parse(jsonText))
}

function getRoleOptions(scenario: ScenarioRecord, side: 'a' | 'b') {
  return parseRoleOptions(
    side === 'a' ? scenario.roleAOptions : scenario.roleBOptions,
  )
}

export function scenarioHasRoleOptions(scenario: ScenarioRecord) {
  return (
    getRoleOptions(scenario, 'a').length > 0 ||
    getRoleOptions(scenario, 'b').length > 0
  )
}

function findRoleOption(
  options: RoleOption[],
  optionId: string | null | undefined,
  sideLabel: string,
) {
  if (!optionId) {
    throw new Error(`${sideLabel} must select a role option`)
  }

  const option = options.find((item) => item.id === optionId)

  if (!option) {
    throw new Error(`${sideLabel} role option not found: ${optionId}`)
  }

  return option
}

export function validateScenarioRoleOptionSelection(
  scenario: ScenarioRecord,
  selection: {
    roleAOptionId?: string | null
    roleBOptionId?: string | null
  },
) {
  const roleAOptions = getRoleOptions(scenario, 'a')
  const roleBOptions = getRoleOptions(scenario, 'b')
  const hasOptions = roleAOptions.length > 0 || roleBOptions.length > 0

  if (!hasOptions) {
    if (selection.roleAOptionId || selection.roleBOptionId) {
      throw new Error('Scenario does not support selectable roles')
    }

    return {
      roleAOptionId: null,
      roleBOptionId: null,
    }
  }

  const roleAOption = findRoleOption(
    roleAOptions,
    selection.roleAOptionId,
    'roleA',
  )
  const roleBOption = findRoleOption(
    roleBOptions,
    selection.roleBOptionId,
    'roleB',
  )

  return {
    roleAOptionId: roleAOption.id,
    roleBOptionId: roleBOption.id,
  }
}

export function resolveScenarioRoleOptions(
  scenario: ScenarioRecord,
  selection: {
    roleAOptionId?: string | null
    roleBOptionId?: string | null
  },
): ScenarioRecord {
  const roleAOptions = getRoleOptions(scenario, 'a')
  const roleBOptions = getRoleOptions(scenario, 'b')
  const hasOptions = roleAOptions.length > 0 || roleBOptions.length > 0

  if (!hasOptions) {
    return scenario
  }

  const roleAOption = findRoleOption(
    roleAOptions,
    selection.roleAOptionId,
    'roleA',
  )
  const roleBOption = findRoleOption(
    roleBOptions,
    selection.roleBOptionId,
    'roleB',
  )

  return {
    ...scenario,
    roleAName: roleAOption.name,
    roleARequests: JSON.stringify(roleAOption.requests),
    roleBName: roleBOption.name,
    roleBRequests: JSON.stringify(roleBOption.requests),
  }
}
