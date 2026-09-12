import assert from 'node:assert/strict'
import { QuotaHTTPError, type QuotaManifest } from './a5-quota-preparation.ts'
import {
  createQuotaJournal,
  type QuotaEnvironment,
  QuotaSession,
  validateQuotaCLI,
} from './prepare-a5-quota.ts'

function config(directory = '/tmp/a5-offline'): QuotaEnvironment {
  return {
    baseURL: 'http://127.0.0.1:8080',
    scenarioID: 'shangyang-court',
    initiator: {
      email: 'hv-a5-quota-invitee-offline@axiia.test',
      password: 'private-initiator-value',
    },
    rival: {
      email: 'hv-a5-rich-challenger-offline@axiia.test',
      password: 'private-rival-value',
    },
    maxMatches: 5,
    matchTimeoutSeconds: 60,
    privateOut: `${directory}/private.jsonl`,
    publicOut: `${directory}/public.json`,
  }
}

function manifest(): QuotaManifest {
  return {
    schemaVersion: 1,
    fixture: 'a5-quota-invitee',
    state: 'partial',
    realMatches: true,
    baseURL: 'http://127.0.0.1:8080',
    scenarioID: 'shangyang-court',
    startedAt: '2026-09-12T12:00:00.000Z',
    expiresAt: '2026-09-12T16:00:00.000Z',
    resumedMatchIDs: [],
    attempts: [{ state: 'accepted', matchID: 123 }],
  }
}

Deno.test('A5 CLI requires explicit apply, dedicated roles, bounded cost and new regular paths', () => {
  for (const args of [[], ['--dry-run'], ['--apply', '--apply']]) {
    assert.throws(() => validateQuotaCLI(args, config()), /apply/)
  }
  for (
    const patch of [
      { baseURL: 'https://unreviewed.invalid' },
      { maxMatches: NaN },
      { maxMatches: 11 },
      { maxMatches: -1 },
      { matchTimeoutSeconds: 1801 },
      { privateOut: 'relative.json' },
      { privateOut: '/tmp/../dev/null' },
      { privateOut: '/dev/null' },
      { publicOut: config().privateOut },
      { initiator: config().rival },
      {
        initiator: {
          email: 'hv-a5-quota-invitee-offline@axiiaXtest',
          password: 'value',
        },
      },
    ]
  ) {
    assert.throws(() =>
      validateQuotaCLI(['--apply'], { ...config(), ...patch })
    )
  }
  assert.equal(validateQuotaCLI(['--apply'], config()).maxMatches, 5)
})

Deno.test('A5 HTTP uses same-origin cookie jar, bounded requests, no redirects or retries, and sanitized errors', async () => {
  const requests: Array<{ input: string; init: RequestInit }> = []
  const session = new QuotaSession(
    config().baseURL,
    ((input, init) => {
      requests.push({ input: String(input), init: init! })
      return Promise.resolve(
        requests.length === 1
          ? new Response('{}', {
            headers: {
              'Set-Cookie': 'axiia_session=private-session; HttpOnly; Path=/',
            },
          })
          : new Response(
            JSON.stringify({
              error: 'pvp_daily_limit',
              message: config().initiator.password,
            }),
            { status: 429 },
          ),
      )
    }) as typeof fetch,
  )
  await session.call('POST', '/v1/auth/login', config().initiator)
  await assert.rejects(
    session.call('POST', '/v1/challenges', {}),
    (error: unknown) => {
      assert.ok(error instanceof QuotaHTTPError)
      assert.equal(error.status, 429)
      assert.equal(error.errorCode, 'pvp_daily_limit')
      assert.ok(!String(error).includes(config().initiator.password))
      return true
    },
  )
  assert.equal(requests.length, 2)
  for (const { init } of requests) {
    assert.equal(init.redirect, 'error')
    assert.ok(init.signal instanceof AbortSignal)
    assert.equal(new Headers(init.headers).get('Sec-Fetch-Site'), 'same-origin')
  }
  assert.equal(
    new Headers(requests[1].init.headers).get('Cookie'),
    'axiia_session=private-session',
  )
  await assert.rejects(
    session.call('GET', 'https://elsewhere.invalid'),
    /unsupported-api-path/,
  )
  assert.equal(requests.length, 2)
})

Deno.test('A5 HTTP ambiguous transport outcome is never retried', async () => {
  let calls = 0
  const session = new QuotaSession(
    config().baseURL,
    (() => {
      calls++
      return Promise.reject(new Error('transport interrupted'))
    }) as typeof fetch,
  )
  await assert.rejects(session.call('POST', '/v1/matches/pvp', {}))
  assert.equal(calls, 1)
})

Deno.test('A5 journal durably retains every checkpoint privately and only publishes redacted state', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'a5-journal-offline-' })
  const settings = config(directory)
  const journal = await createQuotaJournal(settings)
  try {
    const first = manifest()
    await journal.checkpoint(first)
    const second = { ...first, failure: 'match-poll-timeout' }
    await journal.checkpoint(second)
    const records = (await Deno.readTextFile(settings.privateOut)).trim().split(
      '\n',
    ).map((line) => JSON.parse(line))
    assert.equal(records.length, 3)
    assert.equal(
      records[0].request.initiator.password,
      settings.initiator.password,
    )
    assert.deepEqual(records[1].manifest, first)
    assert.deepEqual(records[2].manifest, second)
    const publicText = await Deno.readTextFile(settings.publicOut)
    assert.deepEqual(JSON.parse(publicText), second)
    for (
      const value of [
        settings.initiator.email,
        settings.initiator.password,
        settings.rival.email,
        settings.rival.password,
      ]
    ) {
      assert.ok(!publicText.includes(value))
    }
    assert.equal((await Deno.stat(settings.privateOut)).mode! & 0o777, 0o600)
    await assert.rejects(createQuotaJournal(settings), /cannot-create-new/)
    await assert.rejects(
      journal.checkpoint({ ...first, failure: settings.initiator.password }),
    )
    assert.equal(
      (await Deno.readTextFile(settings.privateOut)).trim().split('\n').length,
      3,
    )
  } finally {
    journal.close()
    await Deno.remove(directory, { recursive: true })
  }
})

Deno.test('A5 journal refuses replaced paths without touching replacement or publishing progress', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'a5-journal-offline-' })
  const settings = config(directory)
  const journal = await createQuotaJournal(settings)
  try {
    await journal.checkpoint(manifest())
    await Deno.rename(settings.privateOut, `${directory}/original.jsonl`)
    await Deno.writeTextFile(settings.privateOut, 'untouched replacement', {
      mode: 0o600,
    })
    await assert.rejects(
      journal.checkpoint({ ...manifest(), state: 'ready' }),
      /output-file-replaced/,
    )
    assert.equal(
      await Deno.readTextFile(settings.privateOut),
      'untouched replacement',
    )
    assert.equal(
      JSON.parse(await Deno.readTextFile(settings.publicOut)).state,
      'partial',
    )
  } finally {
    journal.close()
    await Deno.remove(directory, { recursive: true })
  }
})
