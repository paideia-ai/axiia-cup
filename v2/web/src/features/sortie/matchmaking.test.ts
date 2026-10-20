import { describe, expect, it } from 'vitest'
import {
  candidatePool,
  type Entry,
  matchingScore,
  pickOpponent,
  settle,
  winRate,
} from './matchmaking'

const me: Entry = {
  agentID: 101,
  versionID: 1,
  ownerID: 'me',
  scenarioID: 'court',
  side: 'a',
  active: true,
  eligible: true,
  wins: 18,
  losses: 10,
  draws: 2,
  streak: 3,
  bestStreak: 7,
}
const other: Entry = {
  ...me,
  agentID: 102,
  ownerID: 'other',
  versionID: 2,
  side: 'b',
}
describe('proposed ladder matching', () => {
  it('shows raw wins while tempering a tiny sample for matching', () => {
    const newEntry = { ...me, wins: 1, losses: 0, draws: 0 }
    expect(winRate(newEntry)).toBe(1)
    expect(matchingScore(newEntry)).toBeCloseTo(6 / 11)
    expect(winRate({ ...newEntry, wins: 0 })).toBeNull()
    expect(winRate(me)).toBe(.6)
  })
  it('excludes self, same side, other scenarios, inactive and ineligible versions', () => {
    const bad = [
      { ...other, ownerID: me.ownerID },
      { ...other, side: 'a' as const },
      { ...other, scenarioID: 'harbor' },
      { ...other, active: false },
      { ...other, eligible: false },
    ]
    expect(candidatePool(me, [other, ...bad])).toEqual([other])
    expect(candidatePool({ ...me, eligible: false }, [other])).toEqual([])
  })
  it('selects the narrowest available band immediately from stored versions', () => {
    const placement = { ...other, wins: 0, losses: 0, draws: 0 }
    expect(candidatePool(me, [placement])).toEqual([placement])
    expect(candidatePool({ ...me, wins: 0, losses: 0, draws: 0 }, [other]))
      .toEqual([other])
    expect(
      candidatePool({ ...placement, ownerID: 'me', side: 'a' }, [placement]),
    ).toHaveLength(1)
    const fivePoints = { ...other, wins: 20, losses: 8 }
    const tenPoints = { ...other, wins: 22, losses: 6 }
    const twentyPoints = { ...other, wins: 26, losses: 2 }
    expect(candidatePool(me, [fivePoints, tenPoints, twentyPoints])).toEqual(
      [fivePoints],
    )
    expect(candidatePool(me, [tenPoints, twentyPoints]))
      .toEqual([tenPoints])
    expect(candidatePool(me, [twentyPoints])).toEqual([twentyPoints])
    const distant = { ...other, wins: 28, losses: 0 }
    expect(candidatePool(me, [distant])).toEqual([distant])
  })
  it('always returns an available opponent regardless of rating or placement, preserving eligibility', () => {
    const strong = { ...me, wins: 1000, losses: 0, draws: 0 }
    const weak = { ...other, wins: 0, losses: 1000, draws: 0 }
    expect(candidatePool(strong, [weak])).toEqual([weak])
    for (const played of [0, 1, 9, 10, 1000]) {
      const challenger = { ...me, wins: played, losses: 0, draws: 0 }
      expect(candidatePool(challenger, [weak])).toEqual([weak])
    }
    const excluded = [
      { ...weak, ownerID: me.ownerID },
      { ...weak, side: 'a' as const },
      { ...weak, scenarioID: 'another-scene' },
      { ...weak, active: false },
      { ...weak, eligible: false },
    ]
    expect(candidatePool(strong, [weak, ...excluded])).toEqual([weak])
    expect(candidatePool(strong, excluded)).toEqual([])
    expect(candidatePool(strong, [])).toEqual([])
  })
  it('chooses players before versions and handles an empty pool', () => {
    expect(pickOpponent([])).toBeNull()
    const many = Array.from(
      { length: 20 },
      (_, i) => ({ ...other, versionID: i + 10 }),
    )
    const second = { ...other, ownerID: 'second', versionID: 100 }
    expect(pickOpponent([...many, second], () => .75)).toEqual(second)
  })
  it('keeps matching and placement unchanged when an agent changes its entry version', () => {
    const revised = { ...me, versionID: 999 }
    expect(matchingScore(revised)).toBe(matchingScore(me))
    expect(winRate(revised)).toBe(winRate(me))
    expect(candidatePool(revised, [other])).toEqual(candidatePool(me, [other]))
  })
  it('keeps completed draws in totals and ends streaks for losses or draws', () => {
    expect(settle(me, 'win')).toMatchObject({
      wins: 19,
      streak: 4,
      bestStreak: 7,
    })
    expect(settle({ ...me, streak: 7 }, 'win').bestStreak).toBe(8)
    expect(settle(me, 'loss')).toMatchObject({
      losses: 11,
      streak: 0,
      bestStreak: 7,
    })
    expect(settle(me, 'draw')).toMatchObject({ draws: 3, streak: 0 })
    expect(me.wins).toBe(18)
  })
})
