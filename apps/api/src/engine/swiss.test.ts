import { describe, expect, it } from 'bun:test'

import { swissPair } from './swiss'

describe('swissPair', () => {
  it('pairs players by standings (best vs best)', () => {
    const pairs = swissPair({
      playerIds: [1, 2, 3, 4],
      previousPairings: new Set(),
      standings: new Map([
        [1, 3],
        [2, 2],
        [3, 1],
        [4, 0],
      ]),
    })

    // 1 (3 wins) vs 2 (2 wins), 3 (1 win) vs 4 (0 wins)
    expect(pairs).toEqual([
      [1, 2],
      [3, 4],
    ])
  })

  it('avoids repeating previous pairings', () => {
    const pairs = swissPair({
      playerIds: [1, 2, 3, 4],
      previousPairings: new Set(['1-2']),
      standings: new Map([
        [1, 3],
        [2, 2],
        [3, 1],
        [4, 0],
      ]),
    })

    // 1 can't pair with 2, so pairs with 3 instead
    expect(pairs).toEqual([
      [1, 3],
      [2, 4],
    ])
  })

  it('falls back to repeated pairing when all opponents exhausted', () => {
    const pairs = swissPair({
      playerIds: [1, 2],
      previousPairings: new Set(['1-2']),
      standings: new Map([
        [1, 1],
        [2, 0],
      ]),
    })

    // Only 2 players and they already played — forced to re-pair
    expect(pairs).toEqual([[1, 2]])
  })

  it('handles odd number of players (one left out)', () => {
    const pairs = swissPair({
      playerIds: [1, 2, 3],
      previousPairings: new Set(),
      standings: new Map([
        [1, 2],
        [2, 1],
        [3, 0],
      ]),
    })

    // 1 vs 2, player 3 gets no pair (bye)
    expect(pairs).toEqual([[1, 2]])
  })

  it('handles equal standings with stable ordering', () => {
    const pairs = swissPair({
      playerIds: [1, 2, 3, 4],
      previousPairings: new Set(),
      standings: new Map([
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
      ]),
    })

    // All tied at 0 — pairs by submissionId order
    expect(pairs).toEqual([
      [1, 2],
      [3, 4],
    ])
  })

  it('returns empty for single player', () => {
    const pairs = swissPair({
      playerIds: [1],
      previousPairings: new Set(),
      standings: new Map([[1, 0]]),
    })

    expect(pairs).toEqual([])
  })

  it('returns empty for no players', () => {
    const pairs = swissPair({
      playerIds: [],
      previousPairings: new Set(),
      standings: new Map(),
    })

    expect(pairs).toEqual([])
  })
})
