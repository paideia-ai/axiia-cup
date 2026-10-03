import { describe, expect, it } from 'vitest'
import { freshAchievementEvents } from './achievement-events'
import { renderSound, SoundPolicy } from './sound'

describe('achievement delivery', () => {
  it('orders new awards and excludes old inventory and cursor replays', () => {
    const event = (id: number, earnedAt: number) => ({
      slot: id,
      tier: '铜' as const,
      id: `award-${id}`,
      eventID: id,
      earnedAt,
    })
    expect(
      freshAchievementEvents(
        [event(4, 99), event(2, 99), event(3, 20), event(1, 99)],
        1,
        100,
      ).map((row) => row.eventID),
    ).toEqual([2, 4])
  })
  it('has a finite bounded achievement cue and deduplicates events', () => {
    const samples = renderSound('achievement', 48000)
    expect(samples.length).toBe(40800)
    expect(
      samples.every((value) =>
        Number.isFinite(value) && Math.abs(value) <= 0.85
      ),
    ).toBe(true)
    const policy = new SoundPolicy()
    expect(policy.accept('achievement', 'account:1', 0)).toBe(true)
    expect(policy.accept('achievement', 'account:1', 2000)).toBe(false)
  })
})
