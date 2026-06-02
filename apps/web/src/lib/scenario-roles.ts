import type { Scenario } from '@axiia/shared'

type RoleSide = 'a' | 'b'

type RoleSelection = {
  roleAOptionId?: string | null
  roleBOptionId?: string | null
}

export function getSelectedRoleOption(
  scenario: Scenario,
  side: RoleSide,
  optionId: string | null | undefined,
) {
  const options = side === 'a' ? scenario.roleAOptions : scenario.roleBOptions

  return options.find((option) => option.id === optionId) ?? options[0] ?? null
}

export function getRoleDisplayName(
  scenario: Scenario,
  side: RoleSide,
  optionId: string | null | undefined,
) {
  return (
    getSelectedRoleOption(scenario, side, optionId)?.name ??
    (side === 'a' ? scenario.roleAName : scenario.roleBName)
  )
}

export function getRoleRequests(
  scenario: Scenario,
  side: RoleSide,
  optionId: string | null | undefined,
) {
  return (
    getSelectedRoleOption(scenario, side, optionId)?.requests ??
    (side === 'a' ? scenario.roleARequests : scenario.roleBRequests)
  )
}

export function scenarioHasRoleOptions(scenario: Scenario) {
  return scenario.roleAOptions.length > 0 || scenario.roleBOptions.length > 0
}

export function scenarioHasInfoAssignmentDetails(scenario: Scenario) {
  return (
    scenario.roleAHiddenInfo.length > 0 ||
    scenario.roleBHiddenInfo.length > 0 ||
    scenario.roleARequests.length > 0 ||
    scenario.roleBRequests.length > 0
  )
}

export function resolveScenarioRoles(
  scenario: Scenario,
  selection: RoleSelection,
) {
  return {
    roleAName: getRoleDisplayName(scenario, 'a', selection.roleAOptionId),
    roleARequests: getRoleRequests(scenario, 'a', selection.roleAOptionId),
    roleBName: getRoleDisplayName(scenario, 'b', selection.roleBOptionId),
    roleBRequests: getRoleRequests(scenario, 'b', selection.roleBOptionId),
  }
}

export function buildScenarioWithResolvedRoles(
  scenario: Scenario,
  selection: RoleSelection,
): Scenario {
  return {
    ...scenario,
    ...resolveScenarioRoles(scenario, selection),
  }
}
