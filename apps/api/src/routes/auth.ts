import {
  changePasswordSchema,
  okResponseSchema,
  updateProfileSchema,
  userSchema,
} from '@axiia/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../db/client'
import { users } from '../db/schema'
import { hashPassword, signToken, verifyPassword } from '../lib/auth'
import { getRegistrationCode } from '../lib/settings'
import { requireAuth } from '../middleware/requireAuth'

const registerBodySchema = z.object({
  email: z.string().email(),
  otp: z.string(),
  password: z.string().min(6),
  displayName: z.string().min(1).optional(),
})

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const publicUserSelection = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  isAdmin: users.isAdmin,
}

const authRouter = new Hono()

authRouter.post('/api/auth/register', async (context) => {
  const json = await context.req.json().catch(() => null)
  const parsed = registerBodySchema.safeParse(json)

  if (!parsed.success) {
    return context.json({ error: 'Invalid request body' }, 400)
  }

  const { displayName, email, otp, password } = parsed.data

  if (otp !== getRegistrationCode()) {
    return context.json({ error: 'Invalid OTP' }, 400)
  }

  const existingUser = db
    .select(publicUserSelection)
    .from(users)
    .where(eq(users.email, email))
    .get()

  if (existingUser) {
    return context.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await hashPassword(password)
  const insertedUser = db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: displayName?.trim() || 'momo',
    })
    .returning(publicUserSelection)
    .get()

  const user = userSchema.parse(insertedUser)
  const token = await signToken({ userId: user.id, isAdmin: user.isAdmin })

  return context.json({ token, user }, 201)
})

authRouter.post('/api/auth/login', async (context) => {
  const json = await context.req.json().catch(() => null)
  const parsed = loginBodySchema.safeParse(json)

  if (!parsed.success) {
    return context.json({ error: 'Invalid request body' }, 400)
  }

  const userRecord = db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .get()

  if (!userRecord) {
    return context.json({ error: 'Invalid email or password' }, 401)
  }

  const isValidPassword = await verifyPassword(
    parsed.data.password,
    userRecord.passwordHash,
  )

  if (!isValidPassword) {
    return context.json({ error: 'Invalid email or password' }, 401)
  }

  const user = userSchema.parse({
    id: userRecord.id,
    email: userRecord.email,
    displayName: userRecord.displayName,
    isAdmin: userRecord.isAdmin,
  })
  const token = await signToken({ userId: user.id, isAdmin: user.isAdmin })

  return context.json({ token, user })
})

authRouter.get('/api/auth/me', requireAuth, async (context) => {
  const userId = context.get('userId')
  const userRecord = db
    .select(publicUserSelection)
    .from(users)
    .where(eq(users.id, userId))
    .get()

  if (!userRecord) {
    return context.json({ error: 'User not found' }, 401)
  }

  return context.json(userSchema.parse(userRecord))
})

authRouter.patch('/api/auth/me', requireAuth, async (context) => {
  const json = await context.req.json().catch(() => null)
  const parsed = updateProfileSchema.safeParse(json)

  if (!parsed.success) {
    return context.json({ error: 'Invalid request body' }, 400)
  }

  const userId = context.get('userId')
  const displayName = parsed.data.displayName.trim()
  const updatedUser = db
    .update(users)
    .set({ displayName })
    .where(eq(users.id, userId))
    .returning(publicUserSelection)
    .get()

  if (!updatedUser) {
    return context.json({ error: 'User not found' }, 401)
  }

  return context.json(userSchema.parse(updatedUser))
})

authRouter.post('/api/auth/password', requireAuth, async (context) => {
  const json = await context.req.json().catch(() => null)
  const parsed = changePasswordSchema.safeParse(json)

  if (!parsed.success) {
    return context.json({ error: 'Invalid request body' }, 400)
  }

  const userId = context.get('userId')
  const userRecord = db.select().from(users).where(eq(users.id, userId)).get()

  if (!userRecord) {
    return context.json({ error: 'User not found' }, 401)
  }

  const passwordMatched = await verifyPassword(
    parsed.data.currentPassword,
    userRecord.passwordHash,
  )

  if (!passwordMatched) {
    return context.json({ error: 'Current password is incorrect' }, 401)
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  db.update(users).set({ passwordHash }).where(eq(users.id, userId)).run()

  return context.json(okResponseSchema.parse({ ok: true }))
})

export { authRouter }
