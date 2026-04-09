import { describe, expect, it } from 'bun:test'

import { resolveUserId } from './resolve-user'

function mockContext(opts: {
  userId: number
  isAdmin?: boolean
  asUserId?: string
}) {
  return {
    get(key: string) {
      if (key === 'userId') return opts.userId
      if (key === 'isAdmin') return opts.isAdmin ?? false
      return undefined
    },
    req: {
      query(key: string) {
        if (key === 'asUserId') return opts.asUserId
        return undefined
      },
    },
  } as Parameters<typeof resolveUserId>[0]
}

describe('resolveUserId', () => {
  it('returns own userId for non-admin', () => {
    const ctx = mockContext({ userId: 5, isAdmin: false, asUserId: '99' })
    expect(resolveUserId(ctx)).toBe(5)
  })

  it('returns own userId for admin without asUserId', () => {
    const ctx = mockContext({ userId: 1, isAdmin: true })
    expect(resolveUserId(ctx)).toBe(1)
  })

  it('returns overridden userId for admin with valid asUserId', () => {
    const ctx = mockContext({ userId: 1, isAdmin: true, asUserId: '42' })
    expect(resolveUserId(ctx)).toBe(42)
  })

  it('ignores non-integer asUserId', () => {
    const ctx = mockContext({ userId: 1, isAdmin: true, asUserId: '3.5' })
    expect(resolveUserId(ctx)).toBe(1)
  })

  it('ignores zero asUserId', () => {
    const ctx = mockContext({ userId: 1, isAdmin: true, asUserId: '0' })
    expect(resolveUserId(ctx)).toBe(1)
  })

  it('ignores negative asUserId', () => {
    const ctx = mockContext({ userId: 1, isAdmin: true, asUserId: '-1' })
    expect(resolveUserId(ctx)).toBe(1)
  })

  it('ignores non-numeric asUserId', () => {
    const ctx = mockContext({ userId: 1, isAdmin: true, asUserId: 'abc' })
    expect(resolveUserId(ctx)).toBe(1)
  })
})
