import { describe, expect, it } from 'vitest'

import {
  loginReturnPath,
  protectedLoginUrl,
  registrationReturnPath,
} from './login-return'

describe('protected login return path', () => {
  it('round-trips a Test Mode journey, step, and hash through login', () => {
    const destination = {
      pathname: '/agents/224',
      search: '?tmJourney=HV-B3-OWNER-EA&tmStep=HV-B3-OWNER-EA-S03',
      hash: '#versions',
    }

    const login = protectedLoginUrl(destination)

    expect(login).toBe(
      '/login?next=%2Fagents%2F224%3FtmJourney%3DHV-B3-OWNER-EA%26tmStep%3DHV-B3-OWNER-EA-S03%23versions',
    )
    expect(loginReturnPath(login.slice('/login'.length))).toBe(
      '/agents/224?tmJourney=HV-B3-OWNER-EA&tmStep=HV-B3-OWNER-EA-S03#versions',
    )
  })

  it.each([
    '',
    '?next=https%3A%2F%2Fevil.example',
    '?next=%2F%2Fevil.example',
    '?next=%2F%5Cevil.example',
    '?next=%2Flogin%3Fnext%3D%252Fagents%252F224',
    '?next=%2Fregister',
  ])('falls back for an unsafe or guest-only destination: %s', (search) => {
    expect(loginReturnPath(search)).toBe('/scenarios')
  })
})

describe('registrationReturnPath', () => {
  it('sends a new account to its own first battle despite a previous account next', () => {
    expect(registrationReturnPath('?next=%2Fscenarios', false)).toBe('/express')
    expect(registrationReturnPath('?next=%2Fagents%2F12', false)).toBe(
      '/express',
    )
    expect(registrationReturnPath('?next=%2Fmatches%2F42', false)).toBe(
      '/express',
    )
  })

  it('preserves an explicitly selected scenario build entry', () => {
    const entry = '/agents/entry?scenario=scene-a&side=b&target=build'
    expect(registrationReturnPath(
      `?next=${encodeURIComponent(entry)}`,
      false,
    )).toBe(entry)
    expect(registrationReturnPath(
      '?next=%2Fscenarios%2Fscene-a%2Fbuild%3Fside%3Db',
      false,
    )).toBe('/scenarios/scene-a/build?side=b')
  })

  it('preserves normal return paths for accounts with a finished first battle', () => {
    expect(registrationReturnPath('?next=%2Fmatches%2F42', true)).toBe(
      '/matches/42',
    )
    expect(registrationReturnPath('', true)).toBe('/scenarios')
  })
})
