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
      modelA: 'deepseek-v3.2',
      modelB: 'deepseek-v3.2',
    })

    expect(res.status).toBe(503)
  })

  it('allows submission creation when the latest tournament is open but not running', async () => {
    db.insert(schema.tournaments)
      .values({
        id: 10,
        scenarioId: 'test-scenario',
        status: 'open',
        currentRound: 0,
        totalRounds: 4,
      })
      .run()

    const res = await req('POST', '/api/submissions', userToken, {
      scenarioId: 'test-scenario',
      promptA: 'prompt a',
      promptB: 'prompt b',
      modelA: 'deepseek-v3.2',
      modelB: 'deepseek-v3.2',
    })
    const json = (await res.json()) as { id: number; scenarioId: string }

    expect(res.status).toBe(201)
    expect(json).toMatchObject({ scenarioId: 'test-scenario' })

    const createdSubmission = db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, json.id))
      .get()

    expect(createdSubmission?.userId).toBe(2)
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
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          version: 1,
        },
        {
          id: 12,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'retired a',
          promptB: 'retired b',
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
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

  it('allows admins to queue a playground run for another user submission', async () => {
    db.insert(schema.submissions)
      .values({
        id: 13,
        userId: 2,
        scenarioId: 'test-scenario',
        promptA: 'prompt a',
        promptB: 'prompt b',
        modelLegacy: 'deepseek-v3.2',
        modelA: 'deepseek-v3.2',
        modelB: 'deepseek-v3.2',
        version: 1,
      })
      .run()

    const res = await req('POST', '/api/playground/run', adminToken, {
      submissionId: 13,
    })
    const json = (await res.json()) as { id: number; status: string }

    expect(res.status).toBe(202)
    expect(json.status).toBe('queued')

    const createdRun = db
      .select()
      .from(schema.playgroundRuns)
      .where(eq(schema.playgroundRuns.id, json.id))
      .get()

    expect(createdRun?.submissionId).toBe(13)
  })

  it('allows admins to inspect and interrupt another user playground run', async () => {
    db.insert(schema.submissions)
      .values({
        id: 14,
        userId: 2,
        scenarioId: 'test-scenario',
        promptA: 'prompt a',
        promptB: 'prompt b',
        modelLegacy: 'deepseek-v3.2',
        modelA: 'deepseek-v3.2',
        modelB: 'deepseek-v3.2',
        version: 1,
      })
      .run()

    db.insert(schema.playgroundRuns)
      .values({
        id: 15,
        submissionId: 14,
        scenarioId: 'test-scenario',
        status: 'queued',
      })
      .run()

    const listRes = await req('GET', '/api/playground/runs/14', adminToken)
    const listJson = (await listRes.json()) as Array<{ id: number }>

    expect(listRes.status).toBe(200)
    expect(listJson.map((item) => item.id)).toEqual([15])

    const detailRes = await req('GET', '/api/playground/runs/14/15', adminToken)
    const detailJson = (await detailRes.json()) as {
      id: number
      submissionId: number
    }

    expect(detailRes.status).toBe(200)
    expect(detailJson.id).toBe(15)
    expect(detailJson.submissionId).toBe(14)

    const statusRes = await req(
      'GET',
      '/api/playground/runs/14/15/status',
      adminToken,
    )
    const statusJson = (await statusRes.json()) as {
      id: number
      status: string
    }

    expect(statusRes.status).toBe(200)
    expect(statusJson).toMatchObject({ id: 15, status: 'queued' })

    const interruptRes = await req(
      'POST',
      '/api/playground/runs/14/15/interrupt',
      adminToken,
    )
    const interruptJson = (await interruptRes.json()) as {
      error: string | null
    }

    expect(interruptRes.status).toBe(200)
    expect(interruptJson.error).toBe('用户手动中断了本次试炼场运行')
  })

  it('still blocks non-admin users from reading another user playground runs', async () => {
    db.insert(schema.submissions)
      .values({
        id: 16,
        userId: 1,
        scenarioId: 'test-scenario',
        promptA: 'prompt a',
        promptB: 'prompt b',
        modelLegacy: 'deepseek-v3.2',
        modelA: 'deepseek-v3.2',
        modelB: 'deepseek-v3.2',
        version: 1,
      })
      .run()

    db.insert(schema.playgroundRuns)
      .values({
        id: 17,
        submissionId: 16,
        scenarioId: 'test-scenario',
        status: 'queued',
      })
      .run()

    const res = await req('GET', '/api/playground/runs/16', userToken)

    expect(res.status).toBe(404)
  })

  it('rejects playground runs for retired submissions', async () => {
    db.insert(schema.submissions)
      .values({
        id: 21,
        userId: 2,
        scenarioId: 'test-scenario',
        promptA: 'retired a',
        promptB: 'retired b',
        modelLegacy: 'deepseek-v3.2',
        modelA: 'deepseek-v3.2',
        modelB: 'deepseek-v3.2',
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
        modelLegacy: 'deepseek-v3.2',
        modelA: 'deepseek-v3.2',
        modelB: 'deepseek-v3.2',
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
        modelLegacy: 'deepseek-v3.2',
        modelA: 'deepseek-v3.2',
        modelB: 'deepseek-v3.2',
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
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          version: 1,
        },
        {
          id: 32,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'retired a',
          promptB: 'retired b',
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
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

  it('allows admins to export latest player prompts for a scenario', async () => {
    db.insert(schema.submissions)
      .values([
        {
          id: 21,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'prompt a v1',
          promptB: 'prompt b v1',
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          version: 1,
          createdAt: '2026-04-09 10:00:00',
        },
        {
          id: 22,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'prompt a v2',
          promptB: 'prompt b v2',
          modelLegacy: 'kimi-k2.5',
          modelA: 'kimi-k2.5',
          modelB: 'kimi-k2.5',
          version: 2,
          createdAt: '2026-04-09 11:00:00',
        },
      ])
      .run()

    const res = await req(
      'GET',
      '/api/admin/tournaments/players/prompts?scenarioId=test-scenario',
      adminToken,
    )
    const json = (await res.json()) as Array<{
      displayName: string
      email: string
      modelA: string
      modelB: string
      promptA: string
      promptB: string
      submissionId: number
      submittedAt: string
      userId: number
      version: number
    }>

    expect(res.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0]).toEqual({
      userId: 2,
      submissionId: 22,
      email: 'user@test.com',
      displayName: 'User',
      modelA: 'kimi-k2.5',
      modelB: 'kimi-k2.5',
      promptA: 'prompt a v2',
      promptB: 'prompt b v2',
      version: 2,
      submittedAt: '2026-04-09 11:00:00',
    })
  })

  it('allows admins to terminate a running tournament even when write lock is enabled', async () => {
    db.insert(schema.submissions)
      .values([
        {
          id: 51,
          userId: 2,
          scenarioId: 'test-scenario',
          promptA: 'prompt a',
          promptB: 'prompt b',
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          version: 1,
        },
        {
          id: 52,
          userId: 1,
          scenarioId: 'test-scenario',
          promptA: 'prompt admin a',
          promptB: 'prompt admin b',
          modelLegacy: 'deepseek-v3.2',
          modelA: 'deepseek-v3.2',
          modelB: 'deepseek-v3.2',
          version: 1,
        },
      ])
      .run()

    db.insert(schema.appSettings).values({ key: 'writeLock', value: '1' }).run()

    db.insert(schema.tournaments)
      .values({
        id: 61,
        scenarioId: 'test-scenario',
        status: 'running',
        currentRound: 1,
        totalRounds: 4,
      })
      .run()

    db.insert(schema.rounds)
      .values({
        id: 62,
        tournamentId: 61,
        roundNumber: 1,
        status: 'running',
      })
      .run()

    db.insert(schema.matches)
      .values([
        {
          id: 63,
          roundId: 62,
          scenarioId: 'test-scenario',
          status: 'queued',
          subAId: 51,
          subBId: 52,
          updatedAt: '2026-04-09T12:00:00.000Z',
        },
        {
          id: 64,
          roundId: 62,
          scenarioId: 'test-scenario',
          status: 'running',
          subAId: 52,
          subBId: 51,
          leaseToken: 'lease-64',
          updatedAt: '2026-04-09T12:00:00.000Z',
        },
      ])
      .run()

    const res = await req(
      'POST',
      '/api/admin/tournaments/61/terminate',
      adminToken,
    )
    const json = (await res.json()) as { ok: true }

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })

    const tournament = db
      .select()
      .from(schema.tournaments)
      .where(eq(schema.tournaments.id, 61))
      .get()
    const round = db
      .select()
      .from(schema.rounds)
      .where(eq(schema.rounds.id, 62))
      .get()
    const terminatedMatches = db
      .select()
      .from(schema.matches)
      .where(eq(schema.matches.roundId, 62))
      .all()

    expect(tournament?.status).toBe('terminated')
    expect(round?.status).toBe('done')
    expect(terminatedMatches.every((match) => match.status === 'error')).toBe(
      true,
    )
    expect(
      terminatedMatches.every(
        (match) => match.error === '管理员手动终止了当前赛事',
      ),
    ).toBe(true)
    expect(terminatedMatches.every((match) => match.leaseToken === null)).toBe(
      true,
    )
  })
})
