import { adminMonitorUserSchema } from '@axiia/shared'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
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
      totalPromptTokens: number
      totalCompletionTokens: number
      lastActiveAt: string | null
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
        COALESCE(token_stats.total_prompt_tokens, 0) AS totalPromptTokens,
        COALESCE(token_stats.total_completion_tokens, 0) AS totalCompletionTokens,
        COALESCE(token_stats.last_active_at, sub_stats.last_submission_at) AS lastActiveAt
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
      LEFT JOIN (
        SELECT
          user_id,
          SUM(COALESCE(prompt_tokens, 0)) AS total_prompt_tokens,
          SUM(COALESCE(completion_tokens, 0)) AS total_completion_tokens,
          MAX(created_at) AS last_active_at
        FROM llm_calls
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      ) token_stats ON token_stats.user_id = u.id
      WHERE u.is_admin = 0
      ORDER BY totalCompletionTokens + totalPromptTokens DESC, u.id ASC
    `)

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
        totalPromptTokens: row.totalPromptTokens,
        totalCompletionTokens: row.totalCompletionTokens,
        totalTokens: row.totalPromptTokens + row.totalCompletionTokens,
        lastActiveAt: row.lastActiveAt,
        isOverSoftCap:
          row.totalPromptTokens + row.totalCompletionTokens > softCap,
      }),
    )

    return context.json(result)
  },
)

export { adminMonitorRouter }
