import type {
  AdminScenario,
  LeaderboardEntry,
  TournamentDetail,
  TournamentListItem,
  UpdateScenario,
} from '@axiia/shared'
import { Database } from 'bun:sqlite'
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { Command } from 'commander'

const API_BASE_URL = process.env.AXIIA_API_URL ?? 'http://localhost:3001'
const ADMIN_TOKEN = process.env.AXIIA_ADMIN_TOKEN

type StartRoundResponse = {
  byeSubmissions: number[]
  matches: Array<{
    id: number
    status: string
    subAId: number
    subBId: number
  }>
  round: {
    id: number
    roundNumber: number
  }
  tournament: {
    id: number
  }
}

type AdminPlayer = {
  displayName: string
  email: string
  model: string
  submissionId: number
  submittedAt: string
  userId: number
  version: number
}

const program = new Command()

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

function exportPlaygroundRun(params: {
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

    const payload = {
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
        request_json: parseJsonField(call.request_json as string | null, null),
        response_json: parseJsonField(
          call.response_json as string | null,
          null,
        ),
      })),
    }

    const json = JSON.stringify(payload, null, 2)

    if (params.outputPath) {
      const outputPath = resolve(process.cwd(), params.outputPath)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, json, 'utf-8')
      console.log(outputPath)
      return
    }

    console.log(json)
  } finally {
    db.close()
  }
}

function exportMatch(params: {
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

    const payload = {
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
        request_json: parseJsonField(call.request_json as string | null, null),
        response_json: parseJsonField(
          call.response_json as string | null,
          null,
        ),
      })),
    }

    const json = JSON.stringify(payload, null, 2)

    if (params.outputPath) {
      const outputPath = resolve(process.cwd(), params.outputPath)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, json, 'utf-8')
      console.log(outputPath)
      return
    }

    console.log(json)
  } finally {
    db.close()
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  admin = false,
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (admin) {
    if (!ADMIN_TOKEN) {
      throw new Error('Missing AXIIA_ADMIN_TOKEN')
    }

    headers.set('Authorization', `Bearer ${ADMIN_TOKEN}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
  const json = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new Error(json.error ?? `Request failed: ${response.status}`)
  }

  return json as T
}

async function resolveTournamentId(input?: string) {
  if (input) {
    return Number(input)
  }

  const tournaments = await apiFetch<TournamentListItem[]>('/api/tournaments')
  const latest = tournaments[0]

  if (!latest) {
    throw new Error('No tournaments found')
  }

  return latest.id
}

function printMatches(matches: StartRoundResponse['matches']) {
  console.table(
    matches.map((match) => ({
      matchId: match.id,
      pairing: `${match.subAId} vs ${match.subBId}`,
      status: match.status,
    })),
  )
}

program.name('axiia').description('Axiia Cup 管理 CLI').version('0.1.0')

program
  .command('players')
  .description('查看参赛者列表')
  .requiredOption('-s, --scenario <id>', 'scenario id')
  .action(async (options: { scenario: string }) => {
    const players = await apiFetch<AdminPlayer[]>(
      `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(options.scenario)}`,
      { method: 'GET' },
      true,
    )

    console.table(
      players.map((player) => ({
        displayName: player.displayName,
        email: player.email,
        id: player.userId,
        model: player.model,
        submittedAt: player.submittedAt,
        version: player.version,
      })),
    )
  })

program
  .command('start')
  .description('锁定报名并生成第 1 轮配对')
  .argument('<scenarioId>', 'scenario id')
  .action(async (scenarioId: string) => {
    const result = await apiFetch<StartRoundResponse>(
      '/api/admin/tournaments/start',
      {
        body: JSON.stringify({ scenarioId }),
        method: 'POST',
      },
      true,
    )

    console.log(`Tournament ${result.tournament.id} created`)
    console.log(`Round ${result.round.roundNumber} created`)

    if (result.byeSubmissions.length > 0) {
      console.log(`Bye: ${result.byeSubmissions.join(', ')}`)
    }

    printMatches(result.matches)
  })

program
  .command('status')
  .description('查看赛事进度')
  .argument('[tournamentId]', 'tournament id')
  .action(async (tournamentIdArg?: string) => {
    const tournamentId = await resolveTournamentId(tournamentIdArg)
    const tournament = await apiFetch<TournamentDetail>(
      `/api/tournaments/${tournamentId}`,
    )
    const currentRound = tournament.rounds.at(-1)

    if (!currentRound) {
      console.log(`Tournament ${tournament.id} has no rounds yet`)
      return
    }

    const queued = currentRound.matches.filter(
      (match) => match.status === 'queued',
    ).length
    const running = currentRound.matches.filter(
      (match) => match.status === 'running' || match.status === 'judging',
    ).length
    const scored = currentRound.matches.filter(
      (match) => match.status === 'scored',
    ).length
    const errored = currentRound.matches.filter(
      (match) => match.status === 'error',
    ).length

    console.table([
      {
        currentRound: currentRound.roundNumber,
        errored,
        queued,
        running,
        scored,
        tournamentId: tournament.id,
      },
    ])
  })

program
  .command('next-round')
  .description('生成下一轮瑞士轮配对')
  .argument('<tournamentId>', 'tournament id')
  .action(async (tournamentId: string) => {
    const result = await apiFetch<StartRoundResponse>(
      `/api/admin/tournaments/${tournamentId}/next-round`,
      {
        method: 'POST',
      },
      true,
    )

    console.log(
      `Round ${result.round.roundNumber} created for tournament ${result.tournament.id}`,
    )

    if (result.byeSubmissions.length > 0) {
      console.log(`Bye: ${result.byeSubmissions.join(', ')}`)
    }

    printMatches(result.matches)
  })

program
  .command('leaderboard')
  .description('查看排行榜')
  .argument('<tournamentId>', 'tournament id')
  .action(async (tournamentId: string) => {
    const leaderboard = await apiFetch<LeaderboardEntry[]>(
      `/api/tournaments/${tournamentId}/leaderboard`,
    )

    console.table(
      leaderboard.map((entry) => ({
        buchholz: entry.buchholz.toFixed(1),
        losses: entry.losses,
        player: entry.playerName,
        rank: entry.rank,
        winRate: `${entry.winRate.toFixed(1)}%`,
        wins: entry.wins,
      })),
    )
  })

program
  .command('scenarios')
  .description('查看所有场景')
  .action(async () => {
    const scenarios = await apiFetch<AdminScenario[]>(
      '/api/admin/scenarios',
      { method: 'GET' },
      true,
    )

    console.table(
      scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        turnCount: s.turnCount,
        locked: s.locked ? '🔒' : '',
      })),
    )
  })

program
  .command('scenario:edit')
  .description('编辑场景（打开 $EDITOR）')
  .argument('<scenarioId>', 'scenario id')
  .action(async (scenarioId: string) => {
    const scenarios = await apiFetch<AdminScenario[]>(
      '/api/admin/scenarios',
      { method: 'GET' },
      true,
    )
    const scenario = scenarios.find((s) => s.id === scenarioId)

    if (!scenario) {
      throw new Error(`Scenario "${scenarioId}" not found`)
    }

    if (scenario.locked) {
      throw new Error('比赛进行中，场景已锁定，无法编辑')
    }

    const editable: UpdateScenario = {
      turnCount: scenario.turnCount,
      judgeModel: scenario.judgeModel,
      openingLine: scenario.openingLine,
      agentPromptTemplate: scenario.agentPromptTemplate,
      examinationQuestionTemplate: scenario.examinationQuestionTemplate,
      judgePrompt: scenario.judgePrompt,
      scorerPrompt: scenario.scorerPrompt,
      roleAName: scenario.roleAName,
      roleAHiddenInfo: scenario.roleAHiddenInfo,
      roleARequests: scenario.roleARequests,
      roleBName: scenario.roleBName,
      roleBHiddenInfo: scenario.roleBHiddenInfo,
      roleBRequests: scenario.roleBRequests,
      falseInfoCount: scenario.falseInfoCount,
      trueRequestCount: scenario.trueRequestCount,
    }

    const tmpFile = join(tmpdir(), `axiia-scenario-${scenarioId}.json`)
    writeFileSync(tmpFile, JSON.stringify(editable, null, 2), 'utf-8')

    const editor = process.env.EDITOR ?? 'vi'

    try {
      execSync(`${editor} ${tmpFile}`, { stdio: 'inherit' })
    } catch {
      unlinkSync(tmpFile)
      throw new Error('Editor exited with error')
    }

    const edited = JSON.parse(readFileSync(tmpFile, 'utf-8')) as UpdateScenario
    unlinkSync(tmpFile)

    const updated = await apiFetch<AdminScenario>(
      `/api/admin/scenarios/${encodeURIComponent(scenarioId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(edited),
      },
      true,
    )

    console.log(`场景「${updated.title}」已更新`)
    console.table({
      turnCount: updated.turnCount,
      falseInfoCount: updated.falseInfoCount,
      trueRequestCount: updated.trueRequestCount,
      locked: updated.locked,
    })
  })

program
  .command('playground:export')
  .description('导出本地 playground run 及其 llm_calls（本地数据库直读）')
  .argument('<runId>', 'playground run id')
  .option('-d, --db <path>', 'SQLite database path')
  .option('-o, --output <path>', 'write JSON to file instead of stdout')
  .action(
    async (runIdArg: string, options: { db?: string; output?: string }) => {
      const runId = Number.parseInt(runIdArg, 10)

      if (!Number.isInteger(runId) || runId <= 0) {
        throw new Error('runId must be a positive integer')
      }

      exportPlaygroundRun({
        dbPath: options.db,
        outputPath: options.output,
        runId,
      })
    },
  )

program
  .command('match:export')
  .description('导出本地 match 及其 llm_calls（本地数据库直读）')
  .argument('<matchId>', 'match id')
  .option('-d, --db <path>', 'SQLite database path')
  .option('-o, --output <path>', 'write JSON to file instead of stdout')
  .action(
    async (matchIdArg: string, options: { db?: string; output?: string }) => {
      const matchId = Number.parseInt(matchIdArg, 10)

      if (!Number.isInteger(matchId) || matchId <= 0) {
        throw new Error('matchId must be a positive integer')
      }

      exportMatch({
        dbPath: options.db,
        matchId,
        outputPath: options.output,
      })
    },
  )

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unknown CLI error')
  process.exit(1)
})
