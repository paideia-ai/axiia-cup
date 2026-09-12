import assert from 'node:assert/strict'
import {
  A6_QUOTA_ALIAS,
  type A6QuotaCheckpoint,
  type A6QuotaOperations,
  type A6QuotaRequest,
  prepareA6Quota,
  validateA6QuotaRequest,
} from './a6-quota-preparation.ts'
import { type QuotaAPI, QuotaHTTPError } from './a5-quota-preparation.ts'

type Call = { role: string; method: string; path: string; body?: unknown }
function fixture() {
  const input: A6QuotaRequest = {
    baseURL: 'http://127.0.0.1:3001',
    scenarioID: 'quota-fixture',
    modelID: 'fixture-model',
    maxMatches: 3,
    matchTimeoutSeconds: 6,
  }
  let clock = Date.parse('2026-09-12T08:00:00Z')
  const calls: Call[] = []
  const snapshots: A6QuotaCheckpoint[] = []
  const config = {
    dailyBattleLimit: 3,
    pvpDailyLimit: 2,
    concurrencyLimit: 1,
    trialsBlocked: false,
    models: [{ id: input.modelID }],
    usage: { battlesToday: 0, pvpBattlesToday: 0 },
  }
  const actor = {
    id: 'fresh-account',
    email: '',
    displayName: A6_QUOTA_ALIAS,
    isAdmin: false,
  }
  const agents: Array<
    { agentID: number; side: string; entryVersionID?: number }
  > = []
  const versions: Array<
    {
      id: number
      agentID: number
      ordinal: number
      isEntry: boolean
      modelID: string
    }
  > = []
  const matches = new Map<number, {
    id: number
    kind: string
    scenarioID: string
    initiatorIsMe: boolean
    finished: boolean
    scored: boolean
    participants: {
      a: { isMine: boolean; versionID: number }
      b: { isMine: boolean; versionID: number }
    }
  }>()
  const controls = {
    beforeCall: (_call: Call) => {},
    afterCheckpoint: (_checkpoint: A6QuotaCheckpoint) => {},
    finish: true,
    dispatch: (id: number): unknown => ({ matchID: id }),
    probe: (): unknown => {
      throw new QuotaHTTPError(429, 'daily_limit')
    },
  }
  function api(role: string): QuotaAPI {
    return {
      call<T>(method: string, path: string, body?: unknown): Promise<T> {
        const call = { role, method, path, body: structuredClone(body) }
        calls.push(call)
        controls.beforeCall(call)
        let result: unknown
        if (path === '/v1/config') result = config
        else if (path === '/v1/scenarios/quota-fixture') {
          result = {
            summary: { id: input.scenarioID },
            presets: [{ key: 'npc-b', side: 'b' }],
          }
        } else if (
          method === 'POST' && path === '/v1/admin/registration-codes'
        ) {
          assert.equal(role, 'admin')
          assert.equal(
            snapshots.at(-1)?.bundle.pendingOperation?.action,
            'registration-code',
          )
          result = {}
        } else if (method === 'POST' && path === '/v1/auth/signup') {
          const signup = body as { email: string; displayName: string }
          actor.email = signup.email
          assert.equal(signup.displayName, A6_QUOTA_ALIAS)
          result = { account: actor }
        } else if (method === 'POST' && path === '/v1/auth/login') {
          assert.equal((body as { email: string }).email, actor.email)
          result = { account: actor }
        } else if (path === '/v1/auth/me') result = { account: actor }
        else if (method === 'POST' && path === '/v1/agents') {
          const agent = {
            agentID: 233 + agents.length,
            side: (body as { side: string }).side,
          }
          agents.push(agent)
          result = agent
        } else if (method === 'POST' && /\/agents\/\d+\/save$/.test(path)) {
          const agentID = Number(path.split('/')[3])
          const agent = agents.find((a) => a.agentID === agentID)!
          assert.equal(
            snapshots.at(-1)?.bundle.pendingOperation?.agentID,
            agentID,
          )
          assert.ok(
            snapshots.at(-1)?.bundle.agents.some((a) => a.agentID === agentID),
          )
          const version = {
            id: 333 + versions.length,
            agentID,
            ordinal: 1,
            isEntry: true,
            modelID: input.modelID,
          }
          versions.push(version)
          agent.entryVersionID = version.id
          result = version
        } else if (path === '/v1/my/agents') {
          result = {
            scenarios: [{
              scenarioID: input.scenarioID,
              sides: {
                a: agents.filter((a) => a.side === 'a'),
                b: agents.filter((a) => a.side === 'b'),
              },
            }],
          }
        } else if (/\/agents\/\d+\/versions$/.test(path)) {
          const id = Number(path.split('/')[3])
          result = {
            versions: versions.filter((v) => v.agentID === id),
            entryVersionID: agents.find((a) => a.agentID === id)
              ?.entryVersionID,
          }
        } else if (/\/versions\/\d+\/ref$/.test(path)) {
          const id = Number(path.split('/')[3])
          const version = versions.find((v) => v.id === id)!
          result = {
            versionID: id,
            agentID: version.agentID,
            ownerAccountID: actor.id,
            side: agents.find((a) => a.agentID === version.agentID)!.side,
            scenarioID: input.scenarioID,
            modelID: input.modelID,
          }
        } else if (path === '/v1/matches') {
          result = {
            matches: [...matches.values()],
          }
        } else if (method === 'POST' && path === '/v1/matches/pvp') {
          assert.equal(role, 'player')
          assert.deepEqual(body, { versionID: 333, opponentAgentID: 234 })
          assert.equal(
            snapshots.at(-1)?.manifest.attempts.at(-1)?.state,
            'request-pending',
          )
          assert.ok(
            [...matches.values()].every((m) => m.finished),
            'sequential matches only',
          )
          const id = 500 + matches.size
          matches.set(id, {
            id,
            scenarioID: input.scenarioID,
            kind: 'pvp',
            initiatorIsMe: true,
            finished: false,
            scored: false,
            participants: {
              a: { isMine: true, versionID: 333 },
              b: { isMine: true, versionID: 334 },
            },
          })
          config.usage.battlesToday++
          result = controls.dispatch(id)
        } else if (method === 'POST' && path === '/v1/matches/pve') {
          assert.deepEqual(body, { versionID: 333, presetKey: 'npc-b' })
          assert.equal(
            snapshots.at(-1)?.manifest.probe?.state,
            'request-pending',
          )
          result = controls.probe()
        } else if (/\/matches\/\d+$/.test(path)) {
          const current = matches.get(Number(path.split('/')[3]))!
          if (controls.finish) {
            current.finished = true
            current.scored = true
          }
          result = { summary: current }
        } else assert.fail(`unexpected offline API call ${method} ${path}`)
        return Promise.resolve(structuredClone(result) as T)
      },
    }
  }
  const operations: A6QuotaOperations = {
    now: () => clock,
    randomBytes: (size) => new Uint8Array(size).fill(7),
    sleep(ms) {
      clock += ms
      return Promise.resolve()
    },
    openAdmin() {
      return Promise.resolve(api('admin'))
    },
    openPlayer: () => api('player'),
    checkpoint(value) {
      snapshots.push(structuredClone(value))
      controls.afterCheckpoint(value)
      return Promise.resolve()
    },
  }
  return {
    input,
    config,
    actor,
    agents,
    versions,
    matches,
    calls,
    snapshots,
    controls,
    run: (previous?: A6QuotaCheckpoint) =>
      prepareA6Quota(input, operations, previous),
    posts: (path?: string) =>
      calls.filter((c) => c.method === 'POST' && (!path || c.path === path)),
    setTime: (at: string) => {
      clock = Date.parse(at)
    },
  }
}

Deno.test('A6 quota provisions only its fresh dedicated actor and two real v1 entries, then fills total only', async () => {
  const h = fixture()
  const ready = await h.run()
  assert.equal(ready.state, 'ready')
  assert.equal(ready.maxMatches, 3)
  assert.match(ready.provenance.sourceSha256, /^[0-9a-f]{64}$/)
  assert.deepEqual(ready.latest?.usage, { battlesToday: 3, pvpBattlesToday: 0 })
  assert.deepEqual(ready.testModeFixtures, {
    a6DailyExhaustedAgentId: '233',
    a6DailyExhaustedOpponentVersionId: '334',
  })
  assert.equal(
    ready.verification?.expectedCopy,
    '今日次数已用完（3/3），明天再来',
  )
  assert.deepEqual(ready.verification?.unchangedMatchIDs, [500, 501, 502])
  assert.deepEqual(h.posts().map((c) => c.path), [
    '/v1/admin/registration-codes',
    '/v1/auth/signup',
    '/v1/agents',
    '/v1/agents/233/save',
    '/v1/agents',
    '/v1/agents/234/save',
    '/v1/matches/pvp',
    '/v1/matches/pvp',
    '/v1/matches/pvp',
    '/v1/matches/pve',
  ])
  assert.equal(h.snapshots.at(-1)?.bundle.agents.length, 2)
})

Deno.test('A6 quota rejects unsafe origin and budget before provisioning', async () => {
  for (
    const patch of [
      { baseURL: 'https://unreviewed.invalid' },
      { maxMatches: -1 },
      { maxMatches: 21 },
      { modelID: '' },
      { matchTimeoutSeconds: 0 },
    ]
  ) {
    assert.throws(() =>
      validateA6QuotaRequest({ ...fixture().input, ...patch })
    )
  }
  const h = fixture()
  h.input.maxMatches = 2
  await assert.rejects(h.run(), /daily-deficit-exceeds-match-bound/)
  assert.equal(h.posts().length, 0)
})

Deno.test('A6 accepted match timeout resumes the same ID without provisioning or duplicate dispatch', async () => {
  const h = fixture()
  h.controls.finish = false
  await assert.rejects(h.run(), /match-poll-timeout/)
  const partial = h.snapshots.at(-1)!
  assert.deepEqual(partial.manifest.attempts, [{
    state: 'accepted',
    matchID: 500,
  }])
  assert.equal(h.posts('/v1/matches/pvp').length, 1)
  const callIndex = h.calls.length
  h.controls.finish = true
  const ready = await h.run(partial)
  assert.equal(ready.state, 'ready')
  assert.deepEqual(ready.attempts.map((a) => a.matchID), [500, 501, 502])
  assert.equal(h.posts('/v1/matches/pvp').length, 3)
  assert.equal(h.posts('/v1/auth/signup').length, 1)
  const resumed = h.calls.slice(callIndex)
  assert.ok(
    resumed.findIndex((c) => c.path === '/v1/matches/500') <
      resumed.findIndex((c) =>
        c.method === 'POST' && c.path === '/v1/matches/pvp'
      ),
  )
})

Deno.test('A6 ready resume revalidates with no stale ready fields; expiry, budget and quota drift fail closed', async (t) => {
  for (
    const mutation of ['none', 'expiry', 'budget', 'usage', 'limit'] as const
  ) {
    await t.step(mutation, async () => {
      const h = fixture()
      await h.run()
      const prior = h.snapshots.at(-1)!
      const start = h.snapshots.length
      const postCount = h.posts('/v1/matches/pvp').length
      if (mutation === 'expiry') h.setTime('2026-09-12T16:00:00Z')
      if (mutation === 'budget') h.input.maxMatches = 4
      if (mutation === 'usage') h.config.usage.pvpBattlesToday = 1
      if (mutation === 'limit') h.config.pvpDailyLimit++
      if (mutation === 'none') await h.run(prior)
      else await assert.rejects(h.run(prior))
      const emitted = h.snapshots.slice(start)
      for (
        const { manifest } of emitted.filter((s) =>
          s.manifest.state !== 'ready'
        )
      ) {
        assert.equal(manifest.testModeFixtures, undefined)
        assert.equal(manifest.verification, undefined)
        assert.equal(manifest.verifiedAt, undefined)
      }
      assert.notEqual(emitted[0].manifest.state, 'ready')
      assert.equal(h.posts('/v1/matches/pvp').length, postCount)
      assert.equal(h.posts('/v1/auth/signup').length, 1)
    })
  }
})

Deno.test('A6 uncertain dispatch and incomplete provisioning retain inspectable private state and cannot resume', async (t) => {
  for (const mutation of ['dispatch', 'save'] as const) {
    await t.step(mutation, async () => {
      const h = fixture()
      if (mutation === 'dispatch') {
        h.controls.dispatch = () => {
          throw new TypeError('transport lost')
        }
      } else {h.controls.beforeCall = (c) => {
          if (c.path === '/v1/agents/233/save') {
            throw new TypeError('transport lost')
          }
        }}
      await assert.rejects(h.run())
      const partial = h.snapshots.at(-1)!
      if (mutation === 'dispatch') {
        assert.deepEqual(partial.manifest.attempts, [{ state: 'uncertain' }])
      } else {
        assert.deepEqual(partial.bundle.agents, [{ side: 'a', agentID: 233 }])
        assert.deepEqual(partial.bundle.pendingOperation, {
          action: 'save-a',
          agentID: 233,
        })
      }
      const count = h.posts().length
      await assert.rejects(h.run(partial), /uncertain-mutation/)
      assert.equal(h.posts().length, count)
    })
  }
})

Deno.test('A6 refuses changed identity, saved entry metadata and foreign activity before another dispatch', async (t) => {
  for (
    const mutation of [
      'identity',
      'ordinal',
      'model',
      'entry',
      'foreign-match',
    ] as const
  ) {
    await t.step(mutation, async () => {
      const h = fixture()
      let changed = false
      h.controls.afterCheckpoint = ({ manifest }) => {
        if (changed || manifest.state !== 'running') return
        changed = true
        if (mutation === 'identity') h.actor.isAdmin = true
        if (mutation === 'ordinal') h.versions[0].ordinal = 2
        if (mutation === 'model') h.versions[0].modelID = 'unexpected'
        if (mutation === 'entry') h.versions[0].isEntry = false
        if (mutation === 'foreign-match') {
          h.matches.set(999, {
            id: 999,
            scenarioID: h.input.scenarioID,
            kind: 'pvp',
            initiatorIsMe: true,
            finished: true,
            scored: true,
            participants: {
              a: { isMine: true, versionID: 333 },
              b: { isMine: true, versionID: 334 },
            },
          })
        }
      }
      await assert.rejects(h.run())
      assert.equal(h.posts('/v1/matches/pvp').length, 0)
    })
  }
})

Deno.test('A6 exact ordinary PVE quota rejection cannot be replaced by another blocker, transport failure or enqueue', async (t) => {
  for (
    const mutation of [
      'gate',
      'wrong-status',
      'accepted',
      'transport',
      'enqueue',
      'counter',
    ] as const
  ) {
    await t.step(mutation, async () => {
      const h = fixture()
      h.controls.probe = () => {
        if (mutation === 'accepted') return { matchID: 999 }
        if (mutation === 'transport') throw new TypeError('interrupted')
        if (mutation === 'enqueue') {
          h.matches.set(999, { ...h.matches.get(500)!, id: 999 })
        }
        if (mutation === 'counter') {
          h.config.usage.pvpBattlesToday++
        }
        throw new QuotaHTTPError(
          mutation === 'wrong-status' ? 403 : 429,
          mutation === 'gate' ? 'gate_locked' : 'daily_limit',
        )
      }
      await assert.rejects(h.run())
      const partial = h.snapshots.at(-1)!.manifest
      assert.equal(partial.state, 'partial')
      assert.equal(partial.testModeFixtures, undefined)
      assert.equal(h.posts('/v1/matches/pve').length, 1)
    })
  }
})
