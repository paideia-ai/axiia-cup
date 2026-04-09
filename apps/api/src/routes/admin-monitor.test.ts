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
  const sub1Id = db
    .insert(schema.submissions)
    .values({
      userId: player1Id,
      scenarioId: 'mon-test-scenario',
      version: 1,
      model: 'deepseek-v3.2',
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
      model: 'deepseek-v3.2',
      promptA: 'prompt a v2',
      promptB: 'prompt b v2',
    })
    .run()

  // Submission for player 2
  const sub3Id = db
    .insert(schema.submissions)
    .values({
      userId: player2Id,
      scenarioId: 'mon-test-scenario',
      version: 1,
      model: 'deepseek-v3.2',
      promptA: 'prompt a v1',
      promptB: 'prompt b v1',
    })
    .returning({ id: schema.submissions.id })
    .get()!.id

  // Playground run for player 1
  const pgRun1Id = db
    .insert(schema.playgroundRuns)
    .values({
      submissionId: sub1Id,
      scenarioId: 'mon-test-scenario',
      status: 'scored',
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
      submissionId: sub3Id,
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

  adminToken = await signToken({ userId: adminId, isAdmin: true })
  userToken = await signToken({ userId: player1Id, isAdmin: false })

  // Build test app with auth middleware + admin monitor router
  const { Hono } = await import('hono')
  const { adminMonitorRouter } = await import('./admin-monitor')
  app = new Hono()
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

  it('returns correct token totals for player 2', async () => {
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
    expect(p1.totalPromptTokens).toBe(300)
    expect(p1.totalCompletionTokens).toBe(150)
    expect(p1.totalTokens).toBe(450)
    expect(p1.submissionCount).toBe(2)
    expect(p1.latestVersion).toBe(2)
    expect(p1.playgroundRunCount).toBe(1)
  })

  it('returns correct token totals for player 3', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    const data = (await res.json()) as Array<{
      userId: number
      totalPromptTokens: number
      totalCompletionTokens: number
      totalTokens: number
    }>

    const p2 = data.find((u) => u.userId === player2Id)!
    expect(p2).toBeTruthy()
    expect(p2.totalPromptTokens).toBe(50)
    expect(p2.totalCompletionTokens).toBe(25)
    expect(p2.totalTokens).toBe(75)
  })

  it('orders by total tokens descending', async () => {
    const res = await req('GET', '/api/admin/monitor/users', adminToken)
    const data = (await res.json()) as Array<{
      userId: number
      totalTokens: number
    }>

    // Player 1 (450 tokens) should come before Player 2 (75 tokens)
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
})
