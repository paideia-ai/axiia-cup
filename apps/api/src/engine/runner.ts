import { and, eq } from 'drizzle-orm'
import type {
  InfoAssignment,
  JudgeOsEntry,
  JudgeQA,
  TranscriptTurn,
} from '@axiia/shared'

import { db } from '../db/client'
import {
  matches,
  rounds,
  scenarios,
  submissions,
  tournaments,
} from '../db/schema'
import { parseJsonField } from '../lib/json'
import { maybeAdvanceRound, syncRoundStatus } from '../lib/tournaments'
import { executeMatchSession } from './core'
import { resolveScenarioRoleOptions } from './scenario-options'

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
  signal?: AbortSignal,
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

  if (subA.retiredAt || subB.retiredAt) {
    await updateLeasedMatch(matchId, leaseToken, {
      error: 'Match includes archived submissions',
      finishedAt: new Date().toISOString(),
      leaseToken: null,
      status: 'error',
    })
    return
  }

  let transcript = parseJsonField<TranscriptTurn[]>(match.transcript, [])
  let judgeOs = parseJsonField<JudgeOsEntry[]>(match.judgeOs, [])
  let judgeTranscriptA = parseJsonField<JudgeQA[]>(match.judgeTranscriptA, [])
  let judgeTranscriptB = parseJsonField<JudgeQA[]>(match.judgeTranscriptB, [])
  const infoAssignment = parseJsonField<InfoAssignment | null>(
    match.infoAssignment,
    null,
  )

  // Check for tournament-level model override
  const round = db
    .select()
    .from(rounds)
    .where(eq(rounds.id, match.roundId))
    .get()
  const tournament = round
    ? db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, round.tournamentId))
        .get()
    : null
  const modelA = tournament?.modelOverride ?? subA.modelA
  const modelB = tournament?.modelOverride ?? subB.modelB

  try {
    const resolvedScenario = resolveScenarioRoleOptions(scenario, {
      roleAOptionId: subA.roleAOptionId,
      roleBOptionId: subB.roleBOptionId,
    })

    const result = await executeMatchSession({
      infoAssignment: infoAssignment ?? undefined,
      judgeOs,
      judgeTranscriptA,
      judgeTranscriptB,
      matchId,
      modelA,
      modelB,
      onDialogueTurn: async (nextTranscript) => {
        transcript = nextTranscript
        await updateLeasedMatch(matchId, leaseToken, {
          currentTurn: nextTranscript.length,
          transcript: JSON.stringify(nextTranscript),
        })
      },
      onInfoAssignment: async (assignment) => {
        await updateLeasedMatch(matchId, leaseToken, {
          infoAssignment: JSON.stringify(assignment),
        })
      },
      onJudgeOs: async (nextJudgeOs) => {
        judgeOs = nextJudgeOs
        await updateLeasedMatch(matchId, leaseToken, {
          judgeOs: JSON.stringify(nextJudgeOs),
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
      scenario: resolvedScenario,
      signal,
      transcript,
      userIdA: subA.userId,
      userIdB: subB.userId,
    })

    await updateLeasedMatch(matchId, leaseToken, {
      error: null,
      finishedAt: new Date().toISOString(),
      infoAssignment: JSON.stringify(result.infoAssignment),
      judgeDecision: result.judgeDecision,
      judgeOs: JSON.stringify(result.judgeOs),
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
      judgeOs: JSON.stringify(judgeOs),
      judgeTranscriptA: JSON.stringify(judgeTranscriptA),
      judgeTranscriptB: JSON.stringify(judgeTranscriptB),
      leaseToken: null,
      status: 'error',
      transcript: JSON.stringify(transcript),
    })
  }
}
