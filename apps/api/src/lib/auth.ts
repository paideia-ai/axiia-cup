import { compare, hash } from 'bcryptjs'
import { sign, verify } from 'hono/jwt'
import { z } from 'zod'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is required')
  }

  return secret
}

const JWT_SECRET = getJwtSecret()
const JWT_ALGORITHM = 'HS256' as const
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60

const tokenPayloadSchema = z.object({
  userId: z.number().int().positive(),
  isAdmin: z.boolean(),
  exp: z.number().int().positive().optional(),
  iat: z.number().int().positive().optional(),
  nbf: z.number().int().positive().optional(),
})

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, 10)
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plain, passwordHash)
}

export async function signToken(payload: {
  userId: number
  isAdmin: boolean
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  return sign(
    {
      ...payload,
      iat: now,
      exp: now + SEVEN_DAYS_IN_SECONDS,
    },
    JWT_SECRET,
    JWT_ALGORITHM,
  )
}

export async function verifyToken(
  token: string,
): Promise<{ userId: number; isAdmin: boolean } | null> {
  try {
    const payload = await verify(token, JWT_SECRET, JWT_ALGORITHM)
    const parsed = tokenPayloadSchema.safeParse(payload)

    if (!parsed.success) {
      return null
    }

    return {
      userId: parsed.data.userId,
      isAdmin: parsed.data.isAdmin,
    }
  } catch {
    return null
  }
}
