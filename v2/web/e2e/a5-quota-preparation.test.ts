import assert from 'node:assert/strict'
import {
  type A5QuotaRequest,
  type MatchSummary,
  prepareA5Quota,
  type QuotaAPI,
  type QuotaConfig,
  quotaExpiry,
  QuotaHTTPError,
  type QuotaManifest,
  type QuotaOperations,
  QuotaPreparationError,
  validateQuotaRequest,
} from './a5-quota-preparation.ts'

type Role = 'initiator' | 'rival'
type Call = { role: Role; method: string; path: string; body?: unknown }

function request(): A5QuotaRequest {
  return {
    baseURL: 'http://127.0.0.1:3001',
    scenarioID: 'shangyang-court',
    initiator: {
      email: 'hv-a5-quota-invitee-offline-20260912@axiia.test',
      password: 'offline-initiator-password',
    },
    rival: {
      email: 'hv-a5-rich-challenger-offline-20260912@axiia.test',
      password: 'offline-rival-password',
    },
    maxMatches: 5,
    matchTimeoutSeconds: 30,
  }
}

function config(battlesToday = 0, pvpBattlesToday = 0): QuotaConfig {
  return {
    dailyBattleLimit: 10,
    pvpDailyLimit: 5,
    concurrencyLimit: 3,
    pvpUnlockPerSideWins: 2,
    opponentDailyChallengeLimit: 3,
    trialsBlocked: false,
    usage: { battlesToday, pvpBattlesToday },
  }
}

function inventory(role: Role) {
  const offset = role === 'initiator' ? 0 : 100
  return {
    scenarios: [{
      scenarioID: 'shangyang-court',
      entryReady: true,
      gateProgress: {
        a: { beaten: 2, needed: 2 },
        b: { beaten: 2, needed: 2 },
      },
      sides: {
        a: [{
          agentID: 11 + offset,
          entryVersionID: 21 + offset,
          latestVersionID: 901 + offset,
        }],
        b: [{
          agentID: 12 + offset,
          entryVersionID: 22 + offset,
          latestVersionID: 902 + offset,
        }],
      },
    }],
  }
}

function match(
  id: number,
  overrides: Partial<MatchSummary> = {},
): MatchSummary {
  return {
    id,
    scenarioID: 'shangyang-court',
    kind: 'pvp',
    finished: false,
    scored: false,
    initiatorIsMe: true,
    ...overrides,
  }
}

function fixture() {
  const input = request()
  let clock = Date.parse('2026-09-12T08:00:00Z')
  const calls: Call[] = []
  const snapshots: QuotaManifest[] = []
  const configs = { initiator: config(), rival: config(2, 1) }
  const inventories = {
    initiator: inventory('initiator'),
    rival: inventory('rival'),
  }
  const identities = {
    initiator: {
      id: 'initiator-account',
      email: input.initiator.email,
      displayName: 'A5 人测·配额被约方',
      isAdmin: false,
    },
    rival: {
      id: 'rival-account',
      email: input.rival.email,
      displayName: 'A5 人测·完整发起方',
      isAdmin: false,
    },
  }
  const matches = new Map<number, MatchSummary>()
  const rivalMatches: MatchSummary[] = []
  const polls = new Map<number, number>()
  const controls = {
    beforeCall: (_call: Call): void => {},
    afterCheckpoint: (_manifest: QuotaManifest): void => {},
    afterSleep: (): void => {},
    dispatch: (id: number): unknown => ({ matchID: id }),
    probe: (): unknown => {
      throw new QuotaHTTPError(429, 'pvp_daily_limit')
    },
    poll: (current: MatchSummary, count: number): MatchSummary => ({
      ...current,
      finished: count >= 2,
      scored: count >= 2,
    }),
  }
  let nextID = 1001

  function api(role: Role): QuotaAPI {
    return {
      call<T>(method: string, path: string, body?: unknown): Promise<T> {
        const call = { role, method, path, body: structuredClone(body) }
        calls.push(call)
        controls.beforeCall(call)
        let result: unknown
        if (method === 'GET' && path === '/v1/auth/me') {
          result = { account: identities[role], elevated: false }
        } else if (method === 'GET' && path === '/v1/config') {
          result = configs[role]
        } else if (method === 'GET' && path === '/v1/my/agents') {
          result = inventories[role]
        } else if (
          method === 'GET' && path === '/v1/scenarios/shangyang-court'
        ) {
          result = { summary: { id: 'shangyang-court', gateUnlocked: true } }
        } else if (method === 'GET' && path === '/v1/matches') {
          result = {
            matches: role === 'initiator' ? [...matches.values()] : [
              ...rivalMatches,
              ...[...matches.values()].map((row) => ({
                ...row,
                initiatorIsMe: false,
                participants: {
                  a: { isMine: false },
                  b: { isMine: true },
                },
              })),
            ],
            open: true,
          }
        } else if (method === 'GET' && /^\/v1\/matches\/\d+$/.test(path)) {
          const id = Number(path.split('/').at(-1))
          const current = matches.get(id)
          assert.ok(current, `unknown match ${id}`)
          const count = (polls.get(id) ?? 0) + 1
          polls.set(id, count)
          const summary = controls.poll(current, count)
          matches.set(id, summary)
          result = { summary }
        } else if (method === 'POST' && path === '/v1/matches/pvp') {
          assert.equal(role, 'initiator')
          assert.deepEqual(body, { versionID: 21, opponentAgentID: 112 })
          assert.ok(
            ![...matches.values()].some((row) =>
              row.initiatorIsMe && !row.finished
            ),
            'a new duel must await every initiated unfinished match',
          )
          const pending = snapshots.at(-1)?.attempts.at(-1)
          assert.equal(pending?.state, 'request-pending')
          const id = nextID++
          matches.set(id, match(id))
          configs.initiator.usage.battlesToday++
          configs.initiator.usage.pvpBattlesToday++
          result = controls.dispatch(id)
        } else if (method === 'POST' && path === '/v1/challenges') {
          assert.equal(role, 'initiator')
          const payload = body as {
            scenarioID: string
            mine: { a: { versionID: number }; b: { versionID: number } }
            opponent: { pinnedVersionID?: number; accountID?: string }
          }
          assert.equal(payload.scenarioID, 'shangyang-court')
          assert.deepEqual(payload.mine, {
            a: { versionID: 21 },
            b: { versionID: 22 },
          })
          assert.ok(
            payload.opponent.accountID === 'rival-account' ||
              [121, 122].includes(payload.opponent.pinnedVersionID ?? -1),
          )
          assert.equal(snapshots.at(-1)?.probe?.state, 'request-pending')
          result = controls.probe()
        } else {
          assert.fail(`unexpected offline API call ${role} ${method} ${path}`)
        }
        return Promise.resolve(structuredClone(result) as T)
      },
    }
  }

  const operations: QuotaOperations = {
    now: () => clock,
    sleep(milliseconds) {
      clock += milliseconds
      controls.afterSleep()
      return Promise.resolve()
    },
    login(credentials) {
      if (credentials.email === input.initiator.email) {
        return Promise.resolve(api('initiator'))
      }
      assert.equal(credentials.email, input.rival.email)
      return Promise.resolve(api('rival'))
    },
    checkpoint(manifest) {
      snapshots.push(structuredClone(manifest))
      controls.afterCheckpoint(manifest)
      return Promise.resolve()
    },
  }
  return {
    input,
    configs,
    inventories,
    identities,
    matches,
    rivalMatches,
    polls,
    controls,
    calls,
    snapshots,
    operations,
    setTime(value: string) {
      clock = Date.parse(value)
    },
    run: () => prepareA5Quota(input, operations),
    posts: () => calls.filter((call) => call.method === 'POST'),
  }
}

async function fails(harness: ReturnType<typeof fixture>, code?: string) {
  await assert.rejects(harness.run, (error: unknown) => {
    assert.ok(error instanceof QuotaPreparationError)
    if (code) assert.equal(error.code, code)
    return true
  })
  const last = harness.snapshots.at(-1)
  assert.ok(last)
  assert.notEqual(last.state, 'ready')
  assert.equal(last.verifiedAt, undefined)
  return last
}

Deno.test('A5 quota request accepts only fixture roles, trusted origins, and bounded work', () => {
  validateQuotaRequest(request())
  const invalid = [
    { baseURL: 'https://unrelated.example' },
    { scenarioID: '../not-a-scenario' },
    { initiator: { ...request().initiator, email: 'human@axiia.test' } },
    { rival: { ...request().rival, email: request().initiator.email } },
    { maxMatches: -1 },
    { maxMatches: 11 },
    { maxMatches: 0.5 },
    { matchTimeoutSeconds: 0 },
    { matchTimeoutSeconds: 1801 },
  ]
  for (const patch of invalid) {
    assert.throws(() => validateQuotaRequest({ ...request(), ...patch }))
  }
})

Deno.test('A5 refuses wrong authenticated identities, admins, and shared account IDs', async (t) => {
  for (const mutation of ['admin', 'role', 'email', 'same-id'] as const) {
    await t.step(mutation, async () => {
      const h = fixture()
      if (mutation === 'admin') h.identities.initiator.isAdmin = true
      if (mutation === 'role') {
        h.identities.rival.displayName = 'unrelated account'
      }
      if (mutation === 'email') {
        h.identities.rival.email = 'elsewhere@axiia.test'
      }
      if (mutation === 'same-id') {
        h.identities.rival.id = h.identities.initiator.id
      }
      await fails(h)
      assert.equal(h.posts().length, 0)
    })
  }
})

Deno.test('A5 refuses unsafe budgets and incomplete live gate or entry state before writes', async (t) => {
  for (
    const mutation of [
      'bound',
      'headroom',
      'concurrency',
      'blocked',
      'missing-scenario',
      'not-ready',
      'locked-side',
      'missing-entry',
    ] as const
  ) {
    await t.step(mutation, async () => {
      const h = fixture()
      const side = h.inventories.rival.scenarios[0]
      if (mutation === 'bound') h.input.maxMatches = 4
      if (mutation === 'headroom') h.configs.initiator.usage.battlesToday = 4
      if (mutation === 'concurrency') h.configs.initiator.concurrencyLimit = 1
      if (mutation === 'blocked') h.configs.initiator.trialsBlocked = true
      if (mutation === 'missing-scenario') h.inventories.rival.scenarios = []
      if (mutation === 'not-ready') side.entryReady = false
      if (mutation === 'locked-side') side.gateProgress.b.beaten = 1
      if (mutation === 'missing-entry') side.sides.b = []
      await fails(h)
      assert.equal(h.posts().length, 0)
    })
  }
})

Deno.test('A5 consumes the authoritative deficit sequentially using entry versions and verifies paired rejection', async () => {
  const h = fixture()
  h.configs.initiator.usage = { battlesToday: 4, pvpBattlesToday: 2 }
  h.input.maxMatches = 3
  const ready = await h.run()
  assert.equal(ready.state, 'ready')
  assert.equal(ready.plannedMatches, 3)
  assert.deepEqual(ready.latest?.usage, { battlesToday: 7, pvpBattlesToday: 5 })
  assert.deepEqual(ready.rivalUsageAfter, ready.rivalUsageBefore)
  assert.deepEqual(ready.attempts.map((attempt) => attempt.state), [
    'terminal',
    'terminal',
    'terminal',
  ])
  assert.deepEqual([...h.polls.values()], [2, 2, 2])
  assert.deepEqual(h.posts().map((call) => call.path), [
    '/v1/matches/pvp',
    '/v1/matches/pvp',
    '/v1/matches/pvp',
    '/v1/challenges',
  ])
  assert.equal(ready.probe?.state, 'rejected')
  const probeCall = h.calls.findIndex((call) => call.path === '/v1/challenges')
  assert.ok(
    h.calls.slice(0, probeCall).some((call) => call.path === '/v1/matches'),
  )
  assert.ok(
    h.calls.slice(probeCall + 1).some((call) => call.path === '/v1/matches'),
  )
})

Deno.test('A5 already-exhausted fixture needs no duel but a zero limit blocks the rival positive journey', async (t) => {
  for (const limit of [0, 5]) {
    await t.step(String(limit), async () => {
      const h = fixture()
      h.configs.initiator.pvpDailyLimit = limit
      h.configs.rival.pvpDailyLimit = limit
      h.configs.initiator.usage = {
        battlesToday: limit,
        pvpBattlesToday: limit,
      }
      h.configs.rival.usage = { battlesToday: 0, pvpBattlesToday: 0 }
      h.input.maxMatches = 0
      if (limit === 0) {
        await fails(h, 'rival-positive-challenge-headroom-required')
        assert.equal(h.posts().length, 0)
        return
      }
      const ready = await h.run()
      assert.equal(ready.state, 'ready')
      assert.equal(ready.plannedMatches, 0)
      assert.deepEqual(h.posts().map((call) => call.path), ['/v1/challenges'])
    })
  }
})

Deno.test('A5 rerun waits old initiated matches in other scenarios and ignores opponents’ pending matches', async () => {
  const h = fixture()
  h.configs.initiator.usage = { battlesToday: 4, pvpBattlesToday: 4 }
  h.matches.set(70, match(70, { scenarioID: 'another-scenario', kind: 'pve' }))
  h.matches.set(71, match(71, { initiatorIsMe: false }))
  const ready = await h.run()
  assert.deepEqual(ready.resumedMatchIDs, [70])
  assert.equal(h.polls.get(70), 2)
  assert.equal(h.polls.has(71), false)
  assert.equal(ready.plannedMatches, 1)
  assert.equal(
    h.posts().filter((call) => call.path === '/v1/matches/pvp').length,
    1,
  )
})

Deno.test('A5 receiver capacity counts distinct current-day received pairs without counting direct duels', async (t) => {
  const today = Date.parse('2026-09-12T08:00:00Z') / 1000
  function received(id: number, challengeID: number): MatchSummary {
    return match(id, {
      challengeID,
      createdAt: today,
      initiatorIsMe: false,
      finished: true,
      scored: true,
      participants: { a: { isMine: true }, b: { isMine: false } },
    })
  }
  await t.step(
    'both legs count once, historical and unrelated public pairs do not count',
    async () => {
      const h = fixture()
      h.rivalMatches.push(
        received(80, 80),
        received(81, 80),
        received(82, 82),
        received(83, 82),
        { ...received(84, 84), createdAt: today - 86_400 },
        {
          ...received(85, 85),
          participants: { a: { isMine: false }, b: { isMine: false } },
        },
      )
      const ready = await h.run()
      assert.equal(ready.state, 'ready')
      assert.equal(ready.attempts.length, 5)
    },
  )
  for (const role of ['initiator', 'rival'] as const) {
    await t.step(`${role} received cap reached`, async () => {
      const h = fixture()
      for (const id of [80, 82, 84]) {
        if (role === 'initiator') h.matches.set(id, received(id, id))
        else h.rivalMatches.push(received(id, id))
      }
      await fails(h, 'receiver-challenge-cap-reached')
      assert.equal(h.posts().length, 0)
    })
  }
})

Deno.test('A5 keeps the rival able to initiate its positive paired challenge', async (t) => {
  for (const blocker of ['daily', 'pvp', 'pending'] as const) {
    await t.step(blocker, async () => {
      const h = fixture()
      if (blocker === 'daily') h.configs.rival.usage.battlesToday = 9
      if (blocker === 'pvp') {
        h.configs.rival.usage = { battlesToday: 4, pvpBattlesToday: 4 }
      }
      if (blocker === 'pending') h.rivalMatches.push(match(91))
      await fails(h)
      assert.equal(h.posts().length, 0)
    })
  }
})

Deno.test('A5 timeout preserves accepted match ID and does not dispatch another match', async () => {
  const h = fixture()
  h.input.matchTimeoutSeconds = 2
  h.controls.poll = (current) => current
  const partial = await fails(h, 'match-poll-timeout')
  assert.deepEqual(partial.attempts, [{ state: 'accepted', matchID: 1001 }])
  assert.equal(h.posts().length, 1)
  assert.deepEqual(h.configs.initiator.usage, {
    battlesToday: 1,
    pvpBattlesToday: 1,
  })
})

Deno.test('A5 failed terminal duel retains quota and permits a rerun to consume only the remainder', async () => {
  const h = fixture()
  h.configs.initiator.usage = { battlesToday: 3, pvpBattlesToday: 3 }
  h.controls.poll = (current) => ({ ...current, finished: true, scored: false })
  const partial = await fails(h, 'match-failed-inspect-before-resuming')
  assert.deepEqual(partial.attempts, [{
    state: 'terminal',
    matchID: 1001,
    scored: false,
  }])
  assert.deepEqual(partial.latest?.usage, {
    battlesToday: 4,
    pvpBattlesToday: 4,
  })
  h.controls.poll = (current) => ({ ...current, finished: true, scored: true })
  const ready = await h.run()
  assert.equal(ready.plannedMatches, 1)
  assert.equal(ready.attempts.length, 1)
  assert.equal(ready.attempts[0].matchID, 1002)
})

Deno.test('A5 ambiguous POST is never retried and a fresh run discovers its accepted match', async () => {
  const h = fixture()
  h.configs.initiator.usage = { battlesToday: 3, pvpBattlesToday: 3 }
  h.controls.dispatch = () => {
    throw new TypeError('network connection lost')
  }
  const partial = await fails(h, 'dispatch-outcome-uncertain-do-not-retry')
  assert.deepEqual(partial.attempts, [{ state: 'uncertain' }])
  assert.equal(h.posts().length, 1)
  assert.equal(h.matches.has(1001), true)
  h.controls.dispatch = (id) => ({ matchID: id })
  const ready = await h.run()
  assert.deepEqual(ready.resumedMatchIDs, [1001])
  assert.equal(ready.plannedMatches, 1)
  assert.equal(ready.attempts[0].matchID, 1002)
})

Deno.test('A5 UTC+8 reset, usage drift, and changed limits stop further writes', async (t) => {
  assert.equal(
    quotaExpiry(Date.parse('2026-09-12T15:59:59Z')),
    Date.parse('2026-09-12T16:00:00Z'),
  )
  assert.equal(
    quotaExpiry(Date.parse('2026-09-12T16:00:00Z')),
    Date.parse('2026-09-13T16:00:00Z'),
  )
  for (const mutation of ['reset', 'usage', 'limits', 'entry'] as const) {
    await t.step(mutation, async () => {
      const h = fixture()
      if (mutation === 'reset') {
        h.controls.afterSleep = () => h.setTime('2026-09-12T16:00:00Z')
      } else {
        let changed = false
        h.controls.afterCheckpoint = (manifest) => {
          if (changed || manifest.state !== 'running') return
          changed = true
          if (mutation === 'usage') h.configs.initiator.usage.battlesToday++
          if (mutation === 'limits') h.configs.initiator.pvpDailyLimit++
          if (mutation === 'entry') {
            h.inventories.initiator.scenarios[0].sides.a[0].entryVersionID++
          }
        }
      }
      const partial = await fails(h)
      assert.equal(partial.state, mutation === 'reset' ? 'expired' : 'partial')
      assert.equal(h.posts().length, mutation === 'reset' ? 1 : 0)
    })
  }
})

Deno.test('A5 paired probe distinguishes the exact PVP refusal from competing blockers and transport loss', async (t) => {
  for (
    const [status, reason] of [
      [429, 'opponent_challenge_limit'],
      [429, 'daily_limit'],
      [429, 'concurrency_limit'],
      [403, 'pvp_daily_limit'],
      [403, 'gate_locked'],
    ] as const
  ) {
    await t.step(`${status} ${reason}`, async () => {
      const h = fixture()
      h.configs.initiator.usage = { battlesToday: 5, pvpBattlesToday: 5 }
      h.controls.probe = () => {
        throw new QuotaHTTPError(status, reason)
      }
      await fails(h)
      assert.equal(h.posts().length, 1)
      assert.ok(h.snapshots.every((row) => row.state !== 'ready'))
    })
  }
  await t.step('ambiguous paired POST', async () => {
    const h = fixture()
    h.configs.initiator.usage = { battlesToday: 5, pvpBattlesToday: 5 }
    h.controls.probe = () => {
      throw new TypeError('network connection lost')
    }
    const partial = await fails(h)
    assert.equal(partial.probe?.state, 'uncertain')
    assert.equal(h.posts().length, 1)
  })
})

Deno.test('A5 unexpected accepted paired probe preserves both match IDs without retrying', async () => {
  const h = fixture()
  h.configs.initiator.usage = { battlesToday: 5, pvpBattlesToday: 5 }
  h.controls.probe = () => ({ challengeID: 2001, matchIDs: [2001, 2002] })
  const partial = await fails(h)
  assert.equal(partial.probe?.state, 'accepted')
  assert.equal(partial.probe?.challengeID, 2001)
  assert.deepEqual(partial.probe?.matchIDs, [2001, 2002])
  assert.equal(h.posts().length, 1)
})

Deno.test('A5 a refused probe cannot establish readiness if new initiated matches appeared', async () => {
  const h = fixture()
  h.configs.initiator.usage = { battlesToday: 5, pvpBattlesToday: 5 }
  h.controls.probe = () => {
    h.matches.set(3001, match(3001))
    throw new QuotaHTTPError(429, 'pvp_daily_limit')
  }
  await fails(h)
  assert.equal(h.posts().length, 1)
})

Deno.test('A5 transient checkpoint failure retains accepted IDs in a partial snapshot', async () => {
  const h = fixture()
  let failed = false
  h.controls.afterCheckpoint = (manifest) => {
    if (!failed && manifest.attempts.at(-1)?.state === 'accepted') {
      failed = true
      throw new Error('offline simulated disk failure')
    }
  }
  const partial = await fails(h)
  assert.equal(partial.attempts[0].matchID, 1001)
  assert.equal(partial.attempts[0].state, 'accepted')
  assert.equal(h.posts().length, 1)
  assert.doesNotMatch(
    JSON.stringify(partial),
    /offline-initiator-password|offline-rival-password|@axiia\.test/,
  )
})
