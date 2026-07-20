import {
  adminScenarioSchema,
  scenarioSchema,
  updateScenarioSchema,
} from '@axiia/shared'
import { and, asc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { scenarios, tournaments } from '../db/schema'
import { parseJsonField } from '../lib/json'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const lockedExpression = sql<number>`exists(
  select 1
  from ${tournaments}
  where ${and(
    eq(tournaments.scenarioId, scenarios.id),
    eq(tournaments.status, 'running'),
  )}
)`.as('locked')

function serializeScenario(row: {
  roleAHiddenInfo: string
  roleAOptions: string
  roleARequests: string
  roleBHiddenInfo: string
  roleBOptions: string
  roleBRequests: string
}) {
  return {
    ...row,
    roleAHiddenInfo: parseJsonField(row.roleAHiddenInfo, []),
    roleAOptions: parseJsonField(row.roleAOptions, []),
    roleARequests: parseJsonField(row.roleARequests, []),
    roleBHiddenInfo: parseJsonField(row.roleBHiddenInfo, []),
    roleBOptions: parseJsonField(row.roleBOptions, []),
    roleBRequests: parseJsonField(row.roleBRequests, []),
  }
}

const scenariosRouter = new Hono()

scenariosRouter.get(
  '/api/admin/scenarios',
  requireAuth,
  requireAdmin,
  (context) => {
    const rows = db
      .select({
        agentPromptTemplate: scenarios.agentPromptTemplate,
        examinationQuestionTemplate: scenarios.examinationQuestionTemplate,
        falseInfoCount: scenarios.falseInfoCount,
        id: scenarios.id,
        judgeModel: scenarios.judgeModel,
        judgeOsPrompt: scenarios.judgeOsPrompt,
        judgePrompt: scenarios.judgePrompt,
        locked: lockedExpression,
        openingLine: scenarios.openingLine,
        roleAHiddenInfo: scenarios.roleAHiddenInfo,
        roleAName: scenarios.roleAName,
        roleAOptions: scenarios.roleAOptions,
        roleARequests: scenarios.roleARequests,
        roleBHiddenInfo: scenarios.roleBHiddenInfo,
        roleBName: scenarios.roleBName,
        roleBOptions: scenarios.roleBOptions,
        roleBRequests: scenarios.roleBRequests,
        scorerModel: scenarios.scorerModel,
        scorerPrompt: scenarios.scorerPrompt,
        subject: scenarios.subject,
        title: scenarios.title,
        trueRequestCount: scenarios.trueRequestCount,
        turnCount: scenarios.turnCount,
      })
      .from(scenarios)
      .orderBy(asc(scenarios.createdAt))
      .all()

    return context.json(
      rows.map((row) =>
        adminScenarioSchema.parse({
          ...serializeScenario(row),
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

      const {
        roleAHiddenInfo,
        roleAOptions,
        roleARequests,
        roleBHiddenInfo,
        roleBOptions,
        roleBRequests,
        ...rest
      } = parsed.data
      tx.update(scenarios)
        .set({
          ...rest,
          roleAHiddenInfo: JSON.stringify(roleAHiddenInfo),
          roleAOptions: JSON.stringify(roleAOptions),
          roleARequests: JSON.stringify(roleARequests),
          roleBHiddenInfo: JSON.stringify(roleBHiddenInfo),
          roleBOptions: JSON.stringify(roleBOptions),
          roleBRequests: JSON.stringify(roleBRequests),
        })
        .where(eq(scenarios.id, id))
        .run()

      const updatedScenario = tx
        .select()
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
          ...serializeScenario(updatedScenario),
          locked: false,
        }),
      }
    })

    if ('status' in result) {
      return context.json({ error: result.error }, result.status)
    }

    return context.json(result.scenario)
  },
)

scenariosRouter.get('/api/scenarios/:id', requireAuth, (context) => {
  const id = context.req.param('id')
  const row = db.select().from(scenarios).where(eq(scenarios.id, id)).get()

  if (!row) {
    return context.json({ error: 'Scenario not found' }, 404)
  }

  return context.json(scenarioSchema.parse(serializeScenario(row)))
})

export { scenariosRouter }
