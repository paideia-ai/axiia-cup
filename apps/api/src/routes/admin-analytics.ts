import {
  adminAnalyticsAgentDetailSchema,
  adminAnalyticsAgentSummarySchema,
  adminAnalyticsBattleSchema,
  analyticsBattleModeSchema,
  analyticsBattleSourceSchema,
} from '@axiia/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../db/client'
import { llmCalls, matches, playgroundRuns, scenarios, submissions } from '../db/schema'
import {
  getAnalyticsAgentDetail,
  listAnalyticsBattles,
  listUserAnalyticsAgentSummaries,
} from '../lib/analytics'
import { parseJsonField } from '../lib/json'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const adminAnalyticsRouter = new Hono()

function parsePositiveInt(value: string | undefined) {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const battlesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
  mode: analyticsBattleModeSchema.optional(),
  side: z.enum(['a', 'b']).optional(),
  source: analyticsBattleSourceSchema.optional(),
  status: z.enum(['queued', 'running', 'judging', 'scored', 'error']).optional(),
  submissionId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
})

adminAnalyticsRouter.get(
  '/api/admin/analytics/battles',
  requireAuth,
  requireAdmin,
  (context) => {
    const parsed = battlesQuerySchema.safeParse(context.req.query())

    if (!parsed.success) {
      return context.json({ error: 'Invalid query parameters' }, 400)
    }

    const battles = listAnalyticsBattles(parsed.data)

    return context.json(battles.map((battle) => adminAnalyticsBattleSchema.parse(battle)))
  },
)

adminAnalyticsRouter.get(
  '/api/admin/analytics/users/:id/agents',
  requireAuth,
  requireAdmin,
  (context) => {
    const userId = parsePositiveInt(context.req.param('id'))

    if (!userId) {
      return context.json({ error: 'Invalid user id' }, 400)
    }

    const summaries = listUserAnalyticsAgentSummaries(userId)

    return context.json(
      summaries.map((summary) => adminAnalyticsAgentSummarySchema.parse(summary)),
    )
  },
)

adminAnalyticsRouter.get(
  '/api/admin/analytics/agents/:submissionId/:side/summary',
  requireAuth,
  requireAdmin,
  (context) => {
    const submissionId = parsePositiveInt(context.req.param('submissionId'))
    const side = context.req.param('side')

    if (!submissionId) {
      return context.json({ error: 'Invalid submission id' }, 400)
    }

    if (side !== 'a' && side !== 'b') {
      return context.json({ error: 'Invalid side' }, 400)
    }

    const detail = getAnalyticsAgentDetail(submissionId, side)

    if (!detail) {
      return context.json({ error: 'Agent not found' }, 404)
    }

    return context.json(adminAnalyticsAgentDetailSchema.parse(detail))
  },
)

adminAnalyticsRouter.get(
  '/api/admin/analytics/battles/:source/:id/export',
  requireAuth,
  requireAdmin,
  (context) => {
    const source = context.req.param('source')
    const id = parsePositiveInt(context.req.param('id'))

    if (source !== 'tournament' && source !== 'playground') {
      return context.json({ error: 'Invalid source' }, 400)
    }

    if (!id) {
      return context.json({ error: 'Invalid battle id' }, 400)
    }

    const summary =
      listAnalyticsBattles({ source }).find((battle) => battle.id === id) ?? null

    if (source === 'tournament') {
      const match = db.select().from(matches).where(eq(matches.id, id)).get()

      if (!match) {
        return context.json({ error: 'Battle not found' }, 404)
      }

      const submissionA = db
        .select()
        .from(submissions)
        .where(eq(submissions.id, match.subAId))
        .get()
      const submissionB = db
        .select()
        .from(submissions)
        .where(eq(submissions.id, match.subBId))
        .get()
      const scenario = db
        .select()
        .from(scenarios)
        .where(eq(scenarios.id, match.scenarioId))
        .get()
      const calls = db
        .select()
        .from(llmCalls)
        .where(eq(llmCalls.matchId, id))
        .all()

      return context.json({
        kind: 'tournament_battle',
        exportedAt: new Date().toISOString(),
        summary,
        match: {
          ...match,
          infoAssignment: parseJsonField(match.infoAssignment, null),
          judgeDecision: match.judgeDecision ?? null,
          judgeTranscriptA: parseJsonField(match.judgeTranscriptA, []),
          judgeTranscriptB: parseJsonField(match.judgeTranscriptB, []),
          transcript: parseJsonField(match.transcript, []),
        },
        submissionA,
        submissionB,
        scenario,
        llmCalls: calls.map((call) => ({
          ...call,
          requestJson: parseJsonField(call.requestJson, null),
          responseJson: parseJsonField(call.responseJson, null),
        })),
      })
    }

    const run = db.select().from(playgroundRuns).where(eq(playgroundRuns.id, id)).get()

    if (!run) {
      return context.json({ error: 'Battle not found' }, 404)
    }

    const submission = db
      .select()
      .from(submissions)
      .where(eq(submissions.id, run.submissionId))
      .get()
    const scenario = db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, run.scenarioId))
      .get()
    const calls = db
      .select()
      .from(llmCalls)
      .where(eq(llmCalls.playgroundRunId, id))
      .all()

    return context.json({
      kind: 'playground_battle',
      exportedAt: new Date().toISOString(),
      summary,
      run: {
        ...run,
        infoAssignment: parseJsonField(run.infoAssignment, null),
        judgeDecision: run.judgeDecision ?? null,
        judgeTranscriptA: parseJsonField(run.judgeTranscriptA, []),
        judgeTranscriptB: parseJsonField(run.judgeTranscriptB, []),
        transcript: parseJsonField(run.transcript, []),
      },
      submission,
      scenario,
      llmCalls: calls.map((call) => ({
        ...call,
        requestJson: parseJsonField(call.requestJson, null),
        responseJson: parseJsonField(call.responseJson, null),
      })),
    })
  },
)

export { adminAnalyticsRouter }
