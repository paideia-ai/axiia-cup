import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearDemoResult,
  currentDemoMatch,
  getDemoSnapshot,
  startDemoMatch,
} from './demo-match-store'
import type { Entry } from './matchmaking'
const entry: Entry = {
  agentID: 90,
  versionID: 901,
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
const opponent: Entry = {
  ...entry,
  agentID: 91,
  versionID: 902,
  ownerID: 'other',
  side: 'b',
}
afterEach(() => {
  vi.useRealTimers()
})
describe('asynchronous demo match', () => {
  it('starts without a subscriber or opponent confirmation, pins versions, and settles once', () => {
    vi.useFakeTimers()
    const mutable = { ...entry }
    startDemoMatch(mutable, opponent, 'win')
    expect(currentDemoMatch()?.phase).toBe('watching')
    mutable.wins = 900
    startDemoMatch(
      entry,
      { ...opponent, versionID: 903 },
      'loss',
    )
    clearDemoResult()
    expect(currentDemoMatch()?.opponent.versionID).toBe(902)
    vi.advanceTimersByTime(1500)
    expect(currentDemoMatch()?.round).toBe(1)
    vi.advanceTimersByTime(3000)
    expect(currentDemoMatch()?.phase).toBe('result')
    expect(getDemoSnapshot().records[entry.agentID]).toMatchObject({
      wins: 19,
      losses: 10,
      streak: 4,
    })
    expect(getDemoSnapshot().records[opponent.agentID]).toMatchObject({
      wins: 18,
      losses: 11,
      streak: 0,
    })
    vi.advanceTimersByTime(10000)
    expect(getDemoSnapshot().records[entry.agentID].wins).toBe(19)
    clearDemoResult()
    expect(currentDemoMatch()).toBeNull()
    // A new entry snapshot must continue this same agent's record.
    const revised = {
      ...entry,
      ...getDemoSnapshot().records[entry.agentID],
      versionID: 999,
    }
    startDemoMatch(revised, {
      ...opponent,
      ...getDemoSnapshot().records[opponent.agentID],
    }, 'loss')
    vi.advanceTimersByTime(4500)
    expect(getDemoSnapshot().records[entry.agentID]).toMatchObject({
      wins: 19,
      losses: 11,
      streak: 0,
    })
    expect(getDemoSnapshot().records[entry.versionID]).toBeUndefined()
    expect(getDemoSnapshot().records[revised.versionID]).toBeUndefined()
    clearDemoResult()
  })
})
