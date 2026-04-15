import {
  adminErroredMatchSchema,
  computeSwissRounds,
  matchDetailSchema,
  matchProgressSchema,
  okResponseSchema,
  tournamentDetailSchema,
  tournamentRoundSchema,
  tournamentSchema,
} from '@axiia/shared'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '../db/client'
import {
  matches,
  rounds,
  scenarios,
  submissions,
  tournaments,
  users,
} from '../db/schema'
import { kickWorker } from '../engine/worker-signal'
import { parseJsonField } from '../lib/json'
import {
  advanceToNextRound,
  createRoundWithMatches,
  extractByeSubmissionIds,
  getLatestScenarioPlayers,
  getLatestScenarioPlayerPrompts,
  getLeaderboard,
  getRoundTerminalState,
  getTournamentDetail,
  listTournaments,
  terminateTournament,
} from '../lib/tournaments'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'
import { requireWritesUnlocked } from '../middleware/requireWritesUnlocked'

const startTournamentSchema = z.object({
  scenarioId: z.string().min(1),
  totalRounds: z.number().int().positive().optional(),
})

const startCustomSchema = z.object({
  scenarioId: z.string().min(1),
  submissionIds: z.array(z.number().int().positive()).min(2),
  totalRounds: z.number().int().positive(),
})

const createRoundSchema = z.object({
  pairs: z
    .array(z.tuple([z.number().int().positive(), z.number().int().positive()]))
    .min(1),
})

const tournamentRouter = new Hono()
const detailSubA = alias(submissions, 'detail_sub_a')
const detailSubB = alias(submissions, 'detail_sub_b')
const detailUserA = alias(users, 'detail_user_a')
const detailUserB = alias(users, 'detail_user_b')

function listErroredMatches(tournamentId?: number) {
  const erroredMatches = db
    .select({
      createdAt: matches.createdAt,
      error: matches.error,
      id: matches.id,
      playerADisplayName: detailUserA.displayName,
      playerAModel: detailSubA.modelA,
      playerBDisplayName: detailUserB.displayName,
      playerBModel: detailSubB.modelB,
      roundId: matches.roundId,
      roundNumber: rounds.roundNumber,
      scenarioId: matches.scenarioId,
      scenarioTitle: scenarios.title,
      status: matches.status,
      tournamentId: rounds.tournamentId,
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .innerJoin(scenarios, eq(matches.scenarioId, scenarios.id))
    .innerJoin(detailSubA, eq(matches.subAId, detailSubA.id))
    .innerJoin(detailSubB, eq(matches.subBId, detailSubB.id))
    .innerJoin(detailUserA, eq(detailSubA.userId, detailUserA.id))
    .innerJoin(detailUserB, eq(detailSubB.userId, detailUserB.id))
    .where(
      tournamentId
        ? and(
            eq(rounds.tournamentId, tournamentId),
            eq(matches.status, 'error'),
          )
        : eq(matches.status, 'error'),
    )
    .orderBy(desc(matches.createdAt), desc(matches.id))
    .all()

  return erroredMatches.map((match) => adminErroredMatchSchema.parse(match))
}

function parseId(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function shuffle<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = temp
  }

  return next
}

tournamentRouter.get(
  '/api/admin/tournaments/players',
  requireAuth,
  requireAdmin,
  (context) => {
    const scenarioId = context.req.query('scenarioId')

    if (!scenarioId) {
      return context.json({ error: 'scenarioId is required' }, 400)
    }

    const players = getLatestScenarioPlayers(scenarioId)

    return context.json(players)
  },
)

tournamentRouter.get(
  '/api/admin/tournaments/players/prompts',
  requireAuth,
  requireAdmin,
  (context) => {
    const scenarioId = context.req.query('scenarioId')

    if (!scenarioId) {
      return context.json({ error: 'scenarioId is required' }, 400)
    }

    const players = getLatestScenarioPlayerPrompts(scenarioId)

    return context.json(players)
  },
)

tournamentRouter.post(
  '/api/admin/tournaments/start',
  requireAuth,
  requireAdmin,
  requireWritesUnlocked,
  async (context) => {
    const json = await context.req.json().catch(() => null)
    const parsed = startTournamentSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const scenario = db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, parsed.data.scenarioId))
      .get()

    if (!scenario) {
      return context.json({ error: 'Scenario not found' }, 404)
    }

    try {
      const {
        byeSubmissions,
        matches: createdMatches,
        round,
        tournament: updatedTournament,
      } = db.transaction((tx) => {
        const existingRunningTournament = tx
          .select({ id: tournaments.id })
          .from(tournaments)
          .where(
            and(
              eq(tournaments.scenarioId, parsed.data.scenarioId),
              eq(tournaments.status, 'running'),
            ),
          )
          .get()

        if (existingRunningTournament) {
          throw new Error('A tournament is already running for this scenario')
        }

        const tournament = tx
          .insert(tournaments)
          .values({
            currentRound: 0,
            scenarioId: parsed.data.scenarioId,
            status: 'running',
            ...(parsed.data.totalRounds
              ? { totalRounds: parsed.data.totalRounds }
              : {}),
          })
          .returning()
          .get()

        const players = getLatestScenarioPlayers(
          parsed.data.scenarioId,
          tournament.createdAt,
        )

        if (players.length < 2) {
          throw new Error('At least 2 submissions are required')
        }

        const playerIds = shuffle(players.map((player) => player.submissionId))
        const pairs: Array<[number, number]> = []

        for (let index = 0; index + 1 < playerIds.length; index += 2) {
          pairs.push([playerIds[index], playerIds[index + 1]])
        }

        const computedByeSubmissions = extractByeSubmissionIds(playerIds, pairs)
        const { matches: roundMatches, round: createdRound } =
          createRoundWithMatches(
            {
              pairs,
              roundNumber: 1,
              scenarioId: parsed.data.scenarioId,
              tournamentId: tournament.id,
            },
            tx,
          )

        const finalizedTournament = tx
          .update(tournaments)
          .set({
            currentRound: 1,
            ...(parsed.data.totalRounds
              ? {}
              : { totalRounds: computeSwissRounds(players.length) }),
          })
          .where(eq(tournaments.id, tournament.id))
          .returning()
          .get()

        return {
          byeSubmissions: computedByeSubmissions,
          matches: roundMatches,
          round: createdRound,
          tournament: finalizedTournament,
        }
      })

      kickWorker()

      return context.json({
        byeSubmissions,
        matches: createdMatches,
        round: tournamentRoundSchema.parse({
          byeSubmissions,
          id: round.id,
          matches: createdMatches,
          roundNumber: round.roundNumber,
          status: round.status,
          tournamentId: round.tournamentId,
        }),
        tournament: tournamentSchema.parse(updatedTournament),
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'At least 2 submissions are required'
      ) {
        return context.json({ error: error.message }, 400)
      }

      if (
        error instanceof Error &&
        error.message === 'A tournament is already running for this scenario'
      ) {
        return context.json({ error: '当前场景已有进行中的比赛' }, 409)
      }

      throw error
    }
  },
)

tournamentRouter.post(
  '/api/admin/tournaments/start-custom',
  requireAuth,
  requireAdmin,
  requireWritesUnlocked,
  async (context) => {
    const json = await context.req.json().catch(() => null)
    const parsed = startCustomSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const scenario = db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, parsed.data.scenarioId))
      .get()

    if (!scenario) {
      return context.json({ error: 'Scenario not found' }, 404)
    }

    const existingRunning = db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(
        and(
          eq(tournaments.scenarioId, parsed.data.scenarioId),
          eq(tournaments.status, 'running'),
        ),
      )
      .get()

    if (existingRunning) {
      return context.json({ error: '当前场景已有进行中的比赛' }, 409)
    }

    const allPlayers = getLatestScenarioPlayers(parsed.data.scenarioId)
    const validSubIds = new Set(allPlayers.map((p) => p.submissionId))

    const invalidIds = parsed.data.submissionIds.filter(
      (id) => !validSubIds.has(id),
    )

    if (invalidIds.length > 0) {
      return context.json(
        { error: `Invalid submission IDs: ${invalidIds.join(', ')}` },
        400,
      )
    }

    const selectedPlayers = allPlayers.filter((p) =>
      parsed.data.submissionIds.includes(p.submissionId),
    )

    const tournament = db
      .insert(tournaments)
      .values({
        scenarioId: parsed.data.scenarioId,
        status: 'running',
        currentRound: 0,
        totalRounds: parsed.data.totalRounds,
        pairingMode: 'manual',
      })
      .returning()
      .get()

    return context.json({
      tournament: tournamentSchema.parse(tournament),
      players: selectedPlayers,
    })
  },
)

tournamentRouter.post(
  '/api/admin/tournaments/:id/create-round',
  requireAuth,
  requireAdmin,
  requireWritesUnlocked,
  async (context) => {
    const tournamentId = parseId(context.req.param('id'))

    if (!tournamentId) {
      return context.json({ error: 'Invalid tournament id' }, 400)
    }

    const json = await context.req.json().catch(() => null)
    const parsed = createRoundSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const tournament = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .get()

    if (!tournament) {
      return context.json({ error: 'Tournament not found' }, 404)
    }

    if (tournament.status !== 'running') {
      return context.json({ error: 'Tournament is not running' }, 400)
    }

    if (tournament.pairingMode !== 'manual') {
      return context.json(
        { error: 'Only manual-pairing tournaments support create-round' },
        400,
      )
    }

    // Check current round is complete (or no rounds yet)
    if (tournament.currentRound > 0) {
      const currentRound = db
        .select()
        .from(rounds)
        .where(
          and(
            eq(rounds.tournamentId, tournamentId),
            eq(rounds.roundNumber, tournament.currentRound),
          ),
        )
        .get()

      if (currentRound) {
        const state = getRoundTerminalState(currentRound.id)

        if (!state.isDone) {
          return context.json(
            { error: 'Current round is not yet complete' },
            400,
          )
        }

        if (state.hasErrors) {
          return context.json(
            {
              error:
                'Current round has errored matches — retry or skip them first',
            },
            400,
          )
        }
      }
    }

    // Validate submission IDs in pairs
    const allSubIds = parsed.data.pairs.flat()
    const uniqueSubIds = new Set(allSubIds)

    if (uniqueSubIds.size !== allSubIds.length) {
      return context.json({ error: 'Duplicate submission IDs in pairs' }, 400)
    }

    const foundSubs = db
      .select({ id: submissions.id, retiredAt: submissions.retiredAt })
      .from(submissions)
      .where(inArray(submissions.id, [...uniqueSubIds]))
      .all()

    if (foundSubs.length !== uniqueSubIds.size) {
      return context.json({ error: 'Some submission IDs not found' }, 400)
    }

    if (foundSubs.some((s) => s.retiredAt !== null)) {
      return context.json({ error: 'Some submissions are archived' }, 400)
    }

    const nextRoundNumber = tournament.currentRound + 1

    const { round: createdRound, matches: createdMatches } =
      createRoundWithMatches({
        pairs: parsed.data.pairs,
        roundNumber: nextRoundNumber,
        scenarioId: tournament.scenarioId,
        tournamentId,
      })

    const updatedTournament = db
      .update(tournaments)
      .set({ currentRound: nextRoundNumber })
      .where(eq(tournaments.id, tournamentId))
      .returning()
      .get()

    // Collect player IDs from all pairs to compute byes
    const allPlayers = getLatestScenarioPlayers(
      tournament.scenarioId,
      tournament.createdAt,
    )
    const allPlayerIds = allPlayers.map((p) => p.submissionId)
    const byeSubmissions = extractByeSubmissionIds(
      allPlayerIds,
      parsed.data.pairs,
    )

    kickWorker()

    return context.json({
      byeSubmissions,
      matches: createdMatches,
      round: tournamentRoundSchema.parse({
        byeSubmissions,
        id: createdRound.id,
        matches: createdMatches,
        roundNumber: createdRound.roundNumber,
        status: createdRound.status,
        tournamentId: createdRound.tournamentId,
      }),
      tournament: tournamentSchema.parse(updatedTournament),
    })
  },
)

tournamentRouter.post(
  '/api/admin/tournaments/:id/terminate',
  requireAuth,
  requireAdmin,
  (context) => {
    const tournamentId = parseId(context.req.param('id'))

    if (!tournamentId) {
      return context.json({ error: 'Invalid tournament id' }, 400)
    }

    const tournament = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .get()

    if (!tournament) {
      return context.json({ error: 'Tournament not found' }, 404)
    }

    if (tournament.status !== 'running') {
      return context.json(
        { error: 'Only running tournaments can be terminated' },
        400,
      )
    }

    const result = terminateTournament(tournamentId)

    if (!result) {
      return context.json({ error: 'Tournament could not be terminated' }, 409)
    }

    return context.json(okResponseSchema.parse({ ok: true }))
  },
)

tournamentRouter.post(
  '/api/admin/tournaments/:id/next-round',
  requireAuth,
  requireAdmin,
  requireWritesUnlocked,
  (context) => {
    const tournamentId = parseId(context.req.param('id'))

    if (!tournamentId) {
      return context.json({ error: 'Invalid tournament id' }, 400)
    }

    const tournament = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .get()

    if (!tournament) {
      return context.json({ error: 'Tournament not found' }, 404)
    }

    const result = advanceToNextRound(tournamentId)

    if (!result) {
      return context.json(
        {
          error:
            'Cannot advance: round not fully scored, has errors, includes archived submissions, or already advanced',
        },
        400,
      )
    }

    return context.json({
      byeSubmissions: result.byeSubmissions,
      matches: result.matches,
      round: tournamentRoundSchema.parse({
        byeSubmissions: result.byeSubmissions,
        id: result.round.id,
        matches: result.matches,
        roundNumber: result.round.roundNumber,
        status: result.round.status,
        tournamentId: result.round.tournamentId,
      }),
      tournament: tournamentSchema.parse(result.tournament),
    })
  },
)

tournamentRouter.get(
  '/api/admin/tournaments/:id/error-matches',
  requireAuth,
  requireAdmin,
  (context) => {
    const tournamentId = parseId(context.req.param('id'))

    if (!tournamentId) {
      return context.json({ error: 'Invalid tournament id' }, 400)
    }

    const tournament = db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .get()

    if (!tournament) {
      return context.json({ error: 'Tournament not found' }, 404)
    }

    return context.json(listErroredMatches(tournamentId))
  },
)

tournamentRouter.get(
  '/api/admin/matches/errors',
  requireAuth,
  requireAdmin,
  (context) => {
    return context.json(listErroredMatches())
  },
)

tournamentRouter.get('/api/tournaments', requireAuth, (context) => {
  return context.json(listTournaments())
})

tournamentRouter.get('/api/tournaments/:id', requireAuth, (context) => {
  const tournamentId = parseId(context.req.param('id'))

  if (!tournamentId) {
    return context.json({ error: 'Invalid tournament id' }, 400)
  }

  const detail = getTournamentDetail(tournamentId)

  if (!detail) {
    return context.json({ error: 'Tournament not found' }, 404)
  }

  return context.json(tournamentDetailSchema.parse(detail))
})

tournamentRouter.get(
  '/api/tournaments/:id/leaderboard',
  requireAuth,
  (context) => {
    const tournamentId = parseId(context.req.param('id'))

    if (!tournamentId) {
      return context.json({ error: 'Invalid tournament id' }, 400)
    }

    const leaderboard = getLeaderboard(tournamentId)

    if (!leaderboard) {
      return context.json({ error: 'Tournament not found' }, 404)
    }

    return context.json(leaderboard)
  },
)

tournamentRouter.get('/api/matches/:id', requireAuth, (context) => {
  const matchId = parseId(context.req.param('id'))

  if (!matchId) {
    return context.json({ error: 'Invalid match id' }, 400)
  }

  const match = db
    .select({
      createdAt: matches.createdAt,
      currentTurn: matches.currentTurn,
      error: matches.error,
      finishedAt: matches.finishedAt,
      id: matches.id,
      infoAssignment: matches.infoAssignment,
      judgeDecision: matches.judgeDecision,
      judgeTranscriptA: matches.judgeTranscriptA,
      judgeTranscriptB: matches.judgeTranscriptB,
      joinedSubAId: detailSubA.id,
      joinedSubBId: detailSubB.id,
      joinedUserAId: detailUserA.id,
      joinedUserBId: detailUserB.id,
      playerADisplayName: detailUserA.displayName,
      playerAModel: detailSubA.modelA,
      playerBDisplayName: detailUserB.displayName,
      playerBModel: detailSubB.modelB,
      reasoning: matches.reasoning,
      roundId: matches.roundId,
      roundNumber: rounds.roundNumber,
      scenarioId: matches.scenarioId,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      startedAt: matches.startedAt,
      status: matches.status,
      subAId: matches.subAId,
      subBId: matches.subBId,
      tournamentId: rounds.tournamentId,
      transcript: matches.transcript,
      winner: matches.winner,
    })
    .from(matches)
    .leftJoin(rounds, eq(rounds.id, matches.roundId))
    .leftJoin(detailSubA, eq(detailSubA.id, matches.subAId))
    .leftJoin(detailSubB, eq(detailSubB.id, matches.subBId))
    .leftJoin(detailUserA, eq(detailUserA.id, detailSubA.userId))
    .leftJoin(detailUserB, eq(detailUserB.id, detailSubB.userId))
    .where(eq(matches.id, matchId))
    .get()

  if (!match) {
    return context.json({ error: 'Match not found' }, 404)
  }

  if (
    match.roundNumber === null ||
    match.tournamentId === null ||
    match.joinedSubAId === null ||
    match.joinedSubBId === null
  ) {
    return context.json({ error: 'Match dependencies missing' }, 500)
  }

  if (
    match.joinedUserAId === null ||
    match.joinedUserBId === null ||
    match.playerADisplayName === null ||
    match.playerAModel === null ||
    match.playerBDisplayName === null ||
    match.playerBModel === null
  ) {
    return context.json({ error: 'Match users missing' }, 500)
  }

  return context.json(
    matchDetailSchema.parse({
      createdAt: match.createdAt,
      currentTurn: match.currentTurn,
      error: match.error,
      finishedAt: match.finishedAt,
      id: match.id,
      infoAssignment: parseJsonField(match.infoAssignment, null),
      judgeDecision: match.judgeDecision ?? null,
      judgeTranscriptA: parseJsonField(match.judgeTranscriptA, []),
      judgeTranscriptB: parseJsonField(match.judgeTranscriptB, []),
      playerADisplayName: match.playerADisplayName,
      playerAModel: match.playerAModel,
      playerBDisplayName: match.playerBDisplayName,
      playerBModel: match.playerBModel,
      reasoning: match.reasoning,
      roundId: match.roundId,
      roundNumber: match.roundNumber,
      scenarioId: match.scenarioId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      startedAt: match.startedAt,
      status: match.status,
      subAId: match.subAId,
      subBId: match.subBId,
      tournamentId: match.tournamentId,
      transcript: parseJsonField(match.transcript, []),
      winner: match.winner,
    }),
  )
})

tournamentRouter.get('/api/matches/:id/status', requireAuth, (context) => {
  const matchId = parseId(context.req.param('id'))

  if (!matchId) {
    return context.json({ error: 'Invalid match id' }, 400)
  }

  const match = db
    .select({
      currentTurn: matches.currentTurn,
      error: matches.error,
      hasInfoAssignment: sql<number>`case when ${matches.infoAssignment} is null then 0 else 1 end`,
      hasJudgeDecision: sql<number>`case when ${matches.judgeDecision} is null then 0 else 1 end`,
      id: matches.id,
      judgeTranscriptALength: sql<number>`coalesce(json_array_length(${matches.judgeTranscriptA}), 0)`,
      judgeTranscriptBLength: sql<number>`coalesce(json_array_length(${matches.judgeTranscriptB}), 0)`,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      status: matches.status,
      winner: matches.winner,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .get()

  if (!match) {
    return context.json({ error: 'Match not found' }, 404)
  }

  return context.json(
    matchProgressSchema.parse({
      ...match,
      hasInfoAssignment: Boolean(match.hasInfoAssignment),
      hasJudgeDecision: Boolean(match.hasJudgeDecision),
    }),
  )
})

tournamentRouter.post(
  '/api/admin/matches/:id/retry',
  requireAuth,
  requireAdmin,
  requireWritesUnlocked,
  (context) => {
    const matchId = parseId(context.req.param('id'))

    if (!matchId) {
      return context.json({ error: 'Invalid match id' }, 400)
    }

    const match = db.select().from(matches).where(eq(matches.id, matchId)).get()

    if (!match) {
      return context.json({ error: 'Match not found' }, 404)
    }

    if (match.status !== 'error') {
      return context.json({ error: 'Only errored matches can be retried' }, 400)
    }

    const relatedSubmissions = db
      .select({
        id: submissions.id,
        retiredAt: submissions.retiredAt,
      })
      .from(submissions)
      .where(inArray(submissions.id, [match.subAId, match.subBId]))
      .all()

    if (
      relatedSubmissions.some((submission) => submission.retiredAt !== null)
    ) {
      return context.json(
        { error: 'Match includes archived submissions and cannot be retried' },
        409,
      )
    }

    const round = db
      .select()
      .from(rounds)
      .where(eq(rounds.id, match.roundId))
      .get()

    if (!round) {
      return context.json({ error: 'Round not found' }, 404)
    }

    const tournament = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, round.tournamentId))
      .get()

    if (!tournament) {
      return context.json({ error: 'Tournament not found' }, 404)
    }

    if (tournament.status === 'terminated') {
      return context.json(
        {
          error: 'Tournament has been terminated and matches cannot be retried',
        },
        409,
      )
    }

    db.transaction((tx) => {
      tx.update(matches)
        .set({
          error: null,
          finishedAt: null,
          infoAssignment: null,
          judgeDecision: null,
          leaseToken: null,
          scoreA: null,
          scoreB: null,
          status: 'queued',
          transcript: '[]',
          judgeTranscriptA: '[]',
          judgeTranscriptB: '[]',
          reasoning: null,
          winner: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(matches.id, matchId))
        .run()

      tx.update(rounds)
        .set({ status: 'running' })
        .where(eq(rounds.id, round.id))
        .run()

      tx.update(tournaments)
        .set({ status: 'running' })
        .where(eq(tournaments.id, round.tournamentId))
        .run()
    })

    kickWorker()

    return context.json(okResponseSchema.parse({ ok: true }))
  },
)

export { tournamentRouter }
