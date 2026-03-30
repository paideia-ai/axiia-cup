import { eq } from "drizzle-orm";
import type { JudgeQA, TranscriptTurn } from "@axiia/shared";

import { db } from "../db/client";
import { matches, scenarios, submissions } from "../db/schema";
import { syncRoundStatus } from "../lib/tournaments";
import { executeMatchSession } from "./core";

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function updateMatch(matchId: number, values: Partial<typeof matches.$inferInsert>) {
  db.update(matches).set(values).where(eq(matches.id, matchId)).run();
}

export async function runMatch(matchId: number): Promise<void> {
  const match = db.select().from(matches).where(eq(matches.id, matchId)).get();

  if (!match || (match.status !== "queued" && match.status !== "running" && match.status !== "judging")) {
    return;
  }

  const scenario = db.select().from(scenarios).where(eq(scenarios.id, match.scenarioId)).get();
  const subA = db.select().from(submissions).where(eq(submissions.id, match.subAId)).get();
  const subB = db.select().from(submissions).where(eq(submissions.id, match.subBId)).get();

  if (!scenario || !subA || !subB) {
    await updateMatch(matchId, {
      error: "Missing scenario or submissions for match",
      status: "error",
    });
    return;
  }

  let transcript = parseJsonField<TranscriptTurn[]>(match.transcript, []);
  let judgeTranscriptA = parseJsonField<JudgeQA[]>(match.judgeTranscriptA, []);
  let judgeTranscriptB = parseJsonField<JudgeQA[]>(match.judgeTranscriptB, []);

  try {
    const result = await executeMatchSession({
      judgeTranscriptA,
      judgeTranscriptB,
      modelA: subA.model,
      modelB: subB.model,
      onDialogueTurn: async (nextTranscript) => {
        transcript = nextTranscript;
        await updateMatch(matchId, {
          currentTurn: nextTranscript.length,
          transcript: JSON.stringify(nextTranscript),
        });
      },
      onJudgeTranscriptA: async (nextJudgeTranscriptA) => {
        judgeTranscriptA = nextJudgeTranscriptA;
        await updateMatch(matchId, {
          judgeTranscriptA: JSON.stringify(nextJudgeTranscriptA),
        });
      },
      onJudgeTranscriptB: async (nextJudgeTranscriptB) => {
        judgeTranscriptB = nextJudgeTranscriptB;
        await updateMatch(matchId, {
          judgeTranscriptB: JSON.stringify(nextJudgeTranscriptB),
        });
      },
      onJudgingStart: async (nextTranscript) => {
        await updateMatch(matchId, {
          currentTurn: nextTranscript.length,
          status: "judging",
          transcript: JSON.stringify(nextTranscript),
        });
      },
      onStart: async () => {
        await updateMatch(matchId, {
          startedAt: match.startedAt ?? new Date().toISOString(),
          status: "running",
        });
      },
      promptA: subA.promptA,
      promptB: subB.promptB,
      scenario,
      transcript,
    });

    await updateMatch(matchId, {
      error: null,
      finishedAt: new Date().toISOString(),
      judgeTranscriptA: JSON.stringify(result.judgeTranscriptA),
      judgeTranscriptB: JSON.stringify(result.judgeTranscriptB),
      reasoning: result.reasoning,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      status: "scored",
      transcript: JSON.stringify(result.transcript),
      winner: result.winner,
    });

    syncRoundStatus(match.roundId);
  } catch (error) {
    await updateMatch(matchId, {
      error: error instanceof Error ? error.message : "Unknown engine failure",
      judgeTranscriptA: JSON.stringify(judgeTranscriptA),
      judgeTranscriptB: JSON.stringify(judgeTranscriptB),
      status: "error",
      transcript: JSON.stringify(transcript),
    });
  }
}
