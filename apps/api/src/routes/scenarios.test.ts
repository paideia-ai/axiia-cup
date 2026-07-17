import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const testDbPath = join(tmpdir(), `axiia-scenarios-test-${Date.now()}.db`)
process.env.AXIIA_DB_PATH = testDbPath
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SILICONFLOW_API_KEY = 'test-key'

let app: import('hono').Hono
let db: (typeof import('../db/client'))['db']
let signToken: (typeof import('../lib/auth'))['signToken']
let scenariosTable: (typeof import('../db/schema'))['scenarios']
let tournamentsTable: (typeof import('../db/schema'))['tournaments']

let adminToken: string
let userToken: string

beforeAll(async () => {
  const { migrate } = await import('drizzle-orm/bun-sqlite/migrator')
  const client = await import('../db/client')
  db = client.db
  migrate(db, {
    migrationsFolder: new URL('../db/migrations', import.meta.url).pathname,
  })

  const schema = await import('../db/schema')
  scenariosTable = schema.scenarios
  tournamentsTable = schema.tournaments

  db.delete(schema.llmCalls).run()
  db.delete(schema.matches).run()
  db.delete(schema.rounds).run()
  db.delete(schema.tournaments).run()
  db.delete(schema.playgroundRuns).run()
  db.delete(schema.presetOpponents).run()
  db.delete(schema.submissions).run()
  db.delete(schema.users).run()
  db.delete(schema.scenarios).run()

  const auth = await import('../lib/auth')
  signToken = auth.signToken

  // Create test users
  db.insert(schema.users)
    .values([
      {
        email: 'admin@test.com',
        passwordHash: 'hash',
        displayName: 'Admin',
        isAdmin: true,
      },
      {
        email: 'user@test.com',
        passwordHash: 'hash',
        displayName: 'User',
        isAdmin: false,
      },
    ])
    .run()

  adminToken = await signToken({ userId: 1, isAdmin: true })
  userToken = await signToken({ userId: 2, isAdmin: false })

  // Create test scenario
  db.insert(scenariosTable)
    .values({
      id: 'test-scenario',
      title: '测试场景',
      subject: '历史',
      roleAName: '角色A',
      roleBName: '角色B',
      turnCount: 10,
      judgeModel: 'deepseek-v3.2',
      scorerModel: 'deepseek-v3.2',
      judgePrompt: '原始裁判提示词',
      judgeOsPrompt: '',
      scorerPrompt: '原始计分提示词',
      agentPromptTemplate: '模板',
      examinationQuestionTemplate: '问题模板',
    })
    .run()

  // Build a test Hono app with only the scenarios router mounted
  // (avoids importing index.ts which calls Bun.serve)
  const { Hono } = await import('hono')
  const { scenariosRouter } = await import('./scenarios')
  app = new Hono()
  app.route('/', scenariosRouter)
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

const validUpdate = {
  turnCount: 15,
  judgeModel: 'kimi-k2.5',
  scorerModel: 'gpt-4.1',
  judgePrompt: '更新后的裁判提示词',
  judgeOsPrompt: '更新后的内心 OS 提示词',
  scorerPrompt: '更新后的计分提示词',
  openingLine: '请开始辩论。',
  agentPromptTemplate: '更新后模板',
  examinationQuestionTemplate: '更新后问题模板',
  roleAName: '角色A',
  roleAHiddenInfo: [{ id: 'S1', content: '信息1' }],
  roleAOptions: [],
  roleARequests: [{ id: 'SR1', content: '请求1' }],
  roleBName: '角色B',
  roleBHiddenInfo: [{ id: 'G1', content: '信息2' }],
  roleBOptions: [],
  roleBRequests: [{ id: 'GR1', content: '请求2' }],
  falseInfoCount: 0,
  trueRequestCount: 1,
}

describe('PUT /api/admin/scenarios/:id', () => {
  it('returns 403 for non-admin user', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      userToken,
      validUpdate,
    )
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent scenario', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/does-not-exist',
      adminToken,
      validUpdate,
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty judgePrompt', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      { ...validUpdate, judgePrompt: '' },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for turnCount = 0', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      { ...validUpdate, turnCount: 0 },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for duplicate request ids across both sides', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      {
        ...validUpdate,
        roleBRequests: [{ id: 'SR1', content: '重复请求 ID' }],
      },
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for request ids with unsupported characters', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      {
        ...validUpdate,
        roleARequests: [{ id: 'SR-1', content: '非法请求 ID' }],
      },
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 when request ids collide with hidden info ids', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      {
        ...validUpdate,
        roleARequests: [{ id: 'S1', content: '与隐藏信息冲突' }],
      },
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 when trueRequestCount exceeds available requests', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      {
        ...validUpdate,
        trueRequestCount: 2,
      },
    )

    expect(res.status).toBe(400)
  })

  it('returns 200 and updates fields when unlocked', async () => {
    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      validUpdate,
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.judgePrompt).toBe('更新后的裁判提示词')
    expect(json.judgeOsPrompt).toBe('更新后的内心 OS 提示词')
    expect(json.turnCount).toBe(15)
    expect(json.judgeModel).toBe('kimi-k2.5')
    expect(json.scorerModel).toBe('gpt-4.1')
    expect(json.locked).toBe(false)
  })

  it('returns 423 when a tournament is running', async () => {
    db.insert(tournamentsTable)
      .values({
        scenarioId: 'test-scenario',
        status: 'running',
        currentRound: 1,
        totalRounds: 4,
      })
      .run()

    const res = await req(
      'PUT',
      '/api/admin/scenarios/test-scenario',
      adminToken,
      validUpdate,
    )
    expect(res.status).toBe(423)

    // Clean up
    const { eq } = await import('drizzle-orm')
    db.delete(tournamentsTable)
      .where(eq(tournamentsTable.scenarioId, 'test-scenario'))
      .run()
  })
})

describe('GET /api/scenarios/:id', () => {
  it('rejects unauthenticated requests', async () => {
    // Scenario details include judge prompts and hidden-info pools; they are
    // player-facing but must never be readable without an account.
    const res = await req('GET', '/api/scenarios/test-scenario')
    expect(res.status).toBe(401)
  })

  it('never exposes the Judge OS prompt to players', async () => {
    const res = await req('GET', '/api/scenarios/test-scenario', userToken)
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.id).toBe('test-scenario')
    expect('judgeOsPrompt' in json).toBe(false)
  })
})

describe('GET /api/admin/scenarios locked field', () => {
  it('returns locked=false when no tournament exists', async () => {
    const res = await req('GET', '/api/admin/scenarios', adminToken)
    expect(res.status).toBe(200)
    const json = (await res.json()) as Array<Record<string, unknown>>
    const scenario = json.find((s) => s.id === 'test-scenario')
    expect(scenario?.locked).toBe(false)
  })

  it('returns locked=true when tournament is running', async () => {
    db.insert(tournamentsTable)
      .values({
        scenarioId: 'test-scenario',
        status: 'running',
        currentRound: 1,
        totalRounds: 4,
      })
      .run()

    const res = await req('GET', '/api/admin/scenarios', adminToken)
    const json = (await res.json()) as Array<Record<string, unknown>>
    const scenario = json.find((s) => s.id === 'test-scenario')
    expect(scenario?.locked).toBe(true)

    // Clean up
    const { eq } = await import('drizzle-orm')
    db.delete(tournamentsTable)
      .where(eq(tournamentsTable.scenarioId, 'test-scenario'))
      .run()
  })

  it('returns locked=false when tournament is finished', async () => {
    db.insert(tournamentsTable)
      .values({
        scenarioId: 'test-scenario',
        status: 'finished',
        currentRound: 4,
        totalRounds: 4,
      })
      .run()

    const res = await req('GET', '/api/admin/scenarios', adminToken)
    const json = (await res.json()) as Array<Record<string, unknown>>
    const scenario = json.find((s) => s.id === 'test-scenario')
    expect(scenario?.locked).toBe(false)

    // Clean up
    const { eq } = await import('drizzle-orm')
    db.delete(tournamentsTable)
      .where(eq(tournamentsTable.scenarioId, 'test-scenario'))
      .run()
  })
})
