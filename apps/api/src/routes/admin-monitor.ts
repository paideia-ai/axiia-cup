import { adminMonitorUserSchema } from '@axiia/shared'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { listAnalyticsBattles } from '../lib/analytics'
import { getTokenSoftCap } from '../lib/settings'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const adminMonitorRouter = new Hono()

adminMonitorRouter.get(
  '/api/admin/monitor/users',
  requireAuth,
  requireAdmin,
  (context) => {
    const softCap = getTokenSoftCap()

    const rows = db.all<{
      userId: number
      displayName: string
      email: string
      disabled: number
      submissionCount: number
      latestVersion: number | null
      playgroundRunCount: number
      matchCount: number
      lastSubmissionAt: string | null
    }>(sql`
      SELECT
        u.id AS userId,
        u.display_name AS displayName,
        u.email,
        u.disabled,
        COALESCE(sub_stats.submission_count, 0) AS submissionCount,
        sub_stats.latest_version AS latestVersion,
        COALESCE(pg_stats.playground_run_count, 0) AS playgroundRunCount,
        COALESCE(match_stats.match_count, 0) AS matchCount,
        sub_stats.last_submission_at AS lastSubmissionAt
      FROM users u
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS submission_count,
          MAX(version) AS latest_version,
          MAX(created_at) AS last_submission_at
        FROM submissions
        WHERE retired_at IS NULL
        GROUP BY user_id
      ) sub_stats ON sub_stats.user_id = u.id
      LEFT JOIN (
        SELECT
          s.user_id,
          COUNT(*) AS playground_run_count
        FROM playground_runs pr
        JOIN submissions s ON s.id = pr.submission_id
        GROUP BY s.user_id
      ) pg_stats ON pg_stats.user_id = u.id
      LEFT JOIN (
        SELECT
          s.user_id,
          COUNT(DISTINCT m.id) AS match_count
        FROM matches m
        JOIN submissions s ON s.id = m.sub_a_id OR s.id = m.sub_b_id
        WHERE m.status = 'scored'
        GROUP BY s.user_id
      ) match_stats ON match_stats.user_id = u.id
      WHERE u.is_admin = 0
      ORDER BY u.id ASC
    `)

    const tokenStatsByUser = new Map<
      number,
      {
        lastActiveAt: string | null
        totalCompletionTokens: number
        totalPromptTokens: number
      }
    >()
    const battles = listAnalyticsBattles()

    for (const battle of battles) {
      const activityAt =
        battle.finishedAt ??
        battle.updatedAt ??
        battle.startedAt ??
        battle.createdAt

      for (const participant of [battle.participantA, battle.participantB]) {
        if (participant.kind !== 'submission' || participant.userId == null) {
          continue
        }

        const current = tokenStatsByUser.get(participant.userId) ?? {
          lastActiveAt: null,
          totalCompletionTokens: 0,
          totalPromptTokens: 0,
        }

        current.totalPromptTokens += participant.promptTokens
        current.totalCompletionTokens += participant.completionTokens

        if (!current.lastActiveAt || activityAt > current.lastActiveAt) {
          current.lastActiveAt = activityAt
        }

        tokenStatsByUser.set(participant.userId, current)
      }
    }

    const result = rows.map((row) =>
      adminMonitorUserSchema.parse({
        userId: row.userId,
        displayName: row.displayName,
        email: row.email,
        disabled: Boolean(row.disabled),
        submissionCount: row.submissionCount,
        latestVersion: row.latestVersion,
        playgroundRunCount: row.playgroundRunCount,
        matchCount: row.matchCount,
        totalPromptTokens:
          tokenStatsByUser.get(row.userId)?.totalPromptTokens ?? 0,
        totalCompletionTokens:
          tokenStatsByUser.get(row.userId)?.totalCompletionTokens ?? 0,
        totalTokens:
          (tokenStatsByUser.get(row.userId)?.totalPromptTokens ?? 0) +
          (tokenStatsByUser.get(row.userId)?.totalCompletionTokens ?? 0),
        lastActiveAt:
          tokenStatsByUser.get(row.userId)?.lastActiveAt ??
          row.lastSubmissionAt,
        isOverSoftCap:
          (tokenStatsByUser.get(row.userId)?.totalPromptTokens ?? 0) +
            (tokenStatsByUser.get(row.userId)?.totalCompletionTokens ?? 0) >
          softCap,
      }),
    )

    result.sort(
      (left, right) =>
        right.totalTokens - left.totalTokens || left.userId - right.userId,
    )

    return context.json(result)
  },
)

export { adminMonitorRouter }
