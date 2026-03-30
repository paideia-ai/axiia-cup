import { createSubmissionSchema, playgroundResultSchema } from "@axiia/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../db/client";
import { scenarios } from "../db/schema";
import { executeMatchSession } from "../engine/core";
import { requireAuth } from "../middleware/requireAuth";

const playgroundRouter = new Hono();

playgroundRouter.post("/api/playground/run", requireAuth, async (context) => {
  const json = await context.req.json().catch(() => null);
  const parsed = createSubmissionSchema.safeParse(json);

  if (!parsed.success) {
    return context.json({ error: "Invalid request body" }, 400);
  }

  const scenario = db.select().from(scenarios).where(eq(scenarios.id, parsed.data.scenarioId)).get();

  if (!scenario) {
    return context.json({ error: "Scenario not found" }, 404);
  }

  try {
    const result = await executeMatchSession({
      modelA: parsed.data.model,
      modelB: parsed.data.model,
      promptA: parsed.data.promptA,
      promptB: parsed.data.promptB,
      scenario,
    });

    return context.json(
      playgroundResultSchema.parse({
        judgeTranscriptA: result.judgeTranscriptA,
        judgeTranscriptB: result.judgeTranscriptB,
        reasoning: result.reasoning,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        transcript: result.transcript,
        winner: result.winner,
      }),
    );
  } catch (error) {
    return context.json(
      { error: error instanceof Error ? error.message : "Playground run failed" },
      500,
    );
  }
});

export { playgroundRouter };
