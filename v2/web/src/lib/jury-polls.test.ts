import { describe, expect, it } from 'vitest'
import { harborEvent, harborMatch } from '../testing/harbor-fixtures'
import { previousSecretPolls } from './jury-polls'

describe('previous secret polls', () => {
  it('uses event order across movers and within the same round, without mutating turns', () => {
    const first = harborEvent(2, {
      type: 'observer_secret_poll',
      round: 1,
      mover: 'a',
    })
    const second = harborEvent(6, {
      type: 'observer_secret_poll',
      round: 1,
      mover: 'b',
    })
    const third = harborEvent(9, {
      type: 'observer_secret_poll',
      round: 2,
      mover: 'a',
    })
    const turns = [
      third,
      second,
      harborEvent(7, { type: 'motion_votes' }),
      first,
    ]
    const result = previousSecretPolls(turns)
    expect(result.has(2)).toBe(false)
    expect(result.get(6)).toBe(first.event)
    expect(result.get(9)).toBe(second.event)
    expect(turns[0]).toBe(third)
  })
  it('keeps an incomplete immediately preceding poll as the baseline', () => {
    const missing = harborEvent(1, { type: 'observer_secret_poll' })
    const turns = [harborMatch.turns[0], missing, harborMatch.turns[2]]
    expect(previousSecretPolls(turns).get(2)).toBe(missing.event)
  })
  it('only indexes revealed polls and starts fresh for each match', () => {
    expect(previousSecretPolls(harborMatch.turns.slice(0, 2)).size).toBe(0)
    expect(previousSecretPolls(harborMatch.turns).size).toBe(1)
    expect(previousSecretPolls([]).size).toBe(0)
  })
})
