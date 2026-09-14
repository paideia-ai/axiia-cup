import assert from 'node:assert/strict'

import { adminSession, HttpError, totp } from './http.ts'

const secret = 'JBSWY3DPEHPK3PXP'
const baseURL = 'http://127.0.0.1:12345'

async function withFakeClock(
  respond: (
    url: string,
    init: RequestInit | undefined,
  ) => Response | Promise<Response>,
  run: (clock: { now: () => number; waits: number[] }) => Promise<void>,
) {
  const originalFetch = globalThis.fetch
  const originalNow = Date.now
  const timeoutDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'setTimeout',
  )!
  let now = 1_800_000
  const waits: number[] = []
  Date.now = () => now
  globalThis.fetch = (input, init) =>
    Promise.resolve(respond(String(input), init))
  Object.defineProperty(globalThis, 'setTimeout', {
    configurable: true,
    value: (callback: () => void, delay: number) => {
      waits.push(delay)
      now += delay
      queueMicrotask(callback)
      return waits.length
    },
  })
  try {
    await run({ now: () => now, waits })
  } finally {
    globalThis.fetch = originalFetch
    Date.now = originalNow
    Object.defineProperty(globalThis, 'setTimeout', timeoutDescriptor)
  }
}

function json(status: number, headers?: HeadersInit): Response {
  return new Response('{}', { status, headers })
}

Deno.test('consecutive fixture sessions survive TOTP replay and the server five-attempt throttle', async () => {
  let windowStart = 0
  let attempts = 0
  let lastCounter = -1
  let logins = 0
  const statuses: number[] = []
  const cookies: string[] = []
  await withFakeClock(async (url, init) => {
    if (url.endsWith('/v1/auth/login')) {
      logins += 1
      return json(200, {
        'Set-Cookie': `axiia_session=session-${logins}; Path=/`,
      })
    }
    if (url.endsWith('/probe')) {
      cookies.push(new Headers(init?.headers).get('Cookie') ?? '')
      return json(200)
    }
    assert.equal(url, `${baseURL}/v1/auth/elevate`)
    const now = Math.floor(Date.now() / 1000)
    if (now - windowStart >= 60) {
      windowStart = now
      attempts = 0
    }
    attempts += 1
    if (attempts > 5) {
      statuses.push(429)
      return json(429)
    }
    const { code } = JSON.parse(String(init?.body))
    for (const at of [now - 30, now, now + 30]) {
      const counter = Math.floor(at / 30)
      if (code === await totp(secret, at) && counter > lastCounter) {
        lastCounter = counter
        statuses.push(200)
        return json(200)
      }
    }
    statuses.push(401)
    return json(401)
  }, async ({ waits }) => {
    // This is the real sequence: seed-dev, A3 preparation, A6 preparation.
    for (let i = 0; i < 3; i += 1) {
      const session = await adminSession(baseURL, 'admin', 'password', secret)
      await session.call('GET', '/probe')
    }
    assert.equal(logins, 3)
    assert.deepEqual(cookies, [
      'axiia_session=session-1',
      'axiia_session=session-2',
      'axiia_session=session-3',
    ])
    assert.deepEqual(statuses, [200, 401, 200, 401, 401, 429, 200])
    assert.deepEqual(waits, [31_000, 60_000])
  })
})

Deno.test('persistent elevation throttling stops after two minutes without another request', async () => {
  let attempts = 0
  await withFakeClock((url) => {
    if (url.endsWith('/v1/auth/login')) return json(200)
    attempts += 1
    return json(429)
  }, async ({ now, waits }) => {
    const start = now()
    await assert.rejects(
      adminSession(baseURL, 'admin', 'password', secret),
      /admin elevation failed/,
    )
    assert.equal(now() - start, 120_000)
    assert.equal(attempts, 2)
    assert.deepEqual(waits, [60_000, 60_000])
  })
})

Deno.test('invalid login and nonretryable elevation failures fail immediately', async () => {
  for (const failure of ['login', 'elevation'] as const) {
    let attempts = 0
    await withFakeClock((url) => {
      attempts += 1
      if (url.endsWith('/v1/auth/login')) {
        return json(failure === 'login' ? 401 : 200)
      }
      return json(403)
    }, async ({ waits }) => {
      await assert.rejects(
        adminSession(baseURL, 'admin', 'password', secret),
        (error: unknown) =>
          error instanceof HttpError &&
          error.status === (failure === 'login' ? 401 : 403),
      )
      assert.equal(attempts, failure === 'login' ? 1 : 2)
      assert.deepEqual(waits, [])
    })
  }
})
