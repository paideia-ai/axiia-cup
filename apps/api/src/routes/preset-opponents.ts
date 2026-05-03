import {
  createPresetOpponentSchema,
  presetOpponentSchema,
  roleOptionSchema,
  updatePresetOpponentSchema,
} from '@axiia/shared'
import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { presetOpponents, scenarios } from '../db/schema'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const presetOpponentsRouter = new Hono()

function getScenarioRoleOptions(
  scenario: typeof scenarios.$inferSelect,
  role: 'a' | 'b',
) {
  return roleOptionSchema
    .array()
    .parse(
      JSON.parse(role === 'a' ? scenario.roleAOptions : scenario.roleBOptions),
    )
}

function validateRoleOptionId(
  scenario: typeof scenarios.$inferSelect,
  role: 'a' | 'b',
  roleOptionId: string | null | undefined,
) {
  if (!roleOptionId) return null

  const options = getScenarioRoleOptions(scenario, role)

  if (!options.some((option) => option.id === roleOptionId)) {
    throw new Error('Role option not found for this scenario role')
  }

  return roleOptionId
}

// List preset opponents for a scenario (public, for playground selector)
presetOpponentsRouter.get(
  '/api/scenarios/:scenarioId/preset-opponents',
  requireAuth,
  (context) => {
    const scenarioId = context.req.param('scenarioId')

    const rows = db
      .select()
      .from(presetOpponents)
      .where(eq(presetOpponents.scenarioId, scenarioId))
      .orderBy(
        asc(presetOpponents.role),
        asc(presetOpponents.roleOptionId),
        asc(presetOpponents.createdAt),
      )
      .all()

    return context.json(rows.map((row) => presetOpponentSchema.parse(row)))
  },
)

// Create preset opponent (admin)
presetOpponentsRouter.post(
  '/api/admin/preset-opponents',
  requireAuth,
  requireAdmin,
  async (context) => {
    const json = await context.req.json().catch(() => null)
    const parsed = createPresetOpponentSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const scenario = db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, parsed.data.scenarioId))
      .get()

    if (!scenario) {
      return context.json({ error: 'Scenario not found' }, 404)
    }

    let roleOptionId: string | null = null

    try {
      roleOptionId = validateRoleOptionId(
        scenario,
        parsed.data.role,
        parsed.data.roleOptionId,
      )
    } catch (validationError) {
      return context.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : 'Invalid role option',
        },
        400,
      )
    }

    const row = db
      .insert(presetOpponents)
      .values({
        ...parsed.data,
        roleOptionId,
      })
      .returning()
      .get()

    return context.json(presetOpponentSchema.parse(row), 201)
  },
)

// Update preset opponent (admin)
presetOpponentsRouter.put(
  '/api/admin/preset-opponents/:id',
  requireAuth,
  requireAdmin,
  async (context) => {
    const id = Number(context.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return context.json({ error: 'Invalid ID' }, 400)
    }

    const json = await context.req.json().catch(() => null)
    const parsed = updatePresetOpponentSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const existing = db
      .select()
      .from(presetOpponents)
      .where(eq(presetOpponents.id, id))
      .get()

    if (!existing) {
      return context.json({ error: 'Preset opponent not found' }, 404)
    }

    db.update(presetOpponents)
      .set(parsed.data)
      .where(eq(presetOpponents.id, id))
      .run()

    const updated = db
      .select()
      .from(presetOpponents)
      .where(eq(presetOpponents.id, id))
      .get()

    return context.json(presetOpponentSchema.parse(updated!))
  },
)

// Delete preset opponent (admin)
presetOpponentsRouter.delete(
  '/api/admin/preset-opponents/:id',
  requireAuth,
  requireAdmin,
  (context) => {
    const id = Number(context.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return context.json({ error: 'Invalid ID' }, 400)
    }

    const existing = db
      .select({ id: presetOpponents.id })
      .from(presetOpponents)
      .where(eq(presetOpponents.id, id))
      .get()

    if (!existing) {
      return context.json({ error: 'Preset opponent not found' }, 404)
    }

    db.delete(presetOpponents).where(eq(presetOpponents.id, id)).run()

    return context.json({ ok: true })
  },
)

export { presetOpponentsRouter }
