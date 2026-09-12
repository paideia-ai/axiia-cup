import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { createServer, request as httpRequest } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { type APIRequestContext, expect, test } from '@playwright/test'
import type {
  A6QuotaCheckpoint,
  A6QuotaManifest,
} from '../../e2e/a6-quota-preparation'
import {
  baseURL,
  installFixtureScenario,
  openBattlePanel,
  sameOrigin,
} from './helpers'

const run = promisify(execFile)
const local = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(baseURL)
test.use({ screenshot: 'off', trace: 'off', video: 'off' })
test.skip(
  !local || process.env.AXIIA_E2E_ISOLATED !== '1',
  'Only the runner-owned isolated server may provision and consume these fixtures',
)

async function state(api: APIRequestContext) {
  const configResponse = await api.get('/v1/config')
  const historyResponse = await api.get('/v1/matches')
  expect(configResponse.ok() && historyResponse.ok()).toBe(true)
  const config = await configResponse.json()
  const history = await historyResponse.json()
  const ownedIDs = history.matches.filter((
    match: {
      initiatorIsMe: boolean
      participants?: { a: { isMine: boolean }; b: { isMine: boolean } }
    },
  ) =>
    match.initiatorIsMe || match.participants?.a.isMine ||
    match.participants?.b.isMine
  ).map((match: { id: number }) => match.id).sort((a: number, b: number) =>
    a - b
  )
  return {
    usage: config.usage,
    dailyBattleLimit: config.dailyBattleLimit,
    ownedIDs,
  }
}

// No server response or score is stubbed. Detail GET connections are interrupted
// AFTER the first real dispatch ID was durably recorded, until that CLI exits.
// Forwarding then resumes to exercise its actual private-checkpoint recovery.
async function interruptionProxy() {
  let interruptDetail = true
  const calls: Array<{ method: string; path: string }> = []
  const server = createServer((req, res) => {
    const path = req.url!
    calls.push({ method: req.method!, path })
    if (
      interruptDetail && req.method === 'GET' &&
      /^\/v1\/matches\/\d+$/.test(path)
    ) {
      req.socket.destroy()
      return
    }
    const target = new URL(path, baseURL)
    const upstream = httpRequest(target, {
      method: req.method,
      headers: { ...req.headers, host: target.host },
    }, (response) => {
      res.writeHead(response.statusCode!, response.headers)
      response.pipe(res)
    })
    upstream.on('error', () => {
      res.destroy()
    })
    req.pipe(upstream)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  return {
    baseURL: `http://127.0.0.1:${address.port}`,
    calls,
    resumeForwarding: () => {
      interruptDetail = false
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections()
        server.close((error) => error ? reject(error) : resolve())
      }),
  }
}

test('dedicated A6 total quota CLI resumes accepted IDs and its enabled Hotseat action rejects exactly without enqueue', async ({ browser }) => {
  test.setTimeout(300_000)
  const directory = await mkdtemp(join(tmpdir(), 'axiia-a6-quota-'))
  const proxy = await interruptionProxy()
  try {
    const scenarioID = `a6-quota-${Date.now()}`
    // Real QuickJS worker lifecycle and SQLite scoring, with a deterministic
    // scenario that calls no model APIs. Product scenario/model quality is outside this test.
    await installFixtureScenario(scenarioID, 'A6 总配额固定局')
    const adminEmail = `quota-admin-${
      randomBytes(8).toString('hex')
    }@axiia.test`
    const adminPassword = randomBytes(20).toString('hex')
    // A fresh isolated control-plane admin avoids reusing the seed admin's TOTP
    // counter; the preparation command itself performs one elevation POST only.
    let mint: { stdout: string }
    try {
      mint = await run(process.env.AXIIA_BIN!, [
        'admin',
        'mint',
        '--email',
        adminEmail,
        '--name',
        'Isolated quota admin',
        '--password',
        adminPassword,
      ])
    } catch {
      throw new Error(
        'isolated quota admin mint failed (private output suppressed)',
      )
    }
    const adminTotpSecret = /^TOTP secret: (.+)$/m.exec(mint.stdout)?.[1]
    expect(Boolean(adminTotpSecret), 'fresh isolated TOTP secret returned')
      .toBe(true)
    const probe = await browser.newContext()
    let models: { models: { id: string }[] }
    try {
      expect(
        (await probe.request.post('/v1/auth/login', {
          headers: sameOrigin,
          data: { email: adminEmail, password: adminPassword },
        })).ok(),
      ).toBe(true)
      const response = await probe.request.get('/v1/models')
      expect(response.ok()).toBe(true)
      models = await response.json()
    } finally {
      await probe.close()
    }
    const modelID = models.models.find((model) =>
      model.id.includes('flash')
    )?.id ?? models.models[0].id

    const prepare = async (suffix: string, resumeFrom?: string) => {
      const privateOut = join(directory, `${suffix}-private.jsonl`)
      const publicOut = join(directory, `${suffix}-public.json`)
      let ok = true
      let stdout = ''
      try {
        const result = await run('deno', [
          'run',
          '-A',
          '--no-config',
          'e2e/prepare-a6-quota.ts',
          '--apply',
          ...(resumeFrom ? ['--resume'] : []),
        ], {
          cwd: resolve('.'),
          maxBuffer: 2 * 1024 * 1024,
          env: {
            ...process.env,
            AXIIA_BASE_URL: proxy.baseURL,
            AXIIA_A6_QUOTA_SCENARIO: scenarioID,
            AXIIA_A6_QUOTA_MODEL_ID: modelID,
            AXIIA_A6_QUOTA_MAX_MATCHES: '20',
            AXIIA_A6_QUOTA_MATCH_TIMEOUT_SECONDS: '30',
            AXIIA_ADMIN_EMAIL: resumeFrom ? '' : adminEmail,
            AXIIA_ADMIN_PASSWORD: resumeFrom ? '' : adminPassword,
            AXIIA_ADMIN_TOTP_SECRET: resumeFrom ? '' : adminTotpSecret,
            AXIIA_PRIVATE_OUT: privateOut,
            AXIIA_PUBLIC_OUT: publicOut,
            AXIIA_A6_QUOTA_RESUME_FROM: resumeFrom ?? '',
          },
        })
        stdout = result.stdout
      } catch {
        ok = false
      } // Never let child output or credential-bearing args enter failure reports.
      expect((await stat(privateOut)).mode & 0o077).toBe(0)
      expect((await stat(publicOut)).mode & 0o077).toBe(0)
      const records = (await readFile(privateOut, 'utf8')).trim().split('\n')
        .map((line) => JSON.parse(line))
      const checkpoint = records.at(-1) as A6QuotaCheckpoint
      const publicText = await readFile(publicOut, 'utf8')
      const manifest = JSON.parse(publicText) as A6QuotaManifest
      for (
        const secret of [
          adminEmail,
          adminPassword,
          adminTotpSecret!,
          checkpoint.bundle.actor.email,
          checkpoint.bundle.actor.password,
          checkpoint.bundle.registrationCode,
        ]
      ) {
        expect(
          Boolean(secret) &&
            (publicText.includes(secret) || stdout.includes(secret)),
          'public output excludes private credentials and account identifiers',
        ).toBe(false)
      }
      // Account IDs may be short decimal strings also present in timestamps or
      // match IDs. Their field must be absent; a substring test would be false evidence.
      expect(publicText).not.toMatch(/"accountID"\s*:/i)
      return { ok, manifest, checkpoint, privateOut }
    }

    const interrupted = await prepare('interrupted')
    expect(
      interrupted.ok,
      `interrupted CLI state=${interrupted.manifest.state}; recorded=${interrupted.manifest.attempts.length}`,
    ).toBe(false)
    expect(interrupted.manifest.state).toBe('partial')
    expect(interrupted.manifest.attempts).toHaveLength(1)
    const accepted = interrupted.manifest.attempts[0]
    expect(accepted.state).toBe('accepted')
    expect(accepted.matchID).toBeGreaterThan(0)
    expect(interrupted.manifest.testModeFixtures).toBeUndefined()
    const beforeResume = proxy.calls.length
    proxy.resumeForwarding()
    const prepared = await prepare('resumed', interrupted.privateOut)
    expect(
      prepared.ok,
      `redacted fixture status: ${prepared.manifest.state}/${
        prepared.manifest.failure ?? 'no failure'
      }`,
    ).toBe(true)
    expect(prepared.manifest.state).toBe('ready')
    expect(prepared.manifest.attempts).toHaveLength(20)
    const ids = prepared.manifest.attempts.map((attempt) => attempt.matchID!)
    expect(new Set(ids).size).toBe(20)
    expect(ids[0]).toBe(accepted.matchID)
    expect(
      prepared.manifest.attempts.every((attempt) =>
        attempt.state === 'terminal'
      ),
    ).toBe(true)
    const resumedCalls = proxy.calls.slice(beforeResume)
    expect(
      resumedCalls.findIndex((call) =>
        call.path === `/v1/matches/${accepted.matchID}`
      ),
    ).toBeLessThan(
      resumedCalls.findIndex((call) =>
        call.method === 'POST' && call.path === '/v1/matches/pvp'
      ),
    )
    expect(
      proxy.calls.filter((call) =>
        call.method === 'POST' && call.path === '/v1/matches/pvp'
      ),
    ).toHaveLength(20)
    expect(
      proxy.calls.filter((call) =>
        call.method === 'POST' && call.path === '/v1/auth/signup'
      ),
    ).toHaveLength(1)
    expect(prepared.manifest.latest?.usage).toEqual({
      battlesToday: 20,
      pvpBattlesToday: 0,
    })
    expect(prepared.manifest.probe).toEqual({
      state: 'rejected',
      status: 429,
      reason: 'daily_limit',
    })
    expect(prepared.manifest.verification?.expectedCopy).toBe(
      '今日次数已用完（20/20），明天再来',
    )
    const rechecked = await prepare('ready-recheck', prepared.privateOut)
    expect(rechecked.ok).toBe(true)
    expect(rechecked.manifest.verification?.unchangedMatchIDs).toEqual(
      ids.sort((a, b) => a - b),
    )
    expect(
      proxy.calls.filter((call) =>
        call.method === 'POST' && call.path === '/v1/matches/pvp'
      ),
    ).toHaveLength(20)

    const context = await browser.newContext()
    try {
      const actor = prepared.checkpoint.bundle.actor
      const login = await context.request.post('/v1/auth/login', {
        headers: sameOrigin,
        data: actor,
      })
      expect(login.ok()).toBe(true)
      expect(
        (await login.json()).account.id ===
          prepared.checkpoint.bundle.accountID,
      ).toBe(true)
      const bindings = prepared.manifest.bindings!
      const inventory = await (await context.request.get('/v1/my/agents'))
        .json()
      const own = inventory.scenarios.find((s: { scenarioID: string }) =>
        s.scenarioID === scenarioID
      )
      expect(own.sides.a).toHaveLength(1)
      expect(own.sides.b).toHaveLength(1)
      expect(own.sides.b[0].entryVersionID).toBe(bindings.b.versionID)
      expect(own.gateProgress.a.beaten).toBe(0)
      expect(own.gateProgress.b.beaten).toBe(0)
      const before = await state(context.request)
      const allowedPosts: string[] = []
      const blockedWrites: string[] = []
      await context.route('**/v1/**', async (route) => {
        const req = route.request()
        const path = new URL(req.url()).pathname
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
          return await route.continue()
        }
        if (
          req.method() === 'POST' && path === '/v1/matches/pvp' &&
          allowedPosts.length === 0 &&
          JSON.stringify(req.postDataJSON()) ===
            JSON.stringify({
              versionID: bindings.a.versionID,
              opponentAgentID: bindings.b.agentID,
            })
        ) {
          allowedPosts.push(path)
          return await route.continue()
        }
        blockedWrites.push(`${req.method()} ${path}`)
        await route.abort()
      })
      const page = await context.newPage()
      const { panel } = await openBattlePanel(page, bindings.a.agentID)
      await panel.getByRole('tab', { name: '左右手互搏', exact: true })
        .click({ timeout: 10_000 })
      await expect(panel.locator('[data-tm="OS.hotseat-opponent-label"]'))
        .toContainText(`#${bindings.b.agentID}`)
      const dispatch = panel.getByRole('button', {
        name: '自打一场',
        exact: true,
      })
      await expect(dispatch).toBeEnabled()
      const rejection = page.waitForResponse((response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/v1/matches/pvp'
      )
      await dispatch.click()
      const response = await rejection
      expect(response.status()).toBe(429)
      expect((await response.json()).error).toBe('daily_limit')
      await expect(
        panel.getByText('今日次数已用完（20/20），明天再来', { exact: true }),
      ).toBeVisible()
      await expect(dispatch).toBeEnabled()
      expect(allowedPosts).toHaveLength(1)
      expect(blockedWrites).toEqual([])
      expect(await state(context.request)).toEqual(before)
    } finally {
      await context.close()
    }
  } finally {
    await proxy.close()
    await rm(directory, { recursive: true, force: true })
  }
})
