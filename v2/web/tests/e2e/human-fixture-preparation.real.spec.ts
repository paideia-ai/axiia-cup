import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { expect, test } from '@playwright/test'

import { baseURL, sameOrigin } from './helpers'

const run = promisify(execFile)
const local = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(baseURL)

test.use({ screenshot: 'off', trace: 'off', video: 'off' })
test.skip(
  !local || process.env.AXIIA_E2E_ISOLATED !== '1',
  'Fixture preparation mutates isolated local test accounts only',
)

test('A3 registration and replaceable A6 batches preserve the promised states', async ({ browser, request }) => {
  test.setTimeout(240_000)
  const directory = await mkdtemp(join(tmpdir(), 'axiia-human-fixtures-'))
  const a3File = join(directory, 'a3-private.json')
  const a6File = join(directory, 'a6-private.json')
  const a6Public = join(directory, 'a6-public.json')
  try {
    await run('deno', [
      'run',
      '-A',
      '--no-config',
      'e2e/prepare-a3-registration.ts',
      '--apply',
    ], {
      cwd: resolve('.'),
      env: { ...process.env, AXIIA_PRIVATE_OUT: a3File },
    })
    expect((await stat(a3File)).mode & 0o077).toBe(0)
    const a3 = JSON.parse(await readFile(a3File, 'utf8'))
    expect(a3.state).toBe('ready')
    expect(a3.accountCreated).toBe(false)
    const before = await request.post('/v1/auth/login', {
      headers: sameOrigin,
      data: {
        email: a3.registration.email,
        password: a3.registration.password,
      },
    })
    expect(
      before.status(),
      'A3 account must remain unregistered until the reviewer starts',
    ).toBe(401)

    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      await page.goto(
        '/register?tm=1&tmJourney=HV-A3-FIRST-BATTLE&tmStep=HV-A3-FIRST-BATTLE-S01',
      )
      const panel = page.getByRole('tabpanel')
      await panel.getByLabel('注册码').fill(a3.registration.code)
      await panel.getByLabel('昵称').fill('A3 自动验证专用')
      await panel.getByLabel('邮箱').fill(a3.registration.email)
      await panel.getByLabel('密码').fill(a3.registration.password)
      await panel.getByRole('button', { name: '创建账户' }).click()
      await expect(page).toHaveURL(/\/express/)
      await expect(page.getByRole('navigation', { name: '测试模式' }))
        .toBeVisible()
      const me = await context.request.get('/v1/auth/me')
      expect(me.ok()).toBe(true)
    } finally {
      await context.close()
    }

    const result = await run('deno', [
      'run',
      '-A',
      '--no-config',
      'e2e/provision-a6-human.ts',
      '--apply',
    ], {
      cwd: resolve('.'),
      env: {
        ...process.env,
        AXIIA_PRIVATE_OUT: a6File,
        AXIIA_PUBLIC_OUT: a6Public,
        AXIIA_A6_PRIMARY_SCENARIO: 'shangyang-court',
        AXIIA_A6_OTHER_SCENARIO: 'honnoji-decision',
      },
    })
    expect(JSON.parse(result.stdout).ok).toBe(true)
    expect((await stat(a6File)).mode & 0o077).toBe(0)
    const a6 = JSON.parse(await readFile(a6File, 'utf8'))
    const publicText = await readFile(a6Public, 'utf8')
    expect(JSON.parse(publicText).environment).toBe('isolated-local')
    expect(a6.state).toBe('ready')
    expect(a6.resetSemantics).toEqual({
      inPlaceReset: false,
      rerunCreatesFreshBatch: true,
    })
    expect(a6.roles).toHaveLength(3)
    const originalAgentIDs = new Map<string, number[]>()
    const agentIDs = (
      scenarios: Array<{
        sides: { a: Array<{ agentID: number }>; b: Array<{ agentID: number }> }
      }>,
    ) =>
      scenarios.flatMap(({ sides }) =>
        [...sides.a, ...sides.b].map(({ agentID }) => agentID)
      ).sort((a, b) => a - b)
    for (const role of a6.roles) {
      if (
        publicText.includes(role.email) || publicText.includes(role.password)
      ) {
        throw new Error('public fixture manifest leaked credentials')
      }
      const context = await browser.newContext()
      try {
        const login = await context.request.post('/v1/auth/login', {
          headers: sameOrigin,
          data: { email: role.email, password: role.password },
        })
        expect(login.ok(), `${role.id} login`).toBe(true)
        const config = await (await context.request.get('/v1/config')).json()
        expect(config.usage).toEqual({ battlesToday: 0, pvpBattlesToday: 0 })
        const { scenarios } = await (await context.request.get('/v1/my/agents'))
          .json()
        originalAgentIDs.set(role.accountID, agentIDs(scenarios))
        const primary = scenarios.find((item: { scenarioID: string }) =>
          item.scenarioID === 'shangyang-court'
        )
        expect(primary.gateProgress.a.beaten).toBe(0)
        expect(primary.gateProgress.b.beaten).toBe(0)
        expect(primary.sides.a).toHaveLength(1)
        expect(primary.sides.b).toHaveLength(
          role.id === 'a6-creation-actor' ? 0 : 1,
        )
        if (role.id === 'a6-gate-actor') {
          const other = scenarios.find((item: { scenarioID: string }) =>
            item.scenarioID === 'honnoji-decision'
          )
          expect(other.sides.a).toHaveLength(1)
          expect(other.sides.b).toHaveLength(1)
          expect(other.gateProgress.a.beaten).toBe(0)
          expect(other.gateProgress.b.beaten).toBe(0)
        }
      } finally {
        await context.close()
      }
    }

    const replacementFile = join(directory, 'a6-replacement-private.json')
    await run('deno', [
      'run',
      '-A',
      '--no-config',
      'e2e/provision-a6-human.ts',
      '--apply',
    ], {
      cwd: resolve('.'),
      env: {
        ...process.env,
        AXIIA_PRIVATE_OUT: replacementFile,
        AXIIA_PUBLIC_OUT: join(directory, 'a6-replacement-public.json'),
        AXIIA_A6_PRIMARY_SCENARIO: 'shangyang-court',
        AXIIA_A6_OTHER_SCENARIO: 'honnoji-decision',
      },
    })
    const replacement = JSON.parse(await readFile(replacementFile, 'utf8'))
    expect(replacement.state).toBe('ready')
    expect(replacement.roles).toHaveLength(3)
    const originalAccounts = new Set(
      a6.roles.map((role: { accountID: string }) => role.accountID),
    )
    expect(
      replacement.roles.every((role: { accountID: string }) =>
        role.accountID && !originalAccounts.has(role.accountID)
      ),
    ).toBe(true)
    const original = a6.roles[0]
    const retained = await browser.newContext()
    try {
      const login = await retained.request.post('/v1/auth/login', {
        headers: sameOrigin,
        data: { email: original.email, password: original.password },
      })
      expect(login.ok()).toBe(true)
      expect((await login.json()).account.id).toBe(original.accountID)
      const config = await (await retained.request.get('/v1/config')).json()
      expect(config.usage).toEqual({ battlesToday: 0, pvpBattlesToday: 0 })
      const { scenarios } = await (await retained.request.get('/v1/my/agents'))
        .json()
      expect(agentIDs(scenarios)).toEqual(
        originalAgentIDs.get(original.accountID),
      )
      const primary = scenarios.find((item: { scenarioID: string }) =>
        item.scenarioID === 'shangyang-court'
      )
      expect(primary.sides.a).toHaveLength(1)
      expect(primary.sides.b).toHaveLength(1)
      expect(primary.gateProgress.a.beaten).toBe(0)
      expect(primary.gateProgress.b.beaten).toBe(0)
    } finally {
      await retained.close()
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
