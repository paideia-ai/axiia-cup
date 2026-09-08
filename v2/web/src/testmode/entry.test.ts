import { describe, expect, it } from 'vitest'

import {
  fixtureNicknameState,
  sameOriginAppPath,
  testModeEntryTarget,
} from './entry'

describe('Test Mode handoff entry', () => {
  it('reads a pinned journey and step while ignoring unrelated query data', () => {
    expect(
      testModeEntryTarget(
        '?tm=1&tmJourney=HV-B3-OWNER-EA&tmStep=HV-B3-OWNER-EA-S03&from=manual',
      ),
    ).toEqual({
      journeyId: 'HV-B3-OWNER-EA',
      stepId: 'HV-B3-OWNER-EA-S03',
    })
  })

  it('requires a journey and permits a journey-only entry', () => {
    expect(testModeEntryTarget('?tmStep=orphan')).toBeNull()
    expect(testModeEntryTarget('?tmJourney=HV-A5-OS-CORE')).toEqual({
      journeyId: 'HV-A5-OS-CORE',
    })
  })

  it('keeps product fixture links in-app and rejects another origin', () => {
    expect(
      sameOriginAppPath(
        'https://axiia.example/agents/224?view=versions#v2',
        'https://axiia.example',
      ),
    ).toBe('/agents/224?view=versions#v2')
    expect(
      sameOriginAppPath(
        'https://manual.example/agents/224',
        'https://axiia.example',
      ),
    ).toBeNull()
  })
})

describe('Test Mode fixture nickname hint', () => {
  const required = ['B3 人测·完整所有者', 'B3 人测·访客缺侧']

  it('matches any product account role required by a multi-account step', () => {
    expect(fixtureNicknameState('B3 人测·完整所有者', required)).toBe('match')
    expect(fixtureNicknameState('B3 人测·访客缺侧', required)).toBe('match')
  })

  it('distinguishes a wrong account from an unavailable account context', () => {
    expect(fixtureNicknameState('普通玩家', required)).toBe('mismatch')
    expect(fixtureNicknameState(null, required)).toBe('unknown')
    expect(fixtureNicknameState('普通玩家', [])).toBe('unknown')
  })
})
