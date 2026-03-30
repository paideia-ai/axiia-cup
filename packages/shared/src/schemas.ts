import { z } from "zod";

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  isAdmin: z.boolean(),
});

export const modelOptionSchema = z.object({
  id: z.string(),
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

export const appMetaSchema = z.object({
  name: z.string(),
  stage: z.literal("mvp"),
  models: z.array(modelOptionSchema),
  scenarios: z.array(scenarioSummarySchema),
});

export type ModelOption = z.infer<typeof modelOptionSchema>;
export type ScenarioSummary = z.infer<typeof scenarioSummarySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type MatchTranscriptTurn = z.infer<typeof matchTranscriptTurnSchema>;
export type AppMeta = z.infer<typeof appMetaSchema>;
export type User = z.infer<typeof userSchema>;
