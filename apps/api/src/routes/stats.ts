import {
  adminStatsSchema,
  personalStatsSchema,
  recentMatchSchema,
} from '@axiia/shared'
import { desc, eq, inArray, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import {
  matches,
  scenarios,
  submissions,
  tournaments,
  users,
} from '../db/schema'
import { getLeaderboard } from '../lib/tournaments'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const statsRouter = new Hono()

statsRouter.get('/api/stats/me', requireAuth, (context) => {
  const userId = context.get('userId')
  const userSubmissions = db
    .select({
      id: submissions.id,
      scenarioId: submissions.scenarioId,
      version: submissions.version,
    })
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.id))
    .all()
  const submissionIds = userSubmissions.map((submission) => submission.id)
  const submissionCount = submissionIds.length

  let winRate: number | null = null
  let pendingMatchCount = 0
  let completedMatchCount = 0

  if (submissionIds.length > 0) {
    const scoredMatches = db
      .select({
        status: matches.status,
        subAId: matches.subAId,
        subBId: matches.subBId,
        winner: matches.winner,
      })
      .from(matches)
      .where(
        or(
          inArray(matches.subAId, submissionIds),
          inArray(matches.subBId, submissionIds),
        ),
      )
      .all()

    completedMatchCount = scoredMatches.filter(
      (match) => match.status === 'scored',
    ).length

    if (completedMatchCount > 0) {
      const wins = scoredMatches.filter(
        (match) =>
          match.status === 'scored' &&
          ((match.winner === 'a' && submissionIds.includes(match.subAId)) ||
            (match.winner === 'b' && submissionIds.includes(match.subBId))),
      ).length

      winRate = (wins / completedMatchCount) * 100
    }

    pendingMatchCount = scoredMatches.filter(
      (match) => match.status === 'queued' || match.status === 'running',
    ).length
  }

  // Current version = highest version across user's submissions
  const currentVersion =
    userSubmissions.length > 0 ? userSubmissions[0].version : null

  // Scenario title from latest submission
  const latestScenarioId =
    userSubmissions.length > 0 ? userSubmissions[0].scenarioId : null
  let scenarioTitle: string | null = null
  if (latestScenarioId) {
    const scenario = db
      .select({ title: scenarios.title })
      .from(scenarios)
      .where(eq(scenarios.id, latestScenarioId))
      .get()
    scenarioTitle = scenario?.title ?? null
  }

  // Find latest running or finished tournament for round info
  const latestTournament = db
    .select({
      currentRound: tournaments.currentRound,
      id: tournaments.id,
      status: tournaments.status,
    })
    .from(tournaments)
    .orderBy(desc(tournaments.createdAt))
    .get()

  const tournamentRound = latestTournament?.currentRound ?? null

  let rank: number | null = null

  if (latestTournament && submissionIds.length > 0) {
    const leaderboard = getLeaderboard(latestTournament.id) ?? []
    const userEntry = leaderboard.find((entry) =>
      submissionIds.includes(entry.submissionId),
    )
    rank = userEntry?.rank ?? null
  }

  return context.json(
    personalStatsSchema.parse({
      completedMatchCount,
      currentVersion,
      pendingMatchCount,
      rank,
      scenarioTitle,
      submissionCount,
      tournamentRound,
      winRate,
    }),
  )
})

statsRouter.get('/api/admin/stats', requireAuth, requireAdmin, (context) => {
  const rows = db
    .select({
      count: sql<number>`count(*)`,
      status: matches.status,
    })
    .from(matches)
    .groupBy(matches.status)
    .all()

  const counts = new Map(rows.map((row) => [row.status, row.count]))

  return context.json(
    adminStatsSchema.parse({
      queued: counts.get('queued') ?? 0,
      running: counts.get('running') ?? 0,
      scored: counts.get('scored') ?? 0,
    }),
  )
})

statsRouter.get('/api/matches/my', requireAuth, (context) => {
  const userId = context.get('userId')
  const userSubmissions = db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .all()
  const submissionIds = userSubmissions.map((submission) => submission.id)

  if (submissionIds.length === 0) {
    return context.json([])
  }

  const recentMatchRows = db
    .select({
      id: matches.id,
      roleALabel: scenarios.roleAName,
      roleBLabel: scenarios.roleBName,
      scenarioId: matches.scenarioId,
      scenarioTitle: scenarios.title,
      status: matches.status,
      subAId: matches.subAId,
      subBId: matches.subBId,
      winner: matches.winner,
      createdAt: matches.createdAt,
    })
    .from(matches)
    .innerJoin(scenarios, eq(matches.scenarioId, scenarios.id))
    .where(
      or(
        inArray(matches.subAId, submissionIds),
        inArray(matches.subBId, submissionIds),
      ),
    )
    .orderBy(desc(matches.createdAt))
    .limit(10)
    .all()

  const enriched = recentMatchRows.map((match) => {
    const isA = submissionIds.includes(match.subAId)
    const mySide = isA ? ('a' as const) : ('b' as const)
    const opponentSubId = isA ? match.subBId : match.subAId

    const opponentSub = db
      .select({ userId: submissions.userId, model: submissions.model })
      .from(submissions)
      .where(eq(submissions.id, opponentSubId))
      .get()
    const opponentUser = opponentSub
      ? db
          .select({ displayName: users.displayName })
          .from(users)
          .where(eq(users.id, opponentSub.userId))
          .get()
      : null
    const mySub = db
      .select({ model: submissions.model })
      .from(submissions)
      .where(eq(submissions.id, isA ? match.subAId : match.subBId))
      .get()

    return recentMatchSchema.parse({
      id: match.id,
      status: match.status,
      scenarioTitle: match.scenarioTitle,
      scenarioId: match.scenarioId,
      roleALabel: match.roleALabel,
      roleBLabel: match.roleBLabel,
      winner: match.winner,
      opponentName: opponentUser?.displayName ?? `选手 ${opponentSubId}`,
      model: mySub?.model ?? 'unknown',
      mySide,
      createdAt: match.createdAt,
    })
  })

  return context.json(enriched)
})

export { statsRouter }
