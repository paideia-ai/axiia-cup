import { createSubmissionSchema, submissionSchema } from '@axiia/shared'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'

import { db, sqlite } from '../db/client'
import { scenarios, submissions, tournaments } from '../db/schema'
import { requireAuth } from '../middleware/requireAuth'

const submissionSelection = {
  createdAt: submissions.createdAt,
  id: submissions.id,
  model: submissions.model,
  promptA: submissions.promptA,
  promptB: submissions.promptB,
  scenarioId: submissions.scenarioId,
  version: submissions.version,
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('SQLITE_CONSTRAINT_UNIQUE') ||
      error.message.includes('UNIQUE constraint failed'))
  )
}

const submissionsRouter = new Hono()

submissionsRouter.get('/api/submissions/my', requireAuth, (context) => {
  const userId = context.get('userId')
  const rows = db
    .select(submissionSelection)
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt))
    .all()

  return context.json(rows.map((row) => submissionSchema.parse(row)))
})

submissionsRouter.get(
  '/api/submissions/my/:scenarioId',
  requireAuth,
  (context) => {
    const userId = context.get('userId')
    const scenarioId = context.req.param('scenarioId')
    const rows = db
      .select(submissionSelection)
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.scenarioId, scenarioId),
        ),
      )
      .orderBy(desc(submissions.version))
      .all()

    return context.json(rows.map((row) => submissionSchema.parse(row)))
  },
)

submissionsRouter.post('/api/submissions', requireAuth, async (context) => {
  const json = await context.req.json().catch(() => null)
  const parsed = createSubmissionSchema.safeParse(json)

  if (!parsed.success) {
    return context.json({ error: 'Invalid request body' }, 400)
  }

  const userId = context.get('userId')
  const { model, promptA, promptB, scenarioId } = parsed.data

  const scenario = db
    .select({ id: scenarios.id })
    .from(scenarios)
    .where(eq(scenarios.id, scenarioId))
    .get()

  if (!scenario) {
    return context.json({ error: 'Scenario not found' }, 404)
  }

  const activeTournament = db
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.scenarioId, scenarioId),
        inArray(tournaments.status, ['running', 'open']),
      ),
    )
    .get()

  if (activeTournament) {
    return context.json({ error: '比赛进行中，无法提交新版本' }, 403)
  }

  sqlite.exec('BEGIN IMMEDIATE')

  try {
    const latestSubmission = db
      .select({ version: submissions.version })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.scenarioId, scenarioId),
        ),
      )
      .orderBy(desc(submissions.version))
      .get()

    const version = (latestSubmission?.version ?? 0) + 1
    const createdSubmission = db
      .insert(submissions)
      .values({
        model,
        promptA,
        promptB,
        scenarioId,
        userId,
        version,
      })
      .returning(submissionSelection)
      .get()

    sqlite.exec('COMMIT')

    return context.json(submissionSchema.parse(createdSubmission), 201)
  } catch (error) {
    sqlite.exec('ROLLBACK')

    if (isUniqueConstraintError(error)) {
      return context.json(
        { error: 'Submission version already exists for this scenario' },
        409,
      )
    }

    throw error
  }
})

export { submissionsRouter }
