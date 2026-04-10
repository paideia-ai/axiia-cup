import {
  type AdminAnalyticsAgentDetail,
  type AdminAnalyticsAgentSummary,
  type AdminAnalyticsBattle,
  type AdminMonitorUser,
  type AdminPlayer,
  type AdminScenario,
  type AdminUser,
  type LeaderboardEntry,
  type PlaygroundRun,
  type PlaygroundRunStart,
  type PlaygroundRunSummary,
  type TournamentDetail,
  type TournamentListItem,
  type User,
} from '@axiia/shared'
import { Database } from 'bun:sqlite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { Command } from 'commander'

import { parseScenarioUpdateInput } from './scenario-update'

const API_BASE_URL = process.env.AXIIA_API_URL ?? 'http://localhost:3001'
const AUTH_TOKEN = process.env.AXIIA_AUTH_TOKEN ?? process.env.AXIIA_ADMIN_TOKEN

type AuthResponse = {
  token: string
  user: User
}

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
  authRequired = false,
): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (AUTH_TOKEN) {
    headers.set('Authorization', `Bearer ${AUTH_TOKEN}`)
  } else if (authRequired) {
    throw new Error('Missing AXIIA_AUTH_TOKEN or AXIIA_ADMIN_TOKEN')
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

  const tournaments = await apiFetch<TournamentListItem[]>(
    '/api/tournaments',
    undefined,
    true,
  )
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

function parseId(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function shellEscapeSingleQuotes(value: string) {
  return value.replaceAll("'", "'\"'\"'")
}

async function fetchAdminScenarios() {
  return apiFetch<AdminScenario[]>(
    '/api/admin/scenarios',
    { method: 'GET' },
    true,
  )
}

async function fetchAdminScenarioById(scenarioId: string) {
  const scenarios = await fetchAdminScenarios()
  const scenario = scenarios.find((item) => item.id === scenarioId)

  if (!scenario) {
    throw new Error(`Scenario "${scenarioId}" not found`)
  }

  return scenario
}

function writeJsonOutput(payload: unknown, outputPath?: string) {
  const json = JSON.stringify(payload, null, 2)

  if (!outputPath) {
    console.log(json)
    return
  }

  const resolvedPath = resolve(process.cwd(), outputPath)
  mkdirSync(dirname(resolvedPath), { recursive: true })
  writeFileSync(resolvedPath, `${json}\n`, 'utf-8')
  console.log(resolvedPath)
}

function readJsonInput(filePath: string) {
  const source =
    filePath === '-'
      ? readFileSync(0, 'utf-8')
      : readFileSync(resolve(process.cwd(), filePath), 'utf-8')

  try {
    return JSON.parse(source) as unknown
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown JSON parse error'
    throw new Error(`Invalid JSON input: ${message}`)
  }
}

function printPlaygroundRunSummaries(runs: PlaygroundRunSummary[]) {
  console.table(
    runs.map((run) => ({
      createdAt: run.createdAt,
      error: run.error,
      id: run.id,
      scoreA: run.scoreA,
      scoreB: run.scoreB,
      submissionId: run.submissionId,
      winner: run.winner,
    })),
  )
}

function printUsers(users: AdminUser[]) {
  console.table(
    users.map((user) => ({
      createdAt: user.createdAt,
      disabled: user.disabled,
      displayName: user.displayName,
      email: user.email,
      id: user.id,
      isAdmin: user.isAdmin,
    })),
  )
}

function filterUsersByQuery(
  users: AdminUser[],
  options: { email?: string; name?: string; query?: string },
) {
  const emailNeedle = options.email?.trim().toLowerCase()
  const nameNeedle = options.name?.trim().toLowerCase()
  const queryNeedle = options.query?.trim().toLowerCase()

  return users.filter((user) => {
    const email = user.email.toLowerCase()
    const displayName = user.displayName.toLowerCase()

    if (emailNeedle && !email.includes(emailNeedle)) {
      return false
    }

    if (nameNeedle && !displayName.includes(nameNeedle)) {
      return false
    }

    if (
      queryNeedle &&
      !email.includes(queryNeedle) &&
      !displayName.includes(queryNeedle)
    ) {
      return false
    }

    return true
  })
}

program.name('axiia').description('Axiia Cup 管理 CLI').version('0.1.0')

program
  .command('auth:login')
  .description('登录并输出 bearer token')
  .requiredOption('-e, --email <email>', 'email')
  .requiredOption('-p, --password <password>', 'password')
  .option('--json', 'print JSON response')
  .option('--token-only', 'print token only')
  .option('--shell', 'print shell export command')
  .action(
    async (options: {
      email: string
      json?: boolean
      password: string
      shell?: boolean
      tokenOnly?: boolean
    }) => {
      const auth = await apiFetch<AuthResponse>(
        '/api/auth/login',
        {
          body: JSON.stringify({
            email: options.email,
            password: options.password,
          }),
          method: 'POST',
        },
        false,
      )

      if (options.json) {
        writeJsonOutput(auth)
        return
      }

      if (options.tokenOnly) {
        console.log(auth.token)
        return
      }

      if (options.shell) {
        console.log(
          `export AXIIA_AUTH_TOKEN='${shellEscapeSingleQuotes(auth.token)}'`,
        )
        return
      }

      console.log(
        `Logged in as ${auth.user.displayName} <${auth.user.email}>${auth.user.isAdmin ? ' (admin)' : ''}`,
      )
      console.log(
        `export AXIIA_AUTH_TOKEN='${shellEscapeSingleQuotes(auth.token)}'`,
      )
    },
  )

program
  .command('players')
  .description('查看参赛者列表')
  .requiredOption('-s, --scenario <id>', 'scenario id')
  .option('--json', 'print JSON instead of table')
  .action(async (options: { json?: boolean; scenario: string }) => {
    const players = await apiFetch<AdminPlayer[]>(
      `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(options.scenario)}`,
      { method: 'GET' },
      true,
    )

    if (options.json) {
      writeJsonOutput(players)
      return
    }

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
  .option('--json', 'print JSON instead of table')
  .action(async (scenarioId: string, options: { json?: boolean }) => {
    const result = await apiFetch<StartRoundResponse>(
      '/api/admin/tournaments/start',
      {
        body: JSON.stringify({ scenarioId }),
        method: 'POST',
      },
      true,
    )

    if (options.json) {
      writeJsonOutput(result)
      return
    }

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
  .option('--json', 'print JSON instead of table')
  .action(
    async (
      tournamentIdArg: string | undefined,
      options: { json?: boolean },
    ) => {
      const tournamentId = await resolveTournamentId(tournamentIdArg)
      const tournament = await apiFetch<TournamentDetail>(
        `/api/tournaments/${tournamentId}`,
        undefined,
        true,
      )
      const currentRound = tournament.rounds.at(-1)

      if (!currentRound) {
        if (options.json) {
          writeJsonOutput({
            currentRound: null,
            errored: 0,
            queued: 0,
            running: 0,
            scored: 0,
            tournamentId: tournament.id,
          })
          return
        }

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

      if (options.json) {
        writeJsonOutput({
          currentRound: currentRound.roundNumber,
          errored,
          queued,
          running,
          scored,
          tournamentId: tournament.id,
        })
        return
      }

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
    },
  )

program
  .command('next-round')
  .description('生成下一轮瑞士轮配对')
  .argument('<tournamentId>', 'tournament id')
  .option('--json', 'print JSON instead of table')
  .action(async (tournamentId: string, options: { json?: boolean }) => {
    const result = await apiFetch<StartRoundResponse>(
      `/api/admin/tournaments/${tournamentId}/next-round`,
      {
        method: 'POST',
      },
      true,
    )

    if (options.json) {
      writeJsonOutput(result)
      return
    }

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
  .option('--json', 'print JSON instead of table')
  .action(async (tournamentId: string, options: { json?: boolean }) => {
    const leaderboard = await apiFetch<LeaderboardEntry[]>(
      `/api/tournaments/${tournamentId}/leaderboard`,
      undefined,
      true,
    )

    if (options.json) {
      writeJsonOutput(leaderboard)
      return
    }

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
  .option('--json', 'print JSON instead of table')
  .action(async (options: { json?: boolean }) => {
    const scenarios = await fetchAdminScenarios()
    const summary = scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      subject: s.subject,
      turnCount: s.turnCount,
      locked: s.locked,
    }))

    if (options.json) {
      writeJsonOutput(summary)
      return
    }

    console.table(
      summary.map((s) => ({
        ...s,
        locked: s.locked ? '🔒' : '',
      })),
    )
  })

program
  .command('scenario:get')
  .description('读取单个场景 JSON')
  .argument('<scenarioId>', 'scenario id')
  .option('-o, --output <path>', 'write JSON to file instead of stdout')
  .action(
    async (
      scenarioId: string,
      options: {
        output?: string
      },
    ) => {
      const scenario = await fetchAdminScenarioById(scenarioId)
      writeJsonOutput(scenario, options.output)
    },
  )

program
  .command('scenario:update')
  .description('从文件或 stdin 更新场景')
  .argument('<scenarioId>', 'scenario id')
  .option('--json', 'print JSON instead of summary')
  .requiredOption(
    '-f, --file <path>',
    'JSON file to read, or "-" to read from stdin',
  )
  .action(
    async (scenarioId: string, options: { file: string; json?: boolean }) => {
      const scenario = await fetchAdminScenarioById(scenarioId)

      if (scenario.locked) {
        throw new Error('比赛进行中，场景已锁定，无法编辑')
      }

      const edited = parseScenarioUpdateInput(readJsonInput(options.file))

      const updated = await apiFetch<AdminScenario>(
        `/api/admin/scenarios/${encodeURIComponent(scenarioId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(edited),
        },
        true,
      )

      if (options.json) {
        writeJsonOutput(updated)
        return
      }

      console.log(`场景「${updated.title}」已更新`)
      console.table({
        turnCount: updated.turnCount,
        falseInfoCount: updated.falseInfoCount,
        trueRequestCount: updated.trueRequestCount,
        locked: updated.locked,
      })
    },
  )

program
  .command('users:list')
  .description('查看用户列表')
  .option('--json', 'print JSON instead of table')
  .action(async (options: { json?: boolean }) => {
    const users = await apiFetch<AdminUser[]>(
      '/api/admin/users',
      { method: 'GET' },
      true,
    )

    if (options.json) {
      writeJsonOutput(users)
      return
    }

    printUsers(users)
  })

program
  .command('users:find')
  .description('按名字或邮箱查找用户')
  .option('--name <keyword>', 'match display name by substring')
  .option('--email <keyword>', 'match email by substring')
  .option('-q, --query <keyword>', 'match name or email by substring')
  .option('--json', 'print JSON instead of table')
  .action(
    async (options: {
      email?: string
      json?: boolean
      name?: string
      query?: string
    }) => {
      if (!options.name && !options.email && !options.query) {
        throw new Error('Provide --name, --email, or --query')
      }

      const users = await apiFetch<AdminUser[]>(
        '/api/admin/users',
        { method: 'GET' },
        true,
      )
      const matches = filterUsersByQuery(users, options)

      if (options.json) {
        writeJsonOutput(matches)
        return
      }

      if (matches.length === 0) {
        console.log('未找到匹配用户')
        return
      }

      printUsers(matches)
    },
  )

program
  .command('users:disable')
  .description('切换用户禁用状态')
  .argument('<userId>', 'user id')
  .option('--json', 'print JSON instead of table')
  .action(async (userIdArg: string, options: { json?: boolean }) => {
    const userId = parseId(userIdArg)

    if (!userId) {
      throw new Error('Invalid user id')
    }

    const user = await apiFetch<AdminUser>(
      `/api/admin/users/${userId}/disable`,
      { method: 'PATCH' },
      true,
    )

    if (options.json) {
      writeJsonOutput(user)
      return
    }

    printUsers([user])
  })

program
  .command('users:reset-password')
  .description('重置用户密码')
  .argument('<userId>', 'user id')
  .requiredOption('-p, --password <password>', 'new password')
  .option('--json', 'print JSON instead of text')
  .action(
    async (
      userIdArg: string,
      options: { json?: boolean; password: string },
    ) => {
      const userId = parseId(userIdArg)

      if (!userId) {
        throw new Error('Invalid user id')
      }

      const response = await apiFetch<{ ok: true }>(
        `/api/admin/users/${userId}/reset-password`,
        {
          body: JSON.stringify({ password: options.password }),
          method: 'POST',
        },
        true,
      )

      if (options.json) {
        writeJsonOutput(response)
        return
      }

      console.log(`Password reset for user ${userId}`)
    },
  )

program
  .command('playground:run')
  .description('创建一条 playground run')
  .argument('<submissionId>', 'submission id')
  .option('--json', 'print JSON instead of text')
  .action(async (submissionIdArg: string, options: { json?: boolean }) => {
    const submissionId = parseId(submissionIdArg)

    if (!submissionId) {
      throw new Error('Invalid submission id')
    }

    const run = await apiFetch<PlaygroundRunStart>(
      '/api/playground/run',
      {
        body: JSON.stringify({ submissionId }),
        method: 'POST',
      },
      true,
    )

    if (options.json) {
      writeJsonOutput(run)
      return
    }

    console.log(`Playground run ${run.id} queued`)
  })

program
  .command('playground:list')
  .description('查看某个 submission 的 playground runs')
  .argument('<submissionId>', 'submission id')
  .option('--json', 'print JSON instead of table')
  .action(async (submissionIdArg: string, options: { json?: boolean }) => {
    const submissionId = parseId(submissionIdArg)

    if (!submissionId) {
      throw new Error('Invalid submission id')
    }

    const runs = await apiFetch<PlaygroundRunSummary[]>(
      `/api/playground/runs/${submissionId}`,
      { method: 'GET' },
      true,
    )

    if (options.json) {
      writeJsonOutput(runs)
      return
    }

    printPlaygroundRunSummaries(runs)
  })

program
  .command('playground:get')
  .description('查看单条 playground run 详情')
  .argument('<submissionId>', 'submission id')
  .argument('<runId>', 'run id')
  .option('-o, --output <path>', 'write JSON to file instead of stdout')
  .action(
    async (
      submissionIdArg: string,
      runIdArg: string,
      options: { output?: string },
    ) => {
      const submissionId = parseId(submissionIdArg)
      const runId = parseId(runIdArg)

      if (!submissionId) {
        throw new Error('Invalid submission id')
      }

      if (!runId) {
        throw new Error('Invalid run id')
      }

      const run = await apiFetch<PlaygroundRun>(
        `/api/playground/runs/${submissionId}/${runId}`,
        { method: 'GET' },
        true,
      )

      writeJsonOutput(run, options.output)
    },
  )

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

program
  .command('battles')
  .description('查看统一 battle 视图（tournament + playground）')
  .option('--user <id>', 'filter by user id')
  .option('--submission <id>', 'filter by submission id')
  .option('--side <side>', 'filter by agent side (a or b)')
  .option('--source <source>', 'filter by source (tournament or playground)')
  .option('--mode <mode>', 'filter by playground mode (pvp or pve)')
  .option('--status <status>', 'filter by status')
  .option('--limit <n>', 'max rows to return', '50')
  .option('--json', 'print JSON instead of table')
  .action(
    async (
      options: {
        json?: boolean
        limit?: string
        mode?: string
        side?: string
        source?: string
        status?: string
        submission?: string
        user?: string
      },
    ) => {
      const params = new URLSearchParams()

      if (options.user) params.set('userId', options.user)
      if (options.submission) params.set('submissionId', options.submission)
      if (options.side) params.set('side', options.side)
      if (options.source) params.set('source', options.source)
      if (options.mode) params.set('mode', options.mode)
      if (options.status) params.set('status', options.status)
      if (options.limit) params.set('limit', options.limit)

      const path = `/api/admin/analytics/battles${
        params.size > 0 ? `?${params.toString()}` : ''
      }`
      const battles = await apiFetch<AdminAnalyticsBattle[]>(
        path,
        { method: 'GET' },
        true,
      )

      if (options.json) {
        writeJsonOutput(battles)
        return
      }

      if (battles.length === 0) {
        console.log('暂无 battle 数据')
        return
      }

      console.table(
        battles.map((battle) => ({
          id: `${battle.source}:${battle.id}`,
          kind: formatBattleKind(battle),
          scenario: battle.scenarioTitle,
          a: formatBattleParticipant(battle.participantA),
          b: formatBattleParticipant(battle.participantB),
          status: battle.status,
          winner: formatBattleWinner(battle),
          score:
            battle.scoreA != null && battle.scoreB != null
              ? `${battle.scoreA}:${battle.scoreB}`
              : '—',
          tokens: formatTokens(battle.totalTokens),
          createdAt: battle.createdAt,
        })),
      )
    },
  )

program
  .command('user:agents')
  .description('查看某个用户的所有 agent（submission + side）')
  .argument('<userId>', 'user id')
  .option('--json', 'print JSON instead of table')
  .action(async (userIdArg: string, options: { json?: boolean }) => {
    const userId = parseId(userIdArg)

    if (!userId) {
      throw new Error('Invalid user id')
    }

    const agents = await apiFetch<AdminAnalyticsAgentSummary[]>(
      `/api/admin/analytics/users/${userId}/agents`,
      { method: 'GET' },
      true,
    )

    if (options.json) {
      writeJsonOutput(agents)
      return
    }

    if (agents.length === 0) {
      console.log('该用户暂无 agent 数据')
      return
    }

    console.table(
      agents.map((agent) => ({
        submissionId: agent.submissionId,
        side: agent.side,
        role: agent.roleName,
        version: agent.version,
        scenario: agent.scenarioTitle,
        model: agent.model,
        battles: agent.battleCount,
        tournament: agent.tournamentBattleCount,
        pvp: agent.playgroundPvpCount,
        pve: agent.playgroundPveCount,
        wins: agent.wins,
        losses: agent.losses,
        draws: agent.draws,
        pending: agent.pending,
        errors: agent.errors,
        tokens: formatTokens(agent.totalTokens),
        lastBattle: agent.lastBattleAt ?? '—',
      })),
    )
  })

program
  .command('agent:summary')
  .description('查看单个 agent 的汇总与最近 battles')
  .argument('<submissionId>', 'submission id')
  .argument('<side>', 'agent side (a or b)')
  .option('--json', 'print JSON instead of text')
  .action(
    async (
      submissionIdArg: string,
      side: string,
      options: { json?: boolean },
    ) => {
      const submissionId = parseId(submissionIdArg)

      if (!submissionId) {
        throw new Error('Invalid submission id')
      }

      if (side !== 'a' && side !== 'b') {
        throw new Error('side must be "a" or "b"')
      }

      const detail = await apiFetch<AdminAnalyticsAgentDetail>(
        `/api/admin/analytics/agents/${submissionId}/${side}/summary`,
        { method: 'GET' },
        true,
      )

      if (options.json) {
        writeJsonOutput(detail)
        return
      }

      const { summary } = detail
      console.log(
        `\n  Agent: submission ${summary.submissionId} / ${summary.side.toUpperCase()} / ${summary.roleName}`,
      )
      console.log(`  用户: ${summary.userDisplayName} (#${summary.userId})`)
      console.log(
        `  版本: v${summary.version} · ${summary.model} · ${summary.scenarioTitle}`,
      )
      console.log(
        `  战绩: ${summary.wins} 胜 / ${summary.losses} 负 / ${summary.draws} 平`,
      )
      console.log(
        `  分布: tournament ${summary.tournamentBattleCount} / pvp ${summary.playgroundPvpCount} / pve ${summary.playgroundPveCount}`,
      )
      console.log(
        `  均分: for ${formatAverage(summary.avgScoreFor)} / against ${formatAverage(summary.avgScoreAgainst)}`,
      )
      console.log(
        `  Token: ${formatTokens(summary.totalTokens)} (prompt ${formatTokens(summary.totalPromptTokens)}, completion ${formatTokens(summary.totalCompletionTokens)})`,
      )
      console.log(`  最近 battle: ${summary.lastBattleAt ?? '—'}`)

      if (detail.recentBattles.length > 0) {
        console.log(`\n  最近 battles:`)
        console.table(
          detail.recentBattles.map((battle) => ({
            id: `${battle.source}:${battle.id}`,
            kind: formatBattleKind(battle),
            opponent:
              battle.participantA.submissionId === summary.submissionId &&
              battle.participantA.side === summary.side
                ? battle.participantB.label
                : battle.participantA.label,
            status: battle.status,
            winner: formatBattleWinner(battle),
            score:
              battle.scoreA != null && battle.scoreB != null
                ? `${battle.scoreA}:${battle.scoreB}`
                : '—',
            createdAt: battle.createdAt,
          })),
        )
      }

      console.log()
    },
  )

program
  .command('battle:export')
  .description('通过 API 导出单场 battle 的原始记录与 llm_calls')
  .argument('<source>', 'battle source (tournament or playground)')
  .argument('<id>', 'battle id')
  .option('-o, --output <path>', 'write JSON to file instead of stdout')
  .action(
    async (
      source: string,
      idArg: string,
      options: { output?: string },
    ) => {
      if (source !== 'tournament' && source !== 'playground') {
        throw new Error('source must be "tournament" or "playground"')
      }

      const id = parseId(idArg)

      if (!id) {
        throw new Error('Invalid battle id')
      }

      const payload = await apiFetch<unknown>(
        `/api/admin/analytics/battles/${source}/${id}/export`,
        { method: 'GET' },
        true,
      )

      writeJsonOutput(payload, options.output)
    },
  )

function formatTokens(tokens: number) {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }

  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`
  }

  return String(tokens)
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)

  if (minutes < 1) {
    return '刚刚'
  }

  if (minutes < 60) {
    return `${minutes}分钟前`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours}小时前`
  }

  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function formatBattleKind(battle: AdminAnalyticsBattle) {
  if (battle.source === 'tournament') {
    return 'tournament'
  }

  return battle.mode ?? 'playground'
}

function formatBattleParticipant(participant: AdminAnalyticsBattle['participantA']) {
  if (participant.kind === 'preset') {
    return participant.label
  }

  return `${participant.userDisplayName ?? '未知玩家'} · v${participant.version ?? '?'} · ${participant.side.toUpperCase()}`
}

function formatBattleWinner(battle: AdminAnalyticsBattle) {
  if (battle.winner == null) {
    return '—'
  }

  if (battle.winner === 'draw') {
    return 'draw'
  }

  return battle.winner === 'a' ? battle.participantA.label : battle.participantB.label
}

function formatAverage(value: number | null) {
  return value == null ? '—' : value.toFixed(2)
}

program
  .command('monitor')
  .description('查看所有玩家活动概览')
  .option('--json', 'print JSON instead of table')
  .action(async (options: { json?: boolean }) => {
    const users = await apiFetch<AdminMonitorUser[]>(
      '/api/admin/monitor/users',
      { method: 'GET' },
      true,
    )

    if (options.json) {
      writeJsonOutput(users)
      return
    }

    if (users.length === 0) {
      console.log('暂无玩家数据')
      return
    }

    console.table(
      users.map((user) => ({
        id: user.userId,
        name: user.displayName,
        submissions: user.submissionCount,
        playground: user.playgroundRunCount,
        matches: user.matchCount,
        tokens: formatTokens(user.totalTokens),
        lastActive: user.lastActiveAt ? timeAgo(user.lastActiveAt) : '—',
        alert: user.isOverSoftCap ? '⚠ 超限' : '',
      })),
    )
  })

program
  .command('monitor:player')
  .description('查看单个玩家详情（模拟玩家视角）')
  .argument('<userId>', 'user id')
  .option('--json', 'print JSON instead of text')
  .action(async (userIdArg: string, options: { json?: boolean }) => {
    const userId = parseId(userIdArg)

    if (!userId) {
      throw new Error('Invalid user id')
    }

    const [monitorData, stats, submissions, recentMatches] = await Promise.all([
      apiFetch<AdminMonitorUser[]>(
        '/api/admin/monitor/users',
        { method: 'GET' },
        true,
      ),
      apiFetch<Record<string, unknown>>(
        `/api/stats/me?asUserId=${userId}`,
        { method: 'GET' },
        true,
      ),
      apiFetch<Array<Record<string, unknown>>>(
        `/api/submissions/my?asUserId=${userId}`,
        { method: 'GET' },
        true,
      ),
      apiFetch<Array<Record<string, unknown>>>(
        `/api/matches/my?asUserId=${userId}`,
        { method: 'GET' },
        true,
      ),
    ])

    const userMonitor = monitorData.find((u) => u.userId === userId)

    if (options.json) {
      writeJsonOutput({
        monitor: userMonitor ?? null,
        stats,
        submissions,
        recentMatches,
      })
      return
    }

    if (!userMonitor) {
      console.log(`用户 ${userId} 未找到`)
      return
    }

    console.log(`\n  玩家: ${userMonitor.displayName} (${userMonitor.email})`)
    console.log(`  状态: ${userMonitor.disabled ? '已禁用' : '正常'}`)
    console.log(`  提交版本数: ${userMonitor.submissionCount}`)
    console.log(`  试炼场次数: ${userMonitor.playgroundRunCount}`)
    console.log(`  正式对战数: ${userMonitor.matchCount}`)
    console.log(
      `  Token 消耗: ${formatTokens(userMonitor.totalTokens)} (prompt: ${formatTokens(userMonitor.totalPromptTokens)}, completion: ${formatTokens(userMonitor.totalCompletionTokens)})`,
    )
    console.log(
      `  最近活跃: ${userMonitor.lastActiveAt ? timeAgo(userMonitor.lastActiveAt) : '—'}`,
    )

    if (userMonitor.isOverSoftCap) {
      console.log(`  ⚠ 已超出 Token 软上限`)
    }

    if (submissions.length > 0) {
      console.log(`\n  最近提交:`)
      console.table(
        submissions.slice(0, 5).map((sub) => ({
          version: sub.version,
          model: sub.model,
          createdAt: sub.createdAt,
        })),
      )
    }

    if (recentMatches.length > 0) {
      console.log(`  最近对战:`)
      console.table(
        recentMatches.slice(0, 5).map((match) => ({
          id: match.id,
          opponent: match.opponentName,
          mySide: match.mySide,
          winner: match.winner,
          status: match.status,
        })),
      )
    }

    console.log()
  })

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unknown CLI error')
  process.exit(1)
})
