import {
  adminPlayerSchema,
  leaderboardEntrySchema,
  modelOptions,
  tournamentDetailSchema,
  tournamentListItemSchema,
  tournamentMatchSummarySchema,
  tournamentRoundSchema,
} from '@axiia/shared'
import { and, asc, desc, eq, lte } from 'drizzle-orm'

import { db, type DbTransaction } from '../db/client'
import {
  matches,
  rounds,
  scenarios,
  submissions,
  tournaments,
  users,
} from '../db/schema'
import { swissPair } from '../engine/swiss'
import { kickWorker } from '../engine/worker-signal'
import { parseJsonField } from './json'

type TournamentRecord = typeof tournaments.$inferSelect

type TournamentPlayer = ReturnType<typeof adminPlayerSchema.parse>

function pairKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function getLatestScenarioPlayers(
  scenarioId: string,
  beforeCreatedAt?: string,
) {
  const whereClause = beforeCreatedAt
    ? and(
        eq(submissions.scenarioId, scenarioId),
        lte(submissions.createdAt, beforeCreatedAt),
      )
    : eq(submissions.scenarioId, scenarioId)

  const rows = db
    .select({
      displayName: users.displayName,
      email: users.email,
      model: submissions.model,
      submissionId: submissions.id,
      submittedAt: submissions.createdAt,
      userId: users.id,
      version: submissions.version,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.userId))
    .where(whereClause)
    .orderBy(
      desc(submissions.createdAt),
      desc(submissions.version),
      desc(submissions.id),
    )
    .all()

  const latestByUser = new Map<number, TournamentPlayer>()

  for (const row of rows) {
    if (!latestByUser.has(row.userId)) {
      latestByUser.set(row.userId, adminPlayerSchema.parse(row))
    }
  }

  return [...latestByUser.values()].sort(
    (left, right) => left.userId - right.userId,
  )
}

export function getTournamentPlayers(tournament: TournamentRecord) {
  return getLatestScenarioPlayers(tournament.scenarioId, tournament.createdAt)
}

export function buildPreviousPairings(tournamentId: number) {
  const rows = db
    .select({
      subAId: matches.subAId,
      subBId: matches.subBId,
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(rounds.tournamentId, tournamentId))
    .all()

  return new Set(rows.map((row) => pairKey(row.subAId, row.subBId)))
}

export function extractByeSubmissionIds(
  playerIds: number[],
  pairs: Array<[number, number]>,
) {
  const paired = new Set(pairs.flatMap(([left, right]) => [left, right]))
  return playerIds.filter((playerId) => !paired.has(playerId))
}

export function createRoundWithMatches(
  params: {
    pairs: Array<[number, number]>
    roundNumber: number
    scenarioId: string
    tournamentId: number
  },
  executor: typeof db | DbTransaction = db,
) {
  const now = new Date().toISOString()
  const round = executor
    .insert(rounds)
    .values({
      roundNumber: params.roundNumber,
      status: 'running',
      tournamentId: params.tournamentId,
    })
    .returning()
    .get()

  const matchRows =
    params.pairs.length === 0
      ? []
      : executor
          .insert(matches)
          .values(
            params.pairs.flatMap(([subAId, subBId]) => [
              {
                roundId: round.id,
                scenarioId: params.scenarioId,
                status: 'queued' as const,
                subAId,
                subBId,
                updatedAt: now,
              },
              {
                roundId: round.id,
                scenarioId: params.scenarioId,
                status: 'queued' as const,
                subAId: subBId,
                subBId: subAId,
                updatedAt: now,
              },
            ]),
          )
          .returning({
            createdAt: matches.createdAt,
            currentTurn: matches.currentTurn,
            finishedAt: matches.finishedAt,
            id: matches.id,
            roundId: matches.roundId,
            scenarioId: matches.scenarioId,
            scoreA: matches.scoreA,
            scoreB: matches.scoreB,
            startedAt: matches.startedAt,
            status: matches.status,
            subAId: matches.subAId,
            subBId: matches.subBId,
            winner: matches.winner,
          })
          .all()

  return {
    matches: matchRows.map((row) => tournamentMatchSummarySchema.parse(row)),
    round,
  }
}

export function syncRoundStatus(roundId: number) {
  const round = db.select().from(rounds).where(eq(rounds.id, roundId)).get()

  if (!round) {
    return null
  }

  const roundMatches = db
    .select({ status: matches.status })
    .from(matches)
    .where(eq(matches.roundId, roundId))
    .all()

  let nextStatus = round.status

  if (roundMatches.length === 0) {
    nextStatus = 'pairing'
  } else if (roundMatches.every((match) => match.status === 'scored')) {
    nextStatus = 'done'
  } else {
    nextStatus = 'running'
  }

  if (nextStatus !== round.status) {
    db.update(rounds)
      .set({ status: nextStatus })
      .where(eq(rounds.id, roundId))
      .run()
  }

  return nextStatus
}

export function listTournaments() {
  const tournamentRows = db
    .select({
      createdAt: tournaments.createdAt,
      currentRound: tournaments.currentRound,
      id: tournaments.id,
      scenarioId: tournaments.scenarioId,
      scenarioTitle: scenarios.title,
      status: tournaments.status,
      totalRounds: tournaments.totalRounds,
    })
    .from(tournaments)
    .innerJoin(scenarios, eq(scenarios.id, tournaments.scenarioId))
    .orderBy(desc(tournaments.createdAt))
    .all()

  const roundRows = db
    .select({ tournamentId: rounds.tournamentId })
    .from(rounds)
    .all()
  const roundCountByTournament = new Map<number, number>()

  for (const round of roundRows) {
    roundCountByTournament.set(
      round.tournamentId,
      (roundCountByTournament.get(round.tournamentId) ?? 0) + 1,
    )
  }

  return tournamentRows.map((row) =>
    tournamentListItemSchema.parse({
      ...row,
      roundCount: roundCountByTournament.get(row.id) ?? 0,
    }),
  )
}

export function getTournamentDetail(tournamentId: number) {
  const tournament = db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .get()

  if (!tournament) {
    return null
  }

  const participants = getTournamentPlayers(tournament).map(
    (player) => player.submissionId,
  )
  const roundRows = db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, tournamentId))
    .orderBy(asc(rounds.roundNumber))
    .all()
  const matchRows = db
    .select({
      createdAt: matches.createdAt,
      currentTurn: matches.currentTurn,
      finishedAt: matches.finishedAt,
      id: matches.id,
      roundId: matches.roundId,
      scenarioId: matches.scenarioId,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      startedAt: matches.startedAt,
      status: matches.status,
      subAId: matches.subAId,
      subBId: matches.subBId,
      winner: matches.winner,
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(rounds.tournamentId, tournamentId))
    .orderBy(asc(rounds.roundNumber), asc(matches.createdAt), asc(matches.id))
    .all()

  const matchesByRound = new Map<
    number,
    ReturnType<typeof tournamentMatchSummarySchema.parse>[]
  >()

  for (const row of matchRows) {
    const parsed = tournamentMatchSummarySchema.parse(row)
    const items = matchesByRound.get(parsed.roundId) ?? []
    items.push(parsed)
    matchesByRound.set(parsed.roundId, items)
  }

  const parsedRounds = roundRows.map((round) => {
    const roundMatches = matchesByRound.get(round.id) ?? []
    const pairedPlayers = new Set(
      roundMatches.flatMap((match) => [match.subAId, match.subBId]),
    )
    const byeSubmissions = participants.filter(
      (submissionId) => !pairedPlayers.has(submissionId),
    )

    return tournamentRoundSchema.parse({
      byeSubmissions,
      id: round.id,
      matches: roundMatches,
      roundNumber: round.roundNumber,
      status: round.status,
      tournamentId: round.tournamentId,
    })
  })

  return tournamentDetailSchema.parse({
    createdAt: tournament.createdAt,
    currentRound: tournament.currentRound,
    id: tournament.id,
    rounds: parsedRounds,
    scenarioId: tournament.scenarioId,
    status: tournament.status,
    totalRounds: tournament.totalRounds,
  })
}

export function getLeaderboard(tournamentId: number) {
  const tournament = db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .get()

  if (!tournament) {
    return null
  }

  const participants = getTournamentPlayers(tournament)
  const participantIds = participants.map((player) => player.submissionId)
  const scoredMatchRows = db
    .select({
      roundId: matches.roundId,
      status: matches.status,
      subAId: matches.subAId,
      subBId: matches.subBId,
      winner: matches.winner,
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(
      and(eq(rounds.tournamentId, tournamentId), eq(matches.status, 'scored')),
    )
    .all()
  const roundRows = db
    .select({ id: rounds.id })
    .from(rounds)
    .where(eq(rounds.tournamentId, tournamentId))
    .all()
  const roundMatchRows = db
    .select({
      roundId: matches.roundId,
      subAId: matches.subAId,
      subBId: matches.subBId,
    })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(rounds.tournamentId, tournamentId))
    .all()

  const wins = new Map<number, number>(participantIds.map((id) => [id, 0]))
  const losses = new Map<number, number>(participantIds.map((id) => [id, 0]))
  const completedResults = new Map<number, number>(
    participantIds.map((id) => [id, 0]),
  )
  const opponents = new Map<number, Set<number>>(
    participantIds.map((id) => [id, new Set<number>()]),
  )
  const pairedPlayersByRound = new Map<number, Set<number>>()

  for (const row of roundMatchRows) {
    const pairedPlayers =
      pairedPlayersByRound.get(row.roundId) ?? new Set<number>()
    pairedPlayers.add(row.subAId)
    pairedPlayers.add(row.subBId)
    pairedPlayersByRound.set(row.roundId, pairedPlayers)
  }

  for (const round of roundRows) {
    const pairedPlayers =
      pairedPlayersByRound.get(round.id) ?? new Set<number>()

    for (const participantId of participantIds) {
      if (pairedPlayers.has(participantId)) {
        continue
      }

      wins.set(participantId, (wins.get(participantId) ?? 0) + 1)
      completedResults.set(
        participantId,
        (completedResults.get(participantId) ?? 0) + 1,
      )
    }
  }

  for (const match of scoredMatchRows) {
    opponents.get(match.subAId)?.add(match.subBId)
    opponents.get(match.subBId)?.add(match.subAId)
    completedResults.set(
      match.subAId,
      (completedResults.get(match.subAId) ?? 0) + 1,
    )
    completedResults.set(
      match.subBId,
      (completedResults.get(match.subBId) ?? 0) + 1,
    )

    if (match.winner === 'a') {
      wins.set(match.subAId, (wins.get(match.subAId) ?? 0) + 1)
      losses.set(match.subBId, (losses.get(match.subBId) ?? 0) + 1)
    } else if (match.winner === 'b') {
      wins.set(match.subBId, (wins.get(match.subBId) ?? 0) + 1)
      losses.set(match.subAId, (losses.get(match.subAId) ?? 0) + 1)
    } else if (match.winner === 'draw') {
      wins.set(match.subAId, (wins.get(match.subAId) ?? 0) + 0.5)
      wins.set(match.subBId, (wins.get(match.subBId) ?? 0) + 0.5)
    }
  }

  const entries = participants.map((player) => {
    const playerWins = wins.get(player.submissionId) ?? 0
    const playerLosses = losses.get(player.submissionId) ?? 0
    const totalPlayed = completedResults.get(player.submissionId) ?? 0
    const buchholz = [
      ...(opponents.get(player.submissionId) ?? new Set<number>()),
    ].reduce((sum, opponentId) => sum + (wins.get(opponentId) ?? 0), 0)
    const modelLabel =
      modelOptions.find((option) => option.id === player.model)?.label ??
      player.model

    return {
      buchholz,
      losses: playerLosses,
      modelLabel,
      playerName: player.displayName,
      rank: 0,
      status:
        tournament.status === 'finished'
          ? 'done'
          : tournament.status === 'open'
            ? 'queued'
            : 'running',
      submissionId: player.submissionId,
      winRate: totalPlayed === 0 ? 0 : (playerWins / totalPlayed) * 100,
      wins: playerWins,
    }
  })

  entries.sort((left, right) => {
    if (right.wins !== left.wins) {
      return right.wins - left.wins
    }

    if (right.buchholz !== left.buchholz) {
      return right.buchholz - left.buchholz
    }

    return left.submissionId - right.submissionId
  })

  return entries.map((entry, index) =>
    leaderboardEntrySchema.parse({
      ...entry,
      rank: index + 1,
    }),
  )
}

export function getRoundTerminalState(roundId: number) {
  const roundMatches = db
    .select()
    .from(matches)
    .where(eq(matches.roundId, roundId))
    .all()

  return {
    hasErrors: roundMatches.some((match) => match.status === 'error'),
    isDone:
      roundMatches.length > 0 &&
      roundMatches.every((match) => match.status === 'scored'),
    queuedCount: roundMatches.filter((match) => match.status === 'queued')
      .length,
    runningCount: roundMatches.filter(
      (match) => match.status === 'running' || match.status === 'judging',
    ).length,
    scoredCount: roundMatches.filter((match) => match.status === 'scored')
      .length,
  }
}

export function getMatchTranscriptCount(matchId: number) {
  const match = db
    .select({ transcript: matches.transcript })
    .from(matches)
    .where(eq(matches.id, matchId))
    .get()

  if (!match) {
    return 0
  }

  return parseJsonField(match.transcript, []).length
}

export function advanceToNextRound(tournamentId: number) {
  const tournament = db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .get()

  if (!tournament) {
    return null
  }

  const currentRound = db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, tournamentId))
    .orderBy(rounds.roundNumber)
    .all()
    .at(-1)

  if (!currentRound) {
    return null
  }

  const roundState = getRoundTerminalState(currentRound.id)

  if (!roundState.isDone || roundState.hasErrors) {
    return null
  }

  const players = getLatestScenarioPlayers(
    tournament.scenarioId,
    tournament.createdAt,
  )
  const leaderboard = getLeaderboard(tournamentId)

  if (!leaderboard) {
    return null
  }

  const standings = new Map(
    leaderboard.map((entry) => [entry.submissionId, entry.wins]),
  )
  const playerIds = players.map((player) => player.submissionId)
  const pairs = swissPair({
    playerIds,
    previousPairings: buildPreviousPairings(tournamentId),
    standings,
  })
  const byeSubmissions = extractByeSubmissionIds(playerIds, pairs)
  const nextRoundNumber = currentRound.roundNumber + 1

  const result = db.transaction((tx) => {
    const updated = tx
      .update(tournaments)
      .set({ currentRound: nextRoundNumber, status: 'running' })
      .where(
        and(
          eq(tournaments.id, tournamentId),
          eq(tournaments.currentRound, currentRound.roundNumber),
        ),
      )
      .returning()
      .get()

    if (!updated) {
      return null
    }

    const { matches: createdMatches, round } = createRoundWithMatches(
      {
        pairs,
        roundNumber: nextRoundNumber,
        scenarioId: tournament.scenarioId,
        tournamentId,
      },
      tx,
    )

    return {
      byeSubmissions,
      matches: createdMatches,
      round,
      tournament: updated,
    }
  })

  if (!result) {
    return null
  }

  kickWorker()

  return result
}

export function maybeAdvanceRound(roundId: number) {
  const round = db.select().from(rounds).where(eq(rounds.id, roundId)).get()

  if (!round || round.status !== 'done') {
    return
  }

  const tournament = db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, round.tournamentId))
    .get()

  if (!tournament || tournament.status !== 'running') {
    return
  }

  const roundState = getRoundTerminalState(roundId)

  if (roundState.hasErrors) {
    return
  }

  if (tournament.currentRound >= tournament.totalRounds) {
    db.update(tournaments)
      .set({ status: 'finished' })
      .where(eq(tournaments.id, tournament.id))
      .run()
    console.log(
      `[tournament] finished (${tournament.currentRound}/${tournament.totalRounds} rounds complete)`,
    )
    return
  }

  const result = advanceToNextRound(tournament.id)

  if (result) {
    console.log(
      `[tournament] advancing to round ${result.round.roundNumber} (${result.matches.length} matches created)`,
    )
  }
}
