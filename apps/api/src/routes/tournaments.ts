import {
  computeSwissRounds,
  matchDetailSchema,
  okResponseSchema,
  tournamentDetailSchema,
  tournamentRoundSchema,
  tournamentSchema,
} from '@axiia/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { kickWorker } from '../engine/worker'
import { db } from '../db/client'
import {
  matches,
  rounds,
  scenarios,
  submissions,
  tournaments,
  users,
} from '../db/schema'
import {
  advanceToNextRound,
  createRoundWithMatches,
  extractByeSubmissionIds,
  getLatestScenarioPlayers,
  getLeaderboard,
  getTournamentDetail,
  listTournaments,
  syncRoundStatus,
} from '../lib/tournaments'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const startTournamentSchema = z.object({
  scenarioId: z.string().min(1),
  totalRounds: z.number().int().positive().optional(),
})

const tournamentRouter = new Hono()

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

tournamentRouter.post(
  '/api/admin/tournaments/start',
  requireAuth,
  requireAdmin,
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

    const players = getLatestScenarioPlayers(parsed.data.scenarioId)

    if (players.length < 2) {
      return context.json({ error: 'At least 2 submissions are required' }, 400)
    }

    const tournament = db
      .insert(tournaments)
      .values({
        currentRound: 0,
        scenarioId: parsed.data.scenarioId,
        status: 'running',
        totalRounds:
          parsed.data.totalRounds ?? computeSwissRounds(players.length),
      })
      .returning()
      .get()

    const playerIds = shuffle(players.map((player) => player.submissionId))
    const pairs: Array<[number, number]> = []

    for (let index = 0; index + 1 < playerIds.length; index += 2) {
      pairs.push([playerIds[index], playerIds[index + 1]])
    }

    const byeSubmissions = extractByeSubmissionIds(playerIds, pairs)
    const { matches: createdMatches, round } = createRoundWithMatches({
      pairs,
      roundNumber: 1,
      scenarioId: parsed.data.scenarioId,
      tournamentId: tournament.id,
    })

    const updatedTournament = db
      .update(tournaments)
      .set({ currentRound: 1 })
      .where(eq(tournaments.id, tournament.id))
      .returning()
      .get()

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
  },
)

tournamentRouter.post(
  '/api/admin/tournaments/:id/next-round',
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

    const result = advanceToNextRound(tournamentId)

    if (!result) {
      return context.json(
        {
          error:
            'Cannot advance: round not fully scored, has errors, or already advanced',
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

tournamentRouter.get('/api/tournaments', (context) => {
  return context.json(listTournaments())
})

tournamentRouter.get('/api/tournaments/:id', (context) => {
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

tournamentRouter.get('/api/tournaments/:id/leaderboard', (context) => {
  const tournamentId = parseId(context.req.param('id'))

  if (!tournamentId) {
    return context.json({ error: 'Invalid tournament id' }, 400)
  }

  const leaderboard = getLeaderboard(tournamentId)

  if (!leaderboard) {
    return context.json({ error: 'Tournament not found' }, 404)
  }

  return context.json(leaderboard)
})

tournamentRouter.get('/api/matches/:id', (context) => {
  const matchId = parseId(context.req.param('id'))

  if (!matchId) {
    return context.json({ error: 'Invalid match id' }, 400)
  }

  const match = db.select().from(matches).where(eq(matches.id, matchId)).get()

  if (!match) {
    return context.json({ error: 'Match not found' }, 404)
  }

  const round = db
    .select()
    .from(rounds)
    .where(eq(rounds.id, match.roundId))
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

  if (!round || !subA || !subB) {
    return context.json({ error: 'Match dependencies missing' }, 500)
  }

  const userA = db.select().from(users).where(eq(users.id, subA.userId)).get()
  const userB = db.select().from(users).where(eq(users.id, subB.userId)).get()

  if (!userA || !userB) {
    return context.json({ error: 'Match users missing' }, 500)
  }

  return context.json(
    matchDetailSchema.parse({
      createdAt: match.createdAt,
      currentTurn: match.currentTurn,
      error: match.error,
      finishedAt: match.finishedAt,
      id: match.id,
      judgeTranscriptA: JSON.parse(match.judgeTranscriptA),
      judgeTranscriptB: JSON.parse(match.judgeTranscriptB),
      playerADisplayName: userA.displayName,
      playerAModel: subA.model,
      playerBDisplayName: userB.displayName,
      playerBModel: subB.model,
      reasoning: match.reasoning,
      roundId: match.roundId,
      roundNumber: round.roundNumber,
      scenarioId: match.scenarioId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      startedAt: match.startedAt,
      status: match.status,
      subAId: match.subAId,
      subBId: match.subBId,
      tournamentId: round.tournamentId,
      transcript: JSON.parse(match.transcript),
      winner: match.winner,
    }),
  )
})

tournamentRouter.post(
  '/api/admin/matches/:id/retry',
  requireAuth,
  requireAdmin,
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

    const round = db
      .select()
      .from(rounds)
      .where(eq(rounds.id, match.roundId))
      .get()

    if (!round) {
      return context.json({ error: 'Round not found' }, 404)
    }

    db.update(matches)
      .set({
        error: null,
        finishedAt: null,
        leaseToken: null,
        status: 'queued',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(matches.id, matchId))
      .run()

    db.update(rounds)
      .set({ status: 'running' })
      .where(eq(rounds.id, round.id))
      .run()
    db.update(tournaments)
      .set({ status: 'running' })
      .where(eq(tournaments.id, round.tournamentId))
      .run()

    kickWorker()

    return context.json(okResponseSchema.parse({ ok: true }))
  },
)

export { tournamentRouter }
