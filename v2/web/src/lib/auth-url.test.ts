import { describe, expect, it } from 'vitest'

import { authUrl, inviteFromSearch } from './auth-url'
import { loginReturnPath, registrationReturnPath } from './login-return'

describe('poster invite auth links', () => {
  it.each(['', '?other=axiia_cup', '?invite=', '?invite=%20%20'])(
    'keeps ordinary visits manual: %s',
    (search) => {
      expect(inviteFromSearch(search)).toBe('')
      expect(authUrl('/login', search)).toBe('/login')
      expect(authUrl('/register', search)).toBe('/register')
    },
  )

  it('trims and encodes invites without turning their contents into parameters', () => {
    const invite = '活动 & invite=自定义+/?#'
    const search = `?invite=${encodeURIComponent(`  ${invite}  `)}&utm=poster`
    const link = authUrl('/register', search)
    expect(inviteFromSearch(search)).toBe(invite)
    expect(new URLSearchParams(link.split('?')[1]).get('invite')).toBe(invite)
    expect(new URLSearchParams(link.split('?')[1]).size).toBe(1)
  })

  it('round-trips invite and a build entry through login and registration', () => {
    const next = '/agents/entry?scenario=scene-a&side=b&target=build#strategy'
    const search = `?${new URLSearchParams({ invite: 'axiia_cup', next })}`
    const login = authUrl('/login', search)
    const register = authUrl('/register', login.slice('/login'.length))
    const returnedSearch = register.slice('/register'.length)
    expect(inviteFromSearch(returnedSearch)).toBe('axiia_cup')
    expect(loginReturnPath(returnedSearch)).toBe(next)
    expect(registrationReturnPath(returnedSearch, false)).toBe(next)
    expect(authUrl('/login', returnedSearch)).toBe(login)
  })

  it('keeps new-account onboarding and existing-account return rules', () => {
    const link = authUrl('/register', '?invite=axiia_cup&next=%2Fmatches%2F42')
    const search = link.slice('/register'.length)
    expect(registrationReturnPath(search, false)).toBe('/express')
    expect(registrationReturnPath(search, true)).toBe('/matches/42')
    expect(authUrl('/register', '?next=%2Fmatches%2F42')).toBe(
      '/register?next=%2Fmatches%2F42',
    )
  })

  it.each([
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/login?next=/matches/42',
    '/register',
    '/matches/42\n',
  ])('preserves the existing safe fallback for next=%j', (next) => {
    const link = authUrl(
      '/register',
      `?${new URLSearchParams({ invite: 'axiia_cup', next })}`,
    )
    const search = link.slice('/register'.length)
    expect(inviteFromSearch(search)).toBe('axiia_cup')
    expect(loginReturnPath(search)).toBe('/scenarios')
    expect(registrationReturnPath(search, false)).toBe('/express')
  })
})
