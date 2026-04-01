import { playgroundRunSchema, playgroundRunSummarySchema } from '@axiia/shared'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../db/client'
import { playgroundRuns, scenarios, submissions } from '../db/schema'
import { kickWorker } from '../engine/worker-signal'
import { parseJsonField } from '../lib/json'
import { requireAuth } from '../middleware/requireAuth'

const runRequestSchema = z.object({ submissionId: z.number().int().positive() })

const playgroundRouter = new Hono()

function parseId(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

playgroundRouter.post('/api/playground/run', requireAuth, async (context) => {
  const json = await context.req.json().catch(() => null)
  const parsed = runRequestSchema.safeParse(json)

  if (!parsed.success) {
    return context.json({ error: 'Invalid request body' }, 400)
  }

  const userId = context.get('userId')
  const submission = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, parsed.data.submissionId))
    .get()

  if (!submission || submission.userId !== userId) {
    return context.json({ error: 'Submission not found' }, 404)
  }

  const scenario = db
    .select()
    .from(scenarios)
    .where(eq(scenarios.id, submission.scenarioId))
    .get()

  if (!scenario) {
    return context.json({ error: 'Scenario not found' }, 404)
  }

  const run = db
    .insert(playgroundRuns)
    .values({
      status: 'queued',
      scenarioId: scenario.id,
      submissionId: submission.id,
    })
    .returning()
    .get()

  kickWorker()

  return context.json({ id: run.id, status: 'queued' }, 202)
})

playgroundRouter.get(
  '/api/playground/runs/:submissionId',
  requireAuth,
  async (context) => {
    const userId = context.get('userId')
    const submissionId = parseId(context.req.param('submissionId'))

    if (!submissionId) {
      return context.json({ error: 'Invalid submission ID' }, 400)
    }

    // Verify ownership
    const submission = db
      .select({ id: submissions.id, userId: submissions.userId })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .get()

    if (!submission || submission.userId !== userId) {
      return context.json({ error: 'Submission not found' }, 404)
    }

    const rows = db
      .select({
        createdAt: playgroundRuns.createdAt,
        error: playgroundRuns.error,
        id: playgroundRuns.id,
        scoreA: playgroundRuns.scoreA,
        scoreB: playgroundRuns.scoreB,
        submissionId: playgroundRuns.submissionId,
        winner: playgroundRuns.winner,
      })
      .from(playgroundRuns)
      .where(eq(playgroundRuns.submissionId, submissionId))
      .orderBy(desc(playgroundRuns.createdAt))
      .all()

    return context.json(
      rows.map((row) => playgroundRunSummarySchema.parse(row)),
    )
  },
)

playgroundRouter.get(
  '/api/playground/runs/:submissionId/:runId',
  requireAuth,
  async (context) => {
    const userId = context.get('userId')
    const submissionId = parseId(context.req.param('submissionId'))
    const runId = parseId(context.req.param('runId'))

    if (!submissionId) {
      return context.json({ error: 'Invalid submission ID' }, 400)
    }

    if (!runId) {
      return context.json({ error: 'Invalid run ID' }, 400)
    }

    const submission = db
      .select({ id: submissions.id, userId: submissions.userId })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .get()

    if (!submission || submission.userId !== userId) {
      return context.json({ error: 'Submission not found' }, 404)
    }

    const row = db
      .select()
      .from(playgroundRuns)
      .where(eq(playgroundRuns.id, runId))
      .get()

    if (!row || row.submissionId !== submissionId) {
      return context.json({ error: 'Run not found' }, 404)
    }

    return context.json(
      playgroundRunSchema.parse({
        ...row,
        judgeTranscriptA: parseJsonField(row.judgeTranscriptA, []),
        judgeTranscriptB: parseJsonField(row.judgeTranscriptB, []),
        transcript: parseJsonField(row.transcript, []),
      }),
    )
  },
)

export { playgroundRouter }
