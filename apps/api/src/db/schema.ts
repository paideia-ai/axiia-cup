import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const tournamentStatuses = [
  'open',
  'running',
  'finished',
  'terminated',
] as const
const pairingModes = ['auto', 'manual'] as const
const roundStatuses = ['pairing', 'running', 'done'] as const
const matchStatuses = [
  'queued',
  'running',
  'judging',
  'scored',
  'error',
] as const
const matchWinners = ['a', 'b', 'draw'] as const
const llmCallPhases = [
  'dialogue',
  'examination',
  'judgment',
  'scoring',
] as const
const llmCallSides = ['a', 'b', 'judge', 'scorer'] as const
// NOTE: CHECK constraints in DB updated in 0005_llm_calls_telemetry.sql
// to match these enums (previously missing 'scoring' and 'scorer').

const currentTimestamp = sql`CURRENT_TIMESTAMP`

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull().default('momo'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export const appSettings = sqliteTable('appSettings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export const scenarios = sqliteTable('scenarios', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  turnCount: integer('turn_count').notNull().default(10),
  judgeModel: text('judge_model').notNull().default('deepseek-v3.2'),
  scorerModel: text('scorer_model').notNull().default('deepseek-v3.2'),
  openingLine: text('opening_line')
    .notNull()
    .default(
      '卫鞅，寡人今日召你与甘龙太师当堂论辩，就变法一事各陈其辞。你先说。',
    ),
  // Prompt templates (admin-controlled)
  agentPromptTemplate: text('agent_prompt_template').notNull(),
  examinationQuestionTemplate: text('examination_question_template')
    .notNull()
    .default(''),
  judgePrompt: text('judge_prompt').notNull(),
  scorerPrompt: text('scorer_prompt').notNull().default(''),
  // Role A
  roleAName: text('role_a_name').notNull(),
  roleAHiddenInfo: text('role_a_hidden_info').notNull().default('[]'),
  roleAOptions: text('role_a_options').notNull().default('[]'),
  roleARequests: text('role_a_requests').notNull().default('[]'),
  // Role B
  roleBName: text('role_b_name').notNull(),
  roleBHiddenInfo: text('role_b_hidden_info').notNull().default('[]'),
  roleBOptions: text('role_b_options').notNull().default('[]'),
  roleBRequests: text('role_b_requests').notNull().default('[]'),
  // Randomization config
  falseInfoCount: integer('false_info_count').notNull().default(1),
  trueRequestCount: integer('true_request_count').notNull().default(1),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export type ScenarioRecord = typeof scenarios.$inferSelect

export const submissions = sqliteTable(
  'submissions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    scenarioId: text('scenario_id')
      .notNull()
      .references(() => scenarios.id),
    promptA: text('prompt_a').notNull(),
    promptB: text('prompt_b').notNull(),
    modelLegacy: text('model').notNull(),
    modelA: text('model_a').notNull(),
    modelB: text('model_b').notNull(),
    roleAOptionId: text('role_a_option_id'),
    roleBOptionId: text('role_b_option_id'),
    retiredAt: text('retired_at'),
    version: integer('version').notNull(),
    createdAt: text('created_at').notNull().default(currentTimestamp),
  },
  (table) => ({
    scenarioCreatedAtIdx: index('submissions_scenario_id_created_at_idx').on(
      table.scenarioId,
      table.createdAt,
    ),
    userScenarioVersion: uniqueIndex('submissions_user_scenario_version').on(
      table.userId,
      table.scenarioId,
      table.version,
    ),
  }),
)

const opponentModes = ['self', 'preset'] as const

export const presetOpponents = sqliteTable('preset_opponents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => scenarios.id),
  role: text('role', { enum: ['a', 'b'] as const }).notNull(),
  label: text('label').notNull(),
  prompt: text('prompt').notNull(),
  createdAt: text('created_at').notNull().default(currentTimestamp),
})

export const playgroundRuns = sqliteTable(
  'playground_runs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    submissionId: integer('submission_id')
      .notNull()
      .references(() => submissions.id),
    status: text('status', {
      enum: ['queued', 'running', 'scored', 'error'] as const,
    })
      .notNull()
      .default('queued'),
    leaseToken: text('lease_token'),
    scenarioId: text('scenario_id')
      .notNull()
      .references(() => scenarios.id),
    opponentMode: text('opponent_mode', { enum: opponentModes })
      .notNull()
      .default('self'),
    presetOpponentId: integer('preset_opponent_id').references(
      () => presetOpponents.id,
    ),
    presetOpponentRole: text('preset_opponent_role', {
      enum: ['a', 'b'] as const,
    }),
    presetOpponentLabel: text('preset_opponent_label'),
    actualPromptA: text('actual_prompt_a'),
    actualPromptB: text('actual_prompt_b'),
    transcript: text('transcript').notNull().default('[]'),
    judgeTranscriptA: text('judge_transcript_a').notNull().default('[]'),
    judgeTranscriptB: text('judge_transcript_b').notNull().default('[]'),
    infoAssignment: text('info_assignment'),
    judgeDecision: text('judge_decision'),
    scoreA: real('score_a'),
    scoreB: real('score_b'),
    winner: text('winner', { enum: matchWinners }),
    reasoning: text('reasoning'),
    error: text('error'),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    createdAt: text('created_at').notNull().default(currentTimestamp),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    statusCreatedAtIdx: index('playground_runs_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
    submissionCreatedAtIdx: index(
      'playground_runs_submission_id_created_at_idx',
    ).on(table.submissionId, table.createdAt),
  }),
)

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
    pairingMode: text('pairing_mode', { enum: pairingModes })
      .notNull()
      .default('auto'),
    modelOverride: text('model_override'),
    createdAt: text('created_at').notNull().default(currentTimestamp),
  },
  (table) => ({
    statusCheck: check(
      'tournaments_status_check',
      sql`${table.status} in ('open', 'running', 'finished', 'terminated')`,
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
    tournamentRoundNumberIdx: index('rounds_tournament_id_round_number_idx').on(
      table.tournamentId,
      table.roundNumber,
    ),
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
    infoAssignment: text('info_assignment'),
    judgeDecision: text('judge_decision'),
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
    roundIdIdx: index('matches_round_id_idx').on(table.roundId),
    statusCreatedAtIdx: index('matches_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
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

export const llmCalls = sqliteTable(
  'llm_calls',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    matchId: integer('match_id').references(() => matches.id),
    playgroundRunId: integer('playground_run_id').references(
      () => playgroundRuns.id,
    ),
    userId: integer('user_id').references(() => users.id),
    phase: text('phase', { enum: llmCallPhases }).notNull(),
    side: text('side', { enum: llmCallSides }).notNull(),
    turnIndex: integer('turn_index'),
    attempt: integer('attempt').notNull().default(1),
    model: text('model').notNull(),
    provider: text('provider').notNull().default('siliconflow'),
    requestJson: text('request_json').notNull(),
    responseJson: text('response_json'),
    responseContent: text('response_content'),
    error: text('error'),
    durationMs: integer('duration_ms').notNull(),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    createdAt: text('created_at').notNull().default(currentTimestamp),
  },
  (table) => ({
    matchIdx: index('llm_calls_match_id_idx').on(table.matchId),
    playgroundRunIdx: index('llm_calls_playground_run_id_idx').on(
      table.playgroundRunId,
    ),
    userIdx: index('llm_calls_user_id_idx').on(table.userId),
    phaseCheck: check(
      'llm_calls_phase_check',
      sql`${table.phase} in ('dialogue', 'examination', 'judgment', 'scoring')`,
    ),
    sideCheck: check(
      'llm_calls_side_check',
      sql`${table.side} in ('a', 'b', 'judge', 'scorer')`,
    ),
    attemptCheck: check('llm_calls_attempt_check', sql`${table.attempt} > 0`),
    durationCheck: check(
      'llm_calls_duration_ms_check',
      sql`${table.durationMs} >= 0`,
    ),
    targetCheck: check(
      'llm_calls_target_check',
      sql`(${table.matchId} is not null and ${table.playgroundRunId} is null) or (${table.matchId} is null and ${table.playgroundRunId} is not null)`,
    ),
  }),
)

export const schema = {
  users,
  appSettings,
  scenarios,
  submissions,
  presetOpponents,
  playgroundRuns,
  tournaments,
  rounds,
  matches,
  llmCalls,
}

export type OpponentMode = (typeof opponentModes)[number]
export type PairingMode = (typeof pairingModes)[number]
export type TournamentStatus = (typeof tournamentStatuses)[number]
export type RoundStatus = (typeof roundStatuses)[number]
export type MatchStatus = (typeof matchStatuses)[number]
export type MatchWinner = (typeof matchWinners)[number]
export type LlmCallPhase = (typeof llmCallPhases)[number]
export type LlmCallSide = (typeof llmCallSides)[number]
