import { afterEach, describe, expect, it } from 'vitest'
import {
  chooseRole,
  clearScenarioEntries,
  entrySettingsPath,
  restoreScenarioEntries,
  selectedEntry,
  selectedRole,
} from './entry-selection'
import { portraitInventory } from '../../testing/agent-portrait-fixtures'
const scenario = 'honnoji-decision'
afterEach(() => restoreScenarioEntries(scenario))
describe('sortie role selection', () => {
  it('keeps roles without entry versions unconfigured and directs to the correct agent', () => {
    const inventory = JSON.stringify(portraitInventory)
    const opposite = selectedEntry(scenario, 'b')
    expect(chooseRole(scenario, 'a', 'yoshiaki_envoy')).toBe(true)
    expect(selectedRole(scenario, 'a')?.key).toBe('yoshiaki')
    expect(selectedEntry(scenario, 'a')).toBeNull()
    expect(entrySettingsPath(scenario, 'a')).toBe('/agents/194')
    expect(selectedEntry(scenario, 'b')).toBe(opposite)
    expect(chooseRole(scenario, 'b', 'akechi_ashigaru')).toBe(true)
    expect(selectedEntry(scenario, 'b')).toBeNull()
    expect(entrySettingsPath(scenario, 'b')).toBe('/agents/254')
    expect(JSON.stringify(portraitInventory)).toBe(inventory)
  })
  it('automatically uses the existing entry rather than another saved version', () => {
    chooseRole(scenario, 'a', 'yoshiaki')
    expect(chooseRole(scenario, 'a', 'chosokabe')).toBe(true)
    expect(selectedEntry(scenario, 'a')).toMatchObject({
      agentID: 164,
      versionID: 1640,
    })
    expect(chooseRole(scenario, 'b', 'hosokawa_fujitaka')).toBe(true)
    expect(selectedEntry(scenario, 'b')?.versionID).toBe(2240)
  })
  it('rejects invalid and opposite-side roles without changing selection', () => {
    clearScenarioEntries(scenario)
    expect(chooseRole(scenario, 'a', 'hosokawa')).toBe(false)
    expect(chooseRole(scenario, 'a', 'unknown')).toBe(false)
    expect(selectedRole(scenario, 'a')).toBeNull()
    expect(selectedEntry(scenario, 'a')).toBeNull()
    expect(entrySettingsPath(scenario, 'a')).toBe('/my-agents')
    restoreScenarioEntries(scenario)
    expect(selectedEntry(scenario, 'a')?.versionID).toBe(1640)
  })
})
