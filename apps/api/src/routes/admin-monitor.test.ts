import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const testDbPath = join(tmpdir(), `axiia-monitor-test-${Date.now()}.db`)
process.env.AXIIA_DB_PATH = testDbPath
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SILICONFLOW_API_KEY = 'test-key'

let app: import('hono').Hono
let db: (typeof import('../db/client'))['db']
let signToken: (typeof import('../lib/auth'))['signToken']

let adminToken: string
let userToken: string
let adminId: number
let player1Id: number
let player2Id: number
let player1SubmissionId: number
let player2SubmissionId: number
let pveRunId: number

beforeAll(async () => {
  const { migrate } = await import('drizzle-orm/bun-sqlite/migrator')
  const client = await import('../db/client')
  db = client.db
  migrate(db, {
    migrationsFolder: new URL('../db/migrations', import.meta.url).pathname,
  })

  const schema = await import('../db/schema')

  // Clean slate
  db.delete(schema.llmCalls).run()
  db.delete(schema.matches).run()
  db.delete(schema.rounds).run()
  db.delete(schema.tournaments).run()
  db.delete(schema.playgroundRuns).run()
  db.delete(schema.submissions).run()
  db.delete(schema.users).run()
  db.delete(schema.scenarios).run()

  const auth = await import('../lib/auth')
  signToken = auth.signToken

  // Admin user
  adminId = db
    .insert(schema.users)
    .values({
      email: 'mon-admin@test.com',
      passwordHash: 'hash',
      displayName: 'MonAdmin',
      isAdmin: true,
    })
    .returning({ id: schema.users.id })
    .get()!.id

  // Regular user 1
  player1Id = db
    .insert(schema.users)
    .values({
      email: 'mon-player1@test.com',
      passwordHash: 'hash',
      displayName: 'Player One',
      isAdmin: false,
    })
    .returning({ id: schema.users.id })
    .get()!.id

  // Regular user 2
  player2Id = db
    .insert(schema.users)
    .values({
      email: 'mon-player2@test.com',
      passwordHash: 'hash',
      displayName: 'Player Two',
      isAdmin: false,
    })
    .returning({ id: schema.users.id })
    .get()!.id

  // Scenario
  db.insert(schema.scenarios)
    .values({
      id: 'mon-test-scenario',
      title: '监控测试场景',
      subject: '历史',
      roleAName: '角色A',
      roleBName: '角色B',
      turnCount: 10,
      judgeModel: 'deepseek-v3.2',
      judgePrompt: 'judge',
      scorerPrompt: 'scorer',
      agentPromptTemplate: 'template',
      examinationQuestionTemplate: 'question',
    })
    .run()

  // Submissions for player 1
  player1SubmissionId = db
    .insert(schema.submissions)
    .values({
      userId: player1Id,
      scenarioId: 'mon-test-scenario',
      version: 1,
      modelLegacy: 'deepseek-v3.2',
      modelA: 'deepseek-v3.2',
      modelB: 'deepseek-v3.2',
      promptA: 'prompt a v1',
      promptB: 'prompt b v1',
    })
    .returning({ id: schema.submissions.id })
    .get()!.id

  db.insert(schema.submissions)
    .values({
      userId: player1Id,
      scenarioId: 'mon-test-scenario',
      version: 2,
      modelLegacy: 'deepseek-v3.2',
      modelA: 'deepseek-v3.2',
      modelB: 'deepseek-v3.2',
      promptA: 'prompt a v2',
      promptB: 'prompt b v2',
    })
    .run()

  // Submission for player 2
  player2SubmissionId = db
    .insert(schema.submissions)
    .values({
      userId: player2Id,
      scenarioId: 'mon-test-scenario',
      version: 1,
      modelLegacy: 'deepseek-v3.2',
      modelA: 'deepseek-v3.2',
      modelB: 'deepseek-v3.2',
      promptA: 'prompt a v1',
      promptB: 'prompt b v1',
    })
    .returning({ id: schema.submissions.id })
    .get()!.id

  // Playground run for player 1
  const pgRun1Id = db
    .insert(schema.playgroundRuns)
    .values({
      submissionId: player1SubmissionId,
      scenarioId: 'mon-test-scenario',
      status: 'scored',
      scoreA: 1,
      scoreB: 2,
      winner: 'b',
      startedAt: '2026-04-10T09:00:00.000Z',
      finishedAt: '2026-04-10T09:03:00.000Z',
      updatedAt: '2026-04-10T09:03:00.000Z',
      transcript: '[]',
      judgeTranscriptA: '[]',
      judgeTranscriptB: '[]',
    })
    .returning({ id: schema.playgroundRuns.id })
    .get()!.id

  // LLM calls attributed to player 1
  db.insert(schema.llmCalls)
    .values([
      {
        playgroundRunId: pgRun1Id,
        userId: player1Id,
        phase: 'dialogue',
        side: 'a',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: JSON.stringify({
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        }),
        responseContent: 'hello',
        durationMs: 500,
        promptTokens: 100,
        completionTokens: 50,
      },
      {
        playgroundRunId: pgRun1Id,
        userId: player1Id,
        phase: 'dialogue',
        side: 'b',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: JSON.stringify({
          usage: { prompt_tokens: 200, completion_tokens: 100 },
        }),
        responseContent: 'world',
        durationMs: 600,
        promptTokens: 200,
        completionTokens: 100,
      },
    ])
    .run()

  // Playground run for player 2
  const pgRun2Id = db
    .insert(schema.playgroundRuns)
    .values({
      submissionId: player2SubmissionId,
      scenarioId: 'mon-test-scenario',
      status: 'scored',
    })
    .returning({ id: schema.playgroundRuns.id })
    .get()!.id

  // LLM call for player 2
  db.insert(schema.llmCalls)
    .values({
      playgroundRunId: pgRun2Id,
      userId: player2Id,
      phase: 'dialogue',
      side: 'a',
      model: 'deepseek-v3.2',
      provider: 'siliconflow',
      requestJson: '{}',
      responseJson: JSON.stringify({
        usage: { prompt_tokens: 50, completion_tokens: 25 },
      }),
      responseContent: 'test',
      durationMs: 300,
      promptTokens: 50,
      completionTokens: 25,
    })
    .run()

  const presetId = db
    .insert(schema.presetOpponents)
    .values({
      scenarioId: 'mon-test-scenario',
      role: 'b',
      label: '铁血守旧派',
      prompt: 'preset prompt',
    })
    .returning({ id: schema.presetOpponents.id })
    .get()!.id

  const tournamentId = db
    .insert(schema.tournaments)
    .values({
      scenarioId: 'mon-test-scenario',
      status: 'finished',
      currentRound: 1,
      totalRounds: 1,
    })
    .returning({ id: schema.tournaments.id })
    .get()!.id

  const roundId = db
    .insert(schema.rounds)
    .values({
      tournamentId,
      roundNumber: 1,
      status: 'done',
    })
    .returning({ id: schema.rounds.id })
    .get()!.id

  const matchId = db
    .insert(schema.matches)
    .values({
      roundId,
      scenarioId: 'mon-test-scenario',
      subAId: player1SubmissionId,
      subBId: player2SubmissionId,
      status: 'scored',
      currentTurn: 10,
      scoreA: 2,
      scoreB: 1,
      winner: 'a',
      startedAt: '2026-04-10T10:00:00.000Z',
      finishedAt: '2026-04-10T10:05:00.000Z',
      updatedAt: '2026-04-10T10:05:00.000Z',
      transcript: '[]',
      judgeTranscriptA: '[]',
      judgeTranscriptB: '[]',
      reasoning: 'player one wins',
    })
    .returning({ id: schema.matches.id })
    .get()!.id

  pveRunId = db
    .insert(schema.playgroundRuns)
    .values({
      submissionId: player1SubmissionId,
      scenarioId: 'mon-test-scenario',
      opponentMode: 'preset',
      presetOpponentId: presetId,
      presetOpponentRole: 'b',
      presetOpponentLabel: '铁血守旧派',
      status: 'scored',
      scoreA: 3,
      scoreB: 0,
      winner: 'a',
      startedAt: '2026-04-10T12:00:00.000Z',
      finishedAt: '2026-04-10T12:03:00.000Z',
      updatedAt: '2026-04-10T12:03:00.000Z',
      transcript: '[]',
      judgeTranscriptA: '[]',
      judgeTranscriptB: '[]',
      reasoning: 'preset loses',
    })
    .returning({ id: schema.playgroundRuns.id })
    .get()!.id

  db.insert(schema.llmCalls)
    .values([
      {
        matchId,
        userId: player1Id,
        phase: 'dialogue',
        side: 'a',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: '{}',
        responseContent: 'match-a',
        durationMs: 100,
        promptTokens: 100,
        completionTokens: 50,
      },
      {
        matchId,
        userId: player2Id,
        phase: 'dialogue',
        side: 'b',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: '{}',
        responseContent: 'match-b',
        durationMs: 100,
        promptTokens: 80,
        completionTokens: 40,
      },
      {
        matchId,
        phase: 'judgment',
        side: 'judge',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: '{}',
        responseContent: 'judge',
        durationMs: 100,
        promptTokens: 30,
        completionTokens: 10,
      },
      {
        matchId,
        phase: 'scoring',
        side: 'scorer',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: '{}',
        responseContent: 'score',
        durationMs: 100,
        promptTokens: 20,
        completionTokens: 5,
      },
      {
        playgroundRunId: pveRunId,
        userId: player1Id,
        phase: 'dialogue',
        side: 'a',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: '{}',
        responseContent: 'pve-a',
        durationMs: 100,
        promptTokens: 90,
        completionTokens: 45,
      },
      {
        playgroundRunId: pveRunId,
        phase: 'dialogue',
        side: 'b',
        model: 'deepseek-v3.2',
        provider: 'siliconflow',
        requestJson: '{}',
        responseJson: '{}',
        responseContent: 'preset-b',
        durationMs: 100,
        promptTokens: 40,
        completionTokens: 20,
      },
    ])
    .run()

  adminToken = await signToken({ userId: adminId, isAdmin: true })
  userToken = await signToken({ userId: player1Id, isAdmin: false })

  // Build test app with auth middleware + admin routes
  const { Hono } = await import('hono')
  const { adminAnalyticsRouter } = await import('./admin-analytics')
  const { adminMonitorRouter } = await import('./admin-monitor')
  app = new Hono()
  app.route('/', adminAnalyticsRouter)
  app.route('/', adminMonitorRouter)
})

afterAll(() => {
  try {
    unlinkSync(testDbPath)
    unlinkSync(`${testDbPath}-wal`)
    unlinkSync(`${testDbPath}-shm`)
  } catch {
    // ignore cleanup errors
  }
})

function req(method: string, path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return app.request(path, { method, headers })
}

describe('GET /api/admin/monitor/users', () => {
  it('returns 401 without auth', async () => {
    const res = await req('GET', '/api/admin/monitor/users')
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    const res = await req('GET', '/api/admin/monitor/users', userToken)
    expect(res.status).toBe(403)
  })

  it('returns monitor data for admin', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    expect(res.status).toBe(200)

    const data = (await res.json()) as Array<{
      userId: number
      displayName: string
      email: string
      disabled: boolean
      submissionCount: number
      latestVersion: number | null
      playgroundRunCount: number
      matchCount: number
      totalPromptTokens: number
      totalCompletionTokens: number
      totalTokens: number
      lastActiveAt: string | null
      isOverSoftCap: boolean
    }>

    // Should only include non-admin users
    expect(data.length).toBeGreaterThanOrEqual(2)
    expect(data.every((u) => u.userId !== adminId)).toBe(true)
  })

  it('returns correct token totals for player 1', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    const data = (await res.json()) as Array<{
      userId: number
      totalPromptTokens: number
      totalCompletionTokens: number
      totalTokens: number
      submissionCount: number
      latestVersion: number | null
      playgroundRunCount: number
    }>

    const p1 = data.find((u) => u.userId === player1Id)!
    expect(p1).toBeTruthy()
    expect(p1.totalPromptTokens).toBe(490)
    expect(p1.totalCompletionTokens).toBe(245)
    expect(p1.totalTokens).toBe(735)
    expect(p1.submissionCount).toBe(2)
    expect(p1.latestVersion).toBe(2)
    expect(p1.playgroundRunCount).toBe(2)
  })

  it('returns correct token totals for player 2', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    const data = (await res.json()) as Array<{
      userId: number
      totalPromptTokens: number
      totalCompletionTokens: number
      totalTokens: number
    }>

    const p2 = data.find((u) => u.userId === player2Id)!
    expect(p2).toBeTruthy()
    expect(p2.totalPromptTokens).toBe(130)
    expect(p2.totalCompletionTokens).toBe(65)
    expect(p2.totalTokens).toBe(195)
  })

  it('orders by total tokens descending', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    const data = (await res.json()) as Array<{
      userId: number
      totalTokens: number
    }>

    // Player 1 (735 tokens) should come before Player 2 (195 tokens)
    const p1Idx = data.findIndex((u) => u.userId === player1Id)
    const p2Idx = data.findIndex((u) => u.userId === player2Id)
    expect(p1Idx).toBeLessThan(p2Idx)
  })

  it('isOverSoftCap is false when under default 500K cap', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    const data = (await res.json()) as Array<{
      isOverSoftCap: boolean
    }>

    expect(data.every((u) => u.isOverSoftCap === false)).toBe(true)
  })

  it('uses a newer submission as last activity when battle analytics are older', async () => {
    const { eq } = await import('drizzle-orm')
    const schema = await import('../db/schema')
    const latestSubmissionAt = '2026-04-12T08:00:00.000Z'
    const stalePlayerId = db
      .insert(schema.users)
      .values({
        email: 'mon-stale-activity@test.com',
        passwordHash: 'hash',
        displayName: 'Stale Activity',
        isAdmin: false,
      })
      .returning({ id: schema.users.id })
      .get()!.id
    let staleSubmissionId: number | null = null

    try {
      staleSubmissionId = db
        .insert(schema.submissions)
        .values({
          userId: stalePlayerId,
          scenarioId: 'mon-test-scenario',
          version: 1,
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          promptA: 'old prompt a',
          promptB: 'old prompt b',
          createdAt: '2026-04-10T08:00:00.000Z',
        })
        .returning({ id: schema.submissions.id })
        .get()!.id

      db.insert(schema.submissions)
        .values({
          userId: stalePlayerId,
          scenarioId: 'mon-test-scenario',
          version: 2,
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          promptA: 'new prompt a',
          promptB: 'new prompt b',
          createdAt: latestSubmissionAt,
        })
        .run()

      const staleRunId = db
        .insert(schema.playgroundRuns)
        .values({
          submissionId: staleSubmissionId,
          scenarioId: 'mon-test-scenario',
          status: 'scored',
          startedAt: '2026-04-10T09:00:00.000Z',
          finishedAt: '2026-04-10T09:03:00.000Z',
          updatedAt: '2026-04-10T09:03:00.000Z',
          transcript: '[]',
          judgeTranscriptA: '[]',
          judgeTranscriptB: '[]',
        })
        .returning({ id: schema.playgroundRuns.id })
        .get()!.id

      db.insert(schema.llmCalls)
        .values({
          playgroundRunId: staleRunId,
          userId: stalePlayerId,
          phase: 'dialogue',
          side: 'a',
          model: 'deepseek-v3.2',
          provider: 'siliconflow',
          requestJson: '{}',
          responseJson: '{}',
          responseContent: 'stale',
          durationMs: 100,
          promptTokens: 10,
          completionTokens: 5,
        })
        .run()

      const res = await req('GET', '/api/admin/monitor/users', adminToken)
      const data = (await res.json()) as Array<{
        lastActiveAt: string | null
        userId: number
      }>

      expect(data.find((u) => u.userId === stalePlayerId)?.lastActiveAt).toBe(
        latestSubmissionAt,
      )
    } finally {
      db.delete(schema.llmCalls)
        .where(eq(schema.llmCalls.userId, stalePlayerId))
        .run()
      if (staleSubmissionId != null) {
        db.delete(schema.playgroundRuns)
          .where(eq(schema.playgroundRuns.submissionId, staleSubmissionId))
          .run()
      }
      db.delete(schema.submissions)
        .where(eq(schema.submissions.userId, stalePlayerId))
        .run()
      db.delete(schema.users).where(eq(schema.users.id, stalePlayerId)).run()
    }
  })
})

describe('GET /api/admin/monitor/llm-latency', () => {
  it('returns 401 without auth', async () => {
    const res = await req('GET', '/api/admin/monitor/llm-latency')
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    const res = await req('GET', '/api/admin/monitor/llm-latency', userToken)
    expect(res.status).toBe(403)
  })

  it('returns per-scenario, per-phase, per-model aggregates', async () => {
    const res = await req('GET', '/api/admin/monitor/llm-latency', adminToken)
    expect(res.status).toBe(200)

    const data = (await res.json()) as {
      aggregates: Array<{
        scenarioId: string
        phase: string
        model: string
        callCount: number
        runCount: number
        avgDurationMs: number
        p50DurationMs: number
        p95DurationMs: number
        totalPromptTokens: number
        totalCompletionTokens: number
      }>
      calls: Array<Record<string, unknown>>
    }

    const dialogue = data.aggregates.find(
      (row) =>
        row.scenarioId === 'mon-test-scenario' &&
        row.phase === 'dialogue' &&
        row.model === 'deepseek-v3.2',
    )

    expect(dialogue).toBeDefined()
    expect(dialogue?.callCount).toBe(7)
    expect(dialogue?.runCount).toBe(4)
    expect(dialogue?.avgDurationMs).toBe(257.1)
    expect(dialogue?.p50DurationMs).toBe(100)
    expect(dialogue?.p95DurationMs).toBe(600)
    expect(dialogue?.totalPromptTokens).toBe(660)
    expect(dialogue?.totalCompletionTokens).toBe(330)
    expect(data.calls.length).toBeGreaterThan(0)
  })

  it('filters playground and tournament rows separately', async () => {
    const tournamentRes = await req(
      'GET',
      '/api/admin/monitor/llm-latency?source=tournament',
      adminToken,
    )
    expect(tournamentRes.status).toBe(200)

    const tournamentData = (await tournamentRes.json()) as {
      aggregates: Array<{ phase: string; model: string; callCount: number }>
      calls: Array<{ source: string }>
    }
    const tournamentDialogue = tournamentData.aggregates.find(
      (row) => row.phase === 'dialogue' && row.model === 'deepseek-v3.2',
    )

    expect(tournamentDialogue?.callCount).toBe(2)
    expect(
      tournamentData.calls.every((row) => row.source === 'tournament'),
    ).toBe(true)

    const playgroundRes = await req(
      'GET',
      '/api/admin/monitor/llm-latency?source=playground',
      adminToken,
    )
    expect(playgroundRes.status).toBe(200)

    const playgroundData = (await playgroundRes.json()) as {
      aggregates: Array<{ phase: string; model: string; callCount: number }>
      calls: Array<{ source: string }>
    }
    const playgroundDialogue = playgroundData.aggregates.find(
      (row) => row.phase === 'dialogue' && row.model === 'deepseek-v3.2',
    )

    expect(playgroundDialogue?.callCount).toBe(5)
    expect(
      playgroundData.calls.every((row) => row.source === 'playground'),
    ).toBe(true)
  })

  it('excludes failed calls and calls from unfinished runs', async () => {
    const { eq } = await import('drizzle-orm')
    const schema = await import('../db/schema')
    const unfinishedRunId = db
      .insert(schema.playgroundRuns)
      .values({
        submissionId: player1SubmissionId,
        scenarioId: 'mon-test-scenario',
        status: 'running',
        transcript: '[]',
        judgeTranscriptA: '[]',
        judgeTranscriptB: '[]',
      })
      .returning({ id: schema.playgroundRuns.id })
      .get()!.id

    try {
      db.insert(schema.llmCalls)
        .values([
          {
            playgroundRunId: pveRunId,
            phase: 'scoring',
            side: 'scorer',
            model: 'claude-sonnet-4-5',
            provider: 'anthropic',
            requestJson: '{}',
            responseJson: null,
            responseContent: null,
            error: 'failed once',
            durationMs: 9999,
          },
          {
            playgroundRunId: unfinishedRunId,
            phase: 'scoring',
            side: 'scorer',
            model: 'claude-sonnet-4-5',
            provider: 'anthropic',
            requestJson: '{}',
            responseJson: '{}',
            responseContent: 'unfinished success',
            durationMs: 8888,
          },
        ])
        .run()

      const res = await req('GET', '/api/admin/monitor/llm-latency', adminToken)
      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        aggregates: Array<{ model: string }>
        calls: Array<{ model: string }>
      }

      expect(
        data.aggregates.some((row) => row.model === 'claude-sonnet-4-5'),
      ).toBe(false)
      expect(data.calls.some((row) => row.model === 'claude-sonnet-4-5')).toBe(
        false,
      )
    } finally {
      db.delete(schema.llmCalls)
        .where(eq(schema.llmCalls.playgroundRunId, unfinishedRunId))
        .run()
      db.delete(schema.llmCalls)
        .where(eq(schema.llmCalls.model, 'claude-sonnet-4-5'))
        .run()
      db.delete(schema.playgroundRuns)
        .where(eq(schema.playgroundRuns.id, unfinishedRunId))
        .run()
    }
  })
})

describe('GET /api/admin/analytics/*', () => {
  it('returns unified battles with tournament, pvp, and pve rows', async () => {
    const res = await req(
      'GET',
      '/api/admin/analytics/battles?limit=10',
      adminToken,
    )
    expect(res.status).toBe(200)
    const data = (await res.json()) as Array<Record<string, unknown>>

    expect(data).toHaveLength(4)

    const pve = data.find(
      (item) => item.source === 'playground' && item.mode === 'pve',
    )
    expect(pve).toBeDefined()
    expect((pve as { participantA: { kind: string } }).participantA.kind).toBe(
      'submission',
    )
    expect((pve as { participantB: { kind: string } }).participantB.kind).toBe(
      'preset',
    )

    const tournament = data.find((item) => item.source === 'tournament')
    expect(tournament).toBeDefined()
    expect((tournament as { totalTokens: number }).totalTokens).toBe(335)
  })

  it('returns per-agent summaries on submission + side granularity', async () => {
    const res = await req(
      'GET',
      `/api/admin/analytics/users/${player1Id}/agents`,
      adminToken,
    )
    expect(res.status).toBe(200)
    const data = (await res.json()) as Array<Record<string, unknown>>

    expect(data).toHaveLength(4)

    const agentA = data.find(
      (item) => item.submissionId === player1SubmissionId && item.side === 'a',
    ) as Record<string, unknown> | undefined
    const agentB = data.find(
      (item) => item.submissionId === player1SubmissionId && item.side === 'b',
    ) as Record<string, unknown> | undefined

    expect(agentA).toBeDefined()
    expect(agentA?.battleCount).toBe(3)
    expect(agentA?.tournamentBattleCount).toBe(1)
    expect(agentA?.playgroundPvpCount).toBe(1)
    expect(agentA?.playgroundPveCount).toBe(1)
    expect(agentA?.wins).toBe(2)
    expect(agentA?.losses).toBe(1)
    expect(agentA?.draws).toBe(0)
    expect(agentA?.totalTokens).toBe(435)

    expect(agentB).toBeDefined()
    expect(agentB?.battleCount).toBe(1)
    expect(agentB?.wins).toBe(1)
    expect(agentB?.totalTokens).toBe(300)
  })

  it('exports a remote battle with parsed llm call payloads', async () => {
    const res = await req(
      'GET',
      `/api/admin/analytics/battles/playground/${pveRunId}/export`,
      adminToken,
    )
    expect(res.status).toBe(200)
    const data = (await res.json()) as {
      kind: string
      llmCalls: Array<{ requestJson: unknown; responseJson: unknown }>
      summary: { mode: string | null }
    }

    expect(data.kind).toBe('playground_battle')
    expect(data.summary.mode).toBe('pve')
    expect(data.llmCalls.length).toBeGreaterThan(0)
    expect(data.llmCalls[0]?.requestJson).toBeDefined()
  })
})
