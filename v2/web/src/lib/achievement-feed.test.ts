import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AchievementEventDTO, AchievementsResponse } from '../api/types'
import {
  claimAchievementToast,
  isFreshAchievement,
  readAchievementCursor,
  saveAchievementCursor,
  startAchievementFeed,
} from './achievement-feed'

const event = (
  id: number,
  source: 'live' | 'backfill' = 'live',
): AchievementEventDTO => ({
  id,
  source,
  occurredAt: 1000,
  notificationID: id,
  achievement: {
    id: 'first-win',
    tier: 'bronze',
    unlocked: true,
    title: '初试锋芒',
    flavor: '有人听进去了。',
    description: '赢得你的第一场对局。',
    iconURL: '/achievements/first-win.webp',
    unlockedAt: 1000,
    matchID: 1,
  },
})

const snapshot = (cursor: number): AchievementsResponse => ({
  achievements: [],
  eventCursor: cursor,
})
const flush = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('achievement event delivery', () => {
  it('uses the coherent snapshot cursor and delivers an unlock in the first polling gap', async () => {
    const receive = vi.fn().mockResolvedValue(undefined)
    const saveCursor = vi.fn()
    const events = vi.fn().mockResolvedValue({
      events: [event(11)],
      cursor: 11,
    })
    const feed = startAchievementFeed({
      snapshot: () => Promise.resolve(snapshot(10)),
      events,
      readCursor: () => null,
      saveCursor,
      receive,
    })
    await flush()
    expect(events.mock.calls[0][0]).toBe(10)
    expect(receive).toHaveBeenCalledExactlyOnceWith([event(11)])
    expect(saveCursor).toHaveBeenLastCalledWith(11)
    await vi.advanceTimersByTimeAsync(2000)
    expect(events.mock.calls[1][0]).toBe(11)
    expect(receive).toHaveBeenCalledOnce()
    feed.stop()
  })

  it('resumes after refresh and does not advance past a failed delivery', async () => {
    const events = vi.fn().mockResolvedValue({ events: [event(8)], cursor: 8 })
    const receive = vi.fn().mockRejectedValueOnce(new Error('interrupted'))
      .mockResolvedValue(undefined)
    const saveCursor = vi.fn()
    const feed = startAchievementFeed({
      snapshot: () => Promise.resolve(snapshot(9)),
      events,
      readCursor: () => 7,
      saveCursor,
      receive,
    })
    await flush()
    expect(saveCursor).toHaveBeenLastCalledWith(7)
    await vi.advanceTimersByTimeAsync(2000)
    expect(events.mock.calls.map((call) => call[0])).toEqual([7, 7])
    expect(saveCursor).toHaveBeenLastCalledWith(8)
    feed.stop()
  })

  it('recovers a failed poll without skipping events and delivers batches in ID order', async () => {
    const events = vi.fn().mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ events: [event(13), event(12)], cursor: 13 })
    const receive = vi.fn().mockResolvedValue(undefined)
    const feed = startAchievementFeed({
      snapshot: () => Promise.resolve(snapshot(11)),
      events,
      readCursor: () => null,
      saveCursor: vi.fn(),
      receive,
    })
    await flush()
    await vi.advanceTimersByTimeAsync(2000)
    expect(events.mock.calls.map((call) => call[0])).toEqual([11, 11])
    expect(receive).toHaveBeenCalledExactlyOnceWith([event(12), event(13)])
    feed.stop()
  })

  it('discards late responses on account cleanup and stops timers', async () => {
    let finish!: (
      value: { events: AchievementEventDTO[]; cursor: number },
    ) => void
    const response = new Promise<
      { events: AchievementEventDTO[]; cursor: number }
    >((resolve) => {
      finish = resolve
    })
    const receive = vi.fn().mockResolvedValue(undefined)
    const events = vi.fn((_after: number, _signal: AbortSignal) => response)
    const feed = startAchievementFeed({
      snapshot: () => Promise.resolve(snapshot(0)),
      events,
      readCursor: () => null,
      saveCursor: vi.fn(),
      receive,
    })
    await flush()
    feed.stop()
    finish({ events: [event(1)], cursor: 1 })
    await flush()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(receive).not.toHaveBeenCalled()
    expect(events).toHaveBeenCalledOnce()
    expect(events.mock.calls[0]?.[1]?.aborted).toBe(true)
  })

  it('allows only recent live unlocks to celebrate, retaining all events for data refresh', () => {
    expect(isFreshAchievement(event(1), 1001)).toBe(true)
    expect(isFreshAchievement(event(1), 1121)).toBe(false)
    expect(isFreshAchievement(event(1, 'backfill'), 1001)).toBe(false)
    expect(isFreshAchievement(event(1), 900)).toBe(false)
  })
})

describe('account-scoped cursors and toast receipts', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    const store = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    }
    vi.stubGlobal('localStorage', store)
    vi.stubGlobal('sessionStorage', store)
  })

  it('does not mix cursors between accounts and tolerates corrupt storage', () => {
    saveAchievementCursor('a', 12)
    expect(readAchievementCursor('a')).toBe(12)
    expect(readAchievementCursor('b')).toBeNull()
    sessionStorage.setItem('axiia-achievement-cursor-v1:a', 'NaN')
    expect(readAchievementCursor('a')).toBeNull()
  })

  it('serializes claims, isolates accounts, and does not claim an inactive tab', async () => {
    let tail: Promise<unknown> = Promise.resolve()
    const request = vi.fn((_key: string, claim: () => boolean) => {
      const result = tail.then(claim)
      tail = result
      return result
    })
    vi.stubGlobal('navigator', { locks: { request } })
    expect(await claimAchievementToast('inactive', 20, () => false)).toBe(false)
    expect(await claimAchievementToast('inactive', 20, () => true)).toBe(true)
    const results = await Promise.all([
      claimAchievementToast('race', 20, () => true),
      claimAchievementToast('race', 20, () => true),
    ])
    expect(results).toEqual([true, false])
    expect(await claimAchievementToast('another-account', 20, () => true)).toBe(
      true,
    )
    expect(request).toHaveBeenCalled()
  })

  it('honors receipts from another tab or reload without inspecting notification read status', async () => {
    localStorage.setItem('axiia-achievement-toasts-v1:stored', '[31]')
    expect(await claimAchievementToast('stored', 31, () => true)).toBe(false)
  })
})
