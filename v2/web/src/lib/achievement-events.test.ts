import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { claimAchievementPresentation } from './achievement-events'

const event = {
  sequence: 7,
  achievement: {
    slot: 0,
    tier: '铜' as const,
    unlocked: true,
    id: 'first-word',
  },
}
let focused = true
let hidden = false

beforeEach(() => {
  focused = true
  hidden = false
  const values = new Map<string, string>()
  vi.stubGlobal('document', {
    get hidden() {
      return hidden
    },
    hasFocus: () => focused,
  })
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  let pending = Promise.resolve()
  vi.stubGlobal('navigator', {
    locks: {
      request: (_key: string, body: () => boolean) => {
        const result = pending.then(body)
        pending = result.then(() => {})
        return result
      },
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

it('claims one presentation across simultaneous tabs and scopes it to the account', async () => {
  const claims = await Promise.all(
    Array.from(
      { length: 5 },
      () => claimAchievementPresentation('alice', event),
    ),
  )
  expect(claims.filter(Boolean)).toHaveLength(1)
  expect(await claimAchievementPresentation('bob', event)).toBe(true)
})

it('does not consume an event in a hidden or unfocused tab', async () => {
  hidden = true
  expect(await claimAchievementPresentation('alice', event)).toBe(false)
  hidden = false
  focused = false
  expect(await claimAchievementPresentation('alice', event)).toBe(false)
  focused = true
  expect(await claimAchievementPresentation('alice', event)).toBe(true)
})
