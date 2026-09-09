import { roleOfOptions, rolesForSide, scenarioModule } from '../scenarios'
import type { Agent } from './model'

// Demo choices from the sibling v2 ModelCatalog.swift, not the live allowlist.
export const demoModels = [
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'kimi-k2.6', label: 'Kimi K2.6' },
  { id: 'qwen3.6-27b', label: 'Qwen3.6 27B' },
  { id: 'glm-5.3', label: 'GLM-5.3' },
]

function latestVersion(agent: Agent) {
  return [...agent.versions].sort((a, b) => b.id - a.id)[0]
}

export function modelFor(agent: Agent) {
  return agent.draftModelID || latestVersion(agent)?.modelID || demoModels[0].id
}

export function roleFor(agent: Agent) {
  const module = scenarioModule(agent.scenario)
  const side = agent.side === 0 ? 'a' : 'b'
  const roles = rolesForSide(module, side)
  const previous = roleOfOptions(module, latestVersion(agent)?.options)
  return roles.find((role) => role.key === agent.roleKey) ??
    roles.find((role) => role.key === previous?.key) ?? roles[0]
}
