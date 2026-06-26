import {
  adminLlmLatencyPhaseSchema,
  adminLlmLatencyReportSchema,
  adminLlmLatencySourceSchema,
  adminMonitorUserSchema,
  evaluationModelIdSchema,
  type InfoAssignment,
  type JudgeQA,
  type TranscriptTurn,
} from '@axiia/shared'
import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'

import { db } from '../db/client'
import { buildJudgePrompt } from '../engine/core'
import { chatCompletion } from '../engine/llm'
import { resolveScenarioRoleOptions } from '../engine/scenario-options'
import { listAnalyticsBattles } from '../lib/analytics'
import { getTokenSoftCap } from '../lib/settings'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'
import { matches, scenarios, submissions } from '../db/schema'

const adminMonitorRouter = new Hono()
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i
const LLM_LATENCY_PHASES = [
  'dialogue',
  'examination',
  'judgment',
  'scoring',
] as const

type LlmLatencyCallRow = {
  id: number
  source: 'playground' | 'tournament'
  runId: number
  scenarioId: string
  scenarioTitle: string
  phase: (typeof LLM_LATENCY_PHASES)[number]
  side: 'a' | 'b' | 'judge' | 'scorer'
  provider: string
  gatewayProvider: string | null
  model: string
  durationMs: number
  promptTokens: number
  completionTokens: number
  langfuseTraceUrl: string | null
  completedAt: string | null
  createdAt: string
}

function normalizeTimestamp(value: string) {
  const trimmed = value.trim()

  if (!trimmed || TIMEZONE_SUFFIX_PATTERN.test(trimmed)) {
    return trimmed
  }

  if (trimmed.includes(' ')) {
    return `${trimmed.replace(' ', 'T')}Z`
  }

  if (trimmed.includes('T')) {
    return `${trimmed}Z`
  }

  return trimmed
}

function timestampMs(value: string) {
  const parsed = Date.parse(normalizeTimestamp(value))
  return Number.isNaN(parsed) ? null : parsed
}

function latestTimestamp(...values: Array<string | null>) {
  let latest: string | null = null
  let latestMs = -Infinity

  for (const value of values) {
    if (!value) {
      continue
    }

    const ms = timestampMs(value)
    if (ms == null) {
      if (latest == null) {
        latest = value
      }
      continue
    }

    if (ms >= latestMs) {
      latest = value
      latestMs = ms
    }
  }

  return latest
}

function uniqueSorted(values: Iterable<string>) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  )

  return sorted[index] ?? 0
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function getStringQueryValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseDateQueryValue(value: string | undefined) {
  const trimmed = getStringQueryValue(value)

  if (!trimmed) {
    return { ok: true as const, value: null }
  }

  if (timestampMs(trimmed) == null) {
    return { ok: false as const, value: trimmed }
  }

  return { ok: true as const, value: trimmed }
}

function rowCompletedMs(
  row: Pick<LlmLatencyCallRow, 'completedAt' | 'createdAt'>,
) {
  return timestampMs(row.completedAt ?? row.createdAt) ?? -Infinity
}

function listSuccessfulCompletedLlmCalls(): LlmLatencyCallRow[] {
  return db.all<LlmLatencyCallRow>(sql`
    SELECT
      lc.id AS id,
      COALESCE(
        lc.source,
        CASE
          WHEN lc.playground_run_id IS NOT NULL THEN 'playground'
          ELSE 'tournament'
        END
      ) AS source,
      COALESCE(lc.playground_run_id, lc.match_id) AS runId,
      COALESCE(lc.scenario_id, s.id) AS scenarioId,
      s.title AS scenarioTitle,
      lc.phase AS phase,
      lc.side AS side,
      COALESCE(
        lc.underlying_provider,
        CASE
          WHEN lc.model LIKE 'deepseek-%' THEN 'deepseek'
          WHEN lc.model LIKE 'qwen%' THEN 'qwen'
          WHEN lc.model LIKE 'kimi-%' THEN 'moonshot'
          WHEN lc.model LIKE 'minimax-%' THEN 'minimax'
          WHEN lc.model LIKE 'glm-%' THEN 'zai'
          WHEN lc.model LIKE 'gpt-%' THEN 'openai'
          WHEN lc.model LIKE 'claude-%' THEN 'anthropic'
          ELSE lc.provider
        END
      ) AS provider,
      COALESCE(lc.gateway_provider, lc.provider) AS gatewayProvider,
      lc.model AS model,
      lc.duration_ms AS durationMs,
      COALESCE(lc.prompt_tokens, 0) AS promptTokens,
      COALESCE(lc.completion_tokens, 0) AS completionTokens,
      lc.langfuse_trace_url AS langfuseTraceUrl,
      COALESCE(
        pr.finished_at,
        m.finished_at,
        pr.updated_at,
        m.updated_at,
        pr.created_at,
        m.created_at
      ) AS completedAt,
      lc.created_at AS createdAt
    FROM llm_calls lc
    LEFT JOIN playground_runs pr
      ON pr.id = lc.playground_run_id
      AND pr.status = 'scored'
    LEFT JOIN matches m
      ON m.id = lc.match_id
      AND m.status = 'scored'
    JOIN scenarios s
      ON s.id = COALESCE(lc.scenario_id, pr.scenario_id, m.scenario_id)
    WHERE lc.error IS NULL
      AND lc.response_content IS NOT NULL
      AND (
        (lc.playground_run_id IS NOT NULL AND pr.id IS NOT NULL)
        OR (lc.match_id IS NOT NULL AND m.id IS NOT NULL)
      )
  `)
}

adminMonitorRouter.get(
  '/api/admin/monitor/llm-latency',
  requireAuth,
  requireAdmin,
  (context) => {
    const sourceParse = adminLlmLatencySourceSchema.safeParse(
      context.req.query('source') ?? 'all',
    )

    if (!sourceParse.success) {
      return context.json({ error: 'Invalid source filter' }, 400)
    }

    const phaseRaw = getStringQueryValue(context.req.query('phase'))
    const phaseParse = phaseRaw
      ? adminLlmLatencyPhaseSchema.safeParse(phaseRaw)
      : null

    if (phaseParse && !phaseParse.success) {
      return context.json({ error: 'Invalid phase filter' }, 400)
    }

    const fromParse = parseDateQueryValue(context.req.query('from'))
    const toParse = parseDateQueryValue(context.req.query('to'))

    if (!fromParse.ok || !toParse.ok) {
      return context.json({ error: 'Invalid date filter' }, 400)
    }

    const source = sourceParse.data
    const scenarioId = getStringQueryValue(context.req.query('scenarioId'))
    const phase = phaseParse?.data ?? null
    const provider = getStringQueryValue(context.req.query('provider'))
    const model = getStringQueryValue(context.req.query('model'))
    const from = fromParse.value
    const to = toParse.value
    const fromMs = from ? timestampMs(from) : null
    const toMs = to ? timestampMs(to) : null
    const allRows = listSuccessfulCompletedLlmCalls()
    const filteredRows = allRows.filter((row) => {
      if (source !== 'all' && row.source !== source) {
        return false
      }

      if (scenarioId && row.scenarioId !== scenarioId) {
        return false
      }

      if (phase && row.phase !== phase) {
        return false
      }

      if (provider && row.provider !== provider) {
        return false
      }

      if (model && row.model !== model) {
        return false
      }

      const completedMs = rowCompletedMs(row)

      if (fromMs != null && completedMs < fromMs) {
        return false
      }

      if (toMs != null && completedMs > toMs) {
        return false
      }

      return true
    })

    const aggregateMap = new Map<
      string,
      {
        completionTokens: number
        durations: number[]
        gatewayProviders: Set<string>
        model: string
        phase: LlmLatencyCallRow['phase']
        promptTokens: number
        provider: string
        runKeys: Set<string>
        scenarioId: string
        scenarioTitle: string
      }
    >()

    for (const row of filteredRows) {
      const key = [row.scenarioId, row.phase, row.provider, row.model].join(
        '\u0000',
      )
      const current = aggregateMap.get(key) ?? {
        completionTokens: 0,
        durations: [],
        gatewayProviders: new Set<string>(),
        model: row.model,
        phase: row.phase,
        promptTokens: 0,
        provider: row.provider,
        runKeys: new Set<string>(),
        scenarioId: row.scenarioId,
        scenarioTitle: row.scenarioTitle,
      }

      current.durations.push(row.durationMs)
      current.promptTokens += row.promptTokens
      current.completionTokens += row.completionTokens
      if (row.gatewayProvider) {
        current.gatewayProviders.add(row.gatewayProvider)
      }
      current.runKeys.add(`${row.source}:${row.runId}`)
      aggregateMap.set(key, current)
    }

    const phaseOrder = new Map(
      LLM_LATENCY_PHASES.map((phaseValue, index) => [phaseValue, index]),
    )
    const aggregates = [...aggregateMap.values()]
      .map((item) => {
        const totalDurationMs = item.durations.reduce(
          (sum, duration) => sum + duration,
          0,
        )

        return {
          scenarioId: item.scenarioId,
          scenarioTitle: item.scenarioTitle,
          phase: item.phase,
          provider: item.provider,
          gatewayProviders: uniqueSorted(item.gatewayProviders),
          model: item.model,
          callCount: item.durations.length,
          runCount: item.runKeys.size,
          avgDurationMs: roundOne(totalDurationMs / item.durations.length),
          p50DurationMs: percentile(item.durations, 50),
          p95DurationMs: percentile(item.durations, 95),
          maxDurationMs: Math.max(...item.durations),
          totalDurationMs,
          totalPromptTokens: item.promptTokens,
          totalCompletionTokens: item.completionTokens,
        }
      })
      .sort(
        (left, right) =>
          left.scenarioTitle.localeCompare(right.scenarioTitle) ||
          (phaseOrder.get(left.phase) ?? 0) -
            (phaseOrder.get(right.phase) ?? 0) ||
          left.model.localeCompare(right.model),
      )

    const scenarioOptions = new Map<string, string>()

    for (const row of allRows) {
      scenarioOptions.set(row.scenarioId, row.scenarioTitle)
    }

    const result = adminLlmLatencyReportSchema.parse({
      generatedAt: new Date().toISOString(),
      filters: {
        source,
        scenarioId,
        phase,
        provider,
        model,
        from,
        to,
      },
      options: {
        scenarios: [...scenarioOptions.entries()]
          .map(([id, title]) => ({ id, title }))
          .sort((left, right) => left.title.localeCompare(right.title)),
        phases: LLM_LATENCY_PHASES.filter((phaseValue) =>
          allRows.some((row) => row.phase === phaseValue),
        ),
        providers: uniqueSorted(allRows.map((row) => row.provider)),
        models: uniqueSorted(allRows.map((row) => row.model)),
      },
      aggregates,
      calls: filteredRows
        .sort(
          (left, right) =>
            rowCompletedMs(right) - rowCompletedMs(left) || right.id - left.id,
        )
        .slice(0, 100),
    })

    return context.json(result)
  },
)

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

    const result = rows.map((row) => {
      const tokenStats = tokenStatsByUser.get(row.userId)
      const totalPromptTokens = tokenStats?.totalPromptTokens ?? 0
      const totalCompletionTokens = tokenStats?.totalCompletionTokens ?? 0
      const totalTokens = totalPromptTokens + totalCompletionTokens

      return adminMonitorUserSchema.parse({
        userId: row.userId,
        displayName: row.displayName,
        email: row.email,
        disabled: Boolean(row.disabled),
        submissionCount: row.submissionCount,
        latestVersion: row.latestVersion,
        playgroundRunCount: row.playgroundRunCount,
        matchCount: row.matchCount,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        lastActiveAt: latestTimestamp(
          tokenStats?.lastActiveAt ?? null,
          row.lastSubmissionAt,
        ),
        isOverSoftCap: totalTokens > softCap,
      })
    })

    result.sort(
      (left, right) =>
        right.totalTokens - left.totalTokens || left.userId - right.userId,
    )

    return context.json(result)
  },
)

// ── Research: re-run judge on existing match transcripts ─────────────────────

type RejudgeResult =
  | {
      matchId: number
      subAId: number
      subBId: number
      originalWinner: string | null
      originalScoreA: number | null
      originalScoreB: number | null
      newDecision: string
      judgeModel: string
    }
  | { matchId: number; error: string }

interface RejudgeJob {
  status: 'running' | 'done' | 'error'
  results: RejudgeResult[]
  pending: number
  total: number
  startedAt: string
  finishedAt: string | null
  errorMessage?: string
}

const rejudgeJobs = new Map<string, RejudgeJob>()

function buildExaminationSummary(roleName: string, examination: JudgeQA[]) {
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

    const jobId = randomUUID()
    const job: RejudgeJob = {
      status: 'running',
      results: [],
      pending: matchIds.length,
      total: matchIds.length,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    }
    rejudgeJobs.set(jobId, job)

    // Fire and forget — run all judges in parallel
    Promise.all(
      matchIds.map(async (matchId) => {
        const match = db
          .select()
          .from(matches)
          .where(eq(matches.id, matchId))
          .get()
        if (!match || match.status !== 'scored') {
          job.results.push({ matchId, error: 'not found or not scored' })
          job.pending--
          return
        }

        const scenario = db
          .select()
          .from(scenarios)
          .where(eq(scenarios.id, match.scenarioId))
          .get()
        if (!scenario) {
          job.results.push({ matchId, error: 'scenario not found' })
          job.pending--
          return
        }
        const subA = db
          .select()
          .from(submissions)
          .where(eq(submissions.id, match.subAId))
          .get()
        const subB = db
          .select()
          .from(submissions)
          .where(eq(submissions.id, match.subBId))
          .get()
        if (!subA || !subB) {
          job.results.push({ matchId, error: 'submissions not found' })
          job.pending--
          return
        }

        const resolvedScenario = resolveScenarioRoleOptions(scenario, {
          roleAOptionId: subA.roleAOptionId,
          roleBOptionId: subB.roleBOptionId,
        })

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
                    `[第${i + 1}轮] ${t.speaker === 'a' ? resolvedScenario.roleAName : resolvedScenario.roleBName}：${t.content}`,
                )
                .join('\n\n')
            : '（暂无对话）'

        const judgePrompt = buildJudgePrompt(resolvedScenario, assignment, {
          debate: debateText,
          examinationA: buildExaminationSummary(
            resolvedScenario.roleAName,
            judgeA,
          ),
          examinationB: buildExaminationSummary(
            resolvedScenario.roleBName,
            judgeB,
          ),
        })

        try {
          const newDecision = await chatCompletion({
            messages: [{ role: 'user', content: '请做出你的裁决。' }],
            model: judgeModel,
            systemPrompt: judgePrompt,
            temperature: 0,
            trace: {
              matchId,
              phase: 'judgment',
              scenarioId: resolvedScenario.id,
              side: 'judge',
              source: 'tournament',
            },
          })
          job.results.push({
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
          job.results.push({ matchId, error: String(e) })
        }
        job.pending--
      }),
    ).then(() => {
      job.status = 'done'
      job.finishedAt = new Date().toISOString()
      return undefined
    })

    return context.json({ jobId, status: 'running', total: matchIds.length })
  },
)

adminMonitorRouter.get(
  '/api/admin/rejudge/:jobId',
  requireAuth,
  requireAdmin,
  (context) => {
    const { jobId } = context.req.param()
    const job = rejudgeJobs.get(jobId)
    if (!job) {
      return context.json({ error: 'job not found' }, 404)
    }
    return context.json({
      jobId,
      status: job.status,
      total: job.total,
      completed: job.total - job.pending,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      results: job.results,
    })
  },
)

export { adminMonitorRouter }
