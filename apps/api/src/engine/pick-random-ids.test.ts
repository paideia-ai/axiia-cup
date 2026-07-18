import { beforeAll, describe, expect, it } from 'bun:test'

process.env.SILICONFLOW_API_KEY = 'test-siliconflow-api-key'

let pickRandomIds: (typeof import('./core'))['pickRandomIds']

beforeAll(async () => {
  const core = await import('./core')
  pickRandomIds = core.pickRandomIds
})

describe('pickRandomIds', () => {
  const items = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]

  it('returns the requested count of distinct valid ids', () => {
    for (let i = 0; i < 100; i++) {
      const picked = pickRandomIds(items, 2)
      expect(picked).toHaveLength(2)
      expect(new Set(picked).size).toBe(2)
      for (const id of picked) {
        expect(['A', 'B', 'C']).toContain(id)
      }
    }
  })

  it('returns all ids when count >= items.length', () => {
    expect(pickRandomIds(items, 3)).toEqual(['A', 'B', 'C'])
    expect(pickRandomIds(items, 5)).toEqual(['A', 'B', 'C'])
  })

  it('does not mutate the input array', () => {
    const input = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    pickRandomIds(input, 1)
    expect(input.map((i) => i.id)).toEqual(['A', 'B', 'C'])
  })

  it('picks uniformly (each of 3 ids within ±5% of 1/3 over 30k draws)', () => {
    const draws = 30_000
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 }
    for (let i = 0; i < draws; i++) {
      const [id] = pickRandomIds(items, 1)
      counts[id] += 1
    }
    for (const id of ['A', 'B', 'C']) {
      const freq = counts[id] / draws
      expect(freq).toBeGreaterThan(1 / 3 - 0.05)
      expect(freq).toBeLessThan(1 / 3 + 0.05)
    }
  })
})
