import { eq } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'bun:test'

import { db } from '../db/client'
import {
  llmCalls,
  matches,
  playgroundRuns,
  presetOpponents,
  rounds,
  scenarios,
  submissions,
  tournaments,
  users,
} from '../db/schema'
import {
  advanceToNextRound,
  createRoundWithMatches,
  getLatestScenarioPlayers,
  getLatestScenarioPlayerPrompts,
  getLeaderboard,
  maybeAdvanceRound,
  syncRoundStatus,
  terminateTournament,
} from './tournaments'

const migrationsFolder = new URL('../db/migrations', import.meta.url).pathname

beforeAll(() => {
  migrate(db, { migrationsFolder })
})

const TEST_SCENARIO_ID = 'test-scenario'

function cleanupTestData() {
  db.delete(llmCalls).run()
  db.delete(matches).run()
  db.delete(rounds).run()
  db.delete(tournaments).run()
  db.delete(playgroundRuns).run()
  db.delete(presetOpponents).run()
  db.delete(submissions).run()
  db.delete(users).run()
  db.delete(scenarios).where(eq(scenarios.id, TEST_SCENARIO_ID)).run()
}

function seedTestData() {
  db.insert(scenarios)
    .values({
      id: TEST_SCENARIO_ID,
      title: 'Test Scenario',
      subject: 'test',
      roleAName: 'Role A',
      roleBName: 'Role B',
      judgePrompt: 'judge',
      scorerPrompt: 'scorer',
      agentPromptTemplate: 'template',
      examinationQuestionTemplate: 'question',
    })
    .run()

  db.insert(users)
    .values([
      {
        id: 1,
        email: 'a@test.com',
        passwordHash: 'x',
        displayName: 'Player A',
      },
      {
        id: 2,
        email: 'b@test.com',
        passwordHash: 'x',
        displayName: 'Player B',
      },
      {
        id: 3,
        email: 'c@test.com',
        passwordHash: 'x',
        displayName: 'Player C',
      },
      {
        id: 4,
        email: 'd@test.com',
        passwordHash: 'x',
        displayName: 'Player D',
      },
    ])
    .run()

  db.insert(submissions)
    .values([
      {
        id: 1,
        userId: 1,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        modelLegacy: 'kimi-k2.5',
        modelA: 'kimi-k2.5',
        modelB: 'kimi-k2.5',
        version: 1,
        createdAt: '2026-04-09 10:00:00',
      },
      {
        id: 2,
        userId: 2,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        modelLegacy: 'kimi-k2.5',
        modelA: 'kimi-k2.5',
        modelB: 'kimi-k2.5',
        version: 1,
        createdAt: '2026-04-09 10:00:00',
      },
      {
        id: 3,
        userId: 3,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        modelLegacy: 'kimi-k2.5',
        modelA: 'kimi-k2.5',
        modelB: 'kimi-k2.5',
        version: 1,
        createdAt: '2026-04-09 10:00:00',
      },
      {
        id: 4,
        userId: 4,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        modelLegacy: 'kimi-k2.5',
        modelA: 'kimi-k2.5',
        modelB: 'kimi-k2.5',
        version: 1,
        createdAt: '2026-04-09 10:00:00',
      },
    ])
    .run()
}

function createTestTournament(totalRounds = 4) {
  return db
    .insert(tournaments)
    .values({
      scenarioId: TEST_SCENARIO_ID,
      status: 'running',
      currentRound: 1,
      totalRounds,
    })
    .returning()
    .get()
}

function scoreAllMatchesInRound(roundId: number) {
  db.update(matches)
    .set({
      status: 'scored',
      winner: 'a',
      scoreA: 8,
      scoreB: 5,
      transcript: '[]',
      judgeTranscriptA: '[]',
      judgeTranscriptB: '[]',
      finishedAt: new Date().toISOString(),
    })
    .where(eq(matches.roundId, roundId))
    .run()
}

function scoreMatch(
  matchId: number,
  winner: 'a' | 'b' | 'draw',
  scoreA: number,
  scoreB: number,
) {
  db.update(matches)
    .set({
      status: 'scored',
      winner,
      scoreA,
      scoreB,
      transcript: '[]',
      judgeTranscriptA: '[]',
      judgeTranscriptB: '[]',
      finishedAt: new Date().toISOString(),
    })
    .where(eq(matches.id, matchId))
    .run()
}

describe('getLatestScenarioPlayers', () => {
  beforeEach(() => {
    cleanupTestData()
    seedTestData()
  })

  afterEach(() => {
    cleanupTestData()
  })

  it('excludes admin submissions from tournament pairings', () => {
    db.insert(users)
      .values({
        id: 5,
        email: 'admin@test.com',
        passwordHash: 'x',
        displayName: 'Admin Tester',
        isAdmin: true,
      })
      .run()

    db.insert(submissions)
      .values({
        id: 5,
        userId: 5,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'admin-a',
        promptB: 'admin-b',
        modelLegacy: 'kimi-k2.5',
        modelA: 'kimi-k2.5',
        modelB: 'kimi-k2.5',
        version: 1,
      })
      .run()

    const players = getLatestScenarioPlayers(TEST_SCENARIO_ID)

    expect(players).toHaveLength(4)
    expect(players.map((player) => player.userId)).toEqual([1, 2, 3, 4])
    expect(players.map((player) => player.submissionId)).toEqual([1, 2, 3, 4])
  })

  it('excludes retired submissions from current pairings', () => {
    db.update(submissions)
      .set({ retiredAt: '2026-04-09 12:00:00' })
      .where(eq(submissions.id, 4))
      .run()

    const players = getLatestScenarioPlayers(TEST_SCENARIO_ID)

    expect(players).toHaveLength(3)
    expect(players.map((player) => player.submissionId)).toEqual([1, 2, 3])
  })

  it('keeps later-retired submissions in historical snapshots', () => {
    db.update(submissions)
      .set({ retiredAt: '2026-04-09 12:00:00' })
      .where(eq(submissions.id, 4))
      .run()

    const players = getLatestScenarioPlayers(
      TEST_SCENARIO_ID,
      '2026-04-09 11:00:00',
    )

    expect(players).toHaveLength(4)
    expect(players.map((player) => player.submissionId)).toEqual([1, 2, 3, 4])
  })
})

describe('getLatestScenarioPlayerPrompts', () => {
  beforeEach(() => {
    cleanupTestData()
    seedTestData()
  })

  afterEach(() => {
    cleanupTestData()
  })

  it('returns the latest prompt pair for each non-admin player', () => {
    db.insert(submissions)
      .values({
        id: 10,
        userId: 1,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'latest prompt a',
        promptB: 'latest prompt b',
        modelLegacy: 'qwen3.5-397b-a17b',
        modelA: 'qwen3.5-397b-a17b',
        modelB: 'qwen3.5-397b-a17b',
        version: 2,
        createdAt: '2026-04-09 11:00:00',
      })
      .run()

    const players = getLatestScenarioPlayerPrompts(TEST_SCENARIO_ID)

    expect(players).toHaveLength(4)
    expect(players[0]).toMatchObject({
      userId: 1,
      submissionId: 10,
      promptA: 'latest prompt a',
      promptB: 'latest prompt b',
      version: 2,
    })
  })

  it('keeps later-retired prompts in historical snapshots', () => {
    db.update(submissions)
      .set({ retiredAt: '2026-04-09 12:00:00' })
      .where(eq(submissions.id, 4))
      .run()

    const players = getLatestScenarioPlayerPrompts(
      TEST_SCENARIO_ID,
      '2026-04-09 11:00:00',
    )

    expect(players).toHaveLength(4)
    expect(players.find((player) => player.submissionId === 4)).toMatchObject({
      promptA: 'a',
      promptB: 'b',
    })
  })
})

describe('getLeaderboard', () => {
  beforeEach(() => {
    cleanupTestData()
    seedTestData()
  })

  afterEach(() => {
    cleanupTestData()
  })

  it('tracks total and per-role win-loss records separately', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    const roundMatches = db
      .select()
      .from(matches)
      .where(eq(matches.roundId, round.id))
      .all()
    const firstLeg = roundMatches.find(
      (match) => match.subAId === 1 && match.subBId === 2,
    )
    const secondLeg = roundMatches.find(
      (match) => match.subAId === 2 && match.subBId === 1,
    )
    const thirdLeg = roundMatches.find(
      (match) => match.subAId === 3 && match.subBId === 4,
    )
    const fourthLeg = roundMatches.find(
      (match) => match.subAId === 4 && match.subBId === 3,
    )

    expect(firstLeg).toBeDefined()
    expect(secondLeg).toBeDefined()
    expect(thirdLeg).toBeDefined()
    expect(fourthLeg).toBeDefined()

    scoreMatch(firstLeg!.id, 'a', 8, 5)
    scoreMatch(secondLeg!.id, 'draw', 6, 6)
    scoreMatch(thirdLeg!.id, 'b', 4, 7)
    scoreMatch(fourthLeg!.id, 'a', 9, 3)

    const leaderboard = getLeaderboard(tournament.id)

    expect(leaderboard).not.toBeNull()
    expect(leaderboard?.map((entry) => entry.submissionId)).toEqual([
      4, 1, 2, 3,
    ])

    expect(leaderboard?.[0]).toMatchObject({
      submissionId: 4,
      wins: 2,
      losses: 0,
      roleAWins: 1,
      roleALosses: 0,
      roleBWins: 1,
      roleBLosses: 0,
    })
    expect(leaderboard?.[1]).toMatchObject({
      submissionId: 1,
      wins: 1.5,
      losses: 0,
      roleAWins: 1,
      roleALosses: 0,
      roleBWins: 0.5,
      roleBLosses: 0,
    })
    expect(leaderboard?.[2]).toMatchObject({
      submissionId: 2,
      wins: 0.5,
      losses: 1,
      roleAWins: 0.5,
      roleALosses: 0,
      roleBWins: 0,
      roleBLosses: 1,
    })
    expect(leaderboard?.[3]).toMatchObject({
      submissionId: 3,
      wins: 0,
      losses: 2,
      roleAWins: 0,
      roleALosses: 1,
      roleBWins: 0,
      roleBLosses: 1,
    })
  })
})

describe('maybeAdvanceRound', () => {
  beforeEach(() => {
    cleanupTestData()
    seedTestData()
  })

  afterEach(() => {
    cleanupTestData()
  })

  it('does nothing when round is not done', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    // Matches are still "queued", round is "running"
    maybeAdvanceRound(round.id)

    const roundRows = db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournament.id))
      .all()
    expect(roundRows).toHaveLength(1)
  })

  it('does nothing when round has errored matches', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)

    // Set one match to error
    const firstMatch = db
      .select()
      .from(matches)
      .where(eq(matches.roundId, round.id))
      .all()[0]
    db.update(matches)
      .set({ status: 'error', error: 'test error' })
      .where(eq(matches.id, firstMatch.id))
      .run()

    syncRoundStatus(round.id)
    maybeAdvanceRound(round.id)

    const roundRows = db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournament.id))
      .all()
    expect(roundRows).toHaveLength(1)
  })

  it('advances to next round when current round is complete', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)
    maybeAdvanceRound(round.id)

    const roundRows = db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournament.id))
      .all()
    expect(roundRows).toHaveLength(2)
    expect(roundRows[1].roundNumber).toBe(2)

    const updated = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournament.id))
      .get()
    expect(updated?.currentRound).toBe(2)
    expect(updated?.status).toBe('running')
  })

  it('marks tournament finished when all rounds complete', () => {
    const tournament = createTestTournament(1) // Only 1 round
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)
    maybeAdvanceRound(round.id)

    const updated = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournament.id))
      .get()
    expect(updated?.status).toBe('finished')

    // No new round created
    const roundRows = db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournament.id))
      .all()
    expect(roundRows).toHaveLength(1)
  })

  it('handles concurrent calls safely via optimistic lock', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)

    // Simulate concurrent calls
    maybeAdvanceRound(round.id)
    maybeAdvanceRound(round.id)

    // Only one new round should be created
    const roundRows = db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournament.id))
      .all()
    expect(roundRows).toHaveLength(2)
  })
})

describe('advanceToNextRound', () => {
  beforeEach(() => {
    cleanupTestData()
    seedTestData()
  })

  afterEach(() => {
    cleanupTestData()
  })

  it('returns null when round is not done', () => {
    const tournament = createTestTournament()
    createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    const result = advanceToNextRound(tournament.id)
    expect(result).toBeNull()
  })

  it('creates next round with swiss pairings', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)

    const result = advanceToNextRound(tournament.id)

    expect(result).not.toBeNull()
    expect(result!.round.roundNumber).toBe(2)
    // 2 pairs × 2 matches each (role reversal) = 4 matches, but Swiss may pair differently
    expect(result!.matches.length).toBeGreaterThan(0)
  })

  it('returns null on optimistic lock failure', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)

    // First call succeeds
    const result1 = advanceToNextRound(tournament.id)
    expect(result1).not.toBeNull()

    // Second call fails (currentRound already advanced)
    const result2 = advanceToNextRound(tournament.id)
    expect(result2).toBeNull()
  })

  it('returns null when tournament participants have been archived', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)
    const retiredAt = new Date(Date.now() + 60_000).toISOString()

    db.update(submissions).set({ retiredAt }).where(eq(submissions.id, 4)).run()

    const result = advanceToNextRound(tournament.id)

    expect(result).toBeNull()
  })

  it('returns null when tournament has been terminated', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    scoreAllMatchesInRound(round.id)
    syncRoundStatus(round.id)
    terminateTournament(tournament.id)

    const result = advanceToNextRound(tournament.id)

    expect(result).toBeNull()
  })
})

describe('terminateTournament', () => {
  beforeEach(() => {
    cleanupTestData()
    seedTestData()
  })

  afterEach(() => {
    cleanupTestData()
  })

  it('terminates the tournament and marks unfinished matches as errors', () => {
    const tournament = createTestTournament()
    const { round } = createRoundWithMatches({
      pairs: [
        [1, 2],
        [3, 4],
      ],
      roundNumber: 1,
      scenarioId: TEST_SCENARIO_ID,
      tournamentId: tournament.id,
    })

    const roundMatches = db
      .select()
      .from(matches)
      .where(eq(matches.roundId, round.id))
      .orderBy(matches.id)
      .all()

    db.update(matches)
      .set({
        leaseToken: 'lease-1',
        startedAt: '2026-04-09T12:00:00.000Z',
        status: 'running',
      })
      .where(eq(matches.id, roundMatches[0].id))
      .run()

    db.update(matches)
      .set({
        leaseToken: 'lease-2',
        startedAt: '2026-04-09T12:01:00.000Z',
        status: 'judging',
      })
      .where(eq(matches.id, roundMatches[1].id))
      .run()

    db.update(matches)
      .set({
        finishedAt: '2026-04-09T12:02:00.000Z',
        scoreA: 9,
        scoreB: 5,
        status: 'scored',
        winner: 'a',
      })
      .where(eq(matches.id, roundMatches[2].id))
      .run()

    const result = terminateTournament(tournament.id)

    expect(result).not.toBeNull()
    expect(result?.terminatedMatchCount).toBe(3)
    expect(result?.interruptedMatchIds).toEqual(
      expect.arrayContaining([roundMatches[0].id, roundMatches[1].id]),
    )

    const updatedTournament = db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournament.id))
      .get()
    const updatedRound = db
      .select()
      .from(rounds)
      .where(eq(rounds.id, round.id))
      .get()
    const updatedMatches = db
      .select()
      .from(matches)
      .where(eq(matches.roundId, round.id))
      .orderBy(matches.id)
      .all()

    expect(updatedTournament?.status).toBe('terminated')
    expect(updatedRound?.status).toBe('done')
    expect(updatedMatches[0]).toMatchObject({
      error: '管理员手动终止了当前赛事',
      leaseToken: null,
      status: 'error',
    })
    expect(updatedMatches[1]).toMatchObject({
      error: '管理员手动终止了当前赛事',
      leaseToken: null,
      status: 'error',
    })
    expect(updatedMatches[2]).toMatchObject({
      scoreA: 9,
      scoreB: 5,
      status: 'scored',
      winner: 'a',
    })
    expect(updatedMatches[3]).toMatchObject({
      error: '管理员手动终止了当前赛事',
      leaseToken: null,
      status: 'error',
    })

    syncRoundStatus(round.id)

    const resyncedRound = db
      .select()
      .from(rounds)
      .where(eq(rounds.id, round.id))
      .get()

    expect(resyncedRound?.status).toBe('done')
  })
})
