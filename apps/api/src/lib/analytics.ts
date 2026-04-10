import {
  adminAnalyticsAgentDetailSchema,
  adminAnalyticsAgentSummarySchema,
  adminAnalyticsBattleSchema,
  type AdminAnalyticsAgentSummary,
  type AdminAnalyticsBattle,
  type AnalyticsBattleMode,
  type AnalyticsBattleSource,
} from '@axiia/shared'
import { desc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

import { db } from '../db/client'
import {
  llmCalls,
  matches,
  playgroundRuns,
  presetOpponents,
  rounds,
  scenarios,
  submissions,
  users,
  type MatchStatus,
} from '../db/schema'

type AnalyticsBattleFilters = {
  limit?: number
  mode?: AnalyticsBattleMode
  side?: 'a' | 'b'
  source?: AnalyticsBattleSource
  status?: MatchStatus
  submissionId?: number
  userId?: number
}

type TokenTotals = {
  completionTokens: number
  promptTokens: number
  totalTokens: number
}

type AgentSummaryAccumulator = AdminAnalyticsAgentSummary & {
  scoredBattleCount: number
  scoreAgainstSum: number
  scoreForSum: number
}

type TokenRow = {
  battleId: number
  completionTokens: number
  promptTokens: number
  side: string
}

const matchSubA = alias(submissions, 'analytics_match_sub_a')
const matchSubB = alias(submissions, 'analytics_match_sub_b')
const matchUserA = alias(users, 'analytics_match_user_a')
const matchUserB = alias(users, 'analytics_match_user_b')
const playgroundSubmission = alias(submissions, 'analytics_playground_submission')
const playgroundUser = alias(users, 'analytics_playground_user')
const playgroundPreset = alias(presetOpponents, 'analytics_playground_preset')

function zeroTokens(): TokenTotals {
  return { completionTokens: 0, promptTokens: 0, totalTokens: 0 }
}

function toTokenTotals(
  promptTokens: number | null | undefined,
  completionTokens: number | null | undefined,
): TokenTotals {
  const prompt = promptTokens ?? 0
  const completion = completionTokens ?? 0

  return {
    completionTokens: completion,
    promptTokens: prompt,
    totalTokens: prompt + completion,
  }
}

function buildTokenMaps(rows: TokenRow[]) {
  const byBattle = new Map<number, TokenTotals>()
  const byBattleSide = new Map<string, TokenTotals>()

  for (const row of rows) {
    const totals = toTokenTotals(row.promptTokens, row.completionTokens)
    byBattleSide.set(`${row.battleId}:${row.side}`, totals)

    const currentBattleTotals = byBattle.get(row.battleId) ?? zeroTokens()
    byBattle.set(row.battleId, {
      completionTokens:
        currentBattleTotals.completionTokens + totals.completionTokens,
      promptTokens: currentBattleTotals.promptTokens + totals.promptTokens,
      totalTokens: currentBattleTotals.totalTokens + totals.totalTokens,
    })
  }

  return { byBattle, byBattleSide }
}

function getSideTokens(
  tokenMap: Map<string, TokenTotals>,
  battleId: number,
  side: 'a' | 'b',
) {
  return tokenMap.get(`${battleId}:${side}`) ?? zeroTokens()
}

function buildSubmissionParticipant(params: {
  battleId: number
  model: string
  roleName: string
  side: 'a' | 'b'
  submissionId: number
  tokenMap: Map<string, TokenTotals>
  userDisplayName: string
  userId: number
  version: number
}) {
  const tokens = getSideTokens(params.tokenMap, params.battleId, params.side)

  return {
    agentKey: `submission:${params.submissionId}:${params.side}`,
    completionTokens: tokens.completionTokens,
    kind: 'submission' as const,
    label: `${params.userDisplayName} · v${params.version} · ${params.roleName}`,
    model: params.model,
    presetLabel: null,
    presetOpponentId: null,
    promptTokens: tokens.promptTokens,
    roleName: params.roleName,
    side: params.side,
    submissionId: params.submissionId,
    totalTokens: tokens.totalTokens,
    userDisplayName: params.userDisplayName,
    userId: params.userId,
    version: params.version,
  }
}

function buildPresetParticipant(params: {
  battleId: number
  label: string | null
  presetOpponentId: number | null
  roleName: string
  side: 'a' | 'b'
  tokenMap: Map<string, TokenTotals>
}) {
  const tokens = getSideTokens(params.tokenMap, params.battleId, params.side)
  const presetLabel = params.label ?? '预设对手'

  return {
    agentKey: `preset:${params.presetOpponentId ?? 'unknown'}:${params.side}`,
    completionTokens: tokens.completionTokens,
    kind: 'preset' as const,
    label: `${presetLabel} · ${params.roleName}`,
    model: null,
    presetLabel,
    presetOpponentId: params.presetOpponentId,
    promptTokens: tokens.promptTokens,
    roleName: params.roleName,
    side: params.side,
    submissionId: null,
    totalTokens: tokens.totalTokens,
    userDisplayName: null,
    userId: null,
    version: null,
  }
}

function compareCreatedAtDesc(left: { createdAt: string; id: number }, right: {
  createdAt: string
  id: number
}) {
  return right.createdAt.localeCompare(left.createdAt) || right.id - left.id
}

function battleMatchesFilters(
  battle: AdminAnalyticsBattle,
  filters: AnalyticsBattleFilters,
) {
  if (filters.source && battle.source !== filters.source) {
    return false
  }

  if (filters.mode && battle.mode !== filters.mode) {
    return false
  }

  if (filters.status && battle.status !== filters.status) {
    return false
  }

  if (filters.userId != null) {
    const userMatches =
      battle.participantA.userId === filters.userId ||
      battle.participantB.userId === filters.userId

    if (!userMatches) {
      return false
    }
  }

  if (filters.submissionId != null) {
    const submissionMatches =
      battle.participantA.submissionId === filters.submissionId ||
      battle.participantB.submissionId === filters.submissionId

    if (!submissionMatches) {
      return false
    }
  }

  if (filters.side) {
    if (filters.submissionId != null) {
      const sideMatches =
        (battle.participantA.submissionId === filters.submissionId &&
          battle.participantA.side === filters.side) ||
        (battle.participantB.submissionId === filters.submissionId &&
          battle.participantB.side === filters.side)

      if (!sideMatches) {
        return false
      }
    } else if (
      battle.participantA.side !== filters.side &&
      battle.participantB.side !== filters.side
    ) {
      return false
    }
  }

  return true
}

function getBattleActivityAt(battle: AdminAnalyticsBattle) {
  return (
    battle.finishedAt ?? battle.updatedAt ?? battle.startedAt ?? battle.createdAt
  )
}

export function listAnalyticsBattles(
  filters: AnalyticsBattleFilters = {},
): AdminAnalyticsBattle[] {
  const matchTokenRows = db.all<TokenRow>(sql`
    SELECT
      match_id AS battleId,
      side,
      SUM(COALESCE(prompt_tokens, 0)) AS promptTokens,
      SUM(COALESCE(completion_tokens, 0)) AS completionTokens
    FROM llm_calls
    WHERE match_id IS NOT NULL
    GROUP BY match_id, side
  `)
  const playgroundTokenRows = db.all<TokenRow>(sql`
    SELECT
      playground_run_id AS battleId,
      side,
      SUM(COALESCE(prompt_tokens, 0)) AS promptTokens,
      SUM(COALESCE(completion_tokens, 0)) AS completionTokens
    FROM llm_calls
    WHERE playground_run_id IS NOT NULL
    GROUP BY playground_run_id, side
  `)

  const matchTokens = buildTokenMaps(matchTokenRows)
  const playgroundTokens = buildTokenMaps(playgroundTokenRows)

  const tournamentBattles = db
    .select({
      createdAt: matches.createdAt,
      currentTurn: matches.currentTurn,
      error: matches.error,
      finishedAt: matches.finishedAt,
      id: matches.id,
      playerAModel: matchSubA.model,
      playerAName: matchUserA.displayName,
      playerAUserId: matchUserA.id,
      playerAVersion: matchSubA.version,
      playerBModel: matchSubB.model,
      playerBName: matchUserB.displayName,
      playerBUserId: matchUserB.id,
      playerBVersion: matchSubB.version,
      roleAName: scenarios.roleAName,
      roleBName: scenarios.roleBName,
      roundId: matches.roundId,
      roundNumber: rounds.roundNumber,
      scenarioId: matches.scenarioId,
      scenarioTitle: scenarios.title,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      startedAt: matches.startedAt,
      status: matches.status,
      subAId: matches.subAId,
      subBId: matches.subBId,
      tournamentId: rounds.tournamentId,
      updatedAt: matches.updatedAt,
      winner: matches.winner,
    })
    .from(matches)
    .innerJoin(rounds, eq(rounds.id, matches.roundId))
    .innerJoin(scenarios, eq(scenarios.id, matches.scenarioId))
    .innerJoin(matchSubA, eq(matchSubA.id, matches.subAId))
    .innerJoin(matchSubB, eq(matchSubB.id, matches.subBId))
    .innerJoin(matchUserA, eq(matchUserA.id, matchSubA.userId))
    .innerJoin(matchUserB, eq(matchUserB.id, matchSubB.userId))
    .all()
    .map((row) =>
      adminAnalyticsBattleSchema.parse({
        createdAt: row.createdAt,
        currentTurn: row.currentTurn,
        error: row.error,
        finishedAt: row.finishedAt,
        id: row.id,
        mode: null,
        participantA: buildSubmissionParticipant({
          battleId: row.id,
          model: row.playerAModel,
          roleName: row.roleAName,
          side: 'a',
          submissionId: row.subAId,
          tokenMap: matchTokens.byBattleSide,
          userDisplayName: row.playerAName,
          userId: row.playerAUserId,
          version: row.playerAVersion,
        }),
        participantB: buildSubmissionParticipant({
          battleId: row.id,
          model: row.playerBModel,
          roleName: row.roleBName,
          side: 'b',
          submissionId: row.subBId,
          tokenMap: matchTokens.byBattleSide,
          userDisplayName: row.playerBName,
          userId: row.playerBUserId,
          version: row.playerBVersion,
        }),
        roundId: row.roundId,
        roundNumber: row.roundNumber,
        scenarioId: row.scenarioId,
        scenarioTitle: row.scenarioTitle,
        scoreA: row.scoreA,
        scoreB: row.scoreB,
        source: 'tournament',
        startedAt: row.startedAt,
        status: row.status,
        totalCompletionTokens:
          matchTokens.byBattle.get(row.id)?.completionTokens ?? 0,
        totalPromptTokens: matchTokens.byBattle.get(row.id)?.promptTokens ?? 0,
        totalTokens: matchTokens.byBattle.get(row.id)?.totalTokens ?? 0,
        tournamentId: row.tournamentId,
        updatedAt: row.updatedAt,
        winner: row.winner,
      }),
    )

  const playgroundBattles = db
    .select({
      createdAt: playgroundRuns.createdAt,
      currentTurn:
        sql<number>`coalesce(json_array_length(${playgroundRuns.transcript}), 0)`.as(
          'currentTurn',
        ),
      error: playgroundRuns.error,
      finishedAt: playgroundRuns.finishedAt,
      id: playgroundRuns.id,
      mode: playgroundRuns.opponentMode,
      playerModel: playgroundSubmission.model,
      playerName: playgroundUser.displayName,
      playerUserId: playgroundUser.id,
      playerVersion: playgroundSubmission.version,
      presetOpponentId: playgroundRuns.presetOpponentId,
      presetOpponentLabel:
        sql<string | null>`coalesce(${playgroundRuns.presetOpponentLabel}, ${playgroundPreset.label})`.as(
          'presetOpponentLabel',
        ),
      presetOpponentRole:
        sql<'a' | 'b' | null>`coalesce(${playgroundRuns.presetOpponentRole}, ${playgroundPreset.role})`.as(
          'presetOpponentRole',
        ),
      roleAName: scenarios.roleAName,
      roleBName: scenarios.roleBName,
      scenarioId: playgroundRuns.scenarioId,
      scenarioTitle: scenarios.title,
      scoreA: playgroundRuns.scoreA,
      scoreB: playgroundRuns.scoreB,
      startedAt: playgroundRuns.startedAt,
      status: playgroundRuns.status,
      submissionId: playgroundRuns.submissionId,
      updatedAt: playgroundRuns.updatedAt,
      winner: playgroundRuns.winner,
    })
    .from(playgroundRuns)
    .innerJoin(scenarios, eq(scenarios.id, playgroundRuns.scenarioId))
    .innerJoin(playgroundSubmission, eq(playgroundSubmission.id, playgroundRuns.submissionId))
    .innerJoin(playgroundUser, eq(playgroundUser.id, playgroundSubmission.userId))
    .leftJoin(playgroundPreset, eq(playgroundPreset.id, playgroundRuns.presetOpponentId))
    .all()
    .map((row) => {
      const mode = row.mode === 'self' ? 'pvp' : 'pve'
      const presetRole = row.presetOpponentRole === 'a' ? 'a' : 'b'
      const participantA =
        mode === 'pvp'
          ? buildSubmissionParticipant({
              battleId: row.id,
              model: row.playerModel,
              roleName: row.roleAName,
              side: 'a',
              submissionId: row.submissionId,
              tokenMap: playgroundTokens.byBattleSide,
              userDisplayName: row.playerName,
              userId: row.playerUserId,
              version: row.playerVersion,
            })
          : presetRole === 'a'
            ? buildPresetParticipant({
                battleId: row.id,
                label: row.presetOpponentLabel,
                presetOpponentId: row.presetOpponentId,
                roleName: row.roleAName,
                side: 'a',
                tokenMap: playgroundTokens.byBattleSide,
              })
            : buildSubmissionParticipant({
                battleId: row.id,
                model: row.playerModel,
                roleName: row.roleAName,
                side: 'a',
                submissionId: row.submissionId,
                tokenMap: playgroundTokens.byBattleSide,
                userDisplayName: row.playerName,
                userId: row.playerUserId,
                version: row.playerVersion,
              })
      const participantB =
        mode === 'pvp'
          ? buildSubmissionParticipant({
              battleId: row.id,
              model: row.playerModel,
              roleName: row.roleBName,
              side: 'b',
              submissionId: row.submissionId,
              tokenMap: playgroundTokens.byBattleSide,
              userDisplayName: row.playerName,
              userId: row.playerUserId,
              version: row.playerVersion,
            })
          : presetRole === 'a'
            ? buildSubmissionParticipant({
                battleId: row.id,
                model: row.playerModel,
                roleName: row.roleBName,
                side: 'b',
                submissionId: row.submissionId,
                tokenMap: playgroundTokens.byBattleSide,
                userDisplayName: row.playerName,
                userId: row.playerUserId,
                version: row.playerVersion,
              })
            : buildPresetParticipant({
                battleId: row.id,
                label: row.presetOpponentLabel,
                presetOpponentId: row.presetOpponentId,
                roleName: row.roleBName,
                side: 'b',
                tokenMap: playgroundTokens.byBattleSide,
              })

      return adminAnalyticsBattleSchema.parse({
        createdAt: row.createdAt,
        currentTurn: row.currentTurn,
        error: row.error,
        finishedAt: row.finishedAt,
        id: row.id,
        mode,
        participantA,
        participantB,
        roundId: null,
        roundNumber: null,
        scenarioId: row.scenarioId,
        scenarioTitle: row.scenarioTitle,
        scoreA: row.scoreA,
        scoreB: row.scoreB,
        source: 'playground',
        startedAt: row.startedAt,
        status: row.status,
        totalCompletionTokens:
          playgroundTokens.byBattle.get(row.id)?.completionTokens ?? 0,
        totalPromptTokens:
          playgroundTokens.byBattle.get(row.id)?.promptTokens ?? 0,
        totalTokens: playgroundTokens.byBattle.get(row.id)?.totalTokens ?? 0,
        tournamentId: null,
        updatedAt: row.updatedAt ?? row.createdAt,
        winner: row.winner,
      })
    })

  const battles = [...tournamentBattles, ...playgroundBattles]
    .filter((battle) => battleMatchesFilters(battle, filters))
    .sort(compareCreatedAtDesc)

  const limit =
    filters.limit == null
      ? battles.length
      : Math.max(0, Math.min(filters.limit, battles.length))

  return battles.slice(0, limit)
}

export function listUserAnalyticsAgentSummaries(userId: number) {
  const submissionRows = db
    .select({
      createdAt: submissions.createdAt,
      model: submissions.model,
      retiredAt: submissions.retiredAt,
      scenarioId: submissions.scenarioId,
      scenarioTitle: scenarios.title,
      sideRoleAName: scenarios.roleAName,
      sideRoleBName: scenarios.roleBName,
      submissionId: submissions.id,
      userDisplayName: users.displayName,
      userId: submissions.userId,
      version: submissions.version,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.userId))
    .innerJoin(scenarios, eq(scenarios.id, submissions.scenarioId))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt), desc(submissions.id))
    .all()

  const summaries = new Map<string, AgentSummaryAccumulator>()

  for (const row of submissionRows) {
    for (const side of ['a', 'b'] as const) {
      const roleName = side === 'a' ? row.sideRoleAName : row.sideRoleBName
      const summary = adminAnalyticsAgentSummarySchema.parse({
        agentKey: `submission:${row.submissionId}:${side}`,
        avgScoreAgainst: null,
        avgScoreFor: null,
        battleCount: 0,
        createdAt: row.createdAt,
        draws: 0,
        errors: 0,
        lastBattleAt: null,
        losses: 0,
        model: row.model,
        pending: 0,
        playgroundPveCount: 0,
        playgroundPvpCount: 0,
        retiredAt: row.retiredAt,
        roleName,
        scenarioId: row.scenarioId,
        scenarioTitle: row.scenarioTitle,
        side,
        submissionId: row.submissionId,
        totalCompletionTokens: 0,
        totalPromptTokens: 0,
        totalTokens: 0,
        tournamentBattleCount: 0,
        userDisplayName: row.userDisplayName,
        userId: row.userId,
        version: row.version,
        wins: 0,
      })

      summaries.set(summary.agentKey, {
        ...summary,
        scoredBattleCount: 0,
        scoreAgainstSum: 0,
        scoreForSum: 0,
      })
    }
  }

  const battles = listAnalyticsBattles({ userId })

  for (const battle of battles) {
    for (const participant of [battle.participantA, battle.participantB]) {
      if (participant.kind !== 'submission' || participant.userId !== userId) {
        continue
      }

      const summary = summaries.get(participant.agentKey)

      if (!summary) {
        continue
      }

      summary.battleCount += 1
      summary.totalPromptTokens += participant.promptTokens
      summary.totalCompletionTokens += participant.completionTokens
      summary.totalTokens += participant.totalTokens

      if (battle.source === 'tournament') {
        summary.tournamentBattleCount += 1
      } else if (battle.mode === 'pvp') {
        summary.playgroundPvpCount += 1
      } else if (battle.mode === 'pve') {
        summary.playgroundPveCount += 1
      }

      if (battle.status === 'error') {
        summary.errors += 1
      } else if (battle.status !== 'scored') {
        summary.pending += 1
      }

      if (battle.status === 'scored') {
        if (battle.winner === 'draw' || battle.winner === null) {
          summary.draws += 1
        } else if (battle.winner === participant.side) {
          summary.wins += 1
        } else {
          summary.losses += 1
        }

        const scoreFor =
          participant.side === 'a' ? battle.scoreA : battle.scoreB
        const scoreAgainst =
          participant.side === 'a' ? battle.scoreB : battle.scoreA

        if (scoreFor != null && scoreAgainst != null) {
          summary.scoredBattleCount += 1
          summary.scoreForSum += scoreFor
          summary.scoreAgainstSum += scoreAgainst
        }
      }

      const activityAt = getBattleActivityAt(battle)
      if (!summary.lastBattleAt || activityAt > summary.lastBattleAt) {
        summary.lastBattleAt = activityAt
      }
    }
  }

  return [...summaries.values()]
    .map((summary) =>
      adminAnalyticsAgentSummarySchema.parse({
        ...summary,
        avgScoreAgainst:
          summary.scoredBattleCount > 0
            ? summary.scoreAgainstSum / summary.scoredBattleCount
            : null,
        avgScoreFor:
          summary.scoredBattleCount > 0
            ? summary.scoreForSum / summary.scoredBattleCount
            : null,
      }),
    )
    .sort((left, right) => {
      if (right.createdAt !== left.createdAt) {
        return right.createdAt.localeCompare(left.createdAt)
      }

      if (right.submissionId !== left.submissionId) {
        return right.submissionId - left.submissionId
      }

      return left.side.localeCompare(right.side)
    })
}

export function getAnalyticsAgentDetail(
  submissionId: number,
  side: 'a' | 'b',
) {
  const submission = db
    .select({
      userId: submissions.userId,
    })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .get()

  if (!submission) {
    return null
  }

  const summaries = listUserAnalyticsAgentSummaries(submission.userId)
  const summary =
    summaries.find(
      (item) => item.submissionId === submissionId && item.side === side,
    ) ?? null

  if (!summary) {
    return null
  }

  const recentBattles = listAnalyticsBattles({
    limit: 20,
    side,
    submissionId,
  })

  return adminAnalyticsAgentDetailSchema.parse({
    recentBattles,
    summary,
  })
}
