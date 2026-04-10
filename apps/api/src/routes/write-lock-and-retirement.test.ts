import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'

const testDbPath = join(tmpdir(), `axiia-write-lock-test-${Date.now()}.db`)
process.env.AXIIA_DB_PATH = testDbPath
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SILICONFLOW_API_KEY = 'test-key'

let app: import('hono').Hono
let db: (typeof import('../db/client'))['db']
let schema: typeof import('../db/schema')
let signToken: (typeof import('../lib/auth'))['signToken']
let adminToken: string
let userToken: string

beforeAll(async () => {
  const { migrate } = await import('drizzle-orm/bun-sqlite/migrator')
  const client = await import('../db/client')
  db = client.db
  migrate(db, {
    migrationsFolder: new URL('../db/migrations', import.meta.url).pathname,
  })

  schema = await import('../db/schema')
  const auth = await import('../lib/auth')
  signToken = auth.signToken
  adminToken = await signToken({ userId: 1, isAdmin: true })
  userToken = await signToken({ userId: 2, isAdmin: false })

  const { Hono } = await import('hono')
  const { playgroundRouter } = await import('./playground')
  const { submissionsRouter } = await import('./submissions')
  const { tournamentRouter } = await import('./tournaments')

  app = new Hono()
  app.route('/', submissionsRouter)
  app.route('/', playgroundRouter)
  app.route('/', tournamentRouter)
})

beforeEach(() => {
  db.delete(schema.appSettings).run()
  db.delete(schema.llmCalls).run()
  db.delete(schema.matches).run()
  db.delete(schema.rounds).run()
  db.delete(schema.tournaments).run()
  db.delete(schema.playgroundRuns).run()
  db.delete(schema.presetOpponents).run()
  db.delete(schema.submissions).run()
  db.delete(schema.users).run()
  db.delete(schema.scenarios).run()

  db.insert(schema.users)
    .values([
      {
        id: 1,
        email: 'admin@test.com',
        passwordHash: 'hash',
        displayName: 'Admin',
        isAdmin: true,
      },
      {
        id: 2,
        email: 'user@test.com',
        passwordHash: 'hash',
        displayName: 'User',
        isAdmin: false,
      },
    ])
    .run()

  db.insert(schema.scenarios)
    .values({
      id: 'test-scenario',
      title: '测试场景',
      subject: '历史',
      roleAName: '角色A',
      roleBName: '角色B',
      judgePrompt: '裁判提示词',
      scorerPrompt: '计分提示词',
      agentPromptTemplate: '模板',
      examinationQuestionTemplate: '问题模板',
    })
    .run()
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

function req(method: string, path: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = {}

  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  return app.request(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('write lock and retired submissions', () => {
  it('blocks submission creation while write lock is enabled', async () => {
    db.insert(schema.appSettings).values({ key: 'writeLock', value: '1' }).run()

    const res = await req('POST', '/api/submissions', userToken, {
      scenarioId: 'test-scenario',
      promptA: 'prompt a',
      promptB: 'prompt b',
      model: 'deepseek-v3.2',
    })

    expect(res.status).toBe(503)
  })

  it('returns retired submissions in the normal list as read-only records', async () => {
    db.insert(schema.submissions)
      .values([
        {
          id: 11,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'active a',
          promptB: 'active b',
          model: 'deepseek-v3.2',
          version: 1,
        },
        {
          id: 12,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'retired a',
          promptB: 'retired b',
          model: 'deepseek-v3.2',
          retiredAt: '2026-04-09 12:00:00',
          version: 2,
        },
      ])
      .run()

    const res = await req('GET', '/api/submissions/my', userToken)
    const json = (await res.json()) as Array<{
      id: number
      retiredAt: string | null
    }>

    expect(res.status).toBe(200)
    expect(json.map((item) => item.id).sort((a, b) => a - b)).toEqual([11, 12])
    expect(json.find((item) => item.id === 12)?.retiredAt).toBe(
      '2026-04-09 12:00:00',
    )
    expect(json.find((item) => item.id === 11)?.retiredAt).toBeNull()
  })

  it('rejects playground runs for retired submissions', async () => {
    db.insert(schema.submissions)
      .values({
        id: 21,
        userId: 2,
        scenarioId: 'test-scenario',
        promptA: 'retired a',
        promptB: 'retired b',
        model: 'deepseek-v3.2',
        retiredAt: '2026-04-09 12:00:00',
        version: 1,
      })
      .run()

    const res = await req('POST', '/api/playground/run', userToken, {
      submissionId: 21,
    })

    expect(res.status).toBe(409)
  })

  it('allows users to interrupt their own queued playground run', async () => {
    db.insert(schema.submissions)
      .values({
        id: 22,
        userId: 2,
        scenarioId: 'test-scenario',
        promptA: 'prompt a',
        promptB: 'prompt b',
        model: 'deepseek-v3.2',
        version: 1,
      })
      .run()

    db.insert(schema.playgroundRuns)
      .values({
        id: 23,
        submissionId: 22,
        scenarioId: 'test-scenario',
        status: 'queued',
      })
      .run()

    const res = await req(
      'POST',
      '/api/playground/runs/22/23/interrupt',
      userToken,
    )
    const json = (await res.json()) as { error: string | null }

    expect(res.status).toBe(200)
    expect(json.error).toBe('用户手动中断了本次试炼场运行')

    const interrupted = db
      .select()
      .from(schema.playgroundRuns)
      .where(eq(schema.playgroundRuns.id, 23))
      .get()

    expect(interrupted?.status).toBe('error')
  })

  it('interrupts running playground runs even when write lock is enabled', async () => {
    db.insert(schema.appSettings).values({ key: 'writeLock', value: '1' }).run()

    db.insert(schema.submissions)
      .values({
        id: 24,
        userId: 2,
        scenarioId: 'test-scenario',
        promptA: 'prompt a',
        promptB: 'prompt b',
        model: 'deepseek-v3.2',
        version: 1,
      })
      .run()

    db.insert(schema.playgroundRuns)
      .values({
        id: 25,
        submissionId: 24,
        scenarioId: 'test-scenario',
        leaseToken: 'lease-1',
        status: 'running',
      })
      .run()

    const res = await req(
      'POST',
      '/api/playground/runs/24/25/interrupt',
      userToken,
    )

    expect(res.status).toBe(200)

    const interrupted = db
      .select()
      .from(schema.playgroundRuns)
      .where(eq(schema.playgroundRuns.id, 25))
      .get()

    expect(interrupted?.status).toBe('error')
    expect(interrupted?.leaseToken).toBeNull()
    expect(interrupted?.error).toBe('用户手动中断了本次试炼场运行')
  })

  it('rejects retrying matches that include retired submissions', async () => {
    db.insert(schema.submissions)
      .values([
        {
          id: 31,
          userId: 1,
          scenarioId: 'test-scenario',
          promptA: 'admin a',
          promptB: 'admin b',
          model: 'deepseek-v3.2',
          version: 1,
        },
        {
          id: 32,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'retired a',
          promptB: 'retired b',
          model: 'deepseek-v3.2',
          retiredAt: '2026-04-09 12:00:00',
          version: 1,
        },
      ])
      .run()

    db.insert(schema.tournaments)
      .values({
        id: 41,
        scenarioId: 'test-scenario',
        status: 'running',
        currentRound: 1,
        totalRounds: 4,
      })
      .run()

    db.insert(schema.rounds)
      .values({
        id: 42,
        tournamentId: 41,
        roundNumber: 1,
        status: 'running',
      })
      .run()

    db.insert(schema.matches)
      .values({
        id: 43,
        roundId: 42,
        scenarioId: 'test-scenario',
        status: 'error',
        subAId: 31,
        subBId: 32,
        updatedAt: '2026-04-09T12:00:00.000Z',
      })
      .run()

    const res = await req('POST', '/api/admin/matches/43/retry', adminToken)

    expect(res.status).toBe(409)
  })
})
