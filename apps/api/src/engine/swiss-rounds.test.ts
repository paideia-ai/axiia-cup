import { describe, expect, it } from 'bun:test'

import { computeSwissRounds } from '@axiia/shared'

describe('computeSwissRounds', () => {
  it('returns 0 for less than 2 players', () => {
    expect(computeSwissRounds(0)).toBe(0)
    expect(computeSwissRounds(1)).toBe(0)
  })

  it('returns minimum 2 rounds for small groups', () => {
    expect(computeSwissRounds(2)).toBe(2)
    expect(computeSwissRounds(3)).toBe(2)
  })

  it('returns ceil(log2(N)) for standard sizes', () => {
    expect(computeSwissRounds(4)).toBe(2)
    expect(computeSwissRounds(5)).toBe(3)
    expect(computeSwissRounds(8)).toBe(3)
    expect(computeSwissRounds(9)).toBe(4)
    expect(computeSwissRounds(15)).toBe(4)
    expect(computeSwissRounds(16)).toBe(4)
    expect(computeSwissRounds(17)).toBe(5)
    expect(computeSwissRounds(32)).toBe(5)
  })
})
