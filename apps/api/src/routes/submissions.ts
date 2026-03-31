import { createSubmissionSchema, submissionSchema } from '@axiia/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { scenarios, submissions } from '../db/schema'
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

  return context.json(submissionSchema.parse(createdSubmission), 201)
})

export { submissionsRouter }
