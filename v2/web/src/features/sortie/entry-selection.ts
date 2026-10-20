import { useSyncExternalStore } from 'react'
import { sortieEntries, sortieVersionEntries } from './fixtures'
import { roleByKey, scenarioModule } from '../../scenarios'
import { portraitInventory } from '../../testing/agent-portrait-fixtures'

// Tab-local demo selections. They never change the account's real entry flags.
type Selections = Record<string, string | null>
let selections: Selections = {}
const listeners = new Set<() => void>()
const key = (scenarioID: string, side: 'a' | 'b') => `${scenarioID}:${side}`
const publish = (next: Selections) => {
  selections = next
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const getEntrySelections = () => selections
export const useEntrySelections = () =>
  useSyncExternalStore(subscribe, getEntrySelections)
export function selectedRole(
  scenarioID: string,
  side: 'a' | 'b',
  snapshot = selections,
) {
  const id = key(scenarioID, side)
  const roleKey = id in snapshot
    ? snapshot[id]
    : sortieEntries.find((e) => e.scenarioID === scenarioID && e.side === side)
      ?.roleKey
  return roleByKey(scenarioModule(scenarioID), roleKey) ?? null
}
function roleAgents(scenarioID: string, side: 'a' | 'b', snapshot: Selections) {
  const module = scenarioModule(scenarioID)
  const role = selectedRole(scenarioID, side, snapshot)
  if (!role) return []
  return portraitInventory.scenarios.find((s) => s.scenarioID === scenarioID)
    ?.sides[side].filter((agent) =>
      !agent.isArchived &&
      roleByKey(module, agent.role?.key)?.key === role.key
    ) ?? []
}
export function selectedEntry(
  scenarioID: string,
  side: 'a' | 'b',
  snapshot = selections,
) {
  // Other scenarios retain their existing default entry behavior.
  if (scenarioID !== 'honnoji-decision') {
    return sortieEntries.find((e) =>
      e.scenarioID === scenarioID && e.side === side
    ) ?? null
  }
  const agent = roleAgents(scenarioID, side, snapshot).find((a) =>
    a.entryVersionID != null
  )
  return agent
    ? sortieVersionEntries.find((e) =>
      e.agentID === agent.agentID && e.versionID === agent.entryVersionID
    ) ?? null
    : null
}
export function entrySettingsPath(
  scenarioID: string,
  side: 'a' | 'b',
  snapshot = selections,
) {
  const agentID = selectedEntry(scenarioID, side, snapshot)?.agentID ??
    roleAgents(scenarioID, side, snapshot)[0]?.agentID
  return agentID == null ? '/my-agents' : `/agents/${agentID}`
}
export function chooseRole(
  scenarioID: string,
  side: 'a' | 'b',
  roleKey: string,
) {
  const role = roleByKey(scenarioModule(scenarioID), roleKey)
  if (!role || role.side !== side) return false
  publish({ ...selections, [key(scenarioID, side)]: role.key })
  return true
}
export function clearScenarioEntries(scenarioID: string) {
  publish({
    ...selections,
    [key(scenarioID, 'a')]: null,
    [key(scenarioID, 'b')]: null,
  })
}
export function restoreScenarioEntries(scenarioID: string) {
  const next = { ...selections }
  delete next[key(scenarioID, 'a')]
  delete next[key(scenarioID, 'b')]
  publish(next)
}
