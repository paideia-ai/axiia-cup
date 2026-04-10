import {
  opponentModeSchema,
  playgroundRunProgressSchema,
  playgroundRunSchema,
  playgroundRunSummarySchema,
} from '@axiia/shared'
import { and, desc, eq, or, sql } from 'drizzle-orm'
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
import {
  interruptActivePlaygroundRun,
  PLAYGROUND_RUN_INTERRUPTED_MESSAGE,
} from '../engine/playground-interrupt'
import { kickWorker } from '../engine/worker-signal'
import { parseJsonField } from '../lib/json'
import { resolveUserId } from '../lib/resolve-user'
import { requireAuth } from '../middleware/requireAuth'
import { requireWritesUnlocked } from '../middleware/requireWritesUnlocked'

const runRequestSchema = z.object({
  submissionId: z.number().int().positive(),
  opponentMode: opponentModeSchema.optional().default('self'),
  presetOpponentId: z.number().int().positive().optional(),
})

const playgroundRouter = new Hono()

function nowIso() {
  return new Date().toISOString()
}

function parseId(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function serializePlaygroundRun(row: typeof playgroundRuns.$inferSelect) {
  return playgroundRunSchema.parse({
    ...row,
    actualPromptA: row.actualPromptA ?? null,
    actualPromptB: row.actualPromptB ?? null,
    infoAssignment: parseJsonField(row.infoAssignment, null),
    judgeDecision: row.judgeDecision ?? null,
    judgeTranscriptA: parseJsonField(row.judgeTranscriptA, []),
    judgeTranscriptB: parseJsonField(row.judgeTranscriptB, []),
    opponentMode: row.opponentMode ?? 'self',
    presetOpponentId: row.presetOpponentId ?? null,
    presetOpponentRole: row.presetOpponentRole ?? null,
    presetOpponentLabel: row.presetOpponentLabel ?? null,
    transcript: parseJsonField(row.transcript, []),
    startedAt: row.startedAt ?? null,
    finishedAt: row.finishedAt ?? null,
    updatedAt: row.updatedAt ?? row.createdAt,
  })
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
    let selectedPreset: typeof presetOpponents.$inferSelect | null = null

    if (opponentMode === 'preset') {
      if (!presetOpponentId) {
        return context.json({ error: '预设对手模式需要选择一个预设' }, 400)
      }

      selectedPreset =
        db
        .select()
        .from(presetOpponents)
        .where(eq(presetOpponents.id, presetOpponentId))
        .get()
        ?? null

      if (!selectedPreset || selectedPreset.scenarioId !== scenario.id) {
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
        presetOpponentRole:
          opponentMode === 'preset' ? selectedPreset?.role ?? null : null,
        presetOpponentLabel:
          opponentMode === 'preset' ? selectedPreset?.label ?? null : null,
        updatedAt: nowIso(),
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
    const userId = resolveUserId(context)
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
  '/api/playground/runs/:submissionId/:runId/status',
  requireAuth,
  async (context) => {
    const userId = resolveUserId(context)
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
      .select({
        id: playgroundRuns.id,
        status: playgroundRuns.status,
        submissionId: playgroundRuns.submissionId,
        updatedAt: sql<string>`coalesce(${playgroundRuns.updatedAt}, ${playgroundRuns.createdAt})`,
      })
      .from(playgroundRuns)
      .where(eq(playgroundRuns.id, runId))
      .get()

    if (!row || row.submissionId !== submissionId) {
      return context.json({ error: 'Run not found' }, 404)
    }

    return context.json(
      playgroundRunProgressSchema.parse(row),
    )
  },
)

playgroundRouter.get(
  '/api/playground/runs/:submissionId/:runId',
  requireAuth,
  async (context) => {
    const userId = resolveUserId(context)
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

    return context.json(serializePlaygroundRun(row))
  },
)

playgroundRouter.post(
  '/api/playground/runs/:submissionId/:runId/interrupt',
  requireAuth,
  async (context) => {
    const userId = resolveUserId(context)
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

    const run = db
      .select()
      .from(playgroundRuns)
      .where(eq(playgroundRuns.id, runId))
      .get()

    if (!run || run.submissionId !== submissionId) {
      return context.json({ error: 'Run not found' }, 404)
    }

    if (run.status === 'scored' || run.status === 'error') {
      return context.json(serializePlaygroundRun(run))
    }

    interruptActivePlaygroundRun(runId)

    const interruptedAt = nowIso()
    const interruptedRun = db
      .update(playgroundRuns)
      .set({
        error: PLAYGROUND_RUN_INTERRUPTED_MESSAGE,
        finishedAt: interruptedAt,
        leaseToken: null,
        status: 'error',
        updatedAt: interruptedAt,
      })
      .where(
        and(
          eq(playgroundRuns.id, runId),
          eq(playgroundRuns.submissionId, submissionId),
          or(
            eq(playgroundRuns.status, 'queued'),
            eq(playgroundRuns.status, 'running'),
          ),
        ),
      )
      .returning()
      .get()

    if (!interruptedRun) {
      const currentRun = db
        .select()
        .from(playgroundRuns)
        .where(eq(playgroundRuns.id, runId))
        .get()

      if (!currentRun || currentRun.submissionId !== submissionId) {
        return context.json({ error: 'Run not found' }, 404)
      }

      return context.json(serializePlaygroundRun(currentRun))
    }

    return context.json(serializePlaygroundRun(interruptedRun))
  },
)

export { playgroundRouter }
