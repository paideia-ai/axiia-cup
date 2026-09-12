import {
  type EntryAPI,
  type EntryBundle,
  type EntryManifest,
  EntryPreparationError,
  entryRoles,
  prepareA6Entry,
} from './a6-entry-preparation.ts'
import reviewedSource from '../src/testmode/data/vivian-a3-a4-a6.json' with {
  type: 'json',
}

function assert(value: unknown, message = 'assertion failed'): asserts value {
  if (!value) throw new Error(message)
}
function equal(actual: unknown, expected: unknown) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `unexpected value: ${JSON.stringify(actual)}`,
  )
}

interface FakeVersion {
  id: number
  agentID: number
  ordinal: number
  isEntry: boolean
  modelID: string
  matchCount: number
  winCount: number
}
interface FakeAgent {
  agentID: number
  side: 'a' | 'b'
  versions: FakeVersion[]
}
interface FakePlayer {
  id: string
  email: string
  displayName: string
  isAdmin: false
  agents: FakeAgent[]
}

class FixtureServer {
  players: FakePlayer[] = []
  calls: Array<
    {
      owner?: string
      method: string
      path: string
      body: Record<string, unknown>
    }
  > = []
  snapshots: Array<{ bundle: EntryBundle; manifest: EntryManifest }> = []
  fault = ''
  checkpointFailure: 'ready' | 'partial' | undefined
  nextID = 200
  entropy = 0
  adminOpens = 0
  private modelReads = 0

  session(admin = false): EntryAPI {
    let player: FakePlayer | undefined
    return {
      call: <T>(method: string, path: string, payload?: unknown) => {
        const body = (payload ?? {}) as Record<string, unknown>
        this.calls.push({ owner: player?.id, method, path, body })
        const response = (value: unknown) =>
          Promise.resolve(structuredClone(value) as T)
        if (path === '/v1/auth/signup') {
          const created: FakePlayer = {
            id: `player-${this.players.length + 1}`,
            email: String(body.email),
            displayName: String(body.displayName),
            isAdmin: false,
            agents: [],
          }
          player = created
          this.players.push(created)
          return response({ account: created })
        }
        if (path === '/v1/admin/registration-codes') {
          assert(admin && body.uses === 2)
          return response({ ok: true })
        }
        if (path === '/v1/config') {
          return response({
            models: [{ id: 'offline-model' }],
            pvpUnlockPerSideWins: 7,
            dailyBattleLimit: 1,
            pvpDailyLimit: 0,
            concurrencyLimit: 1,
            trialsBlocked: true,
            usage: {
              battlesToday: this.fault === 'used-quota' && player ? 1 : 0,
              pvpBattlesToday: 0,
            },
          })
        }
        if (path === '/v1/models') {
          this.modelReads++
          return response({
            models: this.fault === 'no-models' ? [] : [{
              id: this.fault === 'changed-models' && this.modelReads > 1
                ? 'changed'
                : 'offline-model',
            }],
          })
        }
        if (path === '/v1/scenarios') {
          return response({
            scenarios: this.fault === 'not-live' ? [] : [{ id: 'entry-test' }],
          })
        }
        if (path === '/v1/scenarios/entry-test') {
          return response({
            summary: { id: 'entry-test' },
          })
        }
        assert(player, 'a player API was called before signup')
        if (path === '/v1/auth/me') {
          return response({
            account: {
              ...player,
              id: this.fault === 'wrong-owner' ? 'unexpected' : player.id,
              displayName: this.fault === 'wrong-alias'
                ? 'Unrecognized role'
                : player.displayName,
            },
          })
        }
        if (method === 'POST' && path === '/v1/agents') {
          const side = body.side as 'a' | 'b'
          const sameSideExists = player.agents.some((agent) =>
            agent.side === side
          )
          assert(
            !sameSideExists ||
              player.agents.some((agent) =>
                agent.side !== side && agent.versions.length > 0
              ),
            'opposite side must be saved before creating sibling',
          )
          const agent: FakeAgent = {
            agentID: ++this.nextID,
            side,
            versions: [],
          }
          player.agents.push(agent)
          return response({ agentID: agent.agentID })
        }
        const id = Number(path.split('/')[3])
        const agent = player.agents.find((agent) => agent.agentID === id)
        if (method === 'POST' && path.endsWith('/save')) {
          assert(agent)
          const isEntry = !player.agents.some((other) =>
            other.side === agent.side &&
            other.versions.some((version) => version.isEntry)
          )
          const version: FakeVersion = {
            id: ++this.nextID,
            agentID: agent.agentID,
            ordinal: agent.versions.length + 1,
            isEntry,
            modelID: String(body.modelID),
            matchCount: 0,
            winCount: 0,
          }
          agent.versions.push(version)
          if (this.fault === 'save-committed-then-timeout') {
            return Promise
              .reject(new Error('untrusted response with secret values'))
          }
          if (
            this.fault === 'second-save-steals-star' && version.ordinal === 2
          ) {
            agent.versions[0].isEntry = false
            version.isEntry = true
          }
          if (
            this.fault === 'sibling-save-steals-star' &&
            player.agents.filter((other) => other.side === agent.side)
                .length === 2
          ) {
            player.agents.forEach((other) =>
              other.versions.forEach((v) => {
                if (other.side === agent.side) v.isEntry = false
              })
            )
            version.isEntry = true
          }
          return response(version)
        }
        if (path === '/v1/my/agents') {
          const row = (agent: FakeAgent) => ({
            agentID: agent.agentID,
            versionCount: agent.versions.length,
            entryVersionID: agent.versions.find((version) => version.isEntry)
              ?.id,
            latestVersionID: agent.versions.at(-1)?.id,
          })
          const a = player.agents.filter((agent) => agent.side === 'a').map(row)
          if (this.fault === 'extra-agent') {
            a.push({
              agentID: 99999,
              versionCount: 0,
              entryVersionID: undefined,
              latestVersionID: undefined,
            })
          }
          return response({
            scenarios: [{
              scenarioID: 'entry-test',
              sides: {
                a,
                b: player.agents.filter((agent) => agent.side === 'b').map(row),
              },
              gateProgress: {
                a: { beaten: 0, needed: 7 },
                b: { beaten: 0, needed: 7 },
              },
              entryReady: player.agents.some((agent) =>
                agent.side === 'a' &&
                agent.versions.some((version) => version.isEntry)
              ) && player.agents.some((agent) =>
                agent.side === 'b' && agent.versions.some((version) =>
                  version.isEntry
                )
              ),
            }],
          })
        }
        if (path.endsWith('/versions')) {
          assert(agent)
          const versions = structuredClone(agent.versions)
          if (
            this.fault === 'read-back-star-changed' && versions.length === 2
          ) versions[1].isEntry = true
          return response({
            versions,
            entryVersionID: agent.versions.find((version) => version.isEntry)
              ?.id,
          })
        }
        if (path.endsWith('/draft')) {
          assert(agent)
          return response({
            scenarioID: 'entry-test',
            side: agent.side,
            fields: this.fault === 'dirty-first-draft'
              ? { prompt: 'already touched' }
              : {},
          })
        }
        if (path.startsWith('/v1/versions/')) {
          const owner = player.agents.find((agent) =>
            agent.versions.some((version) => version.id === id)
          )
          assert(owner)
          return response({
            versionID: id,
            agentID: owner.agentID,
            side: owner.side,
            scenarioID: 'entry-test',
            ownerAccountID: this.fault === 'wrong-version-owner'
              ? 'other'
              : player.id,
            modelID: 'offline-model',
          })
        }
        if (path === '/v1/matches') {
          return response({
            open: true,
            matches: this.fault === 'owned-match'
              ? [{ initiatorIsMe: true }]
              : [{
                initiatorIsMe: false,
                participants: { a: { isMine: false }, b: { isMine: false } },
              }],
          })
        }
        throw new Error(`unexpected API ${method} ${path}`)
      },
    }
  }

  prepare() {
    return prepareA6Entry({
      baseURL: 'http://127.0.0.1:1234',
      scenarioID: 'entry-test',
    }, {
      now: () => new Date('2026-09-12T20:00:00Z'),
      randomBytes: (size) => new Uint8Array(size).fill(++this.entropy),
      openAdmin: () => {
        this.adminOpens++
        return Promise.resolve(this.session(true))
      },
      openPlayer: () => this.session(),
      checkpoint: (bundle, manifest) => {
        if (manifest.state === this.checkpointFailure) {
          return Promise.reject(new Error('private storage unavailable'))
        }
        this.snapshots.push(structuredClone({ bundle, manifest }))
        return Promise.resolve()
      },
    })
  }
}

Deno.test('separate entry pack uses only supported metadata APIs and preserves first-save state', async () => {
  const server = new FixtureServer()
  const manifest = await server.prepare()
  equal(manifest.state, 'ready')
  equal(manifest.steps, ['HV-A6-ENTRY-QUOTA-S01', 'HV-A6-ENTRY-QUOTA-S02'])
  equal(server.players.length, 2)
  const [matrix, untouched] = server.players
  equal(
    matrix.agents.map((
      agent,
    ) => [agent.side, agent.versions.map((v) => [v.ordinal, v.isEntry])]),
    [['a', [[1, true], [2, false]]], ['b', [[1, true]]], ['a', [[1, false]]]],
  )
  equal(untouched.agents.map((agent) => [agent.side, agent.versions]), [[
    'a',
    [],
  ]])
  const mutations = server.calls.filter((call) => call.method !== 'GET')
  equal(mutations.map((call) => call.path.replace(/\/\d+(?=\/|$)/g, '/:id')), [
    '/v1/admin/registration-codes',
    '/v1/auth/signup',
    '/v1/auth/signup',
    '/v1/agents',
    '/v1/agents/:id/save',
    '/v1/agents/:id/save',
    '/v1/agents',
    '/v1/agents/:id/save',
    '/v1/agents',
    '/v1/agents/:id/save',
    '/v1/agents',
  ])
  equal(
    mutations.filter((call) => call.owner === untouched.id).map((call) =>
      call.path
    ),
    ['/v1/agents'],
  )
  equal(manifest.testModeFixtures, {
    a6EntryAgentId: String(matrix.agents[0].agentID),
    a6EntrySiblingAgentId: String(matrix.agents[2].agentID),
    a6NoEntryAgentId: String(untouched.agents[0].agentID),
  })
  assert(manifest.fixtures.every((fixture) => fixture.verified))
  assert(!JSON.stringify(manifest).includes('@axiia.test'))
})

Deno.test('replacement generation leaves every original role and version unchanged', async () => {
  const server = new FixtureServer()
  const first = await server.prepare()
  const original = structuredClone(server.players)
  const replacement = await server.prepare()
  equal(server.players.slice(0, 2), original)
  assert(first.generation.id !== replacement.generation.id)
  assert(
    first.testModeFixtures.a6EntryAgentId !==
      replacement.testModeFixtures.a6EntryAgentId,
  )
  equal(new Set(server.players.map((player) => player.email)).size, 4)
})

Deno.test('ready role aliases and session fields match the generated guide contract', async () => {
  const manifest = await new FixtureServer().prepare()
  const groups: Array<{
    roles: Array<{
      id: string
      accountAlias: string
      variables: string[]
      defaults: object
    }>
  }> = reviewedSource.fixtureProfiles
  const profiles = groups.flatMap((group) => group.roles)
  const fields = {
    a6EntryAgentId: 'a6-entry',
    a6EntrySiblingAgentId: 'a6-entry',
    a6NoEntryAgentId: 'a6-entry-first-save',
  }
  equal(
    Object.keys(manifest.testModeFixtures).sort(),
    Object.keys(fields).sort(),
  )
  for (const role of entryRoles) {
    const profile = profiles.find((profile) => profile.id === role.id)
    assert(profile, `guide role missing: ${role.id}`)
    equal(profile.accountAlias, role.accountAlias)
    equal(
      profile.variables.slice().sort(),
      Object.entries(fields).filter(([, id]) => id === role.id).map(([key]) =>
        key
      )
        .sort(),
    )
    equal(profile.defaults, {})
  }
  const variables = reviewedSource.manualVariables as Record<
    string,
    { profileId?: string; persistence?: string }
  >
  const defaults = reviewedSource.manualDefaults as Record<string, string>
  for (const [field, roleID] of Object.entries(fields)) {
    assert(variables[field], `guide field missing: ${field}`)
    equal(variables[field].profileId, roleID)
    equal(variables[field].persistence, 'session')
    equal(defaults[field] ?? '', '')
  }
})

Deno.test('state or identity drift prevents ready session fields', async (test) => {
  for (
    const fault of [
      'not-live',
      'no-models',
      'changed-models',
      'second-save-steals-star',
      'sibling-save-steals-star',
      'read-back-star-changed',
      'extra-agent',
      'dirty-first-draft',
      'wrong-owner',
      'wrong-alias',
      'wrong-version-owner',
      'used-quota',
      'owned-match',
    ]
  ) {
    await test.step(fault, async () => {
      const server = new FixtureServer()
      server.fault = fault
      let failed = false
      try {
        await server.prepare()
      } catch (error) {
        failed = error instanceof EntryPreparationError
      }
      assert(failed)
      const last = server.snapshots.at(-1)!
      equal(last.manifest.state, 'partial')
      equal(last.manifest.testModeFixtures, {})
      assert(last.manifest.fixtures.every((fixture) => !fixture.verified))
      if (fault === 'not-live' || fault === 'no-models') {
        equal(server.players.length, 0)
      }
    })
  }
})

Deno.test('ambiguous committed save is recorded once and never retried', async () => {
  const server = new FixtureServer()
  server.fault = 'save-committed-then-timeout'
  try {
    await server.prepare()
  } catch { /* inspect retained evidence */ }
  equal(server.calls.filter((call) => call.path.endsWith('/save')).length, 1)
  equal(server.players[0].agents[0].versions.length, 1)
  const last = server.snapshots.at(-1)!
  equal(last.bundle.pendingOperation, {
    action: 'save-version',
    roleID: 'a6-entry',
    agentID: server.players[0].agents[0].agentID,
  })
  equal(last.manifest.failure, 'preparation-failed-inspect-private-journal')
  assert(!JSON.stringify(last.manifest).includes('untrusted response'))
})

Deno.test('failed ready checkpoint removes success evidence and preserves the original failure if partial storage also fails', async () => {
  const finalWriteFails = new FixtureServer()
  finalWriteFails.checkpointFailure = 'ready'
  let finalError: unknown
  try {
    await finalWriteFails.prepare()
  } catch (error) {
    finalError = error
  }
  assert(finalError instanceof EntryPreparationError)
  equal(finalError.code, 'preparation-failed-inspect-private-journal')
  const partial = finalWriteFails.snapshots.at(-1)!.manifest
  equal(partial.state, 'partial')
  equal(partial.testModeFixtures, {})
  equal(partial.verification, undefined)
  assert(partial.fixtures.every((fixture) => !fixture.verified))

  const partialWriteFails = new FixtureServer()
  partialWriteFails.fault = 'wrong-alias'
  partialWriteFails.checkpointFailure = 'partial'
  let originalError: unknown
  try {
    await partialWriteFails.prepare()
  } catch (error) {
    originalError = error
  }
  assert(originalError instanceof EntryPreparationError)
  equal(originalError.code, 'player-identity-mismatch')

  const ambiguousSave = new FixtureServer()
  ambiguousSave.fault = 'save-committed-then-timeout'
  ambiguousSave.checkpointFailure = 'partial'
  try {
    await ambiguousSave.prepare()
  } catch { /* inspect the last durable record */ }
  equal(ambiguousSave.players[0].agents[0].versions.length, 1)
  equal(
    ambiguousSave.calls.filter((call) => call.path.endsWith('/save')).length,
    1,
  )
  equal(ambiguousSave.snapshots.at(-1)!.bundle.pendingOperation, {
    action: 'save-version',
    roleID: 'a6-entry',
    agentID: ambiguousSave.players[0].agents[0].agentID,
  })
})
