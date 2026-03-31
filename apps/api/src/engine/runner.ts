import { and, eq } from 'drizzle-orm'
import type { JudgeQA, TranscriptTurn } from '@axiia/shared'

import { db } from '../db/client'
import { matches, scenarios, submissions } from '../db/schema'
import { maybeAdvanceRound, syncRoundStatus } from '../lib/tournaments'
import { executeMatchSession } from './core'

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

async function updateLeasedMatch(
  matchId: number,
  leaseToken: string,
  values: Partial<typeof matches.$inferInsert>,
) {
  db.update(matches)
    .set({
      ...values,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(matches.id, matchId), eq(matches.leaseToken, leaseToken)))
    .run()
}

export async function runMatch(
  matchId: number,
  leaseToken: string,
): Promise<void> {
  const match = db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.leaseToken, leaseToken)))
    .get()

  if (!match || (match.status !== 'running' && match.status !== 'judging')) {
    return
  }

  const scenario = db
    .select()
    .from(scenarios)
    .where(eq(scenarios.id, match.scenarioId))
    .get()
  const subA = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, match.subAId))
    .get()
  const subB = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, match.subBId))
    .get()

  if (!scenario || !subA || !subB) {
    await updateLeasedMatch(matchId, leaseToken, {
      error: 'Missing scenario or submissions for match',
      finishedAt: new Date().toISOString(),
      leaseToken: null,
      status: 'error',
    })
    return
  }

  let transcript = parseJsonField<TranscriptTurn[]>(match.transcript, [])
  let judgeTranscriptA = parseJsonField<JudgeQA[]>(match.judgeTranscriptA, [])
  let judgeTranscriptB = parseJsonField<JudgeQA[]>(match.judgeTranscriptB, [])

  try {
    const result = await executeMatchSession({
      judgeTranscriptA,
      judgeTranscriptB,
      modelA: subA.model,
      modelB: subB.model,
      onDialogueTurn: async (nextTranscript) => {
        transcript = nextTranscript
        await updateLeasedMatch(matchId, leaseToken, {
          currentTurn: nextTranscript.length,
          transcript: JSON.stringify(nextTranscript),
        })
      },
      onJudgeTranscriptA: async (nextJudgeTranscriptA) => {
        judgeTranscriptA = nextJudgeTranscriptA
        await updateLeasedMatch(matchId, leaseToken, {
          judgeTranscriptA: JSON.stringify(nextJudgeTranscriptA),
        })
      },
      onJudgeTranscriptB: async (nextJudgeTranscriptB) => {
        judgeTranscriptB = nextJudgeTranscriptB
        await updateLeasedMatch(matchId, leaseToken, {
          judgeTranscriptB: JSON.stringify(nextJudgeTranscriptB),
        })
      },
      onJudgingStart: async (nextTranscript) => {
        await updateLeasedMatch(matchId, leaseToken, {
          currentTurn: nextTranscript.length,
          status: 'judging',
          transcript: JSON.stringify(nextTranscript),
        })
      },
      onStart: async () => {
        await updateLeasedMatch(matchId, leaseToken, {
          startedAt: match.startedAt ?? new Date().toISOString(),
          status: 'running',
        })
      },
      promptA: subA.promptA,
      promptB: subB.promptB,
      scenario,
      transcript,
    })

    await updateLeasedMatch(matchId, leaseToken, {
      error: null,
      finishedAt: new Date().toISOString(),
      judgeTranscriptA: JSON.stringify(result.judgeTranscriptA),
      judgeTranscriptB: JSON.stringify(result.judgeTranscriptB),
      leaseToken: null,
      reasoning: result.reasoning,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      status: 'scored',
      transcript: JSON.stringify(result.transcript),
      winner: result.winner,
    })

    syncRoundStatus(match.roundId)
    maybeAdvanceRound(match.roundId)
  } catch (error) {
    await updateLeasedMatch(matchId, leaseToken, {
      error: error instanceof Error ? error.message : 'Unknown engine failure',
      finishedAt: new Date().toISOString(),
      judgeTranscriptA: JSON.stringify(judgeTranscriptA),
      judgeTranscriptB: JSON.stringify(judgeTranscriptB),
      leaseToken: null,
      status: 'error',
      transcript: JSON.stringify(transcript),
    })
  }
}
