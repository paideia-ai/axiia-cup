import { afterEach, describe, expect, it, vi } from 'vitest'
import { config, scenario } from '../testing/v34-fixtures'
import {
  firstBattlePreset,
  readFirstBattleAttempt,
  writeFirstBattleAttempt,
} from './first-battle'

afterEach(() => vi.unstubAllGlobals())

describe('first battle dispatch identity', () => {
  it('uses the complete configured tuple and never silently substitutes a preset', () => {
    const configured = {
      ...config,
      expressPreset: {
        scenarioID: scenario.summary.id,
        side: 'b' as const,
        presetKey: 'ganlong-steady',
      },
    }
    expect(firstBattlePreset(configured, scenario, 'a')).toBe('ganlong-steady')
    for (
      const expressPreset of [
        { ...configured.expressPreset, scenarioID: 'another-scenario' },
        { ...configured.expressPreset, side: 'a' as const },
        { ...configured.expressPreset, presetKey: 'removed-preset' },
      ]
    ) {
      expect(() =>
        firstBattlePreset({ ...config, expressPreset }, scenario, 'a')
      ).toThrow()
    }
  })

  it('retains the documented default only when the preset is genuinely absent', () => {
    const absent = { ...config, expressPreset: undefined }
    expect(firstBattlePreset(absent, scenario, 'a')).toBe('ganlong-steady')
    expect(() => firstBattlePreset(absent, scenario, 'b')).toThrow()
    expect(() =>
      firstBattlePreset(absent, {
        ...scenario,
        summary: { ...scenario.summary, id: 'another-scenario' },
      }, 'a')
    ).toThrow()
  })

  it('retains uncertain and accepted requests across remounts without sharing accounts or agents', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    })
    const pending = {
      versionID: 123,
      presetKey: 'npc',
      status: 'pending' as const,
    }
    writeFirstBattleAttempt('owner-a:1', pending)
    expect(readFirstBattleAttempt('owner-a:1')).toEqual(pending)
    expect(readFirstBattleAttempt('owner-b:1')).toBeNull()
    expect(readFirstBattleAttempt('owner-a:2')).toBeNull()
    writeFirstBattleAttempt('owner-a:1', {
      ...pending,
      status: 'accepted',
      matchID: 456,
    })
    expect(readFirstBattleAttempt('owner-a:1')?.matchID).toBe(456)
    writeFirstBattleAttempt('owner-a:1', null)
    expect(readFirstBattleAttempt('owner-a:1')).toBeNull()
  })

  it('does not discard malformed or unavailable attempt state and silently enable another POST', () => {
    vi.stubGlobal('sessionStorage', { getItem: () => '{broken' })
    expect(() => readFirstBattleAttempt('owner:1')).toThrow()
    vi.stubGlobal('sessionStorage', {
      setItem: () => {
        throw new Error('unavailable')
      },
    })
    expect(() =>
      writeFirstBattleAttempt('owner:1', {
        versionID: 1,
        presetKey: 'npc',
        status: 'pending',
      })
    ).toThrow()
  })
})
