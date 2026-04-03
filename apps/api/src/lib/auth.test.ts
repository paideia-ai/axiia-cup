import { beforeAll, describe, expect, it } from 'bun:test'
import { verify } from 'hono/jwt'

const JWT_SECRET = 'test-jwt-secret'
process.env.JWT_SECRET = JWT_SECRET

let signToken: (typeof import('./auth'))['signToken']
let verifyToken: (typeof import('./auth'))['verifyToken']

beforeAll(async () => {
  const auth = await import('./auth')
  signToken = auth.signToken
  verifyToken = auth.verifyToken
})

describe('auth utilities', () => {
  it('signs and verifies a token round-trip', async () => {
    const payload = { userId: 42, isAdmin: true }

    const token = await signToken(payload)
    const verified = await verifyToken(token)

    expect(verified).toEqual(payload)
  })

  it('returns null for a tampered token', async () => {
    const token = await signToken({ userId: 7, isAdmin: false })
    const parts = token.split('.')
    // Flip a character in the middle of the signature to reliably break it
    const sig = parts[2]
    const mid = Math.floor(sig.length / 2)
    const flipped = sig[mid] === 'A' ? 'B' : 'A'
    parts[2] = sig.slice(0, mid) + flipped + sig.slice(mid + 1)
    const tamperedToken = parts.join('.')

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
