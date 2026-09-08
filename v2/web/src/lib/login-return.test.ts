import { describe, expect, it } from 'vitest'

import { loginReturnPath, protectedLoginUrl } from './login-return'

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
