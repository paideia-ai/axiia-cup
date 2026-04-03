import {
  adminUserSchema,
  okResponseSchema,
  resetPasswordSchema,
} from '@axiia/shared'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../db/client'
import { users } from '../db/schema'
import { hashPassword } from '../lib/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const adminUsersRouter = new Hono()

const userIdParamSchema = z.coerce.number().int().positive()

const adminUserSelection = {
  createdAt: users.createdAt,
  disabled: users.disabled,
  displayName: users.displayName,
  email: users.email,
  id: users.id,
  isAdmin: users.isAdmin,
}

adminUsersRouter.get('/api/admin/users', requireAuth, requireAdmin, (context) => {
  const rows = db
    .select(adminUserSelection)
    .from(users)
    .orderBy(desc(users.createdAt), desc(users.id))
    .all()

  return context.json(rows.map((row) => adminUserSchema.parse(row)))
})

adminUsersRouter.patch(
  '/api/admin/users/:id/disable',
  requireAuth,
  requireAdmin,
  (context) => {
    const parsedUserId = userIdParamSchema.safeParse(context.req.param('id'))

    if (!parsedUserId.success) {
      return context.json({ error: 'Invalid user id' }, 400)
    }

    const userRecord = db
      .select({
        disabled: users.disabled,
        id: users.id,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, parsedUserId.data))
      .get()

    if (!userRecord) {
      return context.json({ error: 'User not found' }, 404)
    }

    if (userRecord.isAdmin) {
      return context.json({ error: 'Admin users cannot be disabled' }, 403)
    }

    const updatedUser = db
      .update(users)
      .set({ disabled: !userRecord.disabled })
      .where(eq(users.id, userRecord.id))
      .returning(adminUserSelection)
      .get()

    if (!updatedUser) {
      return context.json({ error: 'User not found' }, 404)
    }

    return context.json(adminUserSchema.parse(updatedUser))
  },
)

adminUsersRouter.post(
  '/api/admin/users/:id/reset-password',
  requireAuth,
  requireAdmin,
  async (context) => {
    const parsedUserId = userIdParamSchema.safeParse(context.req.param('id'))

    if (!parsedUserId.success) {
      return context.json({ error: 'Invalid user id' }, 400)
    }

    const json = await context.req.json().catch(() => null)
    const parsed = resetPasswordSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const userRecord = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, parsedUserId.data))
      .get()

    if (!userRecord) {
      return context.json({ error: 'User not found' }, 404)
    }

    const passwordHash = await hashPassword(parsed.data.password)

    db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userRecord.id))
      .run()

    return context.json(okResponseSchema.parse({ ok: true }))
  },
)

export { adminUsersRouter }
