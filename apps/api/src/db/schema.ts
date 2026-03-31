import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

const tournamentStatuses = ['open', 'running', 'finished'] as const
const roundStatuses = ['pairing', 'running', 'done'] as const
const matchStatuses = [
  'queued',
  'running',
  'judging',
  'scored',
  'error',
] as const
const matchWinners = ['a', 'b', 'draw'] as const

const currentTimestamp = sql`CURRENT_TIMESTAMP`

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull().default('momo'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export const scenarios = sqliteTable('scenarios', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  context: text('context').notNull(),
  roleAName: text('role_a_name').notNull(),
  roleAPublicGoal: text('role_a_public_goal').notNull(),
  roleBName: text('role_b_name').notNull(),
  roleBPublicGoal: text('role_b_public_goal').notNull(),
  boundaryConstraints: text('boundary_constraints').notNull(),
  turnCount: integer('turn_count').notNull().default(10),
  judgeRounds: integer('judge_rounds').notNull().default(3),
  judgePrompt: text('judge_prompt').notNull(),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export type ScenarioRecord = typeof scenarios.$inferSelect

export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => scenarios.id),
  promptA: text('prompt_a').notNull(),
  promptB: text('prompt_b').notNull(),
  model: text('model').notNull(),
  version: integer('version').notNull(),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export const playgroundRuns = sqliteTable('playground_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  submissionId: integer('submission_id')
    .notNull()
    .references(() => submissions.id),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => scenarios.id),
  transcript: text('transcript').notNull().default('[]'),
  judgeTranscriptA: text('judge_transcript_a').notNull().default('[]'),
  judgeTranscriptB: text('judge_transcript_b').notNull().default('[]'),
  scoreA: real('score_a'),
  scoreB: real('score_b'),
  winner: text('winner', { enum: matchWinners }),
  reasoning: text('reasoning'),
  error: text('error'),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export const tournaments = sqliteTable(
  'tournaments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    scenarioId: text('scenario_id')
      .notNull()
      .references(() => scenarios.id),
    status: text('status', { enum: tournamentStatuses })
      .notNull()
      .default('open'),
    currentRound: integer('current_round').notNull().default(0),
    totalRounds: integer('total_rounds').notNull().default(4),
    createdAt: text('created_at').notNull().default(currentTimestamp),
  },
  (table) => ({
    statusCheck: check(
      'tournaments_status_check',
      sql`${table.status} in ('open', 'running', 'finished')`,
    ),
  }),
)

export const rounds = sqliteTable(
  'rounds',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => tournaments.id),
    roundNumber: integer('round_number').notNull(),
    status: text('status', { enum: roundStatuses }).notNull(),
  },
  (table) => ({
    statusCheck: check(
      'rounds_status_check',
      sql`${table.status} in ('pairing', 'running', 'done')`,
    ),
  }),
)

export const matches = sqliteTable(
  'matches',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    roundId: integer('round_id')
      .notNull()
      .references(() => rounds.id),
    scenarioId: text('scenario_id')
      .notNull()
      .references(() => scenarios.id),
    subAId: integer('sub_a_id')
      .notNull()
      .references(() => submissions.id),
    subBId: integer('sub_b_id')
      .notNull()
      .references(() => submissions.id),
    status: text('status', { enum: matchStatuses }).notNull().default('queued'),
    currentTurn: integer('current_turn').notNull().default(0),
    transcript: text('transcript').notNull().default('[]'),
    judgeTranscriptA: text('judge_transcript_a').notNull().default('[]'),
    judgeTranscriptB: text('judge_transcript_b').notNull().default('[]'),
    scoreA: real('score_a'),
    scoreB: real('score_b'),
    winner: text('winner', { enum: matchWinners }),
    reasoning: text('reasoning'),
    error: text('error'),
    leaseToken: text('lease_token'),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    updatedAt: text('updated_at'),
    createdAt: text('created_at').notNull().default(currentTimestamp),
  },
  (table) => ({
    statusCheck: check(
      'matches_status_check',
      sql`${table.status} in ('queued', 'running', 'judging', 'scored', 'error')`,
    ),
    winnerCheck: check(
      'matches_winner_check',
      sql`${table.winner} in ('a', 'b', 'draw') or ${table.winner} is null`,
    ),
  }),
)

export const schema = {
  users,
  scenarios,
  submissions,
  playgroundRuns,
  tournaments,
  rounds,
  matches,
}

export type TournamentStatus = (typeof tournamentStatuses)[number]
export type RoundStatus = (typeof roundStatuses)[number]
export type MatchStatus = (typeof matchStatuses)[number]
export type MatchWinner = (typeof matchWinners)[number]
