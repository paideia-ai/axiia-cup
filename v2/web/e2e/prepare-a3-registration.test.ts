import {
  a3FallbackPresetSnapshot,
  a3PresetSnapshot,
  createPrivateBundle,
  createRegistrationBundle,
  isHelpRequest,
  type PreparationEnvironment,
  type PreparationOperations,
  prepareA3Registration,
  privateDocument,
  type PrivateFileIO,
  redactedSuccess,
  reviewedBaseURL,
  rewritePrivateBundle,
  validatePreparationRequest,
} from './prepare-a3-registration.ts'

function assert(
  condition: unknown,
  message = 'assertion failed',
): asserts condition {
  if (!condition) throw new Error(message)
}

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    )
  }
}

function assertDeepEqual(actual: unknown, expected: unknown) {
  const encodedActual = JSON.stringify(actual)
  const encodedExpected = JSON.stringify(expected)
  if (encodedActual !== encodedExpected) {
    throw new Error(`expected ${encodedExpected}, got ${encodedActual}`)
  }
}

function assertMatch(value: string, pattern: RegExp) {
  assert(
    pattern.test(value),
    `${JSON.stringify(value)} did not match ${pattern}`,
  )
}

function assertDoesNotMatch(value: string, pattern: RegExp) {
  assert(
    !pattern.test(value),
    `${JSON.stringify(value)} unexpectedly matched ${pattern}`,
  )
}

function assertThrows(action: () => unknown, pattern: RegExp) {
  try {
    action()
  } catch (error) {
    assert(
      error instanceof Error && pattern.test(error.message),
      `thrown error did not match ${pattern}`,
    )
    return
  }
  throw new Error(`expected function to throw ${pattern}`)
}

async function assertRejects(action: () => Promise<unknown>, pattern: RegExp) {
  try {
    await action()
  } catch (error) {
    assert(
      error instanceof Error && pattern.test(error.message),
      `rejection did not match ${pattern}`,
    )
    return
  }
  throw new Error(`expected promise to reject ${pattern}`)
}

const validEnvironment: PreparationEnvironment = {
  baseURL: reviewedBaseURL,
  adminEmail: 'admin@example.test',
  adminPassword: 'private-admin-password',
  adminTotpSecret: 'PRIVATE-TOTP-SECRET',
  privateOut: '/tmp/private-a3-registration.json',
}

Deno.test('help is recognized without requiring apply or environment', () => {
  assertEqual(isHelpRequest(['--help']), true)
  assertEqual(isHelpRequest(['--apply', '-h']), true)
  assertEqual(isHelpRequest([]), false)
})

Deno.test('apply validation requires every shared-beta safety gate', () => {
  assertDeepEqual(
    validatePreparationRequest(['--apply'], validEnvironment),
    validEnvironment,
  )
  assertThrows(
    () => validatePreparationRequest([], validEnvironment),
    /exactly one --apply/,
  )
  assertThrows(
    () =>
      validatePreparationRequest(['--apply'], {
        ...validEnvironment,
        baseURL: 'https://example.test',
      }),
    /reviewed beta or a local server/,
  )
  assertEqual(
    validatePreparationRequest(['--apply'], {
      ...validEnvironment,
      baseURL: 'http://127.0.0.1:3001',
    }).baseURL,
    'http://127.0.0.1:3001',
  )
  assertThrows(
    () =>
      validatePreparationRequest(['--apply'], {
        ...validEnvironment,
        privateOut: '',
      }),
    /private output path/,
  )
  assertThrows(
    () =>
      validatePreparationRequest(['--apply'], {
        ...validEnvironment,
        privateOut: 'relative.json',
      }),
    /absolute private file path/,
  )
  assertThrows(
    () =>
      validatePreparationRequest(['--apply'], {
        ...validEnvironment,
        privateOut: '/dev/stdout',
      }),
    /regular private file/,
  )
})

Deno.test('bundle is a fresh registration identity, not an account', () => {
  let fill = 0
  const deterministicBytes = (size: number) => {
    const result = new Uint8Array(size)
    for (let index = 0; index < size; index++) result[index] = fill++
    return result
  }
  const bundle = createRegistrationBundle(
    reviewedBaseURL,
    new Date('2026-09-09T12:34:56.000Z'),
    deterministicBytes,
  )

  assertEqual(bundle.accountCreated, false)
  assertEqual(bundle.registration.uses, 1)
  assertMatch(bundle.registration.code, /^HV-A3-[0-9a-f]{32}$/)
  assertMatch(
    bundle.registration.email,
    /^hv-a3-first-battle-20260909123456-[0-9a-f]{12}@axiia\.test$/,
  )
  assertMatch(bundle.registration.password, /^Hv![0-9a-f]{36}$/)
  assertEqual(bundle.a3Preset, null)
  assertEqual(
    privateDocument(bundle, 'prepared-locally').registrationCodeCreated,
    false,
  )
  assertEqual(privateDocument(bundle, 'ready').registrationCodeCreated, true)
})

Deno.test('config snapshot records the test-day player-side novice triple', () => {
  const snapshot = a3PresetSnapshot(
    {
      expressPreset: {
        scenarioID: 'shangyang-court',
        side: 'b',
        presetKey: 'ganlong-easy',
      },
    },
    new Date('2026-09-09T13:14:15.000Z'),
  )
  assertDeepEqual(snapshot, {
    source: 'GET /v1/config',
    fetchedAt: '2026-09-09T13:14:15.000Z',
    scenarioID: 'shangyang-court',
    playerSide: 'a',
    opponentSide: 'b',
    opponentPresetKey: 'ganlong-easy',
  })
  assertThrows(
    () => a3PresetSnapshot({ expressPreset: null }),
    /did not resolve a valid expressPreset/,
  )
})

Deno.test('A3 snapshot follows the live web fallback when config omits expressPreset', () => {
  const snapshot = a3FallbackPresetSnapshot(
    {
      summary: { id: 'shangyang-court' },
      presets: [
        { key: 'a-first', side: 'a' },
        { key: 'b-easy', side: 'b' },
        { key: 'b-next', side: 'b' },
      ],
    },
    new Date('2026-09-09T13:14:15.000Z'),
  )
  assertDeepEqual(snapshot, {
    source: 'GET /v1/config + web fallback',
    fetchedAt: '2026-09-09T13:14:15.000Z',
    scenarioID: 'shangyang-court',
    playerSide: 'a',
    opponentSide: 'b',
    opponentPresetKey: 'b-easy',
  })
  assertThrows(
    () =>
      a3FallbackPresetSnapshot({
        summary: { id: 'shangyang-court' },
        presets: [{ key: 'a-only', side: 'a' }],
      }),
    /no opponent-side preset/,
  )
})

Deno.test('private bundle creation refuses overwrite and rewrites stay mode 0600', async () => {
  const bundle = createRegistrationBundle(
    reviewedBaseURL,
    new Date('2026-09-09T12:34:56.000Z'),
    (size) => new Uint8Array(size),
  )
  const events: string[] = []
  const fileIO: PrivateFileIO = {
    createNewTextFile(_path, value, mode) {
      events.push(`create:${mode.toString(8)}:${JSON.parse(value).state}`)
      return Promise.resolve()
    },
    lstat() {
      events.push('lstat')
      return Promise.resolve({ isFile: true, isSymlink: false })
    },
    chmod(_path, mode) {
      events.push(`chmod:${mode.toString(8)}`)
      return Promise.resolve()
    },
    writeTextFile(_path, value) {
      events.push(`rewrite:${JSON.parse(value).state}`)
      return Promise.resolve()
    },
  }

  await createPrivateBundle(
    '/private/a3.json',
    bundle,
    'prepared-locally',
    fileIO,
  )
  await rewritePrivateBundle('/private/a3.json', bundle, 'ready', fileIO)
  assertDeepEqual(events, [
    'create:600:prepared-locally',
    'chmod:600',
    'lstat',
    'chmod:600',
    'rewrite:ready',
    'chmod:600',
  ])

  await assertRejects(
    () =>
      createPrivateBundle(
        '/private/existing.json',
        bundle,
        'prepared-locally',
        {
          ...fileIO,
          createNewTextFile() {
            throw new Deno.errors.AlreadyExists('occupied')
          },
        },
      ),
    /already exists; choose a unique path/,
  )
})

Deno.test('orchestration resolves the web fallback before one-use code creation', async () => {
  const events: string[] = []
  const calls: Array<{ method: string; path: string; body?: unknown }> = []
  let randomFill = 0
  const operations: PreparationOperations = {
    now: () => new Date('2026-09-09T13:14:15.000Z'),
    randomBytes(size) {
      const result = new Uint8Array(size)
      for (let index = 0; index < size; index++) result[index] = randomFill++
      return result
    },
    createPrivate(_path, bundle, state) {
      events.push(`create:${state}:${bundle.a3Preset?.scenarioID ?? 'none'}`)
      return Promise.resolve()
    },
    rewritePrivate(_path, bundle, state) {
      events.push(`rewrite:${state}:${bundle.a3Preset?.scenarioID ?? 'none'}`)
      return Promise.resolve()
    },
    openAdmin() {
      events.push('open-admin')
      return Promise.resolve({
        call<T>(method: string, path: string, body?: unknown) {
          calls.push({ method, path, body })
          events.push(`${method}:${path}`)
          if (method === 'GET' && path === '/v1/config') {
            return Promise.resolve({ expressPreset: null } as T)
          }
          if (
            method === 'GET' &&
            path === '/v1/scenarios/shangyang-court?side=a'
          ) {
            return Promise.resolve({
              summary: { id: 'shangyang-court' },
              presets: [
                { key: 'a-first', side: 'a' },
                { key: 'ganlong-easy', side: 'b' },
              ],
            } as T)
          }
          return Promise.resolve({} as T)
        },
      })
    },
  }

  const result = await prepareA3Registration(validEnvironment, operations)
  assertDeepEqual(events, [
    'create:prepared-locally:none',
    'open-admin',
    'GET:/v1/config',
    'GET:/v1/scenarios/shangyang-court?side=a',
    'rewrite:prepared-locally:shangyang-court',
    'POST:/v1/admin/registration-codes',
    'rewrite:ready:shangyang-court',
  ])
  assertEqual(calls.length, 3)
  assertDeepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: 'GET', path: '/v1/config' },
    { method: 'GET', path: '/v1/scenarios/shangyang-court?side=a' },
    { method: 'POST', path: '/v1/admin/registration-codes' },
  ])
  assertDeepEqual(calls[2].body, {
    code: result.bundle.registration.code,
    uses: 1,
  })
  assertEqual(result.preset.source, 'GET /v1/config + web fallback')
  assertEqual(result.bundle.accountCreated, false)
})

Deno.test('stdout success object contains no bundle secret or reconstructable batch', () => {
  const preset = a3PresetSnapshot({
    expressPreset: {
      scenarioID: 'shangyang-court',
      side: 'b',
      presetKey: 'ganlong-easy',
    },
  })
  assertDeepEqual(Object.keys(redactedSuccess(preset)).sort(), [
    'a3Preset',
    'accountCreated',
    'ok',
    'privateOutputWritten',
    'registrationCodeCreated',
    'role',
    'testModeFixtures',
  ])
  const output = JSON.stringify(redactedSuccess(preset))
  assertDoesNotMatch(output, /email|password|code\":|batch/i)
  assertMatch(output, /"playerSide":"a"/)
  assertMatch(output, /"opponentPresetKey":"ganlong-easy"/)
  assertMatch(
    output,
    /"testModeFixtures":\{"a3Preset":"shangyang-court \/ player a \/ NPC ganlong-easy"\}/,
  )
})
