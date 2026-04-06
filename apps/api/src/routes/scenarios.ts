import {
  adminScenarioSchema,
  scenarioSchema,
  updateScenarioSchema,
} from '@axiia/shared'
import { and, asc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { scenarios, tournaments } from '../db/schema'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const publicScenarioSelection = {
  boundaryConstraints: scenarios.boundaryConstraints,
  context: scenarios.context,
  id: scenarios.id,
  judgeName: scenarios.judgeName,
  judgePrompt: scenarios.judgePrompt,
  judgeRounds: scenarios.judgeRounds,
  roleAName: scenarios.roleAName,
  roleAPublicGoal: scenarios.roleAPublicGoal,
  roleBName: scenarios.roleBName,
  roleBPublicGoal: scenarios.roleBPublicGoal,
  subject: scenarios.subject,
  title: scenarios.title,
  turnCount: scenarios.turnCount,
}

const adminScenarioSelection = {
  ...publicScenarioSelection,
  locked: sql<number>`exists(
    select 1
    from ${tournaments}
    where ${and(
      eq(tournaments.scenarioId, scenarios.id),
      eq(tournaments.status, 'running'),
    )}
  )`.as('locked'),
}

const scenariosRouter = new Hono()

scenariosRouter.get(
  '/api/admin/scenarios',
  requireAuth,
  requireAdmin,
  (context) => {
    const rows = db
      .select(adminScenarioSelection)
      .from(scenarios)
      .orderBy(asc(scenarios.createdAt))
      .all()

    return context.json(
      rows.map((row) =>
        adminScenarioSchema.parse({
          ...row,
          locked: Boolean(row.locked),
        }),
      ),
    )
  },
)

scenariosRouter.put(
  '/api/admin/scenarios/:id',
  requireAuth,
  requireAdmin,
  async (context) => {
    const id = context.req.param('id')
    const json = await context.req.json().catch(() => null)
    const parsed = updateScenarioSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const result = db.transaction((tx) => {
      const runningTournament = tx
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tournaments)
        .where(
          and(
            eq(tournaments.scenarioId, id),
            eq(tournaments.status, 'running'),
          ),
        )
        .get()

      if ((runningTournament?.count ?? 0) > 0) {
        return {
          error: '比赛进行中，无法编辑',
          status: 423 as const,
        }
      }

      const existingScenario = tx
        .select({ id: scenarios.id })
        .from(scenarios)
        .where(eq(scenarios.id, id))
        .get()

      if (!existingScenario) {
        return {
          error: 'Scenario not found',
          status: 404 as const,
        }
      }

      tx.update(scenarios).set(parsed.data).where(eq(scenarios.id, id)).run()

      const updatedScenario = tx
        .select(adminScenarioSelection)
        .from(scenarios)
        .where(eq(scenarios.id, id))
        .get()

      if (!updatedScenario) {
        return {
          error: 'Scenario not found',
          status: 404 as const,
        }
      }

      return {
        scenario: adminScenarioSchema.parse({
          ...updatedScenario,
          locked: Boolean(updatedScenario.locked),
        }),
      }
    })

    if ('status' in result) {
      return context.json({ error: result.error }, result.status)
    }

    return context.json(result.scenario)
  },
)

scenariosRouter.get('/api/scenarios/:id', (context) => {
  const id = context.req.param('id')
  const row = db
    .select(publicScenarioSelection)
    .from(scenarios)
    .where(eq(scenarios.id, id))
    .get()

  if (!row) {
    return context.json({ error: 'Scenario not found' }, 404)
  }

  return context.json(scenarioSchema.parse(row))
})

export { scenariosRouter }
