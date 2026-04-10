import {
  type AdminAnalyticsAgentDetail,
  type AdminAnalyticsAgentSummary,
  type AdminAnalyticsBattle,
  type AdminMonitorUser,
  type AdminPlayer,
  type AdminScenario,
  type AdminUser,
  type LeaderboardEntry,
  type PlaygroundRun,
  type PlaygroundRunStart,
  type PlaygroundRunSummary,
  type TournamentDetail,
} from '@axiia/shared'

import type { StartRoundResponse } from './types'

export function normalizeUser(user: AdminUser) {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    disabled: user.disabled,
    createdAt: user.createdAt,
  }
}

export function filterUsersByQuery(
  users: AdminUser[],
  options: { email?: string; name?: string; query?: string },
) {
  const emailNeedle = options.email?.trim().toLowerCase()
  const nameNeedle = options.name?.trim().toLowerCase()
  const queryNeedle = options.query?.trim().toLowerCase()

  return users.filter((user) => {
    const email = user.email.toLowerCase()
    const displayName = user.displayName.toLowerCase()

    if (emailNeedle && !email.includes(emailNeedle)) {
      return false
    }

    if (nameNeedle && !displayName.includes(nameNeedle)) {
      return false
    }

    if (
      queryNeedle &&
      !email.includes(queryNeedle) &&
      !displayName.includes(queryNeedle)
    ) {
      return false
    }

    return true
  })
}

export function normalizePlayer(player: AdminPlayer) {
  return {
    user: {
      id: player.userId,
      displayName: player.displayName,
      email: player.email,
    },
    submission: {
      id: player.submissionId,
      version: player.version,
      model: player.model,
      submittedAt: player.submittedAt,
    },
  }
}

export function normalizeStartRoundResponse(result: StartRoundResponse) {
  return {
    tournamentId: result.tournament.id,
    round: {
      id: result.round.id,
      number: result.round.roundNumber,
    },
    byeSubmissionIds: result.byeSubmissions,
    matches: result.matches.map((match) => ({
      id: match.id,
      status: match.status,
      submissions: {
        a: match.subAId,
        b: match.subBId,
      },
    })),
  }
}

export function normalizeTournamentStatus(tournament: TournamentDetail) {
  const currentRound = tournament.rounds.at(-1)

  if (!currentRound) {
    return {
      tournamentId: tournament.id,
      scenarioId: tournament.scenarioId,
      status: tournament.status,
      currentRound: null,
      totalRounds: tournament.totalRounds,
      roundCount: tournament.rounds.length,
      matches: {
        queued: 0,
        running: 0,
        scored: 0,
        errored: 0,
      },
    }
  }

  const queued = currentRound.matches.filter(
    (match) => match.status === 'queued',
  ).length
  const running = currentRound.matches.filter(
    (match) => match.status === 'running' || match.status === 'judging',
  ).length
  const scored = currentRound.matches.filter(
    (match) => match.status === 'scored',
  ).length
  const errored = currentRound.matches.filter(
    (match) => match.status === 'error',
  ).length

  return {
    tournamentId: tournament.id,
    scenarioId: tournament.scenarioId,
    status: tournament.status,
    currentRound: {
      id: currentRound.id,
      number: currentRound.roundNumber,
      status: currentRound.status,
    },
    totalRounds: tournament.totalRounds,
    roundCount: tournament.rounds.length,
    matches: {
      queued,
      running,
      scored,
      errored,
    },
  }
}

export function normalizeLeaderboardEntry(entry: LeaderboardEntry) {
  return {
    rank: entry.rank,
    submissionId: entry.submissionId,
    playerName: entry.playerName,
    model: entry.modelLabel,
    wins: entry.wins,
    losses: entry.losses,
    winRate: entry.winRate,
    buchholz: entry.buchholz,
    status: entry.status,
  }
}

export function normalizeScenarioSummary(scenario: AdminScenario) {
  return {
    id: scenario.id,
    title: scenario.title,
    subject: scenario.subject,
    turnCount: scenario.turnCount,
    locked: scenario.locked,
  }
}

export function normalizePlaygroundRunStart(
  submissionId: number,
  run: PlaygroundRunStart,
) {
  return {
    submissionId,
    run: {
      id: run.id,
      status: run.status,
    },
  }
}

export function normalizePlaygroundRunSummary(run: PlaygroundRunSummary) {
  return {
    runId: run.id,
    submissionId: run.submissionId,
    opponentMode: run.opponentMode,
    presetOpponentId: run.presetOpponentId,
    score: {
      a: run.scoreA,
      b: run.scoreB,
    },
    winner: run.winner,
    error: run.error,
    createdAt: run.createdAt,
  }
}

export function normalizePlaygroundRun(run: PlaygroundRun) {
  return {
    runId: run.id,
    submissionId: run.submissionId,
    scenarioId: run.scenarioId,
    opponentMode: run.opponentMode,
    presetOpponentId: run.presetOpponentId,
    presetOpponentRole: run.presetOpponentRole,
    presetOpponentLabel: run.presetOpponentLabel,
    actualPromptA: run.actualPromptA,
    actualPromptB: run.actualPromptB,
    transcript: run.transcript,
    judgeTranscriptA: run.judgeTranscriptA,
    judgeTranscriptB: run.judgeTranscriptB,
    infoAssignment: run.infoAssignment,
    judgeDecision: run.judgeDecision,
    score: {
      a: run.scoreA,
      b: run.scoreB,
    },
    winner: run.winner,
    reasoning: run.reasoning,
    error: run.error,
    timing: {
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      updatedAt: run.updatedAt,
    },
  }
}

function normalizeBattleParticipant(
  participant: AdminAnalyticsBattle['participantA'],
) {
  return {
    agentKey: participant.agentKey,
    kind: participant.kind,
    side: participant.side,
    label: participant.label,
    roleName: participant.roleName,
    submissionId: participant.submissionId,
    presetOpponentId: participant.presetOpponentId,
    presetLabel: participant.presetLabel,
    user:
      participant.userId == null
        ? null
        : {
            id: participant.userId,
            displayName: participant.userDisplayName,
          },
    version: participant.version,
    model: participant.model,
    tokens: {
      prompt: participant.promptTokens,
      completion: participant.completionTokens,
      total: participant.totalTokens,
    },
  }
}

export function normalizeBattle(battle: AdminAnalyticsBattle) {
  const winnerParticipant =
    battle.winner === 'a'
      ? battle.participantA
      : battle.winner === 'b'
        ? battle.participantB
        : null

  return {
    battleKey: `${battle.source}:${battle.id}`,
    id: battle.id,
    source: battle.source,
    mode: battle.mode,
    kind: battle.source === 'tournament' ? 'tournament' : battle.mode,
    scenario: {
      id: battle.scenarioId,
      title: battle.scenarioTitle,
    },
    context: {
      tournamentId: battle.tournamentId,
      roundId: battle.roundId,
      roundNumber: battle.roundNumber,
    },
    status: battle.status,
    transcriptTurnCount: battle.currentTurn,
    score: {
      a: battle.scoreA,
      b: battle.scoreB,
    },
    winner:
      battle.winner == null
        ? null
        : battle.winner === 'draw'
          ? { kind: 'draw' as const }
          : {
              kind: 'participant' as const,
              side: battle.winner,
              agentKey: winnerParticipant?.agentKey ?? null,
              label: winnerParticipant?.label ?? null,
            },
    participants: {
      a: normalizeBattleParticipant(battle.participantA),
      b: normalizeBattleParticipant(battle.participantB),
    },
    tokens: {
      prompt: battle.totalPromptTokens,
      completion: battle.totalCompletionTokens,
      total: battle.totalTokens,
    },
    timing: {
      createdAt: battle.createdAt,
      startedAt: battle.startedAt,
      finishedAt: battle.finishedAt,
      updatedAt: battle.updatedAt,
    },
    error: battle.error,
  }
}

export function normalizeAgentSummary(agent: AdminAnalyticsAgentSummary) {
  return {
    agentKey: agent.agentKey,
    label: `${agent.userDisplayName} · v${agent.version} · ${agent.roleName}`,
    submissionId: agent.submissionId,
    side: agent.side,
    roleName: agent.roleName,
    user: {
      id: agent.userId,
      displayName: agent.userDisplayName,
    },
    version: agent.version,
    model: agent.model,
    scenario: {
      id: agent.scenarioId,
      title: agent.scenarioTitle,
    },
    lifecycle: {
      createdAt: agent.createdAt,
      retiredAt: agent.retiredAt,
      lastBattleAt: agent.lastBattleAt,
    },
    battles: {
      total: agent.battleCount,
      tournament: agent.tournamentBattleCount,
      playground: {
        pvp: agent.playgroundPvpCount,
        pve: agent.playgroundPveCount,
      },
      outcomes: {
        wins: agent.wins,
        losses: agent.losses,
        draws: agent.draws,
        pending: agent.pending,
        errors: agent.errors,
      },
    },
    scoring: {
      avgFor: agent.avgScoreFor,
      avgAgainst: agent.avgScoreAgainst,
    },
    tokens: {
      prompt: agent.totalPromptTokens,
      completion: agent.totalCompletionTokens,
      total: agent.totalTokens,
    },
  }
}

export function normalizeAgentDetail(detail: AdminAnalyticsAgentDetail) {
  return {
    agent: normalizeAgentSummary(detail.summary),
    recentBattleCount: detail.recentBattles.length,
    recentBattles: detail.recentBattles.map(normalizeBattle),
  }
}

export function normalizeMonitorUser(user: AdminMonitorUser) {
  return {
    user: {
      id: user.userId,
      displayName: user.displayName,
      email: user.email,
      disabled: user.disabled,
    },
    submissions: {
      count: user.submissionCount,
      latestVersion: user.latestVersion,
    },
    battles: {
      playground: user.playgroundRunCount,
      tournament: user.matchCount,
    },
    tokens: {
      prompt: user.totalPromptTokens,
      completion: user.totalCompletionTokens,
      total: user.totalTokens,
      isOverSoftCap: user.isOverSoftCap,
    },
    lastActiveAt: user.lastActiveAt,
  }
}
