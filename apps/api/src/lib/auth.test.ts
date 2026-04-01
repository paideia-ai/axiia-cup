import { describe, expect, it } from 'bun:test'
import { verify } from 'hono/jwt'

import { signToken, verifyToken } from './auth'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'

describe('auth utilities', () => {
  it('signs and verifies a token round-trip', async () => {
    const payload = { userId: 42, isAdmin: true }

    const token = await signToken(payload)
    const verified = await verifyToken(token)

    expect(verified).toEqual(payload)
  })

  it('returns null for a tampered token', async () => {
    const token = await signToken({ userId: 7, isAdmin: false })
    const tamperedToken = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`

    const verified = await verifyToken(tamperedToken)

    expect(verified).toBeNull()
  })

  it('returns null for a garbage string', async () => {
    const verified = await verifyToken('definitely-not-a-jwt')

    expect(verified).toBeNull()
  })

  it('includes the correct userId and isAdmin fields in the token', async () => {
    const token = await signToken({ userId: 99, isAdmin: false })
    const payload = await verify(token, JWT_SECRET, 'HS256')

    expect(payload).toMatchObject({
      userId: 99,
      isAdmin: false,
    })
  })
})
