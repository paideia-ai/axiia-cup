import {
  opponentModeSchema,
  playgroundRunSchema,
  playgroundRunSummarySchema,
} from '@axiia/shared'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../db/client'
import {
  playgroundRuns,
  presetOpponents,
  scenarios,
  submissions,
  tournaments,
} from '../db/schema'
import { kickWorker } from '../engine/worker-signal'
import { parseJsonField } from '../lib/json'
import { requireAuth } from '../middleware/requireAuth'
import { requireWritesUnlocked } from '../middleware/requireWritesUnlocked'

const runRequestSchema = z.object({
  submissionId: z.number().int().positive(),
  opponentMode: opponentModeSchema.optional().default('self'),
  presetOpponentId: z.number().int().positive().optional(),
})

const playgroundRouter = new Hono()

function parseId(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

playgroundRouter.post(
  '/api/playground/run',
  requireAuth,
  requireWritesUnlocked,
  async (context) => {
    const json = await context.req.json().catch(() => null)
    const parsed = runRequestSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const userId = context.get('userId')

    const runningTournament = db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.status, 'running'))
      .get()

    if (runningTournament) {
      return context.json({ error: '比赛进行中，试炼场暂停使用' }, 409)
    }

    const submission = db
      .select()
      .from(submissions)
      .where(eq(submissions.id, parsed.data.submissionId))
      .get()

    if (!submission || submission.userId !== userId) {
      return context.json({ error: 'Submission not found' }, 404)
    }

    if (submission.retiredAt) {
      return context.json({ error: '该 Submission 已封存，不能再运行' }, 409)
    }

    const scenario = db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, submission.scenarioId))
      .get()

    if (!scenario) {
      return context.json({ error: 'Scenario not found' }, 404)
    }

    const { opponentMode, presetOpponentId } = parsed.data

    if (opponentMode === 'preset') {
      if (!presetOpponentId) {
        return context.json({ error: '预设对手模式需要选择一个预设' }, 400)
      }

      const preset = db
        .select()
        .from(presetOpponents)
        .where(eq(presetOpponents.id, presetOpponentId))
        .get()

      if (!preset || preset.scenarioId !== scenario.id) {
        return context.json({ error: '预设对手不存在' }, 404)
      }
    }

    const run = db
      .insert(playgroundRuns)
      .values({
        status: 'queued',
        scenarioId: scenario.id,
        submissionId: submission.id,
        opponentMode,
        presetOpponentId: opponentMode === 'preset' ? presetOpponentId : null,
      })
      .returning()
      .get()

    kickWorker()

    return context.json({ id: run.id, status: 'queued' }, 202)
  },
)

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
        opponentMode: playgroundRuns.opponentMode,
        presetOpponentId: playgroundRuns.presetOpponentId,
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
      rows.map((row) =>
        playgroundRunSummarySchema.parse({
          ...row,
          opponentMode: row.opponentMode ?? 'self',
          presetOpponentId: row.presetOpponentId ?? null,
        }),
      ),
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
        actualPromptA: row.actualPromptA ?? null,
        actualPromptB: row.actualPromptB ?? null,
        infoAssignment: parseJsonField(row.infoAssignment, null),
        judgeDecision: row.judgeDecision ?? null,
        judgeTranscriptA: parseJsonField(row.judgeTranscriptA, []),
        judgeTranscriptB: parseJsonField(row.judgeTranscriptB, []),
        opponentMode: row.opponentMode ?? 'self',
        presetOpponentId: row.presetOpponentId ?? null,
        transcript: parseJsonField(row.transcript, []),
      }),
    )
  },
)

export { playgroundRouter }
