import {
  adminMonitorUserSchema,
  evaluationModelIdSchema,
  type InfoAssignment,
  type JudgeQA,
  type TranscriptTurn,
} from '@axiia/shared'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/client'
import { buildJudgePrompt } from '../engine/core'
import { chatCompletion } from '../engine/llm'
import { listAnalyticsBattles } from '../lib/analytics'
import { getTokenSoftCap } from '../lib/settings'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'
import { matches, scenarios } from '../db/schema'

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

// ── Research: re-run judge on existing match transcripts ─────────────────────

adminMonitorRouter.post(
  '/api/admin/rejudge',
  requireAuth,
  requireAdmin,
  async (context) => {
    const body = await context.req.json<{
      matchIds: number[]
      judgeModel: string
    }>()
    const { matchIds, judgeModel: judgeModelRaw } = body

    const judgeModel = evaluationModelIdSchema.parse(judgeModelRaw)

    const results = []

    for (const matchId of matchIds) {
      const match = db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId))
        .get()
      if (!match || match.status !== 'scored') {
        results.push({ matchId, error: 'not found or not done' })
        continue
      }

      const scenario = db
        .select()
        .from(scenarios)
        .where(eq(scenarios.id, match.scenarioId))
        .get()
      if (!scenario) {
        results.push({ matchId, error: 'scenario not found' })
        continue
      }

      const transcript: TranscriptTurn[] = match.transcript
        ? JSON.parse(match.transcript)
        : []
      const judgeA: JudgeQA[] = match.judgeTranscriptA
        ? JSON.parse(match.judgeTranscriptA)
        : []
      const judgeB: JudgeQA[] = match.judgeTranscriptB
        ? JSON.parse(match.judgeTranscriptB)
        : []
      const assignment: InfoAssignment = match.infoAssignment
        ? JSON.parse(match.infoAssignment)
        : {
            roleAFalseInfoIds: [],
            roleBFalseInfoIds: [],
            roleATrueRequestIds: [],
            roleBTrueRequestIds: [],
          }

      const debateText =
        transcript.length > 0
          ? transcript
              .map(
                (t, i) =>
                  `[第${i + 1}轮] ${t.speaker === 'a' ? scenario.roleAName : scenario.roleBName}：${t.content}`,
              )
              .join('\n\n')
          : '（暂无对话）'

      function buildExaminationSummary(
        roleName: string,
        examination: JudgeQA[],
      ) {
        if (examination.length === 0) return `【${roleName}】未完成问询。`
        return examination
          .map((item) =>
            [
              `【${roleName}】`,
              `- 指认编号：${item.selectedInfoId ?? '未作答'}`,
              `- 系统判定：${item.isCorrect == null ? '未判定' : item.isCorrect ? '正确' : '错误'}`,
              `- 回答：${item.answer}`,
            ].join('\n'),
          )
          .join('\n\n')
      }

      const judgePrompt = buildJudgePrompt(scenario, assignment, {
        debate: debateText,
        examinationA: buildExaminationSummary(scenario.roleAName, judgeA),
        examinationB: buildExaminationSummary(scenario.roleBName, judgeB),
      })

      try {
        const newDecision = await chatCompletion({
          messages: [{ role: 'user', content: '请做出你的裁决。' }],
          model: judgeModel,
          systemPrompt: judgePrompt,
          temperature: 0,
          trace: { phase: 'judgment', side: 'judge' },
        })

        results.push({
          matchId,
          subAId: match.subAId,
          subBId: match.subBId,
          originalWinner: match.winner,
          originalScoreA: match.scoreA,
          originalScoreB: match.scoreB,
          newDecision,
          judgeModel,
        })
      } catch (e) {
        results.push({ matchId, error: String(e) })
      }
    }

    return context.json({ results })
  },
)

export { adminMonitorRouter }
