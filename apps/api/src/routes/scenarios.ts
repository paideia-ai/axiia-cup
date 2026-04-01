import { scenarioSchema } from '@axiia/shared'
import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { scenarios } from '../db/schema'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const publicScenarioSelection = {
  boundaryConstraints: scenarios.boundaryConstraints,
  context: scenarios.context,
  id: scenarios.id,
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

const scenariosRouter = new Hono()

scenariosRouter.get(
  '/api/admin/scenarios',
  requireAuth,
  requireAdmin,
  (context) => {
    const rows = db
      .select(publicScenarioSelection)
      .from(scenarios)
      .orderBy(asc(scenarios.createdAt))
      .all()

    return context.json(rows.map((row) => scenarioSchema.parse(row)))
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
