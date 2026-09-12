import {
  createEntryJournal,
  type EntryEnvironment,
  EntrySession,
  runEntryCLI,
  validateEntryCLI,
} from './prepare-a6-entry.ts'
import { type EntryBundle, type EntryManifest } from './a6-entry-preparation.ts'

function assert(value: unknown): asserts value {
  if (!value) throw new Error('assertion failed')
}
async function rejects(action: () => unknown | Promise<unknown>) {
  let failed = false
  try {
    await action()
  } catch {
    failed = true
  }
  assert(failed)
}

const environment: EntryEnvironment = {
  baseURL: 'http://127.0.0.1:1234',
  scenarioID: 'entry-test',
  adminEmail: 'admin@fixture.test',
  adminPassword: 'private-admin-password',
  adminTotpSecret: 'private-totp-secret',
  privateOut: '/tmp/entry-private.jsonl',
  publicOut: '/tmp/entry-public.json',
}

Deno.test('entry CLI requires exact apply, explicit scenario and new distinct regular paths', async () => {
  for (
    const args of [[], ['--apply', '--apply'], ['--force'], [
      '--apply',
      '--resume',
    ]]
  ) await rejects(() => validateEntryCLI(args, environment))
  for (
    const config of [
      { ...environment, scenarioID: '' },
      { ...environment, scenarioID: '../agent' },
      { ...environment, baseURL: 'https://unreviewed.invalid' },
      { ...environment, adminPassword: '' },
      { ...environment, privateOut: 'relative.jsonl' },
      { ...environment, publicOut: '/dev/stdout' },
      { ...environment, publicOut: '/tmp/../tmp/out' },
      { ...environment, publicOut: environment.privateOut },
    ]
  ) await rejects(() => validateEntryCLI(['--apply'], config))
  assert(validateEntryCLI(['--apply'], environment) === environment)
  await rejects(() => runEntryCLI([], environment))
})

Deno.test('entry transport forbids gameplay, draft edits, entry marks and redirects', async () => {
  let requests = 0
  const request: typeof fetch = (_input, init) => {
    requests++
    assert(init?.redirect === 'error')
    assert(init.signal instanceof AbortSignal)
    assert(new Headers(init.headers).get('Sec-Fetch-Site') === 'same-origin')
    return Promise.resolve(Response.json({ ok: true }))
  }
  const api = new EntrySession(environment.baseURL, request)
  for (
    const [method, path] of [
      ['POST', '/v1/matches/pve'],
      ['POST', '/v1/matches/pvp'],
      ['POST', '/v1/challenges'],
      ['POST', '/v1/agents/1/mutate'],
      ['POST', '/v1/agents/1/entry/2'],
      ['DELETE', '/v1/agents/1'],
      ['GET', 'https://unreviewed.invalid/v1/config'],
    ]
  ) await rejects(() => api.call(method, path))
  assert(requests === 0)
  await api.call('GET', '/v1/config')
  assert(Number(requests) === 1)
})

Deno.test('entry CLI accepts only an explicit private code or complete admin credentials', async () => {
  const supplied = {
    ...environment,
    adminEmail: '',
    adminPassword: '',
    adminTotpSecret: '',
    registrationCode: 'supplied-private-code',
  }
  assert(validateEntryCLI(['--apply'], supplied) === supplied)
  for (
    const registrationCode of [
      '',
      'short',
      ' leading-code',
      'trailing-code ',
      'code\nnewline',
      'code\u0000control',
      'code\u200bhidden',
      'x'.repeat(257),
    ]
  ) {
    await rejects(() =>
      validateEntryCLI(['--apply'], { ...supplied, registrationCode })
    )
  }
  for (
    const key of ['adminEmail', 'adminPassword', 'adminTotpSecret'] as const
  ) {
    await rejects(() =>
      validateEntryCLI(['--apply'], { ...supplied, [key]: environment[key] })
    )
  }
})

Deno.test('supplied-code signup transport errors never expose echoed code or raw request body', async () => {
  const code = 'private-supplied-signup-code'
  let calls = 0
  const api = new EntrySession(environment.baseURL, (_input, init) => {
    calls++
    assert(JSON.parse(String(init?.body)).code === code)
    return Promise.resolve(
      Response.json({ error: code, message: init?.body }, { status: 401 }),
    )
  })
  try {
    await api.call('POST', '/v1/auth/signup', {
      code,
      email: 'private@fixture.test',
      password: 'private-password',
    })
  } catch (error) {
    assert(error instanceof Error && error.message === 'entry-http-status-401')
    assert(!String(error).includes(code))
  }
  assert(calls === 1)
})

Deno.test('entry transport keeps isolated session/elevation cookies and redacts API errors', async () => {
  let count = 0
  const api = new EntrySession(environment.baseURL, (_input, init) => {
    const cookie = new Headers(init?.headers).get('Cookie')
    count++
    if (count === 1) {
      assert(cookie === null)
      return Promise.resolve(
        Response.json({}, {
          headers: { 'Set-Cookie': 'axiia_session=session-value; HttpOnly' },
        }),
      )
    }
    if (count === 2) {
      assert(cookie === 'axiia_session=session-value')
      return Promise.resolve(
        Response.json({}, {
          headers: { 'Set-Cookie': 'axiia_elevated=elevated-value; HttpOnly' },
        }),
      )
    }
    assert(
      cookie?.includes('axiia_session=session-value') &&
        cookie.includes('axiia_elevated=elevated-value'),
    )
    return Promise.resolve(
      Response.json({ message: 'secret-password-from-response' }, {
        status: 500,
      }),
    )
  })
  await api.call('POST', '/v1/auth/login', {})
  await api.call('POST', '/v1/auth/elevate', {})
  try {
    await api.call('GET', '/v1/config')
    throw new Error('expected failure')
  } catch (error) {
    assert(error instanceof Error && error.message === 'entry-http-status-500')
  }
  assert(count === 3)
})

const bundle: EntryBundle = {
  registrationCode: 'private-registration-code',
  roles: [{
    id: 'a6-entry',
    accountAlias: 'A6 人测·参赛版本切换',
    email: 'entry@fixture.test',
    password: 'private-player-password',
    agents: [],
  }],
}
const manifest: EntryManifest = {
  schemaVersion: 1,
  fixtureKind: 'a6-entry-first-save',
  state: 'preparing',
  environment: 'isolated-local',
  appBaseUrl: environment.baseURL,
  generation: {
    id: 'public-generation',
    inPlaceReset: false,
    rerunCreatesFreshGeneration: true,
  },
  preparedAt: '2026-09-12T20:00:00Z',
  scenarioID: 'entry-test',
  steps: ['HV-A6-ENTRY-QUOTA-S01', 'HV-A6-ENTRY-QUOTA-S02'],
  provenance: {
    sourceRevision: 'source',
    sourceSha256: 'hash',
    sourceCapturedAt: 'now',
  },
  fixtures: [],
  testModeFixtures: {},
}

Deno.test('entry journal reserves both paths, preserves partial records and rejects credential leaks', async () => {
  const directory = await Deno.makeTempDir()
  const config = {
    ...environment,
    privateOut: `${directory}/private.jsonl`,
    publicOut: `${directory}/public.json`,
  }
  try {
    const journal = await createEntryJournal(config)
    try {
      await journal.checkpoint(bundle, manifest)
      await journal.checkpoint(bundle, {
        ...manifest,
        state: 'partial',
        failure: 'simulated-interruption',
      })
      const records = (await Deno.readTextFile(config.privateOut)).trim().split(
        '\n',
      ).map((line) => JSON.parse(line))
      assert(records.length === 2 && records[1].manifest.state === 'partial')
      assert(records[0].bundle.roles[0].password === bundle.roles[0].password)
      const publicText = await Deno.readTextFile(config.publicOut)
      assert(JSON.parse(publicText).state === 'partial')
      assert(
        !publicText.includes(bundle.roles[0].email) &&
          !publicText.includes(bundle.roles[0].password),
      )
      for (const path of [config.privateOut, config.publicOut]) {
        assert(((await Deno.stat(path)).mode! & 0o077) === 0)
      }
      await rejects(() =>
        journal.checkpoint(bundle, {
          ...manifest,
          failure: bundle.roles[0].password,
        })
      )
      for (
        const registrationCode of [
          'private-"quoted-code',
          'private-\\escaped-code',
        ]
      ) {
        await rejects(() =>
          journal.checkpoint({ ...bundle, registrationCode }, {
            ...manifest,
            failure: `response echoed ${registrationCode}`,
          })
        )
      }
      assert(await Deno.readTextFile(config.publicOut) === publicText)
      await Deno.rename(config.publicOut, `${directory}/previous-public`)
      await Deno.writeTextFile(config.publicOut, 'replacement')
      await rejects(() => journal.checkpoint(bundle, manifest))
      assert(await Deno.readTextFile(config.publicOut) === 'replacement')
    } finally {
      journal.close()
    }
    await rejects(() => createEntryJournal(config))
    await Deno.symlink(config.privateOut, `${directory}/link`)
    await rejects(() =>
      createEntryJournal({ ...config, privateOut: `${directory}/link` })
    )
  } finally {
    await Deno.remove(directory, { recursive: true })
  }
})
