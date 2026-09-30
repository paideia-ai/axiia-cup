import { describe, expect, it } from 'vitest'
import type { MyAgentDTO } from '../api/types'
import { preferredAgent } from './agent-entry'

const agent = (
  agentID: number,
  props: Partial<MyAgentDTO> = {},
): MyAgentDTO => ({
  agentID,
  versionCount: 1,
  ...props,
})

describe('shared side-entry selection', () => {
  it('prefers an entry version over a more recent draft, excluding archived agents', () => {
    expect(
      preferredAgent([
        agent(1, { lastEditedAt: 500 }),
        agent(2, { entryVersionID: 20, lastEditedAt: 100 }),
        agent(3, { entryVersionID: 30, lastEditedAt: 600, isArchived: true }),
      ])?.agentID,
    ).toBe(2)
  })

  it('uses last edit time within the preferred tier without reordering inventory', () => {
    const agents = [
      agent(1, { entryVersionID: 10, lastEditedAt: 100 }),
      agent(2, { entryVersionID: 20, lastEditedAt: 300 }),
      agent(3, { lastEditedAt: 500 }),
    ]
    expect(preferredAgent(agents)?.agentID).toBe(2)
    const withoutEntries = agents.map((item) => ({
      ...item,
      entryVersionID: null,
    }))
    expect(preferredAgent(withoutEntries)?.agentID).toBe(3)
    expect(agents.map((item) => item.agentID)).toEqual([1, 2, 3])
  })

  it('preserves inventory order for equal or missing timestamps, and ranks known edits first', () => {
    expect(preferredAgent([agent(9), agent(2)])?.agentID).toBe(9)
    expect(
      preferredAgent([
        agent(9, { lastEditedAt: 100 }),
        agent(2, { lastEditedAt: 100 }),
      ])?.agentID,
    ).toBe(9)
    expect(preferredAgent([agent(9), agent(2, { lastEditedAt: 100 })])?.agentID)
      .toBe(2)
  })

  it('returns no candidate for an empty or wholly archived side', () => {
    expect(preferredAgent([])).toBeUndefined()
    expect(preferredAgent([agent(1, { isArchived: true })])).toBeUndefined()
  })
})
