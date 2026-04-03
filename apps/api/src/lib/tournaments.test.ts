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
  matches,
  playgroundRuns,
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
  maybeAdvanceRound,
  syncRoundStatus,
} from './tournaments'

const migrationsFolder = new URL('../db/migrations', import.meta.url).pathname

beforeAll(() => {
  migrate(db, { migrationsFolder })
})

const TEST_SCENARIO_ID = 'test-scenario'

function cleanupTestData() {
  db.delete(matches).run()
  db.delete(rounds).run()
  db.delete(tournaments).run()
  db.delete(playgroundRuns).run()
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
      context: 'test context',
      roleAName: 'Role A',
      roleAPublicGoal: 'Goal A',
      roleBName: 'Role B',
      roleBPublicGoal: 'Goal B',
      boundaryConstraints: 'none',
      judgePrompt: 'judge',
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
        model: 'kimi-k2.5',
        version: 1,
      },
      {
        id: 2,
        userId: 2,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        model: 'kimi-k2.5',
        version: 1,
      },
      {
        id: 3,
        userId: 3,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        model: 'kimi-k2.5',
        version: 1,
      },
      {
        id: 4,
        userId: 4,
        scenarioId: TEST_SCENARIO_ID,
        promptA: 'a',
        promptB: 'b',
        model: 'kimi-k2.5',
        version: 1,
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
        model: 'kimi-k2.5',
        version: 1,
      })
      .run()

    const players = getLatestScenarioPlayers(TEST_SCENARIO_ID)

    expect(players).toHaveLength(4)
    expect(players.map((player) => player.userId)).toEqual([1, 2, 3, 4])
    expect(players.map((player) => player.submissionId)).toEqual([1, 2, 3, 4])
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
})
