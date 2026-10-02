import type { MyAgentDTO, Side } from '../api/types'
import { roleByKey, type ScenarioModule, type ScenarioRole } from '../scenarios'

export interface AgentRoleGroup {
  key: string
  name: string
  role: ScenarioRole | null
  agents: MyAgentDTO[]
}

// A side describes a faction; only the API's explicit role identifies a person.
// Legacy aliases normalize through the registry. Missing, unknown or wrong-side
// identities remain visible without guessing from IDs, names or array order.
export function agentRoleGroups(
  module: ScenarioModule | null,
  side: Side,
  agents: readonly MyAgentDTO[],
): AgentRoleGroup[] {
  const roles = module?.roles.filter((role) => role.side === side) ?? []
  if (roles.length === 0) return []
  const groups = roles.map((role): AgentRoleGroup => ({
    key: role.key,
    name: role.name,
    role,
    agents: [],
  }))
  const unknown: AgentRoleGroup = {
    key: 'unknown',
    name: '角色待确认',
    role: null,
    agents: [],
  }
  for (const agent of agents) {
    if (agent.isArchived) continue
    const role = agent.role?.side === side
      ? roleByKey(module, agent.role.key)
      : null
    const target = (role?.side === side
      ? groups.find((group) =>
        group.key === role.key
      )
      : null) ?? unknown
    target.agents.push(agent)
  }
  return unknown.agents.length ? [...groups, unknown] : groups
}

// Keep entry agents and at least one agent per occupied role visible. A role
// group must never look empty merely because the long side has been collapsed.
export function inventoryPreviewIDs(
  agents: readonly MyAgentDTO[],
  limit: number,
  groups: readonly AgentRoleGroup[],
): Set<number> {
  const ids = new Set(
    agents.filter((agent) => agent.entryVersionID != null).map((agent) =>
      agent.agentID
    ),
  )
  for (const group of groups) {
    if (
      group.agents.length &&
      !group.agents.some((agent) => ids.has(agent.agentID))
    ) {
      ids.add(group.agents[0].agentID)
    }
  }
  for (const agent of agents) {
    if (ids.size >= limit) break
    ids.add(agent.agentID)
  }
  return ids
}
