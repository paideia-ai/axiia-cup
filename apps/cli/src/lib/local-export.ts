import { Database } from 'bun:sqlite'
import { join, resolve } from 'node:path'

import { writeJsonOutput } from './io'

function resolveLocalDatabasePath(explicitPath?: string) {
  const configuredPath = explicitPath ?? process.env.AXIIA_DB_PATH

  if (configuredPath) {
    return resolve(process.cwd(), configuredPath)
  }

  if (process.cwd().endsWith(join('apps', 'cli'))) {
    return resolve(process.cwd(), '../api/axiia.db')
  }

  return resolve(process.cwd(), 'apps/api/axiia.db')
}

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function exportPlaygroundRun(params: {
  dbPath?: string
  outputPath?: string
  runId: number
}) {
  const dbPath = resolveLocalDatabasePath(params.dbPath)
  const db = new Database(dbPath, { readonly: true })

  try {
    const rawRun = db
      .query('select * from playground_runs where id = ?')
      .get(params.runId) as Record<string, unknown> | null

    if (!rawRun) {
      throw new Error(`Playground run ${params.runId} not found in ${dbPath}`)
    }

    const rawSubmission = db
      .query('select * from submissions where id = ?')
      .get(rawRun.submission_id as number) as Record<string, unknown> | null
    const rawScenario = db
      .query('select * from scenarios where id = ?')
      .get(rawRun.scenario_id as string) as Record<string, unknown> | null

    const llmCalls = db
      .query(
        'select * from llm_calls where playground_run_id = ? order by id asc',
      )
      .all(params.runId) as Array<Record<string, unknown>>

    writeJsonOutput(
      {
        exportedAt: new Date().toISOString(),
        dbPath,
        kind: 'playground_run',
        run: {
          ...rawRun,
          transcript: parseJsonField(rawRun.transcript as string | null, []),
          judge_transcript_a: parseJsonField(
            rawRun.judge_transcript_a as string | null,
            [],
          ),
          judge_transcript_b: parseJsonField(
            rawRun.judge_transcript_b as string | null,
            [],
          ),
          info_assignment: parseJsonField(
            rawRun.info_assignment as string | null,
            null,
          ),
          judge_decision: parseJsonField(
            rawRun.judge_decision as string | null,
            null,
          ),
        },
        submission: rawSubmission,
        scenario: rawScenario,
        llm_calls: llmCalls.map((call) => ({
          ...call,
          request_json: parseJsonField(
            call.request_json as string | null,
            null,
          ),
          response_json: parseJsonField(
            call.response_json as string | null,
            null,
          ),
        })),
      },
      params.outputPath,
    )
  } finally {
    db.close()
  }
}

export function exportMatch(params: {
  dbPath?: string
  matchId: number
  outputPath?: string
}) {
  const dbPath = resolveLocalDatabasePath(params.dbPath)
  const db = new Database(dbPath, { readonly: true })

  try {
    const rawMatch = db
      .query('select * from matches where id = ?')
      .get(params.matchId) as Record<string, unknown> | null

    if (!rawMatch) {
      throw new Error(`Match ${params.matchId} not found in ${dbPath}`)
    }

    const subA = db
      .query('select * from submissions where id = ?')
      .get(rawMatch.sub_a_id as number) as Record<string, unknown> | null
    const subB = db
      .query('select * from submissions where id = ?')
      .get(rawMatch.sub_b_id as number) as Record<string, unknown> | null
    const scenario = db
      .query('select * from scenarios where id = ?')
      .get(rawMatch.scenario_id as string) as Record<string, unknown> | null

    const llmCalls = db
      .query('select * from llm_calls where match_id = ? order by id asc')
      .all(params.matchId) as Array<Record<string, unknown>>

    writeJsonOutput(
      {
        exportedAt: new Date().toISOString(),
        dbPath,
        kind: 'match',
        match: {
          ...rawMatch,
          transcript: parseJsonField(rawMatch.transcript as string | null, []),
          judge_transcript_a: parseJsonField(
            rawMatch.judge_transcript_a as string | null,
            [],
          ),
          judge_transcript_b: parseJsonField(
            rawMatch.judge_transcript_b as string | null,
            [],
          ),
          info_assignment: parseJsonField(
            rawMatch.info_assignment as string | null,
            null,
          ),
          judge_decision: parseJsonField(
            rawMatch.judge_decision as string | null,
            null,
          ),
        },
        submission_a: subA,
        submission_b: subB,
        scenario,
        llm_calls: llmCalls.map((call) => ({
          ...call,
          request_json: parseJsonField(
            call.request_json as string | null,
            null,
          ),
          response_json: parseJsonField(
            call.response_json as string | null,
            null,
          ),
        })),
      },
      params.outputPath,
    )
  } finally {
    db.close()
  }
}
