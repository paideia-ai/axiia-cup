import {
  adminStatsSchema,
  personalStatsSchema,
  recentMatchSchema,
} from "@axiia/shared";
import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../db/client";
import { matches, rounds, scenarios, submissions, tournaments } from "../db/schema";
import { getLeaderboard } from "../lib/tournaments";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth } from "../middleware/requireAuth";

const statsRouter = new Hono();

statsRouter.get("/api/stats/me", requireAuth, (context) => {
  const userId = context.get("userId");
  const userSubmissions = db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .all();
  const submissionIds = userSubmissions.map((submission) => submission.id);
  const submissionCount = submissionIds.length;

  let winRate: number | null = null;
  let pendingMatchCount = 0;

  if (submissionIds.length > 0) {
    const scoredMatches = db
      .select({
        status: matches.status,
        subAId: matches.subAId,
        subBId: matches.subBId,
        winner: matches.winner,
      })
      .from(matches)
      .where(or(inArray(matches.subAId, submissionIds), inArray(matches.subBId, submissionIds)))
      .all();

    const totalScored = scoredMatches.filter((match) => match.status === "scored").length;

    if (totalScored > 0) {
      const wins = scoredMatches.filter(
        (match) =>
          match.status === "scored" &&
          ((match.winner === "a" && submissionIds.includes(match.subAId)) ||
            (match.winner === "b" && submissionIds.includes(match.subBId))),
      ).length;

      winRate = (wins / totalScored) * 100;
    }

    pendingMatchCount = scoredMatches.filter(
      (match) => match.status === "queued" || match.status === "running",
    ).length;
  }

  const latestFinishedTournament = db
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(eq(tournaments.status, "finished"))
    .orderBy(desc(tournaments.createdAt))
    .get();

  let rank: number | null = null;

  if (latestFinishedTournament && submissionIds.length > 0) {
    const leaderboard = getLeaderboard(latestFinishedTournament.id) ?? [];
    const userEntry = leaderboard.find((entry) => submissionIds.includes(entry.submissionId));
    rank = userEntry?.rank ?? null;
  }

  return context.json(
    personalStatsSchema.parse({
      pendingMatchCount,
      rank,
      submissionCount,
      winRate,
    }),
  );
});

statsRouter.get("/api/admin/stats", requireAuth, requireAdmin, (context) => {
  const rows = db
    .select({
      count: sql<number>`count(*)`,
      status: matches.status,
    })
    .from(matches)
    .groupBy(matches.status)
    .all();

  const counts = new Map(rows.map((row) => [row.status, row.count]));

  return context.json(
    adminStatsSchema.parse({
      queued: counts.get("queued") ?? 0,
      running: counts.get("running") ?? 0,
      scored: counts.get("scored") ?? 0,
    }),
  );
});

statsRouter.get("/api/matches/my", requireAuth, (context) => {
  const userId = context.get("userId");
  const userSubmissions = db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .all();
  const submissionIds = userSubmissions.map((submission) => submission.id);

  if (submissionIds.length === 0) {
    return context.json([]);
  }

  const recentMatches = db
    .select({
      id: matches.id,
      roleALabel: scenarios.roleAName,
      roleBLabel: scenarios.roleBName,
      scenarioTitle: scenarios.title,
      status: matches.status,
      winner: matches.winner,
    })
    .from(matches)
    .innerJoin(scenarios, eq(matches.scenarioId, scenarios.id))
    .where(or(inArray(matches.subAId, submissionIds), inArray(matches.subBId, submissionIds)))
    .orderBy(desc(matches.createdAt))
    .limit(10)
    .all();

  return context.json(recentMatches.map((match) => recentMatchSchema.parse(match)));
});

export { statsRouter };
