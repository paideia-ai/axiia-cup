import { z } from "zod";

import { modelIds } from "./constants";

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  isAdmin: z.boolean(),
});

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
  judgePrompt: z.string(),
  judgeRounds: z.number().int().positive(),
});

export const modelOptionSchema = z.object({
  id: z.enum(modelIds),
  label: z.string(),
  provider: z.string(),
  description: z.string(),
});

export const scenarioSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  summary: z.string(),
  turnCount: z.number().int().positive(),
  judgeRounds: z.number().int().positive(),
  roleAName: z.string(),
  roleBName: z.string(),
});

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerName: z.string(),
  modelLabel: z.string(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  buchholz: z.number().nonnegative(),
  winRate: z.number().min(0).max(100),
  status: z.enum(["queued", "running", "done"]),
});

export const matchTranscriptTurnSchema = z.object({
  id: z.string(),
  speaker: z.enum(["roleA", "roleB", "judge"]),
  label: z.string(),
  content: z.string(),
});

export const transcriptTurnSchema = z.object({
  speaker: z.enum(["a", "b"]),
  role: z.string(),
  content: z.string(),
});

export const judgeQASchema = z.object({
  round: z.number().int().positive(),
  question: z.string(),
  answer: z.string(),
});

export const judgeScoringSchema = z.object({
  score_a: z.number(),
  score_b: z.number(),
  winner: z.enum(["a", "b", "draw"]),
  reasoning: z.string(),
});

export const submissionSchema = z.object({
  id: z.number().int().positive(),
  scenarioId: z.string(),
  promptA: z.string(),
  promptB: z.string(),
  model: z.enum(modelIds),
  version: z.number().int().positive(),
  createdAt: z.string(),
});

export const createSubmissionSchema = z.object({
  scenarioId: z.string().min(1),
  promptA: z.string().trim().min(1).max(1000),
  promptB: z.string().trim().min(1).max(1000),
  model: z.enum(modelIds),
});

export const matchSchema = z.object({
  id: z.number().int().positive(),
  roundId: z.number().int().positive(),
  scenarioId: z.string(),
  subAId: z.number().int().positive(),
  subBId: z.number().int().positive(),
  status: z.enum(["queued", "running", "judging", "scored", "error"]),
  currentTurn: z.number().int().nonnegative(),
  transcript: z.array(transcriptTurnSchema),
  judgeTranscriptA: z.array(judgeQASchema),
  judgeTranscriptB: z.array(judgeQASchema),
  scoreA: z.number().nullable(),
  scoreB: z.number().nullable(),
  winner: z.enum(["a", "b", "draw"]).nullable(),
  reasoning: z.string().nullable(),
  error: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const appMetaSchema = z.object({
  name: z.string(),
  stage: z.literal("mvp"),
  models: z.array(modelOptionSchema),
  scenarios: z.array(scenarioSummarySchema),
});

export type ModelOption = z.infer<typeof modelOptionSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioSummary = z.infer<typeof scenarioSummarySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type MatchTranscriptTurn = z.infer<typeof matchTranscriptTurnSchema>;
export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>;
export type JudgeQA = z.infer<typeof judgeQASchema>;
export type JudgeScoring = z.infer<typeof judgeScoringSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type Match = z.infer<typeof matchSchema>;
export type AppMeta = z.infer<typeof appMetaSchema>;
export type User = z.infer<typeof userSchema>;
