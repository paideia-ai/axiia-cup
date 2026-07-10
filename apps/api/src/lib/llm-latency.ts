import { sql } from 'drizzle-orm'

import { db } from '../db/client'
import { buildLangfuseTraceUrl } from '../engine/llm-observability'

export const LLM_LATENCY_PHASES = [
  'dialogue',
  'examination',
  'judgment',
  'scoring',
] as const

export type LlmLatencyPhase = (typeof LLM_LATENCY_PHASES)[number]

export type LlmLatencyFilters = {
  from: string | null
  model: string | null
  phase: LlmLatencyPhase | null
  provider: string | null
  scenarioId: string | null
  source: 'all' | 'playground' | 'tournament'
  to: string | null
}

type LlmLatencyOptionRow = {
  model: string
  phase: LlmLatencyPhase
  provider: string
  scenarioId: string
  scenarioTitle: string
}

type LlmLatencyAggregateRow = LlmLatencyOptionRow & {
  avgCallDurationMs: number
  avgRunDurationMs: number
  callCount: number
  gatewayProviders: string | null
  maxCallDurationMs: number
  maxRunDurationMs: number
  p50CallDurationMs: number
  p50RunDurationMs: number
  p95CallDurationMs: number
  p95RunDurationMs: number
  runCount: number
  totalCompletionTokens: number
  totalDurationMs: number
  totalPromptTokens: number
}

type LlmLatencyCallRow = LlmLatencyOptionRow & {
  attempt: number
  completedAt: string
  completionTokens: number
  createdAt: string
  durationMs: number
  gatewayProvider: string | null
  id: number
  langfuseTraceUrl: string | null
  model: string
  otelTraceId: string | null
  promptTokens: number
  runId: number
  side: 'a' | 'b' | 'judge' | 'scorer'
  source: 'playground' | 'tournament'
  turnIndex: number | null
}

type LlmLatencyRunRow = LlmLatencyOptionRow & {
  callCount: number
  completedAt: string
  completionTokens: number
  durationMs: number
  gatewayProviders: string | null
  langfuseTraceUrl: string | null
  maxAttempt: number
  otelTraceId: string | null
  promptTokens: number
  runId: number
  source: 'playground' | 'tournament'
}

const SUCCESSFUL_GAME_CALLS_CTE = sql`
  successful_game_calls AS (
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
      lc.attempt AS attempt,
      lc.turn_index AS turnIndex,
      COALESCE(lc.prompt_tokens, 0) AS promptTokens,
      COALESCE(lc.completion_tokens, 0) AS completionTokens,
      lc.langfuse_trace_url AS langfuseTraceUrl,
      lc.otel_trace_id AS otelTraceId,
      lc.created_at AS completedAt,
      lc.created_at AS createdAt
    FROM llm_calls lc
    LEFT JOIN playground_runs pr ON pr.id = lc.playground_run_id
    LEFT JOIN matches m ON m.id = lc.match_id
    JOIN scenarios s
      ON s.id = COALESCE(lc.scenario_id, pr.scenario_id, m.scenario_id)
    WHERE lc.purpose = 'game'
      AND lc.error IS NULL
      AND lc.response_content IS NOT NULL
      AND (
        (lc.playground_run_id IS NOT NULL AND pr.status = 'scored')
        OR (lc.match_id IS NOT NULL AND m.status = 'scored')
      )
  )
`

function filteredCallsCte(filters: LlmLatencyFilters) {
  return sql`
    filtered_calls AS (
      SELECT *
      FROM successful_game_calls
      WHERE (${filters.source} = 'all' OR source = ${filters.source})
        AND (${filters.scenarioId} IS NULL OR scenarioId = ${filters.scenarioId})
        AND (${filters.phase} IS NULL OR phase = ${filters.phase})
        AND (${filters.provider} IS NULL OR provider = ${filters.provider})
        AND (${filters.model} IS NULL OR model = ${filters.model})
        AND (${filters.from} IS NULL OR julianday(createdAt) >= julianday(${filters.from}))
        AND (${filters.to} IS NULL OR julianday(createdAt) <= julianday(${filters.to}))
    )
  `
}

function splitProviders(value: string | null) {
  return value ? [...new Set(value.split(',').filter(Boolean))].sort() : []
}

function normalizeAggregate(row: LlmLatencyAggregateRow) {
  return {
    ...row,
    avgCallDurationMs: Math.round(row.avgCallDurationMs * 10) / 10,
    avgRunDurationMs: Math.round(row.avgRunDurationMs * 10) / 10,
    gatewayProviders: splitProviders(row.gatewayProviders),
  }
}

function normalizeRun(row: LlmLatencyRunRow) {
  return {
    ...row,
    gatewayProviders: splitProviders(row.gatewayProviders),
    langfuseTraceUrl:
      row.langfuseTraceUrl ?? buildLangfuseTraceUrl(row.otelTraceId),
  }
}

function normalizeCall(row: LlmLatencyCallRow) {
  return {
    ...row,
    langfuseTraceUrl:
      row.langfuseTraceUrl ?? buildLangfuseTraceUrl(row.otelTraceId),
  }
}

function listOptions() {
  return db.all<LlmLatencyOptionRow>(sql`
    WITH ${SUCCESSFUL_GAME_CALLS_CTE}
    SELECT scenarioId, scenarioTitle, phase, provider, model
    FROM successful_game_calls
    GROUP BY scenarioId, scenarioTitle, phase, provider, model
  `)
}

function listAggregates(filters: LlmLatencyFilters) {
  const rows = db.all<LlmLatencyAggregateRow>(sql`
    WITH
    ${SUCCESSFUL_GAME_CALLS_CTE},
    ${filteredCallsCte(filters)},
    call_ranked AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY scenarioId, scenarioTitle, phase, provider, model
          ORDER BY durationMs
        ) AS durationRank,
        COUNT(*) OVER (
          PARTITION BY scenarioId, scenarioTitle, phase, provider, model
        ) AS durationCount
      FROM filtered_calls
    ),
    call_metrics AS (
      SELECT
        scenarioId,
        scenarioTitle,
        phase,
        provider,
        model,
        GROUP_CONCAT(DISTINCT gatewayProvider) AS gatewayProviders,
        COUNT(*) AS callCount,
        AVG(durationMs) AS avgCallDurationMs,
        MIN(
          CASE
            WHEN durationRank >= CAST((durationCount * 50 + 99) / 100 AS INTEGER)
            THEN durationMs
          END
        ) AS p50CallDurationMs,
        MIN(
          CASE
            WHEN durationRank >= CAST((durationCount * 95 + 99) / 100 AS INTEGER)
            THEN durationMs
          END
        ) AS p95CallDurationMs,
        MAX(durationMs) AS maxCallDurationMs,
        SUM(durationMs) AS totalDurationMs,
        SUM(promptTokens) AS totalPromptTokens,
        SUM(completionTokens) AS totalCompletionTokens
      FROM call_ranked
      GROUP BY scenarioId, scenarioTitle, phase, provider, model
    ),
    run_totals AS (
      SELECT
        scenarioId,
        scenarioTitle,
        phase,
        provider,
        model,
        source,
        runId,
        SUM(durationMs) AS runDurationMs
      FROM filtered_calls
      GROUP BY
        scenarioId,
        scenarioTitle,
        phase,
        provider,
        model,
        source,
        runId
    ),
    run_ranked AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY scenarioId, scenarioTitle, phase, provider, model
          ORDER BY runDurationMs
        ) AS durationRank,
        COUNT(*) OVER (
          PARTITION BY scenarioId, scenarioTitle, phase, provider, model
        ) AS durationCount
      FROM run_totals
    ),
    run_metrics AS (
      SELECT
        scenarioId,
        scenarioTitle,
        phase,
        provider,
        model,
        COUNT(*) AS runCount,
        AVG(runDurationMs) AS avgRunDurationMs,
        MIN(
          CASE
            WHEN durationRank >= CAST((durationCount * 50 + 99) / 100 AS INTEGER)
            THEN runDurationMs
          END
        ) AS p50RunDurationMs,
        MIN(
          CASE
            WHEN durationRank >= CAST((durationCount * 95 + 99) / 100 AS INTEGER)
            THEN runDurationMs
          END
        ) AS p95RunDurationMs,
        MAX(runDurationMs) AS maxRunDurationMs
      FROM run_ranked
      GROUP BY scenarioId, scenarioTitle, phase, provider, model
    )
    SELECT
      call_metrics.*,
      run_metrics.runCount,
      run_metrics.avgRunDurationMs,
      run_metrics.p50RunDurationMs,
      run_metrics.p95RunDurationMs,
      run_metrics.maxRunDurationMs
    FROM call_metrics
    JOIN run_metrics USING (scenarioId, scenarioTitle, phase, provider, model)
  `)

  const phaseOrder = new Map(
    LLM_LATENCY_PHASES.map((phase, index) => [phase, index]),
  )

  return rows
    .map(normalizeAggregate)
    .sort(
      (left, right) =>
        left.scenarioTitle.localeCompare(right.scenarioTitle) ||
        (phaseOrder.get(left.phase) ?? 0) -
          (phaseOrder.get(right.phase) ?? 0) ||
        left.model.localeCompare(right.model),
    )
}

function listRuns(filters: LlmLatencyFilters) {
  return db
    .all<LlmLatencyRunRow>(sql`
      WITH
      ${SUCCESSFUL_GAME_CALLS_CTE},
      ${filteredCallsCte(filters)}
      SELECT
        source,
        runId,
        scenarioId,
        scenarioTitle,
        phase,
        provider,
        model,
        GROUP_CONCAT(DISTINCT gatewayProvider) AS gatewayProviders,
        COUNT(*) AS callCount,
        MAX(attempt) AS maxAttempt,
        SUM(durationMs) AS durationMs,
        SUM(promptTokens) AS promptTokens,
        SUM(completionTokens) AS completionTokens,
        MAX(langfuseTraceUrl) AS langfuseTraceUrl,
        MAX(otelTraceId) AS otelTraceId,
        MAX(createdAt) AS completedAt
      FROM filtered_calls
      GROUP BY
        source,
        runId,
        scenarioId,
        scenarioTitle,
        phase,
        provider,
        model
      ORDER BY julianday(completedAt) DESC, runId DESC
      LIMIT 100
    `)
    .map(normalizeRun)
}

function listCalls(filters: LlmLatencyFilters) {
  return db
    .all<LlmLatencyCallRow>(sql`
      WITH
      ${SUCCESSFUL_GAME_CALLS_CTE},
      ${filteredCallsCte(filters)}
      SELECT *
      FROM filtered_calls
      ORDER BY julianday(createdAt) DESC, id DESC
      LIMIT 100
    `)
    .map(normalizeCall)
}

export function getLlmLatencyReportData(filters: LlmLatencyFilters) {
  const optionRows = listOptions()
  const scenarioOptions = new Map<string, string>()

  for (const row of optionRows) {
    scenarioOptions.set(row.scenarioId, row.scenarioTitle)
  }

  return {
    aggregates: listAggregates(filters),
    calls: listCalls(filters),
    options: {
      models: [...new Set(optionRows.map((row) => row.model))].sort(),
      phases: LLM_LATENCY_PHASES.filter((phase) =>
        optionRows.some((row) => row.phase === phase),
      ),
      providers: [...new Set(optionRows.map((row) => row.provider))].sort(),
      scenarios: [...scenarioOptions.entries()]
        .map(([id, title]) => ({ id, title }))
        .sort((left, right) => left.title.localeCompare(right.title)),
    },
    runs: listRuns(filters),
  }
}
