import {
  playgroundRunSchema,
  playgroundRunSummarySchema,
} from "@axiia/shared";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "../db/client";
import { playgroundRuns, scenarios, submissions } from "../db/schema";
import { executeMatchSession } from "../engine/core";
import { requireAuth } from "../middleware/requireAuth";

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const runRequestSchema = z.object({ submissionId: z.number().int().positive() });

const playgroundRouter = new Hono();

playgroundRouter.post("/api/playground/run", requireAuth, async (context) => {
  const json = await context.req.json().catch(() => null);
  const parsed = runRequestSchema.safeParse(json);

  if (!parsed.success) {
    return context.json({ error: "Invalid request body" }, 400);
  }

  const userId = context.get("userId");
  const submission = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, parsed.data.submissionId))
    .get();

  if (!submission || submission.userId !== userId) {
    return context.json({ error: "Submission not found" }, 404);
  }

  const scenario = db
    .select()
    .from(scenarios)
    .where(eq(scenarios.id, submission.scenarioId))
    .get();

  if (!scenario) {
    return context.json({ error: "Scenario not found" }, 404);
  }

  // Create a placeholder run record
  const run = db
    .insert(playgroundRuns)
    .values({
      scenarioId: scenario.id,
      submissionId: submission.id,
    })
    .returning()
    .get();

  const persistRunProgress = (values: Partial<typeof playgroundRuns.$inferInsert>) =>
    db
      .update(playgroundRuns)
      .set(values)
      .where(eq(playgroundRuns.id, run.id))
      .run();

  try {
    const result = await executeMatchSession({
      modelA: submission.model,
      modelB: submission.model,
      onDialogueTurn: (transcript) => {
        persistRunProgress({
          transcript: JSON.stringify(transcript),
        });
      },
      onJudgeTranscriptA: (judgeTranscriptA) => {
        persistRunProgress({
          judgeTranscriptA: JSON.stringify(judgeTranscriptA),
        });
      },
      onJudgeTranscriptB: (judgeTranscriptB) => {
        persistRunProgress({
          judgeTranscriptB: JSON.stringify(judgeTranscriptB),
        });
      },
      promptA: submission.promptA,
      promptB: submission.promptB,
      scenario,
    });

    const updated = db
      .update(playgroundRuns)
      .set({
        judgeTranscriptA: JSON.stringify(result.judgeTranscriptA),
        judgeTranscriptB: JSON.stringify(result.judgeTranscriptB),
        reasoning: result.reasoning,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        transcript: JSON.stringify(result.transcript),
        winner: result.winner,
      })
      .where(eq(playgroundRuns.id, run.id))
      .returning()
      .get();

    return context.json(
      playgroundRunSchema.parse({
        ...updated,
        judgeTranscriptA: parseJsonField(updated.judgeTranscriptA, []),
        judgeTranscriptB: parseJsonField(updated.judgeTranscriptB, []),
        transcript: parseJsonField(updated.transcript, []),
      }),
    );
  } catch (error) {
    db.update(playgroundRuns)
      .set({ error: error instanceof Error ? error.message : "Run failed" })
      .where(eq(playgroundRuns.id, run.id))
      .run();

    return context.json(
      { error: error instanceof Error ? error.message : "Playground run failed" },
      500,
    );
  }
});

playgroundRouter.get("/api/playground/runs/:submissionId", requireAuth, async (context) => {
  const userId = context.get("userId");
  const submissionId = Number(context.req.param("submissionId"));

  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return context.json({ error: "Invalid submission ID" }, 400);
  }

  // Verify ownership
  const submission = db
    .select({ id: submissions.id, userId: submissions.userId })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .get();

  if (!submission || submission.userId !== userId) {
    return context.json({ error: "Submission not found" }, 404);
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
    .all();

  return context.json(rows.map((row) => playgroundRunSummarySchema.parse(row)));
});

playgroundRouter.get("/api/playground/runs/:submissionId/:runId", requireAuth, async (context) => {
  const userId = context.get("userId");
  const submissionId = Number(context.req.param("submissionId"));
  const runId = Number(context.req.param("runId"));

  const submission = db
    .select({ id: submissions.id, userId: submissions.userId })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .get();

  if (!submission || submission.userId !== userId) {
    return context.json({ error: "Submission not found" }, 404);
  }

  const row = db
    .select()
    .from(playgroundRuns)
    .where(eq(playgroundRuns.id, runId))
    .get();

  if (!row || row.submissionId !== submissionId) {
    return context.json({ error: "Run not found" }, 404);
  }

  return context.json(
    playgroundRunSchema.parse({
      ...row,
      judgeTranscriptA: parseJsonField(row.judgeTranscriptA, []),
      judgeTranscriptB: parseJsonField(row.judgeTranscriptB, []),
      transcript: parseJsonField(row.transcript, []),
    }),
  );
});

export { playgroundRouter };
