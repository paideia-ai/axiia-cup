import { describe, expect, it } from 'vitest'
import type { MyAgentDTO } from '../api/types'
import { scenarioModule } from '../scenarios'
import { agentRoleGroups, inventoryPreviewIDs } from './agent-role-groups'
const module = scenarioModule('honnoji-decision')
const agent = (
  agentID: number,
  key?: string,
  side: 'a' | 'b' = 'a',
): MyAgentDTO => ({
  agentID,
  versionCount: 1,
  role: key ? { key, side, name: 'server snapshot name' } : null,
})
describe('inventory role identity', () => {
  it('normalizes legacy aliases and preserves order within each role', () => {
    const groups = agentRoleGroups(module, 'a', [
      agent(9, 'yoshiaki_envoy'),
      agent(2, 'chosokabe'),
      agent(1, 'yoshiaki'),
    ])
    expect(
      groups.map((
        group,
      ) => [group.key, group.agents.map((item) => item.agentID)]),
    ).toEqual([
      ['chosokabe', [2]],
      ['yoshiaki', [9, 1]],
    ])
    expect(groups[1].name).toBe('足利义昭的使者')
  })
  it('never guesses absent, unknown, or wrong-side identities from names', () => {
    const groups = agentRoleGroups(module, 'a', [
      { ...agent(1), name: '足利义昭的使者' },
      agent(2, 'new-role'),
      agent(3, 'hosokawa'),
      agent(4, 'chosokabe', 'b'),
      { ...agent(5, 'chosokabe'), isArchived: true },
    ])
    expect(groups.at(-1)?.agents.map((item) => item.agentID)).toEqual([
      1,
      2,
      3,
      4,
    ])
    expect(groups.at(-1)?.role).toBeNull()
    expect(groups[0].agents).toHaveLength(0)
  })
  it('does not add subgroups to single-role or unknown scenarios', () => {
    expect(agentRoleGroups(scenarioModule('shangyang-court'), 'a', [agent(1)]))
      .toEqual([])
    expect(agentRoleGroups(null, 'a', [agent(1)])).toEqual([])
  })
})
describe('collapsed inventory', () => {
  it('retains late entry agents and every occupied role including unresolved records', () => {
    const agents = [
      agent(1, 'chosokabe'),
      agent(2, 'chosokabe'),
      agent(3, 'chosokabe'),
      agent(4, 'yoshiaki'),
      agent(5),
      { ...agent(6, 'chosokabe'), entryVersionID: 100 },
    ]
    const ids = inventoryPreviewIDs(
      agents,
      3,
      agentRoleGroups(module, 'a', agents),
    )
    expect([...ids]).toEqual([6, 4, 5])
    expect(
      agents.filter((item) => ids.has(item.agentID)).map((item) =>
        item.agentID
      ),
    ).toEqual([4, 5, 6])
  })
  it('preserves the original single-role cutoff and all entry agents', () => {
    const agents = Array.from(
      { length: 8 },
      (_, i) => ({ ...agent(i), entryVersionID: i === 7 ? 100 : null }),
    )
    expect([...inventoryPreviewIDs(agents, 3, [])]).toEqual([7, 0, 1])
  })
})
