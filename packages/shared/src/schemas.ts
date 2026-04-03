import { z } from 'zod'

import { modelIds } from './constants'

export const modelIdSchema = z.enum(modelIds)
export const tournamentStatusSchema = z.enum(['open', 'running', 'finished'])
export const roundStatusSchema = z.enum(['pairing', 'running', 'done'])
export const matchStatusSchema = z.enum([
  'queued',
  'running',
  'judging',
  'scored',
  'error',
])
export const matchWinnerSchema = z.enum(['a', 'b', 'draw'])

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  isAdmin: z.boolean(),
})

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
})

export const okResponseSchema = z.object({
  ok: z.literal(true),
})

export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  context: z.string(),
  roleAName: z.string(),
  roleAPublicGoal: z.string(),
  roleBName: z.string(),
  roleBPublicGoal: z.string(),
  boundaryConstraints: z.string(),
  turnCount: z.number().int().positive(),
  judgeRounds: z.number().int().positive(),
  judgePrompt: z.string(),
})

export const modelOptionSchema = z.object({
  id: modelIdSchema,
  label: z.string(),
})

export const scenarioSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  summary: z.string(),
  turnCount: z.number().int().positive(),
  roleAName: z.string(),
  roleBName: z.string(),
})

export const leaderboardEntrySchema = z.object({
  submissionId: z.number().int().positive(),
  rank: z.number().int().positive(),
  playerName: z.string(),
  modelLabel: z.string(),
  wins: z.number().nonnegative(),
  losses: z.number().int().nonnegative(),
  buchholz: z.number().nonnegative(),
  winRate: z.number().min(0).max(100),
  status: z.enum(['queued', 'running', 'done']),
})

export const matchTranscriptTurnSchema = z.object({
  id: z.string(),
  speaker: z.enum(['roleA', 'roleB', 'judge']),
  label: z.string(),
  content: z.string(),
})

export const transcriptTurnSchema = z.object({
  speaker: z.enum(['a', 'b']),
  role: z.string(),
  content: z.string(),
})

export const judgeQASchema = z.object({
  round: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
})

export const judgeScoringSchema = z.object({
  score_a: z.number(),
  score_b: z.number(),
  winner: matchWinnerSchema,
  reasoning: z.string(),
})

export const submissionSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  promptA: z.string(),
  promptB: z.string(),
  model: modelIdSchema,
  version: z.number().int().positive(),
  createdAt: z.string(),
})

export const createSubmissionSchema = z.object({
  scenarioId: z.string().min(1),
  promptA: z.string().trim().min(1).max(1000),
  promptB: z.string().trim().min(1).max(1000),
  model: modelIdSchema,
})

export const matchSchema = z.object({
  id: z.number().int().positive(),
  roundId: z.number().int().positive(),
  scenarioId: z.string(),
  subAId: z.number().int().positive(),
  subBId: z.number().int().positive(),
  status: matchStatusSchema,
  currentTurn: z.number().int().nonnegative(),
  transcript: z.array(transcriptTurnSchema),
  judgeTranscriptA: z.array(judgeQASchema),
  judgeTranscriptB: z.array(judgeQASchema),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  reasoning: z.string().nullable(),
  error: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const adminPlayerSchema = z.object({
  userId: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  model: modelIdSchema,
  version: z.number().int().positive(),
  submittedAt: z.string(),
})

export const tournamentListItemSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  status: tournamentStatusSchema,
  currentRound: z.number().int().nonnegative(),
  totalRounds: z.number().int().positive(),
  roundCount: z.number().int().nonnegative(),
  createdAt: z.string(),
})

export const tournamentMatchSummarySchema = z.object({
  id: z.number().int().positive(),
  roundId: z.number().int().positive(),
  scenarioId: z.string(),
  subAId: z.number().int().positive(),
  subBId: z.number().int().positive(),
  status: matchStatusSchema,
  currentTurn: z.number().int().nonnegative(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
})

export const tournamentRoundSchema = z.object({
  id: z.number().int().positive(),
  tournamentId: z.number().int().positive(),
  roundNumber: z.number().int().positive(),
  status: roundStatusSchema,
  byeSubmissions: z.array(z.number().int().positive()),
  matches: z.array(tournamentMatchSummarySchema),
})

export const tournamentSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  status: tournamentStatusSchema,
  currentRound: z.number().int().nonnegative(),
  totalRounds: z.number().int().positive(),
  createdAt: z.string(),
})

export const tournamentDetailSchema = tournamentSchema.extend({
  rounds: z.array(tournamentRoundSchema),
})

export const matchDetailSchema = matchSchema.extend({
  tournamentId: z.number().int().positive(),
  roundNumber: z.number().int().positive(),
  playerADisplayName: z.string(),
  playerAModel: modelIdSchema,
  playerBDisplayName: z.string(),
  playerBModel: modelIdSchema,
})

export const playgroundRunSchema = z.object({
  id: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  scenarioId: z.string(),
  transcript: z.array(transcriptTurnSchema),
  judgeTranscriptA: z.array(judgeQASchema),
  judgeTranscriptB: z.array(judgeQASchema),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  reasoning: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
})

export const playgroundRunStartSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal('queued'),
})

export const playgroundRunSummarySchema = z.object({
  id: z.number().int().positive(),
  submissionId: z.number().int().positive(),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: matchWinnerSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
})

export const personalStatsSchema = z.object({
  rank: z.number().int().positive().nullable(),
  winRate: z.number().min(0).max(100).nullable(),
  submissionCount: z.number().int().nonnegative(),
  pendingMatchCount: z.number().int().nonnegative(),
  completedMatchCount: z.number().int().nonnegative(),
  currentVersion: z.number().int().positive().nullable(),
  scenarioTitle: z.string().nullable(),
  tournamentRound: z.number().int().nonnegative().nullable(),
})

export const adminStatsSchema = z.object({
  queued: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  scored: z.number().int().nonnegative(),
})

export const adminErroredMatchSchema = z.object({
  id: z.number().int().positive(),
  tournamentId: z.number().int().positive(),
  roundId: z.number().int().positive(),
  roundNumber: z.number().int().positive(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  status: z.literal('error'),
  playerADisplayName: z.string(),
  playerAModel: modelIdSchema,
  playerBDisplayName: z.string(),
  playerBModel: modelIdSchema,
  error: z.string().nullable(),
  createdAt: z.string(),
})

export const recentMatchSchema = z.object({
  id: z.number().int().positive(),
  status: matchStatusSchema,
  scenarioTitle: z.string(),
  scenarioId: z.string(),
  roleALabel: z.string(),
  roleBLabel: z.string(),
  winner: matchWinnerSchema.nullable(),
  opponentName: z.string(),
  model: z.string(),
  mySide: z.enum(['a', 'b']),
  createdAt: z.string(),
})

export const appMetaSchema = z.object({
  name: z.string(),
  stage: z.literal('mvp'),
  models: z.array(modelOptionSchema),
  scenarios: z.array(scenarioSummarySchema),
})

export type Scenario = z.infer<typeof scenarioSchema>
export type ScenarioSummary = z.infer<typeof scenarioSummarySchema>
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>
export type MatchTranscriptTurn = z.infer<typeof matchTranscriptTurnSchema>
export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>
export type JudgeQA = z.infer<typeof judgeQASchema>
export type JudgeScoring = z.infer<typeof judgeScoringSchema>
export type Submission = z.infer<typeof submissionSchema>
export type AdminPlayer = z.infer<typeof adminPlayerSchema>
export type TournamentListItem = z.infer<typeof tournamentListItemSchema>
export type TournamentMatchSummary = z.infer<
  typeof tournamentMatchSummarySchema
>
export type TournamentRound = z.infer<typeof tournamentRoundSchema>
export type Tournament = z.infer<typeof tournamentSchema>
export type TournamentDetail = z.infer<typeof tournamentDetailSchema>
export type MatchDetail = z.infer<typeof matchDetailSchema>
export type PlaygroundRun = z.infer<typeof playgroundRunSchema>
export type PlaygroundRunStart = z.infer<typeof playgroundRunStartSchema>
export type PlaygroundRunSummary = z.infer<typeof playgroundRunSummarySchema>
export type PersonalStats = z.infer<typeof personalStatsSchema>
export type AdminStats = z.infer<typeof adminStatsSchema>
export type AdminErroredMatch = z.infer<typeof adminErroredMatchSchema>
export type RecentMatch = z.infer<typeof recentMatchSchema>
export type Match = z.infer<typeof matchSchema>
export type AppMeta = z.infer<typeof appMetaSchema>
export type User = z.infer<typeof userSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
